/* Cadence Pager (10/26). window.CadencePager(host, options) → { go(i), step(d), index, el }
   One pagination for carousels and the deck rail, drawn as squares of dots on an unlit dot board.

   options
     items      number of pages (required)
     start      first page, 0-based (default 0)
     mode       'inline' (carousel: arrows + board + counter) or 'rail' (deck: vertical board + counter)
     loop       pages wrap around and nothing is "passed" (carousels). Default: true for inline, false for rail
     acts       rail only: [{ name, start }] act names shown on hover/focus and read to screen readers
     arrows     inline only, default true
     noun       'Page' by default ('Testimonial', 'Slide' ...)
     onGo(i, how)  called when a person picks a page: how = 'arrow' | 'board' | 'key'
   Look (Julie, 10/26): each page is 2 dots along the board x 1 dot across (markAcross), dense dots (dotDense = .8 of the pitch)
   at the dot type's resolution (pitchDense 5px), on an unlit board with a 1-dot margin (marginDense). Vertical rail: 1 wide x 2 tall.
   Horizontal (phone bar, carousels): 2 wide x 1 tall. The pitch shrinks to fit the room, never below pitchMin (3px).
   Layout: under 760px wide the rail turns into a bar (horizontal).
   Only when the board still won't fit at pitchMin does it become a window that slides to keep the current page in view,
   snapped to whole pages. Motion follows motion-sound-haptics.md: transform and opacity only. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var U = 8, R = 1.9;   // drawing units: one board cell = 8 units, dot radius 1.9 (the mesh); scaled to the pitch token on screen
  var root = document.documentElement;
  function tok(name, fallback) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    var n = parseFloat(v); return isNaN(n) ? fallback : n;
  }
  function reduced() { return root.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function chevron(dir) {
    var cells = [[1, 0], [2, 1], [3, 2], [2, 3], [1, 4]], out = '';
    cells.forEach(function (c) { var x = (dir < 0 ? 4 - c[0] : c[0]) * 5 + 2.5, y = c[1] * 5 + 2.5;
      out += '<circle cx="' + x + '" cy="' + y + '" r="' + R + '" fill="currentColor"/>'; });
    return '<svg viewBox="0 0 25 25" aria-hidden="true" focusable="false">' + out + '</svg>';
  }

  function CadencePager(host, o) {
    o = o || {};
    var items = Math.max(1, o.items | 0), rail = o.mode === 'rail';
    var loop = o.loop != null ? !!o.loop : !rail, noun = o.noun || 'Page';
    var acts = (o.acts || []).slice().sort(function (a, b) { return a.start - b.start; });
    var cur = Math.min(items - 1, Math.max(0, o.start | 0));
    var MARK = tok('--ck-component-pager-mark', 2), GAP = tok('--ck-component-pager-gap', 1), B = tok('--ck-component-pager-margin', 3);
    var MX = MARK, STEP = MARK + GAP;   // MARK = dots along the board per page, MX = dots across

    var el = document.createElement('div');
    el.className = 'ck-pager' + (rail ? ' is-rail' : '');
    var view = document.createElement('div'); view.className = 'ck-pager-view'; view.tabIndex = 0;
    view.setAttribute('role', 'slider'); view.setAttribute('aria-valuemin', '1'); view.setAttribute('aria-valuemax', String(items));
    var count = document.createElement('span'); count.className = 'ck-pager-count'; count.setAttribute('aria-hidden', 'true');
    var live = document.createElement('span'); live.className = 'ck-pager-live'; live.setAttribute('aria-live', 'polite');
    var tip = document.createElement('span'); tip.className = 'ck-pager-tip'; tip.setAttribute('aria-hidden', 'true');
    var prev, next;
    if (!rail && o.arrows !== false) {
      prev = document.createElement('button'); prev.type = 'button'; prev.className = 'ck-pager-arrow'; prev.dataset.dir = '-1';
      prev.setAttribute('aria-label', 'Previous ' + noun.toLowerCase()); prev.innerHTML = chevron(-1);
      next = document.createElement('button'); next.type = 'button'; next.className = 'ck-pager-arrow'; next.dataset.dir = '1';
      next.setAttribute('aria-label', 'Next ' + noun.toLowerCase()); next.innerHTML = chevron(1);
      el.append(prev, view, next, count, live);
    } else {
      el.append(view, tip, count, live);
    }
    host.replaceChildren(el);

    var svg, board, bead, lit = [], pos = [], cells = 0, pitch = 8, vertical = rail, room = Infinity, r = R;
    function actOf(i) { var a = null; acts.forEach(function (x) { if (x.start <= i) a = x; }); return a; }

    function build() {
      var bar = rail && innerWidth < 760;
      el.classList.toggle('is-bar', bar);
      vertical = rail && !bar;
      // the room the board has: rail = screen height minus two targets and the counter; inline/bar = the host's width minus arrows
      var target = tok('--ck-component-pager-target', 44);
      if (vertical) room = innerHeight - 2 * target - 80;
      else if (bar) room = innerWidth - 3 * target;   // the phone bar clears the deck's pause button
      else room = Math.min(host.clientWidth || innerWidth, innerWidth - 32) - (prev ? 2 * target : 0);
      B = tok('--ck-component-pager-marginDense', 1); MX = tok('--ck-component-pager-markAcross', 1);
      pos = []; var c = B;
      for (var k = 0; k < items; k++) { pos.push(c); c += STEP; }
      cells = c - GAP + B;
      var across = MX + 2 * B;
      // dense dots at the dot type's resolution, shrunk (never below pitchMin) so every page fits its room
      pitch = Math.max(tok('--ck-component-pager-pitchMin', 3),
        Math.min(tok('--ck-component-pager-pitchDense', 5), Math.floor(room / cells * 4) / 4));
      r = U * tok('--ck-component-pager-dotDense', .8) / 2;
      var W = (vertical ? across : cells) * U, H = (vertical ? cells : across) * U;
      svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
      svg.setAttribute('width', W / U * pitch); svg.setAttribute('height', H / U * pitch);
      board = document.createElementNS(NS, 'g'); board.setAttribute('class', 'ck-pager-board'); svg.append(board);
      function at(a, b) { return vertical ? [(b + .5) * U, (a + .5) * U] : [(a + .5) * U, (b + .5) * U]; }
      function dot(a, b, cls, parent) { var p = at(a, b), e = document.createElementNS(NS, 'circle');
        e.setAttribute('cx', p[0]); e.setAttribute('cy', p[1]); e.setAttribute('r', r); if (cls) e.setAttribute('class', cls); parent.append(e); return e; }
      var inMark = {}; pos.forEach(function (p) { for (var i = 0; i < MARK; i++) inMark[p + i] = 1; });
      for (var a = 0; a < cells; a++) for (var b = 0; b < across; b++) dot(a, b, inMark[a] && b >= B && b < B + MX ? 'a' : 'f', board);
      lit = pos.map(function (p) { var g = document.createElementNS(NS, 'g');
        for (var i = 0; i < MARK; i++) for (var j = B; j < B + MX; j++) dot(p + i, j, 's', g); board.append(g); return g; });
      bead = document.createElementNS(NS, 'g'); bead.setAttribute('class', 'bead');
      for (var i = 0; i < MARK; i++) for (var j = B; j < B + MX; j++) dot(pos[0] + i, j, '', bead);
      board.append(bead);
      view.replaceChildren(svg);
      var full = (vertical ? H : W) / U * pitch;
      view.style[vertical ? 'blockSize' : 'inlineSize'] = full > room ? Math.floor(room / (STEP * pitch)) * STEP * pitch + 'px' : '';
      view.style[vertical ? 'inlineSize' : 'blockSize'] = '';
      render(true);
    }

    function render(first) {
      if (first) el.classList.add('fin');
      lit.forEach(function (g, k) { var on = !loop && k < cur; for (var n = g.firstChild; n; n = n.nextSibling) n.classList.toggle('on', on); });
      var d = (pos[cur] - pos[0]) * U;
      bead.style.transform = vertical ? 'translateY(' + d + 'px)' : 'translateX(' + d + 'px)';
      var total = cells * pitch, size = parseFloat(view.style[vertical ? 'blockSize' : 'inlineSize']) || total;
      var off = 0;
      if (size < total) { var row = STEP * pitch, mid = (pos[cur] + MARK / 2) * pitch;
        off = Math.round(Math.max(0, Math.min(total - size, mid - size / 2)) / row) * row; }
      board.style.transform = off ? (vertical ? 'translateY(' : 'translateX(') + (-off / pitch * U) + 'px)' : '';
      var a = actOf(cur);
      count.innerHTML = '<b>' + (cur + 1) + '</b><span>of</span><span>' + items + '</span>';
      view.setAttribute('aria-valuenow', String(cur + 1));
      view.setAttribute('aria-valuetext', noun + ' ' + (cur + 1) + ' of ' + items + (a ? ': ' + a.name : ''));
      view.setAttribute('aria-label', rail ? 'Deck progress' : noun + 's');
      if (first) requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove('fin'); }); });
    }

    var quiet = 0;
    function go(i, how) {
      var n = loop ? ((i % items) + items) % items : Math.max(0, Math.min(items - 1, i));
      if (n === cur) return; cur = n; render(false);
      clearTimeout(quiet);
      if (how) quiet = setTimeout(function () { var a = actOf(cur); live.textContent = noun + ' ' + (cur + 1) + ' of ' + items + (a ? ': ' + a.name : ''); }, 600);
      if (how && o.onGo) o.onGo(cur, how);
    }
    function nearest(e) {
      var best = Infinity, k = cur;
      lit.forEach(function (g, j) { var r = g.getBoundingClientRect(); if (!r.width && !r.height) return;
        var dd = Math.hypot(r.left + r.width / 2 - e.clientX, r.top + r.height / 2 - e.clientY); if (dd < best) { best = dd; k = j; } });
      return k;
    }
    function finish() { el.classList.add('fin'); requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.remove('fin'); }); }); }

    if (prev) [prev, next].forEach(function (b) { b.addEventListener('click', function () { go(cur + (+b.dataset.dir), 'arrow'); }); });
    view.addEventListener('click', function (e) { go(nearest(e), 'board'); });
    view.addEventListener('keydown', function (e) {
      var k = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
      if (k) { e.preventDefault(); e.stopPropagation(); finish(); go(cur + k, 'key'); }
      else if (e.key === 'Home') { e.preventDefault(); e.stopPropagation(); go(0, 'key'); }
      else if (e.key === 'End') { e.preventDefault(); e.stopPropagation(); go(items - 1, 'key'); }
    });
    if (rail) {
      view.addEventListener('pointermove', function (e) {
        var k = nearest(e), a = actOf(k), r = lit[k].getBoundingClientRect(), v = el.getBoundingClientRect();
        tip.textContent = a ? a.name : ''; tip.style.top = (r.top - v.top + r.height / 2) + 'px'; el.classList.toggle('is-tip', !!a && vertical);
      });
      view.addEventListener('pointerleave', function () { el.classList.remove('is-tip'); });
      view.addEventListener('focus', function () { var a = actOf(cur), r = lit[cur].getBoundingClientRect(), v = el.getBoundingClientRect();
        tip.textContent = a ? a.name : ''; tip.style.top = (r.top - v.top + r.height / 2) + 'px'; el.classList.toggle('is-tip', !!a && vertical); });
      view.addEventListener('blur', function () { el.classList.remove('is-tip'); });
    }
    var rt = 0; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(build, 120); });
    build();
    return { go: function (i) { go(i, null); }, step: function (d) { go(cur + d, null); }, get index() { return cur; }, el: el, reduced: reduced };
  }
  window.CadencePager = CadencePager;
})();
