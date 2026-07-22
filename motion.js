/* ============================================================
   HORNOFINO · motion.js — capa de movimiento compartida
   Preloader, split-text, reveals escalonados, parallax,
   botones magnéticos, tilt 3D, contadores, fly-to-cart,
   confetti y marquee. Todo respeta prefers-reduced-motion.
   ============================================================ */

const HF_REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HF_FINE = window.matchMedia('(pointer: fine)').matches;

/* ---------- Split text: envuelve palabras para animar líneas ---------- */
function hfSplitText(sel) {
  document.querySelectorAll(sel).forEach(el => {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w =>
      `<span class="w"><span class="wi">${w}</span></span>`).join(' ');
    el.querySelectorAll('.wi').forEach((w, i) => {
      w.style.transitionDelay = (i * 0.05) + 's';
    });
  });
}

/* ---------- Preloader (solo si existe #preloader) ---------- */
function hfPreloader() {
  const pre = document.getElementById('preloader');
  if (!pre) { document.body.classList.add('is-loaded'); return; }
  if (HF_REDUCED) { pre.remove(); document.body.classList.add('is-loaded'); return; }
  document.body.classList.add('is-locked');
  const done = () => {
    pre.classList.add('leave');
    document.body.classList.add('is-loaded');
    document.body.classList.remove('is-locked');
    setTimeout(() => pre.remove(), 900);
  };
  // corto y decidido: nunca más de 1.6s
  setTimeout(done, 1450);
}

/* ---------- Reveals escalonados ---------- */
function hfReveals() {
  const els = document.querySelectorAll('[data-reveal], .reveal');
  if (HF_REDUCED) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const d = parseFloat(el.dataset.delay || 0);
      setTimeout(() => el.classList.add('in'), d * 1000);
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
  els.forEach(el => io.observe(el));
}

/* ---------- Parallax suave (imágenes con data-parallax) ---------- */
function hfParallax() {
  if (HF_REDUCED) return;
  let els = Array.from(document.querySelectorAll('[data-parallax]'));
  // el menú se re-renderiza al cambiar Regular/Light: re-escanea
  document.addEventListener('hf:rerender', () => {
    els = Array.from(document.querySelectorAll('[data-parallax]'));
  });
  let ticking = false;
  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    els.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      const p = (r.top + r.height / 2 - vh / 2) / vh;    // -0.5 … 0.5 aprox
      const amp = parseFloat(el.dataset.parallax) || 26;
      el.style.transform = `translate3d(0, ${(-p * amp).toFixed(1)}px, 0) scale(1.12)`;
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}

/* ---------- Botones magnéticos ---------- */
function hfMagnetic() {
  if (HF_REDUCED || !HF_FINE) return;
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    const strength = parseFloat(el.dataset.magnetic) || 0.28;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform .5s cubic-bezier(.2,.9,.25,1.2)';
      el.style.transform = '';
      setTimeout(() => { el.style.transition = ''; }, 500);
    });
  });
}

/* ---------- Tilt 3D (tarjeta de sellos, cards) ---------- */
function hfTilt() {
  if (HF_REDUCED || !HF_FINE) return;
  document.querySelectorAll('[data-tilt]').forEach(el => {
    const max = parseFloat(el.dataset.tilt) || 7;
    el.style.transformStyle = 'preserve-3d';
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
    });
    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform .6s cubic-bezier(.2,.9,.25,1.15)';
      el.style.transform = 'perspective(900px)';
      setTimeout(() => { el.style.transition = ''; }, 600);
    });
  });
}

/* ---------- Contadores (data-count="239") ---------- */
function hfCounters() {
  const els = document.querySelectorAll('[data-count]');
  if (!els.length) return;
  const run = el => {
    const target = parseInt(el.dataset.count, 10);
    if (HF_REDUCED) { el.textContent = target; return; }
    const t0 = performance.now(), dur = 1300;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
  }), { threshold: 0.5 });
  els.forEach(el => io.observe(el));
}

/* ---------- Fly-to-cart: una migaja vuela del botón a la canasta ---------- */
function hfFlyToCart(fromEl) {
  if (HF_REDUCED) return;
  const target = document.getElementById('cartOpen');
  if (!fromEl || !target) return;
  const a = fromEl.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dot = document.createElement('span');
  dot.className = 'fly-crumb';
  dot.style.left = (a.left + a.width / 2) + 'px';
  dot.style.top = (a.top + a.height / 2) + 'px';
  document.body.appendChild(dot);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  dot.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 90}px) scale(.9)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(.25)`, opacity: 0.4 }
  ], { duration: 620, easing: 'cubic-bezier(.3,.7,.35,1)' }).onfinish = () => {
    dot.remove();
    target.classList.remove('bump');
    void target.offsetWidth;   // reinicia la animación
    target.classList.add('bump');
  };
}

/* ---------- Confetti (canje de premio / tarjeta llena) ---------- */
function hfConfetti(container) {
  if (HF_REDUCED) return;
  const host = container || document.body;
  const colors = ['#C96F3B', '#E8B04B', '#57734F', '#FBF5EA', '#A85526'];
  for (let i = 0; i < 26; i++) {
    const c = document.createElement('span');
    c.className = 'confetti';
    c.style.background = colors[i % colors.length];
    c.style.left = '50%';
    c.style.top = '38%';
    host.appendChild(c);
    const ang = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 150;
    const rot = (Math.random() - 0.5) * 720;
    c.animate([
      { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
      { transform: `translate(${Math.cos(ang) * dist - 50}%, ${Math.sin(ang) * dist * 0.85 + 90}%) rotate(${rot}deg)`, opacity: 0 }
    ], { duration: 1050 + Math.random() * 500, easing: 'cubic-bezier(.2,.75,.3,1)' })
     .onfinish = () => c.remove();
  }
}

/* ---------- Pill deslizante en las pestañas de categoría ---------- */
function hfTabPill() {
  const scroll = document.getElementById('catTabs');
  if (!scroll) return;
  let pill = scroll.querySelector('.cat-pill');
  const sync = () => {
    const active = scroll.querySelector('.cat-tab.active');
    if (!active) return;
    if (!pill || !scroll.contains(pill)) {
      pill = document.createElement('span');
      pill.className = 'cat-pill';
      scroll.prepend(pill);
    }
    pill.style.width = active.offsetWidth + 'px';
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
    active.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: HF_REDUCED ? 'auto' : 'smooth' });
  };
  // observa cambios de clase dentro de las pestañas
  new MutationObserver(sync).observe(scroll, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
  window.addEventListener('resize', sync, { passive: true });
  requestAnimationFrame(sync);
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  if (HF_REDUCED) document.body.classList.add('no-motion');
  hfSplitText('[data-split-text]');
  document.body.classList.add('motion-ready');
  hfPreloader();
  hfReveals();
  hfParallax();
  hfMagnetic();
  hfTilt();
  hfCounters();
  hfTabPill();
});
