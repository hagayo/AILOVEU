'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
globalThis.AppConfig = Object.freeze({ SUPPORTED_EXTENSIONS: Object.freeze(['docx', 'txt']), EXTRACTOR_VERSION: 'test' });
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
