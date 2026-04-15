/**
 * readerPanel.js
 * Interactive story reader UI using the traversal engine.
 */

import {
  createSession,
  currentFragment,
  availableChoices,
  makeChoice,
  resetSession,
  getHistoryFragments,
} from '../services/traversalEngine.js';

let _state = null;
let _session = null;

export function initReaderPanel(state) {
  _state = state;
  bindEvents();
}

function getStartId() {
  return _state.startId || _state.fragments[0]?.id || null;
}

export function renderReader() {
  const startId = getStartId();

  if (!startId || _state.fragments.length === 0) {
    document.getElementById('reader-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📖</div>
        <div class="empty-title">No story loaded</div>
        <div class="empty-desc">Add fragments in the Author tab and set a start node to begin reading.</div>
      </div>`;
    document.getElementById('history-content').innerHTML = '';
    return;
  }

  // Initialize or reset session when entering reader
  if (!_session || _session.history[0] !== startId || _session.fragMap.size !== _state.fragments.length) {
    _session = createSession(_state.fragments, startId);
  }

  renderCurrentFragment();
  renderHistory();
}

function renderCurrentFragment() {
  const container = document.getElementById('reader-content');
  if (!_session) { container.innerHTML = ''; return; }

  const frag = currentFragment(_session);
  if (!frag) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><div class="empty-title">Fragment not found</div></div>`;
    return;
  }

  const choices = availableChoices(_session);
  const isEnded = _session.ended || choices.length === 0;

  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  ];
  const grad = gradients[frag.id % gradients.length];

  container.innerHTML = `
    <div class="story-card" style="background:${grad}">
      <div class="story-card-id">Fragment ${frag.id} · Step ${_session.decisionCount + 1}</div>
      <div class="story-card-title">${escapeHtml(frag.title)}</div>
      <div class="story-card-text">${escapeHtml(frag.text)}</div>
      ${choices.length > 0 ? `
        <div class="choices-list">
          ${choices.map((c, i) => `
            <button class="choice-btn" data-choice="${i}">
              <span class="choice-num">${i + 1}</span>
              ${escapeHtml(c.text)}
            </button>
          `).join('')}
        </div>
      ` : ''}
    </div>
    <div class="story-ended ${isEnded ? 'visible' : ''}">
      ⏹ <strong>${_session.ended && choices.length > 0 ? 'Story stopped' : 'The End'}</strong>
      ${_session.ended && choices.length > 0 ? ' — A cycle or depth limit was reached.' : ''}
      <br><small>You visited ${_session.history.length} fragments, made ${_session.decisionCount} choices.</small>
    </div>
  `;

  // Bind choice buttons
  container.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.choice, 10);
      const result = makeChoice(_session, idx);
      if (!result.ok) {
        showReaderToast(result.reason, 'warning');
      }
      renderCurrentFragment();
      renderHistory();
      // Smooth scroll to top of reader
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderHistory() {
  const container = document.getElementById('history-content');
  if (!_session) { container.innerHTML = ''; return; }

  const histFragments = getHistoryFragments(_session);

  if (histFragments.length === 0) {
    container.innerHTML = `<div class="text-muted" style="padding:16px;font-size:0.8rem">Your reading path will appear here.</div>`;
    return;
  }

  container.innerHTML = `<div class="history-list">` +
    histFragments.map((f, i) => {
      const isCurrent = i === histFragments.length - 1;
      const choiceMade = _session.choiceHistory[i];
      return `
        <div class="history-item ${isCurrent ? 'current' : ''}" data-idx="${i}">
          <span class="history-num">${i + 1}.</span>
          <div>
            <div class="history-text">${i === 0 ? '▶ ' : ''}${escapeHtml(f.title)}</div>
            ${choiceMade && !choiceMade.loop ? `<div class="choice-made">→ "${escapeHtml(truncate(choiceMade.text, 35))}"</div>` : ''}
          </div>
        </div>
      `;
    }).join('') + `</div>`;
}

function bindEvents() {
  document.getElementById('reader-restart-btn')?.addEventListener('click', () => {
    if (!_session) return;
    resetSession(_session);
    renderCurrentFragment();
    renderHistory();
  });

  document.getElementById('reader-start-select')?.addEventListener('change', e => {
    const newStartId = parseInt(e.target.value, 10);
    if (!isNaN(newStartId)) {
      _session = createSession(_state.fragments, newStartId);
      renderCurrentFragment();
      renderHistory();
    }
  });
}

export function populateStartSelect() {
  const select = document.getElementById('reader-start-select');
  if (!select) return;
  const { fragments, startId } = _state;
  select.innerHTML = fragments.map(f =>
    `<option value="${f.id}" ${f.id === startId ? 'selected' : ''}>${f.id}: ${escapeHtml(f.title)}</option>`
  ).join('');
}

function showReaderToast(msg, type) {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.getElementById('toast-container').appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '…' : str;
}
