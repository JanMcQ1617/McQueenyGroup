/* ============================================================
   HORNOFINO · API — órdenes + Horno Rewards
   Netlify Functions v2 + Netlify Blobs (sin cuentas externas).
   Las claves de tienda viven aquí SOLO como hashes SHA-256;
   las claves reales las tiene Jan (cambiarlas = regenerar hash).
   ============================================================ */

import { getStore } from "@netlify/blobs";
import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const MENU = JSON.parse(readFileSync(join(__dir, "menu-prices.json"), "utf8"));

const REWARDS_GOAL = 6;
const STAMP_COOLDOWN_MS = 2 * 60 * 60 * 1000;   // 1 sello por tienda cada 2h (compras en caja)
const STORE_KEY_HASHES = {
  cupey:    "e30c3d9b5ce006c1f2774f334224fc988c2dc898d55ae03d9a30a8afea97e7e0",
  guaynabo: "4772d17509b489a49c2708aa669c60976ffbdbd9349951701a465bc1977ecfa2",
  bayamon:  "565cb7d6545a324350df10721f17fd0f8ed87a34114bbf789f52515f35e52a41",
};
const STORE_NAMES = { cupey: "Cupey", guaynabo: "Apolo · Guaynabo", bayamon: "Los Filtros · Bayamón" };
const ORDER_STATUSES = ["nueva", "preparando", "lista", "entregada", "cancelada"];

const sha256 = s => createHash("sha256").update(s).digest("hex");
const validStore = s => Object.hasOwn(STORE_KEY_HASHES, s);
const validKey = (store, key) => validStore(store) && typeof key === "string" && sha256(key.trim().toUpperCase()) === STORE_KEY_HASHES[store];

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function code(len) {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

const customers = () => getStore({ name: "customers", consistency: "strong" });
const orders = () => getStore({ name: "orders", consistency: "strong" });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...CORS } });
const err = (msg, status = 400) => json({ error: msg }, status);

/* ---------- clientes / rewards ---------- */

async function handleJoin(body) {
  const name = String(body.name || "").trim().slice(0, 60);
  const c = customers();
  let id;
  for (let i = 0; i < 5; i++) {
    id = code(6);
    if (!(await c.get(id))) break;
  }
  const rec = { code: id, name, stamps: 0, rewards: [], lastStampAt: {}, history: [], createdAt: Date.now() };
  await c.setJSON(id, rec);
  return json({ card: publicCard(rec) });
}

function publicCard(rec) {
  return {
    code: rec.code,
    name: rec.name,
    stamps: rec.stamps,
    goal: REWARDS_GOAL,
    rewards: rec.rewards.filter(r => !r.redeemedAt).map(r => r.code),
    totalRedeemed: rec.rewards.filter(r => r.redeemedAt).length,
  };
}

async function getCustomer(rawCode) {
  const id = String(rawCode || "").trim().toUpperCase();
  if (!/^[A-Z2-9]{6}$/.test(id)) return { error: err("Código inválido", 400) };
  const rec = await customers().get(id, { type: "json" });
  if (!rec) return { error: err("Tarjeta no encontrada", 404) };
  return { rec };
}

function grantStamp(rec, store, via) {
  rec.stamps += 1;
  rec.history.push({ ts: Date.now(), store, via });
  if (rec.stamps >= REWARDS_GOAL) {
    rec.stamps = 0;
    rec.rewards.push({ code: "QSTO-" + code(4), earnedAt: Date.now() });
    return true;
  }
  return false;
}

async function handleStamp(body) {
  const { store, key } = body;
  if (!validKey(store, key)) return err("Clave de tienda incorrecta", 403);
  const { rec, error } = await getCustomer(body.card);
  if (error) return error;
  const last = rec.lastStampAt?.[store] || 0;
  if (Date.now() - last < STAMP_COOLDOWN_MS) {
    const mins = Math.ceil((STAMP_COOLDOWN_MS - (Date.now() - last)) / 60000);
    return err(`Esta tarjeta ya recibió un sello en ${STORE_NAMES[store]} hace poco (espera ~${mins} min)`, 429);
  }
  rec.lastStampAt = rec.lastStampAt || {};
  rec.lastStampAt[store] = Date.now();
  const earned = grantStamp(rec, store, "caja");
  await customers().setJSON(rec.code, rec);
  return json({ card: publicCard(rec), rewardEarned: earned });
}

async function handleRedeem(body) {
  const { store, key } = body;
  if (!validKey(store, key)) return err("Clave de tienda incorrecta", 403);
  const { rec, error } = await getCustomer(body.card);
  if (error) return error;
  const pending = rec.rewards.find(r => !r.redeemedAt);
  if (!pending) return err("Esta tarjeta no tiene premios pendientes", 409);
  pending.redeemedAt = Date.now();
  pending.redeemedStore = store;
  await customers().setJSON(rec.code, rec);
  return json({ card: publicCard(rec), redeemed: pending.code });
}

async function handleCard(url) {
  const { rec, error } = await getCustomer(url.searchParams.get("c"));
  if (error) return error;
  return json({ card: publicCard(rec) });
}

/* ---------- órdenes ---------- */

function priceLine(item) {
  const def = MENU[item.id];
  if (!def) return null;
  const qty = Math.max(1, Math.min(50, parseInt(item.qty, 10) || 1));
  if (Array.isArray(def.variants)) {
    const vi = parseInt(item.variant, 10);
    if (!(vi >= 0 && vi < def.variants.length)) return null;
    return { id: item.id, name: `${def.name} (${def.vlabels[vi]})`, qty, unit: def.variants[vi], from: false };
  }
  return { id: item.id, name: def.name, qty, unit: def.price, from: !!def.from };
}

async function handleOrder(body) {
  const store = body.store;
  if (!validStore(store)) return err("Tienda inválida");
  const items = Array.isArray(body.items) ? body.items.slice(0, 60).map(priceLine).filter(Boolean) : [];
  if (!items.length) return err("La orden está vacía");
  const total = items.reduce((s, l) => s + l.unit * l.qty, 0);
  const estimate = items.some(l => l.from);
  const id = "HF-" + code(4);
  let cardCode = null;
  if (body.card) {
    const { rec } = await getCustomer(body.card);
    if (rec) cardCode = rec.code;
  }
  const order = {
    id, store,
    items, total: Math.round(total * 100) / 100, estimate,
    customer: String(body.name || "").trim().slice(0, 60),
    note: String(body.note || "").trim().slice(0, 280),
    cardCode, status: "nueva", stamped: false,
    ts: Date.now(), statusTs: { nueva: Date.now() },
  };
  await orders().setJSON(`${store}/${String(order.ts).padStart(15, "0")}-${id}`, order);
  await orders().setJSON(`byid/${id}`, order);
  return json({ orderId: id, total: order.total, estimate, store: STORE_NAMES[store] });
}

async function handleOrderStatus(url) {
  const id = String(url.searchParams.get("id") || "").trim().toUpperCase();
  if (!/^HF-[A-Z2-9]{4}$/.test(id)) return err("Número de orden inválido");
  const order = await orders().get(`byid/${id}`, { type: "json" });
  if (!order) return err("Orden no encontrada", 404);
  return json({
    id: order.id, store: STORE_NAMES[order.store], status: order.status,
    total: order.total, estimate: order.estimate, ts: order.ts, statusTs: order.statusTs,
    items: order.items.map(l => ({ name: l.name, qty: l.qty })),
  });
}

async function handleOrders(url) {
  const store = url.searchParams.get("store");
  const key = url.searchParams.get("key");
  if (!validKey(store, key)) return err("Clave de tienda incorrecta", 403);
  const o = orders();
  const { blobs } = await o.list({ prefix: `${store}/` });
  const keys = blobs.map(b => b.key).sort().reverse().slice(0, 60);
  const list = [];
  for (const k of keys) {
    const rec = await o.get(k, { type: "json" });
    if (rec) list.push({ ...rec, _key: k });
  }
  return json({ orders: list });
}

async function handleSetStatus(body) {
  const { store, key, id, status } = body;
  if (!validKey(store, key)) return err("Clave de tienda incorrecta", 403);
  if (!ORDER_STATUSES.includes(status)) return err("Estado inválido");
  const o = orders();
  const order = await o.get(`byid/${String(id).toUpperCase()}`, { type: "json" });
  if (!order || order.store !== store) return err("Orden no encontrada", 404);
  order.status = status;
  order.statusTs[status] = Date.now();
  let rewardEarned = false;
  // La compra completada suma el sello automáticamente (sin cooldown: es una orden real)
  if (status === "entregada" && order.cardCode && !order.stamped) {
    const rec = await customers().get(order.cardCode, { type: "json" });
    if (rec) {
      rewardEarned = grantStamp(rec, store, "orden:" + order.id);
      await customers().setJSON(rec.code, rec);
      order.stamped = true;
    }
  }
  await o.setJSON(`byid/${order.id}`, order);
  await o.setJSON(`${store}/${String(order.ts).padStart(15, "0")}-${order.id}`, order);
  return json({ ok: true, status: order.status, stamped: order.stamped, rewardEarned });
}

/* ---------- router ---------- */

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: CORS });
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "");
  try {
    if (req.method === "GET") {
      if (path === "/api/card") return await handleCard(url);
      if (path === "/api/order-status") return await handleOrderStatus(url);
      if (path === "/api/orders") return await handleOrders(url);
      if (path === "/api/health") return json({ ok: true, goal: REWARDS_GOAL });
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (path === "/api/join") return await handleJoin(body);
      if (path === "/api/stamp") return await handleStamp(body);
      if (path === "/api/redeem") return await handleRedeem(body);
      if (path === "/api/order") return await handleOrder(body);
      if (path === "/api/order-set-status") return await handleSetStatus(body);
    }
    return err("Ruta no encontrada", 404);
  } catch (e) {
    console.error(e);
    return err("Error interno", 500);
  }
};

export const config = { path: "/api/*" };
