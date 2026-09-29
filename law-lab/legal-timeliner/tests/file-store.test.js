'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
globalThis.AppConfig = Object.freeze({
  SUPPORTED_EXTENSIONS: Object.freeze(['docx', 'txt']),
  EXTRACTOR_VERSION: 'test',
  MAX_FILES: 5,
  MAX_FILE_SIZE_BYTES: 100,
  MAX_TOTAL_SIZE_BYTES: 250
});
require('../js/file-store.js');

function fake(name, size, lastModified) {
  return { name, size, lastModified };
}

test('accumulates files across multiple selections', () => {
  const store = globalThis.CaseFileStore.create();
  store.add([fake('one.docx', 100, 1)]);
  store.add([fake('two.txt', 20, 2)]);
  assert.equal(store.list().length, 2);
});

test('does not silently remove probable duplicate files', () => {
  const store = globalThis.CaseFileStore.create();
  store.add([fake('same.docx', 100, 1)]);
  const second = store.add([fake('same.docx', 100, 1)]).accepted[0];
  assert.equal(store.list().length, 2);
  assert.equal(second.probableDuplicate, true);
  assert.equal(store.list()[0].probableDuplicate, true);
});

test('rejects unsupported file types', () => {
  const store = globalThis.CaseFileStore.create();
  const result = store.add([fake('scan.pdf', 100, 1)]);
  assert.equal(result.accepted.length, 0);
  assert.equal(result.rejected.length, 1);
});


test('duplicate warning is recalculated after one copy is removed', () => {
  const store = globalThis.CaseFileStore.create();
  const first = store.add([fake('same.docx', 100, 1)]).accepted[0];
  const second = store.add([fake('same.docx', 100, 1)]).accepted[0];
  store.remove(first.id);
  assert.equal(store.list().length, 1);
  assert.equal(store.list()[0].id, second.id);
  assert.equal(store.list()[0].probableDuplicate, false);
});


test('accepts a file exactly at the per-file size limit and rejects one byte over it', () => {
  const store = globalThis.CaseFileStore.create();
  assert.equal(store.add([fake('limit.docx', 100, 1)]).accepted.length, 1);
  const result = store.add([fake('too-large.docx', 101, 2)]);
  assert.equal(result.accepted.length, 0);
  assert.equal(result.rejected[0].reason, 'file-too-large');
});

test('rejects a file that would push total accepted size over the configured limit', () => {
  const store = globalThis.CaseFileStore.create();
  store.add([fake('one.docx', 100, 1)]);
  store.add([fake('two.txt', 100, 2)]);
  const result = store.add([fake('three.txt', 51, 3)]);
  assert.equal(result.accepted.length, 0);
  assert.equal(result.rejected[0].reason, 'total-too-large');
  assert.equal(store.list().length, 2);
});

test('rejects additional files after the configured file-count limit', () => {
  const store = globalThis.CaseFileStore.create();
  store.add([
    fake('one.txt', 10, 1), fake('two.txt', 10, 2), fake('three.txt', 10, 3),
    fake('four.txt', 10, 4), fake('five.txt', 10, 5)
  ]);
  const result = store.add([fake('six.txt', 10, 6)]);
  assert.equal(result.accepted.length, 0);
  assert.equal(result.rejected[0].reason, 'too-many-files');
});


test('preserves an external source URL for files imported from Google Drive', () => {
  globalThis.AppConfig = {
    SUPPORTED_EXTENSIONS: ['docx', 'txt'],
    MAX_FILES: 50,
    MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024,
    MAX_TOTAL_SIZE_BYTES: 100 * 1024 * 1024,
    EXTRACTOR_VERSION: 'test'
  };
  delete require.cache[require.resolve('../js/file-store.js')];
  require('../js/file-store.js');
  const store = globalThis.CaseFileStore.create();
  const file = { name: 'drive.docx', size: 12, lastModified: 1, sourceUrl: 'https://drive.google.com/open?id=abc' };
  const result = store.add([file]);
  assert.equal(result.accepted.length, 1);
  assert.equal(store.list()[0].sourceUrl, file.sourceUrl);
});
