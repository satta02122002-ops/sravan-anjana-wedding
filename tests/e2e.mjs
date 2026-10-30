// Browser checks for the invitation. Needs Playwright (npx playwright install chromium, or a
// preinstalled copy) and the site served locally:
//   python3 -m http.server 8765 --directory deploy &   then   node tests/e2e.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:8765/';

const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

const browser = await chromium.launch();
async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(BASE, { waitUntil: 'load' });
  return { ctx, page, errors };
}
const enter = async page => { await page.click('#enterSilent'); await page.waitForTimeout(1500); };

// 1. Responsive layout at every target width
for (const w of [320, 360, 375, 390, 414, 768, 1024, 1280, 1440]) {
  const { ctx, page, errors } = await open({ viewport: { width: w, height: w < 700 ? 800 : 900 } });
  await enter(page);
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const small = [];
    document.querySelectorAll('a[href],button').forEach(e => {
      const b = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (!b.width || cs.visibility === 'hidden' || e.closest('.film,dialog,.vh') || e.classList.contains('skip')) return;
      if (b.width < 44 || b.height < 44) small.push(`${(e.textContent || e.getAttribute('aria-label')).trim().slice(0, 24)} ${Math.round(b.width)}x${Math.round(b.height)}`);
    });
    return { overflow: document.documentElement.scrollWidth - W, small };
  });
  check(`${w}px: no horizontal overflow`, r.overflow <= 0, r.overflow > 0 ? `${r.overflow}px` : '');
  check(`${w}px: tap targets at least 44x44`, r.small.length === 0, r.small.join(', '));
  check(`${w}px: no console errors or failed requests`, errors.length === 0, errors.join(' | '));
  await ctx.close();
}

// 2. Opening experience never blocks the invitation
{
  const { ctx, page } = await open();
  check('title card offers Enter invitation without waiting', await page.isVisible('#enterSilent'));
  check('scrolling is locked only while the title card is up', await page.evaluate(() => document.documentElement.style.overflow === 'hidden'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
  check('Escape closes the title card', await page.evaluate(() => document.getElementById('film').classList.contains('done') && document.documentElement.style.overflow === ''));
  await page.click('#replay'); await page.waitForTimeout(600);
  check('film shows Skip and a sound control', await page.isVisible('#skipFilm') && await page.isVisible('#filmSound'));
  await page.click('#skipFilm'); await page.waitForTimeout(1500);
  check('Skip film returns to the page', await page.evaluate(() => document.getElementById('film').classList.contains('done')));
  check('music file is not requested until asked for', !(await page.evaluate(() => performance.getEntriesByType('resource').some(e => e.name.endsWith('bgm.mp3')))));
  await ctx.close();
}

// 3. Wedding details are present and correct (as printed on the invitation)
{
  const { ctx, page } = await open();
  await enter(page);
  const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  for (const s of ['Anjana R', 'Sravan E.M.', 'D/o Raveendran P.P. & Malathy Raveendran', 'S/o Murali Edayapurath & Sindu Murali',
    'Sunday, 06 December 2026', '8:00 AM', '10:30 AM', 'Thalikettu Ceremony', 'Sreekrishna Temple', 'Guruvayoor',
    'Wedding Ceremony & Lunch', 'Dream Palace Auditorium', 'Parappur', 'Puthiyaveetil House', 'Edayapurath House, Kodakara, Thrissur',
    'Ranjith Raveendran', 'Roshni Raveendran', 'Meera Ranjith'])
    check(`shows "${s}"`, text.includes(s));
  for (const s of ['Story to come', 'To be confirmed', 'Cochin', 'Dubai'])
    check(`no unverified text "${s}"`, !text.includes(s));
  check('call link uses the number on the card', await page.getAttribute('a[href^="tel:"]', 'href') === 'tel:+919847331705');
  const maps = await page.$$eval('a[href*="google.com/maps"]', as => as.map(a => a.href));
  check('four Google Maps links, two per venue', maps.length === 6 && maps.filter(h => h.includes('Sree+Krishna')).length === 3, `${maps.length} links`);
  check('exactly one h1', (await page.$$('h1')).length === 1);
  check('every image has alt text', await page.$$eval('img', is => is.every(i => i.hasAttribute('alt'))));
  await ctx.close();
}

// 4. Navigation
{
  const { ctx, page } = await open();
  await enter(page);
  await page.click('#menuBtn');
  check('mobile menu opens', await page.isVisible('#links a[href="#venue"]'));
  await page.click('#links a[href="#venue"]');
  // smooth scrolling on a long page takes a couple of seconds: wait until it has moved and then stopped
  await page.waitForFunction(() => {
    const w = window; w.__s = w.__s || { y: -1, n: 0 };
    w.__s.n = scrollY === w.__s.y ? w.__s.n + 1 : 0; w.__s.y = scrollY;
    return scrollY > 0 && w.__s.n >= 5;
  }, null, { polling: 100, timeout: 8000 });
  check('menu link scrolls to its section', await page.evaluate(() => Math.abs(document.getElementById('venue').getBoundingClientRect().top) < 120));
  check('menu closes after choosing', !(await page.isVisible('#links a[href="#venue"]')));
  await ctx.close();
}

// 5. Countdown, including a guest in Dubai and the wedding day itself
{
  const { ctx, page } = await open({ timezoneId: 'Asia/Dubai' });
  await enter(page);
  const d = await page.textContent('#cd-d');
  check('countdown shows a whole number of days', /^\d+$/.test(d), d);
  check('Dubai guest sees the converted time', (await page.textContent('#cd-local')).includes('6:30 AM on Sunday'));
  await ctx.close();
  const k = await open({ timezoneId: 'Asia/Kolkata' });
  check('India guest gets no conversion line', await k.page.isHidden('#cd-local'));
  await k.ctx.close();
  const t = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await t.addInitScript(() => { const fixed = Date.parse('2026-12-06T09:15:00+05:30'); Date.now = () => fixed; });
  const tp = await t.newPage(); await tp.goto(BASE); await tp.click('#enterSilent'); await tp.waitForTimeout(800);
  check('wedding-day message replaces the clock, no negatives', (await tp.textContent('#count-title')) === 'Today is the day' && await tp.isHidden('#clock'));
  await t.close();
}

// 6. Gallery lightbox: keyboard and swipe
{
  const { ctx, page } = await open({ hasTouch: true, isMobile: true });
  await enter(page);
  await page.click('.g[data-i="0"]'); await page.waitForTimeout(500);
  check('lightbox opens on the chosen photo', (await page.textContent('#lbCount')) === '1 / 5');
  await page.keyboard.press('ArrowRight');
  check('arrow key moves to the next photo', (await page.textContent('#lbCount')) === '2 / 5');
  await page.evaluate(() => {
    const lb = document.getElementById('lb');
    const ev = (type, x) => lb.dispatchEvent(new PointerEvent(type, { pointerType: 'touch', clientX: x, clientY: 400, bubbles: true }));
    ev('pointerdown', 300); ev('pointerup', 120);
  });
  check('swiping left moves to the next photo', (await page.textContent('#lbCount')) === '3 / 5');
  check('lightbox image loaded', await page.evaluate(() => new Promise(r => { const i = document.getElementById('lbImg'); i.complete ? r(i.naturalWidth > 0) : i.onload = () => r(true); })));
  await page.keyboard.press('Escape');
  check('Escape closes the lightbox', !(await page.evaluate(() => document.getElementById('lb').open)));
  await ctx.close();
}

// 7. Copy address
{
  const { ctx, page } = await open({ permissions: ['clipboard-read', 'clipboard-write'] });
  await enter(page);
  await page.locator('.copy[data-copy^="Dream"]').scrollIntoViewIfNeeded();
  await page.click('.copy[data-copy^="Dream"]');
  await page.waitForFunction(() => document.getElementById('copyStatus').textContent.length > 0, null, { timeout: 3000 }).catch(() => {});
  check('copy address confirms for screen readers', (await page.textContent('#copyStatus')).includes('Dream Palace Auditorium'));
  await ctx.close();
}

// 8. Reduced motion: the scroll scene becomes a still, short section
{
  const { ctx, page } = await open({ reducedMotion: 'reduce' });
  await enter(page);
  const r = await page.evaluate(() => ({ cls: document.getElementById('union').className, h: document.getElementById('union').offsetHeight, vh: innerHeight }));
  check('reduced motion shows the final embrace without long scrolling', r.cls.includes('static') && r.h <= r.vh * 1.2, `${r.h}px`);
  await ctx.close();
}

await browser.close();
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
