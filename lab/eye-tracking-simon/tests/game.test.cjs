const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness(random = () => 0, hooks = {}) {
  const scope = { window: {}, performance: { now: () => time } };
  vm.createContext(scope);
  for (const file of ['config', 'game-config', 'game']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', `${file}.js`), 'utf8'), scope);
  }
  let time = 0, nextId = 0;
  const tasks = new Map(), cues = [], changes = [], results = [];
  const config = scope.window.EyeTracking.gameConfig;
  const game = scope.window.EyeTracking.createSimonGame({ random, now: () => time,
    setTimer(fn, delay) { const id = ++nextId; tasks.set(id, { fn, time: time + delay }); return id; },
    clearTimer: id => tasks.delete(id),
    onCue: hooks.onCue || ((face, duration) => cues.push({ face, duration, time })),
    onError: hooks.onError,
    onChange: state => changes.push(state), onResult: kind => results.push(kind) });
  function advance(ms) {
    const end = time + ms;
    while (true) {
      const first = [...tasks].sort((a,b) => a[1].time - b[1].time)[0];
      if (!first || first[1].time > end) break;
      tasks.delete(first[0]); time = first[1].time; first[1].fn();
    }
    time = end;
  }
  function playback() {
    const start = cues.length;
    const state = game.snapshot();
    const cueMs = config.levels[state.level].cueMs || config.cueMs;
    advance(config.leadInMs + state.length * (cueMs + config.gapMs));
    assert.equal(game.snapshot().phase, 'input');
    return cues.slice(start).map(c => c.face);
  }
  return { game, config, advance, playback, cues, changes, results, tasks,
    dailyRandom: scope.window.EyeTracking.createDailyRandom,
    jumpWithoutTimers(ms) { time += ms; } };
}

test('starts with 3 faces; 1.2-second cues and gaps distinguish consecutive repeats; playback rejects input', () => {
  const h = harness(); h.game.start();
  assert.equal(h.game.press(0), false);
  const sequence = h.playback();
  assert.deepEqual(sequence, [0,0,0]);
  assert.equal(h.cues[0].duration, 1200);
  assert.equal(h.cues[1].time - h.cues[0].time, 1500);
  assert.ok(h.changes.some(s => s.phase === 'playback' && s.activeFace === null));
});

test('every success replaces the sequence and adds one face; even constant RNG cannot extend the old prefix', () => {
  const h = harness(); h.game.start(); let sequence = h.playback();
  for (let round = 1; round <= 12; round++) {
    sequence.forEach(face => assert.equal(h.game.press(face), true));
    assert.equal(h.game.snapshot().phase, 'success');
    assert.equal(h.game.press(sequence[0]), false);
    h.advance(h.config.successMs);
    const next = h.playback();
    assert.equal(next.length, sequence.length + 1);
    assert.notDeepEqual(next.slice(0, sequence.length), sequence);
    assert.equal(h.game.snapshot().round, round + 1);
    sequence = next;
  }
  assert.equal(h.results.filter(r => r === 'success').length, 12);
});

test('beginners have no time limit', () => {
  const h = harness(); h.game.start('beginner'); h.playback(); h.advance(3600000);
  assert.equal(h.game.snapshot().phase, 'input');
  assert.equal(h.game.snapshot().remainingMs, null);
});

test('higher levels show faces faster, with a gentle speed-up on later stages', () => {
  const beginner = harness(); beginner.game.start('beginner'); beginner.playback();
  const advanced = harness(); advanced.game.start('advanced'); advanced.playback();
  const champion = harness(); champion.game.start('champion'); champion.playback();
  assert.ok(advanced.cues[0].duration < beginner.cues[0].duration);
  assert.ok(champion.cues[0].duration < advanced.cues[0].duration);
  const sequence = champion.cues.slice(0, 3).map(cue => cue.face);
  sequence.forEach(face => champion.game.press(face));
  champion.advance(champion.config.successMs);
  champion.playback();
  assert.ok(champion.cues[3].duration < champion.cues[0].duration);
});

test('daily random uses the same sequence seed for the same local date', () => {
  const date = new Date(2026, 8, 10, 12);
  const randomFactory = harness().dailyRandom;
  const a = randomFactory(date);
  const b = randomFactory(new Date(2026, 8, 10, 23));
  assert.deepEqual(Array.from({ length: 8 }, () => a()), Array.from({ length: 8 }, () => b()));
  const c = randomFactory(new Date(2026, 8, 11, 12));
  const d = randomFactory(date);
  assert.notDeepEqual(Array.from({ length: 4 }, () => c()), Array.from({ length: 4 }, () => d()));
});

test('surprise modes reverse the expected order and can hide visual playback cues', () => {
  const values = [0, 0.2, 0.4];
  const reverse = harness(() => values.shift() ?? 0);
  reverse.game.start('beginner', { mode: 'reverse' });
  const shown = reverse.playback();
  assert.deepEqual(shown, [0, 1, 2]);
  shown.slice().reverse().forEach(face => assert.equal(reverse.game.press(face), true));
  assert.equal(reverse.game.snapshot().phase, 'success');
  const sounds = harness(() => 0);
  sounds.game.start('beginner', { mode: 'sounds' });
  sounds.playback();
  assert.ok(sounds.cues.length > 0);
  assert.ok(sounds.changes.filter(state => state.phase === 'playback').every(state => state.activeFace === null));
});

test('reaction average measures the time between the start and each correct answer', () => {
  const h = harness(); h.game.start(); const sequence = h.playback();
  h.advance(1000); h.game.press(sequence[0]);
  h.advance(250); h.game.press(sequence[1]);
  h.advance(500); h.game.press(sequence[2]);
  assert.equal(h.game.snapshot().reactionAvgMs, 1750 / 3);
  assert.equal(h.game.snapshot().runLongest, 3);
  assert.equal(h.game.snapshot().runMemoryScore, 1);
  assert.equal(h.game.snapshot().runSpeedAvgMs, 1750 / 3);
});

test('timer callback errors are routed to the game error boundary', () => {
  const errors = [];
  const h = harness(() => 0, {
    onCue: () => { throw new Error('cue failed'); },
    onError: error => errors.push(error.message),
  });
  h.game.start();
  h.advance(h.config.leadInMs);
  assert.deepEqual(errors, ['Error: cue failed']);
});

for (const [level, seconds] of [['advanced', 10], ['champion', 5]]) {
  test(`${level}: full length × ${seconds} seconds starts after playback, never resets on a click`, () => {
    const h = harness(); h.game.start(level); const sequence = h.playback();
    assert.equal(h.game.snapshot().remainingMs, 3 * seconds * 1000);
    h.advance(2000); h.game.press(sequence[0]);
    assert.equal(h.game.snapshot().remainingMs, 3 * seconds * 1000 - 2000);
    h.advance(3 * seconds * 1000 - 2000);
    assert.equal(h.game.snapshot().phase, 'lost');
    assert.equal(h.game.snapshot().failure, 'timeout');
    assert.deepEqual(h.results, ['error']);
  });
}

test('late input cannot beat a delayed timeout callback', () => {
  const h = harness(); h.game.start('champion'); const sequence = h.playback();
  h.jumpWithoutTimers(15001); assert.equal(h.game.press(sequence[0]), false);
  assert.equal(h.game.snapshot().failure, 'timeout');
});

test('wrong face fails once; invalid face and extra face do nothing; retry starts at 3', () => {
  const h = harness(); h.game.start(); const sequence = h.playback();
  [-1,5,NaN,1.5,null].forEach(face => assert.equal(h.game.press(face), false));
  assert.equal(h.game.snapshot().progress, 0);
  h.game.press((sequence[0] + 1) % 5);
  assert.equal(h.game.snapshot().phase, 'error');
  assert.equal(h.game.snapshot().failure, 'wrong');
  assert.equal(h.game.snapshot().activeFace, sequence[0]);
  assert.deepEqual(h.results, ['error']);
  h.advance(h.config.errorRevealMs - 1);
  assert.equal(h.game.snapshot().phase, 'error');
  assert.equal(h.game.press(sequence[0]), false);
  h.advance(1);
  assert.equal(h.game.snapshot().phase, 'lost');
  h.game.press(sequence[0]); h.advance(20000);
  assert.deepEqual(h.results, ['error']);
  h.game.start('advanced'); assert.equal(h.game.snapshot().round, 1); h.playback();
  assert.equal(h.game.snapshot().length, 3);
});

test('pause during playback cancels stale cues and replays the same complete sequence', () => {
  const h = harness(); h.game.start(); h.advance(800); h.game.pause();
  const count = h.cues.length; h.advance(300000);
  assert.equal(h.cues.length, count); assert.equal(h.game.snapshot().phase, 'paused');
  h.game.resume(); assert.deepEqual(h.playback(), [0,0,0]);
});

test('pause during input resets answers and grants the full timer only after replay', () => {
  const h = harness(); h.game.start('champion'); const sequence = h.playback();
  h.advance(10000); h.game.press(sequence[0]); h.game.pause(); h.advance(50000);
  h.game.resume(); assert.deepEqual(h.playback(), sequence);
  assert.equal(h.game.snapshot().progress, 0);
  assert.equal(h.game.snapshot().remainingMs, 15000);
});

test('a success stays completed if the tab hides before the next stage', () => {
  const h = harness(); h.game.start(); h.playback().forEach(h.game.press);
  h.game.pause(); h.game.resume(); const next = h.playback();
  assert.equal(h.game.snapshot().round, 2); assert.equal(next.length, 4);
});

test('restart, exit and destroy cancel outstanding playback, feedback and deadline work', () => {
  const h = harness(); h.game.start(); h.advance(900); h.game.stop();
  const count = h.cues.length; h.advance(90000); assert.equal(h.cues.length, count);
  assert.equal(h.game.snapshot().phase, 'idle');
  h.game.start('advanced'); const sequence = h.playback(); h.game.press(sequence[0]);
  h.game.destroy(); const changes = h.changes.length; h.advance(90000);
  assert.equal(h.changes.length, changes); assert.equal(h.tasks.size, 0);
});


test('color shuffle moves every color, blocks input until finished and starts the full clock afterward', () => {
  const h = harness(); h.game.start('champion', { mode: 'confusion', seed: 9182 });
  h.advance(650 + 3 * (800 + 300));
  let state = h.game.snapshot();
  assert.equal(state.phase, 'shuffle');
  assert.equal(state.remainingMs, null);
  assert.equal(h.game.press(0), false);
  assert.ok(state.colorMap.every((color, position) => color !== position));
  assert.deepEqual([...state.colorMap].sort(), [0, 1, 2, 3, 4]);
  h.advance(799); assert.equal(h.game.snapshot().phase, 'shuffle');
  h.advance(1); state = h.game.snapshot();
  assert.equal(state.phase, 'input'); assert.equal(state.remainingMs, 15000);
  const sequence = h.cues.map(cue => cue.face);
  sequence.forEach(color => { h.advance(200); assert.equal(h.game.press(state.colorMap.indexOf(color)), true); });
  assert.equal(h.game.snapshot().phase, 'success');
  assert.equal(h.game.snapshot().reactionAvgMs, 200, 'Animation time is not reaction time');
  assert.deepEqual(h.cues.slice(3).map(cue => cue.face), sequence, 'Sound follows color, not physical face');
});

test('clicking the remembered position in shuffle mode fails and reveals the color at its new position', () => {
  const h = harness(); h.game.start('beginner', { mode: 'confusion', seed: 13 });
  h.advance(650 + 3 * 1500 + 800);
  const color = h.cues[0].face, map = h.game.snapshot().colorMap;
  assert.equal(h.game.press(color), false);
  assert.equal(h.game.snapshot().phase, 'error');
  assert.equal(h.game.snapshot().activeFace, map.indexOf(color));
  h.advance(350); assert.equal(h.cues.at(-1).face, color, 'Correction plays the expected color note');
});

test('seeded friend games replay all rounds and shuffles identically, including after pause', () => {
  const a = harness(), b = harness();
  for (const h of [a, b]) h.game.start('advanced', { seed: 123456789, mode: 'confusion' });
  for (let round = 1; round <= 4; round++) {
    const sequences = [];
    for (const h of [a, b]) {
      const start = h.cues.length;
      const state = h.game.snapshot();
      h.advance(650 + state.length * (Math.max(600, 1000 - (round - 1) * 25) + 300) + 800);
      sequences.push(h.cues.slice(start).map(cue => cue.face));
    }
    assert.deepEqual(sequences[0], sequences[1]);
    assert.deepEqual([...a.game.snapshot().colorMap], [...b.game.snapshot().colorMap]);
    const map = [...b.game.snapshot().colorMap];
    b.game.pause(); b.advance(10000); b.game.resume();
    b.advance(650 + sequences[1].length * (Math.max(600, 1000 - (round - 1) * 25) + 300) + 800);
    assert.deepEqual([...b.game.snapshot().colorMap], map, 'Resume cannot reroll the colors');
    [a, b].forEach((h, i) => {
      sequences[i].forEach(color => assert.equal(h.game.press(h.game.snapshot().colorMap.indexOf(color)), true));
      h.advance(h.config.successMs);
    });
  }
});

test('close, restart and pause during color animation cancel stale transitions', () => {
  for (const operation of ['stop', 'start', 'pause', 'destroy']) {
    const h = harness(); h.game.start('advanced', { seed: 1, mode: 'confusion' });
    h.advance(650 + 3 * 1300 + 320);
    assert.equal(h.game.snapshot().phase, 'shuffle');
    const map = [...h.game.snapshot().colorMap];
    if (operation === 'start') h.game.start('beginner', { seed: 2 });
    else h.game[operation]();
    const count = h.changes.length;
    h.advance(400);
    if (operation !== 'start') assert.equal(h.changes.length, count);
    if (operation === 'stop' || operation === 'start') assert.deepEqual([...h.game.snapshot().colorMap], [0,1,2,3,4]);
    if (operation === 'pause') {
      h.game.resume(); h.advance(650 + 3 * 1300 + 800);
      assert.equal(h.game.snapshot().phase, 'input');
      assert.deepEqual([...h.game.snapshot().colorMap], map);
    }
  }
});
