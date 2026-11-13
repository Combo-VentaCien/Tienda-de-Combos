// Este service worker ya NO se usa para cachear nada.
// Su único trabajo es autodestruirse: si un visitante todavía tiene
// instalada una versión anterior (que sí guardaba caché), este archivo
// la reemplaza, borra toda la caché guardada y libera el control para
// que la tienda vuelva a cargar siempre directo desde internet.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();

      const clientsList = await self.clients.matchAll({ type: "window" });
      clientsList.forEach((client) => client.navigate(client.url));
    })()
  );
});
