const DEFAULTS = {
  tikutoken: 'izZcWe7huWBlL0GC',
  unrivalrate: '1',
  unrivalreview: '0',
  unrivaldowork: '1',
  unrivalautosubmit: '1',
  unrivalautosave: '0',
  unrivalBackgroundVideoEnable: '6'
};

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.local.get(null);
  const missing = {};
  for (const [key, value] of Object.entries(DEFAULTS)) {
    if (!(key in current)) missing[key] = value;
  }
  if (Object.keys(missing).length) await chrome.storage.local.set(missing);
});

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

function headersToObject(headers) {
  const result = {};
  if (!headers) return result;
  for (const [key, value] of headers.entries()) result[key] = value;
  return result;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== 'feifei-xhr') return undefined;
  (async () => {
    const details = message.details || {};
    const method = String(details.method || 'GET').toUpperCase();
    const init = {
      method,
      headers: details.headers || {},
      credentials: details.anonymous ? 'omit' : 'include',
      redirect: 'follow'
    };
    if (details.data != null && method !== 'GET' && method !== 'HEAD') {
      init.body = typeof details.data === 'string' ? details.data : JSON.stringify(details.data);
    }
    const controller = new AbortController();
    let timeoutId;
    if (Number(details.timeout) > 0) {
      timeoutId = setTimeout(() => controller.abort(), Number(details.timeout));
      init.signal = controller.signal;
    }
    try {
      const response = await fetch(String(details.url), init);
      const text = await response.text();
      sendResponse({
        ok: true,
        status: response.status,
        statusText: response.statusText,
        responseText: text,
        response: text,
        responseHeaders: headersToObject(response.headers),
        responseHeadersText: [...response.headers].map(([key, value]) => `${key}: ${value}`).join('\\r\\n')
      });
    } catch (error) {
      sendResponse({ ok: false, timedOut: error && error.name === 'AbortError', error: String(error && error.message || error) });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  })();
  return true;
});
