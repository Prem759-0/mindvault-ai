/**
 * MindVault AI – Popup Script
 * Full UI logic: tabs, memory list, focus ring, charts, AI summarise, search
 */

import { nlSearch, summarisePage, generateDailyInsight } from '../utils/ai.js';
import {
  calcFocusScore, scoreLabel, buildWeeklyReport,
  msToHuman, formatTimestamp,
  CATEGORY_COLORS, CATEGORY_ICONS,
} from '../utils/analytics.js';

// ─── State ────────────────────────────────────────────────────────────────────
let allVisits     = [];
let analytics     = {};
let settings      = {};
let activeFilter  = 'all';
let searchMode    = false;
let catChart      = null;
let weekScoreChart = null;
let weekTimeChart  = null;
let modalVisit    = null;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  bindNav();
  bindHeader();
  bindSearch();
  bindMemoryTab();
  bindInsightsTab();
  renderMemoryTab();
  renderFocusTab();
  renderInsightsTab();
});

async function loadData() {
  [allVisits, analytics, settings] = await Promise.all([
    msg('GET_VISITS').then(r => r.visits || []),
    msg('GET_ANALYTICS').then(r => r.analytics || {}),
    getStorage('settings').then(d => d.settings || {}),
  ]);
}

// ─── Chrome helpers ───────────────────────────────────────────────────────────
function msg(type, extra = {}) {
  return chrome.runtime.sendMessage({ type, ...extra });
}
function getStorage(key) {
  return new Promise(res => chrome.storage.local.get(key, res));
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────
function bindNav() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

// ─── Header Buttons ──────────────────────────────────────────────────────────
function bindHeader() {
  // Toggle search bar
  document.getElementById('btn-search-toggle').addEventListener('click', () => {
    searchMode = !searchMode;
    const bar = document.getElementById('search-bar');
    bar.style.display = searchMode ? 'block' : 'none';
    if (searchMode) document.getElementById('search-input').focus();
    else {
      document.getElementById('search-results').innerHTML = '';
      renderMemoryList(allVisits);
    }
  });

  // Pin current page
  document.getElementById('btn-pin-current').addEventListener('click', async () => {
    await msg('QUICK_SAVE');
    await loadData();
    renderMemoryList(filteredVisits());
    toast('📌 Page pinned to memory!');
  });

  // Options page
  document.getElementById('btn-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// ─── AI Search ────────────────────────────────────────────────────────────────
function bindSearch() {
  const input   = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const clear   = document.getElementById('btn-search-clear');
  let debounce  = null;

  input.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = input.value.trim();
    if (!q) { results.innerHTML = ''; renderMemoryList(allVisits); return; }
    debounce = setTimeout(() => doSearch(q), 450);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      searchMode = false;
      document.getElementById('search-bar').style.display = 'none';
    }
  });

  clear.addEventListener('click', () => {
    input.value = '';
    results.innerHTML = '';
    renderMemoryList(allVisits);
  });
}

async function doSearch(query) {
  const results = document.getElementById('search-results');
  results.innerHTML = '<div class="loading-row">✨ Searching…</div>';

  try {
    const matched = await nlSearch(settings.apiKey, query, allVisits);
    // Render in main visit list (switch to Memory tab silently)
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelector('[data-tab="memory"]').classList.add('active');
    document.getElementById('tab-memory').classList.add('active');

    results.innerHTML = `<div class="loading-row" style="color:var(--accent)">✅ ${matched.length} result${matched.length!==1?'s':''} found</div>`;
    renderMemoryList(matched);
  } catch (err) {
    results.innerHTML = `<div class="loading-row" style="color:var(--red)">⚠️ ${err.message}</div>`;
  }
}

// ─── Memory Tab ───────────────────────────────────────────────────────────────
function bindMemoryTab() {
  document.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.dataset.filter;
      renderMemoryList(filteredVisits());
    });
  });
}

function filteredVisits() {
  const now = Date.now();
  return allVisits.filter(v => {
    if (activeFilter === 'all')    return true;
    if (activeFilter === 'pinned') return v.pinned;
    if (activeFilter === 'today')  return v.timestamp > now - 86_400_000;
    return v.category === activeFilter;
  });
}

function renderMemoryTab() {
  renderMemoryList(filteredVisits());
}

function renderMemoryList(visits) {
  const list  = document.getElementById('visit-list');
  const empty = document.getElementById('empty-state');

  if (!visits.length) {
    empty.style.display = 'flex';
    empty.style.flexDirection = 'column';
    empty.style.alignItems    = 'center';
    list.querySelectorAll('.visit-card').forEach(c => c.remove());
    return;
  }
  empty.style.display = 'none';

  // Remove old cards
  list.querySelectorAll('.visit-card').forEach(c => c.remove());

  const frag = document.createDocumentFragment();
  visits.slice(0, 100).forEach((v, i) => {
    const card = buildVisitCard(v, i);
    frag.appendChild(card);
  });
  list.appendChild(frag);
}

function buildVisitCard(visit, idx) {
  const card = document.createElement('div');
  card.className = `visit-card${visit.pinned ? ' pinned' : ''}`;
  card.style.animationDelay = `${Math.min(idx * 30, 300)}ms`;

  const color  = CATEGORY_COLORS[visit.category] || CATEGORY_COLORS.Other;
  const icon   = CATEGORY_ICONS[visit.category]  || '🌐';
  const domain = extractDomain(visit.url);

  card.innerHTML = `
    <img class="visit-favicon" src="${visit.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`}"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
         alt="">
    <div class="visit-favicon-placeholder" style="display:none">${icon}</div>
    <div class="visit-info">
      <div class="visit-title">${escHtml(visit.title)}</div>
      <div class="visit-meta">
        <span class="visit-cat-dot" style="background:${color}"></span>
        <span>${visit.category}</span>
        <span>·</span>
        <span>${domain}</span>
        <span>·</span>
        <span>${formatTimestamp(visit.timestamp)}</span>
        ${visit.timeSpent > 1000 ? `<span class="visit-time-spent">⏱ ${msToHuman(visit.timeSpent)}</span>` : ''}
      </div>
      ${visit.summary ? `<div class="visit-summary-preview">${escHtml(visit.summary)}</div>` : ''}
    </div>
    ${visit.pinned ? '<span class="visit-pin-badge">📌</span>' : ''}
  `;

  card.addEventListener('click', () => openModal(visit));
  return card;
}

// ─── Visit Detail Modal ───────────────────────────────────────────────────────
function openModal(visit) {
  modalVisit = visit;

  qs('#modal-favicon').src = visit.favicon || `https://www.google.com/s2/favicons?domain=${extractDomain(visit.url)}&sz=32`;
  qs('#modal-title').textContent    = visit.title;
  qs('#modal-url').textContent      = visit.url;
  qs('#modal-url').href             = visit.url;
  qs('#modal-cat').textContent      = `${CATEGORY_ICONS[visit.category]||'🌐'} ${visit.category}`;
  qs('#modal-time').textContent     = visit.timeSpent > 1000 ? `⏱ ${msToHuman(visit.timeSpent)}` : 'Quick visit';
  qs('#modal-ts').textContent       = formatTimestamp(visit.timestamp);
  qs('#modal-btn-pin').textContent  = visit.pinned ? '📌 Unpin' : '📌 Pin';
  qs('#modal-ai-status').textContent = '';

  // Summary
  const summaryEl = qs('#modal-summary');
  summaryEl.innerHTML = visit.summary
    ? `<p>${escHtml(visit.summary)}</p>`
    : '<p class="muted">No summary yet. Click "AI Summarise" to generate one.</p>';

  // Key points
  const kpEl = qs('#modal-keypoints');
  kpEl.innerHTML = '';
  if (visit.keyPoints?.length) {
    visit.keyPoints.forEach(kp => {
      const item = document.createElement('div');
      item.className = 'kp-item';
      item.innerHTML = `<span class="kp-dot">▸</span><span>${escHtml(kp)}</span>`;
      kpEl.appendChild(item);
    });
  }

  qs('#modal-overlay').style.display = 'flex';
}

function bindModalActions() {
  qs('#modal-close').addEventListener('click', closeModal);
  qs('#modal-overlay').addEventListener('click', e => {
    if (e.target === qs('#modal-overlay')) closeModal();
  });

  qs('#modal-btn-summarise').addEventListener('click', async () => {
    if (!modalVisit) return;
    if (!settings.apiKey) {
      toast('⚠️ Add your API key in Settings first!');
      return;
    }
    const btn    = qs('#modal-btn-summarise');
    const status = qs('#modal-ai-status');
    btn.disabled = true;
    btn.textContent = '⏳ Summarising…';
    status.textContent = 'Calling Claude AI…';

    try {
      const result = await summarisePage(settings.apiKey, {
        url:         modalVisit.url,
        title:       modalVisit.title,
        description: modalVisit.description || '',
        bodySnippet: modalVisit.bodySnippet || '',
      });

      // Update in background storage
      await msg('UPDATE_SUMMARY', {
        id:        modalVisit.id,
        summary:   result.summary,
        keyPoints: result.keyPoints,
      });

      // Update local state
      const idx = allVisits.findIndex(v => v.id === modalVisit.id);
      if (idx !== -1) {
        allVisits[idx].summary   = result.summary;
        allVisits[idx].keyPoints = result.keyPoints;
        modalVisit = allVisits[idx];
      }

      // Re-render modal content
      qs('#modal-summary').innerHTML = `<p>${escHtml(result.summary)}</p>`;
      const kpEl = qs('#modal-keypoints');
      kpEl.innerHTML = '';
      (result.keyPoints || []).forEach(kp => {
        const item = document.createElement('div');
        item.className = 'kp-item';
        item.innerHTML = `<span class="kp-dot">▸</span><span>${escHtml(kp)}</span>`;
        kpEl.appendChild(item);
      });

      status.textContent = '✅ Summary saved!';
      renderMemoryList(filteredVisits());
    } catch (err) {
      status.textContent = `⚠️ ${err.message}`;
    } finally {
      btn.disabled = false;
      btn.textContent = '✨ AI Summarise';
    }
  });

  qs('#modal-btn-pin').addEventListener('click', async () => {
    if (!modalVisit) return;
    const resp = await msg('TOGGLE_PIN', { id: modalVisit.id });
    const idx  = allVisits.findIndex(v => v.id === modalVisit.id);
    if (idx !== -1) allVisits[idx].pinned = resp.pinned;
    modalVisit.pinned = resp.pinned;
    qs('#modal-btn-pin').textContent = resp.pinned ? '📌 Unpin' : '📌 Pin';
    toast(resp.pinned ? '📌 Pinned!' : 'Unpinned');
    renderMemoryList(filteredVisits());
  });

  qs('#modal-btn-delete').addEventListener('click', async () => {
    if (!modalVisit) return;
    await msg('DELETE_VISIT', { id: modalVisit.id });
    allVisits = allVisits.filter(v => v.id !== modalVisit.id);
    closeModal();
    renderMemoryList(filteredVisits());
    toast('🗑️ Deleted');
  });
}
bindModalActions();

function closeModal() {
  qs('#modal-overlay').style.display = 'none';
  modalVisit = null;
}

// ─── Focus Tab ────────────────────────────────────────────────────────────────
function renderFocusTab() {
  const today    = new Date().toISOString().slice(0, 10);
  const dayData  = analytics[today] || {};
  const score    = calcFocusScore(dayData);
  const { label, color } = scoreLabel(score);

  // Ring animation
  const circumference = 314; // 2π × 50
  const offset = circumference - (score / 100) * circumference;
  const ring   = qs('#ring-fill');
  ring.style.stroke = color;
  setTimeout(() => { ring.style.strokeDashoffset = offset; }, 100);

  qs('#score-num').textContent  = score;
  qs('#score-label').textContent = label;
  qs('#score-num').style.color   = color;

  qs('#focus-time').textContent     = msToHuman(dayData.totalMs || 0);
  qs('#focus-switches').textContent = dayData.tabSwitches || 0;
  qs('#focus-doom').textContent     = dayData.doomscrolls || 0;

  // Top sites
  renderTopSites('top-sites-list', dayData.sites || {});

  // Category donut
  renderCatChart(dayData.sites || {});
}

function renderTopSites(elId, sites) {
  const el  = qs(`#${elId}`);
  el.innerHTML = '';
  const sorted = Object.entries(sites).sort((a, b) => b[1].ms - a[1].ms).slice(0, 6);
  const maxMs  = sorted[0]?.[1]?.ms || 1;

  if (!sorted.length) { el.innerHTML = '<div class="loading-row">No data yet for today.</div>'; return; }

  sorted.forEach(([domain, v]) => {
    const row = document.createElement('div');
    row.className = 'site-row';
    const pct = Math.round((v.ms / maxMs) * 100);
    const color = CATEGORY_COLORS[v.category] || '#6b7280';
    row.innerHTML = `
      <img class="site-row-favicon"
           src="https://www.google.com/s2/favicons?domain=${domain}&sz=32"
           onerror="this.style.opacity=0"
           alt="">
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between">
          <span class="site-row-name">${domain}</span>
          <span class="site-row-time">${msToHuman(v.ms)}</span>
        </div>
        <div class="site-row-bar" style="width:${pct}%;background:${color}"></div>
      </div>
    `;
    el.appendChild(row);
  });
}

function renderCatChart(sites) {
  const totals = {};
  for (const [, v] of Object.entries(sites)) {
    totals[v.category] = (totals[v.category] || 0) + v.ms;
  }
  const labels = Object.keys(totals);
  const data   = labels.map(l => totals[l]);
  const colors = labels.map(l => CATEGORY_COLORS[l] || '#6b7280');

  if (catChart) catChart.destroy();
  if (!labels.length) {
    qs('#cat-chart').parentElement.innerHTML = '<div class="loading-row">No data yet.</div>';
    return;
  }

  catChart = new Chart(qs('#cat-chart'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    },
  });

  // Legend
  const leg    = qs('#cat-legend');
  leg.innerHTML = '';
  const total  = data.reduce((a, b) => a + b, 0);
  labels.forEach((l, i) => {
    const pct = Math.round((data[i] / total) * 100);
    leg.innerHTML += `
      <div class="cat-legend-item">
        <span class="cat-dot" style="background:${colors[i]}"></span>
        <span>${CATEGORY_ICONS[l]||''} ${l}</span>
        <span class="cat-legend-pct">${pct}%</span>
      </div>`;
  });
}

// ─── Insights Tab ─────────────────────────────────────────────────────────────
function renderInsightsTab() {
  const { days, scores, times, topSites, avgScore } = buildWeeklyReport(analytics);

  // Weekly score chart
  if (weekScoreChart) weekScoreChart.destroy();
  weekScoreChart = new Chart(qs('#week-score-chart'), {
    type: 'bar',
    data: {
      labels: days,
      datasets: [{
        label: 'Focus Score',
        data: scores,
        backgroundColor: scores.map(s => scoreLabel(s).color + 'cc'),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
        y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
      },
      plugins: { legend: { display: false } },
    },
  });

  // Weekly time chart
  if (weekTimeChart) weekTimeChart.destroy();
  weekTimeChart = new Chart(qs('#week-time-chart'), {
    type: 'line',
    data: {
      labels: days,
      datasets: [{
        label: 'Hours',
        data: times,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c3aed',
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
        y: { min: 0, grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#64748b', font: { size: 10 } } },
      },
      plugins: { legend: { display: false } },
    },
  });

  // Weekly top sites
  const wsl = qs('#week-sites-list');
  wsl.innerHTML = '';
  const maxMs = topSites[0]?.ms || 1;
  topSites.slice(0, 7).forEach(s => {
    const row   = document.createElement('div');
    row.className = 'site-row';
    const pct   = Math.round((s.ms / maxMs) * 100);
    const color = CATEGORY_COLORS[s.category] || '#6b7280';
    row.innerHTML = `
      <img class="site-row-favicon"
           src="https://www.google.com/s2/favicons?domain=${s.domain}&sz=32"
           onerror="this.style.opacity=0" alt="">
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between">
          <span class="site-row-name">${s.domain}</span>
          <span class="site-row-time">${msToHuman(s.ms)}</span>
        </div>
        <div class="site-row-bar" style="width:${pct}%;background:${color}"></div>
      </div>`;
    wsl.appendChild(row);
  });
  if (!topSites.length) wsl.innerHTML = '<div class="loading-row">No weekly data yet.</div>';
}

function bindInsightsTab() {
  // Generate AI insight
  qs('#btn-gen-insight').addEventListener('click', async () => {
    if (!settings.apiKey) {
      toast('⚠️ Add API key in Settings!');
      return;
    }
    const btn  = qs('#btn-gen-insight');
    const text = qs('#insight-text');
    btn.disabled = true;
    btn.textContent = '…';
    text.innerHTML = '<span class="shimmer" style="display:block;height:60px;border-radius:8px"></span>';

    try {
      const today   = new Date().toISOString().slice(0, 10);
      const dayData = analytics[today] || {};
      const insight = await generateDailyInsight(settings.apiKey, dayData);
      text.textContent = insight || 'Could not generate insight. Try again later.';
    } catch (err) {
      text.textContent = `⚠️ ${err.message}`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Refresh';
    }
  });

  // Export
  qs('#btn-export').addEventListener('click', async () => {
    const { data } = await msg('EXPORT_DATA');
    const json  = JSON.stringify(data, null, 2);
    const blob  = new Blob([json], { type: 'application/json' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = `mindvault-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('✅ Data exported!');
  });

  // Clear
  qs('#btn-clear').addEventListener('click', async () => {
    if (!confirm('Delete all browsing memory? This cannot be undone.')) return;
    await msg('CLEAR_HISTORY');
    allVisits = [];
    renderMemoryList([]);
    toast('🗑️ History cleared');
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function qs(sel) { return document.querySelector(sel); }

function extractDomain(url = '') {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function escHtml(str = '') {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

let toastTimer = null;
function toast(message, ms = 2500) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}
