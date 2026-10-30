# Anjana & Sravan · wedding invitation

Live site: https://anjana-sravan.satteches.com/ (Cloudflare, served from `deploy/`).

Plain HTML, CSS and JavaScript: no framework, no build step, no npm packages.

## Layout

```
deploy/                 ← everything Cloudflare serves
  index.html            page markup (content lives here)
  css/site.css          design tokens at the top, then one block per section
  js/countdown.js       countdown + time-zone logic, no DOM (unit-tested)
  js/main.js            menu, countdown display, film, music, gallery, copy address
  js/union.js           scroll-driven bride & groom scene
  assets/img/           photos as .avif / .webp / .jpg (browser picks the best)
  assets/icons/         favicon and home-screen icon
  _headers              Cloudflare caching and security headers
  bgm.mp3               optional background track (not committed; falls back to generated music)
tests/
  countdown.test.js     node --test tests/*.test.js
  e2e.mjs               browser checks (Playwright), see below
index.html, images/     the earlier pink version, kept for reference, not deployed
```

## Running locally

```bash
python3 -m http.server 8765 --directory deploy
```

Then open http://localhost:8765/.

## Tests

```bash
node --test tests/*.test.js
```

```bash
node tests/e2e.mjs
```

The second command needs the local server running and Playwright available (`npx playwright install chromium`). It checks 9 screen widths for overflow and 44px tap targets, console errors, the opening film, navigation, every wedding detail from the printed invitation, the countdown (India, Dubai, wedding day), the gallery lightbox (keys and swipe), copy address and reduced motion.

## Editing content

All wedding wording is in `deploy/index.html` and matches the printed invitation. The one deliberately open item is marked `<!-- EDITABLE -->`: Our Story, chapter i ("The First Hello").

## Design tokens

Defined at the top of `deploy/css/site.css`: ivory `#F4EFE4`, antique gold `#856A3D`, forest green `#354B3C`, burgundy `#642F32`. Headings are Cormorant Garamond, body text Jost, accents Pinyon Script.
