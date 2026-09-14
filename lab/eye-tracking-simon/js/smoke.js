'use strict';

window.EyeTracking = window.EyeTracking || {};

window.EyeTracking.createSmokeSystem = function createSmokeSystem() {
  const config = window.EyeTracking.config.smoke;
  const utils = window.EyeTracking.utils;
  let particles = [];
  let cooldown = 0;

  // Cache a soft, uneven cloud; overlapping expanding clouds form a continuous
  // plume without hard circular edges or per-frame blur filters.
  const cloud = document.createElement('canvas');
  cloud.width = cloud.height = 96;
  const cloudCtx = cloud.getContext('2d');
  for (const [x, y, radius, opacity] of [
    [47, 48, 39, 0.6], [34, 43, 29, 0.38],
    [60, 36, 27, 0.34], [55, 63, 28, 0.32],
  ]) {
    const softness = cloudCtx.createRadialGradient(x, y, 0, x, y, radius);
    softness.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    softness.addColorStop(0.35, `rgba(255, 255, 255, ${opacity * 0.65})`);
    softness.addColorStop(0.7, `rgba(255, 255, 255, ${opacity * 0.16})`);
    softness.addColorStop(1, 'rgba(255, 255, 255, 0)');
    cloudCtx.fillStyle = softness;
    cloudCtx.fillRect(0, 0, 96, 96);
  }

  function emitAt(x, y, reducedMotion) {
    if (!utils.pointInPolygon(x, y, config.faceOutline) || cooldown > 0) {
      return false;
    }
    const count = Math.min(reducedMotion ? 8 : config.burstCount, config.maxActive - particles.length);
    if (!count) {
      return false;
    }
    // Equal chances of left, right, or both nostrils for each click.
    const outlet = Math.floor(Math.random() * 3);
    const plumePhase = Math.random() * Math.PI * 2;
    cooldown = config.cooldown;
    for (let i = 0; i < count; i++) {
      const nostrilIndex = outlet === 2 ? i % 2 : outlet;
      const origin = config.nostrils[nostrilIndex];
      particles.push({
        originX: origin.x,
        originY: origin.y,
        age: -i * config.emissionInterval,
        lifetime: reducedMotion ? 1.6 : utils.randomBetween(config.minLifetime, config.maxLifetime),
        radius: utils.randomBetween(3, 5),
        expansion: reducedMotion ? 5 : utils.randomBetween(6, 10),
        riseSpeed: reducedMotion ? 10 : utils.randomBetween(29, 40),
        driftSpeed: reducedMotion ? 0 : utils.randomBetween(2, 5) * (nostrilIndex ? 1 : -1),
        sway: reducedMotion ? 0 : utils.randomBetween(5, 11),
        phase: plumePhase + nostrilIndex * 0.7,
        rotation: Math.random() * Math.PI * 2,
        spin: utils.randomBetween(-0.3, 0.3),
        opacity: utils.randomBetween(0.23, 0.34),
      });
    }
    return true;
  }

  function update(dt) {
    cooldown = Math.max(0, cooldown - dt);
    particles.forEach(puff => { puff.age += dt; });
    particles = particles.filter(puff => puff.age < puff.lifetime);
  }

  function draw(ctx, viewport) {
    if (!particles.length) {
      return;
    }
    ctx.save();
    ctx.translate(viewport.offsetX, viewport.offsetY);
    ctx.scale(viewport.scale, viewport.scale);
    for (const puff of particles) {
      if (puff.age < 0) {
        continue;
      }
      const progress = puff.age / puff.lifetime;
      const emerge = utils.clamp(puff.age / 0.18, 0, 1);
      const fade = (1 - progress) ** 1.6;
      const radius = puff.radius + puff.expansion * puff.age;
      const x = puff.originX + puff.driftSpeed * puff.age
        + puff.sway * (Math.sin(puff.age * 1.4 + puff.phase) - Math.sin(puff.phase));
      const y = puff.originY - puff.riseSpeed * puff.age - puff.age * puff.age * 1.3;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(puff.rotation + puff.spin * puff.age);
      ctx.globalAlpha = puff.opacity * emerge * fade;
      ctx.drawImage(cloud, -radius, -radius * 1.2, radius * 2, radius * 2.4);
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
