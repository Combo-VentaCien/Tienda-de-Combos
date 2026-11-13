// ===== CONFIGURACIÓN ÚNICA — edita solo este archivo =====
window.CONFIG = {
  nombre: "Combos VentaCien",
  whatsapp: "",          // Número con código de país, solo dígitos. Ej: "53XXXXXXXX". VACÍO = los pedidos no se envían.
  tasaUSDaMN: 620,       // 1 USD = 620 MN. Cambia solo este número.
  monedaInicial: "USD",  // "USD" o "MN"
  claveCarrito: "cvc_carrito_v1",
  categorias: [          // Para crear una categoría: añade una línea. "id" se usa en data/productos.json
    { id: "individuales", nombre: "Individuales", ico: "🍔" },
    { id: "familiares",   nombre: "Familiares",   ico: "🍗" },
    { id: "pizzas",       nombre: "Pizzas",       ico: "🍕" },
    { id: "bebidas",      nombre: "Con bebida",   ico: "🥤" }
  ]
};
