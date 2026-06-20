// 100人カイギ 10分タイマー — Service Worker（オフライン対応）
// app shell を precache し、cache-first で配信する。
// 更新時は CACHE_NAME のバージョンを上げる（activate で旧 cache を削除）。
const CACHE_NAME = 'ninkaigi-timer-v1';

// 同一ディレクトリ配置の前提（GitHub Pages 等のサブパスでも相対で解決）
const ASSETS = [
  './timer.html',
  './manifest.webmanifest',
  './icons/icon-32.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).catch(() => caches.match('./timer.html'));
    })
  );
});
