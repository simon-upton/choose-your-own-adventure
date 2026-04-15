/**
 * In-memory store for the authoring session.
 * Holds the fragment collection and notifies listeners on change.
 */

import { loadFragments } from '../../api/services/fragmentLoader.js';
import { buildGraph } from '../../api/services/graphBuilder.js';
import { validate } from '../../api/services/validator.js';

const listeners = new Set();
let _fragments = [];
let _graph = null;
let _issues = [];
let _startNodeId = null;
let _loadError = null;

export const store = {
  /** Current validated fragment array */
  get fragments() { return _fragments; },
  /** Current graph (rebuilt after each fragment change) */
  get graph() { return _graph; },
  /** Current validation issues */
  get issues() { return _issues; },
  /** Current start node id */
  get startNodeId() { return _startNodeId; },
  /** Load error from the last loadFragments call (null if clean) */
  get loadError() { return _loadError; },

  /**
   * Load fragments from a raw JS array (already parsed from JSON).
   * Rebuilds the graph and runs validation immediately.
   * Notifies listeners.
   */
  loadRaw(rawArray) {
    try {
      _fragments = loadFragments(rawArray);
      _loadError = null;
    } catch (err) {
      _loadError = err;
      _fragments = [];
      _graph = null;
      _issues = [];
      _startNodeId = null;
      notify();
      return;
    }
    _startNodeId = _fragments.length > 0
      ? Math.min(..._fragments.map(f => f.id))
      : null;
    rebuildGraph();
    notify();
  },

  /**
   * Upsert a fragment (add if new id, replace if existing id).
   * Re-validates and rebuilds the graph.
   */
  upsertFragment(rawFragment) {
    // Merge into current raw collection
    const currentRaw = _fragments.map(f => ({
      id: f.id,
      title: f.title,
      text: f.text,
      choices: f.choices.map(c => ({ text: c.text, targetId: c.targetId })),
      metadata: { ...f.metadata },
      tags: [...f.tags],
    }));

    const existingIndex = currentRaw.findIndex(f => f.id === rawFragment.id);
    if (existingIndex >= 0) {
      currentRaw[existingIndex] = rawFragment;
    } else {
      currentRaw.push(rawFragment);
    }

    store.loadRaw(currentRaw);
  },

  /**
   * Delete a fragment by id. Re-validates and rebuilds.
   */
  deleteFragment(id) {
    const currentRaw = _fragments
      .filter(f => f.id !== id)
      .map(f => ({
        id: f.id,
        title: f.title,
        text: f.text,
        choices: f.choices.map(c => ({ text: c.text, targetId: c.targetId })),
        metadata: { ...f.metadata },
        tags: [...f.tags],
      }));
    store.loadRaw(currentRaw);
  },

  /** Set the start node used for the reader and reachability checks */
  setStartNodeId(id) {
    _startNodeId = id;
    _issues = validate(_fragments, _startNodeId);
    notify();
  },

  /** Subscribe to store changes. Returns an unsubscribe function. */
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

function rebuildGraph() {
  if (_fragments.length === 0) {
    _graph = null;
    _issues = [];
    return;
  }
  _graph = buildGraph(_fragments, _startNodeId, { graphId: 'authoring-session' });
  _issues = validate(_fragments, _startNodeId);
}

function notify() {
  for (const fn of listeners) fn();
}
