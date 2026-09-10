/**
 * Service Worker: Quản lý bộ nhớ đệm & tự động dọn sạch cache cũ
 */
const CACHE_NAME = 'cth-sla-v3.3.0';

// Kích hoạt ngay lập tức worker mới mà không chờ đóng tab cũ
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Tự động xoá toàn bộ cache cũ khi phiên bản worker mới kích hoạt
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Đang tự động dọn sạch cache cũ:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Network-First cho tài liệu HTML và API; Cache-First có điều kiện cho tài nguyên tĩnh
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Không cache các request API hoặc PHP
  if (url.pathname.includes('api.php') || url.pathname.startsWith('/api/') || request.method !== 'GET') {
    return;
  }

  // Network-First cho HTML/Document để luôn nhận bản cập nhật mới nhất
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Các tài nguyên khác: Thử network trước, nếu mất mạng mới lấy từ cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});
