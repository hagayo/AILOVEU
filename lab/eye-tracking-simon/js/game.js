'use strict';

window.EyeTracking = window.EyeTracking || {};

// No DOM, audio or canvas dependencies: the same rules run in browser and tests.
window.EyeTracking.createSimonGame = function createSimonGame(options = {}) {
  const config = window.EyeTracking.gameConfig;
  const now = options.now || (() => performance.now());
  const setTimer = options.setTimer || ((fn, ms) => window.setTimeout(fn, ms));
  const clearTimer = options.clearTimer || (id => window.clearTimeout(id));
  const defaultRandom = options.random || Math.random;
  let random = defaultRandom;
  const change = options.onChange || (() => {});
  const cue = options.onCue || (() => {});
  const result = options.onResult || (() => {});
  const onError = options.onError || (() => {});
  const timers = new Set();
  let generation = 0;
  let flash = 0;
  let destroyed = false;
  let phase = 'idle';
  let level = 'beginner';
  let round = 0;
  let sequence = [];
  let progress = 0;
  let activeFace = null;
  let deadline = null;
  let remainingMs = null;
  let failure = null;
  let daily = false;
  let reverse = false;
  let soundsOnly = false;
  let confusion = false;
  let mode = 'normal';
  let seed = null;
  const identity = () => config.faces.map((_, index) => index);
  let colorMap = identity();
  let answerMap = identity();
  let shuffleProgress = 1;
  let inputStartedAt = null;
  let lastInputAt = null;
  let reactionTimes = [];
  let stageRecorded = false;
  let runLongest = 0;
  let runSpeedTotalMs = 0;
  let runSpeedCount = 0;

  function snapshot() {
    return { phase, level, round, length: sequence.length, progress, activeFace,
      remainingMs, failure, daily, reverse, soundsOnly, confusion, mode, seed,
      colorMap: [...colorMap], shuffleProgress,
      reactionAvgMs: reactionTimes.length ? reactionTimes.reduce((sum, value) => sum + value, 0) / reactionTimes.length : null,
      runLongest, runMemoryScore: runLongest ? Math.min(10, Math.max(1, runLongest - 2)) : null,
      runSpeedAvgMs: runSpeedCount ? runSpeedTotalMs / runSpeedCount : null,
      totalMs: config.levels[level].secondsPerFace * sequence.length * 1000 };
  }
  function reportError(error) {
    try { onError(error instanceof Error ? error : new Error(String(error))); } catch (_) { /* Error reporting must not crash the game. */ }
  }
  function publish() {
    try { change(snapshot()); } catch (error) { reportError(error); }
  }
  function cancelTimers() {
    generation++;
    flash++;
    timers.forEach(clearTimer);
    timers.clear();
  }
  function later(fn, ms) {
    const version = generation;
    try {
      const id = setTimer(() => {
        timers.delete(id);
        if (!destroyed && generation === version) {
          try { fn(); } catch (error) { reportError(error); }
        }
      }, ms);
      timers.add(id);
    } catch (error) { reportError(error); }
  }
  function newSequence(length) {
    const previous = sequence;
    sequence = Array.from({ length }, () => Math.floor(random() * config.faces.length));
    // A newly generated stage must not be the previous sequence plus one face,
    // even with an unlucky (or deterministic) random source.
    if (previous.length && previous.every((face, i) => sequence[i] === face)) {
      const index = Math.floor(random() * previous.length);
      sequence[index] = (sequence[index] + 1 + Math.floor(random() * (config.faces.length - 1))) % config.faces.length;
    }
    answerMap = identity();
    // Sattolo's shuffle moves every color, without retries or fixed positions.
    if (confusion) for (let i = answerMap.length - 1; i > 0; i--) {
      const j = Math.floor(random() * i);
      [answerMap[i], answerMap[j]] = [answerMap[j], answerMap[i]];
    }
  }
  function fail(reason) {
    cancelTimers();
    recordCurrentStage();
    phase = 'lost';
    failure = reason;
    activeFace = null;
    if (reason === 'timeout') remainingMs = 0;
    deadline = null;
    result('error');
    publish();
  }
  function revealWrongAnswer() {
    cancelTimers();
    recordCurrentStage();
    phase = 'error';
    failure = 'wrong';
    // Illuminate the face the player was expected to press at this position.
    const ordered = reverse ? [...sequence].reverse() : sequence;
    activeFace = colorMap.indexOf(ordered[progress]);
    deadline = null;
    remainingMs = null;
    result('error');
    publish();
    later(() => cue(ordered[progress], 600), 350);
    later(() => {
      phase = 'lost';
      activeFace = null;
      publish();
    }, config.errorRevealMs);
  }
  function tick() {
    if (phase !== 'input' || deadline === null) return;
    remainingMs = Math.max(0, deadline - now());
    if (remainingMs === 0) { fail('timeout'); return; }
    publish();
    later(tick, Math.min(100, remainingMs));
  }
  function beginInput() {
    phase = 'input';
    activeFace = null;
    progress = 0;
    const duration = config.levels[level].secondsPerFace * sequence.length * 1000;
    remainingMs = duration || null;
    deadline = duration ? now() + duration : null;
    inputStartedAt = lastInputAt = now();
    reactionTimes = [];
    stageRecorded = false;
    publish();
    if (deadline !== null) later(tick, 100);
  }
  function shuffleColors() {
    if (!confusion) { beginInput(); return; }
    phase = 'shuffle';
    colorMap = [...answerMap];
    shuffleProgress = 0;
    const startedAt = now();
    function step() {
      shuffleProgress = Math.min(1, (now() - startedAt) / config.shuffleMs);
      publish();
      if (shuffleProgress < 1) later(step, 40);
      else beginInput();
    }
    step();
  }
  function showFace(index) {
    // Playback always shows the generated sequence in its natural order.
    // Reverse mode changes only the order expected during the input phase.
    const face = sequence[index];
    activeFace = soundsOnly ? null : face;
    const baseCueMs = config.levels[level].cueMs || config.cueMs;
    const cueMs = Math.max(600, baseCueMs - Math.max(0, round - 1) * 25);
    cue(face, cueMs);
    publish();
    later(() => {
      activeFace = null;
      publish();
      later(() => {
        if (index + 1 < sequence.length) showFace(index + 1);
        else shuffleColors();
      }, config.gapMs);
    }, cueMs);
  }
  function playback() {
    cancelTimers();
    phase = 'playback';
    colorMap = identity();
    shuffleProgress = 1;
    progress = 0;
    deadline = null;
    remainingMs = null;
    activeFace = null;
    publish();
    later(() => showFace(0), config.leadInMs);
  }
  function advanceRound() {
    round++;
    runLongest = Math.max(runLongest, sequence.length);
    newSequence(sequence.length + 1);
  }
  function recordCurrentStage() {
    if (stageRecorded || !reactionTimes.length) return;
    const total = reactionTimes.reduce((sum, value) => sum + value, 0);
    runSpeedTotalMs += total;
    runSpeedCount += reactionTimes.length;
    stageRecorded = true;
  }
  function start(selectedLevel = level, settings = {}) {
    if (destroyed || !config.levels[selectedLevel]) return;
    cancelTimers();
    seed = Number.isInteger(settings.seed) && settings.seed >= 0 && settings.seed <= 4294967295 ? settings.seed : null;
    random = seed !== null ? window.EyeTracking.createSeededRandom(seed)
      : typeof settings.random === 'function' ? settings.random : defaultRandom;
    daily = Boolean(settings.daily);
    mode = ['normal', 'reverse', 'sounds', 'both', 'confusion'].includes(settings.mode) ? settings.mode : 'normal';
    confusion = mode === 'confusion';
    reverse = settings.mode === 'reverse' || settings.mode === 'both';
    soundsOnly = settings.mode === 'sounds' || settings.mode === 'both';
    level = selectedLevel;
    round = 1;
    sequence = [];
    failure = null;
    runLongest = 0;
    runSpeedTotalMs = 0;
    runSpeedCount = 0;
    reactionTimes = [];
    stageRecorded = false;
    inputStartedAt = lastInputAt = null;
    newSequence(config.initialLength);
    playback();
  }
  function press(face) {
    if (destroyed || phase !== 'input' || !Number.isInteger(face) || !config.faces[face]) return false;
    // Check the real deadline as well as timer ticks, including throttled tabs.
    if (deadline !== null && now() >= deadline) { fail('timeout'); return false; }
    const ordered = reverse ? [...sequence].reverse() : sequence;
    const color = colorMap[face];
    cue(color, config.feedbackMs);
    const pressedAt = now();
    if (lastInputAt !== null) reactionTimes.push(Math.max(0, pressedAt - lastInputAt));
    lastInputAt = pressedAt;
    if (color !== ordered[progress]) { revealWrongAnswer(); return false; }
    progress++;
    activeFace = face;
    if (progress === sequence.length) {
      cancelTimers();
      runLongest = Math.max(runLongest, sequence.length);
      recordCurrentStage();
      if (deadline !== null) remainingMs = Math.max(0, deadline - now());
      deadline = null;
      phase = 'success';
      publish();
      later(() => { activeFace = null; publish(); result('success'); }, config.feedbackMs);
      later(() => { advanceRound(); playback(); }, config.successMs);
    } else {
      const currentFlash = ++flash;
      publish();
      later(() => {
        if (currentFlash === flash) { activeFace = null; publish(); }
      }, config.feedbackMs);
    }
    return true;
  }
  function pause() {
    if (!['playback', 'shuffle', 'input', 'success', 'error'].includes(phase)) return;
    // A completed stage stays completed even if the tab hides during its chime.
    if (phase === 'success') advanceRound();
    cancelTimers();
    phase = 'paused';
    activeFace = null;
    deadline = null;
    remainingMs = null;
    publish();
  }
  function resume() { if (!destroyed && phase === 'paused') playback(); }
  function stop() {
    cancelTimers();
    phase = 'idle';
    round = 0;
    sequence = [];
    progress = 0;
    daily = false;
    random = defaultRandom;
    reverse = soundsOnly = false;
    confusion = false;
    mode = 'normal';
    seed = null;
    colorMap = answerMap = identity();
    shuffleProgress = 1;
    inputStartedAt = lastInputAt = null;
    reactionTimes = [];
    stageRecorded = false;
    runLongest = runSpeedTotalMs = runSpeedCount = 0;
    activeFace = deadline = remainingMs = failure = null;
    publish();
  }
  return {
    start, press, pause, resume, stop, snapshot,
    destroy() { cancelTimers(); destroyed = true; },
  };
};
