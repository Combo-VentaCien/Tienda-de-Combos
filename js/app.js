(() => {
"use strict";
const C = window.CONFIG, $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
let productos = [], cart = [], moneda = C.monedaInicial === "MN" ? "MN" : "USD", cat = "todas";

// ---- Dinero: USD en centavos enteros; MN se redondea por unidad, así el total = suma de líneas ----
const cents = p => Math.round((Number(p) || 0) * 100);
const unit = c => moneda === "MN" ? Math.round(c * C.tasaUSDaMN / 100) : c;   // MN enteros | USD centavos
const fmt = v => moneda === "MN" ? v.toLocaleString("es-CU") + " MN" : (v / 100).toFixed(2) + " USD";
const price = p => fmt(unit(cents(p)));

const toast = t => { const e = $("#toast"); e.textContent = t; e.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove("on"), 2800); };
const byId = id => productos.find(p => p.id === id);
const disponible = p => p && p.activo !== false && !p.agotado;

// ---- Carrito (localStorage con try/catch) ----
const load = () => { try { const d = JSON.parse(localStorage.getItem(C.claveCarrito)); cart = Array.isArray(d) ? d.filter(i => i && i.id && i.q > 0) : []; } catch { cart = []; } };
const save = () => { try { localStorage.setItem(C.claveCarrito, JSON.stringify(cart)); } catch {} };
const add = id => { const p = byId(id); if (!disponible(p)) return toast("Producto no disponible"); const i = cart.find(x => x.id === id); i ? i.q++ : cart.push({ id, q: 1 }); save(); renderCart(); toast("Añadido: " + p.nombre); };
const setQ = (id, d) => { const i = cart.find(x => x.id === id); if (!i) return; i.q += d; if (i.q <= 0) cart = cart.filter(x => x !== i); save(); renderCart(); };
const lines = () => cart.map(i => ({ p: byId(i.id), q: i.q })).filter(l => disponible(l.p));
const total = () => lines().reduce((s, l) => s + unit(cents(l.p.precio)) * l.q, 0);

function renderCart() {
  const L = lines();
  $("#badge").textContent = L.reduce((s, l) => s + l.q, 0);
  $("#cartBody").innerHTML = L.length ? L.map(({ p, q }) => `<div class="item"><div><b>${esc(p.nombre)}</b><br><small>${price(p.precio)} c/u</small></div><div><b>${fmt(unit(cents(p.precio)) * q)}</b></div>
    <div class="qty"><button data-d="-1" data-id="${esc(p.id)}" aria-label="Quitar uno">−</button><span>${q}</span><button data-d="1" data-id="${esc(p.id)}" aria-label="Añadir uno">+</button></div>
    <button class="del" data-del="${esc(p.id)}">Eliminar</button></div>`).join("") : '<p class="vacio">Tu carrito está vacío</p>';
  $("#total").textContent = fmt(total());
  $("#finalizar").disabled = !L.length; $("#vaciar").disabled = !L.length;
}

// ---- Catálogo ----
function foto(p) { return p.imagen ? `<img src="${esc(p.imagen)}" alt="${esc(p.nombre)}" loading="lazy" onerror="this.replaceWith(document.createTextNode('${esc(p.emoji || "🍽️")}'))">` : esc(p.emoji || "🍽️"); }
const oferta = p => cents(p.precioAnterior) > cents(p.precio);
function render() {
  const q = $("#buscar").value.trim().toLowerCase(), o = $("#orden").value;
  let L = productos.filter(p => p.activo !== false && (cat === "todas" || p.categoria === cat) && (!q || (p.nombre + " " + p.descripcion).toLowerCase().includes(q)));
  if (o === "asc") L.sort((a, b) => a.precio - b.precio); else if (o === "desc") L.sort((a, b) => b.precio - a.precio); else if (o === "az") L.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  $("#msg").hidden = L.length > 0; if (!L.length) $("#msg").textContent = productos.length ? "No encontramos combos con ese filtro." : $("#msg").textContent;
  $("#lista").innerHTML = L.map(p => `<article class="card${disponible(p) ? "" : " off"}">
    ${p.agotado ? '<span class="tag ag">Agotado</span>' : p.etiqueta === "nuevo" ? '<span class="tag">Nuevo</span>' : p.etiqueta === "mas_vendido" ? '<span class="tag">Más vendido</span>' : ""}
    ${oferta(p) ? `<span class="tag of">-${Math.round((1 - cents(p.precio) / cents(p.precioAnterior)) * 100)}%</span>` : ""}
    <button class="foto" data-ver="${esc(p.id)}" aria-label="Ver ${esc(p.nombre)}">${foto(p)}</button>
    <div class="cinfo"><h3>${esc(p.nombre)}</h3><div class="pr">${price(p.precio)}${oferta(p) ? `<s>${price(p.precioAnterior)}</s>` : ""}</div>
    <button class="btn" data-add="${esc(p.id)}" ${disponible(p) ? "" : "disabled"}>${disponible(p) ? "Añadir al carrito" : "No disponible"}</button></div></article>`).join("");
}
function renderCats() {
  $("#cats").innerHTML = [{ id: "todas", nombre: "Todas", ico: "🍽️" }, ...C.categorias].map(c => `<button data-cat="${esc(c.id)}" aria-pressed="${c.id === cat}">${esc(c.ico)} ${esc(c.nombre)}</button>`).join("");
}
function ver(id) {
  const p = byId(id); if (!p) return;
  $("#prodBody").innerHTML = `<div class="modal-foto">${foto(p)}</div><h2>${esc(p.nombre)}</h2><p class="pr">${price(p.precio)}${oferta(p) ? `<s>${price(p.precioAnterior)}</s>` : ""}</p>
    <p style="white-space:pre-line">${esc(p.descripcion)}</p><button class="btn" data-add="${esc(p.id)}" ${disponible(p) ? "" : "disabled"} style="width:100%">${disponible(p) ? "Añadir al carrito" : "No disponible"}</button>`;
  $("#dProd").showModal();
}

// ---- Pedido por WhatsApp ----
const rules = {
  fFecha: v => v ? "" : "Indica la fecha del pedido.",
  fNombre: v => v.trim().length >= 3 ? "" : "Escribe tu nombre completo.",
  fTel: v => v.replace(/\D/g, "").length >= 8 ? "" : "Teléfono no válido (mínimo 8 dígitos).",
  fDir: v => v.trim().length >= 5 ? "" : "Escribe tu dirección de entrega.",
  fRef: v => v.trim().length >= 3 ? "" : "Indica una referencia para localizarte."
};
function validar() {
  let ok = true;
  for (const id in rules) { const el = $("#" + id), m = rules[id](el.value); el.classList.toggle("bad", !!m); document.querySelector(`[data-for=${id}]`).textContent = m; if (m) ok = false; }
  return ok;
}
function mensaje() {
  const L = lines(), f = id => $("#" + id).value.trim();
  const fecha = f("fFecha").split("-").reverse().join("/");
  return ["*PEDIDO · COMBOS VENTACIEN*", `Fecha: ${fecha}`, "", `*Cliente:* ${f("fNombre")}`, `*Teléfono:* ${f("fTel")}`, "",
    "*Productos:*", ...L.map(({ p, q }) => `• ${q} x ${p.nombre} — ${fmt(unit(cents(p.precio)))} c/u = ${fmt(unit(cents(p.precio)) * q)}`), "",
    `*Moneda:* ${moneda}`, `*Tipo de cambio aplicado:* 1 USD = ${C.tasaUSDaMN} MN`, `*TOTAL:* ${fmt(total())}`, "",
    `*Dirección:* ${f("fDir")}`, `*Referencia:* ${f("fRef")}`].join("\n");
}

// ---- Eventos ----
document.addEventListener("click", e => {
  const t = e.target.closest("[data-add],[data-ver],[data-cat],[data-d],[data-del],[data-cerrar]"); if (!t) return;
  if (t.dataset.add) add(t.dataset.add);
  else if (t.dataset.ver) ver(t.dataset.ver);
  else if (t.dataset.cat) { cat = t.dataset.cat; renderCats(); render(); }
  else if (t.dataset.d) setQ(t.dataset.id, +t.dataset.d);
  else if (t.dataset.del) { cart = cart.filter(i => i.id !== t.dataset.del); save(); renderCart(); }
  else if (t.hasAttribute("data-cerrar")) t.closest("dialog").close();
});
document.querySelectorAll("dialog").forEach(d => d.addEventListener("click", e => { if (e.target === d) d.close(); }));
$("#btnCarrito").onclick = () => { renderCart(); $("#dCarrito").showModal(); };
$("#vaciar").onclick = () => { cart = []; save(); renderCart(); };
$("#finalizar").onclick = () => { $("#fResumen").textContent = `Total: ${fmt(total())} · Moneda: ${moneda} · 1 USD = ${C.tasaUSDaMN} MN`; $("#dCarrito").close(); $("#dForm").showModal(); };
$("#moneda").onchange = e => { moneda = e.target.value; render(); renderCart(); };
$("#buscar").oninput = render; $("#orden").onchange = render;
$("#form").onsubmit = e => {
  e.preventDefault(); if (!lines().length) return toast("El carrito está vacío"); if (!validar()) return toast("Revisa los campos marcados");
  const num = String(C.whatsapp || "").replace(/\D/g, "");
  if (!num) return toast("Falta configurar el WhatsApp en js/config.js");
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(mensaje())}`, "_blank", "noopener");
};

// ---- Inicio ----
$("#moneda").value = moneda; $("#anio").textContent = new Date().getFullYear();
$("#fFecha").value = new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
load(); renderCats(); renderCart();
fetch("data/productos.json", { cache: "no-cache" }).then(r => { if (!r.ok) throw 0; return r.json(); })
  .then(d => { productos = d; render(); renderCart(); })
  .catch(() => { $("#msg").hidden = false; $("#msg").textContent = "No se pudo cargar el catálogo. Publica el sitio en GitHub Pages o abre con un servidor local (no con doble clic)."; });
})();
