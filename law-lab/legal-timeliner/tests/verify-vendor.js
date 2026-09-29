'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

globalThis.AppConfig = undefined;
require('../js/config.js');

const root = path.resolve(__dirname, '..');
const relativePath = 'vendor/officeparser/officeparser.browser.iife.js';
const bundlePath = path.join(root, relativePath);
const data = fs.readFileSync(bundlePath);
const actual = crypto.createHash('sha256').update(data).digest('hex');
const expected = globalThis.AppConfig.OFFICE_PARSER_SHA256;

if (actual !== expected) {
  console.error(`Vendor hash mismatch for ${relativePath}`);
  console.error(`Expected: ${expected}`);
  console.error(`Actual:   ${actual}`);
  process.exit(1);
}

console.log(`PASS: officeParser v8.0.0 vendor SHA-256 ${actual}`);
