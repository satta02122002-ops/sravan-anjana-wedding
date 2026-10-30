# Changelog

## Unreleased: audit and enhancement (branch `claude/jolly-galileo-kngrtm`)

### Structure and performance
- Split the 1.5 MB single file into `index.html`, `css/site.css`, `js/*.js` and `assets/`.
- Images moved out of base64 into AVIF/WebP/JPEG; 8 embedded copies merged into 6 sources; width/height set; lazy loading; responsive hero `srcset` with preload.
- Film backgrounds load after the page; the music file is only requested when someone asks for music (no more 404 on every visit).
- Measured on a simulated slow-4G phone: LCP 5.4 s → 1.5 s, data 1.49 MB → 0.29 MB, CLS 0.014.

### Design system
- Tokens for colour, type, spacing, surfaces and tap size; approved palette with forest green for the countdown band and footer.
- Fonts reduced from 4 families to 3: Cormorant Garamond (headings), Jost (body and labels), Pinyon Script (accents).

### Opening experience
- Title card: "Tap to open" plus a visible **Enter invitation** button and a "30-second film, skip any time" hint; Escape closes it.
- During the film: **Sound on/off** control and **Skip film**; buttons are 44px.
- No-JavaScript fallback hides the film so the invitation is always readable.

### Countdown
- Logic moved to `js/countdown.js`: never negative; shows "Today is the day" from 8:00 AM IST on 06 Dec, "Happily married" from 07 Dec IST.
- Guests outside India see the Muhurtham in their own time (e.g. "6:30 AM on Sunday" in Dubai); replaces the fixed Dubai sentence.

### Content (matched to the printed invitation)
- Welcome uses the card's wording and adds a tap-to-call button for 98473 31705.
- Our Story: three chapters (The First Hello / Two Families, One Bond / A New Beginning) using only facts from the card.
- Events: one name per ceremony ("Thalikettu Ceremony", "Wedding Ceremony & Lunch") and the card's wording.
- Removed unverified text: "Story to come", dress code "To be confirmed", temple dress-customs line, travel tips (airport, rail, between venues), Dubai note.

### Venues and gallery
- Copy-address buttons with screen-reader confirmation; map links get descriptive accessible names.
- Lightbox: swipe on touch screens, photo counter, opens the largest image; no empty `src`.

### Accessibility and SEO
- 44px tap targets for logo, nav links and icon buttons; one `h1`; `[hidden]` always hides.
- Open Graph / WhatsApp preview image, canonical URL, theme colour, favicon and touch icon, richer event structured data.
- Cloudflare `_headers` for caching and basic security headers.

### Tests
- `tests/countdown.test.js` (8 tests) and `tests/e2e.mjs` (73 browser checks).
