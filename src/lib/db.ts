const DB_NAME = 'waktu-solat-db';
const STORE_NAME = 'assets';
const DB_VERSION = 2;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains('prayer-times')) {
        db.createObjectStore('prayer-times');
      }
    };
  });
}

/**
 * Saves a wallpaper image blob to IndexedDB and returns a revocable object URL.
 */
export async function saveWallpaper(blob: Blob): Promise<string> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, 'wallpaper');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const url = URL.createObjectURL(blob);
      resolve(url);
    };
  });
}

/**
 * Retrieves the stored wallpaper image Blob from IndexedDB.
 */
export async function getWallpaperBlob(): Promise<Blob | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('wallpaper');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (e) {
    console.error("Failed to access IndexedDB wallpaper:", e);
    return null;
  }
}

/**
 * Clears the stored wallpaper image from IndexedDB.
 */
export async function clearWallpaper(): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete('wallpaper');
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error("Failed to clear IndexedDB wallpaper:", e);
  }
}

export interface CachedPrayerData {
  zone: string;
  prayerTime: any[];
  cachedAt: number;
  range: 'week' | 'month' | 'year';
}

/**
 * Saves offline prayer data to IndexedDB.
 */
export async function saveOfflinePrayers(
  zone: string,
  prayerTime: any[],
  range: 'week' | 'month' | 'year'
): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('prayer-times', 'readwrite');
    const store = transaction.objectStore('prayer-times');
    
    const cacheData: CachedPrayerData = {
      zone,
      prayerTime,
      cachedAt: Date.now(),
      range
    };
    
    const request = store.put(cacheData, zone);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Retrieves stored offline prayer data from IndexedDB.
 */
export async function getOfflinePrayers(zone: string): Promise<CachedPrayerData | null> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('prayer-times', 'readonly');
      const store = transaction.objectStore('prayer-times');
      const request = store.get(zone);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (e) {
    console.error("Failed to access IndexedDB prayer-times:", e);
    return null;
  }
}

/**
 * Clears stored offline prayer data from IndexedDB.
 */
export async function clearOfflinePrayers(zone: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('prayer-times', 'readwrite');
      const store = transaction.objectStore('prayer-times');
      const request = store.delete(zone);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (e) {
    console.error("Failed to clear IndexedDB prayer-times:", e);
  }
}
