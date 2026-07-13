/* ============================================================================
   Hostera Service Worker — вариант для размещения в /winegallery/sw.js.
   Для контроля и корневых pretty-URL ресторанов (/novikov_bh) сервер ДОЛЖЕН
   отдавать этот файл с заголовком:  Service-Worker-Allowed: /
   Тогда регистрация со scope '/' (см. index.html) охватит весь сайт.
   Без этого заголовка scope сузится до /winegallery/ — приложение и офлайн
   работают на /winegallery/, но офлайн-оболочка на pretty-URL будет недоступна
   (онлайн они по-прежнему открываются штатно).

   Стратегии:
     • App-shell (index.html, waste-mode.css/js, иконки/ассеты) — cache-first.
     • Данные меню (Google Sheets CSV) и configs/*.json — network-first
       со свежим фолбэком из кэша (протухшее как свежее не показываем).
     • configs/auth.json — network-only (креды, уже cache-busted ?v=).
     • Навигации — network-first → кэш оболочки → офлайн-экран.

   Обновление: поднимите CACHE_VERSION при деплое — старые кэши будут удалены.
   ========================================================================== */

const CACHE_VERSION = 'v1';
const SHELL_CACHE = `hostera-shell-${CACHE_VERSION}`;
const DATA_CACHE  = `hostera-data-${CACHE_VERSION}`;
const BASE = '/winegallery/';
const APP_SHELL = `${BASE}index.html`;
const OFFLINE_URL = `${BASE}offline.html`;
const DATA_CACHE_LIMIT = 60;

// Критичная оболочка. Кэшируем поштучно и терпим отсутствие отдельных файлов,
// чтобы установка не падала целиком из-за одного 404.
const PRECACHE = [
  APP_SHELL,
  OFFLINE_URL,
  `${BASE}waste-mode.css`,
  `${BASE}waste-mode.js`,
  `${BASE}manifest.webmanifest`,
  `${BASE}assets/pwa/icon-192.png`,
  `${BASE}assets/pwa/icon-512.png`,
  `${BASE}assets/pwa/apple-touch-icon-180.png`,
];

// ── install: точечный precache + немедленная активация ─────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.all(PRECACHE.map(async (url) => {
      try { await cache.add(new Request(url, { cache: 'reload' })); }
      catch (e) { /* некритичный ассет отсутствует — пропускаем */ }
    }));
    await self.skipWaiting();
  })());
});

// ── activate: navigation preload + чистка старых кэшей ─────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (e) {}
    }
    const keep = new Set([SHELL_CACHE, DATA_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.map((n) => keep.has(n) ? null : caches.delete(n)));
    await self.clients.claim();
  })());
});

// Позволяет странице форсировать активацию нового SW (кнопка «Обновить»).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Хелперы классификации запросов ─────────────────────────────────────────
function isAuthRequest(url) {
  return url.pathname.endsWith('/configs/auth.json') ||
         /\/configs\/auth\.json/.test(url.pathname);
}
function isConfigJson(url) {
  return /\/configs\/.+\.json$/.test(url.pathname);
}
function isMenuData(url) {
  // Google Sheets как CSV: разные хосты/эндпоинты
  const h = url.hostname;
  if (h.includes('docs.google.com') || h.includes('googleusercontent.com') ||
      h.includes('sheets.googleapis.com')) return true;
  return /output=csv|\/gviz\/|\.csv($|\?)/.test(url.href);
}
function isFonts(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}
function isShellAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return /\.(?:css|js|png|jpg|jpeg|svg|webp|woff2?|ico|json|webmanifest)$/.test(url.pathname);
}

async function trimCache(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  for (let i = 0; i < keys.length - limit; i++) await cache.delete(keys[i]);
}

// network-first: сеть → кладём в кэш → при офлайне фолбэк из кэша
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    // Кэшируем и валидные, и opaque (cross-origin CSV) — читать статус нельзя,
    // поэтому храним как есть; свежесть обеспечивается тем, что сеть в приоритете.
    if (fresh && (fresh.ok || fresh.type === 'opaque')) {
      cache.put(request, fresh.clone());
      trimCache(cacheName, DATA_CACHE_LIMIT);
    }
    return fresh;
  } catch (e) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw e;
  }
}

// cache-first: кэш → сеть → кладём в кэш
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && (fresh.ok || fresh.type === 'opaque')) cache.put(request, fresh.clone());
  return fresh;
}

// stale-while-revalidate — для Google Fonts
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetching = fetch(request).then((res) => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fetching;
}

// ── fetch-роутер ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try { url = new URL(request.url); } catch (e) { return; }

  // Навигации (открытие страницы / pretty-URL): network-first → оболочка → офлайн
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;
        return await fetch(request);
      } catch (e) {
        const cache = await caches.open(SHELL_CACHE);
        return (await cache.match(APP_SHELL)) ||
               (await cache.match(OFFLINE_URL)) ||
               new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Креды — только сеть, мимо кэша
  if (isAuthRequest(url)) return;

  // Данные меню и конфиги — network-first
  if (isMenuData(url) || isConfigJson(url)) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // Google Fonts — SWR
  if (isFonts(url)) {
    event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
    return;
  }

  // Ассеты оболочки — cache-first
  if (isShellAsset(url)) {
    event.respondWith(cacheFirst(request, SHELL_CACHE).catch(() => fetch(request)));
    return;
  }
  // остальное — сеть как есть
});
