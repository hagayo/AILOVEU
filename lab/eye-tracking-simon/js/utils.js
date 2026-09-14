'use strict';

window.EyeTracking = window.EyeTracking || {};

window.EyeTracking.utils = (function createUtils() {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function easeInCubic(value) {
    return value * value * value;
  }

  function easeOutCubic(value) {
    const inverse = 1 - value;
    return 1 - inverse * inverse * inverse;
  }

  function pointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [xi, yi] = points[i];
      const [xj, yj] = points[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      let settled = false;

      function cleanup() {
        image.removeEventListener('load', handleLoad);
        image.removeEventListener('error', handleError);
      }

      function handleLoad() {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        resolve(image);
      }

      function handleError() {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        reject(new Error(`Unable to load required image: ${src}`));
      }

      image.addEventListener('load', handleLoad);
      image.addEventListener('error', handleError);
      image.src = src;

      if (image.complete && image.naturalWidth > 0) {
        handleLoad();
      }
    });
  }

  function supportsPassiveEvents() {
    let supported = false;
    try {
      const options = Object.defineProperty({}, 'passive', {
        get() {
          supported = true;
          return false;
        },
      });
      window.addEventListener('passive-test', null, options);
      window.removeEventListener('passive-test', null, options);
    } catch (error) {
      supported = false;
    }
    return supported;
  }

  return {
    clamp,
    lerp,
    randomBetween,
    easeInCubic,
    easeOutCubic,
    pointInPolygon,
    loadImage,
    passiveOptions: supportsPassiveEvents() ? { passive: true } : false,
  };
}());
