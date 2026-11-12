(() => {
  'use strict';
  if (location.host === 'study.cqie.edu.cn' && location.pathname.includes('/stu/pages/MyCourse/Study')) return;
  const post = (message) => window.postMessage({ __feifei: true, ...message }, '*');
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.__feifei !== true) return;
    const message = event.data;
    if (message.type === 'storage-set') {
      chrome.storage.local.set({ [message.key]: message.value });
    } else if (message.type === 'xhr') {
      chrome.runtime.sendMessage({ type: 'feifei-xhr', details: message.details })
        .then((result) => post({ type: 'xhr-result', id: message.id, result }))
        .catch((error) => post({ type: 'xhr-result', id: message.id, result: { ok: false, error: String(error) } }));
    }
  });
  const inject = (stored) => {
    if (document.getElementById('feifei-native-runtime')) return;
    const script = document.createElement('script');
    script.id = 'feifei-native-runtime';
    script.src = chrome.runtime.getURL('content/feifei-runtime.js');
    script.dataset.feifeiStore = encodeURIComponent(JSON.stringify(stored || {}));
    script.onload = () => script.remove();
    script.onerror = () => console.error('[飞飞小助手] 原脚本注入失败');
    (document.head || document.documentElement).appendChild(script);
  };
  const injectWhenReady = (stored) => {
    if (!location.pathname.includes('/knowledge/cards')) {
      inject(stored);
      return;
    }
    let attempts = 0;
    const check = () => {
      const hasBody = !!document.body;
      const hasPageParam = [...document.scripts].some((script) => script.textContent.includes('mArg ='));
      if (hasBody && (hasPageParam || attempts++ >= 40)) inject(stored);
      else setTimeout(check, 250);
    };
    check();
  };
  chrome.storage.local.get(null).then(injectWhenReady).catch(() => injectWhenReady({}));
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;
    for (const [key, change] of Object.entries(changes)) {
      post({ type: 'storage-change', key, oldValue: change.oldValue, newValue: change.newValue });
    }
  });
})();