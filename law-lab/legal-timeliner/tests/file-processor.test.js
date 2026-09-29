'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

globalThis.AppConfig = Object.freeze({
  SUPPORTED_EXTENSIONS: Object.freeze(['docx', 'txt']),
  EXTRACTOR_VERSION: 'processor-test',
  MAX_FILES: 10,
  MAX_FILE_SIZE_BYTES: 1000,
  MAX_TOTAL_SIZE_BYTES: 5000
});
require('../js/file-store.js');
require('../js/file-processor.js');

function fake(name, size, lastModified) {
  return { name, size, lastModified };
}

test('successful extraction is reused while a failed file is retried on the next build', async () => {
  const store = globalThis.CaseFileStore.create();
  const items = store.add([
    fake('good.txt', 10, 1),
    fake('retry.txt', 10, 2)
  ]).accepted;
  const calls = new Map();

  async function extract(item) {
    calls.set(item.id, (calls.get(item.id) || 0) + 1);
    if (item.name === 'retry.txt' && calls.get(item.id) === 1) {
      throw new Error('temporary failure');
    }
    return [{ index: 1, text: item.name, kind: 'text-block', location: null }];
  }

  const first = await Promise.all(items.map(item => CaseFileProcessor.process(item, store, extract)));
  assert.equal(first[0].error, null);
  assert.match(first[1].error.message, /temporary failure/);
  assert.equal(store.list()[0].status, 'done');
  assert.equal(store.list()[1].status, 'error');

  const second = await Promise.all(items.map(item => CaseFileProcessor.process(item, store, extract)));
  assert.equal(second[0].reused, true);
  assert.equal(second[1].reused, false);
  assert.equal(second[1].error, null);
  assert.equal(calls.get(items[0].id), 1);
  assert.equal(calls.get(items[1].id), 2);
  assert.ok(store.list().every(item => item.status === 'done'));
});
