'use strict';

window.EyeTracking = window.EyeTracking || {};

window.EyeTracking.createWaterSystem = function createWaterSystem() {
  const config = window.EyeTracking.config.water;
  const utils = window.EyeTracking.utils;
  let water = null;
  let cooldown = 0;

  function orangeFace() {
    return window.EyeTracking.gameConfig.faces[4].outline;
  }

  function emitAt(x, y, reducedMotion) {
    if (water || !utils.pointInPolygon(x, y, orangeFace()) || cooldown > 0) {
      return false;
    }
    water = {
      phase: 'fill',
      level: 0,
      age: 0,
      fillDuration: reducedMotion ? 2.4 : config.fillDuration,
      drainDuration: reducedMotion ? 2.1 : config.drainDuration,
      wavePhase: Math.random() * Math.PI * 2,
    };
    cooldown = config.cooldown;
    return true;
  }

  function update(dt) {
    cooldown = Math.max(0, cooldown - dt);
    if (!water) return;
    if (water.phase === 'hold') return;
    water.age += dt;
    const duration = water.phase === 'fill' ? water.fillDuration : water.drainDuration;
    const progress = utils.clamp(water.age / duration, 0, 1);
    if (water.phase === 'fill') {
      water.level = progress;
      if (progress >= 1) {
        water.phase = 'hold';
        water.age = 0;
      }
    } else {
      water.level = 1 - progress;
      if (progress >= 1) water = null;
    }
  }

  function draw(ctx, viewport) {
    if (!water) return;
    const level = utils.clamp(water.level, 0, 1);
    const surfaceY = viewport.height * (1 - level);
    const faucetX = viewport.offsetX + config.faucet.x * viewport.scale;
    const faucetY = viewport.offsetY + config.faucet.y * viewport.scale;
    const wave = Math.sin(water.age * 2.1 + water.wavePhase) * 2.2;

    ctx.save();
    // A broad, uneven ribbon reads as a small stream instead of a straight
    // line. It stops once the screen is full and stays still until clicked.
    if (water.phase === 'fill' && surfaceY > faucetY + 3) {
      const midY = (faucetY + surfaceY) / 2;
      const wobble = Math.sin(water.age * 3.4) * viewport.scale * 5;
      const streamWidth = Math.max(5, viewport.scale * 10);
      const stream = ctx.createLinearGradient(faucetX, faucetY, faucetX, surfaceY);
      stream.addColorStop(0, 'rgba(225, 251, 255, 0.76)');
      stream.addColorStop(0.42, 'rgba(141, 220, 242, 0.48)');
      stream.addColorStop(1, 'rgba(74, 164, 202, 0.18)');
      ctx.fillStyle = stream;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(faucetX - streamWidth * 0.28, faucetY);
      ctx.bezierCurveTo(faucetX - streamWidth * 0.9 + wobble, midY * 0.72 + faucetY * 0.28,
        faucetX - streamWidth * 0.65 - wobble, midY * 0.28 + surfaceY * 0.72,
        faucetX - streamWidth * 0.52, surfaceY);
      ctx.lineTo(faucetX + streamWidth * 0.52, surfaceY);
      ctx.bezierCurveTo(faucetX + streamWidth * 0.8 + wobble, midY * 0.28 + surfaceY * 0.72,
        faucetX + streamWidth * 0.9 - wobble, midY * 0.72 + faucetY * 0.28,
        faucetX + streamWidth * 0.28, faucetY);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 0.52;
      ctx.strokeStyle = 'rgba(235, 253, 255, 0.82)';
      ctx.lineWidth = Math.max(1.2, viewport.scale * 2);
      ctx.lineCap = 'round';
      for (const offset of [-0.26, 0.22]) {
        ctx.beginPath();
        ctx.moveTo(faucetX + offset * streamWidth, faucetY + 2);
        ctx.bezierCurveTo(faucetX + offset * streamWidth + wobble * 0.45, midY,
          faucetX + offset * streamWidth - wobble * 0.55, midY + (surfaceY - faucetY) * 0.5,
          faucetX + offset * streamWidth, surfaceY);
        ctx.stroke();
      }
    }

    if (level > 0.002) {
      const fill = ctx.createLinearGradient(0, surfaceY, 0, viewport.height);
      fill.addColorStop(0, `rgba(187, 235, 247, ${config.opacity * 1.14})`);
      fill.addColorStop(0.38, `rgba(83, 178, 207, ${config.opacity * 0.88})`);
      fill.addColorStop(1, `rgba(27, 107, 138, ${config.opacity * 0.72})`);
      ctx.globalAlpha = 1;
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(0, surfaceY + wave);
      for (let x = 0; x <= viewport.width; x += 18) {
        ctx.lineTo(x, surfaceY + wave + Math.sin(x * 0.025 + water.wavePhase + water.age * 1.4) * 2.3);
      }
      ctx.lineTo(viewport.width, viewport.height);
      ctx.lineTo(0, viewport.height);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = 'rgba(224, 250, 255, 0.7)';
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      ctx.moveTo(0, surfaceY + wave);
      for (let x = 0; x <= viewport.width; x += 18) {
        ctx.lineTo(x, surfaceY + wave + Math.sin(x * 0.025 + water.wavePhase + water.age * 1.4) * 2.3);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  return {
    emitAt,
    requestDrain() {
      if (!water || water.phase !== 'hold') return false;
      water.phase = 'drain';
      water.age = 0;
      return true;
    },
    update,
    draw,
    hasActive: () => Boolean(water && water.phase !== 'hold'),
    clear() { water = null; cooldown = 0; },
  };
};
