/**
 * Dịch vụ Quản lý & Tự động Xoá Cache Trình Duyệt (Browser Cache Manager)
 * 
 * Đảm bảo trình duyệt luôn tự động làm mới tài nguyên (HTML, JS, CSS, Service Worker, Cache API),
 * ngăn ngừa lỗi giữ cache cũ khi hệ thống cập nhật phiên bản mới.
 */

export const APP_VERSION = '3.3.0';
export const CACHE_VERSION_KEY = 'cth_app_installed_version';
export const AUTO_PURGE_KEY = 'cth_auto_cache_purge_enabled';
export const LAST_PURGE_KEY = 'cth_last_cache_purge_time';

export interface CacheDiagnostics {
  appVersion: string;
  installedVersion: string | null;
  autoPurgeEnabled: boolean;
  lastPurgedAt: string | null;
  cacheStorageCount: number;
  cacheStorageNames: string[];
  serviceWorkerActive: boolean;
  serviceWorkerCount: number;
  localStorageSizeKB: number;
}

/**
 * Kiểm tra và lấy thông số chẩn đoán bộ nhớ đệm trình duyệt
 */
export const getCacheDiagnostics = async (): Promise<CacheDiagnostics> => {
  let cacheNames: string[] = [];
  let swCount = 0;
  let swActive = false;

  if (typeof window !== 'undefined') {
    // 1. Kiểm tra Cache Storage
    if ('caches' in window) {
      try {
        cacheNames = await window.caches.keys();
      } catch (e) {
        console.warn('Không thể đọc Cache Storage:', e);
      }
    }

    // 2. Kiểm tra Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swCount = registrations.length;
        swActive = registrations.some(reg => !!reg.active);
      } catch (e) {
        console.warn('Không thể kiểm tra Service Worker:', e);
      }
    }
  }

  // 3. Tính toán dung lượng LocalStorage hiện tại (ước tính sơ bộ theo KB)
  let lsSize = 0;
  try {
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        lsSize += (localStorage[key].length + key.length) * 2;
      }
    }
  } catch (e) {
    // ignore
  }

  const autoPurgeEnabled = localStorage.getItem(AUTO_PURGE_KEY) !== 'false';
  const installedVersion = localStorage.getItem(CACHE_VERSION_KEY);
  const lastPurgedAt = localStorage.getItem(LAST_PURGE_KEY);

  return {
    appVersion: APP_VERSION,
    installedVersion,
    autoPurgeEnabled,
    lastPurgedAt,
    cacheStorageCount: cacheNames.length,
    cacheStorageNames: cacheNames,
    serviceWorkerActive: swActive,
    serviceWorkerCount: swCount,
    localStorageSizeKB: Math.round(lsSize / 1024)
  };
};

/**
 * Xoá sạch toàn bộ cache trình duyệt (Cache Storage, Service Worker, Session, và làm mới trang)
 */
export const clearBrowserCache = async (options: { hardReload?: boolean; preserveAuth?: boolean } = { hardReload: true, preserveAuth: true }): Promise<{ success: boolean; clearedCaches: string[]; unregisteredSW: number }> => {
  const clearedCaches: string[] = [];
  let unregisteredSW = 0;

  try {
    // 1. Xoá tất cả Cache trong Cache API (Cache Storage)
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await window.caches.keys();
      for (const key of keys) {
        await window.caches.delete(key);
        clearedCaches.push(key);
      }
    }

    // 2. Huỷ đăng ký toàn bộ Service Worker cũ
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        unregisteredSW++;
      }
    }

    // 3. Xoá Session Storage
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.clear();
    }

    // 4. Cập nhật mốc thời gian và phiên bản cài đặt
    const now = new Date().toISOString();
    localStorage.setItem(LAST_PURGE_KEY, now);
    localStorage.setItem(CACHE_VERSION_KEY, APP_VERSION);

    console.log(`[CacheService] Đã xoá sạch ${clearedCaches.length} cache storage, gỡ ${unregisteredSW} service worker.`);

    // 5. Làm mới trang với cache-busting param nếu yêu cầu
    if (options.hardReload && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('_v', Date.now().toString());
      window.location.replace(url.toString());
    }

    return { success: true, clearedCaches, unregisteredSW };
  } catch (error) {
    console.error('[CacheService] Lỗi trong quá trình xoá cache:', error);
    if (options.hardReload && typeof window !== 'undefined') {
      window.location.reload();
    }
    return { success: false, clearedCaches, unregisteredSW };
  }
};

/**
 * Tự động kiểm tra phiên bản và kích hoạt xoá cache ngầm khi ứng dụng khởi động
 */
export const initAutoCachePurge = async () => {
  if (typeof window === 'undefined') return;

  const autoPurgeEnabled = localStorage.getItem(AUTO_PURGE_KEY) !== 'false';
  if (!autoPurgeEnabled) return;

  const installedVersion = localStorage.getItem(CACHE_VERSION_KEY);

  // Nếu phiên bản đã lưu trong máy người dùng khác phiên bản hiện tại (hoặc chưa từng lưu)
  if (installedVersion !== APP_VERSION) {
    console.info(`[CacheService] Phát hiện phiên bản mới: ${APP_VERSION} (Trước đó: ${installedVersion || 'chưa có'}). Đang tự động làm sạch cache...`);
    
    // Xoá cache trong nền không cần reload ngay lập tức để tránh vòng lặp
    await clearBrowserCache({ hardReload: false, preserveAuth: true });
    localStorage.setItem(CACHE_VERSION_KEY, APP_VERSION);
  }

  // Lắng nghe sự kiện người dùng mở lại tab hoặc trở lại ứng dụng sau khi thu nhỏ
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      const lastCheck = sessionStorage.getItem('cth_last_cache_check');
      const now = Date.now();
      // Kiểm tra tối đa 1 lần mỗi 10 phút
      if (!lastCheck || now - parseInt(lastCheck, 10) > 10 * 60 * 1000) {
        sessionStorage.setItem('cth_last_cache_check', now.toString());
        try {
          // Gửi request kiểm tra xem server có bản cập nhật index.html mới không
          const res = await fetch(`/?_chk=${now}`, {
            method: 'HEAD',
            cache: 'no-store'
          });
          const etag = res.headers.get('etag') || res.headers.get('last-modified');
          const prevEtag = localStorage.getItem('cth_last_etag');
          if (etag && prevEtag && etag !== prevEtag) {
            console.log('[CacheService] Máy chủ đã cập nhật tệp mới. Đang tự động cập nhật cache...');
            localStorage.setItem('cth_last_etag', etag);
            await clearBrowserCache({ hardReload: true, preserveAuth: true });
          } else if (etag) {
            localStorage.setItem('cth_last_etag', etag);
          }
        } catch (e) {
          // Bỏ qua lỗi mạng nền
        }
      }
    }
  });
};
