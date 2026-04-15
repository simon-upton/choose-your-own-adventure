/**
 * validator.js
 * Validates story fragment graph integrity.
 * Issues: { type, sourceId, targetId?, message }
 */

/**
 * Run all validations on a fragment array.
 * @param {Array} fragments
 * @param {number} startId
 * @returns {Array} array of issue objects
 */
export function validateGraph(fragments, startId = null) {
  const issues = [];
  const idSet = new Set(fragments.map(f => f.id));

  issues.push(...findDanglingLinks(fragments, idSet));
  issues.push(...findUnreachableNodes(fragments, idSet, startId));
  issues.push(...findCycles(fragments, idSet));

  return issues;
}

/**
 * Find choices pointing to non-existent fragment ids.
 */
export function findDanglingLinks(fragments, idSet = null) {
  const ids = idSet || new Set(fragments.map(f => f.id));
  const issues = [];

  for (const frag of fragments) {
    for (let i = 0; i < frag.choices.length; i++) {
      const choice = frag.choices[i];
      if (!ids.has(choice.targetId)) {
        issues.push({
          type: 'DANGLING_LINK',
          severity: 'error',
          sourceId: frag.id,
          targetId: choice.targetId,
          message: `Fragment ${frag.id} choice[${i}] ("${choice.text}") points to missing id ${choice.targetId}`,
        });
      }
    }
  }

  return issues;
}

/**
 * Find fragments that are not reachable from startId.
 */
export function findUnreachableNodes(fragments, idSet = null, startId = null) {
  if (startId === null) return [];
  const ids = idSet || new Set(fragments.map(f => f.id));
  if (!ids.has(startId)) return [];

  // BFS from startId
  const fragMap = new Map(fragments.map(f => [f.id, f]));
  const visited = new Set();
  const queue = [startId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (visited.has(current)) continue;
    visited.add(current);
    const frag = fragMap.get(current);
    if (!frag) continue;
    for (const choice of frag.choices) {
      if (!visited.has(choice.targetId)) queue.push(choice.targetId);
    }
  }

  return fragments
    .filter(f => !visited.has(f.id))
    .map(f => ({
      type: 'UNREACHABLE_NODE',
      severity: 'warning',
      sourceId: f.id,
      message: `Fragment ${f.id} ("${f.title}") is not reachable from start node ${startId}`,
    }));
}

/**
 * Detect cycles in the story graph.
 * Returns one issue per cycle detected.
 */
export function findCycles(fragments) {
  const fragMap = new Map(fragments.map(f => [f.id, f]));
  const visited = new Set();
  const inStack = new Set();
  const cycles = [];

  function dfs(id, path) {
    if (inStack.has(id)) {
      const cycleStart = path.indexOf(id);
      const cycleNodes = path.slice(cycleStart);
      cycles.push({
        type: 'CYCLE',
        severity: 'warning',
        sourceId: id,
        message: `Cycle detected: ${cycleNodes.join(' → ')} → ${id}`,
      });
      return;
    }
    if (visited.has(id)) return;

    visited.add(id);
    inStack.add(id);
    path.push(id);

    const frag = fragMap.get(id);
    if (frag) {
      for (const choice of frag.choices) {
        if (fragMap.has(choice.targetId)) {
          dfs(choice.targetId, [...path]);
        }
      }
    }

    inStack.delete(id);
  }

  for (const frag of fragments) {
    if (!visited.has(frag.id)) {
      dfs(frag.id, []);
    }
  }

  return cycles;
}

/**
 * Group issues by severity.
 */
export function groupBySeverity(issues) {
  return {
    errors: issues.filter(i => i.severity === 'error'),
    warnings: issues.filter(i => i.severity === 'warning'),
    infos: issues.filter(i => i.severity === 'info'),
  };
}
