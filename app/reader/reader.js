/**
 * Reader Panel — P1-07
 * Allows the user to start at the configured node and progress
 * through the story by clicking choices.
 */

import { store } from '../shared/store.js';
import { traverse } from '../../api/services/traversalEngine.js';

/**
 * Mount the reader panel into the given container element.
 * @param {HTMLElement} container
 */
export function mountReader(container) {
  container.innerHTML = buildReaderHTML();
  wireEvents(container);
  store.subscribe(() => syncStartOptions(container));
  syncStartOptions(container);
}

// Reader state
let _visitedPath = []; // GraphNode[]
let _choiceIndices = []; // number[]

// --- HTML ---

function buildReaderHTML() {
  return `
<div class="reader-panel">
  <h2>Story Reader</h2>
  <div class="reader-controls">
    <label for="start-node-select">Start at:</label>
    <select id="start-node-select"></select>
    <button id="reader-start-btn" type="button" class="btn-primary">Start</button>
    <button id="reader-restart-btn" type="button" class="btn-secondary" style="display:none">Restart</button>
  </div>
  <div id="reader-content" class="reader-content"></div>
</div>`;
}

// --- events ---

function wireEvents(container) {
  container.querySelector('#reader-start-btn').addEventListener('click', () => {
    startReading(container);
  });
  container.querySelector('#reader-restart-btn').addEventListener('click', () => {
    startReading(container);
  });
  store.subscribe(() => {
    // If graph changes, reset
    _visitedPath = [];
    _choiceIndices = [];
    renderContent(container);
  });
}

function syncStartOptions(container) {
  const select = container.querySelector('#start-node-select');
  const fragments = store.fragments;
  const currentVal = select.value;

  select.innerHTML = fragments.length === 0
    ? '<option value="">— no fragments —</option>'
    : fragments
        .slice()
        .sort((a, b) => a.id - b.id)
        .map(f => `<option value="${f.id}">${f.id}${f.title ? ': ' + escHtml(f.title) : ''}</option>`)
        .join('');

  // Restore selection or default to store.startNodeId
  if (currentVal && fragments.some(f => String(f.id) === currentVal)) {
    select.value = currentVal;
  } else if (store.startNodeId !== null) {
    select.value = String(store.startNodeId);
  }
}

// --- reader logic ---

function startReading(container) {
  const select = container.querySelector('#start-node-select');
  const startId = parseInt(select.value, 10);

  if (isNaN(startId)) {
    showMessage(container, 'Load fragments before starting.');
    return;
  }

  _visitedPath = [];
  _choiceIndices = [];

  const graph = store.graph;
  if (!graph) {
    showMessage(container, 'No graph available.');
    return;
  }

  try {
    _visitedPath = traverse(graph, startId, _choiceIndices);
  } catch (err) {
    showMessage(container, `Error: ${err.message}`);
    return;
  }

  container.querySelector('#reader-restart-btn').style.display = 'inline-block';
  renderContent(container);
}

function chooseOption(container, choiceIndex) {
  _choiceIndices = [..._choiceIndices, choiceIndex];
  const graph = store.graph;
  const startId = parseInt(container.querySelector('#start-node-select').value, 10);

  if (!graph || isNaN(startId)) return;

  try {
    _visitedPath = traverse(graph, startId, _choiceIndices);
    renderContent(container);
  } catch (err) {
    showMessage(container, `Traversal error: ${err.message}`);
  }
}

function renderContent(container) {
  const content = container.querySelector('#reader-content');
  if (!content) return;

  if (_visitedPath.length === 0) {
    content.innerHTML = '<p class="empty-state">Press Start to begin the story.</p>';
    return;
  }

  const graph = store.graph;
  const fragmentMap = new Map(store.fragments.map(f => [f.id, f]));
  const currentNode = _visitedPath[_visitedPath.length - 1];
  const currentFragment = fragmentMap.get(currentNode.id);

  // History breadcrumb
  const historyHTML = _visitedPath.length > 1
    ? `<div class="reader-history">
        Path: ${_visitedPath.map((n, i) =>
          `<span class="path-node${i === _visitedPath.length - 1 ? ' current' : ''}">#${n.id}</span>`
        ).join(' → ')}
       </div>`
    : '';

  // Current fragment text
  const textHTML = currentFragment
    ? `<div class="fragment-text">${escHtmlNL(currentFragment.text)}</div>`
    : `<div class="fragment-text error">Fragment #${currentNode.id} text not found.</div>`;

  // Terminal or choices
  let actionHTML = '';
  if (currentNode.isTerminal || !currentFragment || currentFragment.choices.length === 0) {
    actionHTML = `<div class="reader-terminal">
      <p class="terminal-msg">— The End —</p>
      <button type="button" class="btn-secondary" id="reader-end-restart">Read Again</button>
    </div>`;
  } else {
    const outEdges = graph.edges
      .filter(e => e.from === currentNode.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    actionHTML = `<div class="reader-choices">
      <p class="choices-label">What do you do?</p>
      ${outEdges.map((edge, i) => `
        <button type="button" class="choice-btn" data-choice-index="${i}">
          ${escHtml(edge.choiceText)}
        </button>
      `).join('')}
    </div>`;
  }

  content.innerHTML = historyHTML + textHTML + actionHTML;

  // Wire choice buttons
  content.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      chooseOption(container, parseInt(btn.dataset.choiceIndex, 10));
    });
  });

  // Wire end-restart
  const endRestart = content.querySelector('#reader-end-restart');
  if (endRestart) {
    endRestart.addEventListener('click', () => startReading(container));
  }
}

function showMessage(container, msg) {
  const content = container.querySelector('#reader-content');
  if (content) content.innerHTML = `<p class="reader-msg">${escHtml(msg)}</p>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escHtmlNL(str) {
  return escHtml(str).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
}
