'use strict';

window.EyeTracking = window.EyeTracking || {};
window.EyeTracking.createGameUI = function createGameUI(renderer, motion, onFatalError = () => {}) {
  const app = window.EyeTracking;
  const audio = app.createGameAudio();
  const t = app.i18n.t;
  const element = id => document.getElementById(id);
  const panel = element('gamePanel');
  const play = element('playButton');
  const start = element('startButton');
  const resume = element('resumeButton');
  const exit = element('exitButton');
  const difficulty = element('difficulty');
  const surpriseMode = element('surpriseMode');
  const mute = element('muteButton');
  const vibrateButton = element('vibrateButton');
  const dailyButton = element('dailyButton');
  const challenge = app.challenge;
  const shareButton = element('shareChallenge');
  const shareLink = element('shareLink');
  let friend = challenge.fromLocation(window.location);
  let disposed = false;
  let shareGeneration = 0;
  let shareMessage = '';
  const achievementsCard = panel.querySelector('.achievements-card');
  const keys = [...panel.querySelectorAll('[data-face]')];
  const listeners = [];
  let previousPhase = null;
  let opened = Boolean(friend);
  let dailySelected = friend ? friend.daily : false;
  if (friend) { difficulty.value = friend.level; surpriseMode.value = friend.mode; }
  const achievementKey = 'eyeTrackingColorMemory.achievements';
  const vibrationKey = 'eyeTrackingColorMemory.vibration';
  const supportsVibration = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  const defaultAchievements = () => ({ longest: 0, scoreBest: 0, speedBestMs: null });
  function readStorage(key) {
    try { return window.localStorage.getItem(key); } catch (_) { return null; }
  }
  function writeStorage(key, value) {
    try { window.localStorage.setItem(key, value); } catch (_) { /* private mode */ }
  }
  function readAchievements() {
    try {
      const saved = JSON.parse(readStorage(achievementKey) || '{}');
      const fresh = defaultAchievements();
      Object.keys(fresh).forEach(key => {
        const value = saved[key];
        fresh[key] = key === 'speedBestMs'
          ? (Number.isFinite(value) && value >= 0 ? value : null)
          : (Number.isFinite(value) && value >= 0 ? Math.floor(value) : fresh[key]);
      });
      return fresh;
    } catch (_) { return defaultAchievements(); }
  }
  const achievements = readAchievements();
  let vibrationEnabled = readStorage(vibrationKey) !== 'off';
  function renderAchievements() {
    element('achievementLongest').textContent = achievements.longest ? t('{count} פנים', { count: achievements.longest }) : '—';
    element('achievementScore').textContent = achievements.scoreBest || '—';
    element('achievementSpeed').textContent = Number.isFinite(achievements.speedBestMs)
      ? t('{seconds} שנ׳', { seconds: (achievements.speedBestMs / 1000).toFixed(3) }) : '—';
  }
  function formatSpeed(milliseconds) {
    return Number.isFinite(milliseconds) ? t('{seconds} שנ׳', { seconds: (milliseconds / 1000).toFixed(3) }) : '—';
  }
  function saveAchievements() { writeStorage(achievementKey, JSON.stringify(achievements)); }
  function recordAchievements(state, finalResult) {
    achievements.longest = Math.max(achievements.longest, state.runLongest);
    achievements.scoreBest = Math.max(achievements.scoreBest, state.runMemoryScore || 0);
    // Compare whole-game averages, matching the result card. A single stage's
    // faster average is not the final average for the entire run.
    if (finalResult && state.runLongest > 0 && Number.isFinite(state.runSpeedAvgMs)) {
      achievements.speedBestMs = Number.isFinite(achievements.speedBestMs)
        ? Math.min(achievements.speedBestMs, state.runSpeedAvgMs) : state.runSpeedAvgMs;
    }
    saveAchievements();
    renderAchievements();
  }
  function triggerVibration(pattern) {
    if (vibrationEnabled && supportsVibration) {
      try { navigator.vibrate(pattern); } catch (_) { /* unsupported browser */ }
    }
  }
  function updateVibrationButton() {
    vibrateButton.disabled = !supportsVibration;
    vibrateButton.textContent = t(!supportsVibration ? 'רטט לא זמין' : vibrationEnabled ? 'רטט פעיל' : 'רטט כבוי');
    vibrateButton.setAttribute('aria-pressed', String(vibrationEnabled));
    vibrateButton.setAttribute('aria-label', t(vibrationEnabled ? 'כיבוי רטט' : 'הפעלת רטט'));
  }

  function listen(target, event, handler) {
    const guarded = (...args) => {
      try { handler(...args); }
      catch (error) { onFatalError(error instanceof Error ? error : new Error(String(error))); }
    };
    target.addEventListener(event, guarded);
    listeners.push(() => target.removeEventListener(event, guarded));
  }
  function display(state, languageChanged = false) {
    const idle = state.phase === 'idle';
    const lost = state.phase === 'lost';
    const paused = state.phase === 'paused';
    const input = state.phase === 'input';
    const locked = !idle && !lost;
    // Save before any delayed sound callback: closing or hiding the page right
    // after success must not cancel a newly earned record.
    if (state.phase !== previousPhase && (state.phase === 'success' || lost)) {
      recordAchievements(state, lost);
    }
    panel.dataset.phase = state.phase;
    panel.hidden = !opened;
    play.hidden = opened;
    play.setAttribute('aria-expanded', String(opened));
    document.body.classList.toggle('is-playing', opened);
    renderer.setGameState(opened, state.activeFace, state.colorMap, state.confusion, state.shuffleProgress);
    motion.renderImmediately();
    element('roundValue').textContent = state.round || '—';
    element('lengthValue').textContent = state.length || 3;
    panel.querySelector('.answer-progress').hidden = idle;
    element('answerProgress').textContent = idle ? '' : t('{progress} מתוך {length}', { progress: state.progress, length: state.length });
    const level = app.gameConfig.levels[state.level];
    element('levelCaption').textContent = idle ? '' : (state.daily ? `${t('אתגר יומי')} · ${t(level.label)}` : t(level.label));
    const timed = state.totalMs > 0 && !idle;
    element('timeWrap').hidden = !timed;
    element('timerTrack').hidden = !timed;
    const time = state.remainingMs === null ? state.totalMs : state.remainingMs;
    element('timeValue').textContent = t('{seconds} שנ׳', { seconds: Math.ceil(time / 1000) });
    element('timerFill').style.transform = `scaleX(${timed ? time / state.totalMs : 1})`;
    element('timerTrack').classList.toggle('is-urgent', input && time <= 5000);
    const resultVisible = lost;
    element('resultSummary').hidden = !resultVisible;
    if (resultVisible) {
      element('resultLength').textContent = t('{count} פנים', { count: state.runLongest });
      element('resultScore').textContent = state.runMemoryScore ?? '—';
      element('resultSpeed').textContent = formatSpeed(state.runSpeedAvgMs);
    }
    difficulty.disabled = locked || Boolean(friend);
    difficulty.closest('.level-picker').hidden = locked;
    surpriseMode.disabled = locked || Boolean(friend);
    dailyButton.disabled = locked || Boolean(friend);
    achievementsCard.hidden = locked && !paused;
    start.hidden = locked;
    start.disabled = false;
    start.textContent = t(lost ? 'נסה שוב' : 'התחל משחק');
    resume.hidden = !paused;
    panel.querySelector('.game-controls').hidden = locked && !paused;
    element('friendChallenge').hidden = !friend || locked;
    element('leaveChallenge').disabled = locked;
    if (friend) {
      const outcome = !lost ? 'אותם רצפים, אותם תנאים. היעד: יותר מ־{count} פנים.'
        : state.runLongest > friend.longest ? 'עקפת את החבר! היעד היה {count} פנים.'
        : state.runLongest === friend.longest ? 'תיקו! שניכם השלמתם {count} פנים.'
        : 'עוד ניסיון? היעד של החבר: {count} פנים.';
      element('friendTarget').textContent = t(outcome, { count: friend.longest });
    }
    element('shareControls').hidden = !lost || !challenge.fromState(state);
    element('shareStatus').textContent = shareMessage ? t(shareMessage) : '';
    if (!lost) { shareGeneration++; shareButton.disabled = false; shareLink.hidden = true; shareMessage = ''; }
    keys.forEach((key, index) => {
      const face = app.gameConfig.faces[state.colorMap[index]];
      const label = key.querySelector('[data-i18n]');
      label.dataset.i18n = face.label;
      label.textContent = t(face.label);
      key.style.setProperty('--face-color', face.color);
      const accessible = t('{color}, מקש {key}', { color: t(face.label), key: index + 1 });
      key.setAttribute('aria-label', accessible);
      key.disabled = !input;
      key.classList.toggle('is-active', index === state.activeFace);
    });
    if (state.phase !== previousPhase || languageChanged) {
      const messages = {
        idle: ['חמש פנים. כמה תצליחו לזכור?', 'צפו ברצף, הקשיבו לצלילים וחזרו עליו בלחיצה על הפנים.'],
        playback: ['צפו ברצף', 'הקשיבו וזכרו את הסדר. עוד רגע תורכם.'],
        shuffle: ['הפנים מחליפות צבעים…', 'זכרו את הצבעים, לא את המיקומים.'],
        input: ['עכשיו תורכם', 'לחצו על הפנים לפי הסדר — בתמונה, בכפתורים או במקשים 1–5.'],
        success: ['נכון מאוד!', 'השלב הבא: רצף חדש, ארוך יותר באחד.'],
        error: ['כמעט — זו הייתה טעות', 'הבחירה הנכונה מוארת עכשיו. שימו לב אליה, ואז ננסה שוב.'],
        paused: ['המשחק מושהה', 'בחזרה נציג שוב את הרצף, וזמן התשובה יתחיל מחדש.'],
        lost: [state.failure === 'timeout' ? 'הזמן נגמר' : 'זה לא הסדר הפעם', t('הגעתם לשלב {round}, עם רצף של {length} פנים. ננסה שוב?', { round: state.round, length: state.length })],
      };
      let [message, hint] = messages[state.phase].map(text => t(text));
      if (state.phase === 'playback' && state.soundsOnly) hint = t('הקשיבו בלבד — הפנים לא יוארו בזמן הרצף.');
      if (state.phase === 'playback' && state.reverse) hint += ' ' + t('זכרו: בתורכם לחצו בסדר הפוך.');
      if (state.phase === 'input' && state.reverse) hint = t('לחצו על הפנים לפי הסדר ההפוך שבו שמעתם אותן.');
      if (state.phase === 'playback' && state.confusion) hint = t('זכרו את סדר הצבעים. אחרי ההדגמה הם יעברו לפנים אחרות.');
      if (state.phase === 'input' && state.confusion) hint = t('לחצו על הצבעים שראיתם, במיקומים החדשים שלהם.');
      element('gameMessage').textContent = message;
      element('gameHint').textContent = hint;
      if (lost && !languageChanged) start.focus({ preventScroll: true });
      previousPhase = state.phase;
    }
  }
  const game = app.createSimonGame({ onChange: display,
    onError: onFatalError,
    onCue: (face, ms) => audio.face(face, ms),
    onResult: kind => {
      audio.result(kind);
      if (kind === 'success') triggerVibration([35, 45, 35]);
      if (kind === 'error') triggerVibration(120);
    } });

  function press(face) { audio.unlock(); game.press(face); }
  listen(play, 'click', () => {
    opened = true;
    display(game.snapshot());
    renderer.resize();
    motion.renderImmediately();
    difficulty.focus({ preventScroll: true });
  });
  listen(start, 'click', () => {
    audio.stop(); audio.unlock();
    game.start(friend ? friend.level : difficulty.value, { daily: dailySelected,
      seed: friend ? friend.seed : dailySelected ? app.dailySeed() : challenge.newSeed(),
      mode: friend ? friend.mode : surpriseMode.value });
  });
  listen(exit, 'click', () => {
    audio.stop();
    opened = false;
    game.stop();
    renderer.resize();
    motion.renderImmediately();
    play.focus({ preventScroll: true });
  });
  listen(resume, 'click', () => { audio.unlock(); game.resume(); });
  listen(mute, 'click', () => {
    const muted = !audio.isMuted();
    audio.setMuted(muted);
    mute.setAttribute('aria-pressed', String(muted));
    mute.setAttribute('aria-label', t(muted ? 'הפעלת צלילים' : 'השתקת צלילים'));
    mute.textContent = t(muted ? 'צליל מושתק' : 'צליל פעיל ♪');
  });
  listen(vibrateButton, 'click', () => {
    if (!supportsVibration) return;
    vibrationEnabled = !vibrationEnabled;
    writeStorage(vibrationKey, vibrationEnabled ? 'on' : 'off');
    updateVibrationButton();
    if (vibrationEnabled) triggerVibration(25);
  });
  listen(dailyButton, 'click', () => {
    dailySelected = !dailySelected;
    dailyButton.setAttribute('aria-pressed', String(dailySelected));
    dailyButton.textContent = t('אתגר יומי') + (dailySelected ? ' ✓' : '');
  });
  listen(element('leaveChallenge'), 'click', () => {
    friend = null;
    dailySelected = false;
    dailyButton.setAttribute('aria-pressed', 'false');
    dailyButton.textContent = t('אתגר יומי');
    try { window.history.replaceState(null, '', window.location.pathname + window.location.search); } catch (_) { /* file:// may restrict history. */ }
    audio.stop();
    game.stop();
  });
  listen(shareButton, 'click', () => {
    // Invoke native sharing inside the click gesture; handle every rejection.
    const value = challenge.fromState(game.snapshot());
    if (!value) return;
    const version = ++shareGeneration;
    const url = challenge.url(value);
    shareLink.value = url;
    const modeLabel = { normal: 'רגיל', reverse: 'רצף הפוך', sounds: 'צלילים בלבד', both: 'הפוך + צלילים בלבד', confusion: 'בלבול צבעים' }[value.mode];
    const text = t('זכרתי {count} פנים בזיכרון בצבע, ברמת {level}, במצב {mode}. נראה אם תעבור אותי!',
      { count: value.longest, level: t(app.gameConfig.levels[value.level].label), mode: t(modeLabel) })
      + (value.speed === null ? '' : ' ' + t('מהירות הזיכרון שלי: {seconds} שניות.', { seconds: (value.speed / 1000).toFixed(3) }));
    shareButton.disabled = true;
    const current = () => !disposed && shareGeneration === version;
    function message(key) {
      if (!current()) return;
      shareMessage = key;
      element('shareStatus').textContent = t(key);
    }
    async function fallback() {
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(`${text}\n${url}`);
        message('האתגר הועתק! הדביקו ושלחו לחבר.');
      } catch (_) {
        if (!current()) return;
        shareLink.hidden = false;
        shareLink.focus(); shareLink.select();
        message('העתיקו את הקישור ושלחו לחבר.');
      }
    }
    async function send() {
      if (typeof navigator.share === 'function') {
        try { await navigator.share({ title: t('זיכרון בצבע'), text, url }); }
        catch (error) { if (error?.name !== 'AbortError' && current()) await fallback(); }
      } else await fallback();
    }
    send().catch(error => { if (current()) onFatalError(error); })
      .finally(() => { if (current()) shareButton.disabled = false; });
  });
  keys.forEach((key, index) => listen(key, 'click', () => press(index)));
  listen(window, 'keydown', event => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey
        || event.target.matches('select, input, textarea')) return;
    if (opened && /^[1-5]$/.test(event.key) && game.snapshot().phase === 'input') {
      event.preventDefault();
      press(Number(event.key) - 1);
    }
  });
  // The panel can wrap when controls change or text is zoomed.
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(() => {
    try {
      renderer.resize(); motion.renderImmediately();
    } catch (error) { onFatalError(error instanceof Error ? error : new Error(String(error))); }
  }) : null;
  observer?.observe(panel);
  observer?.observe(element('gameHud'));
  const unsubscribeLanguage = app.i18n.subscribe(() => {
    try {
      renderAchievements();
      updateVibrationButton();
      const muted = audio.isMuted();
      mute.textContent = t(muted ? 'צליל מושתק' : 'צליל פעיל ♪');
      mute.setAttribute('aria-label', t(muted ? 'הפעלת צלילים' : 'השתקת צלילים'));
      dailyButton.textContent = t('אתגר יומי') + (dailySelected ? ' ✓' : '');
      display(game.snapshot(), true);
      renderer.resize(); motion.renderImmediately();
    } catch (error) { onFatalError(error); }
  });
  renderAchievements();
  updateVibrationButton();
  dailyButton.setAttribute('aria-pressed', String(dailySelected));
  dailyButton.textContent = t('אתגר יומי') + (dailySelected ? ' ✓' : '');
  display(game.snapshot());
  play.disabled = false;

  return {
    isActive: () => opened,
    click(clientX, clientY) {
      const face = renderer.hitFace(clientX, clientY);
      if (face !== -1) press(face);
    },
    setVisible(visible) {
      if (!visible) { game.pause(); audio.stop(); }
      else { audio.unlock(); game.resume(); }
    },
    destroy() { disposed = true; shareGeneration++; unsubscribeLanguage(); observer?.disconnect(); listeners.forEach(remove => remove()); game.destroy(); audio.destroy(); },
  };
};
