/**
 * app.js
 * Main application entry point. Manages global state and tab routing.
 */

import { loadFromUrl, loadFromString, loadFragments } from './services/fragmentLoader.js';
import { graphToMermaid, graphToJSON, buildGraph } from './services/graphBuilder.js';
import { initAuthorEditor, render as renderAuthor } from './components/authorEditor.js';
import { initGraphView, renderGraph } from './components/graphView.js';
import { initReaderPanel, renderReader, populateStartSelect } from './components/readerPanel.js';
import { initValidationPanel, renderValidation } from './components/validationPanel.js';

// ===== GLOBAL STATE =====
const state = {
  fragments: [],
  startId: null,
  selectedFragmentId: null,
  dirty: false,
  currentTab: 'author',
  onDataChange: onDataChange,
};

// ===== BOOT =====
async function boot() {
  initAuthorEditor(state);
  initGraphView(state);
  initReaderPanel(state);
  initValidationPanel(state);
  bindGlobalEvents();
  await loadSeedData();
  setTab('author');
}

async function loadSeedData() {
  try {
    // Load the seed data relative to index.html location
    const { fragments, errors } = await loadFromUrl('./data/seed/cot-minimal-subset.json');
    if (Object.keys(errors).length > 0) {
      console.warn('Seed data had validation issues:', errors);
    }
    state.fragments = fragments;
    state.startId = fragments[0]?.id || null;
    state.selectedFragmentId = fragments[0]?.id || null;
    showToast(`Loaded ${fragments.length} fragments from seed data.`, 'success');
  } catch (err) {
    console.error('Failed to load seed data:', err);
    showToast('Could not load seed data. Starting with empty story.', 'warning');
    state.fragments = [];
    state.startId = null;
    state.selectedFragmentId = null;
  }
}

// ===== DATA CHANGE HANDLER =====
function onDataChange() {
  // Re-render the current tab plus validation badge
  const tab = state.currentTab;
  if (tab === 'author') {
    renderAuthor();
  } else if (tab === 'graph') {
    renderGraph();
  } else if (tab === 'reader') {
    populateStartSelect();
    renderReader();
  } else if (tab === 'validation') {
    renderValidation();
  }
  // Always update validation badge
  renderValidation();
  // Always update author stats
  renderAuthor();
}

// ===== TAB ROUTING =====
function setTab(tabName) {
  state.currentTab = tabName;

  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.panel === tabName);
  });
  document.querySelectorAll('.panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tabName}`);
  });

  if (tabName === 'author') renderAuthor();
  else if (tabName === 'graph') renderGraph();
  else if (tabName === 'reader') { populateStartSelect(); renderReader(); }
  else if (tabName === 'validation') renderValidation();
}

// ===== EVENT BINDING =====
function bindGlobalEvents() {
  // Tab navigation
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => setTab(tab.dataset.panel));
  });

  // Load JSON from file input
  document.getElementById('load-json-input')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { fragments, errors } = loadFromString(text);
      if (Object.keys(errors).length > 0) {
        showToast(`Loaded with ${Object.keys(errors).length} validation error(s). Check console.`, 'warning');
        console.warn('Load errors:', errors);
      }
      state.fragments = fragments;
      state.startId = fragments[0]?.id || null;
      state.selectedFragmentId = fragments[0]?.id || null;
      state.dirty = false;
      onDataChange();
      showToast(`Loaded ${fragments.length} fragments from ${file.name}`, 'success');
    } catch (err) {
      showToast(`Failed to load file: ${err.message}`, 'error');
    }
    e.target.value = ''; // reset input
  });

  // Export JSON
  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    if (state.fragments.length === 0) { showToast('No fragments to export.', 'warning'); return; }
    const now = new Date().toISOString();
    const json = JSON.stringify(state.fragments, null, 2);
    downloadFile(json, `cyoa-fragments-${now.substring(0,10)}.json`, 'application/json');
    showToast('Fragments exported as JSON.', 'success');
  });

  // Export Mermaid
  document.getElementById('export-mmd-btn')?.addEventListener('click', () => {
    if (state.fragments.length === 0) { showToast('No fragments to export.', 'warning'); return; }
    const { nodes, edges } = buildGraph(state.fragments, state.startId);
    const mmd = graphToMermaid(nodes, edges);
    downloadFile(mmd, 'cyoa-story-graph.mmd', 'text/plain');
    showToast('Graph exported as Mermaid.', 'success');
  });

  // Export graph JSON
  document.getElementById('export-graph-json-btn')?.addEventListener('click', () => {
    if (state.fragments.length === 0) { showToast('No fragments to export.', 'warning'); return; }
    const { nodes, edges } = buildGraph(state.fragments, state.startId);
    const json = JSON.stringify(graphToJSON(nodes, edges), null, 2);
    downloadFile(json, 'cyoa-story-graph.json', 'application/json');
    showToast('Graph JSON exported.', 'success');
  });

  // Trigger file input from button
  document.getElementById('load-json-btn')?.addEventListener('click', () => {
    document.getElementById('load-json-input')?.click();
  });

  // Graph recenter button
  document.getElementById('graph-recenter-btn')?.addEventListener('click', renderGraph);
}

// ===== UTILITIES =====
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', boot);
