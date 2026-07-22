# McQueenyGroup · Panaderías HORNOFINO

Sitio estático del grupo: home de McQueenyGroup + páginas de las tres
panaderías HORNOFINO (Cupey, Apolo · Guaynabo y Los Filtros · Bayamón),
con menú Regular/Light, órdenes por WhatsApp por tienda y Horno Rewards.

Sin build: HTML/CSS/JS puro. Netlify publica la raíz del repo (ver netlify.toml).

- `index.html` — home del grupo
- `cupey.html` / `guaynabo.html` / `bayamon.html` — tiendas (generadas de una plantilla)
- `menu-data.js` — 239 ítems reales + menú Light placeholder
- `app.js` — canasta, rutas de orden por tienda, rewards
- `motion.js` — capa de movimiento (reduced-motion safe)

**Pendiente antes del lanzamiento:** números reales de WhatsApp por tienda
(placeholders marcados TODO en `app.js`), platos reales del menú Light.
