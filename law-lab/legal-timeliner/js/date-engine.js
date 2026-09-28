(function (global) {
  'use strict';

  var HEBREW_MONTHS = Object.freeze({
    'ינואר': 1,
    'פברואר': 2,
    'מרץ': 3,
    'אפריל': 4,
    'מאי': 5,
    'יוני': 6,
    'יולי': 7,
    'אוגוסט': 8,
    'ספטמבר': 9,
    'אוקטובר': 10,
    'נובמבר': 11,
    'דצמבר': 12
  });

  var ENGLISH_MONTHS = Object.freeze({
    january: 1, jan: 1,
    february: 2, feb: 2,
    march: 3, mar: 3,
    april: 4, apr: 4,
    may: 5,
    june: 6, jun: 6,
    july: 7, jul: 7,
    august: 8, aug: 8,
    september: 9, sep: 9, sept: 9,
    october: 10, oct: 10,
    november: 11, nov: 11,
    december: 12, dec: 12
  });

  var ISO_REGEX = /(?<!\d)((?:19|20)\d{2})[-\/.](1[0-2]|0?[1-9])[-\/.](3[01]|[12]\d|0?[1-9])(?!\d)/g;
  var DMY_FULL_REGEX = /(?<!\d)(3[01]|[12]\d|0?[1-9])([.\/-])(1[0-2]|0?[1-9])\2((?:19|20)\d{2})(?!\d)/g;
  var DMY_SHORT_REGEX = /(?<!\d)(3[01]|[12]\d|0?[1-9])([.\/-])(1[0-2]|0?[1-9])\2(\d{2})(?!\d)/g;
  var HEBREW_REGEX = new RegExp(
    '(?<!\\d)(3[01]|[12]\\d|0?[1-9])\\s+(?:ב)?(' + Object.keys(HEBREW_MONTHS).join('|') + ')\\s+((?:19|20)\\d{2})',
    'g'
  );
  var ENGLISH_DAY_FIRST_REGEX = new RegExp(
    '\\b(0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?\\s+(' + Object.keys(ENGLISH_MONTHS).join('|') + ')\\.?[,]?\\s+((?:19|20)\\d{2})\\b',
    'gi'
  );
  var ENGLISH_MONTH_FIRST_REGEX = new RegExp(
    '\\b(' + Object.keys(ENGLISH_MONTHS).join('|') + ')\\.?\\s+(0?[1-9]|[12]\\d|3[01])(?:st|nd|rd|th)?[,]?\\s+((?:19|20)\\d{2})\\b',
    'gi'
  );

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function validDate(year, month, day) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
    if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false;
    var date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  }

  function normalized(year, month, day) {
    return year + '-' + pad2(month) + '-' + pad2(day);
  }

  function addResult(results, seenRanges, text, index, length, year, month, day, format) {
    var before = index > 0 ? text.charAt(index - 1) : '';
    var after = index + length < text.length ? text.charAt(index + length) : '';
    if (/\d/.test(before) || /\d/.test(after)) return;
    if (!validDate(year, month, day)) return;
    var key = index + ':' + length;
    if (seenRanges.has(key)) return;
    seenRanges.add(key);
    results.push({
      raw: text.slice(index, index + length),
      index: index,
      length: length,
      year: year,
      month: month,
      day: day,
      normalizedDate: normalized(year, month, day),
      format: format
    });
  }

  function runRegex(text, regex, handler) {
    regex.lastIndex = 0;
    var match;
    while ((match = regex.exec(text)) !== null) {
      handler(match);
      if (match[0] === '') regex.lastIndex += 1;
    }
  }

  function expandTwoDigitYear(value) {
    return value <= 49 ? 2000 + value : 1900 + value;
  }

  function findDates(input) {
    var text = String(input || '');
    var results = [];
    var seenRanges = new Set();

    runRegex(text, ISO_REGEX, function (m) {
      addResult(results, seenRanges, text, m.index, m[0].length, Number(m[1]), Number(m[2]), Number(m[3]), 'iso');
    });

    runRegex(text, DMY_FULL_REGEX, function (m) {
      addResult(results, seenRanges, text, m.index, m[0].length, Number(m[4]), Number(m[3]), Number(m[1]), 'dmy-numeric');
    });

    runRegex(text, DMY_SHORT_REGEX, function (m) {
      addResult(results, seenRanges, text, m.index, m[0].length, expandTwoDigitYear(Number(m[4])), Number(m[3]), Number(m[1]), 'dmy-numeric-short-year');
    });

    runRegex(text, HEBREW_REGEX, function (m) {
      addResult(results, seenRanges, text, m.index, m[0].length, Number(m[3]), HEBREW_MONTHS[m[2]], Number(m[1]), 'hebrew-text');
    });

    runRegex(text, ENGLISH_DAY_FIRST_REGEX, function (m) {
      addResult(results, seenRanges, text, m.index, m[0].length, Number(m[3]), ENGLISH_MONTHS[m[2].toLowerCase()], Number(m[1]), 'english-day-first');
    });

    runRegex(text, ENGLISH_MONTH_FIRST_REGEX, function (m) {
      addResult(results, seenRanges, text, m.index, m[0].length, Number(m[3]), ENGLISH_MONTHS[m[1].toLowerCase()], Number(m[2]), 'english-month-first');
    });

    return results.sort(function (a, b) { return a.index - b.index; });
  }

  global.DateEngine = Object.freeze({
    findDates: findDates
  });
})(globalThis);
