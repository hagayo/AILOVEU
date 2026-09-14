const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function systems() {
  const scope = { window: {} };
  vm.createContext(scope);
  for (const file of ['config', 'utils', 'game-config', 'water']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', `${file}.js`), 'utf8'), scope);
  }
  return scope.window.EyeTracking;
}

test('orange face water fills, stays full, then drains only after a second click', () => {
  const app = systems();
  const water = app.createWaterSystem();
  assert.equal(water.emitAt(130, 700, true), true);
  assert.equal(water.hasActive(), true);
  water.update(2.39);
  assert.equal(water.hasActive(), true);
  water.update(0.02); // reaches the top and waits for another click
  assert.equal(water.hasActive(), false);
  assert.equal(water.requestDrain(), true);
  assert.equal(water.hasActive(), true);
  water.update(2.1);
  assert.equal(water.hasActive(), false);
  assert.equal(water.requestDrain(), false);
  assert.equal(water.emitAt(240, 650, true), false);
});
