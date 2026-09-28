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
    EXTRACTOR_VERSION: 'investor-v1.1.4'
  });
})(globalThis);
