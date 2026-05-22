const DB_NAME = 'waktu-solat-db';
const STORE_NAME = 'assets';
const DB_VERSION = 1;

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
