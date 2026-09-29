'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

test('TXT selection does not load officeParser, first DOCX does', async () => {
  globalThis.AppConfig = {
    OFFICE_PARSER_URL: 'https://example.test/officeparser.js',
    OFFICE_PARSER_INTEGRITY: 'sha256-test',
    OFFICE_PARSER_TIMEOUT_MS: 1000
  };
  let appended = 0;
  globalThis.CustomEvent = class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } };
  globalThis.dispatchEvent = () => {};
  globalThis.document = {
    createElement() { return { dataset: {} }; },
    head: {
      appendChild(script) {
        appended += 1;
        globalThis.officeParser = { parseOffice() {} };
        setImmediate(() => script.onload());
      }
    }
  };

  delete require.cache[require.resolve('../js/script-loader.js')];
  require('../js/script-loader.js');

  await globalThis.OfficeParserLoader.preloadForFiles([{ name: 'notes.txt' }]);
  assert.equal(appended, 0);

  await globalThis.OfficeParserLoader.preloadForFiles([{ name: 'case.docx' }]);
  assert.equal(appended, 1);
  assert.equal(globalThis.OfficeParserLoader.isReady(), true);
});

test('failed DOCX loader cleans up and can retry successfully', async () => {
  delete globalThis.officeParser;
  globalThis.AppConfig = {
    OFFICE_PARSER_URL: 'https://example.test/officeparser.js',
    OFFICE_PARSER_INTEGRITY: 'sha256-test',
    OFFICE_PARSER_TIMEOUT_MS: 1000
  };
  let appended = 0;
  let removed = 0;
  globalThis.CustomEvent = class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } };
  globalThis.dispatchEvent = () => {};
  globalThis.document = {
    createElement() { return { dataset: {}, parentNode: null }; },
    head: {
      appendChild(script) {
        appended += 1;
        script.parentNode = {
          removeChild() {
            removed += 1;
            script.parentNode = null;
          }
        };
        if (appended === 1) {
          setImmediate(() => script.onerror());
          return;
        }
        globalThis.officeParser = { parseOffice() {} };
        setImmediate(() => script.onload());
      }
    }
  };

  delete require.cache[require.resolve('../js/script-loader.js')];
  require('../js/script-loader.js');

  await assert.rejects(globalThis.OfficeParserLoader.load());
  assert.equal(removed, 1);
  await globalThis.OfficeParserLoader.load();
  assert.equal(appended, 2);
  assert.equal(globalThis.OfficeParserLoader.isReady(), true);
});

test('concurrent DOCX load calls share one script load', async () => {
  delete globalThis.officeParser;
  globalThis.AppConfig = {
    OFFICE_PARSER_URL: 'https://example.test/officeparser.js',
    OFFICE_PARSER_TIMEOUT_MS: 1000
  };
  let appended = 0;
  globalThis.CustomEvent = class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } };
  globalThis.dispatchEvent = () => {};
  globalThis.document = {
    createElement() { return { dataset: {}, parentNode: null }; },
    head: {
      appendChild(script) {
        appended += 1;
        globalThis.officeParser = { parseOffice() {} };
        setImmediate(() => script.onload());
      }
    }
  };

  delete require.cache[require.resolve('../js/script-loader.js')];
  require('../js/script-loader.js');
  const [first, second] = await Promise.all([
    globalThis.OfficeParserLoader.load(),
    globalThis.OfficeParserLoader.load()
  ]);
  assert.equal(appended, 1);
  assert.equal(first, second);
});

test('loader rejects when script loads without the expected parseOffice API and allows retry', async () => {
  delete globalThis.officeParser;
  globalThis.AppConfig = {
    OFFICE_PARSER_URL: 'https://example.test/officeparser.js',
    OFFICE_PARSER_TIMEOUT_MS: 1000
  };
  let appended = 0;
  globalThis.CustomEvent = class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } };
  globalThis.dispatchEvent = () => {};
  globalThis.document = {
    createElement() { return { dataset: {}, parentNode: null }; },
    head: {
      appendChild(script) {
        appended += 1;
        script.parentNode = { removeChild() { script.parentNode = null; } };
        if (appended === 1) {
          globalThis.officeParser = {};
          setImmediate(() => script.onload());
        } else {
          globalThis.officeParser = { parseOffice() {} };
          setImmediate(() => script.onload());
        }
      }
    }
  };

  delete require.cache[require.resolve('../js/script-loader.js')];
  require('../js/script-loader.js');
  await assert.rejects(globalThis.OfficeParserLoader.load(), /API/);
  await globalThis.OfficeParserLoader.load();
  assert.equal(appended, 2);
});

test('loader times out, cleans up the failed script and can retry', async () => {
  delete globalThis.officeParser;
  globalThis.AppConfig = {
    OFFICE_PARSER_URL: 'https://example.test/officeparser.js',
    OFFICE_PARSER_TIMEOUT_MS: 5
  };
  let appended = 0;
  let removed = 0;
  globalThis.CustomEvent = class CustomEvent { constructor(type, init) { this.type = type; this.detail = init.detail; } };
  globalThis.dispatchEvent = () => {};
  globalThis.document = {
    createElement() { return { dataset: {}, parentNode: null }; },
    head: {
      appendChild(script) {
        appended += 1;
        script.parentNode = {
          removeChild() {
            removed += 1;
            script.parentNode = null;
          }
        };
        if (appended === 2) {
          globalThis.officeParser = { parseOffice() {} };
          setImmediate(() => script.onload());
        }
      }
    }
  };

  delete require.cache[require.resolve('../js/script-loader.js')];
  require('../js/script-loader.js');
  await assert.rejects(globalThis.OfficeParserLoader.load(), /ארכה יותר מדי זמן/);
  assert.equal(removed, 1);
  await globalThis.OfficeParserLoader.load();
  assert.equal(appended, 2);
});
