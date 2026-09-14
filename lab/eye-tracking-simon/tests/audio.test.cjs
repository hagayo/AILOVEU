const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const flush = () => new Promise(resolve => setImmediate(resolve));

function harness(available = true) {
  const voices = [];
  let context;
  class Audio {
    constructor() { context = this; this.state = 'suspended'; this.currentTime = 0; this.destination = {}; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
    createOscillator() {
      const voice = { stops: [], frequency: {
        setValueAtTime(hz) { voice.hz = hz; },
        exponentialRampToValueAtTime(hz) { voice.endHz = hz; },
      }, connect() {}, disconnect() {}, start(time) { this.startTime = time; }, stop(time) { this.stops.push(time); } };
      voices.push(voice); return voice;
    }
    createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  const scope = { window: available ? { AudioContext: Audio } : {} };
  vm.createContext(scope);
  for (const file of ['config','game-config','audio']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',`${file}.js`),'utf8'),scope);
  return { audio: scope.window.EyeTracking.createGameAudio(), voices, context: () => context };
}

test('five faces use five distinct fixed notes with gentle envelopes', async () => {
  const h=harness(); await h.audio.unlock();
  for(let i=0;i<5;i++)h.audio.face(i,1200);
  await flush(); assert.equal(h.voices.length,5);
  assert.equal(new Set(h.voices.map(v=>v.hz)).size,5);
  assert.ok(h.voices.every(v=>v.type==='sine'&&v.stops[0]>1.2));
});
test('error is a distinct descending tone; success is a three-note rising chime', async () => {
  const h=harness();h.audio.result('error');await flush();
  assert.equal(h.voices[0].type,'triangle'); assert.ok(h.voices[0].endHz<h.voices[0].hz);
  h.audio.result('success');await flush();
  assert.deepEqual(h.voices.slice(1).map(v=>v.hz),[523.25,659.25,783.99]);
});
test('mute and stop cancel queued and active notes; unmute works; destroy closes audio', async () => {
  const h=harness();h.audio.face(0,1200);h.audio.setMuted(true);await flush();
  assert.equal(h.voices.length,0);
  h.audio.setMuted(false);h.audio.face(1,230);await flush();assert.equal(h.voices.length,1);
  h.audio.stop();assert.equal(h.voices[0].stops.length,2);
  h.audio.destroy();assert.equal(h.context().state,'closed');
  h.audio.face(2,230);await flush();assert.equal(h.voices.length,1);
});
test('game audio degrades safely when Web Audio is unavailable', async () => {
  const h=harness(false);await h.audio.unlock();h.audio.face(0,1200);h.audio.result('error');
  await flush();assert.equal(h.voices.length,0);h.audio.destroy();
});
