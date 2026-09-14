'use strict';

window.EyeTracking = window.EyeTracking || {};
window.EyeTracking.createGameAudio = function createGameAudio() {
  let context = null;
  let muted = false;
  let destroyed = false;
  let generation = 0;
  const voices = new Set();

  function unlock() {
    if (destroyed) return Promise.resolve();
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return Promise.resolve();
      if (!context) context = new Audio();
      return context.state === 'suspended' ? context.resume().catch(() => {}) : Promise.resolve();
    } catch (error) { return Promise.resolve(); }
  }
  function stop() {
    generation++;
    voices.forEach(voice => {
      try { voice.stop(); } catch (error) { /* Already ended. */ }
      voice.disconnect();
    });
    voices.clear();
  }
  function tone(frequency, duration, delay = 0, type = 'sine', endFrequency = frequency) {
    if (muted || destroyed) return;
    const version = generation;
    unlock().then(() => {
      if (muted || destroyed || version !== generation || context?.state !== 'running') return;
      const start = context.currentTime + delay;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.035, start + duration * 0.65);
      gain.gain.linearRampToValueAtTime(0, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      voices.add(oscillator);
      oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(start);
      oscillator.stop(start + duration + 0.015);
    });
  }
  return {
    unlock, stop,
    face(index, ms) { tone(window.EyeTracking.gameConfig.faces[index].frequency, ms / 1000); },
    result(kind) {
      if (kind === 'error') { stop(); tone(155, 0.32, 0, 'triangle', 80); }
      else { [523.25, 659.25, 783.99].forEach((hz, i) => tone(hz, 0.15, i * 0.12)); }
    },
    setMuted(value) { muted = Boolean(value); if (muted) stop(); else unlock(); },
    isMuted: () => muted,
    destroy() { stop(); destroyed = true; if (context) context.close().catch(() => {}); },
  };
};
