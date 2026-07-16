/* ============================================================================
   УСТАРЕЛО: kill-switch. Service worker Hostera переехал в корень сайта
   (/sw.js, scope '/') — единое PWA на весь сайт вместо отдельного для меню.

   Этот файл остаётся только для устройств, где ранее была установлена
   регистрация /winegallery/sw.js: при первом же обновлении он подчищает
   старые кэши и снимает свою регистрацию, после чего страница перерегистрирует
   корневой /sw.js (см. index.html). Fetch-обработчика нет — запросы идут мимо.
   ========================================================================== */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Кэши старого меню-SW (hostera-shell-v1 / hostera-data-v1) больше не нужны:
    // корневой SW ведёт кэши со своей версией и precache'ит оболочку заново.
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n.startsWith('hostera-')).map((n) => caches.delete(n)));
    await self.registration.unregister();
    // Перезагружаем открытые вкладки, чтобы они сразу попали под корневой /sw.js.
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((c) => { try { c.navigate(c.url); } catch (e) {} });
  })());
});
