const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const output = path.join(process.env.TEMP || '/tmp', 'faces-challenge-checks');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.BROWSER_CHANNEL || 'chrome' });
  let server;
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    // Automated checks never contact analytics or publish/share a real result.
    await context.route('**/*', route => /^(file:|http:\/\/127\.0\.0\.1:)/.test(route.request().url()) ? route.continue() : route.abort());
    await context.addInitScript(() => {
      window.qa = { cues: [], states: [], shares: [] };
      const app = window.EyeTracking = {};
      let factory;
      Object.defineProperty(app, 'createSimonGame', {
        get: () => options => {
          qa.game = factory({ ...options,
            onChange: state => { qa.state = state; qa.states.push(state); options.onChange(state); },
            onCue: (color, ms) => { qa.cues.push({ color, ms }); options.onCue(color, ms); } });
          return qa.game;
        }, set: value => { factory = value; },
      });
      Object.defineProperty(navigator, 'share', { configurable: true, value: async data => { qa.shares.push(data); } });
      const draw = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
        if (image.naturalWidth === 1024 && args.length === 4) qa.view = { x: args[0], y: args[1], scale: args[2] / 1024 };
        return draw.call(this, image, ...args);
      };
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install();
    const query = '?challenge=1.9ix.advanced.confusion.3.831.0';
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href + query);
    await page.waitForFunction(() => !document.getElementById('playButton').disabled);
    await page.clock.pauseAt(new Date(await page.evaluate(() => Date.now() + 100)));
    await page.clock.runFor(100);
    assert.equal(await page.locator('#gamePanel').isVisible(), true);
    assert.equal(await page.locator('#friendChallenge').isVisible(), true);
    assert.equal(await page.locator('#difficulty').isDisabled(), true);
    async function stage() {
      const before = await page.evaluate(() => qa.cues.length);
      const state = await page.evaluate(() => qa.state);
      const cueMs = Math.max(600, 1000 - (state.round - 1) * 25);
      await page.clock.runFor(650 + state.length * (cueMs + 300));
      assert.equal(await page.evaluate(() => qa.state.phase), 'shuffle');
      assert.equal(await page.locator('[data-face="0"]').isDisabled(), true);
      await page.clock.runFor(800);
      assert.equal(await page.evaluate(() => qa.state.phase), 'input');
      assert.equal(await page.evaluate(() => qa.state.remainingMs), state.length * 10000);
      return page.evaluate(before => qa.cues.slice(before).map(cue => cue.color), before);
    }
    await page.locator('#startButton').click();
    await page.screenshot({ path: path.join(output, 'desktop-before-shuffle.png') });
    const first = await stage();
    const firstMap = await page.evaluate(() => qa.state.colorMap);
    await page.screenshot({ path: path.join(output, 'desktop-after-shuffle.png') });
    assert.ok(firstMap.every((color, i) => color !== i));
    const centers = [[860,650],[580,650],[390,650],[250,650],[150,650]];
    for (const color of first) {
      const position = firstMap.indexOf(color);
      const point = await page.evaluate(([x,y]) => ({ x: qa.view.x + x * qa.view.scale, y: qa.view.y + y * qa.view.scale }), centers[position]);
      await page.mouse.click(point.x, point.y);
    }
    assert.equal(await page.evaluate(() => qa.state.phase), 'success', 'Real artwork clicks resolve by color');
    await page.clock.runFor(1150);
    const second = await stage();
    const secondMap = await page.evaluate(() => qa.state.colorMap);
    await page.keyboard.press(String(secondMap.indexOf((second[0] + 1) % 5) + 1));
    assert.equal(await page.evaluate(() => qa.state.activeFace), secondMap.indexOf(second[0]));
    await page.clock.runFor(2500);
    assert.equal(await page.locator('#shareControls').isVisible(), true);
    await page.locator('#shareChallenge').click();
    const shared = await page.evaluate(() => qa.shares[0]);
    assert.ok(shared.url.startsWith('https://ailoveu.art/lab/eye-track-simon/index.html?challenge='));
    await page.screenshot({ path: path.join(output, 'friend-result-he.png') });
    // Real second visitor, with independent storage and the shared link payload.
    const friend = await context.newPage();
    await friend.clock.install();
    await friend.goto(pathToFileURL(path.join(root, 'index.html')).href + new URL(shared.url).search);
    await friend.waitForFunction(() => !document.getElementById('playButton').disabled);
    await friend.clock.pauseAt(new Date(await friend.evaluate(() => Date.now() + 100)));
    await friend.locator('#startButton').click();
    await friend.clock.runFor(650 + 3 * 1300 + 800);
    assert.deepEqual(await friend.evaluate(() => qa.cues.map(c => c.color)), first);
    assert.deepEqual(await friend.evaluate(() => qa.state.colorMap), firstMap);
    await friend.close();
    await page.locator('#leaveChallenge').click();
    await page.locator('#exitButton').click();
    assert.equal(await page.locator('#gamePanel').isVisible(), false);
    for (const size of [{width:390,height:844},{width:320,height:640},{width:844,height:390}]) {
      await page.setViewportSize(size);
      await page.waitForTimeout(60); await page.clock.runFor(100);
      await page.locator('#playButton').click();
      for (const language of ['he', 'en']) {
        await page.evaluate(language => EyeTracking.i18n.setLanguage(language), language);
        await page.clock.runFor(100);
        const layout = await page.evaluate(() => {
          const buttons = ['muteButton', 'vibrateButton', 'exitButton'].map(id => document.getElementById(id).getBoundingClientRect().toJSON());
          const panel = document.getElementById('gamePanel');
          return { buttons, panel: panel.getBoundingClientRect().toJSON(), scrollWidth: panel.scrollWidth, clientWidth: panel.clientWidth };
        });
        assert.ok(layout.buttons.every(button => Math.abs(button.top - layout.buttons[0].top) < 1), 'Header controls stay on one line');
        assert.ok(layout.buttons.every(button => button.left >= layout.panel.left && button.right <= layout.panel.right));
        assert.ok(layout.scrollWidth <= layout.clientWidth, 'No horizontal overflow');
        await page.screenshot({path:path.join(output, `header-${language}-${size.width}x${size.height}.png`)});
      }
      await page.locator('#surpriseMode').selectOption('confusion');
      await page.locator('#startButton').click();
      await page.clock.runFor(650 + 3 * 1300 + 400);
      assert.equal(await page.evaluate(() => qa.state.phase), 'shuffle');
      await page.locator('#exitButton').click();
      const count = await page.evaluate(() => qa.states.length);
      await page.clock.runFor(10000);
      assert.equal(await page.evaluate(() => qa.states.length), count, 'Close during swap cancels every transition');
      assert.deepEqual(await page.evaluate(() => qa.state.colorMap), [0,1,2,3,4]);
    }
    assert.deepEqual(errors, []);
    // Same feature under the project's actual strict CSP, without a build.
    const csp = fs.readFileSync(path.join(root, '.htaccess'), 'utf8').match(/Content-Security-Policy "([^"]+)"/)[1];
    server = http.createServer((req,res) => {
      const requested = new URL(req.url, 'http://localhost').pathname;
      const file = path.resolve(root, '.' + (requested === '/' ? '/index.html' : requested));
      if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
      fs.readFile(file, (error,data) => {
        if (error) { res.writeHead(404).end(); return; }
        res.setHeader('Content-Security-Policy', csp);
        res.setHeader('Content-Type', {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png'}[path.extname(file)] || 'application/octet-stream');
        res.end(data);
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    await page.goto(`http://127.0.0.1:${server.address().port}/${query}`);
    await page.waitForFunction(() => !document.getElementById('playButton').disabled);
    await page.locator('#startButton').click(); await stage();
    assert.deepEqual(errors, []);
    console.log('PASS: friend links, exact seeded rounds, color-mapped artwork/keyboard input, correction, sharing, close during swap, HE/EN mobile headers, file:// and HTTP with CSP.');
    console.log('Visual evidence: ' + output);
  } finally { await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
