(() => {
  'use strict';
  const currentScript = document.currentScript;
  let store = {};
  try { store = JSON.parse(decodeURIComponent(currentScript?.dataset?.feifeiStore || '{}')); } catch (_) {}
  const listeners = new Map();
  const pending = new Map();
  let requestId = 0;
  globalThis.unsafeWindow = globalThis;
  globalThis.GM_info = { scriptHandler: 'NativeExtension', scriptMetaStr: '', version: '2.1.0' };
  globalThis.GM_getValue = (key, fallback) => Object.prototype.hasOwnProperty.call(store, key) ? store[key] : fallback;
  globalThis.GM_setValue = (key, value) => {
    const oldValue = store[key];
    store[key] = value;
    window.postMessage({ __feifei: true, type: 'storage-set', key, value }, '*');
    for (const callback of listeners.get(key) || []) {
      try { callback(key, oldValue, value, false); } catch (_) {}
    }
  };
  globalThis.GM_addValueChangeListener = (key, callback) => {
    const callbacks = listeners.get(key) || [];
    callbacks.push(callback);
    listeners.set(key, callbacks);
    return `${key}:${callbacks.length}`;
  };
  globalThis.GM_xmlhttpRequest = (details = {}) => {
    const id = `${Date.now()}-${++requestId}`;
    pending.set(id, details);
    window.postMessage({ __feifei: true, type: 'xhr', id, details }, '*');
    return { abort: () => pending.delete(id) };
  };
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.__feifei !== true) return;
    const message = event.data;
    if (message.type === 'storage-change') {
      store[message.key] = message.newValue;
      for (const callback of listeners.get(message.key) || []) {
        try { callback(message.key, message.oldValue, message.newValue, true); } catch (_) {}
      }
      return;
    }
    if (message.type !== 'xhr-result') return;
    const details = pending.get(message.id);
    if (!details) return;
    pending.delete(message.id);
    const result = message.result || {};
    if (result.ok) {
      try { details.onload?.(result); } catch (_) {}
    } else if (result.timedOut) {
      try { details.ontimeout?.(result); } catch (_) {}
    } else {
      try { details.onerror?.(result); } catch (_) {}
    }
  });
})();
