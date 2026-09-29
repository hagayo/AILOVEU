'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OFFICE_PARSER_PATH = path.join(ROOT, 'vendor', 'officeparser', 'officeparser.browser.iife.js');

const EXPECTED_DATES = Object.freeze([
  '2026-06-12',
  '2026-06-14',
  '2026-06-14',
  '2026-06-15',
  '2026-06-16',
  '2026-06-18',
  '2026-06-18'
]);

const DEMO_FILES = Object.freeze([
  'company-affidavit.docx',
  'supplier-affidavit.docx',
  'correspondence.txt'
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extensionOf(name) {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function loadProductionScripts() {
  const officeParser = require(OFFICE_PARSER_PATH);
  assert(officeParser && typeof officeParser.parseOffice === 'function',
    'ה-bundle המקומי של officeParser לא חשף parseOffice');

  globalThis.OfficeParserLoader = Object.freeze({
    load: async function () { return officeParser; },
    preloadForFiles: async function () { return officeParser; },
    isReady: function () { return true; }
  });

  require(path.join(ROOT, 'js', 'document-extractor.js'));
  require(path.join(ROOT, 'js', 'date-engine.js'));
  require(path.join(ROOT, 'js', 'timeline.js'));
  require(path.join(ROOT, 'js', 'related-documents.js'));
}

function loadFile(name, id) {
  const filePath = path.join(ROOT, 'demo', name);
  const bytes = fs.readFileSync(filePath);
  const type = name.endsWith('.docx')
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'text/plain';

  return {
    id,
    name,
    extension: extensionOf(name),
    file: new File([bytes], name, { type }),
    blocks: null
  };
}

async function run() {
  loadProductionScripts();

  const fileItems = DEMO_FILES.map(function (name, index) {
    return loadFile(name, 'demo-' + (index + 1));
  });

  for (const item of fileItems) {
    item.blocks = await DocumentExtractor.extract(item);
    assert(Array.isArray(item.blocks), 'החילוץ לא החזיר blocks עבור ' + item.name);
    assert(item.blocks.length > 0, 'לא חולץ טקסט מ-' + item.name);
  }

  const company = fileItems[0];
  assert(company.blocks.some(function (block) {
    return block.text.indexOf('ביום 14.6.2026 התקיימה פגישה במשרדי החברה') >= 0;
  }), 'הפסקה המרכזית לא חולצה מ-company-affidavit.docx');

  assert(company.blocks.some(function (block) {
    return block.text.indexOf('נשלחה תזכורת נוספת לתשלום') >= 0 &&
      block.location && block.location.table === 1;
  }), 'הטקסט מתוך הטבלה לא חולץ עם provenance של טבלה');

  const entries = TimelineBuilder.build(fileItems);
  entries.forEach(function (entry) {
    const source = fileItems.find(function (item) { return item.id === entry.fileId; });
    const block = source && source.blocks.find(function (candidate) { return candidate.index === entry.blockIndex; });
    assert(block && block.text.slice(entry.matchIndex, entry.matchIndex + entry.matchLength) === entry.rawDate,
      'מיקום המקור של ' + entry.fileName + ' צריך להצביע לתאריך המדויק בקטע שחולץ');
  });
  const preciseEntries = TimelineBuilder.build(fileItems, 'precise');
  assert(preciseEntries.length <= entries.length && preciseEntries.every(function (entry) {
    return entries.some(function (balancedEntry) { return balancedEntry.id === entry.id; });
  }), 'רמת סינון מדויקת לא יכולה להוסיף אירועים שאינם קיימים ברמה המאוזנת');
  assert(entries.length === EXPECTED_DATES.length,
    'ציפינו ל-' + EXPECTED_DATES.length + ' רשומות Timeline וקיבלנו ' + entries.length);

  assert(!entries.some(function (entry) {
    return entry.fileName === 'company-affidavit.docx' &&
      entry.normalizedDate === '2026-06-18';
  }), 'תאריך שמופיע לבדו בפסקה לא אמור ליצור Timeline Entry');

  const actualDates = entries.map(function (entry) { return entry.normalizedDate; });
  assert(JSON.stringify(actualDates) === JSON.stringify(EXPECTED_DATES),
    'רצף התאריכים אינו תואם. בפועל: ' + actualDates.join(', '));

  const related = RelatedDocumentMatcher.buildIndex(fileItems, entries);
  const june16 = entries.find(function (entry) {
    return entry.normalizedDate === '2026-06-16' && entry.fileName === 'company-affidavit.docx';
  });
  assert(june16 && june16.category === 'תקשורת ומסירה', 'הודעת 16.6.2026 לא סווגה');
  assert(related.forEntry(june16).length === 1,
    '16.6.2026 אמור לקשר למסמך המקור בלבד');
  const june14 = entries.find(function (entry) {
    return entry.normalizedDate === '2026-06-14' && entry.fileName === 'company-affidavit.docx';
  });
  assert(june14 && june14.category === 'פגישות ודיונים',
    'הפגישה מ-14.6.2026 במסמך החברה צריכה להופיע בציר');
  assert(related.forEntry(june14).length === 2,
    'הפגישה מ-14.6.2026 אמורה לקשר גם ל-correspondence.txt');

  const june18 = entries.find(function (entry) {
    return entry.normalizedDate === '2026-06-18' && entry.fileName === 'supplier-affidavit.docx';
  });
  assert(june18, 'לא נמצאה רשומת 18.6.2026 ממסמך הספק');
  const june18Related = related.forEntry(june18);
  assert(june18Related.length === 3,
    '18.6.2026 אמור לקשר לכל מסמך שבו התאריך מופיע בתוכן, גם ללא אירוע מסווג');
  assert(june18Related.some(function (match) {
    return match.file.name === 'company-affidavit.docx';
  }), 'מסמך שבו 18.6.2026 מופיע כפסקת תאריך צריך להיחשב מסמך קשור');

  return {
    files: fileItems.map(function (item) {
      return { name: item.name, blocks: item.blocks.length };
    }),
    timelineEntries: entries.length,
    dates: actualDates
  };
}

run()
  .then(function (result) {
    console.log('PASS: real demo DOCX/TXT -> local officeParser -> extraction -> timeline -> related documents');
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(function (error) {
    console.error('FAIL: real demo integration did not complete successfully');
    console.error(error && error.stack ? error.stack : error);
    process.exitCode = 1;
  });
