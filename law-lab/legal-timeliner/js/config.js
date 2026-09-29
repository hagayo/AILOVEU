(function (global) {
  'use strict';

  var officeParserUrl = 'vendor/officeparser/officeparser.browser.iife.js';
  if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
    officeParserUrl = new URL('../vendor/officeparser/officeparser.browser.iife.js', document.currentScript.src).href;
  }

  global.AppConfig = Object.freeze({
    SUPPORTED_EXTENSIONS: Object.freeze(['docx', 'txt']),
    OFFICE_PARSER_URL: officeParserUrl,
    OFFICE_PARSER_SHA256: 'db84fa6f2139f47d2c4850b9a6545ebdecf5d5f551038c5601b488421c66df7f',
    OFFICE_PARSER_TIMEOUT_MS: 30000,
    MAX_FILES: 50,
    MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024,
    MAX_TOTAL_SIZE_BYTES: 100 * 1024 * 1024,
    GOOGLE_DRIVE_CLIENT_ID: '234352626795-onvoi9fk37pphd9rq3r7vjq771qd21k1.apps.googleusercontent.com',
    GOOGLE_DRIVE_API_KEY: 'AIzaSyCozwFmKGcY099sO8MxpVU4Cno8EbyEoS4',
    GOOGLE_DRIVE_APP_ID: '234352626795',
    GOOGLE_DRIVE_TIMEOUT_MS: 15000,
    EXTRACTOR_VERSION: 'legal-timeliner-v1.6.0'
  });
})(globalThis);
