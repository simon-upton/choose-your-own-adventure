/**
 * Validator — P1-03
 * Checks a fragment collection for structural issues:
 *   - dangling-link: a choice points to a fragment id that does not exist
 *   - unreachable-node: a fragment cannot be reached from the start node
 *   - cycle: a traversal path loops back on itself
 *
 * Each issue: { type, sourceId, message }
 */

/**
 * @param {Fragment[]} fragments
 * @param {number} [startId] - defaults to the fragment with the smallest id
 * @returns {{ type: string, sourceId: number, message: string }[]}
 */
export function validate(fragments, startId) {
  if (fragments.length === 0) return [];

  const fragmentMap = new Map(fragments.map(f => [f.id, f]));
  const resolvedStartId = startId ?? Math.min(...fragments.map(f => f.id));
  const issues = [];

  checkDanglingLinks(fragments, fragmentMap, issues);
  checkUnreachableNodes(fragments, fragmentMap, resolvedStartId, issues);
  checkCycles(fragments, fragmentMap, issues);

  return issues;
}

function checkDanglingLinks(fragments, fragmentMap, issues) {
  for (const f of fragments) {
    for (const choice of f.choices) {
      if (!fragmentMap.has(choice.targetId)) {
        issues.push({
          type: 'dangling-link',
          sourceId: f.id,
          message: `Fragment ${f.id} choice "${choice.text}" points to fragment ${choice.targetId} which does not exist.`,
        });
      }
    }
  }
}

function checkUnreachableNodes(fragments, fragmentMap, startId, issues) {
  if (!fragmentMap.has(startId)) {
    // Can't determine reachability without a valid start
    issues.push({
      type: 'unreachable-node',
      sourceId: startId,
      message: `Start node ${startId} does not exist in the fragment collection.`,
    });
    return;
  }

  const reachable = new Set();
  const queue = [startId];
  reachable.add(startId);

  while (queue.length > 0) {
    const currentId = queue.shift();
    const frag = fragmentMap.get(currentId);
    if (!frag) continue;
    for (const choice of frag.choices) {
      if (!reachable.has(choice.targetId) && fragmentMap.has(choice.targetId)) {
        reachable.add(choice.targetId);
        queue.push(choice.targetId);
      }
    }
  }

  for (const f of fragments) {
    if (!reachable.has(f.id)) {
      issues.push({
        type: 'unreachable-node',
        sourceId: f.id,
        message: `Fragment ${f.id}${f.title ? ` ("${f.title}")` : ''} cannot be reached from the start node (fragment ${startId}).`,
      });
    }
  }
}

function checkCycles(fragments, fragmentMap, issues) {
  // DFS with three-color marking to detect back edges
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map(fragments.map(f => [f.id, WHITE]));
  const reportedBackEdges = new Set();

  function dfs(id, ancestorPath) {
    color.set(id, GRAY);
    const frag = fragmentMap.get(id);
    if (!frag) { color.set(id, BLACK); return; }

    for (const choice of frag.choices) {
      const targetId = choice.targetId;
      if (!fragmentMap.has(targetId)) continue; // dangling, already reported

      if (color.get(targetId) === GRAY) {
        // Back edge found — cycle
        const edgeKey = `${id}->${targetId}`;
        if (!reportedBackEdges.has(edgeKey)) {
          reportedBackEdges.add(edgeKey);
          const cycleStart = ancestorPath.indexOf(targetId);
          const cyclePath =
            cycleStart >= 0
              ? [...ancestorPath.slice(cycleStart), id, targetId]
              : [id, targetId];
          issues.push({
            type: 'cycle',
            sourceId: id,
            message: `Cycle detected: ${cyclePath.join(' → ')}`,
          });
        }
      } else if (color.get(targetId) === WHITE) {
        dfs(targetId, [...ancestorPath, id]);
      }
    }

    color.set(id, BLACK);
  }

  for (const f of fragments) {
    if (color.get(f.id) === WHITE) {
      dfs(f.id, []);
    }
  }
}
