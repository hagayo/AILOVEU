'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
require('../js/date-engine.js');

test('extracts Israeli numeric dates deterministically', () => {
  const found = globalThis.DateEngine.findDates('הפגישה התקיימה ביום 14.6.2026.');
  assert.equal(found.length, 1);
  assert.equal(found[0].normalizedDate, '2026-06-14');
  assert.equal(found[0].raw, '14.6.2026');
});

test('treats ambiguous numeric dates as Israeli day-month-year', () => {
  const found = globalThis.DateEngine.findDates('Meeting: 03/04/2026');
  assert.equal(found[0].normalizedDate, '2026-04-03');
});

test('expands two-digit years using the agreed Israeli pivot', () => {
  const found = globalThis.DateEngine.findDates('17.04.26 וגם 17.04.98');
  assert.deepEqual(found.map(x => x.normalizedDate), ['2026-04-17', '1998-04-17']);
});

test('supports all agreed date formats', () => {
  const found = globalThis.DateEngine.findDates(
    '2026-04-17 | 17 באפריל 2026 | April 17, 2026 | 17.04.26 | 17.04.2026'
  );
  assert.equal(found.length, 5);
  assert.ok(found.every(x => x.normalizedDate === '2026-04-17'));
});

test('extracts Hebrew textual month date', () => {
  const found = globalThis.DateEngine.findDates('ביום 16 ביוני 2026 נמסרה ההודעה.');
  assert.equal(found[0].normalizedDate, '2026-06-16');
});

test('extracts English day-first and month-first dates', () => {
  const found = globalThis.DateEngine.findDates('On 14 June 2026 we met. Follow-up was June 16, 2026.');
  assert.deepEqual(found.map(x => x.normalizedDate), ['2026-06-14', '2026-06-16']);
});

test('rejects impossible dates', () => {
  const found = globalThis.DateEngine.findDates('31/02/2026');
  assert.equal(found.length, 0);
});

test('keeps repeated date mentions as separate occurrences', () => {
  const found = globalThis.DateEngine.findDates('14.6.2026 וגם שוב 14.6.2026');
  assert.equal(found.length, 2);
});


test('detects numeric dates next to filename underscores', () => {
  const found = globalThis.DateEngine.findDates('מכתב_התראה_14.06.2025_V1.docx');
  assert.equal(found.length, 1);
  assert.equal(found[0].normalizedDate, '2025-06-14');
});

test('does not extract a Hebrew date from the tail of a longer number', () => {
  const found = globalThis.DateEngine.findDates('הערך 117 באפריל 2026 אינו תאריך תקין');
  assert.equal(found.length, 0);
});
