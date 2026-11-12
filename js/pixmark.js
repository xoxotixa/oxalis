/* =====================================================================
   Oxalis — logo OXALIS en pixels (accueil + bas de toutes les pages)
   Inspiré du composant « Halftone Wordmark Footer », adapté au site :
   - les lettres OXALIS sont lues dans le logo (assets/oxalis-logo.png) et
     imprimées en petits carrés, comme les cases de la grille du fond ;
   - chaque carré est d'autant plus grand que la lettre couvre sa case ;
   - sous la souris (ou le doigt), les carrés s'écartent sur des ressorts,
     changent de couleur et la zone « bugue » : bandes décalées et carrés qui sautent ;
   - un clic envoie une onde de choc dans tout le mot.
   Chaque bloc [data-pixmark] a ses réglages :
     data-crop="0.22"     part de la hauteur des lettres coupée par le bas du bloc (0 = mot entier)
     data-tone="accent"   carrés verts au repos (sinon couleur du texte)
     data-assemble        les carrés arrivent de partout et s'assemblent (après l'intro s'il y en a une)
   Décor uniquement (aria-hidden). Le canvas dort dès que plus rien ne bouge,
   s'arrête hors écran, et reste immobile si « réduire les animations » est demandé.
   ===================================================================== */
(function () {
  'use strict';
  var boxes = document.querySelectorAll('[data-pixmark]');
  if (!boxes.length) return;
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  // Zone des lettres « OXALIS » dans le logo (sans le slogan), en pixels de l'image.
  var SRC = { x: 6, y: 6, w: 844, h: 106 };
  var logo = new Image();
  logo.src = '/assets/oxalis-logo.png';
  var instances = [];

  function hex(c) {
    var m = /^#?([0-9a-f]{6})$/i.exec((c || '').trim());
    return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : null;
  }

  function Pixmark(box) {
    var canvas = box.querySelector('canvas');
    var ctx = canvas && canvas.getContext && canvas.getContext('2d');
    if (!ctx) return;
    var CROP = parseFloat(box.getAttribute('data-crop') || '0');
    var ACCENT = box.getAttribute('data-tone') === 'accent';
    var ASSEMBLE = box.hasAttribute('data-assemble') && !reduce;
    var RADIUS = 90;
    var w = 0, h = 0, dpr = 1, gap = 7, padTop = 0;
    var dots = new Float32Array(0), count = 0;   // x, y, vx, vy, hx, hy, taille, graine
    var px = -1e5, py = -1e5, ring = { x: 0, y: 0, t: -1 };
    var raf = 0, visible = true, awake = true, laidOut = false, started = false;
    var bands = [], bandsAt = 0;
    var ink, warm, hot;
    // Assemblage : il démarre quand le rideau de l'intro s'ouvre (≈ 4,7 s), sinon presque tout de suite.
    var startAt = ASSEMBLE ? (document.documentElement.classList.contains('has-intro') ? 4700 : 250) : 0;

    function readColors() {
      var light = document.documentElement.getAttribute('data-theme') === 'light';
      var cs = getComputedStyle(document.documentElement);
      var text = hex(cs.getPropertyValue('--ink')) || (light ? [24, 32, 42] : [238, 241, 242]);
      if (ACCENT) {
        ink = light ? [47, 138, 91] : [124, 199, 155];
        warm = light ? [24, 32, 42] : [190, 240, 210];
        hot = light ? [31, 90, 60] : [238, 241, 242];
      } else {
        ink = text;
        warm = light ? [47, 138, 91] : [124, 199, 155];
        hot = light ? [31, 90, 60] : [190, 240, 210];
      }
    }

    function layout() {
      var r = box.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width)); h = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      gap = w < 600 ? 4 : w < 1000 ? 5 : 7;
      if (!logo.complete || !logo.naturalWidth) { count = 0; return; }
      // Le mot occupe toute la largeur ; avec data-crop, sa base est coupée par le bas du bloc,
      // sinon il est centré verticalement.
      var tw = w, th = tw * SRC.h / SRC.w;
      var ty = CROP > 0 ? h - th * (1 - CROP) : (h - th) / 2;
      var m = document.createElement('canvas'); m.width = w; m.height = h;
      var mc = m.getContext('2d', { willReadFrequently: true });
      mc.drawImage(logo, SRC.x, SRC.y, SRC.w, SRC.h, 0, ty, tw, th);
      var img = mc.getImageData(0, 0, w, h).data;
      var cols = Math.ceil(w / gap), rows = Math.ceil(h / gap), tmp = [];
      var scatter = ASSEMBLE && !laidOut;
      for (var gy = 0; gy < rows; gy++) for (var gx = 0; gx < cols; gx++) {
        var sum = 0;
        for (var sy = 0; sy < 3; sy++) for (var sx = 0; sx < 3; sx++) {
          var x = Math.min(w - 1, Math.floor(gx * gap + (sx + 0.5) * gap / 3));
          var y = Math.min(h - 1, Math.floor(gy * gap + (sy + 0.5) * gap / 3));
          sum += img[(y * w + x) * 4 + 3];
        }
        var cov = sum / (9 * 255);
        if (cov < 0.06) continue;
        var hx = gx * gap + gap / 2, hy = gy * gap + gap / 2;
        // Assemblage : chaque carré part d'un point au hasard, venu surtout des côtés.
        var sxp = hx, syp = hy;
        if (scatter) {
          var side = hx < w / 2 ? -1 : 1;
          sxp = hx + side * (w * (0.25 + Math.random() * 0.6));
          syp = hy + (Math.random() - 0.5) * h * 2.4;
        }
        tmp.push(sxp, syp, 0, 0, hx, hy, Math.sqrt(cov) * gap * 0.86, Math.random());
      }
      dots = new Float32Array(tmp); count = tmp.length / 8;
      laidOut = true;
      awake = true;
    }

    function draw(now) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      if (now < startAt) return;
      var R = reduce ? 0 : RADIUS;
      var ringAge = ring.t < 0 ? 1e9 : now - ring.t, ringR = ringAge * 0.9;
      var near = px > -1e4;
      var assembling = ASSEMBLE && now - startAt < 2600;
      // Bandes « bug » : quelques tranches horizontales décalées autour du pointeur.
      if (near && !reduce && now - bandsAt > 90) {
        bandsAt = now; bands = [];
        var n = 1 + Math.floor(Math.random() * 3);
        for (var b = 0; b < n; b++) {
          var cy = py + (Math.random() - 0.5) * RADIUS * 1.6, bh = gap * (1 + Math.floor(Math.random() * 3));
          bands.push([cy - bh / 2, cy + bh / 2, (Math.random() - 0.5) * gap * 6, px - RADIUS * (1.2 + Math.random()), px + RADIUS * (1.2 + Math.random())]);
        }
      } else if (!near) bands = [];
      var moving = false;
      // Pendant l'assemblage, le ressort se durcit peu à peu : départ fluide, arrivée nette.
      var kS = assembling ? 0.018 + 0.05 * Math.min(1, (now - startAt) / 1600) : 0.05;
      var damp = assembling ? 0.88 : 0.84;
      for (var i = 0; i < count; i++) {
        var j = i * 8, x = dots[j], y = dots[j + 1], vx = dots[j + 2], vy = dots[j + 3], hx = dots[j + 4], hy = dots[j + 5];
        if (!reduce) {
          if (ringAge < 900) {
            var rdx = hx - ring.x, rdy = hy - ring.y, rd = Math.sqrt(rdx * rdx + rdy * rdy) + 0.001;
            var band = 1 - Math.min(1, Math.abs(rd - ringR) / 26);
            if (band > 0) { var rf = band * 3.4 * (1 - ringAge / 900); vx += rdx / rd * rf; vy += rdy / rd * rf; }
          }
          var dx = x - px, dy = y - py, d2 = dx * dx + dy * dy;
          if (R > 0 && d2 < R * R) {
            var d = Math.sqrt(d2) + 0.001, f = (1 - d / R) * 2.6;
            vx += dx / d * f; vy += dy / d * f;
            if (dots[j + 7] > 0.92 && Math.random() < 0.08) { vx += (Math.random() - 0.5) * 9; vy += (Math.random() - 0.5) * 9; }
          }
          vx = (vx + (hx - x) * kS) * damp; vy = (vy + (hy - y) * kS) * damp;
          x += vx; y += vy;
          if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) moving = true;
          else { x = hx; y = hy; vx = 0; vy = 0; }
          dots[j] = x; dots[j + 1] = y; dots[j + 2] = vx; dots[j + 3] = vy;
        }
        var ox = 0;
        for (var k = 0; k < bands.length; k++) if (hy >= bands[k][0] && hy <= bands[k][1] && hx >= bands[k][3] && hx <= bands[k][4]) { ox = bands[k][2]; break; }
        var t = Math.min(1, Math.hypot(x - hx, y - hy) / 26);
        if (ox) t = Math.max(t, 0.75);
        if (assembling) t = Math.min(t, 0.5);
        var c = t > 0.6 ? hot : warm, u = t > 0.6 ? (t - 0.6) / 0.4 : t / 0.6, base = t > 0.6 ? warm : ink;
        ctx.fillStyle = t > 0.02 ? 'rgb(' + Math.round(base[0] + (c[0] - base[0]) * u) + ',' + Math.round(base[1] + (c[1] - base[1]) * u) + ',' + Math.round(base[2] + (c[2] - base[2]) * u) + ')' : 'rgb(' + ink[0] + ',' + ink[1] + ',' + ink[2] + ')';
        var sz = dots[j + 6];
        ctx.fillRect(x + ox - sz / 2, y - sz / 2, sz, sz);
      }
      awake = moving || ringAge < 900 || near || assembling;
    }

    function loop(now) { raf = 0; if (!visible) return; draw(now); if ((awake || now < startAt) && !reduce) raf = requestAnimationFrame(loop); }
    function wake() { awake = true; if (!raf && visible) raf = requestAnimationFrame(loop); }
    function local(e) { var b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }

    this.start = function () {
      started = true;
      readColors(); layout(); draw(performance.now());
      if (reduce) return;
      wake();
      box.addEventListener('pointermove', function (e) { var p = local(e); px = p[0]; py = p[1]; wake(); });
      box.addEventListener('pointerleave', function () { px = -1e5; py = -1e5; wake(); });
      box.addEventListener('pointerdown', function (e) { var p = local(e); ring = { x: p[0], y: p[1], t: performance.now() }; wake(); });
      box.addEventListener('touchmove', function (e) { var tt = e.touches && e.touches[0]; if (!tt) return; var p = local(tt); px = p[0]; py = p[1]; wake(); }, { passive: true });
      box.addEventListener('touchend', function () { px = -1e5; py = -1e5; wake(); }, { passive: true });
    };
    this.relayout = function () { if (!started) return; layout(); if (reduce) draw(performance.now()); else wake(); };
    this.recolor = function () { if (!started) return; readColors(); if (reduce) draw(performance.now()); else wake(); };
    if ('ResizeObserver' in window) new ResizeObserver(this.relayout).observe(box);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0] ? en[0].isIntersecting : true; if (visible) wake(); }).observe(box);
  }

  for (var i = 0; i < boxes.length; i++) instances.push(new Pixmark(boxes[i]));
  // Le thème jour / nuit change la couleur des carrés.
  new MutationObserver(function () { instances.forEach(function (p) { if (p.recolor) p.recolor(); }); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  var go = function () { instances.forEach(function (p) { if (p.start) p.start(); }); };
  if (logo.complete && logo.naturalWidth) go(); else logo.addEventListener('load', go);
})();
