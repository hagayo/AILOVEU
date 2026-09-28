# Third-party runtime

## officeParser

- Version: 8.0.0
- License: MIT
- Source: `harshankur/officeParser`
- Pinned commit: `222487e391c25f32fd94d15d3f305c15798082c5`
- Browser build: `officeparser.browser.iife.js`
- Official release asset size: 5,128,587 bytes
- Official release SHA-256: `db84fa6f2139f47d2c4850b9a6545ebdecf5d5f551038c5601b488421c66df7f`
- Runtime loading: lazy, only after the first DOCX is added.
- OCR: supported by the regular build, but disabled in Investor V1.

The application ships the pinned browser IIFE locally under `vendor/officeparser/` and lazy-loads it only when DOCX support is needed. `npm run verify:vendor` checks the vendored file against the official release SHA-256 before release/testing.
