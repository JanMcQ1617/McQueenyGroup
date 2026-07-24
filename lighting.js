/* ============================================================================
   Idealize Lighting Engine  ·  v1
   Combined interactive lighting for static sites:
     1. Cursor spotlight   — a soft light that follows the pointer (whole page)
     2. Aurora hero        — slow drifting light blobs behind the hero headline
     3. Spotlight cards    — cards catch a moving highlight + lit edge on hover
   Self-contained, theme-adaptive (reads the page's own background luminance),
   non-destructive (blend modes, pointer-events:none, no layout shift), and
   guarded for reduced-motion + touch devices. Auto-skips the aurora when the
   hero is a WebGL/canvas scene so it never fights an existing 3D background.
   Tune per page (optional) via window.LIGHTING_CONFIG set BEFORE this script.
   ========================================================================== */
(function () {
  if (window.__lxLighting) return;
  window.__lxLighting = true;

  var CFG = window.LIGHTING_CONFIG || {};
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches; // touch / no fine pointer

  /* ---- theme detection: luminance of the page background --------------- */
  function lumOf(str) {
    var m = (str || '').match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var p = m[1].split(',').map(parseFloat);
    if (p.length > 3 && p[3] === 0) return null;           // transparent
    function ch(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
    return 0.2126 * ch(p[0]) + 0.7152 * ch(p[1]) + 0.0722 * ch(p[2]);
  }
  var lum = lumOf(getComputedStyle(document.body).backgroundColor);
  if (lum === null) lum = lumOf(getComputedStyle(document.documentElement).backgroundColor);
  if (lum === null) lum = 1;
  var isDark = CFG.theme ? CFG.theme === 'dark' : lum < 0.45;

  /* ---- accent colour (falls back to a warm/cool default) --------------- */
  function readVar(names) {
    var cs = getComputedStyle(document.documentElement);
    for (var i = 0; i < names.length; i++) {
      var v = cs.getPropertyValue(names[i]).trim();
      if (v) return v;
    }
    return '';
  }
  var accent = CFG.accent ||
    readVar(['--accent', '--brand', '--gold', '--primary', '--accent-color',
             '--color-accent', '--brass', '--c-accent']) ||
    (isDark ? '#ffd9a8' : '#c99a45');

  // color-mix keeps this format-agnostic (hex / rgb / hsl / named all work).
  function mix(pct) { return 'color-mix(in srgb, var(--lx-accent) ' + pct + '%, transparent)'; }

  var spotBlend = isDark ? 'screen' : 'multiply';
  var spotStrength = CFG.strength != null ? CFG.strength : (isDark ? 18 : 14);

  /* ---- inject stylesheet ---------------------------------------------- */
  var css = [
    ':root{--lx-accent:' + accent + ';--lx-x:50vw;--lx-y:40vh;}',

    /* 1 · cursor spotlight */
    '.lx-spot{position:fixed;inset:0;z-index:2147483000;pointer-events:none;' +
      'mix-blend-mode:' + spotBlend + ';opacity:0;transition:opacity .6s ease;' +
      'background:radial-gradient(600px circle at var(--lx-x) var(--lx-y),' +
      mix(spotStrength) + ' 0%,transparent 60%);}',
    '.lx-spot.on{opacity:1;}',

    /* 2 · aurora hero */
    '.lx-aurora{position:absolute;inset:0;overflow:hidden;pointer-events:none;' +
      'z-index:0;mix-blend-mode:' + (isDark ? 'screen' : 'soft-light') + ';}',
    '.lx-aurora b{position:absolute;display:block;border-radius:50%;' +
      'filter:blur(60px);opacity:' + (isDark ? '.5' : '.7') + ';will-change:transform;}',
    '.lx-aurora b:nth-child(1){width:46vmax;height:46vmax;left:-8%;top:-30%;' +
      'background:radial-gradient(circle,' + mix(isDark ? 55 : 42) + ',transparent 70%);' +
      'animation:lx-d1 22s ease-in-out infinite;}',
    '.lx-aurora b:nth-child(2){width:38vmax;height:38vmax;right:-6%;top:-18%;' +
      'background:radial-gradient(circle,color-mix(in srgb,var(--lx-accent) ' + (isDark ? 40 : 32) +
      '%,#ffffff) 0%,transparent 70%);animation:lx-d2 28s ease-in-out infinite;}',
    '.lx-aurora b:nth-child(3){width:30vmax;height:30vmax;left:30%;bottom:-40%;' +
      'background:radial-gradient(circle,' + mix(isDark ? 38 : 30) + ',transparent 70%);' +
      'animation:lx-d3 34s ease-in-out infinite;}',
    '@keyframes lx-d1{0%,100%{transform:translate(0,0)}50%{transform:translate(8%,12%)}}',
    '@keyframes lx-d2{0%,100%{transform:translate(0,0)}50%{transform:translate(-10%,8%)}}',
    '@keyframes lx-d3{0%,100%{transform:translate(0,0)}50%{transform:translate(6%,-10%)}}',

    /* 3 · spotlight cards */
    '.lx-card{position:relative;}',
    '.lx-card>.lx-card-glow{position:absolute;inset:0;border-radius:inherit;' +
      'pointer-events:none;z-index:1;opacity:0;transition:opacity .35s ease;' +
      'mix-blend-mode:' + (isDark ? 'screen' : 'soft-light') + ';overflow:hidden;' +
      'background:radial-gradient(220px circle at var(--lx-mx,50%) var(--lx-my,50%),' +
      mix(isDark ? 30 : 45) + ' 0%,transparent 70%);}',
    '.lx-card:hover>.lx-card-glow{opacity:1;}',

    reduce ? '.lx-aurora b{animation:none!important;}' : ''
  ].join('');

  var style = document.createElement('style');
  style.id = 'lx-lighting';
  style.textContent = css;
  document.head.appendChild(style);

  /* ---- 1 · cursor spotlight ------------------------------------------- */
  if (!coarse && CFG.spotlight !== false) {
    var spot = document.createElement('div');
    spot.className = 'lx-spot';
    document.body.appendChild(spot);
    var px = 0, py = 0, queued = false;
    function paint() {
      queued = false;
      document.documentElement.style.setProperty('--lx-x', px + 'px');
      document.documentElement.style.setProperty('--lx-y', py + 'px');
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      px = e.clientX; py = e.clientY;
      spot.classList.add('on');
      if (!queued) { queued = true; requestAnimationFrame(paint); }
    }, { passive: true });
    window.addEventListener('mouseleave', function () { spot.classList.remove('on'); });
  }

  /* ---- 2 · aurora hero ------------------------------------------------- */
  // A large canvas anywhere is almost certainly a decorative WebGL/2D scene
  // (idealize, subelo, mcqueeny). Never lay the aurora over one.
  function hasBackgroundCanvas() {
    var docW = document.documentElement.clientWidth || 0;
    var cvs = document.querySelectorAll('canvas');
    for (var i = 0; i < cvs.length; i++) {
      var c = cvs[i], r = c.getBoundingClientRect(), pos = getComputedStyle(c).position;
      // a fixed canvas is virtually always a full-screen background scene
      if (pos === 'fixed') return true;
      // absolute scenes: tall, pinned decorative layers
      if (pos === 'absolute' && r.height >= 300) return true;
      // … or simply span most of the page width (when width is measurable)
      if (docW && r.width >= docW * 0.6 && r.height >= 300) return true;
    }
    return false;
  }
  function initAurora() {
    if (CFG.aurora === false || hasBackgroundCanvas()) return;
    // Walk candidate selectors in priority order and pick the first element
    // that is actually a hero-sized band near the top — never a nav bar.
    var heroList = CFG.heroSelector
      ? [CFG.heroSelector]
      : ['.hero', '.g-hero', '.hero-inner', '.hero-wrap', '[class*="hero"]',
         'main > section:first-of-type', 'header'];
    var hero = null;
    var vh = window.innerHeight || 1000;        // pane can report 0 — fall back
    for (var hi = 0; hi < heroList.length && !hero; hi++) {
      var cands = document.querySelectorAll(heroList[hi]);
      for (var ci = 0; ci < cands.length; ci++) {
        var el = cands[ci], rc = el.getBoundingClientRect();
        if (rc.height >= 220 && rc.top < vh) { hero = el; break; }
      }
    }
    // skip when the hero is (or wraps) a live canvas / WebGL scene
    if (hero && !hero.querySelector('canvas') && hero.tagName !== 'CANVAS') {
      var cs = getComputedStyle(hero);
      if (cs.position === 'static') hero.style.position = 'relative';
      var aurora = document.createElement('div');
      aurora.className = 'lx-aurora';
      aurora.setAttribute('aria-hidden', 'true');
      aurora.innerHTML = '<b></b><b></b><b></b>';
      hero.insertBefore(aurora, hero.firstChild);
      // lift real hero content above the aurora layer
      Array.prototype.forEach.call(hero.children, function (el) {
        if (el === aurora) return;
        if (el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;
        var p = getComputedStyle(el).position;
        if (p === 'static') el.style.position = 'relative';
        if (!el.style.zIndex) el.style.zIndex = '1';
      });
    }
  }
  // Run after load so late-initialised WebGL/canvas backgrounds are settled
  // (their position:fixed may not exist yet at DOMContentLoaded).
  if (document.readyState === 'complete') initAurora();
  else window.addEventListener('load', initAurora, { once: true });

  /* ---- 3 · spotlight cards -------------------------------------------- */
  if (!coarse && CFG.cards !== false) {
    // A card is any element with a class TOKEN ending in card/tarjeta (so
    // ritual__card, g-card, logo-card, escuela-card, plain card all match)
    // but NOT containers/sub-parts (card-grid, card-icon, g-card__inner).
    var cardRe = /(^|[-_])(card|tarjeta)$/i;
    var cards = CFG.cardSelector
      ? document.querySelectorAll(CFG.cardSelector)
      : Array.prototype.filter.call(document.querySelectorAll('[class]'), function (el) {
          if (el.getBoundingClientRect().height < 60) return false; // skip chips/badges
          return Array.prototype.some.call(el.classList, function (t) {
            return cardRe.test(t) || t === 'tile' || t === 'panel';
          });
        });
    Array.prototype.forEach.call(cards, function (card) {
      if (card.classList.contains('lx-card')) return;
      card.classList.add('lx-card');
      var glow = document.createElement('span');
      glow.className = 'lx-card-glow';
      glow.setAttribute('aria-hidden', 'true');
      card.appendChild(glow);
      card.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        var r = card.getBoundingClientRect();
        card.style.setProperty('--lx-mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--lx-my', (e.clientY - r.top) + 'px');
      }, { passive: true });
    });
  }
})();
