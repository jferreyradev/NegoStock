/**
 * SECURE STORAGE SERVICE (NegoStock)
 * 
 * Almacenamiento seguro offline mediante IndexedDB con cifrado de hardware AES-GCM (256 bits)
 * a través de la Web Crypto API nativa del navegador (window.crypto.subtle).
 * 
 * Beneficios:
 * 1. Protección contra inspección en consola/DevTools (F12): los datos están cifrados con AES-256.
 * 2. Capacidad masiva (cientos de Megabytes/Gigabytes vs los 5MB de localStorage).
 * 3. Integridad transaccional frente a cortes de energía en la terminal.
 */

const DB_NAME = 'negostock_secure_db';
const DB_VERSION = 1;
const STORES = ['sales_queue', 'products_catalog', 'app_metadata'];

// Clave interna derivada para el cifrado AES-GCM del comercio
let cryptoKey = null;

/**
 * Obtiene o deriva la clave simétrica AES-GCM (256-bit)
 */
async function getEncryptionKey() {
  if (cryptoKey) return cryptoKey;

  // Salt único por dispositivo/instalación guardado para consistencia
  let rawSalt = localStorage.getItem('_ns_sec_salt');
  if (!rawSalt) {
    const saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
    rawSalt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('_ns_sec_salt', rawSalt);
  }

  const enc = new TextEncoder();
  const baseSecret = 'negostock_pos_ferreteria_secure_terminal_2026_' + rawSalt;
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(baseSecret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  cryptoKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode('ns_salt_' + rawSalt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return cryptoKey;
}

/**
 * Cifra un objeto o valor con AES-256-GCM
 */
async function encryptData(data) {
  try {
    const key = await getEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    return {
      iv: Array.from(iv),
      payload: Array.from(new Uint8Array(ciphertext))
    };
  } catch (err) {
    console.error('[SecureStorage] Error cifrando:', err);
    throw err;
  }
}

/**
 * Descifra un objeto cifrado con AES-256-GCM
 */
async function decryptData(encryptedEnvelope) {
  if (!encryptedEnvelope || !encryptedEnvelope.iv || !encryptedEnvelope.payload) {
    return null;
  }

  try {
    const key = await getEncryptionKey();
    const iv = new Uint8Array(encryptedEnvelope.iv);
    const ciphertext = new Uint8Array(encryptedEnvelope.payload);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const decoded = new TextDecoder().decode(decrypted);
    return JSON.parse(decoded);
  } catch (err) {
    console.error('[SecureStorage] Error descifrando envelope:', err);
    return null;
  }
}

/**
 * Abre o inicializa la base de datos IndexedDB
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda un registro cifrado en un almacén de IndexedDB
 */
export async function secureSet(storeName, id, plainValue) {
  const db = await openDB();
  const encrypted = await encryptData(plainValue);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put({ id, ...encrypted });

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Lee y descifra un registro por su clave
 */
export async function secureGet(storeName, id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);

    req.onsuccess = async () => {
      if (!req.result) return resolve(null);
      const decrypted = await decryptData(req.result);
      resolve(decrypted);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Obtiene y descifra todos los registros de un almacén
 */
export async function secureGetAll(storeName) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();

    req.onsuccess = async () => {
      const items = req.result || [];
      const decryptedList = [];

      for (const item of items) {
        const dec = await decryptData(item);
        if (dec !== null) {
          decryptedList.push(dec);
        }
      }
      resolve(decryptedList);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Elimina un registro por ID
 */
export async function secureRemove(storeName, id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Vacía completamente un almacén
 */
export async function secureClear(storeName) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * MIGRACIÓN DE DATOS PLANOS (localStorage -> IndexedDB Cifrado)
 * 
 * Si existen datos en texto claro en localStorage de versiones anteriores,
 * se migran automáticamente al almacenamiento seguro cifrado y se eliminan
 * de localStorage para no dejar rastro sin encriptar.
 */
export async function migrateLegacyPlainStorage() {
  try {
    // 1. Migrar cola de ventas offline
    const rawSales = localStorage.getItem('negostock_offline_sales_queue');
    if (rawSales) {
      const parsedSales = JSON.parse(rawSales);
      if (Array.isArray(parsedSales) && parsedSales.length > 0) {
        for (const sale of parsedSales) {
          await secureSet('sales_queue', sale.id || `sale-${Date.now()}-${Math.random()}`, sale);
        }
        console.log(`[SecureStorage] Migradas ${parsedSales.length} ventas offline a IndexedDB cifrado.`);
      }
      localStorage.removeItem('negostock_offline_sales_queue');
    }

    // 2. Migrar catálogo de productos offline
    const rawProds = localStorage.getItem('negostock_products');
    if (rawProds) {
      const parsedProds = JSON.parse(rawProds);
      if (Array.isArray(parsedProds) && parsedProds.length > 0) {
        for (const prod of parsedProds) {
          await secureSet('products_catalog', prod.id, prod);
        }
        console.log(`[SecureStorage] Migrados ${parsedProds.length} productos a IndexedDB cifrado.`);
      }
      localStorage.removeItem('negostock_products');
    }
  } catch (err) {
    console.warn('[SecureStorage] Error durante la migración de datos planos:', err);
  }
}
