(() => {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Menu */
  const menuBtn = $('#menuBtn'), links = $('#links');
  menuBtn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  links.addEventListener('click', e => { if (e.target.closest('a')) { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', false); } });

  /* Active section in nav */
  const navLinks = [...links.querySelectorAll('a')];
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) navLinks.forEach(a => a.setAttribute('aria-current', a.hash === '#' + en.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(a => { const s = document.querySelector(a.hash); if (s) io.observe(s); });
  }

  /* Countdown: Muhurtham 06 Dec 2026, 08:00 IST (logic in js/countdown.js) */
  const CD = window.WeddingCountdown;
  const pad = n => String(n).padStart(2, '0');
  const local = CD.localTime(Intl.DateTimeFormat().resolvedOptions().timeZone);
  if (local) { $('#cd-local').textContent = `That is ${local} where you are.`; $('#cd-local').hidden = false; }
  let shownPhase;
  function tick() {
    const r = CD.countdown(Date.now());
    if (r.phase !== shownPhase) {
      shownPhase = r.phase;
      $('#countdown').dataset.phase = r.phase;
      if (r.phase === 'today') {
        $('#count-title').textContent = 'Today is the day';
        $('#cd-note').textContent = 'Anjana and Sravan are married today before Guruvayurappan. Thank you for your blessings.';
      } else if (r.phase === 'after') {
        $('#count-title').textContent = 'Happily married';
        $('#cd-note').textContent = 'Anjana and Sravan were married on Sunday, 06 December 2026. Thank you for your blessings.';
      }
      if (r.phase !== 'countdown') { $('#clock').hidden = true; $('#cd-local').hidden = true; }
    }
    if (r.phase !== 'countdown') return;
    $('#cd-d').textContent = r.d; $('#cd-h').textContent = pad(r.h);
    $('#cd-m').textContent = pad(r.m); $('#cd-s').textContent = pad(r.s);
    $('#clock').setAttribute('aria-label', `${r.d} days, ${r.h} hours and ${r.m} minutes to go`);
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  /* Floating hearts + gold motes engine */
  function heartPath(c, x, y, r) {
    c.beginPath(); c.moveTo(x, y + r * .35);
    c.bezierCurveTo(x, y, x - r, y - r * .2, x - r, y + r * .3);
    c.bezierCurveTo(x - r, y + r * .85, x - r * .2, y + r * 1.1, x, y + r * 1.5);
    c.bezierCurveTo(x + r * .2, y + r * 1.1, x + r, y + r * .85, x + r, y + r * .3);
    c.bezierCurveTo(x + r, y - r * .2, x, y, x, y + r * .35); c.closePath();
  }
  const HUES = [[201,163,90],[183,64,84],[228,150,160],[255,236,200]];
  function makeSky(cv, opt) {
    const c = cv.getContext('2d'); let W = 0, H = 0, ps = [], on = false, last = 0, gen = 0;
    function size() { const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(initial) {
      const heart = Math.random() < opt.heartShare, col = HUES[heart ? 1 + Math.floor(Math.random() * 3) : 0];
      return { x: Math.random() * W, y: initial ? Math.random() * H : H + 20, r: heart ? opt.size[0] + Math.random() * opt.size[1] : Math.random() * 1.8 + .4,
        v: (heart ? .35 : .15) + Math.random() * opt.speed, a: Math.random() * 6.28, sp: .006 + Math.random() * .01, rot: (Math.random() - .5) * .5, heart, col,
        o: heart ? opt.alpha * (.5 + Math.random() * .5) : .5, outline: heart && Math.random() < .35 };
    }
    function frame(t, id) {
      if (!on || id !== gen) return;
      c.clearRect(0, 0, W, H);
      if (ps.length < opt.max && t - last > opt.every) { ps.push(spawn(false)); last = t; }
      ps = ps.filter(p => p.y > -40);
      for (const p of ps) {
        if (!reduce) { p.y -= p.v; p.a += p.sp; p.x += Math.sin(p.a) * .45; }
        const fade = Math.min(1, (H - p.y) / 120, (p.y + 40) / 140);
        if (p.heart) {
          c.save(); c.translate(p.x, p.y); c.rotate(p.rot + Math.sin(p.a) * .18);
          heartPath(c, 0, 0, p.r);
          const [r, g, b] = p.col;
          if (p.outline) { c.strokeStyle = `rgba(201,163,90,${p.o * fade})`; c.lineWidth = 1; c.stroke(); }
          else { c.shadowColor = `rgba(${r},${g},${b},.6)`; c.shadowBlur = p.r * 1.4; c.fillStyle = `rgba(${r},${g},${b},${p.o * fade})`; c.fill(); }
          c.restore();
        } else {
          const tw = (.4 + Math.sin(p.a * 2) * .25) * fade, gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          gr.addColorStop(0, `rgba(201,163,90,${tw})`); gr.addColorStop(1, 'rgba(201,163,90,0)');
          c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, p.r * 4, 0, 6.28); c.fill();
        }
      }
      if (!reduce) requestAnimationFrame(n => frame(n, id));
    }
    size(); ps = Array.from({ length: opt.seed }, () => spawn(true));
    addEventListener('resize', () => { size(); if (reduce && on) frame(0, gen); });
    const start = () => { if (on) return; on = true; const id = ++gen; requestAnimationFrame(n => frame(n, id)); };
    return { start, run: start, stop() { on = false; gen++; c.clearRect(0, 0, W, H); } };
  }
  const heroSky = makeSky($('#motes'), { heartShare: .35, size: [5, 7], speed: .3, alpha: .55, max: 46, every: 500, seed: 34 });
  const pageSky = makeSky($('#hearts'), { heartShare: 1, size: [5, 6], speed: .35, alpha: .32, max: 9, every: 2400, seed: 3 });
  const filmSky = makeSky($('#filmHearts'), { heartShare: .55, size: [6, 10], speed: .6, alpha: .7, max: 60, every: 260, seed: 10 });
  heroSky.run(); pageSky.run(); filmSky.stop();
  if (!reduce && 'IntersectionObserver' in window) new IntersectionObserver(([e]) => e.isIntersecting ? heroSky.start() : heroSky.stop()).observe($('#motes'));
  document.addEventListener('visibilitychange', () => document.hidden ? pageSky.stop() : pageSky.start());

  /* Venues: copy address, with a fallback for browsers without the async clipboard */
  const copyStatus = $('#copyStatus');
  document.querySelectorAll('.copy[data-copy]').forEach(b => b.addEventListener('click', async () => {
    const text = b.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; }
    catch {
      const t = Object.assign(document.createElement('textarea'), { value: text });
      t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0';
      document.body.append(t); t.select();
      try { ok = document.execCommand('copy'); } catch {}
      t.remove();
    }
    copyStatus.textContent = ok ? `Copied: ${text}` : `Address: ${text}`;
    if (ok) { b.dataset.done = ''; setTimeout(() => delete b.dataset.done, 2400); }
  }));

  /* Gallery lightbox */
  const items = [...document.querySelectorAll('.g[data-i]')];
  const lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap'), lbCount = $('#lbCount');
  let cur = 0, lastFocus;
  function show(i) {
    cur = (i + items.length) % items.length;
    const im = items[cur].querySelector('img');
    lbImg.src = items[cur].dataset.full || im.currentSrc || im.src; lbImg.alt = im.alt; lbCap.textContent = im.alt;
    lbCount.textContent = `${cur + 1} / ${items.length}`;
    lbImg.style.animation = 'none'; lbImg.offsetHeight; lbImg.style.animation = '';
  }
  items.forEach((b, i) => b.addEventListener('click', () => { lastFocus = b; show(i); lb.showModal(); $('#lbClose').focus(); }));
  $('#lbPrev').onclick = () => show(cur - 1);
  $('#lbNext').onclick = () => show(cur + 1);
  $('#lbClose').onclick = () => lb.close();
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  lb.addEventListener('close', () => lastFocus && lastFocus.focus());
  // swipe between photos on touch screens; a mostly-vertical drag is left to the browser
  let sx = null, sy = 0;
  lb.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { sx = e.clientX; sy = e.clientY; } });
  lb.addEventListener('pointerup', e => {
    if (sx === null) return;
    const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) show(cur + (dx < 0 ? 1 : -1));
  });
  lb.addEventListener('pointercancel', () => { sx = null; });

  /* Music: a soft generative piece in raga Mohanam over a tanpura-like drone, with hall reverb (Web Audio, nothing downloaded) */
  const btn = $('#music');
  let ac, master, wet, timer, playing = false;
  const SA = 196;
  const scale = [0, 2, 4, 7, 9, 12, 14, 16, 19];
  const hz = s => SA * Math.pow(2, s / 12);
  function impulse(sec) {
    const len = ac.sampleRate * sec, b = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    return b;
  }
  function tone(f, t, dur, gain, type = 'sine') {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + .05); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(master); g.connect(wet); o.start(t); o.stop(t + dur + .05);
  }
  function phrase() {
    const t0 = ac.currentTime + .05;
    [SA / 2, hz(7) / 2, SA / 2, SA / 4].forEach((f, i) => tone(f, t0 + i * 1, 3.8, .045, 'triangle'));
    let step = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < 6; i++) {
      step = Math.max(0, Math.min(scale.length - 1, step + [-1, 1, 1, -2, 2, 0][Math.floor(Math.random() * 6)]));
      if (Math.random() < .78) { const f = hz(scale[step]) * 2; tone(f, t0 + i * .66, 3, .04); tone(f * 2, t0 + i * .66, 1.4, .007); }
    }
  }
  function startGen() {
    if (playing) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      master = ac.createGain(); master.gain.value = 0;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      const verb = ac.createConvolver(); verb.buffer = impulse(3.4);
      wet = ac.createGain(); wet.gain.value = .55;
      wet.connect(verb).connect(lp); master.connect(lp); lp.connect(ac.destination);
      master.gain.linearRampToValueAtTime(.75, ac.currentTime + 2.5);
      phrase(); timer = setInterval(phrase, 4000);
      playing = true;
    } catch { playing = false; }
    syncBtn();
  }
  function stopGen() {
    if (!playing) return;
    clearInterval(timer); playing = false;
    const m = master, w = wet, now = ac.currentTime;
    [m, w].forEach(g => { g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + 1.4); });
    setTimeout(() => { m.disconnect(); w.disconnect(); }, 1600);
    syncBtn();
  }
  /* Background track: plays bgm.mp3 kept beside this page; falls back to the generative piece if it is missing */
  let bgm, mode = null, fileOK = true, fadeT;
  function track() {
    if (!bgm) { bgm = new Audio('bgm.mp3'); bgm.loop = true; bgm.preload = 'auto'; }
    return bgm;
  }
  function fade(to, ms, done) {
    clearInterval(fadeT);
    const from = bgm.volume, f0 = performance.now();
    fadeT = setInterval(() => {
      const k = Math.min(1, (performance.now() - f0) / ms);
      bgm.volume = from + (to - from) * k;
      if (k === 1) { clearInterval(fadeT); done && done(); }
    }, 40);
  }
  function startMusic() {
    if (playing) return;
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch {}
    if (!fileOK) { mode = 'gen'; return startGen(); }
    mode = 'file'; playing = true; syncBtn();
    track().volume = 0;
    const fallback = () => { fileOK = false; if (mode !== 'file' || !playing) return; playing = false; mode = 'gen'; startGen(); };
    const p = bgm.play();
    if (p && p.then) p.then(() => playing && mode === 'file' ? fade(.85, 2500) : bgm.pause()).catch(fallback);
    else fade(.85, 2500);
  }
  function stopMusic() {
    if (!playing) return;
    if (mode === 'file') { playing = false; syncBtn(); fade(0, 1400, () => bgm.pause()); }
    else stopGen();
  }
  const filmSound = $('#filmSound');
  function syncBtn() {
    btn.setAttribute('aria-pressed', playing);
    btn.setAttribute('aria-label', playing ? 'Pause background music' : 'Play soft background music');
    filmSound.setAttribute('aria-pressed', playing);
    filmSound.textContent = playing ? 'Sound on' : 'Sound off';
  }
  btn.addEventListener('click', () => playing ? stopMusic() : startMusic());
  filmSound.addEventListener('click', () => playing ? stopMusic() : startMusic());

  /* Opening film */
  const film = $('#film'), scenes = [...film.querySelectorAll('.scene')], prog = $('#prog');
  const DUR = [4200, 3800, 3800, 3800, 5200, 4200, 4400];
  const TOTAL = DUR.reduce((a, b) => a + b, 0);
  let tId, rafId, t0;
  const root = document.documentElement;
  scenes.forEach(sc => { if (sc.dataset.cam) sc.style.setProperty('--cam', sc.dataset.cam); });
  // film backgrounds are fetched only after the page itself has loaded
  if (document.readyState === 'complete') film.classList.add('ready');
  else addEventListener('load', () => film.classList.add('ready'));
  $('#openFilm').addEventListener('click', () => film.classList.add('ready'));
  function lock(v) { root.style.overflow = v ? 'hidden' : ''; }
  lock(true);
  function play() {
    film.classList.remove('done'); film.classList.add('playing'); lock(true);
    scenes.forEach(s => s.classList.remove('on'));
    filmSky.run(); pageSky.stop();
    let i = 0; t0 = performance.now();
    const next = () => {
      scenes.forEach((s, k) => s.classList.toggle('on', k === i));
      if (i >= scenes.length) return finish();
      tId = setTimeout(() => { i++; next(); }, DUR[i]);
    };
    next();
    const p = now => { prog.style.transform = `scaleX(${Math.min(1, (now - t0) / TOTAL)})`; rafId = requestAnimationFrame(p); };
    rafId = requestAnimationFrame(p);
    $('#skipFilm').focus();
  }
  function finish() {
    clearTimeout(tId); cancelAnimationFrame(rafId);
    film.classList.add('done'); lock(false);
    setTimeout(() => { film.classList.remove('playing'); scenes.forEach(s => s.classList.remove('on')); filmSky.stop(); }, 1400);
    pageSky.start(); scrollTo({ top: 0 });
    $('.mono').focus({ preventScroll: true });
  }
  $('#openFilm').addEventListener('click', () => { startMusic(); play(); });
  $('#enterSilent').addEventListener('click', () => { film.classList.add('playing'); finish(); });
  // keyboard users can close the title card with Escape too
  film.addEventListener('keydown', e => { if (e.key === 'Escape' && !film.classList.contains('playing')) { film.classList.add('playing'); finish(); } });
  $('#skipFilm').addEventListener('click', finish);
  $('#replay').addEventListener('click', play);
  film.addEventListener('keydown', e => { if (e.key === 'Escape' && film.classList.contains('playing')) finish(); });
  $('#openFilm').focus({ preventScroll: true });
})();
