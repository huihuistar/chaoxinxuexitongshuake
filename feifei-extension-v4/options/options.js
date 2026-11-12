const defaults = { tikutoken: 'izZcWe7huWBlL0GC', unrivalrate: '1', unrivalreview: '0', unrivaldowork: '1', unrivalautosubmit: '1', unrivalautosave: '0' };
const $ = (id) => document.getElementById(id);
async function load() {
  const values = { ...defaults, ...(await chrome.storage.local.get(null)) };
  $('token').value = values.tikutoken;
  $('rate').value = values.unrivalrate;
  $('review').value = values.unrivalreview;
  $('doWork').checked = String(values.unrivaldowork) === '1';
  $('autoSave').checked = String(values.unrivalautosave) === '1';
  $('autoSubmit').checked = String(values.unrivalautosubmit) === '1';
}
async function save() {
  await chrome.storage.local.set({
    tikutoken: $('token').value.trim(), unrivalrate: $('rate').value || '1', unrivalreview: $('review').value,
    unrivaldowork: $('doWork').checked ? '1' : '0', unrivalautosave: $('autoSave').checked ? '1' : '0', unrivalautosubmit: $('autoSubmit').checked ? '1' : '0'
  });
  $('status').textContent = '已保存';
  setTimeout(() => { $('status').textContent = ''; }, 1600);
}
$('save').addEventListener('click', save);
load();
