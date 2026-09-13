// Optional integration check: requires Playwright and Chrome; writes a WebM to the supplied path.
const { chromium } = require('playwright');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, acceptDownloads: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      // Model the visibility event and suspended animation callbacks of a background tab.
      window.testHidden = false;
      Object.defineProperty(document, 'hidden', { get: () => window.testHidden });
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = callback => raf(function tick(now) {
        if (window.testHidden) raf(tick);
        else callback(now);
      });
    });
    await page.goto(pathToFileURL(path.resolve(__dirname, '../index.html')).href);
    await page.evaluate(() => {
      document.querySelectorAll('details').forEach(el => { el.open = true; });
      document.getElementById('automationButton').click();
      document.getElementById('recordButton').click();
    });
    await page.waitForTimeout(2200);
    await page.evaluate(() => { window.testHidden = true; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(3000);
    await page.evaluate(() => { window.testHidden = false; document.dispatchEvent(new Event('visibilitychange')); });
    await page.waitForTimeout(2200);
    const downloadPromise = page.waitForEvent('download');
    await page.evaluate(() => document.getElementById('recordButton').click());
    const download = await downloadPromise;
    const output = path.resolve(process.argv[2] || 'recording-check.webm');
    await download.saveAs(output);
    await page.waitForFunction(() => document.getElementById('recordButton').textContent === 'Record WebM');
    assert.deepEqual(errors, []);
    const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
      '-show_entries', 'packet=pts_time:format=duration', '-of', 'json', output], { encoding: 'utf8' }));
    const timestamps = probe.packets.map(packet => Number(packet.pts_time));
    const duration = timestamps.at(-1);
    const maxGap = Math.max(...timestamps.slice(1).map((time, i) => time - timestamps[i]));
    assert.ok(duration > 3 && duration < 5.5, `Hidden time leaked into video: ${duration}s`);
    assert.ok(maxGap < 0.5, `Frozen-frame timestamp gap: ${maxGap}s`);
    const declaredDuration = Number(probe.format.duration);
    assert.ok(Number.isFinite(declaredDuration), 'Missing duration metadata');
    assert.ok(declaredDuration >= duration && declaredDuration - duration < 0.5,
      `Incorrect declared duration: ${declaredDuration}s vs final packet ${duration}s`);
    console.log(JSON.stringify({ saved: output, duration, declaredDuration, maxGap, errors }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
