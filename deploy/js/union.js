/* Union scene: the scroll position drives every frame (walk, meet, embrace) */
(() => {
  const sec = document.getElementById('union');
  if (!sec) return;
  const stage = sec.querySelector('.union-stage');
  const B = sec.querySelector('.av.bride'), G = sec.querySelector('.av.groom'), GA = sec.querySelector('.av.garm');
  const $ = id => document.getElementById(id);
  const el = {
    bArm: $('uBArm'), bFore: $('uBFore'), bFar: $('uBFar'), bHead: $('uBHead'), bFL: $('uBFootL'), bFR: $('uBFootR'),
    gArm: $('uGArm'), gFore: $('uGFore'), gFar: $('uGFar'), gHead: $('uGHead'), gFL: $('uGFootL'), gFR: $('uGFootR'), gHand: $('uGHand')
  };
  const t1 = sec.querySelector('.u-t1'), fin = sec.querySelector('.u-final'), sub = sec.querySelector('.u-sub');
  const hint = sec.querySelector('.u-hint'), tags = sec.querySelectorAll('.u-tag');
  const halo = sec.querySelector('.u-halo'), arch = sec.querySelector('.u-arch'), love = sec.querySelector('.u-love');
  const heartBox = sec.querySelector('.u-hearts');
  const tones = ['#B3263E', '#D4607A', '#C9A04A', '#E07B92', '#8E1B33', '#D9B54F', '#C2405C'];
  const hearts = tones.map(c => {
    const i = document.createElement('i');
    i.innerHTML = '<svg viewBox="0 0 24 24" fill="' + c + '"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.6 1.2 5.4 3.2 1.8-2 3.3-3.2 5.4-3.2 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21Z"/></svg>';
    heartBox.appendChild(i);
    return i;
  });

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
  const rot = (n, a, x, y) => n.setAttribute('transform', 'rotate(' + a.toFixed(2) + ' ' + x + ' ' + y + ')');
  const lift = (n, y) => n.setAttribute('transform', 'translate(0 ' + y.toFixed(2) + ')');

  /* Final embrace geometry, in groom-SVG units (both figures share one scale) */
  const GW = 240, GH = 500, BW = 220, BH = 460;
  const GAP = 98;              // distance between the two centres when they meet
  const LEAN = 4;              // degrees each leans toward the other
  const toWorld = (p, w, h, cx, lean) => {
    const x = p[0] - w / 2, y = p[1] - h, a = rad(lean);
    return [cx + x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  };
  const toLocal = (p, w, h, cx, lean) => {
    const x = p[0] - cx, y = p[1], a = rad(-lean);
    return [x * Math.cos(a) - y * Math.sin(a) + w / 2, x * Math.sin(a) + y * Math.cos(a) + h];
  };
  /* two-bone reach: limb drawn hanging down, rotate(θ) points it along (-sinθ, cosθ) */
  function reach(sh, tg, l1, l2, bend) {
    const vx = tg[0] - sh[0], vy = tg[1] - sh[1];
    const d = clamp(Math.hypot(vx, vy), Math.abs(l1 - l2) + .5, l1 + l2 - .5);
    const base = deg(Math.atan2(-vx, vy));
    const a = deg(Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)));
    const t1 = base + bend * a;
    const ex = sh[0] - Math.sin(rad(t1)) * l1, ey = sh[1] + Math.cos(rad(t1)) * l1;
    const t2 = deg(Math.atan2(-(tg[0] - ex), tg[1] - ey));
    return [t1, t2 - t1];
  }
  const bCx = -GAP / 2, gCx = GAP / 2;
  // her right arm wraps his waist; his left arm goes behind her back to her far shoulder
  const bTarget = toLocal(toWorld([118, 288], GW, GH, gCx, -LEAN), BW, BH, bCx, LEAN);
  const B_ARM = reach([156, 138], bTarget, 66, 70, 1);
  const gTarget = toLocal(toWorld([58, 150], BW, BH, bCx, LEAN), GW, GH, gCx, -LEAN);
  const G_ARM = reach([66, 152], gTarget, 72, 76, -1);

  function render(p) {
    const W = stage.clientWidth, s = G.offsetHeight / GH;
    const w = ease(seg(p, .03, .58));          // walking in
    const h = ease(seg(p, .56, .78));          // the embrace
    const glow = ease(seg(p, .62, .9));
    const ph = w * Math.PI * 10;               // ten steps, ending planted
    const step = Math.sin(ph) * (1 - h);
    const bob = -Math.abs(Math.sin(ph)) * 6 * (1 - h) * s;
    const lean = lerp(2, LEAN, h) * (w > 0 ? 1 : 0);

    const bx = lerp(-(W / 2 + 150 * s), bCx * s, w);
    const gx = lerp(W / 2 + 160 * s, gCx * s, w);
    B.style.transform = 'translate3d(calc(-50% + ' + bx.toFixed(1) + 'px),' + bob.toFixed(1) + 'px,0) rotate(' + (lean + step * 1.2).toFixed(2) + 'deg)';
    const gT = 'translate3d(calc(-50% + ' + gx.toFixed(1) + 'px),' + bob.toFixed(1) + 'px,0) rotate(' + (-lean - step * 1.2).toFixed(2) + 'deg)';
    G.style.transform = gT; GA.style.transform = gT;

    rot(el.bFar, step * 11 + h * -4, 64, 138);
    rot(el.bArm, lerp(-step * 11, B_ARM[0], h), 156, 138);
    rot(el.bFore, lerp(-6, B_ARM[1], h), 157, 204);
    rot(el.gFar, -step * 11 + h * 5, 174, 152);
    rot(el.gArm, lerp(step * 11, G_ARM[0], h), 66, 152);
    rot(el.gFore, lerp(4, G_ARM[1], h), 62, 224);
    rot(el.bHead, h * 10 + step * 1.5, 110, 118);
    rot(el.gHead, h * -7 - step * 1.5, 120, 124);
    lift(el.bFL, -Math.max(0, step) * 7); lift(el.bFR, -Math.max(0, -step) * 7);
    lift(el.gFL, -Math.max(0, -step) * 8); lift(el.gFR, -Math.max(0, step) * 8);
    el.gHand.setAttribute('transform', 'translate(' + gTarget[0].toFixed(1) + ' ' + gTarget[1].toFixed(1) + ') rotate(-25)');
    el.gHand.setAttribute('opacity', seg(h, .7, 1).toFixed(3));

    const tagO = seg(p, .06, .16) * (1 - seg(p, .5, .6));
    tags.forEach(t => t.style.opacity = tagO.toFixed(3));
    hint.style.opacity = (1 - seg(p, .02, .1)).toFixed(3);
    const o1 = 1 - seg(p, .52, .64), o2 = ease(seg(p, .7, .86));
    t1.style.opacity = o1.toFixed(3); t1.style.transform = 'translateY(' + (-(1 - o1) * 14).toFixed(1) + 'px)';
    fin.style.opacity = o2.toFixed(3); fin.style.transform = 'translateY(' + ((1 - o2) * 16).toFixed(1) + 'px) scale(' + lerp(.94, 1, o2).toFixed(3) + ')';
    sub.style.opacity = ease(seg(p, .8, .92)).toFixed(3);
    halo.style.opacity = (glow * .75).toFixed(3);
    halo.style.transform = 'translate(-50%,50%) scale(' + lerp(.55, 1, glow).toFixed(3) + ')';
    arch.style.setProperty('--glow', glow.toFixed(3));
    arch.style.opacity = lerp(.32, .6, glow).toFixed(3);

    const H = G.offsetHeight;
    hearts.forEach((n, i) => {
      const t = seg(p, .68 + i * .022, .9 + i * .012);
      const dx = Math.sin(i * 1.9 + t * 3) * H * .18 * t + (i - 3) * H * .05 * t;
      const dy = -t * H * .55;
      n.style.opacity = (Math.sin(t * Math.PI) * .9).toFixed(3);
      n.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + (.5 + t * .7).toFixed(3) + ') rotate(' + ((i % 2 ? 1 : -1) * t * 18).toFixed(1) + 'deg)';
    });
    const lv = ease(seg(p, .74, .86));
    love.style.opacity = lv.toFixed(3);
    love.style.transform = 'translateY(' + ((1 - lv) * 18).toFixed(1) + 'px) scale(' + lerp(.4, 1, lv).toFixed(3) + ')';
    love.classList.toggle('beat', lv > .99);
  }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { sec.classList.add('static'); render(1); addEventListener('resize', () => render(1)); return; }

  let queued = false;
  function frame() {
    queued = false;
    const r = sec.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < -50 || r.top > vh + 50) return;
    render(clamp(-r.top / Math.max(1, r.height - vh)));
  }
  const ask = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  render(0); ask();
})();
