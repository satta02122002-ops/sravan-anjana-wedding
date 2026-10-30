// Run with: node --test tests/*.test.js   (Node 18+, no packages needed)
const test = require('node:test');
const assert = require('node:assert/strict');
const { WEDDING, countdown, localTime } = require('../deploy/js/countdown.js');

const at = iso => Date.parse(iso);

test('target is 06 Dec 2026 08:00 India time (02:30 UTC)', () => {
  assert.equal(new Date(WEDDING).toISOString(), '2026-12-06T02:30:00.000Z');
});

test('counts whole days, hours, minutes and seconds', () => {
  assert.deepEqual(countdown(at('2026-12-05T06:58:59+05:30')), { phase: 'countdown', d: 1, h: 1, m: 1, s: 1 });
  assert.deepEqual(countdown(at('2026-10-30T08:00:00+05:30')), { phase: 'countdown', d: 37, h: 0, m: 0, s: 0 });
});

test('the same instant gives the same answer whatever the guest clock zone', () => {
  // 06:30 in Dubai and 08:00 in Kolkata are the same moment: one hour before is identical
  assert.deepEqual(countdown(at('2026-12-06T05:30:00+04:00')), countdown(at('2026-12-06T07:00:00+05:30')));
  assert.deepEqual(countdown(at('2026-12-06T01:30:00Z')), { phase: 'countdown', d: 0, h: 1, m: 0, s: 0 });
});

test('one second before the Muhurtham', () => {
  assert.deepEqual(countdown(WEDDING - 1000), { phase: 'countdown', d: 0, h: 0, m: 0, s: 1 });
});

test('never goes negative: zero switches to the wedding-day message', () => {
  for (const t of [WEDDING, WEDDING + 1, at('2026-12-06T23:59:59+05:30')]) {
    const r = countdown(t);
    assert.equal(r.phase, 'today');
    assert.ok([r.d, r.h, r.m, r.s].every(v => v === 0));
  }
});

test('after the wedding day in India it reads as married', () => {
  assert.equal(countdown(at('2026-12-07T00:00:00+05:30')).phase, 'after');
  assert.equal(countdown(at('2027-01-01T00:00:00Z')).phase, 'after');
});

test('local time for guests outside India', () => {
  assert.equal(localTime('Asia/Kolkata'), null);
  assert.equal(localTime('Asia/Calcutta'), null);
  assert.equal(localTime('Asia/Dubai'), '6:30 AM on Sunday');
  assert.equal(localTime('Europe/London'), '2:30 AM on Sunday');
  assert.equal(localTime('America/New_York'), '9:30 PM on Saturday');
  assert.equal(localTime('Asia/Singapore'), '10:30 AM on Sunday');
});

test('an unknown time zone is ignored rather than throwing', () => {
  assert.equal(localTime('Not/AZone'), null);
});
