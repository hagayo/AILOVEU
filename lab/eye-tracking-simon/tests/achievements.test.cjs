const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const storageKey = 'eyeTrackingColorMemory.achievements';

// Run the real UI, game, timers and storage together. Only browser DOM/audio
// surfaces are replaced; records are never written directly by the tests.
function harness(storage = new Map(), options = {}) {
  let time = 0, nextId = 0, game;
  const tasks = new Map(), nodes = new Map(), cues = [], errors = [];
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      textContent: '', hidden: false, disabled: false, dataset: {}, style: { setProperty(key, value) { this[key] = value; } },
      value: id === 'difficulty' ? 'beginner' : 'normal', handlers: new Map(),
      classList: { toggle() {} }, attributes: {},
      setAttribute(key, value) { this.attributes[key] = value; },
      getAttribute(key) { return this.attributes[key]; }, focus() {}, select() {},
      closest: () => node(id + '-parent'),
      querySelector: selector => node(selector === '[data-i18n]' ? id + '-label' : selector),
      querySelectorAll: () => Array.from({ length: 5 }, (_, i) => node('face-' + i)),
      addEventListener(event, fn) { this.handlers.set(event, fn); },
      removeEventListener(event) { this.handlers.delete(event); },
    });
    return nodes.get(id);
  }
  const scope = {
    window: {
      location: { hash: options.hash || '', pathname: '/index.html', search: options.search || '' },
      history: { replaceState() {} },
      localStorage: { getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value) },
      setTimeout(fn, delay) { const id = ++nextId; tasks.set(id, { fn, at: time + delay }); return id; },
      clearTimeout: id => tasks.delete(id), addEventListener() {}, removeEventListener() {},
    },
    document: { getElementById: node, body: node('body'), documentElement: node('html'), querySelectorAll: () => [] },
    performance: { now: () => time }, navigator: options.navigator || {},
  };
  vm.createContext(scope);
  for (const file of ['config', 'i18n', 'game-config', 'challenge', 'game', 'game-ui']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file + '.js'), 'utf8'), scope);
  }
  const app = scope.window.EyeTracking, factory = app.createSimonGame;
  app.createSimonGame = options => (game = factory({ ...options, random: () => 0 }));
  app.createGameAudio = () => ({ face: face => cues.push(face), result() {},
    stop() {}, unlock() {}, destroy() {}, isMuted: () => false, setMuted() {} });
  const ui = app.createGameUI({ setGameState() {}, resize() {}, hitFace: () => options.hitFace ?? 0 },
    { renderImmediately() {} }, error => errors.push(error));
  function advance(ms) {
    const end = time + ms;
    while (true) {
      const next = [...tasks].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      tasks.delete(next[0]); time = next[1].at; next[1].fn();
    }
    time = end;
  }
  function playback() {
    const first = cues.length;
    while (['playback', 'shuffle'].includes(game.snapshot().phase)) {
      const next = Math.min(...[...tasks.values()].map(task => task.at));
      assert.ok(Number.isFinite(next));
      advance(next - time);
    }
    assert.equal(game.snapshot().phase, 'input');
    return cues.slice(first);
  }
  function click(id) { node(id).handlers.get('click')(); }
  function complete(sequence, delay = 1000.25) {
    sequence.forEach(face => { advance(delay); click('face-' + face); });
  }
  click('playButton');
  return { storage, node, game, ui, errors, click, advance, playback, complete, i18n: app.i18n, challenge: app.challenge,
    start() { click('startButton'); return playback(); },
    next() { advance(app.gameConfig.successMs); return playback(); },
    lose(face, delay = 100.25) {
      advance(delay); click('face-' + face); advance(app.gameConfig.errorRevealMs);
      assert.equal(game.snapshot().phase, 'lost');
    },
    saved: () => JSON.parse(storage.get(storageKey)),
  };
}

test('records persist immediately after success even when closing before the success sound', () => {
  const h = harness();
  h.complete(h.start());
  assert.equal(h.saved().longest, 3);
  assert.equal(h.saved().scoreBest, 1);
  h.click('exitButton');
  h.advance(10000);
  const reloaded = harness(h.storage);
  assert.equal(reloaded.node('achievementLongest').textContent, '3 פנים');
  assert.equal(reloaded.node('achievementScore').textContent, 1);
  assert.deepEqual(h.errors, []);
});

test('loss saves the final whole-game speed and displays the completed length, not the failed length', () => {
  const h = harness();
  h.complete(h.start());
  const next = h.next();
  h.advance(100.25); h.click('face-' + next[0]);
  h.lose((next[1] + 1) % 5);
  assert.equal(h.game.snapshot().length, 4);
  assert.equal(h.node('resultLength').textContent, '3 פנים');
  assert.equal(h.node('resultScore').textContent, 1);
  assert.equal(h.saved().speedBestMs, 640.25);
  assert.equal(h.node('achievementSpeed').textContent, h.node('resultSpeed').textContent);
  const reloaded = harness(h.storage);
  assert.equal(reloaded.node('achievementSpeed').textContent, '0.640 שנ׳');
  // Another result must not round or replace a better existing record.
  reloaded.complete(reloaded.start(), 2000);
  const second = reloaded.next(); reloaded.lose((second[0] + 1) % 5, 2000);
  assert.equal(reloaded.saved().speedBestMs, 640.25);
  assert.deepEqual(h.errors, []);
});

test('timeout updates and persists records without requiring a wrong-face click', () => {
  const h = harness();
  h.node('difficulty').value = 'champion';
  h.complete(h.start(), 800);
  h.next();
  h.advance(20000);
  assert.equal(h.game.snapshot().phase, 'lost');
  assert.equal(h.game.snapshot().failure, 'timeout');
  assert.equal(h.saved().speedBestMs, 800);
  assert.equal(h.saved().longest, 3);
  assert.deepEqual(h.errors, []);
});

test('existing better records survive a weaker game and first-round failure earns no completed sequence', () => {
  const storage = new Map([[storageKey, JSON.stringify({ longest: 7, scoreBest: 5, speedBestMs: 593.75 })]]);
  const h = harness(storage);
  const shown = h.start(); h.lose((shown[0] + 1) % 5);
  assert.deepEqual(h.saved(), { longest: 7, scoreBest: 5, speedBestMs: 593.75 });
  assert.equal(h.node('resultLength').textContent, '0 פנים');
  assert.equal(h.node('resultScore').textContent, '—');
  assert.deepEqual(h.errors, []);
});

test('language toggle preserves playback, input progress, timing and completed-game records', () => {
  const h = harness();
  h.node('difficulty').value = 'advanced';
  h.click('startButton');
  const beforePlayback = JSON.stringify(h.game.snapshot());
  h.click('languageToggle');
  assert.equal(JSON.stringify(h.game.snapshot()), beforePlayback);
  assert.equal(h.node('html').lang, 'en');
  assert.equal(h.node('html').dir, 'ltr');
  assert.equal(h.node('gameMessage').textContent, 'Watch the sequence');
  const sequence = h.playback();
  h.advance(500); h.click('face-' + sequence[0]);
  const beforeInput = JSON.stringify(h.game.snapshot());
  h.click('languageToggle');
  assert.equal(JSON.stringify(h.game.snapshot()), beforeInput);
  assert.equal(h.node('gameMessage').textContent, 'עכשיו תורכם');
  assert.equal(h.node('html').dir, 'rtl');
  h.complete(sequence.slice(1));
  const next = h.next(); h.lose((next[0] + 1) % 5);
  const saved = h.storage.get(storageKey);
  h.click('languageToggle');
  assert.equal(h.node('resultLength').textContent, '3 faces');
  assert.equal(h.node('startButton').textContent, 'Try again');
  assert.equal(h.node('achievementLongest').textContent, '3 faces');
  assert.equal(h.storage.get(storageKey), saved, 'Translation never rewrites achievements');
  const reloaded = harness(h.storage);
  assert.equal(reloaded.node('html').lang, 'en');
  assert.equal(reloaded.node('achievementLongest').textContent, '3 faces');
  assert.equal(reloaded.node('languageToggle').textContent, 'עברית');
  assert.deepEqual(h.errors, []);
});

test('every static translation marker has an English translation and select options stay valid', () => {
  const h = harness(); h.click('languageToggle');
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  for (const match of html.matchAll(/data-i18n(?:-aria-label|-title|-alt)?="([^"]+)"/g)) {
    assert.notEqual(h.i18n.t(match[1]), match[1], 'Missing translation: ' + match[1]);
  }
  assert.doesNotMatch(html, /<option[^>]*>\s*</);
});

test('English works with unavailable storage and invalid saved languages default to Hebrew', () => {
  const h = harness(new Map([['eyeTrackingColorMemory.language', 'invalid']]));
  assert.equal(h.node('html').lang, 'he');
  const unavailable = { get() { throw new Error('Storage blocked'); }, set() { throw new Error('Storage blocked'); } };
  const blocked = harness(unavailable);
  blocked.click('languageToggle');
  assert.equal(blocked.node('gameMessage').textContent, 'Five faces. How many can you remember?');
  assert.deepEqual(blocked.errors, []);
});


const flushPromises = () => new Promise(resolve => setImmediate(resolve));

test('sharing a real result gives a friend identical rounds and locked rules, then compares completed length', async () => {
  let copied;
  const h = harness(new Map(), { navigator: { clipboard: { writeText: async text => { copied = text; } } } });
  h.node('difficulty').value = 'advanced';
  h.node('surpriseMode').value = 'confusion';
  const first = h.start();
  h.complete(first.map(color => h.game.snapshot().colorMap.indexOf(color)));
  const second = h.next();
  h.lose(h.game.snapshot().colorMap.indexOf((second[0] + 1) % 5));
  h.click('shareChallenge'); await flushPromises();
  assert.ok(copied.includes('נראה אם תעבור אותי!'));
  const url = new URL(copied.split('\n').at(-1));
  assert.equal(url.origin, 'https://ailoveu.art');
  const friend = harness(new Map(), { search: url.search });
  assert.equal(friend.node('friendChallenge').hidden, false);
  assert.equal(friend.node('difficulty').value, 'advanced');
  assert.equal(friend.node('surpriseMode').value, 'confusion');
  assert.equal(friend.node('difficulty').disabled, true);
  assert.equal(friend.node('dailyButton').disabled, true);
  assert.deepEqual(friend.start(), first);
  friend.complete(first.map(color => friend.game.snapshot().colorMap.indexOf(color)));
  assert.deepEqual(friend.next(), second);
  friend.complete(second.map(color => friend.game.snapshot().colorMap.indexOf(color)));
  const third = friend.next(); friend.lose(friend.game.snapshot().colorMap.indexOf((third[0] + 1) % 5));
  assert.ok(friend.node('friendTarget').textContent.includes('עקפת'));
  friend.click('leaveChallenge');
  assert.equal(friend.node('friendChallenge').hidden, true);
  assert.equal(friend.node('difficulty').disabled, false);
  assert.deepEqual(friend.errors, []);
});

test('shared query parameters are parsed by static pages and hash links are rejected', () => {
  const h = harness();
  const value = { seed: 42, level: 'beginner', mode: 'normal', longest: 5, speed: 781, daily: false };
  const token = h.challenge.encode(value);
  assert.deepEqual(JSON.parse(JSON.stringify(h.challenge.fromLocation({ search: '?challenge=' + token, hash: '' }))), value);
  assert.equal(h.challenge.fromLocation({ search: '', hash: '#challenge=' + token }), null);
  assert.equal(h.challenge.fromLocation({ search: '?challenge=bad', hash: '' }), null);
  assert.equal(h.challenge.decode('#challenge=' + token), null);
});

test('shuffle button labels, accessible names and artwork clicks follow current colors across language switches', () => {
  const h = harness(new Map(), { hitFace: 0 });
  h.node('surpriseMode').value = 'confusion';
  const sequence = h.start(), state = h.game.snapshot();
  const labels = ['טבעי', 'כחול', 'ירוק', 'צהוב', 'כתום'];
  state.colorMap.forEach((color, position) => {
    assert.equal(h.node('face-' + position + '-label').textContent, labels[color]);
    assert.equal(h.node('face-' + position).attributes['aria-label'], labels[color] + ', מקש ' + (position + 1));
  });
  h.click('languageToggle');
  assert.equal(h.node('face-0-label').textContent, ['Natural', 'Blue', 'Green', 'Yellow', 'Orange'][state.colorMap[0]]);
  h.ui.click(10, 20);
  assert.equal(h.game.snapshot().phase, state.colorMap[0] === sequence[0] ? 'input' : 'error');
  assert.deepEqual(h.errors, []);
});

function completedResult(options) {
  const h = harness(new Map(), options);
  h.complete(h.start());
  const next = h.next(); h.lose((next[0] + 1) % 5);
  return h;
}

test('native sharing receives the link and cancelling never silently copies it', async () => {
  let shared, copies = 0;
  const h = completedResult({ navigator: {
    share: async value => { shared = value; throw Object.assign(new Error('cancelled'), { name: 'AbortError' }); },
    clipboard: { writeText: async () => { copies++; } },
  } });
  h.click('shareChallenge'); await flushPromises();
  assert.equal(shared.title, 'זיכרון בצבע');
  assert.ok(h.challenge.decode(new URL(shared.url).search));
  assert.equal(copies, 0);
  assert.equal(h.node('shareLink').hidden, true);
  assert.equal(h.node('shareChallenge').disabled, false);
});

test('blocked or unsupported sharing exposes a selectable link, including without clipboard access', async () => {
  const h = completedResult({ navigator: { share: async () => { throw new Error('blocked'); } } });
  h.click('shareChallenge'); await flushPromises();
  assert.equal(h.node('shareLink').hidden, false);
  assert.ok(h.challenge.decode(new URL(h.node('shareLink').value).search));
  assert.equal(h.node('shareChallenge').disabled, false);
  assert.deepEqual(h.errors, []);
});

test('closing while a share request is pending cannot reopen stale UI or copy on rejection', async () => {
  let reject, copies = 0;
  const h = completedResult({ navigator: {
    share: () => new Promise((_, fail) => { reject = fail; }),
    clipboard: { writeText: async () => { copies++; } },
  } });
  h.click('shareChallenge'); h.click('exitButton'); reject(new Error('blocked'));
  await flushPromises();
  assert.equal(copies, 0);
  assert.equal(h.node('shareLink').hidden, true);
  assert.equal(h.node('gamePanel').hidden, true);
  assert.deepEqual(h.errors, []);
});

test('invalid challenge links cannot inject text, choose arbitrary modes or launch unbounded games', () => {
  const h = harness();
  const value = { seed: 4294967295, level: 'champion', mode: 'confusion', longest: 10, speed: 831, daily: true };
  const token = h.challenge.encode(value);
  assert.deepEqual(JSON.parse(JSON.stringify(h.challenge.decode('?challenge=' + token))), value);
  for (const search of ['', '?challenge=2.' + token.slice(2), '?challenge=' + 'x'.repeat(500),
    '?challenge=1.1.beginner.normal.10001.1.0', '?challenge=1.1.beginner.normal.3.NaN.0',
    '?challenge=1.1.beginner.<script>.3.1.0', '?challenge=1.zzzzzzz.beginner.normal.3.1.0']) {
    assert.equal(h.challenge.decode(search), null);
    const invalid = harness(new Map(), { search });
    assert.equal(invalid.node('friendChallenge').hidden, true);
    assert.deepEqual(invalid.errors, []);
  }
});
