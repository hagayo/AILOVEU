'use strict';

window.EyeTracking = window.EyeTracking || {};
// Version 1 freezes the seed algorithm, stage rules and color shuffles. Bump
// the version if these rules change; never silently replay a different game.
window.EyeTracking.challenge = (function () {
  const site = 'https://ailoveu.art/lab/eye-track-simon/index.html';
  const modes = ['normal', 'reverse', 'sounds', 'both', 'confusion'];
  function valid(value) {
    return value && Number.isInteger(value.seed) && value.seed >= 0 && value.seed <= 4294967295
      && ['beginner', 'advanced', 'champion'].includes(value.level) && modes.includes(value.mode)
      && Number.isInteger(value.longest) && value.longest >= 3 && value.longest <= 10000
      && (value.speed === null || (Number.isInteger(value.speed) && value.speed >= 0 && value.speed <= 86400000))
      && typeof value.daily === 'boolean';
  }
  function encode(value) {
    if (!valid(value)) throw new Error('Invalid challenge');
    return ['1', value.seed.toString(36), value.level, value.mode, value.longest,
      value.speed === null ? '-' : value.speed, value.daily ? '1' : '0'].join('.');
  }
  function decode(serialized) {
    if (typeof serialized !== 'string' || serialized.length > 200 || !serialized.startsWith('?challenge=')) return null;
    const parts = serialized.slice(11).split('.');
    if (parts.length !== 7 || parts[0] !== '1' || !/^[0-9a-z]{1,7}$/.test(parts[1])
        || !/^\d{1,5}$/.test(parts[4]) || !/^(\d{1,8}|-)$/.test(parts[5]) || !/^[01]$/.test(parts[6])) return null;
    const value = { seed: parseInt(parts[1], 36), level: parts[2], mode: parts[3],
      longest: Number(parts[4]), speed: parts[5] === '-' ? null : Number(parts[5]), daily: parts[6] === '1' };
    return valid(value) ? value : null;
  }
  function fromLocation(location) {
    const search = typeof location?.search === 'string' ? location.search : '';
    const match = search.match(/[?&]challenge=([^&]*)/);
    if (match) {
      try { return decode(`?challenge=${decodeURIComponent(match[1])}`); } catch (_) { return null; }
    }
    return null;
  }
  function fromState(state) {
    const value = { seed: state.seed, level: state.level, mode: state.mode,
      longest: state.runLongest, speed: state.runSpeedAvgMs === null ? null : Math.round(state.runSpeedAvgMs), daily: state.daily };
    return valid(value) ? value : null;
  }
  function newSeed() {
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
      return window.crypto.getRandomValues(new Uint32Array(1))[0];
    }
    return Math.floor(Math.random() * 4294967296);
  }
  return { decode, encode, fromLocation, fromState, newSeed,
    url: value => `${site}?challenge=${encode(value)}` };
}());
