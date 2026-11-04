/* =====================================================================
   Oxalis — visuels animés repris de la première version du site :
   maquette qui se construit, globe numérique 3D, cerveau et réseau de nœuds.
   Code d'origine conservé ; ce fichier lui fournit seulement les petits
   utilitaires qu'il attend (self.later, on, raf, root, reduce, L).
   ===================================================================== */
(function () {
  'use strict';
  var doc = document, win = window, root = doc.body, L = 0;
  var reduce = false;
  try { reduce = win.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var self = { cleanups: [], later: function (fn, ms) { return setTimeout(fn, ms); } };
  var raf = function (f) { return win.requestAnimationFrame(f); };
  var on = function (t, ev, fn, opt) { t.addEventListener(ev, fn, opt); };
    /* --- Maquette qui se construit (boucle) --- */
    Array.prototype.forEach.call(root.querySelectorAll('[data-mk]'), function (mk) {
    var STAGES = ['s1', 's2', 's3', 's4', 's5', 's6'];
    if (mk) {
      if (reduce) { STAGES.forEach(function (s) { mk.classList.add(s); }); }
      else {
        var OFFS = [300, 900, 1500, 2100, 2700, 4200];
        var cycle = function () {
          STAGES.forEach(function (s) { mk.classList.remove(s); });
          OFFS.forEach(function (o, i) { self.later(function () { mk.classList.add(STAGES[i]); }, o); });
          self.later(cycle, 7000);
        };
        self.later(cycle, L + 700);
      }
    }
    });

    /* --- Visuels 3D : cerveau numérique et réseau de nœuds --- */
    var vizEls = Array.prototype.slice.call(root.querySelectorAll('[data-viz]'));
    var seedRand = function (seed) { var x = seed; return function () { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; }; };
    var buildBrain = function () {
      var rnd = seedRand(7), pts = [];
      for (var i = 0; i < 1300; i++) {
        var u = rnd() * 2 - 1, th = rnd() * Math.PI * 2, r = Math.sqrt(1 - u * u);
        var x = r * Math.cos(th), y = u, z = r * Math.sin(th);
        var side = i % 2 ? 1 : -1;
        if (x * side < 0) x = -x * 0.35;
        var fold = 1 + 0.07 * Math.sin(9 * x + 2) * Math.sin(8 * y) * Math.sin(7 * z + 1);
        var X = side * 0.06 + x * 0.44 * fold, Y = y * 0.6 * fold, Z = z * 0.82 * fold;
        if (Y < -0.28) Y = -0.28 + (Y + 0.28) * 0.35;
        if (rnd() < 0.18) { var k = 0.55 + rnd() * 0.35; X *= k; Y *= k; Z *= k; }
        pts.push([X, Y + 0.05, Z]);
      }
      for (var s = 0; s < 40; s++) { var t = s / 40; pts.push([(rnd() - 0.5) * 0.06, -0.3 - t * 0.38, -0.25 - t * 0.12]); }
      return pts;
    };
    var buildNet = function () {
      var rnd = seedRand(42), pts = [];
      while (pts.length < 90) { var x = rnd() * 2 - 1, y = rnd() * 2 - 1, z = rnd() * 2 - 1; if (x * x + y * y + z * z < 1) pts.push([x * 1.15, y * 0.8, z]); }
      return pts;
    };
    var linkNearest = function (pts, k, maxD) {
      var edges = [], seen = {};
      for (var i = 0; i < pts.length; i++) {
        var best = [];
        for (var j = 0; j < pts.length; j++) {
          if (i === j) continue;
          var dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1], dz = pts[i][2] - pts[j][2], d = dx * dx + dy * dy + dz * dz;
          if (d > maxD * maxD) continue;
          best.push([d, j]);
        }
        best.sort(function (a, b) { return a[0] - b[0]; });
        for (var b = 0; b < Math.min(k, best.length); b++) { var a1 = Math.min(i, best[b][1]), a2 = Math.max(i, best[b][1]), key = a1 + '-' + a2; if (!seen[key]) { seen[key] = 1; edges.push([a1, a2]); } }
      }
      return edges;
    };
    vizEls.forEach(function (cv, vi) {
      var kind = cv.getAttribute('data-viz');
      var ctx2 = cv.getContext && cv.getContext('2d'); if (!ctx2) return;
      var pts = kind === 'brain' ? buildBrain() : buildNet();
      var edges = kind === 'brain' ? linkNearest(pts, 2, 0.16) : linkNearest(pts, 3, 0.62);
      var pulses = []; var rndP = seedRand(99 + vi);
      var vdpr = Math.min(2, win.devicePixelRatio || 1), VW = 0, VH = 0;
      var vsize = function () { VW = cv.clientWidth; VH = cv.clientHeight; if (!VW || !VH) return; cv.width = Math.round(VW * vdpr); cv.height = Math.round(VH * vdpr); };
      vsize();
      var yaw = kind === 'brain' ? 1.35 : 0, pitch = kind === 'brain' ? -0.18 : 0.35, pyaw = 0, ppitch = 0, tyaw = 0, tpitch = 0;
      var proj2 = [], tmp = [0, 0, 0, 0];
      var project = function (p, out) {
        var cy1 = Math.cos(yaw + pyaw), sy1 = Math.sin(yaw + pyaw), cp = Math.cos(pitch + ppitch), sp = Math.sin(pitch + ppitch);
        var x = p[0] * cy1 + p[2] * sy1, z = -p[0] * sy1 + p[2] * cy1;
        var y = p[1] * cp - z * sp; z = p[1] * sp + z * cp;
        var sc = Math.min(VW, VH) * vdpr * (kind === 'brain' ? 0.7 : 0.5), persp = 2.6 / (2.6 - z);
        out[0] = VW * vdpr / 2 + x * sc * persp; out[1] = VH * vdpr / 2 - y * sc * persp; out[2] = z; out[3] = persp;
      };
      var drawV = function (time) {
        var g = ctx2; g.clearRect(0, 0, cv.width, cv.height); if (!VW) return;
        for (var i = 0; i < pts.length; i++) { if (!proj2[i]) proj2[i] = [0, 0, 0, 0]; project(pts[i], proj2[i]); }
        g.lineWidth = 0.8 * vdpr;
        for (var e = 0; e < edges.length; e++) {
          var A = proj2[edges[e][0]], B = proj2[edges[e][1]], depth = ((A[2] + B[2]) / 2 + 1) / 2;
          g.strokeStyle = 'rgba(124,199,155,' + (0.05 + depth * (kind === 'brain' ? 0.28 : 0.4)).toFixed(3) + ')';
          g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
        }
        for (var n = 0; n < pts.length; n++) {
          var P2 = proj2[n], dd = (P2[2] + 1) / 2, rr = (kind === 'brain' ? 1.1 : 2.2) * vdpr * P2[3];
          g.fillStyle = 'rgba(143,208,170,' + (0.2 + dd * 0.75).toFixed(3) + ')';
          if (kind === 'brain') g.fillRect(P2[0] - rr / 2, P2[1] - rr / 2, rr, rr);
          else { g.beginPath(); g.arc(P2[0], P2[1], rr, 0, 6.283); g.fill(); if (dd > 0.7) { g.fillStyle = 'rgba(124,199,155,0.18)'; g.beginPath(); g.arc(P2[0], P2[1], rr * 3, 0, 6.283); g.fill(); } }
        }
        if (reduce) return;
        if (pulses.length < (kind === 'brain' ? 14 : 8) && rndP() < 0.12) pulses.push({ e: (rndP() * edges.length) | 0, t: 0, sp: 0.02 + rndP() * 0.03, hops: kind === 'brain' ? 4 : 3 });
        for (var q = pulses.length - 1; q >= 0; q--) {
          var pu = pulses[q]; pu.t += pu.sp;
          var ed = edges[pu.e], A2 = proj2[ed[0]], B2 = proj2[ed[1]];
          var x = A2[0] + (B2[0] - A2[0]) * pu.t, y = A2[1] + (B2[1] - A2[1]) * pu.t;
          g.strokeStyle = 'rgba(181,236,201,0.85)'; g.lineWidth = 1.6 * vdpr; g.beginPath(); g.moveTo(A2[0], A2[1]); g.lineTo(x, y); g.stroke();
          g.fillStyle = 'rgba(124,199,155,0.3)'; g.beginPath(); g.arc(x, y, 4 * vdpr, 0, 6.283); g.fill();
          g.fillStyle = '#e6fff0'; g.beginPath(); g.arc(x, y, 1.6 * vdpr, 0, 6.283); g.fill();
          if (pu.t >= 1) {
            pu.hops--; var end = ed[1], nexts = [];
            for (var z2 = 0; z2 < edges.length; z2++) if (z2 !== pu.e && (edges[z2][0] === end)) nexts.push(z2);
            if (pu.hops > 0 && nexts.length) { pu.e = nexts[(rndP() * nexts.length) | 0]; pu.t = 0; } else pulses.splice(q, 1);
          }
        }
      };
      if ('ResizeObserver' in win) { var vro = new win.ResizeObserver(function () { vsize(); if (reduce) drawV(0); }); vro.observe(cv); self.cleanups.push(function () { vro.disconnect(); }); }
      if (reduce) { drawV(0); return; }
      var vVis = false, vRaf = 0, vT0 = 0;
      var vLoop = function (now) {
        vRaf = 0; if (!vVis || doc.hidden) return;
        if (!vT0) vT0 = now; var ts = (now - vT0) / 1000;
        if (kind === 'brain') yaw = 1.35 + Math.sin(ts * 0.25) * 0.5; else yaw = ts * 0.12;
        pyaw += (tyaw - pyaw) * 0.06; ppitch += (tpitch - ppitch) * 0.06;
        drawV(now); vRaf = raf(vLoop);
      };
      if ('IntersectionObserver' in win) {
        var vio = new win.IntersectionObserver(function (en) { vVis = en[0].isIntersecting; if (vVis && !vRaf) vRaf = raf(vLoop); }, { threshold: 0 });
        vio.observe(cv); self.cleanups.push(function () { vio.disconnect(); });
      } else { vVis = true; vRaf = raf(vLoop); }
      on(cv.parentNode, 'pointermove', function (e) { if (e.pointerType && e.pointerType !== 'mouse') return; var r = cv.getBoundingClientRect(); tyaw = ((e.clientX - r.left) / r.width - 0.5) * 0.7; tpitch = ((e.clientY - r.top) / r.height - 0.5) * 0.4; }, { passive: true });
      on(cv.parentNode, 'pointerleave', function () { tyaw = 0; tpitch = 0; });
      on(doc, 'visibilitychange', function () { if (!doc.hidden && vVis && !vRaf) vRaf = raf(vLoop); });
      self.cleanups.push(function () { vVis = false; if (vRaf) win.cancelAnimationFrame(vRaf); });
    });

    /* --- Globe numérique 3D (canvas) --- */
    Array.prototype.forEach.call(root.querySelectorAll('[data-globe]'), function (gCanvas) {
    if (gCanvas.getContext) {
      var gctx = gCanvas.getContext('2d');
      var MASK = 'AAAAAAAAAAAAQgJASAgJISEhJAUMhJAQEhICAkrACAgIIUEg4AAMlZABMncABkLAARgQAgdg7MAMmJEhM3MEDsTckZ05MtNmZsnMmolpc/ktbv3Ntrz3Fv/6Wtvfeztff+/t//2Vt7331/722tv7/ytrf+/t/f+1t/P/dt7+ylv5+ytv9+2tvP21t/L2dt7u31t5+2tv5e+tjN21t/J3Vk7O31k7OSsr5e+szJy/k3JyVl7K3UmZOScn5e6s7JyZkzJ3Rl7O3UnZOSOn5+aMvJy7kzJzRk7OzQnZOXenZ+aE/JyZE7NzYm7PzMn5OTen5+aEnJ6bk/Nzbm7OzUu5PTen5+ac3Jybk3Nzak7Pzam5OTen5+bUnJyb03Nzbk7Oz+k5OTcn5+bU3JybU3Nyam7Pzam5OTen5+TU3J6b03Nyak7Pzak5OTen5uTUnJ6bUXNybk7Nyak5OTej5ubUjJ6bU3Nybk7NzakZOTen5uTEjJqbU3NybkbNyakZNSej5+TMjJqTEzN6RkbO6akZNScj5tSMjJ6TEzNqRkbOqbk5NScjZtSMjJzTE3NqRk7MqTk5MSen5tScnJhRE3JiTk7MqRkxPSMm5NSMmJhRE2JqTk7MqRkxMaMm5MSMmJhTc2JyTk7IqRkxMaMm5MSMmJhTMzJiRk7IiBkxNaMmZPSMnJIRM2JqRkzI6BkxNSMnRNSMnJLRM2JqRkzIqBk5JaMmxNSMmJBRM2JKRk3IqBkxJaMmxNSMmpBRM2JKRk3IqRk1JaMmxJSMnpJRc2JKRk2IKTk1JaMmxJScmpJTc2pKTk2JKTk1JaemxJSckpJTUmpKTkmJKTk1JaemxJScghJTUkpKTkmJKTklJaemlJScglJTUkpKRkkpKTkFJabmlJScglJTckpKRkkpKTkFJabklJScglJSUkpKREUpKTklpabklJScglJSckpKREEpKTgFpaSglJSIklJScEpKTUEpKTAlpaSglJSMklJScEpKTUEpKTAlpaSglBSKmlJSYEpKSUEpKTg1paSAlJQKmlJSYEpKSQGpKTQkpKSAlBSaClJTYEhISQGpKRQkpaTAlJSSClJTYEhISQEpKRQEpKTKkJCSAlJTaEhKSQUhKRQEpKbCkJCSClJSKQhITQUhKRUEpKbwEJCaAkJSKAhITQEhIRUFhKSQEJCaAkJQKAhITUEhIDUEhKSQEJCaAkJQCggITSEhIDUEhKKQEJCagkJQCggIRSEhIDUFhKKQEBCawkJQSggIRWEhICUFhKCQEBCCQkJASggIRSEpIAQEhKAUEBCKwkJACioIQSEhIASEhIAUEBCKwkJACigIQSEhICSEhYAUUBCKQkJASCgIAS2hIASUhICUVBAKSkJBSCgIASmhIASVhICUUBACSkJBCCgIASGpIASUhYKUUBAKSkJBCCgKBSGpIASUhIIQUBACSkJBCCgKBSmpIASUhIIQUBACSkJBCCgIBSGoKACUhKIQUBACSkJBAChIBSWoIASUhKIAUBAKClBBAChIRQWgIAQUhIIAUBCKClBBAChIRQWgIAAUgIIAUBCKClBBAChIBQWgIBAVoIIAUBCKCkBBICpABQGgIBQVgIIAVACKCkBBICpARQGgKBQVoIJAVIAKCkBBICpARQGoABQVgIJAVIAKCkARKCpABYGoABQUgIJAVIQKCkABKCpABYWoCBQVgAJQVIAKClERKChCBYWoCBQVgAJQVIAKClEBKCpCBYSoCBUVgSJSUIQKCkEBKCoCBYSoCBUUgwJSUIQKCEEBKCgCBYSgCBUUgwJyUAQKCEEBOCgGBaSgABUQgyJSUAQKCEEBKCgGBaSgCBUQgwJSUAQKCEEBKChGBaSgCBUQggJSUIQKCEEBKCBGBaSgCBQQggJQUAgKSFEBKCJGBaSoCBQQogJQRAgKSEEBKCAGBaCgABSQgwJQQAgKSEEBKCAGBaCgABSQggJQQAgKQEERKCAEBaCgEBSBggJQQAgKQEEBKCAEBaCAEBSBgiJQQAgKQEEBKAIFBaCAEBSBgiJQRAoKQAEBKAoFBaCAEBSAggJQBAoKQBEhKAoFRaCAEBSAgiJQFAoKQBEhKAIFRaCIFBSAIgJQFAqKQBEhKAIFRaAoFBSBIgJQBAqKQFEJKAJFRKAoFBSAIgJwBIqIQFEoKAJFBKAoFBSBohJQBIqIQFEoKAJFBKAIFBGBohBQBIqIQFEoIgJFBKAIFBGBohBUBIqIQBEoIgJFAaAIFBGBolBEFIqIQBEoIgJFAagIFBGBI1BEBIqCUBEoIgJFIagIFBGhIlBEBIqCUBEoAgJFoIgIFAGhIlBEBIoCUBEoAkJFoIgIFAWhIlAEBIpAEREoAkJFoAgIFAUhIlAEBIpAEREoAkJFoAgIFAEjIlAEhIpAERAoAkJFoAgIFIEjIlAEhIpAERAoAkJEoAgIFIEiIFAEhIpAERAoAkZEoAgIFYEiIFAEhIhAERAoAkRAoAgIEYEiIFAEjIhAERAoAkRAoAgIEYEiIFAEjIBAERAiAkVAoAAYAYEiIFAEiIBAARAiAkVAoAAQAYECIEAEiIBAARACAgVAgAAQAYECIEQECoAAASACAgRAgAAQAAECIAQECIAAASAAAgRAAAAQAAECQAAACIAAACAAAgRAAAAQAAECQAAACIAAACAQAgSAAAAQCAEAQAAACAAAACAQAgSAAAAQAAEAQCAAAAABACAAAACAAAAQAAAAQCAAAAABACAAAACAAAAAAAIAQAAAAAABAAAAAgCAAAAAAAAAQAAAAACBAAAAAACAAAAAAAIBAAAAAAABAAAAAAKAAAAAAAIAAAAAAAABAAAABAIAAAAAAAIAAAAIBAAAAAAABAAAAAAAAAIAAAAIAAAAAAAABAAAABAAAAIAAAAIAAAAAAAABAAAABAAAAAAAAAIAAAAAAAAAAAAABAAAAAAAAAIAAAAIAAAAAAAABAAAAAAAAAIAAAAIAAAAAAAABAAAAAAAAAAAAAAIAAAAAAAgAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
      var N = 20000, GA = Math.PI * (3 - Math.sqrt(5));
      var bin = win.atob(MASK);
      var land = [];
      for (var gi = 0; gi < N; gi++) {
        if ((bin.charCodeAt(gi >> 3) >> (gi & 7)) & 1) {
          var yy = 1 - 2 * (gi + 0.5) / N, rr = Math.sqrt(1 - yy * yy), th = GA * gi;
          land.push(Math.cos(th) * rr, yy, Math.sin(th) * rr);
        }
      }
      var vec = function (lat, lon) { var a = lat * Math.PI / 180, o = lon * Math.PI / 180; return [Math.cos(a) * Math.cos(o), Math.sin(a), Math.cos(a) * Math.sin(o)]; };
      var C = {
        reims: [49.26, 4.03], paris: [48.86, 2.35], lyon: [45.76, 4.84], marseille: [43.3, 5.37], bordeaux: [44.84, -0.58], lille: [50.63, 3.06], strasbourg: [48.57, 7.75], nantes: [47.22, -1.55], toulouse: [43.6, 1.44],
        bruxelles: [50.85, 4.35], londres: [51.5, -0.12], newyork: [40.7, -74], montreal: [45.5, -73.6], dakar: [14.7, -17.4], casablanca: [33.6, -7.6], dubai: [25.2, 55.3], tokyo: [35.7, 139.7],
        saopaulo: [-23.5, -46.6], singapour: [1.35, 103.8], sydney: [-33.9, 151.2], lecap: [-33.9, 18.4], sanfrancisco: [37.77, -122.4], nairobi: [-1.29, 36.8]
      };
      var nodes = {}; Object.keys(C).forEach(function (k) { nodes[k] = vec(C[k][0], C[k][1]); });
      var E = [['reims','paris'],['reims','lyon'],['reims','marseille'],['reims','bordeaux'],['reims','lille'],['reims','strasbourg'],['reims','nantes'],['reims','toulouse'],['reims','bruxelles'],
        ['reims','londres'],['reims','newyork'],['reims','montreal'],['reims','dakar'],['reims','dubai'],['reims','saopaulo'],['reims','tokyo'],['reims','nairobi'],
        ['newyork','sanfrancisco'],['londres','dubai'],['dubai','singapour'],['singapour','sydney'],['tokyo','sanfrancisco'],['dakar','saopaulo'],['casablanca','lecap'],['casablanca','reims'],['nairobi','lecap'],['singapour','tokyo']];
      var SEG = 44;
      var arcs = E.map(function (e, i) {
        var a = nodes[e[0]], b = nodes[e[1]];
        var dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), om = Math.acos(dot), so = Math.sin(om) || 1;
        var h = 0.04 + 0.32 * om / Math.PI, pts = [];
        for (var s = 0; s <= SEG; s++) {
          var t = s / SEG, k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so, lift = 1 + h * Math.sin(Math.PI * t);
          pts.push((a[0] * k1 + b[0] * k2) * lift, (a[1] * k1 + b[1] * k2) * lift, (a[2] * k1 + b[2] * k2) * lift);
        }
        return { p: pts, off: (i * 0.137) % 1, dur: 2.6 + (i % 5) * 0.55, start: i * 0.09 };
      });
      var grat = [];
      for (var m = 0; m < 12; m++) { var lo = m * 30, line = []; for (var la = -80; la <= 80; la += 8) { var v = vec(la, lo); line.push(v[0], v[1], v[2]); } grat.push(line); }
      for (var p2 = -60; p2 <= 60; p2 += 30) { var line2 = []; for (var lo2 = 0; lo2 <= 360; lo2 += 8) { var v2 = vec(p2, lo2); line2.push(v2[0], v2[1], v2[2]); } grat.push(line2); }
      var dpr = Math.min(2, win.devicePixelRatio || 1), W = 0, R = 0, cx = 0, cy = 0;
      var size = function () { var w = gCanvas.clientWidth; if (!w) return; W = w; gCanvas.width = Math.round(w * dpr); gCanvas.height = Math.round(w * dpr); R = w * 0.4 * dpr; cx = cy = w * 0.5 * dpr; };
      size();
      if ('ResizeObserver' in win) { var gro = new win.ResizeObserver(function () { size(); if (reduce) drawG(9999); }); gro.observe(gCanvas); self.cleanups.push(function () { gro.disconnect(); }); }
      var rotA = -85 * Math.PI / 180, tilt = 0.5, offA = 0, offT = 0, tgtA = 0, tgtT = 0;
      var proj = function (x, y, z, out) {
        var ca = Math.cos(rotA + offA), sa = Math.sin(rotA + offA), ct = Math.cos(tilt + offT), st = Math.sin(tilt + offT);
        var x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
        var y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
        out[0] = cx - x1 * R; out[1] = cy - y2 * R; out[2] = z2;
      };
      var P = [0, 0, 0], Q = [0, 0, 0];
      var drawG = function (time) {
        var g = gctx; g.clearRect(0, 0, gCanvas.width, gCanvas.height);
        if (!R) return;
        // Mode jour : globe clair et traits vert foncé ; mode nuit : globe sombre et traits vert clair.
        var LT = doc.documentElement.getAttribute('data-theme') === 'light';
        var DOT = LT ? '47,122,82' : '143,208,170', LINE = LT ? '47,138,91' : '124,199,155', GLOW = LT ? 'rgba(47,138,91,0.9)' : 'rgba(181,236,201,0.9)', CORE = LT ? '#1f5a3c' : '#e6fff0';
        var grd = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
        if (LT) { grd.addColorStop(0, 'rgba(255,255,255,0.95)'); grd.addColorStop(0.75, 'rgba(226,240,232,0.92)'); grd.addColorStop(1, 'rgba(124,199,155,0.3)'); }
        else { grd.addColorStop(0, 'rgba(29,53,41,0.55)'); grd.addColorStop(0.75, 'rgba(18,24,32,0.85)'); grd.addColorStop(1, 'rgba(124,199,155,0.16)'); }
        g.fillStyle = grd; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
        g.lineWidth = 1 * dpr; g.strokeStyle = 'rgba(' + LINE + ',0.35)'; g.stroke();
        g.lineWidth = 0.7 * dpr; g.strokeStyle = 'rgba(' + DOT + ',0.08)'; g.beginPath();
        grat.forEach(function (ln) { var pen = false; for (var j = 0; j < ln.length; j += 3) { proj(ln[j], ln[j + 1], ln[j + 2], P); if (P[2] > 0) { if (pen) g.lineTo(P[0], P[1]); else g.moveTo(P[0], P[1]); pen = true; } else pen = false; } });
        g.stroke();
        var ds = 1.25 * dpr;
        g.fillStyle = 'rgba(' + DOT + ',0.09)';
        for (var j = 0; j < land.length; j += 3) { proj(land[j], land[j + 1], land[j + 2], P); if (P[2] <= 0) g.fillRect(P[0] - ds / 2, P[1] - ds / 2, ds, ds); }
        var buckets = [[], [], [], []];
        for (var j2 = 0; j2 < land.length; j2 += 3) { proj(land[j2], land[j2 + 1], land[j2 + 2], P); if (P[2] > 0) { buckets[Math.min(3, (P[2] * 4) | 0)].push(P[0], P[1]); } }
        buckets.forEach(function (bk, bi) { g.fillStyle = 'rgba(' + DOT + ',' + (0.28 + bi * 0.2) + ')'; for (var q = 0; q < bk.length; q += 2) g.fillRect(bk[q] - ds / 2, bk[q + 1] - ds / 2, ds, ds); });
        var ts = time / 1000;
        arcs.forEach(function (a) {
          var f = reduce ? 1 : Math.max(0, Math.min(1, (ts - L / 1000 - 0.6 - a.start) / 1.1));
          if (f <= 0) return;
          var last = Math.round(SEG * f);
          g.lineWidth = 1 * dpr; g.beginPath(); var pen = false, vis = 0;
          for (var s = 0; s <= last; s++) { proj(a.p[s * 3], a.p[s * 3 + 1], a.p[s * 3 + 2], P); if (P[2] > -0.08) { if (pen) g.lineTo(P[0], P[1]); else g.moveTo(P[0], P[1]); pen = true; vis++; } else pen = false; }
          g.strokeStyle = 'rgba(' + LINE + ',0.5)'; g.stroke();
          if (f < 1 || reduce) return;
          var u = ((ts / a.dur) + a.off) % 1, si = Math.floor(u * SEG);
          g.lineWidth = 2 * dpr; g.strokeStyle = GLOW; g.beginPath(); pen = false;
          for (var s2 = Math.max(0, si - 6); s2 <= si; s2++) { proj(a.p[s2 * 3], a.p[s2 * 3 + 1], a.p[s2 * 3 + 2], P); if (P[2] > -0.05) { if (pen) g.lineTo(P[0], P[1]); else g.moveTo(P[0], P[1]); pen = true; } else pen = false; }
          g.stroke();
          proj(a.p[si * 3], a.p[si * 3 + 1], a.p[si * 3 + 2], Q);
          if (Q[2] > -0.05) { g.fillStyle = 'rgba(' + LINE + ',0.25)'; g.beginPath(); g.arc(Q[0], Q[1], 4.5 * dpr, 0, 6.283); g.fill(); g.fillStyle = CORE; g.beginPath(); g.arc(Q[0], Q[1], 1.6 * dpr, 0, 6.283); g.fill(); }
        });
        Object.keys(nodes).forEach(function (k, i) {
          var n = nodes[k]; proj(n[0], n[1], n[2], P); if (P[2] <= 0) return;
          var hub = k === 'reims', r0 = (hub ? 3.2 : 2) * dpr;
          var ph = reduce ? 0.5 : ((ts * 0.6 + i * 0.13) % 1);
          g.strokeStyle = 'rgba(' + LINE + ',' + (0.6 * (1 - ph) * P[2]) + ')'; g.lineWidth = 1 * dpr; g.beginPath(); g.arc(P[0], P[1], r0 + ph * (hub ? 14 : 8) * dpr, 0, 6.283); g.stroke();
          g.fillStyle = hub ? CORE : (LT ? 'rgba(47,138,91,' : 'rgba(181,236,201,') + (0.5 + 0.5 * P[2]) + ')'; g.beginPath(); g.arc(P[0], P[1], r0, 0, 6.283); g.fill();
          if (hub) { g.fillStyle = 'rgba(' + LINE + ',0.3)'; g.beginPath(); g.arc(P[0], P[1], r0 * 2.6, 0, 6.283); g.fill(); }
        });
      };
      if (reduce) { drawG(0); }
      else {
        var gVisible = true, gRaf = 0, gLast = 0;
        var gLoop = function (now) {
          gRaf = 0;
          if (!gVisible || doc.hidden) return;
          var dt = gLast ? Math.min(50, now - gLast) : 16; gLast = now;
          rotA += dt * 0.00011;
          offA += (tgtA - offA) * 0.05; offT += (tgtT - offT) * 0.05;
          drawG(now);
          gRaf = raf(gLoop);
        };
        var gStart = function () { if (!gRaf) { gLast = 0; gRaf = raf(gLoop); } };
        if ('IntersectionObserver' in win) {
          var gio = new win.IntersectionObserver(function (en) { gVisible = en[0].isIntersecting; if (gVisible) gStart(); }, { threshold: 0 });
          gio.observe(gCanvas); self.cleanups.push(function () { gio.disconnect(); });
        }
        on(doc, 'visibilitychange', function () { if (!doc.hidden) gStart(); });
        on(gCanvas.parentNode, 'pointermove', function (e) {
          if (e.pointerType && e.pointerType !== 'mouse') return;
          var r = gCanvas.getBoundingClientRect();
          tgtA = ((e.clientX - r.left) / r.width - 0.5) * 0.6;
          tgtT = ((e.clientY - r.top) / r.height - 0.5) * 0.3;
        }, { passive: true });
        on(gCanvas.parentNode, 'pointerleave', function () { tgtA = 0; tgtT = 0; });
        gStart();
        self.cleanups.push(function () { if (gRaf) win.cancelAnimationFrame(gRaf); gVisible = false; });
      }
    }
    });

})();
