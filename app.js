/* ============================================================
   HORNOFINO · páginas de tienda
   Menú (Regular/Light) + canasta + rutas de orden por tienda
   + Horno Rewards (localStorage, válido en las tres tiendas).
   Cada página define window.STORE_ID antes de cargar este archivo.
   ============================================================ */

/* TODO(Jan): sustituir "wa" por el número real de WhatsApp de cada
   tienda (formato 1787XXXXXXX) y "email" por el correo real.
   Los valores actuales son placeholders y no envían a ningún lado. */
const STORES = {
  cupey: {
    name: 'Cupey',
    title: 'HORNOFINO Cupey',
    addr: 'Cupey Professional Mall · C. San Claudio, San Juan, PR 00926',
    maps: 'https://maps.google.com/?q=Hornofino+Cupey+Professional+Mall+C.+San+Claudio+San+Juan+00926',
    hours: 'Lun–Sáb 7:00 AM – 6:00 PM · Dom 7:00 AM – 3:00 PM',
    wa: '17870000001',        /* PLACEHOLDER */
    email: 'cupey@hornofino.example' /* PLACEHOLDER */
  },
  guaynabo: {
    name: 'Apolo · Guaynabo',
    title: 'HORNOFINO Apolo',
    addr: 'Centro Comercial Apolo · Av. Lic. R. Rodríguez Apolo, Local #7, Guaynabo, PR 00969',
    maps: 'https://maps.google.com/?q=Hornofino+Centro+Comercial+Apolo+Guaynabo+00969',
    hours: 'Lun–Sáb 6:00 AM – 8:00 PM · Dom 6:00 AM – 5:00 PM',
    wa: '17870000002',        /* PLACEHOLDER */
    email: 'guaynabo@hornofino.example' /* PLACEHOLDER */
  },
  bayamon: {
    name: 'Los Filtros · Bayamón',
    title: 'HORNOFINO Los Filtros',
    addr: 'Centro Comercial Los Filtros, Local #9, Bayamón, PR 00956',
    maps: 'https://maps.google.com/?q=Hornofino+Centro+Comercial+Los+Filtros+Bayamon+00956',
    hours: 'Lun–Sáb 6:00 AM – 10:00 PM · Dom 6:00 AM – 8:00 PM',
    wa: '17870000003',        /* PLACEHOLDER */
    email: 'bayamon@hornofino.example' /* PLACEHOLDER */
  }
};

const STORE = STORES[window.STORE_ID];
const REWARDS_GOAL = 8;
const LS_CART = 'hf_cart_' + window.STORE_ID; // canasta separada por tienda
const LS_REWARDS = 'hf_rewards';               // tarjeta compartida entre tiendas
const LS_LAST_STORE = 'hf_last_store';         // el home la usa para "seguir en tu panadería"

const $ = (sel, el) => (el || document).querySelector(sel);
const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
const money = n => '$' + n.toFixed(2);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Iconos SVG inline (nada de emojis como iconos) */
const ICON = {
  plus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  basket: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16l-1.6 9a2 2 0 0 1-2 1.6H7.6a2 2 0 0 1-2-1.6L4 10z"/><path d="M8.2 10L12 4l3.8 6"/></svg>',
  bread: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14.5c0-4.5 4-7.5 8-7.5s8 3 8 7.5c0 2.2-2.5 3-8 3s-8-.8-8-3z"/><path d="M9 10.8l-1 2.2M13 10l-1 2.2M16.6 10.8l-1 2.2"/></svg>',
  wheat: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21v-8"/><path d="M12 13c-2.8 0-4.6-1.8-4.6-4.6C10.2 8.4 12 10.2 12 13zm0 0c2.8 0 4.6-1.8 4.6-4.6C13.8 8.4 12 10.2 12 13z"/><path d="M12 8C9.8 8 8.2 6.4 8.2 4.2 10.4 4.2 12 5.8 12 8zm0 0c2.2 0 3.8-1.6 3.8-3.8C13.6 4.2 12 5.8 12 8z"/></svg>',
  leaf: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4c-9 0-14 4.6-14 11.4 0 1.9.7 3.8.7 3.8s6.9 1.4 11-2.7C21.8 12.4 20 4 20 4z"/><path d="M6.7 19.2C10 12.6 15 8.4 20 4"/></svg>',
  send: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  gift: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12v9H4v-9M2 7h20v5H2zM12 7v14"/><path d="M12 7C10.5 7 7.5 6.3 7.5 4A2.3 2.3 0 0 1 12 3.7 2.3 2.3 0 0 1 16.5 4c0 2.3-3 3-4.5 3z"/></svg>',
  bowl: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16a8 8 0 0 1-16 0z"/><path d="M9 12V8M15 12V6"/></svg>',
  toast: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10.5A3.8 3.8 0 0 1 7.8 3.5h8.4A3.8 3.8 0 0 1 18 10.5V20H6v-9.5z"/><circle cx="12" cy="13.5" r="2.2"/></svg>',
  cake: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16L12 5 4 20z"/><path d="M9.5 14.5c1 .8 2 .8 3 0s2-.8 3 0"/></svg>',
  juice: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4h11l-1.4 17h-8.2L6.5 4z"/><path d="M7 9h10M11 4l4.5-2.5"/></svg>',
  berry: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="14" r="4"/><circle cx="15.5" cy="15.5" r="3"/><path d="M9 10c0-3 1.5-5 4-6 0 3-1 5-4 6z"/></svg>'
};

localStorage.setItem(LS_LAST_STORE, window.STORE_ID);

/* ============================ MENÚ ============================ */
let menuMode = 'regular';

function findItem(id) {
  for (const sec of MENU_REGULAR) {
    const it = sec.items.find(i => i.id === id);
    if (it) return it;
  }
  return null;
}

function renderTabs() {
  const data = menuMode === 'regular' ? MENU_REGULAR : MENU_LIGHT;
  $('#catTabs').innerHTML = data.map((s, i) =>
    `<button class="cat-tab${i === 0 ? ' active' : ''}"${i === 0 ? ' aria-current="true"' : ''} data-target="sec-${esc(s.id)}">${esc(s.section)}</button>`
  ).join('');
  $$('#catTabs .cat-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('#catTabs .cat-tab').forEach(b => { b.classList.remove('active'); b.removeAttribute('aria-current'); });
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'true');
      const el = document.getElementById(btn.dataset.target);
      if (el) {
        const y = el.getBoundingClientRect().top + window.scrollY - 130;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });
}

function renderRegular() {
  $('#menuBody').innerHTML = MENU_REGULAR.map((sec, i) => `
    <section class="menu-sec" id="sec-${esc(sec.id)}">
      <div class="menu-sec__banner">
        <img src="${esc(sec.img)}" alt="" loading="lazy" data-parallax="18" />
        <h3>${esc(sec.section)}</h3>
        <span class="no" aria-hidden="true">${String(i + 1).padStart(2, '0')} / ${String(MENU_REGULAR.length).padStart(2, '0')}</span>
      </div>
      ${sec.intro ? `<p class="menu-sec__intro">${esc(sec.intro)}</p>` : ''}
      <div class="menu-sec__items">
        ${sec.items.map(it => renderItem(it)).join('')}
      </div>
    </section>`).join('');

  $$('#menuBody .mi__add').forEach(b =>
    b.addEventListener('click', () => addToCart(b.dataset.id, null, b)));
  $$('#menuBody .mi__var').forEach(b =>
    b.addEventListener('click', () => addToCart(b.dataset.id, parseInt(b.dataset.vi, 10), b)));
  document.dispatchEvent(new CustomEvent('hf:rerender'));
}

function renderItem(it) {
  if (it.variants) {
    return `<div class="mi mi--vars">
      <span class="mi__name">${esc(it.name)}</span>
      <div class="mi__varrow">
        ${it.variants.map((v, vi) =>
          `<button class="mi__var" data-id="${esc(it.id)}" data-vi="${vi}" aria-label="Añadir ${esc(it.name)} (${esc(v.label)}) a la canasta">${esc(v.label)} · ${money(v.price)} ${ICON.plus}</button>`).join('')}
      </div>
    </div>`;
  }
  if (it.ask) {
    return `<div class="mi">
      <span class="mi__name">${esc(it.name)}</span>
      <span class="mi__dots"></span>
      <span class="mi__price ask">precio en tienda</span>
    </div>`;
  }
  return `<div class="mi">
    <span class="mi__name">${esc(it.name)}</span>
    <span class="mi__dots"></span>
    <span class="mi__price">${it.from ? 'desde ' : ''}${money(it.price)}</span>
    <button class="mi__add" data-id="${esc(it.id)}" aria-label="Añadir ${esc(it.name)} a la canasta">${ICON.plus}</button>
  </div>`;
}

const LIGHT_ICONS = { 'light-bowls': ICON.bowl, 'light-tostadas': ICON.toast, 'light-sin-azucar': ICON.cake, 'light-batidas': ICON.juice, 'light-desayuno': ICON.berry };

function renderLight() {
  $('#menuBody').innerHTML = `
    <div class="light-note">
      ${ICON.leaf}
      <span><strong>HORNOFINO Light</strong> es nuestro nuevo menú saludable: platos frescos, opciones sin azúcar
      y desayunos ligeros. Estamos terminando la receta de cada plato — muy pronto verás aquí fotos,
      ingredientes y precios.</span>
    </div>
    ${MENU_LIGHT.map(sec => `
      <section class="menu-sec" id="sec-${esc(sec.id)}">
        <h3 class="display" style="font-size:1.6rem;margin:28px 4px 4px">${esc(sec.section)}</h3>
        <p class="menu-sec__intro">${esc(sec.intro)}</p>
        <div class="lp-grid">
          ${sec.items.map(it => `
            <article class="lp-card">
              <div class="lp-card__art">
                ${LIGHT_ICONS[sec.id] || ICON.leaf}
                <span class="badge">Próximamente</span>
              </div>
              <div class="lp-card__body">
                <h4>${esc(it.name)}</h4>
                <p>Foto, ingredientes y precio en camino.</p>
              </div>
            </article>`).join('')}
        </div>
      </section>`).join('')}`;
  document.dispatchEvent(new CustomEvent('hf:rerender'));
}

function setMenuMode(mode) {
  menuMode = mode;
  $$('.menu-toggle button').forEach(b => {
    const on = b.dataset.mode === mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  renderTabs();
  if (mode === 'regular') renderRegular(); else renderLight();
}

/* =========================== CANASTA =========================== */
function getCart() {
  try { return JSON.parse(localStorage.getItem(LS_CART)) || []; }
  catch { return []; }
}
function saveCart(c) { localStorage.setItem(LS_CART, JSON.stringify(c)); updateCartUI(); }

/* Si el menú cambió desde la última visita, refresca precios y
   elimina de la canasta lo que ya no existe. */
function reconcileCart() {
  let cart = getCart();
  let changed = false;
  cart = cart.filter(r => {
    const it = findItem(r.id);
    if (!it) { changed = true; return false; }
    const vi = r.key.includes(':') ? parseInt(r.key.split(':')[1], 10) : null;
    const price = vi != null
      ? (it.variants && it.variants[vi] ? it.variants[vi].price : null)
      : it.price;
    if (price == null) { changed = true; return false; }
    if (r.price !== price) { r.price = price; changed = true; }
    const from = vi == null ? !!it.from : false;
    if (r.from !== from) { r.from = from; changed = true; }
    return true;
  });
  if (changed) localStorage.setItem(LS_CART, JSON.stringify(cart));
}

function addToCart(id, variantIndex, sourceEl) {
  const it = findItem(id);
  if (!it) return;
  const key = id + (variantIndex != null ? ':' + variantIndex : '');
  const cart = getCart();
  const row = cart.find(r => r.key === key);
  if (row) row.qty += 1;
  else {
    const price = variantIndex != null ? it.variants[variantIndex].price : it.price;
    const label = variantIndex != null ? it.name + ' (' + it.variants[variantIndex].label + ')' : it.name;
    cart.push({ key, id, label, price, qty: 1, from: variantIndex == null && !!it.from });
  }
  saveCart(cart);
  if (sourceEl && typeof hfFlyToCart === 'function') hfFlyToCart(sourceEl);
  toast('Añadido: ' + (variantIndex != null ? it.name + ' · ' + it.variants[variantIndex].label : it.name));
}

function changeQty(key, delta) {
  let cart = getCart();
  const row = cart.find(r => r.key === key);
  if (!row) return;
  row.qty += delta;
  if (row.qty <= 0) cart = cart.filter(r => r.key !== key);
  saveCart(cart);
}

function cartTotal(c) { return c.reduce((s, r) => s + r.price * r.qty, 0); }
function cartCount(c) { return c.reduce((s, r) => s + r.qty, 0); }

let hfPrevCount = null;
function updateCartUI() {
  const cart = getCart();
  const n = cartCount(cart);
  const countEl = $('#cartCount');
  countEl.textContent = n;
  if (hfPrevCount !== null && n !== hfPrevCount) {
    countEl.classList.remove('tick');
    void countEl.offsetWidth;
    countEl.classList.add('tick');
  }
  hfPrevCount = n;
  $('#cartOpen').setAttribute('aria-label',
    'Abrir canasta, ' + n + (n === 1 ? ' artículo' : ' artículos'));
  const box = $('#cartItems');
  if (!cart.length) {
    box.innerHTML = `<p class="cart__empty">${ICON.basket}Tu canasta está vacía.<br>Añade algo rico del menú.</p>`;
  } else {
    box.innerHTML = cart.map(r => `
      <div class="ci">
        <div class="ci__info">
          <strong>${esc(r.label)}</strong>
          <span>${r.from ? 'desde ' : ''}${money(r.price)} c/u</span>
        </div>
        <div class="ci__qty">
          <button data-k="${esc(r.key)}" data-d="-1" aria-label="Quitar un ${esc(r.label)}">${ICON.minus}</button>
          <span>${r.qty}</span>
          <button data-k="${esc(r.key)}" data-d="1" aria-label="Añadir un ${esc(r.label)}">${ICON.plus}</button>
        </div>
        <span class="ci__total">${money(r.price * r.qty)}${r.from ? '+' : ''}</span>
      </div>`).join('');
    $$('#cartItems .ci__qty button').forEach(b =>
      b.addEventListener('click', () => changeQty(b.dataset.k, parseInt(b.dataset.d, 10))));
  }
  $('#cartSumLabel').textContent = cart.some(r => r.from) ? 'Total estimado' : 'Total';
  $('#cartTotal').textContent = money(cartTotal(cart));
  $('#cartSend').disabled = !cart.length;
  $('#cartEmail').disabled = !cart.length;
  $('#cartCopy').disabled = !cart.length;
}

let cartReturnFocus = null;
function openCart(open) {
  const was = $('#cartDrawer').classList.contains('open');
  if (open === was) { if (!open) document.body.style.overflow = ''; }
  $('#cartDrawer').classList.toggle('open', open);
  $('#cartOverlay').classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open && !was) {
    cartReturnFocus = document.activeElement;
    $('#cartClose').focus();
  } else if (!open && was) {
    if (cartReturnFocus && cartReturnFocus.focus) cartReturnFocus.focus();
    cartReturnFocus = null;
  }
}

/* ================== ENVÍO DE ORDEN POR TIENDA ================== */
function orderText() {
  const cart = getCart();
  const name = $('#cartName').value.trim();
  const note = $('#cartNote').value.trim();
  const estimado = cart.some(r => r.from);
  const lines = [
    '🥖 Orden — ' + STORE.title,
    '────────────────',
    ...cart.map(r => `${r.qty}× ${r.label} — ${money(r.price * r.qty)}${r.from ? ' (desde)' : ''}`),
    '────────────────',
    (estimado ? 'Total estimado: ' : 'Total: ') + money(cartTotal(cart)),
    name ? 'Nombre: ' + name : null,
    note ? 'Nota: ' + note : null,
    'Para recoger en: ' + STORE.addr
  ].filter(Boolean);
  return lines.join('\n');
}

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
  ta.remove();
  return ok;
}

/* Copiar NO envía nada: copia el texto y deja la canasta intacta. */
function copyOrder() {
  const cart = getCart();
  if (!cart.length) return;
  const text = orderText();
  const done = ok => toast(ok ? 'Orden copiada — pégala donde quieras' : 'No se pudo copiar automáticamente');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => done(true)).catch(() => done(legacyCopy(text)));
  } else {
    done(legacyCopy(text));
  }
}

function sendOrder(via) {
  const cart = getCart();
  if (!cart.length) return;
  const text = orderText();
  if (via === 'wa') {
    const w = window.open('https://wa.me/' + STORE.wa + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    if (!w) { toast('Tu navegador bloqueó la ventana — permite pop-ups para enviar por WhatsApp'); return; }
  } else if (via === 'email') {
    window.location.href = 'mailto:' + STORE.email +
      '?subject=' + encodeURIComponent('Orden — ' + STORE.title) +
      '&body=' + encodeURIComponent(text);
  }
  // La canasta NO se toca todavía: se confirma en el modal.
  openCart(false);
  const canal = via === 'wa' ? 'WhatsApp' : 'tu correo';
  showModal({
    icon: 'send',
    title: 'Un paso más',
    body: `Abrimos ${canal} con tu orden para <strong>${esc(STORE.name)}</strong>. ` +
          `Cuando la envíes, confírmalo aquí — así guardamos tu sello y vaciamos la canasta.`,
    primary: { label: 'Ya la envié ✓', fn: finalizeOrder },
    alt: { label: 'Volver a la canasta', fn: () => openCart(true) }
  });
}

function finalizeOrder() {
  const res = addStamp();
  localStorage.removeItem(LS_CART);
  $('#cartNote').value = '';
  updateCartUI();
  const r = res.r;
  let extra;
  if (!r.joined) {
    extra = 'Únete a <strong>Horno Rewards</strong> en la sección de recompensas y acumula un sello con cada orden.';
  } else if (res.added) {
    extra = `<strong>+1 sello Horno Rewards</strong> · llevas ${r.stamps} de ${REWARDS_GOAL}.`;
  } else {
    extra = 'Tu tarjeta está llena — <strong>canjea tu premio</strong> para seguir acumulando sellos.';
  }
  showModal({
    icon: 'bread',
    title: '¡Orden enviada a ' + STORE.name + '!',
    body: 'La tienda confirmará tu orden por el mismo canal.<br>' + extra
  });
  if (res.added && typeof hfConfetti === 'function') {
    setTimeout(() => hfConfetti($('#orderModal .modal')), 250);
  }
}

/* ========================= HORNO REWARDS ========================= */
function getRewards() {
  try { return JSON.parse(localStorage.getItem(LS_REWARDS)) || { joined: false, name: '', stamps: 0, history: [] }; }
  catch { return { joined: false, name: '', stamps: 0, history: [] }; }
}
function saveRewards(r) { localStorage.setItem(LS_REWARDS, JSON.stringify(r)); renderRewards(); }

function addStamp() {
  const r = getRewards();
  if (!r.joined || r.stamps >= REWARDS_GOAL) return { r, added: false };
  r.stamps += 1;
  r.history.push({ ts: Date.now(), store: window.STORE_ID });
  saveRewards(r);
  return { r, added: true };
}

function joinRewards() {
  const name = prompt('¿Cómo te llamas? (para tu tarjeta Horno Rewards)');
  if (name === null) return;
  const r = getRewards();
  r.joined = true;
  r.name = name.trim();
  saveRewards(r);
  toast('¡Ya eres parte de Horno Rewards' + (r.name ? ', ' + r.name : '') + '!');
}

function redeemRewards() {
  const r = getRewards();
  if (r.stamps < REWARDS_GOAL) return;
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = 'HR-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  r.stamps = 0;
  r.lastCode = code;
  saveRewards(r);
  showModal({
    icon: 'gift',
    title: '¡Premio desbloqueado!',
    body: `Muestra este código en la caja de cualquiera de nuestras panaderías ` +
          `y canjea un <strong>café o quesito gratis</strong>:<br>` +
          `<span class="code">${code}</span>`
  });
  if (typeof hfConfetti === 'function') setTimeout(() => hfConfetti($('#orderModal .modal')), 200);
}

let hfPrevStamps = null;
function renderRewards() {
  const r = getRewards();
  const grid = $('#punchGrid');
  if (grid) {
    grid.setAttribute('role', 'img');
    grid.setAttribute('aria-label', r.stamps + ' de ' + REWARDS_GOAL + ' sellos');
    const gained = hfPrevStamps !== null && r.stamps > hfPrevStamps;
    grid.innerHTML = Array.from({ length: REWARDS_GOAL }, (_, i) =>
      `<span class="punch__slot${i < r.stamps ? ' full' : ''}${gained && i === r.stamps - 1 ? ' pop' : ''}" aria-hidden="true">${i < r.stamps ? ICON.bread : ''}</span>`).join('');
    hfPrevStamps = r.stamps;
  }
  const label = $('#punchLabel');
  if (label) {
    label.textContent = r.joined
      ? (r.stamps >= REWARDS_GOAL
          ? '¡Tarjeta llena! Canjea tu premio 🎉'
          : `${r.stamps} de ${REWARDS_GOAL} sellos · te faltan ${REWARDS_GOAL - r.stamps}`)
      : 'Únete gratis y empieza a acumular';
  }
  const joinBtn = $('#rwJoin'), redeemBtn = $('#rwRedeem'), note = $('#rwNote');
  if (joinBtn) joinBtn.style.display = r.joined ? 'none' : '';
  if (redeemBtn) {
    redeemBtn.style.display = r.joined ? '' : 'none';
    redeemBtn.disabled = r.stamps < REWARDS_GOAL;
  }
  if (note) {
    note.textContent = r.joined
      ? `Hola${r.name ? ', ' + r.name : ''} 👋 · tu tarjeta vale en las tres panaderías.`
      : 'Cada orden = 1 sello. 8 sellos = café o quesito gratis.';
  }
}

/* ============================ MODAL ============================ */
let modalReturnFocus = null;

function showModal(cfg) {
  $('#modalIcon').innerHTML = ICON[cfg.icon] || ICON.bread;
  $('#modalTitle').textContent = cfg.title;
  $('#modalBody').innerHTML = cfg.body;
  const p = $('#modalClose');
  p.textContent = cfg.primary ? cfg.primary.label : '¡Listo!';
  p.onclick = () => { closeModal(); if (cfg.primary && cfg.primary.fn) cfg.primary.fn(); };
  const a = $('#modalAlt');
  if (cfg.alt) {
    a.hidden = false;
    a.textContent = cfg.alt.label;
    a.onclick = () => { closeModal(); if (cfg.alt.fn) cfg.alt.fn(); };
  } else {
    a.hidden = true;
    a.onclick = null;
  }
  modalReturnFocus = document.activeElement;
  $('#orderModal').classList.add('open');
  p.focus();
}

function closeModal() {
  const m = $('#orderModal');
  if (!m.classList.contains('open')) return;
  m.classList.remove('open');
  if (modalReturnFocus && modalReturnFocus.focus) modalReturnFocus.focus();
  modalReturnFocus = null;
}

/* ============================ UI BASE ============================ */
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove('show'), 2200);
}

function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => io.observe(el));
}

function trapTab(e) {
  const modalOpen = $('#orderModal').classList.contains('open');
  const cartOpen = $('#cartDrawer').classList.contains('open');
  const container = modalOpen ? $('#orderModal .modal') : (cartOpen ? $('#cartDrawer') : null);
  if (!container) return;
  const f = Array.from(container.querySelectorAll('button, input, textarea, a[href]'))
    .filter(el => !el.disabled && !el.hidden && el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  else if (!container.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
}

document.addEventListener('DOMContentLoaded', () => {
  // #light abre el menú light directo (enlazable desde promos)
  setMenuMode(location.hash === '#light' ? 'light' : 'regular');
  reconcileCart();
  updateCartUI();
  renderRewards();
  initReveal();

  $$('.menu-toggle button').forEach(b =>
    b.addEventListener('click', () => setMenuMode(b.dataset.mode)));

  $('#cartOpen').addEventListener('click', () => openCart(true));
  $('#cartClose').addEventListener('click', () => openCart(false));
  $('#cartOverlay').addEventListener('click', () => openCart(false));
  $('#cartSend').addEventListener('click', () => sendOrder('wa'));
  $('#cartEmail').addEventListener('click', () => sendOrder('email'));
  $('#cartCopy').addEventListener('click', copyOrder);
  $('#orderModal').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

  const joinBtn = $('#rwJoin'); if (joinBtn) joinBtn.addEventListener('click', joinRewards);
  const redeemBtn = $('#rwRedeem'); if (redeemBtn) redeemBtn.addEventListener('click', redeemRewards);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('#orderModal').classList.contains('open')) closeModal();
      else openCart(false);
    } else if (e.key === 'Tab') {
      trapTab(e);
    }
  });
});
