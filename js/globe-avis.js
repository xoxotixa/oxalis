/* =====================================================================
   Oxalis — globe 3D des avis clients (haut de la page d'accueil)
   Inspiré du composant « Testimonial Globe », réécrit sans React.
   - Le globe est dessiné par cobe (copie locale : js/vendor/cobe.esm.js).
   - Les avis viennent de /avis.json, rempli à la main avec les vrais avis
     Google d'Adrien (texte, nom, ville, coordonnées). Google ne donne pas la
     ville des auteurs : elle est saisie dans le fichier.
   - Chaque avis devient une pastille posée sur sa ville. Le globe tourne seul,
     se laisse attraper à la souris ou au doigt, et met les avis en avant un par
     un en tournant la pastille vers l'avant. La carte de l'avis s'affiche à côté.
   - Sans avis dans le fichier : le globe tourne avec Reims en vert, et la
     maquette « votre-site.fr » reste affichée à la place de la carte.
   Aucun service extérieur, aucun cookie. Immobile si « réduire les animations ».
   ===================================================================== */
import createGlobe from './vendor/cobe.esm.js';

const wrap = document.querySelector('[data-avis-globe]');
if (wrap) init(wrap);

const THETA = 0.3, RADIUS = 0.8, PIN_ALT = 0.05;
const TURN_MS = 1200, AUTO_MS = 5200, HOLD_MS = 7000, SPEED = 0.12, FRICTION = 0.92;
const REIMS = [49.26, 4.03];

function toCartesian(lat, lng) {
  const la = lat * Math.PI / 180, lo = lng * Math.PI / 180 - Math.PI, c = Math.cos(la);
  return [-c * Math.cos(lo), Math.sin(la), c * Math.sin(lo)];
}
// Même rotation que celle appliquée par cobe : les pastilles restent collées à la carte.
function project([x, y, z], phi, theta, alt) {
  const cp = Math.cos(phi), sp = Math.sin(phi), ct = Math.cos(theta), st = Math.sin(theta), r = RADIUS * (1 + alt);
  const sx = (cp * x + sp * z) * r, sy = (sp * st * x + ct * y - cp * st * z) * r;
  return { x: (sx + 1) / 2, y: (1 - sy) / 2, depth: -sp * ct * x + st * y + cp * ct * z, rim: Math.hypot(sx, sy) - RADIUS };
}
const facingPhi = (lng) => 3 * Math.PI / 2 - lng * Math.PI / 180;
const nearest = (from, a) => a + 2 * Math.PI * Math.round((from - a) / (2 * Math.PI));
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const easeOut = (t) => t >= 1 ? 1 : (1 - Math.pow(2, -10 * t)) / (1 - Math.pow(2, -10));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const initials = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0] || '').join('').toUpperCase();
function pinOpacity(depth, rim) {
  if (depth >= 0) return 0.45 + 0.55 * smooth(clamp01(depth / 0.3));
  return 0.45 * Math.max(clamp01(rim / 0.04), clamp01(1 + depth * 8)) * clamp01(1 + depth * 3);
}
const pinScale = (depth) => 0.62 + 0.38 * smooth(clamp01((depth + 0.2) / 0.7));

async function init(wrap) {
  let reduce = false;
  try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  const host = wrap.querySelector('.gl-canvas');
  const pinsBox = wrap.querySelector('.gl-pins');
  const visual = wrap.closest('.hero__visual') || wrap.parentElement;
  const mock = visual.querySelector('[data-mk-float]');
  const cardBox = visual.querySelector('[data-avis-card]');

  // 1. Les avis (fichier /avis.json). Une erreur de lecture laisse simplement le globe sans avis.
  let data = { lienGoogle: '', avis: [] };
  try {
    const r = await fetch('/avis.json', { cache: 'no-cache' });
    if (r.ok) data = await r.json();
  } catch (e) {}
  const items = (Array.isArray(data.avis) ? data.avis : []).filter((a) => a && a.texte && a.nom && isFinite(a.lat) && isFinite(a.lng));
  const vectors = items.map((a) => toCartesian(+a.lat, +a.lng));

  // 2. État partagé par la boucle d'animation.
  const s = { phi: facingPhi(items[0] ? +items[0].lng : REIMS[1]), velocity: 0, dragging: false, turn: null, featured: items.length ? 0 : null,
    hold: 0, hover: false, size: 0, visible: true, lastAuto: performance.now() };

  // 3. Le globe cobe (avec repli sans WebGL : une sphère en dégradé, les pastilles restent placées).
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block';
  host.appendChild(canvas);
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const measure = () => { s.size = Math.round(wrap.clientWidth); };
  measure();
  const light = () => document.documentElement.getAttribute('data-theme') === 'light';
  const palette = () => light()
    ? { dark: 0, diffuse: 0.5, mapBrightness: 1.4, mapBaseBrightness: 0, baseColor: [0.96, 0.98, 0.97], markerColor: [0.18, 0.54, 0.36], glowColor: [0.78, 0.9, 0.83] }
    : { dark: 1, diffuse: 1.2, mapBrightness: 6, mapBaseBrightness: 0, baseColor: [0.16, 0.24, 0.21], markerColor: [0.49, 0.78, 0.61], glowColor: [0.22, 0.38, 0.3] };
  const markers = () => [{ location: REIMS, size: 0.07 }].concat(items.map((a) => ({ location: [+a.lat, +a.lng], size: 0.035 })));
  let globe = null;
  try {
    globe = createGlobe(canvas, Object.assign({ devicePixelRatio: dpr, width: s.size, height: s.size, phi: s.phi, theta: THETA,
      mapSamples: 16000, markers: markers(), markerElevation: 0 }, palette()));
  } catch (e) { globe = null; }
  const gl = globe ? (canvas.getContext('webgl2') || canvas.getContext('webgl')) : null;
  if (!gl) { wrap.classList.add('gl-off'); globe = null; }
  new MutationObserver(() => { if (globe) { globe.update(palette()); kick(); } }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // 4. Pastilles des avis (vrais boutons : clavier et lecteurs d'écran).
  const pins = items.map((a, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'gl-pin';
    b.setAttribute('aria-label', 'Voir l\'avis de ' + a.nom + ', ' + a.ville);
    b.innerHTML = '<span class="gl-pin__ping" aria-hidden="true"></span><span class="gl-pin__face" aria-hidden="true">' + esc(initials(a.nom)) + '</span>';
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'touch' || s.dragging) return; s.hover = true; feature(i, false); });
    b.addEventListener('pointerleave', () => { s.hover = false; s.lastAuto = performance.now(); });
    b.addEventListener('click', () => { if (s.moved) { s.moved = false; return; } feature(i, true); s.hold = performance.now() + HOLD_MS; });
    b.addEventListener('focus', () => { if (b.matches(':focus-visible')) feature(i, true); });
    pinsBox.appendChild(b);
    return b;
  });

  // 5. Carte de l'avis mis en avant.
  if (items.length && cardBox) {
    if (mock) mock.hidden = true;
    cardBox.hidden = false;
  }
  const stars = (n) => { let h = ''; for (let k = 0; k < 5; k++) h += '<svg viewBox="0 0 20 20" class="' + (k < n ? 'on' : '') + '" aria-hidden="true"><path d="m10 2.2 2.4 4.9 5.4.8-3.9 3.8.9 5.4L10 14.6l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z"/></svg>'; return h; };
  function renderCard() {
    if (!cardBox || s.featured === null) return;
    const a = items[s.featured], note = Math.max(0, Math.min(5, Math.round(+a.note || 0)));
    const meta = [a.ville, a.pays].filter(Boolean).join(' · ');
    cardBox.innerHTML =
      '<div class="avis-card__top"><span class="avis-card__src"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"/><path fill="currentColor" opacity=".75" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="currentColor" opacity=".55" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9Z"/><path fill="currentColor" opacity=".4" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6Z"/></svg>Avis Google</span>' +
      (note ? '<span class="avis-card__stars" role="img" aria-label="Noté ' + note + ' sur 5">' + stars(note) + '</span>' : '') +
      (items.length > 1 ? '<span class="avis-card__nav"><button type="button" data-avis-prev aria-label="Avis précédent">‹</button><span>' + (s.featured + 1) + ' / ' + items.length + '</span><button type="button" data-avis-next aria-label="Avis suivant">›</button></span>' : '') +
      '</div><blockquote class="avis-card__q"><p>' + esc(a.texte) + '</p></blockquote>' +
      '<figcaption class="avis-card__who"><span class="avis-card__av" aria-hidden="true">' + esc(initials(a.nom)) + '</span><span class="avis-card__name"><b>' + esc(a.nom) + '</b>' + (meta ? '<span>' + esc(meta) + '</span>' : '') + '</span>' +
      (a.lien ? '<a class="avis-card__link" href="' + esc(a.lien) + '" target="_blank" rel="noopener">Voir sur Google<span class="sr-only"> (nouvel onglet)</span></a>' : '') + '</figcaption>' +
      (data.lienGoogle ? '<a class="avis-card__all" href="' + esc(data.lienGoogle) + '" target="_blank" rel="noopener">Tous nos avis Google →<span class="sr-only"> (nouvel onglet)</span></a>' : '');
    const prev = cardBox.querySelector('[data-avis-prev]'), next = cardBox.querySelector('[data-avis-next]');
    if (prev) prev.addEventListener('click', () => { feature((s.featured - 1 + items.length) % items.length, true); s.hold = performance.now() + HOLD_MS; });
    if (next) next.addEventListener('click', () => { feature((s.featured + 1) % items.length, true); s.hold = performance.now() + HOLD_MS; });
    if (!reduce) cardBox.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function feature(i, turn) {
    if (i === s.featured && !turn) return;
    if (i !== s.featured) { s.featured = i; renderCard(); }
    pins.forEach((p, k) => { p.toggleAttribute('data-on', k === i); p.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    if (turn) turnTo(i);
    s.lastAuto = performance.now();
    kick();
  }
  function turnTo(i) {
    const to = nearest(s.phi, facingPhi(+items[i].lng));
    s.velocity = 0;
    if (reduce) { s.phi = to; s.turn = null; } else s.turn = { from: s.phi, to, start: performance.now() };
  }
  if (items.length) { renderCard(); pins[0].toggleAttribute('data-on', true); }

  // 6. Glisser pour tourner le globe (souris ou doigt), avec élan au lâcher.
  let pressX = 0, lastX = 0, lastT = 0, pointer = -1;
  wrap.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    pointer = e.pointerId; pressX = lastX = e.clientX; lastT = e.timeStamp; s.velocity = 0; s.moved = false;
    if (!e.target.closest('.gl-pin')) { s.dragging = true; s.turn = null; wrap.setPointerCapture(e.pointerId); }
    kick();
  });
  wrap.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointer) return;
    if (!s.dragging) { if (Math.abs(e.clientX - pressX) < 6) return; s.dragging = true; s.moved = true; s.turn = null; wrap.setPointerCapture(e.pointerId); }
    const d = (e.clientX - lastX) / Math.max(s.size, 1) * Math.PI, dt = Math.max(e.timeStamp - lastT, 1);
    s.phi += d; s.velocity = d / dt * (1000 / 60); lastX = e.clientX; lastT = e.timeStamp;
    if (Math.abs(e.clientX - pressX) > 6) s.moved = true;
    kick();
  });
  const end = (e) => { if (e.pointerId !== pointer) return; if (reduce || e.timeStamp - lastT > 120) s.velocity = 0; s.dragging = false; pointer = -1; s.lastAuto = performance.now(); kick(); };
  wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end);

  // 7. Boucle : rotation, virage vers l'avis mis en avant, défilement automatique, placement des pastilles.
  let raf = 0, last = 0, renderedSize = s.size;
  function frame(now) {
    raf = 0;
    const dt = last ? Math.min((now - last) / 1000, 0.1) : 0; last = now;
    if (s.turn) {
      const t = clamp01((now - s.turn.start) / TURN_MS);
      s.phi = s.turn.from + (s.turn.to - s.turn.from) * easeOut(t);
      if (t >= 1) { s.phi = s.turn.to; s.turn = null; }
    } else if (!s.dragging) {
      if (Math.abs(s.velocity) > 1e-4) { const k = dt * 60; s.phi += s.velocity * k; s.velocity *= Math.pow(FRICTION, k); }
      else if (!reduce && now > s.hold && !s.hover) s.phi += SPEED * dt;
    }
    // Avis suivant toutes les ~5 s, si personne n'interagit.
    if (!reduce && items.length > 1 && !s.dragging && !s.hover && now > s.hold && now - s.lastAuto > AUTO_MS && !document.hidden) {
      feature((s.featured + 1) % items.length, true);
    }
    if (globe) {
      if (s.size !== renderedSize) { renderedSize = s.size; globe.update({ phi: s.phi, theta: THETA, width: s.size, height: s.size }); }
      else globe.update({ phi: s.phi, theta: THETA });
    }
    place();
    if (s.visible && !document.hidden && !reduce) raf = requestAnimationFrame(frame); else last = 0;
  }
  function place() {
    const d = s.size;
    vectors.forEach((v, i) => {
      const p = project(v, s.phi, THETA, PIN_ALT), el = pins[i];
      const op = Math.round(pinOpacity(p.depth, p.rim) * 100) / 100;
      el.style.opacity = op;
      el.style.zIndex = String((i === s.featured ? 100 : 0) + Math.round((p.depth + 1) * 40));
      el.style.pointerEvents = op > 0.4 ? 'auto' : 'none';
      el.tabIndex = op > 0.4 ? 0 : -1;
      if (op > 0) el.style.transform = 'translate3d(' + (p.x * d).toFixed(1) + 'px,' + (p.y * d).toFixed(1) + 'px,0) translate(-50%,-50%) scale(' + pinScale(p.depth).toFixed(3) + ')';
    });
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  // Quelques images tardives : cobe charge sa carte du monde juste après le démarrage.
  [150, 600, 1500].forEach((ms) => setTimeout(kick, ms));
  new ResizeObserver(() => { measure(); kick(); }).observe(wrap);
  new IntersectionObserver((en) => { s.visible = en[0] ? en[0].isIntersecting : true; if (s.visible) kick(); }).observe(wrap);
  document.addEventListener('visibilitychange', kick);
  kick();
}
