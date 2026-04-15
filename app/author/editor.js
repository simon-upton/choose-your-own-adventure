/**
 * Author Editor — P1-05
 * Renders a form to create or update a single story fragment.
 * Writes changes into the store on save.
 */

import { store } from '../shared/store.js';

/**
 * Mount the author editor into the given container element.
 * @param {HTMLElement} container
 */
export function mountEditor(container) {
  container.innerHTML = buildEditorHTML();
  wireEvents(container);
}

/** Populate the form with an existing fragment for editing. */
export function editFragment(container, fragment) {
  container.querySelector('#frag-id').value = fragment.id;
  container.querySelector('#frag-title').value = fragment.title ?? '';
  container.querySelector('#frag-text').value = fragment.text;
  container.querySelector('#frag-tags').value = fragment.tags.join(', ');
  renderChoiceRows(container, fragment.choices);
  container.querySelector('#editor-status').textContent = '';
}

/** Clear the form for new fragment authoring. */
export function clearEditor(container) {
  container.querySelector('#frag-id').value = '';
  container.querySelector('#frag-title').value = '';
  container.querySelector('#frag-text').value = '';
  container.querySelector('#frag-tags').value = '';
  renderChoiceRows(container, []);
  container.querySelector('#editor-status').textContent = '';
}

// --- private helpers ---

function buildEditorHTML() {
  return `
<div class="editor-panel">
  <h2>Fragment Editor</h2>
  <div class="field-row">
    <label for="frag-id">ID <span class="required">*</span></label>
    <input type="number" id="frag-id" placeholder="e.g. 2" min="1" step="1" />
  </div>
  <div class="field-row">
    <label for="frag-title">Title</label>
    <input type="text" id="frag-title" placeholder="Short label (optional)" />
  </div>
  <div class="field-row">
    <label for="frag-text">Text <span class="required">*</span></label>
    <textarea id="frag-text" rows="6" placeholder="Narrative text for this fragment…"></textarea>
  </div>
  <div class="field-row">
    <label for="frag-tags">Tags</label>
    <input type="text" id="frag-tags" placeholder="Comma-separated tags (optional)" />
  </div>

  <div class="choices-section">
    <div class="choices-header">
      <span>Choices</span>
      <button id="add-choice-btn" type="button">+ Add Choice</button>
    </div>
    <div id="choices-list"></div>
  </div>

  <div class="editor-actions">
    <button id="save-btn" type="button" class="btn-primary">Save Fragment</button>
    <button id="clear-btn" type="button" class="btn-secondary">Clear</button>
    <button id="delete-btn" type="button" class="btn-danger">Delete</button>
  </div>

  <div id="editor-status" class="editor-status"></div>

  <div class="fragment-list-section">
    <h3>All Fragments</h3>
    <div id="fragment-list"></div>
  </div>
</div>`;
}

function wireEvents(container) {
  container.querySelector('#add-choice-btn').addEventListener('click', () => {
    addChoiceRow(container);
  });

  container.querySelector('#save-btn').addEventListener('click', () => {
    saveFragment(container);
  });

  container.querySelector('#clear-btn').addEventListener('click', () => {
    clearEditor(container);
  });

  container.querySelector('#delete-btn').addEventListener('click', () => {
    deleteFragment(container);
  });

  // Delegate choice removal
  container.querySelector('#choices-list').addEventListener('click', e => {
    if (e.target.classList.contains('remove-choice-btn')) {
      e.target.closest('.choice-row').remove();
    }
  });

  // Refresh fragment list when store changes
  store.subscribe(() => refreshFragmentList(container));
  refreshFragmentList(container);
}

function renderChoiceRows(container, choices) {
  const list = container.querySelector('#choices-list');
  list.innerHTML = '';
  for (const choice of choices) {
    list.appendChild(buildChoiceRow(choice.text, choice.targetId));
  }
}

function addChoiceRow(container) {
  container.querySelector('#choices-list').appendChild(buildChoiceRow('', ''));
}

function buildChoiceRow(text, targetId) {
  const row = document.createElement('div');
  row.className = 'choice-row';
  row.innerHTML = `
    <input type="text" class="choice-text" placeholder="Choice text…" value="${escAttr(text)}" />
    <input type="number" class="choice-target" placeholder="Target ID" min="1" step="1"
           value="${targetId !== '' ? escAttr(String(targetId)) : ''}" />
    <button type="button" class="remove-choice-btn" title="Remove">✕</button>
  `;
  return row;
}

function saveFragment(container) {
  const statusEl = container.querySelector('#editor-status');
  const idRaw = container.querySelector('#frag-id').value.trim();
  const titleRaw = container.querySelector('#frag-title').value.trim();
  const textRaw = container.querySelector('#frag-text').value.trim();
  const tagsRaw = container.querySelector('#frag-tags').value.trim();

  const errors = [];

  const id = parseInt(idRaw, 10);
  if (!idRaw || isNaN(id) || id <= 0) errors.push('ID must be a positive integer.');
  if (!textRaw) errors.push('Text must not be empty.');

  // Collect choices
  const choiceRows = container.querySelectorAll('.choice-row');
  const choices = [];
  let choiceErrors = false;
  for (const [i, row] of choiceRows.entries()) {
    const cText = row.querySelector('.choice-text').value.trim();
    const cTarget = parseInt(row.querySelector('.choice-target').value.trim(), 10);
    if (!cText) { errors.push(`Choice ${i + 1}: text must not be empty.`); choiceErrors = true; }
    if (isNaN(cTarget) || cTarget <= 0) { errors.push(`Choice ${i + 1}: target ID must be a positive integer.`); choiceErrors = true; }
    if (!choiceErrors) choices.push({ text: cText, targetId: cTarget });
    choiceErrors = false;
  }

  if (errors.length > 0) {
    statusEl.textContent = errors.join(' ');
    statusEl.className = 'editor-status error';
    return;
  }

  const now = new Date().toISOString();
  const existing = store.fragments.find(f => f.id === id);

  const rawFragment = {
    id,
    title: titleRaw || undefined,
    text: textRaw,
    choices,
    metadata: {
      source: existing?.metadata.source ?? 'author',
      revision: existing ? existing.metadata.revision + 1 : 1,
      createdAt: existing?.metadata.createdAt ?? now,
      updatedAt: now,
      author: existing?.metadata.author ?? 'author',
    },
    tags: tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [],
  };

  store.upsertFragment(rawFragment);

  if (store.loadError) {
    statusEl.textContent = `Save failed: ${store.loadError.message}`;
    statusEl.className = 'editor-status error';
  } else {
    statusEl.textContent = `Fragment ${id} saved.`;
    statusEl.className = 'editor-status success';
  }
}

function deleteFragment(container) {
  const idRaw = container.querySelector('#frag-id').value.trim();
  const id = parseInt(idRaw, 10);
  if (!idRaw || isNaN(id) || id <= 0) {
    const statusEl = container.querySelector('#editor-status');
    statusEl.textContent = 'Enter a valid ID to delete.';
    statusEl.className = 'editor-status error';
    return;
  }
  store.deleteFragment(id);
  clearEditor(container);
}

function refreshFragmentList(container) {
  const list = container.querySelector('#fragment-list');
  if (!list) return;
  const fragments = store.fragments;

  if (fragments.length === 0) {
    list.innerHTML = '<p class="empty-state">No fragments loaded.</p>';
    return;
  }

  list.innerHTML = fragments
    .slice()
    .sort((a, b) => a.id - b.id)
    .map(f => `
      <div class="fragment-list-item" data-id="${f.id}">
        <span class="frag-id">#${f.id}</span>
        <span class="frag-title">${escHtml(f.title ?? '(untitled)')}</span>
        ${f.choices.length === 0 ? '<span class="terminal-badge">terminal</span>' : `<span class="choice-count">${f.choices.length} choice(s)</span>`}
      </div>
    `)
    .join('');

  // Click to load fragment into editor
  list.querySelectorAll('.fragment-list-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = parseInt(item.dataset.id, 10);
      const frag = store.fragments.find(f => f.id === id);
      if (frag) editFragment(container, frag);
    });
  });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(str) {
  return String(str)
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
