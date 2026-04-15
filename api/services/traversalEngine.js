/**
 * Traversal Engine — P1-04
 * Given a graph, a start node id, and a sequence of choice indices,
 * returns the ordered list of visited graph nodes.
 */

/**
 * @param {Graph} graph - graph object from graphBuilder
 * @param {number} startId - id of the starting node
 * @param {number[]} choiceIndices - zero-based index for each choice step
 * @returns {GraphNode[]} visited nodes in traversal order (includes start node)
 * @throws {Error} if startId or any target is missing, or a choice index is out of range
 */
export function traverse(graph, startId, choiceIndices) {
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));

  if (!nodeMap.has(startId)) {
    throw new Error(`Start node ${startId} not found in graph.`);
  }

  // Build per-node sorted edge list once
  const outEdges = buildOutEdgeMap(graph);

  const visited = [nodeMap.get(startId)];
  let currentId = startId;

  for (const [step, choiceIndex] of choiceIndices.entries()) {
    const edges = outEdges.get(currentId) ?? [];

    if (edges.length === 0) {
      // Current node is terminal — stop silently (no more choices to make)
      break;
    }

    if (choiceIndex < 0 || choiceIndex >= edges.length) {
      throw new Error(
        `Step ${step}: choice index ${choiceIndex} is out of range at node ${currentId} ` +
          `(${edges.length} choice(s) available).`
      );
    }

    const edge = edges[choiceIndex];
    const targetId = edge.to;

    if (!nodeMap.has(targetId)) {
      throw new Error(
        `Step ${step}: edge "${edge.id}" points to node ${targetId} which does not exist in the graph.`
      );
    }

    currentId = targetId;
    visited.push(nodeMap.get(currentId));
  }

  return visited;
}

/**
 * Returns a Map from nodeId -> edges sorted by their order field (ascending).
 */
function buildOutEdgeMap(graph) {
  const map = new Map();
  for (const node of graph.nodes) {
    map.set(node.id, []);
  }
  for (const edge of graph.edges) {
    const list = map.get(edge.from);
    if (list) list.push(edge);
  }
  // Sort each list by order (falling back to insertion order for ties)
  for (const [, list] of map) {
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  return map;
}
