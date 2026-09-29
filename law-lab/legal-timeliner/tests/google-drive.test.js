'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function loadModule(config = {}) {
  globalThis.AppConfig = Object.assign({
    GOOGLE_DRIVE_CLIENT_ID: 'client',
    GOOGLE_DRIVE_API_KEY: 'key',
    GOOGLE_DRIVE_APP_ID: '123',
    GOOGLE_DRIVE_TIMEOUT_MS: 1000
  }, config);
  delete require.cache[require.resolve('../js/google-drive.js')];
  require('../js/google-drive.js');
  return globalThis.GoogleDriveSource;
}

test('Google Drive source reports whether credentials are configured', () => {
  let source = loadModule();
  assert.equal(source.configured(), true);
  source = loadModule({ GOOGLE_DRIVE_API_KEY: '' });
  assert.equal(source.configured(), false);
});

test('Google Docs are exported as DOCX and get a docx file name', () => {
  const source = loadModule();
  const doc = { id: 'a/b', name: 'כתב תביעה', mimeType: source.MIME_GOOGLE_DOC };
  assert.equal(source.fileNameFor(doc), 'כתב תביעה.docx');
  assert.match(source.downloadUrl(doc), /a%2Fb\/export\?mimeType=/);
  assert.match(source.downloadUrl(doc), /wordprocessingml\.document/);
});

test('DOCX and TXT Drive files are downloaded as media without renaming', () => {
  const source = loadModule();
  const docx = { id: 'docx-id', name: 'case.docx', mimeType: source.MIME_DOCX };
  const txt = { id: 'txt-id', name: 'notes.txt', mimeType: source.MIME_TEXT };
  assert.equal(source.fileNameFor(docx), 'case.docx');
  assert.equal(source.fileNameFor(txt), 'notes.txt');
  assert.equal(source.downloadUrl(docx), 'https://www.googleapis.com/drive/v3/files/docx-id?alt=media');
  assert.equal(source.downloadUrl(txt), 'https://www.googleapis.com/drive/v3/files/txt-id?alt=media');
});

test('downloadOne converts a selected Drive blob into a normal File for the existing pipeline', async () => {
  const source = loadModule();
  const calls = [];
  const file = await source.downloadOne(
    { id: '1', name: 'notes.txt', mimeType: source.MIME_TEXT },
    'token-123',
    async (url, options) => {
      calls.push({ url, options });
      return { ok: true, blob: async () => new Blob(['hello'], { type: 'text/plain' }) };
    }
  );
  assert.equal(file.name, 'notes.txt');
  assert.equal(file.type, 'text/plain');
  assert.equal(file.size, 5);
  assert.equal(file.sourceUrl, 'https://drive.google.com/open?id=1');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token-123');
});

test('downloadOne rejects unsupported Drive document types before fetching', async () => {
  const source = loadModule();
  let fetched = false;
  await assert.rejects(
    source.downloadOne(
      { id: '1', name: 'scan.pdf', mimeType: 'application/pdf' },
      'token',
      async () => { fetched = true; }
    ),
    /אינו נתמך/
  );
  assert.equal(fetched, false);
});

test('downloadOne exposes denied download as a clear file-specific error', async () => {
  const source = loadModule();
  await assert.rejects(
    source.downloadOne(
      { id: '1', name: 'case.docx', mimeType: source.MIME_DOCX },
      'token',
      async () => ({ ok: false, status: 403 })
    ),
    /אין הרשאת הורדה.*case\.docx/
  );
});
