/* =====================================================================
   Oxalis — comportements du site (accueil, /tarifs/, /devis/)
   JavaScript simple, sans dépendance, sans cookie ni stockage navigateur.
   Toutes les animations respectent « réduire les animations » : dans ce cas
   la classe .anim n'est pas posée et tout s'affiche directement.
   ===================================================================== */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement, win = window;
  var mq = function (q) { try { return win.matchMedia(q); } catch (e) { return { matches: false }; } };
  var reduce = mq('(prefers-reduced-motion: reduce)').matches;
  var fine = mq('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  if (!reduce) root.classList.add('anim');

  /* --- Mode jour / mode nuit ---
     Le thème est posé avant l'affichage par un petit script dans <head>.
     Le bouton le change et le mémorise dans « oxalis-theme » (seul réglage enregistré
     dans le navigateur, et seulement si le visiteur utilise le bouton). */
  var themeMeta = $('meta[name="theme-color"]');
  function applyTheme(t, save) {
    if (!reduce) { root.classList.add('theme-switch'); setTimeout(function () { root.classList.remove('theme-switch'); }, 500); }
    root.setAttribute('data-theme', t);
    if (themeMeta) themeMeta.setAttribute('content', t === 'light' ? '#f3f5f4' : '#0b1220');
    $$('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', t === 'light' ? 'Passer en mode nuit' : 'Passer en mode jour');
      b.setAttribute('title', t === 'light' ? 'Mode nuit' : 'Mode jour');
    });
    if (save) { try { localStorage.setItem('oxalis-theme', t); } catch (e) {} }
  }
  applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);
  root.classList.remove('theme-switch');
  $$('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true); });
  });
  // Sans choix enregistré, le site suit le réglage de l'appareil s'il change.
  var schemeMq = mq('(prefers-color-scheme: light)');
  if (schemeMq.addEventListener) schemeMq.addEventListener('change', function (e) {
    var saved = null; try { saved = localStorage.getItem('oxalis-theme'); } catch (err) {}
    if (saved !== 'light' && saved !== 'dark') applyTheme(e.matches ? 'light' : 'dark', false);
  });

  /* --- Découpage des titres en mots (pour l'apparition mot à mot) --- */
  function splitWords(el, cls) {
    var walker = doc.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), nodes = [], n, i = 0;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (t) {
      var parts = t.nodeValue.split(/(\s+)/), frag = doc.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(doc.createTextNode(p)); return; }
        if (cls === 'w') {
          var w = doc.createElement('span'); w.className = 'w';
          var s = doc.createElement('span'); s.textContent = p; s.style.setProperty('--wi', i++);
          w.appendChild(s); frag.appendChild(w);
        } else {
          var sw = doc.createElement('span'); sw.className = 'sw'; sw.textContent = p; frag.appendChild(sw);
        }
      });
      t.parentNode.replaceChild(frag, t);
    });
  }
  if (!reduce) {
    $$('[data-split]').forEach(function (el) { splitWords(el, 'w'); });
    $$('[data-scrub]').forEach(function (el) { splitWords(el, 'sw'); });
  }

  /* --- Apparitions au défilement --- */
  var revealEls = $$('[data-rv],[data-split],.ticks,.steps,.zone');
  if (!reduce && 'IntersectionObserver' in win) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* --- En-tête : fond au défilement, se cache en descendant, revient en remontant --- */
  var hd = $('.hd'), lastY = win.scrollY;
  function onHeader() {
    var y = win.scrollY;
    if (!hd) return;
    hd.classList.toggle('is-scrolled', y > 24);
    if (!root.classList.contains('menu-open')) hd.classList.toggle('is-hidden', y > 480 && y > lastY + 2);
    if (y < lastY - 2 || y < 480) hd.classList.remove('is-hidden');
    lastY = y;
    root.classList.toggle('show-sticky', y > win.innerHeight * 0.7);
  }

  /* --- Menu mobile plein écran --- */
  var burger = $('.hd__burger'), menu = $('.mm');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('is-open', open);
    if (open) { menu.removeAttribute('inert'); menu.setAttribute('aria-hidden', 'false'); }
    else { menu.setAttribute('inert', ''); menu.setAttribute('aria-hidden', 'true'); }
    root.classList.toggle('menu-open', open);
    if (open && hd) hd.classList.remove('is-hidden');
  }
  if (burger) burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
  if (menu) menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); if (burger) burger.focus(); } });

  /* --- Effets liés au défilement (un seul calcul par image) --- */
  var heroTitle = $('.hero h1'), heroEl = $('.hero');
  var scrubs = $$('[data-scrub]');
  var svcItems = $$('.svc-item'), svcCount = $('.svc__count b'), svcBar = $('.svc__bar');
  var flow = $('[data-flow]'), flowSteps = flow ? $$('.flow__step', flow) : [];
  var stage = $('.emb-stage');
  var vitrine = $('[data-vitrine] .lap');
  var ticking = false;
  function onScroll() {
    onHeader();
    if (reduce) return;
    var vh = win.innerHeight;
    // Hero : le titre monte un peu plus vite que la page et s'estompe
    if (heroTitle && heroEl) {
      var hy = win.scrollY, hh = heroEl.offsetHeight;
      if (hy < hh) {
        heroTitle.style.transform = 'translate3d(0,' + (hy * -0.18).toFixed(1) + 'px,0)';
        heroTitle.style.opacity = (1 - clamp(hy / (hh * 0.85), 0, 1) * 0.7).toFixed(3);
      }
    }
    // Texte qui s'éclaire mot à mot
    scrubs.forEach(function (el) {
      var r = el.getBoundingClientRect(), words = el._w || (el._w = $$('.sw', el));
      var p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1), lit = Math.round(p * words.length);
      if (el._lit === lit) return; el._lit = lit;
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('on', i < lit);
    });
    // Services : le bloc au centre de l'écran devient actif
    if (svcItems.length) {
      var act = 0;
      svcItems.forEach(function (it, i) { if (it.getBoundingClientRect().top < vh * 0.55) act = i; });
      svcItems.forEach(function (it, i) { it.classList.toggle('is-active', i === act); });
      if (svcCount) svcCount.textContent = String(act + 1).padStart(2, '0');
      if (svcBar) svcBar.style.setProperty('--p', ((act + 1) / svcItems.length).toFixed(3));
    }
    // Exemple d'automatisation : la ligne se remplit et les étapes s'allument
    if (flow) {
      var fr = flow.getBoundingClientRect();
      var fp = clamp((vh * 0.8 - fr.top) / (fr.height + vh * 0.25), 0, 1);
      flow.style.setProperty('--fp', fp.toFixed(3));
      flowSteps.forEach(function (s, i) { s.classList.toggle('is-on', fp >= (i / (flowSteps.length - 1)) * 0.98); });
    }
    // Hero : le portable arrive incliné vers l'arrière et se redresse au défilement
    if (vitrine) {
      var lr = vitrine.getBoundingClientRect();
      var lp = clamp((vh - lr.top) / (vh * 0.85), 0, 1), le = 1 - Math.pow(1 - lp, 2);
      vitrine.style.setProperty('--lt', ((1 - le) * 26).toFixed(2) + 'deg');
      vitrine.style.setProperty('--ls', (0.9 + le * 0.1).toFixed(4));
      vitrine.style.setProperty('--ly', ((1 - le) * 40).toFixed(1) + 'px');
    }
    // Réalisations : la fenêtre du site exemple se redresse en arrivant
    if (stage) {
      var sr = stage.getBoundingClientRect();
      var sp = clamp((vh - sr.top) / (vh * 0.75), 0, 1);
      stage.style.setProperty('--tilt', ((1 - sp) * 14).toFixed(2) + 'deg');
      stage.style.setProperty('--sc', (0.92 + sp * 0.08).toFixed(4));
    }
  }
  function requestTick() { if (!ticking) { ticking = true; win.requestAnimationFrame(function () { ticking = false; onScroll(); }); } }
  win.addEventListener('scroll', requestTick, { passive: true });
  win.addEventListener('resize', requestTick);
  onScroll();
  if (svcItems.length && reduce) svcItems.forEach(function (it) { it.classList.add('is-active'); });
  if (flow && reduce) { flow.style.setProperty('--fp', '1'); flowSteps.forEach(function (s) { s.classList.add('is-on'); }); }

  /* --- Bandeau défilant : avance tout seul, accélère avec le défilement --- */
  var track = $('.marquee__track');
  if (track && !reduce) {
    var x = 0, lastScroll = win.scrollY, boost = 0, groupW = 0;
    var measure = function () { var g = $('.marquee__group', track); groupW = g ? g.offsetWidth : 0; };
    measure(); win.addEventListener('resize', measure);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(measure);
    var loop = function () {
      var y = win.scrollY, dy = y - lastScroll; lastScroll = y;
      boost += (Math.abs(dy) * 0.25 - boost) * 0.08;
      x -= 0.55 + boost;
      if (groupW && -x >= groupW) x += groupW;
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      win.requestAnimationFrame(loop);
    };
    win.requestAnimationFrame(loop);
  }

  /* --- Lueur du hero qui suit doucement la souris, boutons aimantés --- */
  if (fine && !reduce) {
    var glow = $('.hero__glow'), gx = 0, gy = 0, tx = 0, ty = 0, gRaf = 0;
    var glowStep = function () {
      gx += (tx - gx) * 0.06; gy += (ty - gy) * 0.06;
      if (glow) { glow.style.setProperty('--gx', gx.toFixed(3)); glow.style.setProperty('--gy', gy.toFixed(3)); }
      gRaf = (Math.abs(tx - gx) > 0.002 || Math.abs(ty - gy) > 0.002) ? win.requestAnimationFrame(glowStep) : 0;
    };
    if (glow) win.addEventListener('pointermove', function (e) {
      tx = (e.clientX / win.innerWidth - 0.5) * 2; ty = (e.clientY / win.innerHeight - 0.5) * 2;
      if (!gRaf) gRaf = win.requestAnimationFrame(glowStep);
    }, { passive: true });
    $$('[data-magnet]').forEach(function (b) {
      b.style.transition = (b.style.transition ? b.style.transition + ', ' : '') + 'translate .5s cubic-bezier(.16,1,.3,1)';
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.translate = (((e.clientX - r.left) / r.width - 0.5) * 10).toFixed(1) + 'px ' + (((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = '0 0'; });
    });
  }

  /* --- Cartes qui s'inclinent sous la souris (data-tilt), ordinateur uniquement --- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.classList.add('tilting');
        card.style.transition = 'transform .14s linear, border-color .35s, box-shadow .35s';
        card.style.transform = 'perspective(900px) rotateX(' + ((0.5 - py) * 6).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 8).toFixed(2) + 'deg) translateY(-4px)';
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('tilting');
        card.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1), border-color .35s, box-shadow .35s';
        card.style.transform = '';
      });
    });
  }

  /* --- Site exemple intégré (Maçonnerie & Rénovation, entreprise fictive) --- */
  var emb = $('[data-embed]');
  if (emb) {
    var box = $('.emb-scroll', emb), sizer = $('.emb-sizer', emb), inner = $('.emb-inner', emb);
    var fit = function () {
      if (!box || !inner) return;
      var s = box.clientWidth / 1280;
      inner.style.width = '1280px';
      inner.style.transform = 'scale(' + s.toFixed(4) + ')';
      emb.style.setProperty('--es', s.toFixed(4));
      var h = inner.offsetHeight; if (h > 0) sizer.style.height = Math.ceil(h * s) + 'px';
    };
    fit();
    if ('ResizeObserver' in win) { var ro = new ResizeObserver(fit); ro.observe(inner); ro.observe(box); } else win.addEventListener('resize', fit);
    // Liens internes du site exemple : défilement dans la fenêtre, pas dans la page
    box.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#mx-"]');
      if (!a) return;
      var t = box.querySelector(a.getAttribute('href')); if (!t) return;
      e.preventDefault();
      var s = parseFloat(emb.style.getPropertyValue('--es')) || 1;
      var y = t.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 70 * s;
      box.scrollTo({ top: Math.max(0, y), behavior: reduce ? 'auto' : 'smooth' });
    });
    // Plein écran
    var full = $('[data-emb-full]', emb);
    if (full) full.addEventListener('click', function () {
      var on = !emb.classList.contains('is-full');
      emb.classList.toggle('is-full', on);
      full.setAttribute('aria-pressed', on ? 'true' : 'false');
      full.querySelector('span').textContent = on ? 'Réduire' : 'Plein écran';
      root.classList.toggle('menu-open', on);
      setTimeout(fit, 30);
    });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && emb.classList.contains('is-full') && full) full.click(); });
    var backdrop = emb.nextElementSibling;
    if (backdrop && backdrop.classList.contains('emb-backdrop')) backdrop.addEventListener('click', function () { if (full && emb.classList.contains('is-full')) full.click(); });
    // Menu du site exemple
    var mxBurger = $('[data-mx-burger]', emb), mxMenu = $('[data-mx-menu]', emb);
    var mxSet = function (open) {
      if (!mxBurger || !mxMenu) return;
      mxMenu.hidden = !open;
      mxBurger.setAttribute('aria-expanded', open ? 'true' : 'false');
      mxBurger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      var o = $('[data-mx-open]', mxBurger), c = $('[data-mx-close]', mxBurger);
      if (o) o.toggleAttribute('hidden', open); if (c) c.toggleAttribute('hidden', !open);
      if (open) box.scrollTop = 0;
    };
    if (mxBurger) mxBurger.addEventListener('click', function () { mxSet(mxMenu.hidden); });
    $$('[data-mx-close-menu]', emb).forEach(function (a) { a.addEventListener('click', function () { mxSet(false); }); });
    // Types de travaux (un seul choix)
    var types = $$('[data-mx-type]', emb);
    types.forEach(function (b) { b.addEventListener('click', function () { types.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); }); });
    // Avant / après
    $$('[data-ba-range]', emb).forEach(function (r) {
      r.addEventListener('input', function () { var ba = r.closest('[data-ba]'); if (ba) ba.style.setProperty('--pos', r.value + '%'); });
    });
    // Formulaire de démonstration (n'envoie rien)
    var mxForm = $('[data-mx-form]', emb), mxOk = $('[data-mx-ok]', emb);
    if (mxForm) mxForm.addEventListener('submit', function (e) { e.preventDefault(); mxForm.hidden = true; if (mxOk) mxOk.hidden = false; });
    // Apparitions à l'intérieur du site exemple
    var mxRoot = $('.mx-m', emb);
    if (mxRoot && !reduce && 'IntersectionObserver' in win) {
      mxRoot.classList.add('mx-anim');
      var mio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('mx-in'); mio.unobserve(en.target); } });
      }, { root: box, rootMargin: '0px 0px -6% 0px', threshold: 0.08 });
      $$('[data-r]', mxRoot).forEach(function (el) { mio.observe(el); });
    }
  }

  /* --- Formulaire de devis (Netlify Forms), envoi sans recharger la page --- */
  var form = $('[data-devis-form]');
  if (form) {
    var status = $('[data-send-status]', form), ok = $('[data-form-ok]');
    var btn = $('button[type="submit"]', form), sending = false;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      var tel = form.elements['telephone'], mail = form.elements['email'];
      var clear = function () { mail.setCustomValidity(''); };
      clear();
      if (!String(tel.value || '').trim() && !String(mail.value || '').trim()) {
        mail.setCustomValidity('Indiquez un téléphone ou un e-mail pour qu\'on puisse vous répondre.');
        mail.reportValidity();
        tel.addEventListener('input', clear, { once: true }); mail.addEventListener('input', clear, { once: true });
        return;
      }
      sending = true;
      if (btn) { btn.disabled = true; btn.classList.add('is-sending'); btn.setAttribute('aria-disabled', 'true'); }
      if (status) status.textContent = 'Envoi en cours…';
      var bes = form.elements['besoins'];
      if (bes) bes.value = $$('[data-besoin]:checked', form).map(function (c) { return c.value; }).join(', ');
      var data = new URLSearchParams(new FormData(form));
      if (!data.has('form-name')) data.set('form-name', 'devis');
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: data.toString() })
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.hidden = true; if (ok) { ok.hidden = false; ok.setAttribute('tabindex', '-1'); ok.focus(); }
        })
        .catch(function () {
          sending = false;
          if (btn) { btn.disabled = false; btn.classList.remove('is-sending'); btn.removeAttribute('aria-disabled'); }
          if (status) status.textContent = 'L\'envoi n\'a pas fonctionné. Écrivez-moi directement à contact@agence-oxalis.fr.';
        });
    });
  }
})();
