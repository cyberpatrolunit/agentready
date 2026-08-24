// Opens a headed Chromium with a persistent profile + CDP port so a later
// script can connect and automate the logged-in session.
import { chromium } from 'playwright';

const userDataDir = process.argv[2];
const ctx = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: null,
  args: ['--remote-debugging-port=9222', '--window-size=1280,900'],
});
const page = ctx.pages()[0] || (await ctx.newPage());
await page.goto('https://gumroad.com/login');
console.log('Browser open at gumroad.com/login — waiting (close the window to end).');
// Keep process alive until the browser is closed by the user or TaskStop.
await new Promise((resolve) => ctx.on('close', resolve));
console.log('Browser closed.');
