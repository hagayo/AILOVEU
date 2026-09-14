'use strict';

window.EyeTracking = window.EyeTracking || {};

window.EyeTracking.createBubbleSystem = function createBubbleSystem() {
  const config = window.EyeTracking.config.bubbles;
  const utils = window.EyeTracking.utils;
  let particles = [];
  let cooldown = 0;

  function emitAt(x, y, reducedMotion) {
    if (!utils.pointInPolygon(x, y, config.faceOutline) || cooldown > 0) {
      return false;
    }
    const both = Math.random() < 0.6;
    const firstNostril = Math.random() < 0.5 ? 0 : 1;
    const count = Math.min(reducedMotion ? 4 : config.burstCount, config.maxActive - particles.length);
    if (!count) {
      return false;
    }
    cooldown = config.cooldown;
    for (let i = 0; i < count; i++) {
      const nostrilIndex = both ? (firstNostril + i) % 2 : firstNostril;
      const origin = config.nostrils[nostrilIndex];
      particles.push({
        originX: origin.x,
        originY: origin.y,
        age: -i * config.emissionInterval,
        lifetime: reducedMotion ? 1.25 : utils.randomBetween(config.minLifetime, config.maxLifetime),
        radius: utils.randomBetween(config.minRadius, config.maxRadius),
        riseSpeed: reducedMotion ? 12 : utils.randomBetween(35, 55),
        driftSpeed: reducedMotion ? 0 : utils.randomBetween(3, 9) * (nostrilIndex ? 1 : -1),
        sway: reducedMotion ? 0 : utils.randomBetween(4, 10),
        phase: Math.random() * Math.PI * 2,
      });
    }
    return true;
  }

  function update(dt) {
    cooldown = Math.max(0, cooldown - dt);
    particles.forEach(bubble => { bubble.age += dt; });
    particles = particles.filter(bubble => bubble.age < bubble.lifetime);
  }

  function draw(ctx, viewport) {
    if (!particles.length) {
      return;
    }
    ctx.save();
    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.scale, viewport.scale);
    for (const bubble of particles) {
      if (bubble.age < 0) {
        continue;
      }
      const progress = bubble.age / bubble.lifetime;
      const emerge = utils.clamp(bubble.age / 0.24, 0, 1);
      const fade = 1 - utils.clamp((progress - 0.65) / 0.35, 0, 1);
      const radius = bubble.radius * (0.3 + 0.7 * utils.easeOutCubic(emerge)) * (1 + progress * 0.12);
      const x = bubble.originX + bubble.driftSpeed * bubble.age
        + bubble.sway * (Math.sin(bubble.age * 1.8 + bubble.phase) - Math.sin(bubble.phase));
      const y = bubble.originY - bubble.riseSpeed * bubble.age;

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = emerge * fade;
      const film = ctx.createRadialGradient(-radius * 0.3, -radius * 0.4, 0, 0, 0, radius);
      film.addColorStop(0, 'rgba(235, 252, 255, 0.12)');
      film.addColorStop(0.65, 'rgba(206, 241, 255, 0.025)');
      film.addColorStop(0.9, 'rgba(217, 186, 255, 0.13)');
      film.addColorStop(1, 'rgba(225, 254, 255, 0.38)');
      ctx.fillStyle = film;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();

      const rim = ctx.createLinearGradient(-radius, -radius, radius, radius);
      rim.addColorStop(0, 'rgba(239, 255, 255, 0.85)');
      rim.addColorStop(0.3, 'rgba(165, 239, 255, 0.65)');
      rim.addColorStop(0.58, 'rgba(250, 179, 223, 0.48)');
      rim.addColorStop(0.8, 'rgba(252, 235, 166, 0.62)');
      rim.addColorStop(1, 'rgba(191, 255, 231, 0.75)');
      ctx.strokeStyle = rim;
      ctx.lineWidth = 0.65;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 0.85;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.77, Math.PI * 1.12, Math.PI * 1.42);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  return {
    emitAt,
    update,
    draw,
    hasActive: () => particles.length > 0,
    clear() { particles = []; cooldown = 0; },
  };
};
