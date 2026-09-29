'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/date-engine.js');
require('../js/related-documents.js');

test('links source document and other documents containing the same date', () => {
  const files = [
    { id: 'a', name: 'תצהיר.docx' },
    { id: 'b', name: 'מכתב התראה.docx' },
    { id: 'c', name: 'אחר.docx' }
  ];
  const entries = [
    { fileId: 'a', normalizedDate: '2025-06-14' },
    { fileId: 'b', normalizedDate: '2025-06-14' },
    { fileId: 'c', normalizedDate: '2025-07-01' }
  ];
  const index = globalThis.RelatedDocumentMatcher.buildIndex(files, entries);
  const related = index.forEntry(entries[0]);

  assert.deepEqual(related.map(item => item.file.id), ['a', 'b']);
  assert.equal(related[0].isSource, true);
  assert.equal(related[1].isSource, false);
});

test('filename date is enough to associate a document with the timeline date', () => {
  const files = [
    { id: 'a', name: 'תצהיר.docx' },
    { id: 'b', name: 'מכתב התראה 14.06.25.docx' },
    { id: 'c', name: 'מכתב אחר 15.06.25.docx' }
  ];
  const entry = { fileId: 'a', normalizedDate: '2025-06-14' };
  const index = globalThis.RelatedDocumentMatcher.buildIndex(files, [entry]);
  const related = index.forEntry(entry);

  assert.deepEqual(related.map(item => item.file.id), ['a', 'b']);
});

test('does not add unrelated documents or duplicate the source', () => {
  const files = [
    { id: 'a', name: '14.06.25 תצהיר.docx' },
    { id: 'b', name: 'מסמך אחר.docx' }
  ];
  const entry = { fileId: 'a', normalizedDate: '2025-06-14' };
  const index = globalThis.RelatedDocumentMatcher.buildIndex(files, [entry, entry]);
  const related = index.forEntry(entry);

  assert.deepEqual(related.map(item => item.file.id), ['a']);
});


test('filename dates with underscores associate related documents', () => {
  const files = [
    { id: 'a', name: 'תצהיר.docx' },
    { id: 'b', name: 'מכתב_התראה_14.06.2025_V1.docx' }
  ];
  const entry = { fileId: 'a', normalizedDate: '2025-06-14' };
  const index = globalThis.RelatedDocumentMatcher.buildIndex(files, [entry]);
  assert.deepEqual(index.forEntry(entry).map(item => item.file.id), ['a', 'b']);
});

test('associates a document when the same date appears in content even if it is not a timeline event', () => {
  const files = [
    {
      id: 'a',
      name: 'מקור.docx',
      blocks: [{ index: 1, text: 'ביום 14.6.2025 נשלח מכתב לספק' }]
    },
    {
      id: 'b',
      name: 'נספח.docx',
      blocks: [{ index: 1, text: 'מספר אסמכתא פנימי לתאריך 14.6.2025 ללא אירוע מסווג' }]
    },
    {
      id: 'c',
      name: 'אחר.docx',
      blocks: [{ index: 1, text: 'מסמך מיום 15.6.2025' }]
    }
  ];
  const entry = { fileId: 'a', normalizedDate: '2025-06-14' };
  const index = globalThis.RelatedDocumentMatcher.buildIndex(files, [entry]);

  assert.deepEqual(index.forEntry(entry).map(item => item.file.id), ['a', 'b']);
});
