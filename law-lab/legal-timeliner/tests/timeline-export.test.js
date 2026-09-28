'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/timeline-export.js');

const sampleEvents = [
  {
    normalizedDate: '2026-06-18',
    category: 'תשלומים',
    paragraphText: 'ביום 18.6.2026 התקבל התשלום.',
    fileName: 'מכתב & אישור.docx',
    sourceLocation: 'פסקת גוף 3'
  },
  {
    normalizedDate: '2026-06-12',
    category: 'תקשורת ומסירה',
    paragraphText: 'ביום 12.6.2026 נשלחה הודעה.',
    fileName: 'הודעה.txt',
    sourceLocation: 'קטע 1'
  }
];

function zipFiles(bytes) {
  const files = new Map();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder();
  let offset = 0;
  while (offset + 30 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const size = view.getUint32(offset + 18, true);
    const nameStart = offset + 30;
    const contentStart = nameStart + nameLength + extraLength;
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength));
    files.set(name, decoder.decode(bytes.subarray(contentStart, contentStart + size)));
    offset = contentStart + size;
  }
  return files;
}

test('Markdown export includes sorted selected event dates, categories, text and source locations', () => {
  const markdown = TimelineExporter.markdown(sampleEvents, 'ציר זמן משפטי');
  assert.ok(markdown.indexOf('12.06.2026') < markdown.indexOf('18.06.2026'));
  assert.match(markdown, /תקשורת ומסירה/);
  assert.match(markdown, /ביום 18\.6\.2026 התקבל התשלום\./);
  assert.match(markdown, /מכתב & אישור\.docx · פסקת גוף 3/);
});

test('Word export is a DOCX ZIP with valid content types and complete RTL event details', () => {
  const bytes = TimelineExporter.docx(sampleEvents);
  assert.equal(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(0, true), 0x04034b50);
  const files = zipFiles(bytes);
  assert.ok(files.has('[Content_Types].xml'));
  assert.ok(files.has('_rels/.rels'));
  assert.ok(files.has('word/document.xml'));
  assert.match(files.get('word/document.xml'), /w:document/);
  assert.match(files.get('word/document.xml'), /תקשורת ומסירה/);
  assert.match(files.get('word/document.xml'), /מכתב &amp; אישור\.docx/);
  assert.match(files.get('word/document.xml'), /פסקת גוף 3/);
});

test('PDF print document is Hebrew RTL and safely encodes event details', () => {
  const html = TimelineExporter.printHtml(sampleEvents);
  assert.match(html, /lang="he" dir="rtl"/);
  assert.match(html, /תקשורת ומסירה/);
  assert.match(html, /מכתב &amp; אישור\.docx/);
  assert.match(html, /פסקת גוף 3/);
});
