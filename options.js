/**
 * MindVault AI – Options / Settings Page
 * Handles: save/load settings, API key testing, data management
 */

'use strict';

// ─── Storage helpers ──────────────────────────────────────────────────────────
function getStorage(keys) {
  return new Promise(res => chrome.storage.local.get(keys, res));
}
function setStorage(obj) {
  return new Promise(res => chrome.storage.local.set(obj, res));
}
function removeStorage(keys) {
  return new Promise(res => chrome.storage.local.remove(keys, res));
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────
const qs = sel => document.querySelector(sel);
let toastTimer = null;
function toast(msg, ms = 2500) {
  const el = qs('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

// ─── Sidebar navigation ───────────────────────────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.dataset.section;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    link.classList.add('active');
    qs(`#section-${section}`).classList.add('active');
  });
});

// ─── Load settings on page open ──────────────────────────────────────────────
async function loadSettings() {
  const { settings = {}, visits = [], analytics = {} } = await getStorage(['settings', 'visits', 'analytics']);

  // General
  setCheck('opt-tracking',        settings.trackingEnabled    !== false);
  setCheck('opt-favicon',         settings.saveFavicon        !== false);
  setCheck('opt-timespent',       settings.trackTime          !== false);
  setCheck('opt-notifications',   settings.notificationsEnabled !== false);
  setCheck('opt-daily-report',    settings.dailyReport        !== false);
  setCheck('opt-doomscroll-alert',settings.doomscrollAlert    !== false);
  setVal('opt-max-items',         settings.maxHistoryItems    || 5000);
  setVal('opt-ignore-domains',    (settings.ignoreDomains || []).join(', '));

  // AI
  setVal('opt-api-key',           settings.apiKey || '');
  setCheck('opt-auto-summarise',  settings.autoSummarise === true);
  setCheck('opt-ai-search',       settings.aiSearch !== false);
  setCheck('opt-ai-insights',     settings.aiInsights !== false);

  // Stats
  updateStats(visits, analytics);
}

function setCheck(id, val) { const el = qs(`#${id}`); if (el) el.checked = val; }
function setVal(id, val)   { const el = qs(`#${id}`); if (el) el.value  = val; }

async function updateStats(visits, analytics) {
  // Count visits
  qs('#stat-visits').textContent = `${visits.length.toLocaleString()} pages`;

  // Storage estimate
  try {
    if (navigator.storage?.estimate) {
      const { usage } = await navigator.storage.estimate();
      qs('#stat-storage').textContent = usage ? `${(usage / 1_048_576).toFixed(2)} MB` : 'Unknown';
    } else {
      qs('#stat-storage').textContent = 'Not available';
    }
  } catch {
    qs('#stat-storage').textContent = 'Not available';
  }
}

// ─── Save General Settings ────────────────────────────────────────────────────
qs('#btn-save-general').addEventListener('click', async () => {
  const { settings = {} } = await getStorage('settings');

  const ignoreDomains = qs('#opt-ignore-domains').value
    .split(',').map(s => s.trim()).filter(Boolean);

  const updated = {
    ...settings,
    trackingEnabled:       getCheck('opt-tracking'),
    saveFavicon:           getCheck('opt-favicon'),
    trackTime:             getCheck('opt-timespent'),
    notificationsEnabled:  getCheck('opt-notifications'),
    dailyReport:           getCheck('opt-daily-report'),
    doomscrollAlert:       getCheck('opt-doomscroll-alert'),
    maxHistoryItems:       parseInt(qs('#opt-max-items').value) || 5000,
    ignoreDomains,
  };

  await setStorage({ settings: updated });
  toast('✅ General settings saved!');
});

// ─── Save AI Settings ─────────────────────────────────────────────────────────
qs('#btn-save-ai').addEventListener('click', async () => {
  const { settings = {} } = await getStorage('settings');
  const updated = {
    ...settings,
    apiKey:         qs('#opt-api-key').value.trim(),
    autoSummarise:  getCheck('opt-auto-summarise'),
    aiSearch:       getCheck('opt-ai-search'),
    aiInsights:     getCheck('opt-ai-insights'),
  };
  await setStorage({ settings: updated });
  toast('✅ AI settings saved!');
});

// ─── Show/hide API key ────────────────────────────────────────────────────────
let keyVisible = false;
qs('#btn-show-key').addEventListener('click', () => {
  keyVisible = !keyVisible;
  qs('#opt-api-key').type = keyVisible ? 'text' : 'password';
  qs('#btn-show-key').textContent = keyVisible ? '🙈' : '👁';
});

// ─── Test API Key ─────────────────────────────────────────────────────────────
qs('#btn-test-key').addEventListener('click', async () => {
  const key    = qs('#opt-api-key').value.trim();
  const result = qs('#test-result');

  if (!key) {
    result.textContent = '⚠️ Please enter an API key first.';
    result.className   = 'test-result err';
    return;
  }

  result.textContent = '⏳ Testing connection…';
  result.className   = 'test-result';

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages:   [{ role: 'user', content: 'Say OK' }],
      }),
    });

    if (resp.ok) {
      result.textContent = '✅ API key is valid! Connection successful.';
      result.className   = 'test-result ok';
    } else {
      const err = await resp.json().catch(() => ({}));
      result.textContent = `❌ ${err?.error?.message || `HTTP ${resp.status}`}`;
      result.className   = 'test-result err';
    }
  } catch (e) {
    result.textContent = `❌ Network error: ${e.message}`;
    result.className   = 'test-result err';
  }
});

// ─── Privacy Actions ──────────────────────────────────────────────────────────
qs('#btn-export-all').addEventListener('click', async () => {
  const data = await getStorage(['visits', 'analytics', 'settings']);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `mindvault-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('✅ Data exported!');
});

qs('#btn-import-data').addEventListener('click', () => qs('#import-file').click());
qs('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.visits && Array.isArray(data.visits)) {
      if (!confirm(`Import ${data.visits.length} pages? This will merge with existing data.`)) return;
      const { visits: existing = [] } = await getStorage('visits');
      const merged = [...data.visits, ...existing]
        .filter((v, i, arr) => arr.findIndex(x => x.id === v.id) === i)
        .slice(0, 5000);
      await setStorage({ visits: merged });
      if (data.settings) await setStorage({ settings: data.settings });
      toast(`✅ Imported ${data.visits.length} pages!`);
      loadSettings();
    } else {
      toast('⚠️ Invalid backup file format');
    }
  } catch {
    toast('❌ Could not parse backup file');
  }
  e.target.value = '';
});

qs('#btn-clear-visits').addEventListener('click', async () => {
  if (!confirm('Delete ALL browsing history? This cannot be undone.')) return;
  await setStorage({ visits: [] });
  await loadSettings();
  toast('🗑️ History cleared');
});

qs('#btn-clear-analytics').addEventListener('click', async () => {
  if (!confirm('Delete all analytics data?')) return;
  await setStorage({ analytics: {} });
  toast('🗑️ Analytics cleared');
});

qs('#btn-reset-all').addEventListener('click', async () => {
  const confirmed = confirm('FACTORY RESET: Delete ALL data and settings? This is permanent.');
  if (!confirmed) return;
  await new Promise(res => chrome.storage.local.clear(res));
  toast('✅ Reset complete. Reload the page.');
  setTimeout(() => location.reload(), 1500);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCheck(id) { return qs(`#${id}`)?.checked === true; }

// ─── Bootstrap ────────────────────────────────────────────────────────────────
loadSettings();
