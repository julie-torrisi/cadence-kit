/* Cadence motion runtime · rules: claude/motion-sound-haptics.md
   No dependencies. No sound, no haptics: web is silent by rule. */
(function () {
  'use strict';

  var html = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

  function reduced() {
    return (mq && mq.matches) || html.getAttribute('data-motion') === 'reduce';
  }
  function slowConnection() {
    var c = navigator.connection;
    return !!(c && (c.saveData || /(^|-)2g|3g/.test(c.effectiveType || '')));
  }
  function clamp(n) { return n < 0 ? 0 : n > 1 ? 1 : n; }

  /* B · Reveal: once, never again on scroll back */
  function initReveals(root) {
    var els = root.querySelectorAll('[data-reveal]:not(.is-in)');
    if (!('IntersectionObserver' in window) || reduced()) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* A · Sticky scroll scene: --progress 0..1, canvas image sequence, poster fallback */
  function frameUrl(pattern, i) {
    return pattern.replace(/#+/, function (m) { return String(i).padStart(m.length, '0'); });
  }

  function drawContain(canvas, img) {
    if (!img || !img.complete || !img.naturalWidth) return;
    var dpr = window.devicePixelRatio || 1;
    var w = canvas.clientWidth * dpr, h = canvas.clientHeight * dpr;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    var s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }

  function Scene(section) {
    this.section = section;
    this.canvas = section.querySelector('canvas[data-frames], canvas[data-poster]');
    this.frames = [];
    this.current = -1;
    if (!this.canvas) return;
    var c = this.canvas;
    this.usePoster = reduced() || slowConnection() || !c.dataset.frames;
    if (this.usePoster) {
      if (!c.dataset.poster) return;
      var p = new Image();
      p.onload = function () { drawContain(c, p); };
      p.src = c.dataset.poster;
      this.poster = p;
      return;
    }
    var count = parseInt(c.dataset.frameCount, 10) || 0;
    for (var i = 1; i <= count; i++) {
      var img = new Image();
      img.src = frameUrl(c.dataset.frames, i);
      this.frames.push(img);
    }
    var self = this;
    this.frames[0] && (this.frames[0].onload = function () { self.update(true); });
  }
  Scene.prototype.update = function (force) {
    var r = this.section.getBoundingClientRect();
    var travel = r.height - window.innerHeight;
    var progress = travel > 0 ? clamp(-r.top / travel) : 1;
    if (reduced()) progress = 1;
    this.section.style.setProperty('--progress', progress.toFixed(4));
    this.section.dispatchEvent(new CustomEvent('cm:progress', { detail: progress }));
    if (!this.canvas) return;
    if (this.usePoster) { if (force) drawContain(this.canvas, this.poster); return; }
    var idx = Math.round(progress * (this.frames.length - 1));
    if (idx !== this.current || force) {
      this.current = idx;
      drawContain(this.canvas, this.frames[idx]);
    }
  };

  var scenes = [];
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      scenes.forEach(function (s) { s.update(false); });
      updateNumerals();
      ticking = false;
    });
  }
  function initScenes(root) {
    root.querySelectorAll('[data-scene]').forEach(function (el) {
      if (el.__cmScene) return;
      el.__cmScene = new Scene(el);
      scenes.push(el.__cmScene);
      el.__cmScene.update(true);
    });
  }

  /* Slides and flow steps: the user owns the clock.
     A new step finishes whatever is still running, then starts. */
  function finishAll(el) {
    if (el && el.getAnimations) {
      el.getAnimations({ subtree: true }).forEach(function (a) {
        try { a.finish(); } catch (e) { a.cancel(); }
      });
    }
  }
  function step(nextEl, prevEl) {
    finishAll(prevEl);
    finishAll(nextEl);
    if (prevEl) {
      prevEl.classList.remove('is-entering');
      prevEl.classList.add('is-leaving');
      prevEl.addEventListener('animationend', function done() {
        prevEl.classList.remove('is-leaving');
        prevEl.removeEventListener('animationend', done);
      });
    }
    if (nextEl) {
      nextEl.classList.remove('is-leaving');
      nextEl.classList.add('is-entering');
      nextEl.addEventListener('animationend', function done() {
        nextEl.classList.remove('is-entering');
        nextEl.removeEventListener('animationend', done);
      });
      nextEl.querySelectorAll('[data-reveal]').forEach(function (r) { r.classList.add('is-in'); });
    }
  }

  /* E · Ambient: pause offscreen; pause control for WCAG 2.2.2 */
  function initAmbient(root) {
    var els = root.querySelectorAll('[data-ambient]');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.target.classList.toggle('is-paused', !e.isIntersecting); });
      });
      els.forEach(function (el) { io.observe(el); });
    }
    root.querySelectorAll('[data-motion-toggle]').forEach(function (btn) {
      if (btn.__cmBound) return;
      btn.__cmBound = true;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', function () {
        var paused = html.classList.toggle('cm-ambient-paused');
        btn.setAttribute('aria-pressed', String(paused));
      });
    });
  }


  /* Pager: one pagination component. The user owns the clock: autoplay only with a
     visible pause, never under reduced motion, paused on hover, focus, offscreen and hidden tabs. */
  var ICON = {
    prev: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3L5 8l5 5"/></svg>',
    next: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>',
    up: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10l5-5 5 5"/></svg>',
    down: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6l5 5 5-5"/></svg>',
    pause: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="4" y="3" width="2.6" height="10" rx="1"/><rect x="9.4" y="3" width="2.6" height="10" rx="1"/></svg>',
    play: '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 3.2v9.6a.6.6 0 00.9.5l7.6-4.8a.6.6 0 000-1L5.9 2.7a.6.6 0 00-.9.5z"/></svg>'
  };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function dwellMs() {
    var v = getComputedStyle(html).getPropertyValue('--ck-motion-duration-dwell').trim();
    var n = parseFloat(v);
    if (!n) return 6000; /* motion.duration.dwell fallback (approved 6s) */
    return /ms$/.test(v) ? n : n * 1000;
  }
  function pager(host, opts) {
    opts = opts || {};
    var count = opts.count || (opts.labels ? opts.labels.length : 0);
    var labels = opts.labels || [];
    var vertical = opts.orientation === 'vertical';
    var noun = opts.noun || 'Page';
    var compact = opts.compact || count > 9;
    var wantAuto = !!opts.autoplay;
    var i = Math.max(0, Math.min(count - 1, opts.start || 0));
    var userPaused = false, hoverPaused = false, offscreen = false;

    var el = document.createElement('div');
    el.className = 'cm-pager' + (compact ? ' is-compact' : '');
    el.setAttribute('data-orientation', vertical ? 'vertical' : 'horizontal');
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', opts.label || 'Pagination');
    var parts = [];
    if (opts.arrows !== false) parts.push('<button type="button" class="cm-pager-arrow" data-dir="-1" aria-label="Previous ' + noun.toLowerCase() + '">' + (vertical ? ICON.up : ICON.prev) + '</button>');
    var dots = '';
    for (var k = 0; k < count; k++) {
      var lab = labels[k] ? ': ' + labels[k] : '';
      dots += '<button type="button" class="cm-pager-dot" data-k="' + k + '" aria-label="' + noun + ' ' + (k + 1) + ' of ' + count + lab + '">' +
        (vertical && labels[k] ? '<span class="cm-pager-label" aria-hidden="true">' + labels[k] + '</span>' : '') + '</button>';
    }
    parts.push('<div class="cm-pager-track"><span class="cm-pager-pill" aria-hidden="true"><span class="cm-pager-fill"></span></span>' + dots + '</div>');
    parts.push('<span class="cm-pager-line" aria-hidden="true"><i></i></span>');
    parts.push('<span class="cm-pager-count" aria-live="polite" aria-atomic="true"></span>');
    if (opts.arrows !== false) parts.push('<button type="button" class="cm-pager-arrow" data-dir="1" aria-label="Next ' + noun.toLowerCase() + '">' + (vertical ? ICON.down : ICON.next) + '</button>');
    parts.push('<button type="button" class="cm-pager-play" aria-pressed="false" hidden></button>');
    el.innerHTML = parts.join('');
    host.appendChild(el);

    var countEl = el.querySelector('.cm-pager-count');
    var fill = el.querySelector('.cm-pager-fill');
    var playBtn = el.querySelector('.cm-pager-play');
    var arrows = el.querySelectorAll('.cm-pager-arrow');
    var dotEls = el.querySelectorAll('.cm-pager-dot');

    function autoOn() { return wantAuto && !reduced(); }
    function paused() { return userPaused || hoverPaused || offscreen || document.hidden; }
    function sync() {
      var on = autoOn();
      playBtn.hidden = !on;
      el.classList.toggle('is-timed', on);
      el.classList.toggle('is-paused', on && paused());
      playBtn.setAttribute('aria-pressed', String(on && userPaused));
      playBtn.setAttribute('aria-label', userPaused ? 'Play' : 'Pause');
      playBtn.innerHTML = userPaused ? ICON.play : ICON.pause;
      el.style.setProperty('--cm-dwell', (opts.dwell || dwellMs()) + 'ms');
    }
    function restartFill() {
      fill.style.animation = 'none'; void fill.offsetWidth; fill.style.animation = '';
    }
    function render(announce) {
      el.style.setProperty('--pg-i', i);
      el.style.setProperty('--pg-p', count > 1 ? i / (count - 1) : 1);
      dotEls.forEach(function (d, n) { d.setAttribute('aria-current', n === i ? 'true' : 'false'); });
      countEl.innerHTML = '<b>' + pad(i + 1) + '</b> / ' + pad(count);
      if (!announce) countEl.setAttribute('aria-live', 'off'); else countEl.setAttribute('aria-live', 'polite');
      var loop = opts.loop !== false && autoOn();
      if (arrows.length) { arrows[0].disabled = !loop && !opts.wrap && i === 0; arrows[1].disabled = !loop && !opts.wrap && i === count - 1; }
      restartFill();
    }
    function go(n, src) {
      var wrap = opts.wrap || autoOn();
      if (wrap) n = (n + count) % count; else n = Math.max(0, Math.min(count - 1, n));
      if (n === i && src !== 'init') return;
      var dir = n > i ? 1 : -1;
      i = n;
      render(src !== 'auto' && src !== 'init');
      if (opts.onChange && src !== 'init') opts.onChange(i, dir, src);
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      if (b.classList.contains('cm-pager-dot')) go(+b.dataset.k, 'user');
      else if (b.classList.contains('cm-pager-arrow')) go(i + (+b.dataset.dir), 'user');
      else if (b === playBtn) { userPaused = !userPaused; sync(); }
    });
    el.addEventListener('keydown', function (e) {
      var back = vertical ? 'ArrowUp' : 'ArrowLeft', fwd = vertical ? 'ArrowDown' : 'ArrowRight';
      if (e.key === back) { e.preventDefault(); go(i - 1, 'user'); }
      else if (e.key === fwd) { e.preventDefault(); go(i + 1, 'user'); }
      else if (e.key === 'Home') { e.preventDefault(); go(0, 'user'); }
      else if (e.key === 'End') { e.preventDefault(); go(count - 1, 'user'); }
    });
    fill.addEventListener('animationend', function () { if (autoOn() && !paused()) go(i + 1, 'auto'); });
    var zone = opts.pauseZone || host;
    zone.addEventListener('mouseenter', function () { hoverPaused = true; sync(); });
    zone.addEventListener('mouseleave', function () { hoverPaused = false; sync(); });
    zone.addEventListener('focusin', function () { hoverPaused = true; sync(); });
    zone.addEventListener('focusout', function (e) { if (!zone.contains(e.relatedTarget)) { hoverPaused = false; sync(); } });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { offscreen = !es[0].isIntersecting; sync(); }).observe(zone);
    if (mq && mq.addEventListener) mq.addEventListener('change', sync);
    new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ['data-motion'] });

    sync(); go(i, 'init');
    return {
      el: el,
      go: function (n) { go(n, 'api'); },
      next: function () { go(i + 1, 'api'); },
      prev: function () { go(i - 1, 'api'); },
      pause: function () { userPaused = true; sync(); },
      play: function () { userPaused = false; sync(); },
      get index() { return i; }
    };
  }


  /* Media loop: <video data-loop muted loop playsinline poster="..."> gets a visible pause,
     pauses offscreen and in hidden tabs, and shows only the poster under reduced motion. */
  function initMedia(root) {
    root.querySelectorAll('video[data-loop]').forEach(function (v) {
      if (v.__cm) return; v.__cm = true;
      v.muted = true; v.loop = true; v.playsInline = true; v.removeAttribute('autoplay');
      var wrap = v.parentElement; wrap.classList.add('cm-media');
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'cm-media-ctl';
      wrap.appendChild(btn);
      var userPaused = false, visible = true;
      function want() { return !userPaused && visible && !document.hidden && !reduced(); }
      function sync() {
        btn.hidden = reduced();
        btn.innerHTML = userPaused ? ICON.play : ICON.pause;
        btn.setAttribute('aria-label', userPaused ? 'Play video' : 'Pause video');
        if (want()) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else { v.pause(); if (reduced()) { try { v.currentTime = 0; } catch (e) {} } }
      }
      btn.addEventListener('click', function () { userPaused = !userPaused; sync(); });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; sync(); }).observe(v);
      document.addEventListener('visibilitychange', sync);
      if (mq && mq.addEventListener) mq.addEventListener('change', sync);
      new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ['data-motion'] });
      sync();
    });
  }


  /* Feedback: toast holds motion.duration.hold (4s); copy confirm holds half of it (2s). */
  function msToken(name, fallback) {
    var v = getComputedStyle(html).getPropertyValue(name).trim(), n = parseFloat(v);
    if (!n) return fallback; return /ms$/.test(v) ? n : n * 1000;
  }
  var toastEl = null, toastT = null;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'cm-toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    clearTimeout(toastT);
    toastEl.textContent = msg;
    toastEl.classList.remove('is-in', 'is-out'); void toastEl.offsetWidth; toastEl.classList.add('is-in');
    toastT = setTimeout(function () { toastEl.classList.remove('is-in'); toastEl.classList.add('is-out'); }, msToken('--ck-motion-duration-hold', 4000));
  }
  function copied(btn, text, label) {
    label = label || 'Copied';
    var orig = btn.__cmLabel || (btn.__cmLabel = btn.textContent);
    function done() {
      btn.textContent = label; btn.classList.add('is-copied');
      clearTimeout(btn.__cmT); btn.__cmT = setTimeout(function () { btn.textContent = orig; btn.classList.remove('is-copied'); }, msToken('--ck-motion-duration-hold', 4000) / 2);
    }
    try { navigator.clipboard.writeText(text).then(done, done); } catch (e) { done(); }
  }

  /* Carousel (approved 10/23): items share one top-aligned box; travel is sideways in the paging direction only.
     Use with a pager: CadenceMotion.carousel(itemsEl) returns show(n, dir). */
  function carousel(itemsEl) {
    return function show(n, dir) {
      var all = itemsEl.children, prev = itemsEl.querySelector('.is-active'), next = all[n];
      if (!next || prev === next) return;
      [prev, next].forEach(function (el) { if (el) el.classList.remove('is-in', 'is-out'); });
      if (prev) { prev.classList.remove('is-active'); prev.classList.add('is-out');
        prev.addEventListener('animationend', function d() { prev.classList.remove('is-out'); prev.removeEventListener('animationend', d); }); }
      next.style.setProperty('--cm-dir', dir < 0 ? -1 : 1);
      next.classList.add('is-active', 'is-in');
      next.addEventListener('animationend', function d() { next.classList.remove('is-in'); next.removeEventListener('animationend', d); });
    };
  }

  /* Pixel numbers (approved 10/23, locked as built in the master deck). */
  var NUMERALS = {
    1: ['..#..', '.##..', '#.#..', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
    2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#....', '#....', '#####'],
    3: ['####.', '....#', '....#', '...#.', '.##..', '...#.', '....#', '....#', '####.']
  };
  /* Chapter numeral: <div class="cm-numeral" data-numeral="2"></div>. Scrubbed by its section's scroll, 40% to 85%. */
  var numerals = [];
  function initNumerals(root) {
    root.querySelectorAll('[data-numeral]').forEach(function (n) {
      if (n.__cm) return; n.__cm = true;
      var d = NUMERALS[n.dataset.numeral] || NUMERALS[1];
      n.classList.add('cm-numeral'); n.setAttribute('role', 'img'); n.setAttribute('aria-label', n.dataset.numeral);
      d.forEach(function (r) { r.split('').forEach(function (ch) { var i = document.createElement('i'); if (ch !== '#') i.className = 'is-off'; n.appendChild(i); }); });
      numerals.push({ el: n, cells: n.querySelectorAll('i:not(.is-off)'), host: n.closest('section') || n.parentElement });
    });
    updateNumerals();
  }
  function updateNumerals() {
    var vh = window.innerHeight;
    numerals.forEach(function (o) {
      var r = o.host.getBoundingClientRect(), travel = Math.max(1, r.height - vh);
      var p = reduced() ? 1 : clamp((clamp(-r.top / travel) - 0.4) / 0.45);
      var shown = Math.round(p * o.cells.length);
      o.cells.forEach(function (c, k) { c.classList.toggle('is-wait', k >= shown); });
    });
  }
  /* Metric number: <span class="cm-pxnum" data-pxnum>78%</span>. Builds once when 60% visible. */
  function initPxNums(root) {
    var els = root.querySelectorAll('[data-pxnum]:not(.is-built)');
    els.forEach(function (n) {
      if (n.__cm) return; n.__cm = true;
      var t = n.textContent; n.setAttribute('aria-label', t); n.textContent = '';
      t.split('').forEach(function (ch, k) { var g = document.createElement('i'); g.className = 'cm-px-g'; g.style.setProperty('--i', k); g.setAttribute('aria-hidden', 'true'); g.textContent = ch; n.appendChild(g); });
    });
    if (!('IntersectionObserver' in window)) { els.forEach(function (n) { n.classList.add('is-built'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-built'); io.unobserve(e.target); } }); }, { threshold: 0.6 });
    els.forEach(function (n) { io.observe(n); });
  }
  /* Scan loader cells: <span class="cm-loader-scan"></span> */
  function initScan(root) {
    root.querySelectorAll('.cm-loader-scan:empty').forEach(function (el) {
      var h = ''; for (var r = 0; r < 3; r++) for (var c = 0; c < 9; c++) h += '<i style="--c:' + c + '"></i>';
      el.innerHTML = h; el.setAttribute('role', el.getAttribute('role') || 'img'); if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', 'Loading');
    });
  }

  function refresh(root) {
    root = root || document;
    initReveals(root);
    initScenes(root);
    initAmbient(root);
    initMedia(root);
    initNumerals(root);
    initPxNums(root);
    initScan(root);
  }

  function boot() {
    refresh(document);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { scenes.forEach(function (s) { s.update(true); }); });
    if (mq && mq.addEventListener) mq.addEventListener('change', function () { refresh(document); onScroll(); });
  }

  window.CadenceMotion = { step: step, reduced: reduced, refresh: refresh, update: onScroll, pager: pager, toast: toast, copied: copied, carousel: carousel };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
