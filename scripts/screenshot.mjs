// Visual QA: screenshots of the local dev site in light/dark and mobile.
import { chromium } from 'playwright';

const out = process.argv[2] || '/tmp/shots';
const base = 'http://localhost:8787';
const browser = await chromium.launch();

async function shot(name, opts = {}) {
  const ctx = await browser.newContext({
    viewport: opts.viewport || { width: 1440, height: 950 },
    colorScheme: opts.colorScheme || 'light',
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: opts.fullPage !== false });
  if (errors.length) console.log(`[${name}] JS errors:`, errors);
  await ctx.close();
}

await shot('desktop-light');
await shot('desktop-dark', { colorScheme: 'dark' });
await shot('mobile', { viewport: { width: 390, height: 844 } });
await browser.close();
console.log('done');
