'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/date-engine.js');
require('../js/timeline.js');

test('sorts classified events chronologically and keeps duplicates', () => {
  const files = [
    { id: 'a', name: 'a.docx', blocks: [{ index: 1, kind: 'paragraph', text: 'נשלח מכתב ביום 16.6.2026', location: null }] },
    { id: 'b', name: 'b.docx', blocks: [
      { index: 1, kind: 'paragraph', text: 'נשלח מכתב ביום 14.6.2026', location: null },
      { index: 2, kind: 'paragraph', text: 'נשלח מכתב נוסף ביום 14.6.2026', location: null }
    ] }
  ];
  const entries = globalThis.TimelineBuilder.build(files);
  assert.deepEqual(entries.map(x => x.normalizedDate), ['2026-06-14', '2026-06-14', '2026-06-16']);
  assert.equal(entries.length, 3);
});

test('one paragraph with two different dates yields two timeline entries', () => {
  const files = [{ id: 'a', name: 'a.docx', blocks: [{ index: 1, kind: 'paragraph', text: 'נשלח מכתב 14.6.2026 והתקבלה הודעה 16.6.2026', location: null }] }];
  const entries = globalThis.TimelineBuilder.build(files);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].paragraphText, entries[1].paragraphText);
});


test('groups adjacent entries by normalized date without merging occurrences', () => {
  const files = [{ id: 'a', name: 'a.txt', blocks: [
    { index: 1, kind: 'text-block', text: 'נשלח מכתב 14.6.2026', location: null },
    { index: 2, kind: 'text-block', text: 'הוגשה בקשה 14.6.2026', location: null },
    { index: 3, kind: 'text-block', text: 'מועד אחרון להגשה 15.6.2026', location: null }
  ] }];
  const groups = globalThis.TimelineBuilder.group(globalThis.TimelineBuilder.build(files));
  assert.equal(groups.length, 2);
  assert.equal(groups[0].entries.length, 2);
  assert.equal(groups[1].entries.length, 1);
});


test('preserves the exact original full filename including extension', () => {
  const originalName = 'מכתב התראה 14.06.2025 V2 FINAL.docx';
  const files = [{
    id: 'exact-name',
    name: originalName,
    blocks: [{ index: 1, kind: 'paragraph', text: 'נשלח מכתב ביום 14.06.2025', location: null }]
  }];
  const entries = globalThis.TimelineBuilder.build(files);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].fileName, originalName);
});


test('does not create timeline entries from a paragraph that contains only a date', () => {
  const files = [{ id: 'date-only', name: 'date-only.docx', blocks: [
    { index: 1, kind: 'paragraph', text: '21/8/2011', location: null },
    { index: 2, kind: 'paragraph', text: '  (17 באפריל 2026)  ', location: null },
    { index: 3, kind: 'paragraph', text: 'April 17, 2026', location: null }
  ] }];

  assert.deepEqual(globalThis.TimelineBuilder.build(files), []);
});

test('does not treat a single stray character around a date as meaningful context', () => {
  const files = [{ id: 'artifact', name: 'artifact.docx', blocks: [
    { index: 1, kind: 'paragraph', text: 'l21/8/2011', location: null }
  ] }];

  assert.deepEqual(globalThis.TimelineBuilder.build(files), []);
});

test('keeps classified decisions, deadlines and meetings from meaningful paragraphs', () => {
  const files = [{ id: 'context', name: 'context.docx', blocks: [
    { index: 1, kind: 'paragraph', text: 'ניתן צו ביום 21/8/2011', location: null },
    { index: 2, kind: 'paragraph', text: 'מועד אחרון להגשת תגובה ביום 17 באפריל 2026', location: null },
    { index: 3, kind: 'paragraph', text: 'הפגישה התקיימה ביום 18 באפריל 2026', location: null }
  ] }];

  const entries = globalThis.TimelineBuilder.build(files);
  assert.equal(entries.length, 3);
  assert.deepEqual(entries.map(entry => entry.normalizedDate), ['2011-08-21', '2026-04-17', '2026-04-18']);
  assert.deepEqual(entries.map(entry => entry.category), ['מסמכים והחלטות', 'מועדים וחובות', 'פגישות ודיונים']);
});

test('does not create entries when a paragraph contains multiple dates but no meaningful text', () => {
  const files = [{ id: 'range-only', name: 'range-only.docx', blocks: [
    { index: 1, kind: 'paragraph', text: '14.6.2026 - 16.6.2026', location: null }
  ] }];

  assert.deepEqual(globalThis.TimelineBuilder.build(files), []);
});


test('does not create timeline entries from date plus time only', () => {
  const files = [{ id: 'date-time-only', name: 'date-time-only.docx', blocks: [
    { index: 1, kind: 'paragraph', text: 'December 7, 2014, 3:23 AM', location: null },
    { index: 2, kind: 'paragraph', text: '07.12.2014 15:23', location: null },
    { index: 3, kind: 'paragraph', text: 'ביום 07.12.2014 בשעה 15:23', location: null },
    { index: 4, kind: 'paragraph', text: 'on December 7, 2014 at 3:23 p.m.', location: null }
  ] }];

  assert.deepEqual(globalThis.TimelineBuilder.build(files), []);
});

test('keeps date and time when a clear qualifying event is present', () => {
  const files = [{ id: 'date-time-context', name: 'date-time-context.docx', blocks: [
    { index: 1, kind: 'paragraph', text: 'נמסר מכתב ביום 07.12.2014 בשעה 15:23', location: null },
    { index: 2, kind: 'paragraph', text: 'הוגשה בקשה ביום December 7, 2014, 3:23 AM', location: null }
  ] }];

  const entries = globalThis.TimelineBuilder.build(files);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map(entry => entry.normalizedDate), ['2014-12-07', '2014-12-07']);
});

test('does not present unspecific dates, negated actions or unlinked nearby dates', () => {
  const files = [{ id: 'a', name: 'a.txt', blocks: [
    { index: 1, text: 'בדיקת התיק ביום 14.6.2026' },
    { index: 2, text: 'לא נשלח מכתב ביום 15.6.2026' },
    { index: 3, text: 'ביום 16.6.2026 נשלח מכתב, וביום 17.6.2026 נערכה פגישה' },
    { index: 4, text: 'מועד אחרון להגשה 18.6.2026' },
    { index: 5, text: 'ביום 19.6.2026 נשלח מכתב. ביום 20.6.2026 נערכה פגישה' }
  ] }];
  const entries = globalThis.TimelineBuilder.build(files);
  assert.deepEqual(entries.map(entry => entry.normalizedDate), ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20']);
});

test('preserves dated meetings and discussions but excludes negated meetings', () => {
  const blocks = [
    'ביום 14.6.2026 התקיימה פגישה במשרדי החברה',
    'הפגישה המרכזית התקיימה ביום 15.6.2026',
    'ביום 16.6.2026 התקיימה שיחת טלפון בין הצדדים',
    'ביום 17.6.2026 נערך דיון בבית המשפט',
    'ביום 18.6.2026 לא התקיימה פגישה',
    'הפגישה לא התקיימה ביום 19.6.2026'
  ];
  const entries = globalThis.TimelineBuilder.build([{ id: 'meetings', name: 'meetings.txt', blocks: blocks.map((text, index) => ({ index: index + 1, text })) }]);
  assert.deepEqual(entries.map(entry => entry.normalizedDate), [
    '2026-06-14', '2026-06-15', '2026-06-16', '2026-06-17'
  ]);
  assert.ok(entries.every(entry => entry.category === 'פגישות ודיונים'));
});

test('keeps dated payment and nonpayment facts while excluding vague references', () => {
  const descriptions = [
    'התשלום שולם ביום 14.6.2026',
    'לפי סיכום פנימי מיום 18.6.2026, טרם התקבל התשלום במלואו',
    'נבדקו החשבוניות ביום 19.6.2026'
  ];
  const entries = globalThis.TimelineBuilder.build([{ id: 'payments', name: 'payments.txt', blocks: descriptions.map((text, index) => ({ index: index + 1, text })) }]);
  assert.deepEqual(entries.map(entry => entry.normalizedDate), ['2026-06-14', '2026-06-18']);
  assert.ok(entries.every(entry => entry.category === 'תשלומים'));
});

test('filter levels expose progressively more dated passages without losing stable event identities', () => {
  const files = [{ id: 'case', name: 'case.txt', blocks: [
    { index: 1, text: 'נשלח מכתב ביום 14.6.2026' },
    { index: 2, text: 'נשלח מכתב ' + 'לצדדים ולנציגים הרבים בתיק המשפטי '.repeat(2) + 'ביום 15.6.2026' },
    { index: 3, text: 'נערכה בדיקה פנימית ביום 16.6.2026' },
    { index: 4, text: '17.6.2026' }
  ] }];
  const precise = globalThis.TimelineBuilder.build(files, 'precise');
  const balanced = globalThis.TimelineBuilder.build(files, 'balanced');
  const broad = globalThis.TimelineBuilder.build(files, 'broad');
  assert.deepEqual(precise.map(entry => entry.normalizedDate), ['2026-06-14']);
  assert.deepEqual(balanced.map(entry => entry.normalizedDate), ['2026-06-14', '2026-06-15']);
  assert.deepEqual(broad.map(entry => entry.normalizedDate), ['2026-06-14', '2026-06-15', '2026-06-16']);
  assert.equal(broad[2].category, 'אזכור לבדיקה');
  assert.equal(precise[0].id, broad[0].id);
  assert.equal(globalThis.TimelineBuilder.build(files).length, balanced.length);
});

test('event category filtering returns only events in the selected group', () => {
  const files = [{ id: 'groups', name: 'groups.txt', blocks: [
    { index: 1, text: 'ביום 14.6.2026 נשלח מכתב לספק.' },
    { index: 2, text: 'ביום 15.6.2026 התקיימה פגישה במשרד.' }
  ] }];
  const entries = globalThis.TimelineBuilder.build(files);
  const communications = globalThis.TimelineBuilder.filterByCategory(entries, 'תקשורת ומסירה');
  assert.equal(communications.length, 1);
  assert.equal(communications[0].category, 'תקשורת ומסירה');
  assert.equal(globalThis.TimelineBuilder.filterByCategory(entries, 'all').length, entries.length);
  assert.ok(globalThis.TimelineBuilder.categories.includes('אזכור לבדיקה'));
});

test('classifies court filings, signed agreements, approvals, delivery and deadlines', () => {
  const descriptions = [
    'ביום 01.07.2026 נחתם הסכם בין הצדדים',
    'ביום 02.07.2026 הוגש כתב תביעה',
    'ביום 03.07.2026 ניתנה החלטת בית המשפט',
    'ביום 04.07.2026 התקבל אישור בכתב',
    'מכתב שהתקבל ביום 05.07.2026 צורף לתיק',
    'מועד אחרון לתשלום הוא 06.07.2026'
  ];
  const entries = globalThis.TimelineBuilder.build([{ id: 'a', name: 'a.txt', blocks: descriptions.map((text, index) => ({ index: index + 1, text })) }]);
  assert.deepEqual(entries.map(entry => entry.category), [
    'מסמכים והחלטות', 'מסמכים והחלטות', 'מסמכים והחלטות',
    'מסמכים והחלטות', 'תקשורת ומסירה', 'מועדים וחובות'
  ]);
});


test('precise filtering uses event proximity consistently across supported date languages and formats', () => {
  const files = [{ id: 'precise-formats', name: 'precise-formats.txt', blocks: [
    { index: 1, text: 'הוגשה בקשה on December 7, 2014' },
    { index: 2, text: 'ניתנה החלטה 2026-06-14' },
    { index: 3, text: 'נשלח מכתב 17 באפריל 2026' },
    { index: 4, text: 'נשלח מכתב ' + 'לצדדים ולנציגים הרבים בתיק המשפטי '.repeat(2) + '18.6.2026' }
  ] }];

  const precise = globalThis.TimelineBuilder.build(files, 'precise');
  assert.deepEqual(precise.map(entry => entry.normalizedDate), ['2014-12-07', '2026-04-17', '2026-06-14']);
});


test('excluded event stays removed across filter-level rebuilds and returns after exclusions are cleared', () => {
  const files = [{ id: 'exclude-case', name: 'exclude-case.txt', blocks: [
    { index: 1, text: 'נשלח מכתב ביום 14.6.2026' },
    { index: 2, text: 'נערכה בדיקה פנימית ביום 15.6.2026' }
  ] }];
  const balanced = globalThis.TimelineBuilder.build(files, 'balanced');
  const removedId = balanced[0].id;
  const excluded = new Set([removedId]);

  assert.ok(!globalThis.TimelineBuilder.filterExcluded(balanced, excluded).some(entry => entry.id === removedId));
  const broad = globalThis.TimelineBuilder.build(files, 'broad');
  assert.ok(!globalThis.TimelineBuilder.filterExcluded(broad, excluded).some(entry => entry.id === removedId));
  assert.ok(globalThis.TimelineBuilder.filterExcluded(broad, new Set()).some(entry => entry.id === removedId));
});
