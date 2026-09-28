'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/document-extractor.js');

test('collects full body paragraphs without flattening them together', () => {
  const ast = {
    content: [
      { type: 'paragraph', text: 'פסקה ראשונה 14.6.2026', children: [] },
      { type: 'paragraph', text: 'פסקה שנייה', children: [] }
    ]
  };
  const blocks = globalThis.DocumentExtractor.collectDocxBlocks(ast);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].text, 'פסקה ראשונה 14.6.2026');
  assert.equal(blocks[1].text, 'פסקה שנייה');
});

test('extracts table-cell paragraphs with table provenance', () => {
  const ast = {
    content: [{
      type: 'table', children: [{
        type: 'row', metadata: { row: 0 }, children: [
          { type: 'cell', metadata: { row: 0, col: 0 }, children: [{ type: 'paragraph', text: '14.6.2026', children: [] }] },
          { type: 'cell', metadata: { row: 0, col: 1 }, children: [{ type: 'paragraph', text: 'תשלום', children: [] }] }
        ]
      }]
    }]
  };
  const blocks = globalThis.DocumentExtractor.collectDocxBlocks(ast);
  assert.equal(blocks.length, 2);
  assert.deepEqual(blocks[0].location, { table: 1, row: 1, cell: 1, cellParagraph: 1 });
  assert.equal(blocks[0].kind, 'table-paragraph');
});

test('TXT preserves blank-line separated paragraphs', () => {
  const blocks = globalThis.DocumentExtractor.splitTxtIntoBlocks('פסקה אחת\nשורה שנייה\n\nפסקה שתיים');
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].text, 'פסקה אחת שורה שנייה');
  assert.equal(blocks[1].text, 'פסקה שתיים');
});


test('TXT keeps single-newline wrapped text as one paragraph when there are no blank lines', () => {
  const blocks = globalThis.DocumentExtractor.splitTxtIntoBlocks('שורה ראשונה עם 14.6.2026\nשורת המשך של אותה פסקה');
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].text, 'שורה ראשונה עם 14.6.2026 שורת המשך של אותה פסקה');
});

test('scans comment content but never comment metadata dates', () => {
  const ast = {
    content: [{
      type: 'paragraph',
      text: 'פסקה ללא תאריך',
      children: [{
        type: 'text',
        text: 'פסקה ללא תאריך',
        comments: [{
          type: 'comment',
          text: 'לפי המסמך הפגישה התקיימה ביום 14.6.2026',
          metadata: { commentId: '7', author: 'עו"ד', date: '2026-09-20T10:00:00Z' },
          children: [{ type: 'paragraph', text: 'לפי המסמך הפגישה התקיימה ביום 14.6.2026', children: [] }]
        }]
      }]
    }]
  };

  const blocks = globalThis.DocumentExtractor.collectDocxBlocks(ast);
  assert.equal(blocks.length, 2);
  assert.equal(blocks[1].kind, 'comment');
  assert.equal(blocks[1].text, 'לפי המסמך הפגישה התקיימה ביום 14.6.2026');
  assert.equal(blocks[1].location.annotationType, 'comment');
  assert.equal(blocks[1].location.annotationId, '7');
  assert.equal(blocks[1].location.parentBlockIndex, 1);
  assert.equal(blocks.some(block => block.text.includes('2026-09-20')), false);
});

test('scans footnote and endnote paragraphs as separate source blocks', () => {
  const ast = {
    content: [{
      type: 'paragraph',
      text: 'טקסט גוף',
      notes: [
        {
          type: 'note',
          text: 'הערת שוליים 03.04.2025',
          metadata: { noteType: 'footnote', noteId: '2' },
          children: [{ type: 'paragraph', text: 'הערת שוליים 03.04.2025', children: [] }]
        },
        {
          type: 'note',
          text: 'הערת סיום April 17, 2026',
          metadata: { noteType: 'endnote', noteId: '3' },
          children: [{ type: 'paragraph', text: 'הערת סיום April 17, 2026', children: [] }]
        }
      ],
      children: []
    }]
  };

  const blocks = globalThis.DocumentExtractor.collectDocxBlocks(ast);
  assert.deepEqual(blocks.map(block => block.kind), ['paragraph', 'footnote', 'endnote']);
  assert.equal(blocks[1].location.annotationId, '2');
  assert.equal(blocks[2].location.annotationId, '3');
});


test('uses honest structural provenance for body and table paragraphs', () => {
  const ast = {
    content: [
      { type: 'heading', text: 'כותרת 14.6.2026', children: [] },
      { type: 'paragraph', text: 'גוף 15.6.2026', children: [] },
      { type: 'table', children: [{
        type: 'row', metadata: { row: 0 }, children: [{
          type: 'cell', metadata: { row: 0, col: 0 }, children: [
            { type: 'paragraph', text: 'תא ראשון 16.6.2026', children: [] },
            { type: 'paragraph', text: 'תא שני 17.6.2026', children: [] }
          ]
        }]
      }] }
    ]
  };
  const blocks = globalThis.DocumentExtractor.collectDocxBlocks(ast);
  assert.equal(blocks[0].location.bodyParagraph, 1);
  assert.equal(blocks[1].location.bodyParagraph, 2);
  assert.equal(blocks[2].location.cellParagraph, 1);
  assert.equal(blocks[3].location.cellParagraph, 2);
});
