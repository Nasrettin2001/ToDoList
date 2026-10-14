// IndexedDB sarmalayıcı: görevler ve resimler için Promise tabanlı basit API
const DB = (() => {
  const NAME = 'isListesiDB';
  const VERSION = 1;
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('Bu tarayıcı IndexedDB desteklemiyor.'));
        return;
      }
      const req = indexedDB.open(NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('tasks')) {
          const t = db.createObjectStore('tasks', { keyPath: 'id' });
          t.createIndex('completed', 'completed');
          t.createIndex('dueDate', 'dueDate');
        }
        if (!db.objectStoreNames.contains('images')) {
          const i = db.createObjectStore('images', { keyPath: 'id' });
          i.createIndex('taskId', 'taskId');
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function reqToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function store(name, mode = 'readonly') {
    const db = await open();
    return db.transaction(name, mode).objectStore(name);
  }

  async function getAll(name) {
    return reqToPromise((await store(name)).getAll());
  }
  async function get(name, id) {
    return reqToPromise((await store(name)).get(id));
  }
  async function put(name, value) {
    return reqToPromise((await store(name, 'readwrite')).put(value));
  }
  async function del(name, id) {
    return reqToPromise((await store(name, 'readwrite')).delete(id));
  }

  async function imagesForTask(taskId) {
    const s = await store('images');
    return reqToPromise(s.index('taskId').getAll(taskId));
  }

  async function deleteTaskWithImages(taskId) {
    const imgs = await imagesForTask(taskId);
    for (const img of imgs) await del('images', img.id);
    await del('tasks', taskId);
    return imgs;
  }

  return {
    open, getAll, get, put, del, imagesForTask, deleteTaskWithImages,
    tasks: {
      all: () => getAll('tasks'),
      get: (id) => get('tasks', id),
      put: (t) => put('tasks', t),
    },
    images: {
      all: () => getAll('images'),
      get: (id) => get('images', id),
      put: (i) => put('images', i),
      del: (id) => del('images', id),
      forTask: imagesForTask,
    },
  };
})();

// Kısa benzersiz kimlik üretir
function uid(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
}
