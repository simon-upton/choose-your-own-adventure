/**
 * traversalEngine.js
 * Interactive story traversal for the reader mode.
 * Given a fragment collection and a start id, allows choice-by-choice progression.
 */

/**
 * Create a new traversal session.
 * @param {Array} fragments
 * @param {number} startId
 * @returns {Object} session
 */
export function createSession(fragments, startId) {
  const fragMap = new Map(fragments.map(f => [f.id, f]));

  if (!fragMap.has(startId)) {
    throw new Error(`Start fragment id ${startId} not found`);
  }

  return {
    fragMap,
    currentId: startId,
    history: [startId],      // ordered list of visited fragment ids
    choiceHistory: [],        // choices made (for replay / display)
    decisionCount: 0,
    maxDecisions: 20,         // safeguard against runaway paths
    ended: false,
  };
}

/**
 * Get the current fragment in a session.
 */
export function currentFragment(session) {
  return session.fragMap.get(session.currentId) || null;
}

/**
 * Get available choices for the current fragment.
 * Returns [] if the story has ended.
 */
export function availableChoices(session) {
  if (session.ended) return [];
  const frag = currentFragment(session);
  if (!frag) return [];
  return frag.choices.filter(c => session.fragMap.has(c.targetId));
}

/**
 * Make a choice by index. Advances the session to the next fragment.
 * @param {Object} session - mutable session object
 * @param {number} choiceIndex - index into current fragment's choices
 * @returns {{ ok: boolean, reason?: string }}
 */
export function makeChoice(session, choiceIndex) {
  if (session.ended) {
    return { ok: false, reason: 'Story has already ended' };
  }

  const frag = currentFragment(session);
  if (!frag) {
    return { ok: false, reason: 'No current fragment' };
  }

  if (choiceIndex < 0 || choiceIndex >= frag.choices.length) {
    return { ok: false, reason: `Invalid choice index ${choiceIndex}` };
  }

  const choice = frag.choices[choiceIndex];

  if (!session.fragMap.has(choice.targetId)) {
    return { ok: false, reason: `Target fragment ${choice.targetId} not found` };
  }

  // Check for cycles (already visited)
  if (session.history.includes(choice.targetId)) {
    session.ended = true;
    session.choiceHistory.push({ fromId: session.currentId, choiceIndex, text: choice.text, loop: true });
    return { ok: false, reason: `Cycle detected: already visited fragment ${choice.targetId}` };
  }

  // Advance
  session.choiceHistory.push({ fromId: session.currentId, choiceIndex, text: choice.text, loop: false });
  session.currentId = choice.targetId;
  session.history.push(choice.targetId);
  session.decisionCount++;

  const nextFrag = currentFragment(session);

  // Check terminal conditions
  if (!nextFrag || nextFrag.choices.length === 0) {
    session.ended = true;
    return { ok: true, ended: true, reason: 'Terminal fragment reached' };
  }

  if (session.decisionCount >= session.maxDecisions) {
    session.ended = true;
    return { ok: true, ended: true, reason: `Max decision depth (${session.maxDecisions}) reached` };
  }

  return { ok: true, ended: false };
}

/**
 * Reset session to the start or a given fragment id.
 */
export function resetSession(session, newStartId = null) {
  const startId = newStartId !== null ? newStartId : session.history[0];
  if (!session.fragMap.has(startId)) {
    throw new Error(`Fragment id ${startId} not found`);
  }
  session.currentId = startId;
  session.history = [startId];
  session.choiceHistory = [];
  session.decisionCount = 0;
  session.ended = false;
  return session;
}

/**
 * Get the full reading history as an array of fragments.
 */
export function getHistoryFragments(session) {
  return session.history.map(id => session.fragMap.get(id)).filter(Boolean);
}

/**
 * Summarize the session state for display.
 */
export function sessionSummary(session) {
  return {
    currentId: session.currentId,
    historyLength: session.history.length,
    decisionCount: session.decisionCount,
    ended: session.ended,
    isTerminal: availableChoices(session).length === 0,
  };
}
