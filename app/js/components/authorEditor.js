/**
 * authorEditor.js
 * Author mode UI: fragment list, editor form, choice management.
 */

import { showToast } from '../app.js';

let _state = null; // reference to global app state

export function initAuthorEditor(state) {
  _state = state;
  bindEvents();
  render();
}

// ===== RENDER =====

export function render() {
  renderFragmentList();
  renderEditorForm();
  renderStats();
}

function renderStats() {
  const { fragments } = _state;
  const terminal = fragments.filter(f => f.choices.length === 0).length;
  const choices = fragments.reduce((n, f) => n + f.choices.length, 0);

  document.getElementById('stat-fragments').textContent = fragments.length;
  document.getElementById('stat-terminal').textContent = terminal;
  document.getElementById('stat-choices').textContent = choices;
  document.getElementById('stat-authors').textContent =
    new Set(fragments.map(f => f.metadata.author).filter(Boolean)).size || '—';
}

function renderFragmentList() {
  const container = document.getElementById('fragment-list');
  const query = (document.getElementById('fragment-search')?.value || '').toLowerCase();
  const { fragments, startId, selectedFragmentId } = _state;

  const filtered = query
    ? fragments.filter(f =>
        f.title.toLowerCase().includes(query) ||
        String(f.id).includes(query) ||
        f.text.toLowerCase().includes(query))
    : fragments;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No fragments found</div>
        <div class="empty-desc">Try a different search or add a new fragment.</div>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(f => {
    const isTerminal = f.choices.length === 0;
    const isStart = f.id === startId;
    const isSelected = f.id === selectedFragmentId;
    const idClass = isStart ? 'is-start' : isTerminal ? 'is-terminal' : '';
    return `
      <div class="fragment-item ${isSelected ? 'active' : ''}" data-id="${f.id}">
        <span class="fragment-id ${idClass}">${f.id}</span>
        <div class="fragment-info">
          <div class="fragment-title">${escapeHtml(f.title)}</div>
          <div class="fragment-meta">${f.choices.length} choice${f.choices.length !== 1 ? 's' : ''}${isTerminal ? ' · Terminal' : ''}${isStart ? ' · Start' : ''}</div>
          <div class="tag-list">
            ${f.tags.map(t => `<span class="tag ${t}">${t}</span>`).join('')}
          </div>
        </div>
      </div>`;
  }).join('');

  // Bind click events
  container.querySelectorAll('.fragment-item').forEach(el => {
    el.addEventListener('click', () => {
      _state.selectedFragmentId = Number(el.dataset.id);
      renderFragmentList();
      renderEditorForm();
    });
  });
}

function renderEditorForm() {
  const form = document.getElementById('editor-form');
  const frag = _state.fragments.find(f => f.id === _state.selectedFragmentId);

  if (!frag) {
    form.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✏️</div>
        <div class="empty-title">Select a fragment to edit</div>
        <div class="empty-desc">Choose a fragment from the list, or create a new one.</div>
      </div>`;
    return;
  }

  form.innerHTML = `
    <div class="form-group">
      <label class="form-label">Fragment ID</label>
      <input class="form-input" id="edit-id" type="number" value="${frag.id}" min="1" />
    </div>
    <div class="form-group">
      <label class="form-label">Title</label>
      <input class="form-input" id="edit-title" type="text" value="${escapeHtml(frag.title)}" placeholder="Short label for this fragment" />
    </div>
    <div class="form-group">
      <label class="form-label">Story Text</label>
      <textarea class="form-textarea" id="edit-text" rows="6" placeholder="Narrative text shown to the reader...">${escapeHtml(frag.text)}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Tags (comma-separated)</label>
      <input class="form-input" id="edit-tags" type="text" value="${frag.tags.join(', ')}" placeholder="e.g. intro, terminal, adventure" />
    </div>
    <div class="form-group">
      <label class="form-label">Source</label>
      <input class="form-input" id="edit-source" type="text" value="${escapeHtml(frag.metadata.source || '')}" />
    </div>
    <hr class="divider" />
    <div class="form-group">
      <label class="form-label">Choices</label>
      <div class="choices-editor" id="choices-editor">
        ${frag.choices.map((c, i) => renderChoiceRow(c, i)).join('')}
      </div>
      <button class="btn btn-secondary btn-sm" id="add-choice-btn" style="margin-top:10px">+ Add Choice</button>
    </div>
    <hr class="divider" />
    <div style="display:flex; gap:8px; flex-wrap:wrap;">
      <button class="btn btn-primary" id="save-fragment-btn">💾 Save Fragment</button>
      <button class="btn btn-secondary" id="set-start-btn" ${frag.id === _state.startId ? 'disabled' : ''}>
        ${frag.id === _state.startId ? '✅ Start Node' : '▶ Set as Start'}
      </button>
      <button class="btn btn-danger" id="delete-fragment-btn" style="margin-left:auto">🗑 Delete</button>
    </div>
  `;

  document.getElementById('add-choice-btn').addEventListener('click', addChoiceRow);
  document.getElementById('save-fragment-btn').addEventListener('click', saveFragment);
  document.getElementById('set-start-btn').addEventListener('click', setAsStart);
  document.getElementById('delete-fragment-btn').addEventListener('click', deleteFragment);
  bindChoiceDeleteButtons();
}

function renderChoiceRow(choice, index) {
  return `
    <div class="choice-row" data-choice-index="${index}">
      <input class="form-input choice-text" type="text" placeholder="Choice text..." value="${escapeHtml(choice.text)}" />
      <input class="form-input choice-target" type="number" placeholder="→ ID" value="${choice.targetId}" min="1" />
      <button class="btn btn-danger btn-sm delete-choice-btn" data-index="${index}">✕</button>
    </div>`;
}

function addChoiceRow() {
  const editor = document.getElementById('choices-editor');
  const index = editor.querySelectorAll('.choice-row').length;
  const row = document.createElement('div');
  row.innerHTML = renderChoiceRow({ text: '', targetId: '' }, index);
  editor.appendChild(row.firstElementChild);
  bindChoiceDeleteButtons();
}

function bindChoiceDeleteButtons() {
  document.querySelectorAll('.delete-choice-btn').forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll('.delete-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.choice-row').remove();
    });
  });
}

// ===== ACTIONS =====

function saveFragment() {
  const frag = _state.fragments.find(f => f.id === _state.selectedFragmentId);
  if (!frag) return;

  const newId = parseInt(document.getElementById('edit-id').value, 10);
  const newTitle = document.getElementById('edit-title').value.trim();
  const newText = document.getElementById('edit-text').value.trim();
  const newTags = document.getElementById('edit-tags').value.split(',').map(t => t.trim()).filter(Boolean);
  const newSource = document.getElementById('edit-source').value.trim();

  if (!newTitle || !newText) {
    showToast('Title and text are required.', 'error');
    return;
  }

  const choiceRows = document.querySelectorAll('.choice-row');
  const newChoices = [];
  let choiceError = false;

  choiceRows.forEach(row => {
    const text = row.querySelector('.choice-text').value.trim();
    const targetId = parseInt(row.querySelector('.choice-target').value, 10);
    if (!text) { choiceError = true; return; }
    if (isNaN(targetId) || targetId <= 0) { choiceError = true; return; }
    newChoices.push({ text, targetId });
  });

  if (choiceError) {
    showToast('Each choice must have text and a valid target ID.', 'error');
    return;
  }

  // Check for id conflict
  if (newId !== frag.id && _state.fragments.some(f => f.id === newId)) {
    showToast(`Fragment ID ${newId} already exists.`, 'error');
    return;
  }

  // Apply changes
  const oldId = frag.id;
  frag.id = newId;
  frag.title = newTitle;
  frag.text = newText;
  frag.tags = newTags;
  frag.choices = newChoices;
  frag.metadata.source = newSource;
  frag.metadata.updatedAt = new Date().toISOString();
  frag.metadata.revision = (frag.metadata.revision || 0) + 1;

  // If id changed, update startId and all references
  if (oldId !== newId) {
    if (_state.startId === oldId) _state.startId = newId;
    for (const f of _state.fragments) {
      for (const c of f.choices) {
        if (c.targetId === oldId) c.targetId = newId;
      }
    }
    _state.selectedFragmentId = newId;
  }

  _state.dirty = true;
  _state.onDataChange();
  showToast(`Fragment ${newId} saved.`, 'success');
}

function setAsStart() {
  const frag = _state.fragments.find(f => f.id === _state.selectedFragmentId);
  if (!frag) return;
  _state.startId = frag.id;
  _state.onDataChange();
  showToast(`Fragment ${frag.id} set as start node.`, 'success');
}

function deleteFragment() {
  const frag = _state.fragments.find(f => f.id === _state.selectedFragmentId);
  if (!frag) return;
  if (!confirm(`Delete fragment ${frag.id} ("${frag.title}")? This cannot be undone.`)) return;

  _state.fragments = _state.fragments.filter(f => f.id !== frag.id);
  _state.selectedFragmentId = _state.fragments[0]?.id || null;
  if (_state.startId === frag.id) _state.startId = _state.fragments[0]?.id || null;
  _state.dirty = true;
  _state.onDataChange();
  showToast(`Fragment ${frag.id} deleted.`, 'success');
}

// ===== NEW FRAGMENT =====
export function createNewFragment() {
  const maxId = _state.fragments.reduce((m, f) => Math.max(m, f.id), 0);
  const newId = maxId + 1;
  const now = new Date().toISOString();

  const newFrag = {
    id: newId,
    title: `New Fragment ${newId}`,
    text: 'Write your story here...',
    choices: [],
    tags: [],
    metadata: {
      source: 'author',
      revision: 1,
      createdAt: now,
      updatedAt: now,
      author: 'user',
    },
  };

  _state.fragments.push(newFrag);
  _state.selectedFragmentId = newId;
  _state.dirty = true;
  _state.onDataChange();
  showToast(`New fragment ${newId} created.`, 'success');
}

// ===== HELPERS =====
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function bindEvents() {
  document.getElementById('fragment-search')?.addEventListener('input', renderFragmentList);
  document.getElementById('new-fragment-btn')?.addEventListener('click', createNewFragment);
}
