/* Wedding countdown logic, kept free of the DOM so it can be unit-tested (tests/countdown.test.js).
   Works as a plain browser script (window.WeddingCountdown) and as a CommonJS module. */
(function (root) {
  // Muhurtham: Sunday 06 December 2026, 08:00 Asia/Kolkata (UTC+05:30)
  const WEDDING = Date.parse('2026-12-06T08:00:00+05:30');
  // The wedding-day message shows until midnight in India, then "married" takes over
  const DAY_END = Date.parse('2026-12-07T00:00:00+05:30');
  const IST = 'Asia/Kolkata';

  /** Remaining time split into whole units; never negative. */
  function countdown(now, target = WEDDING, dayEnd = DAY_END) {
    const ms = target - now;
    if (ms > 0) {
      let r = Math.floor(ms / 1000);
      const s = r % 60; r = (r - s) / 60;
      const m = r % 60; r = (r - m) / 60;
      const h = r % 24;
      return { phase: 'countdown', d: (r - h) / 24, h, m, s };
    }
    return { phase: now < dayEnd ? 'today' : 'after', d: 0, h: 0, m: 0, s: 0 };
  }

  /** The Muhurtham in the guest's own time zone, e.g. "6:30 AM on Sunday",
      or null when the guest is already on India time. */
  function localTime(timeZone, target = WEDDING, locale = 'en-US') {
    const at = tz => {
      const time = new Intl.DateTimeFormat(locale, { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(target);
      const day = new Intl.DateTimeFormat(locale, { timeZone: tz, weekday: 'long' }).format(target);
      return `${time.replace(/\s+/g, ' ')} on ${day}`; // normalise the narrow no-break space some engines emit
    };
    let mine;
    try { mine = at(timeZone); } catch (e) { return null; }
    return mine === at(IST) ? null : mine;
  }

  const api = { WEDDING, DAY_END, countdown, localTime };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.WeddingCountdown = api;
})(typeof window !== 'undefined' ? window : globalThis);
