const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const app = fs.readFileSync(path.join(__dirname, '../js/app.js'), 'utf8');
const recordingCode = app.slice(app.indexOf('  function getRecordingMimeType()'), app.indexOf('  async function createParticleText()'));

function setup(options = {}) {
  const sessions = [], tracks = [], rates = [], downloads = [], events = {};
  const state = { recorder: null };
  const button = { classList: { add() {}, remove() {} }, setAttribute() {} };
  class Recorder {
    static isTypeSupported() { return true; }
    constructor(stream, { mimeType }) {
      this.state = 'inactive';
      this.mimeType = mimeType;
      sessions.push(this);
    }
    start() { if (options.failStart) throw new Error('encoder failed'); this.state = 'recording'; }
    pause() { this.state = 'paused'; }
    resume() { this.state = 'recording'; }
    stop() { this.state = 'inactive'; }
    finish() {
      this.ondataavailable({ data: new Blob(['final video data']) });
      this.onstop();
    }
  }
  const context = vm.createContext({
    state, RECORDING_FPS: 60, MediaRecorder: Recorder, Blob,
    console: { error() {} }, setTimeout() {},
    URL: { createObjectURL(blob) { downloads.push(blob); return 'blob:recording'; }, revokeObjectURL() {} },
    ui: { record: button }, setStatus(message) { context.status = message; },
    document: {
      hidden: false,
      addEventListener(name, callback) { events[name] = callback; },
      createElement() { return { click() {} }; }
    },
    canvas: {
      captureStream(rate) {
        rates.push(rate);
        const track = { stopped: false, frames: 0, stop() { this.stopped = true; } };
        if (!options.timedOnly) track.requestFrame = function () { this.frames++; };
        tracks.push(track);
        return { getTracks: () => [track], getVideoTracks: () => [track] };
      }
    }
  });
  vm.runInContext(recordingCode, context);
  return { context, state, sessions, tracks, rates, downloads, events, button };
}

test('recording omits hidden-tab time and resumes only with a rendered frame', () => {
  const h = setup();
  h.context.startRecording();
  h.context.captureRecordingFrame(100);
  assert.equal(h.tracks[0].frames, 1);
  h.context.document.hidden = true;
  h.events.visibilitychange();
  assert.equal(h.sessions[0].state, 'paused');
  h.context.captureRecordingFrame(3100);
  assert.equal(h.tracks[0].frames, 1);
  h.context.document.hidden = false;
  h.events.visibilitychange();
  assert.equal(h.sessions[0].state, 'paused');
  h.context.captureRecordingFrame(3200);
  assert.equal(h.sessions[0].state, 'recording');
  assert.equal(h.tracks[0].frames, 2);
});

test('stop ends capture immediately and rapid clicks cannot mix recording sessions', async () => {
  const h = setup();
  h.context.toggleRecording();
  h.context.toggleRecording();
  assert.equal(h.tracks[0].stopped, true);
  assert.equal(h.button.disabled, true);
  h.context.toggleRecording();
  assert.equal(h.sessions.length, 1);
  h.sessions[0].finish();
  assert.equal(h.button.disabled, false);
  assert.equal(await h.downloads[0].text(), 'final video data');
  h.context.toggleRecording();
  assert.equal(h.sessions.length, 2);
  h.context.toggleRecording();
  h.sessions[1].finish();
  assert.equal(h.downloads.length, 2);
  assert.equal(await h.downloads[1].text(), 'final video data');
});

test('a paused recording can be stopped and saved without resuming capture', () => {
  const h = setup();
  h.context.startRecording();
  h.context.document.hidden = true;
  h.events.visibilitychange();
  h.context.toggleRecording();
  h.sessions[0].finish();
  assert.equal(h.state.recorder, null);
  assert.equal(h.downloads.length, 1);
  assert.equal(h.tracks[0].stopped, true);
});

test('browsers without manual capture use timed capture and release the unused stream', () => {
  const h = setup({ timedOnly: true });
  h.context.startRecording();
  assert.deepEqual(h.rates, [0, 60]);
  assert.equal(h.tracks[0].stopped, true);
  h.context.captureRecordingFrame(100);
  assert.equal(h.sessions[0].state, 'recording');
  h.context.toggleRecording();
  h.sessions[0].finish();
  assert.equal(h.tracks[1].stopped, true);
});

test('encoder startup failure releases capture and restores the record button', () => {
  const h = setup({ failStart: true });
  h.context.startRecording();
  assert.equal(h.state.recorder, null);
  assert.equal(h.tracks[0].stopped, true);
  assert.equal(h.button.disabled, false);
  assert.equal(h.context.status, 'Could not start WebM recording.');
});

test('encoder errors release capture and do not download a failed recording', () => {
  const h = setup();
  h.context.startRecording();
  h.sessions[0].onerror({ error: new Error('encoder failed') });
  h.sessions[0].finish();
  assert.equal(h.state.recorder, null);
  assert.equal(h.tracks[0].stopped, true);
  assert.equal(h.downloads.length, 0);
  assert.equal(h.context.status, 'WebM recording failed.');
});
