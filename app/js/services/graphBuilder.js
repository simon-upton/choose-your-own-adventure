/**
 * graphBuilder.js
 * Builds a node/edge graph representation from story fragments.
 * Follows schema defined in docs/story-graph-schema.md
 */

/**
 * Build graph nodes and edges from a fragment array.
 * @param {Array} fragments - validated fragment objects
 * @param {number} startId - id of the starting fragment
 * @returns {{ nodes: Map, edges: Array }}
 */
export function buildGraph(fragments, startId = null) {
  const nodes = new Map(); // id -> node object
  const edges = [];

  // Build nodes
  for (const frag of fragments) {
    const isTerminal = frag.choices.length === 0;
    nodes.set(frag.id, {
      id: frag.id,
      title: frag.title,
      text: frag.text,
      tags: frag.tags,
      isTerminal,
      isStart: frag.id === startId,
      isMainTrunk: false, // computed below
      reachable: false,   // computed below
    });
  }

  // Build edges
  for (const frag of fragments) {
    for (let i = 0; i < frag.choices.length; i++) {
      const choice = frag.choices[i];
      edges.push({
        source: frag.id,
        target: choice.targetId,
        label: choice.text,
        choiceIndex: i,
        valid: nodes.has(choice.targetId), // dangling if false
      });
    }
  }

  // BFS to mark reachable nodes from startId
  if (startId !== null && nodes.has(startId)) {
    const visited = new Set();
    const queue = [startId];
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      const node = nodes.get(current);
      if (node) node.reachable = true;
      for (const edge of edges) {
        if (edge.source === current && !visited.has(edge.target)) {
          queue.push(edge.target);
        }
      }
    }

    // Mark main trunk: longest path from start to first terminal via DFS
    const trunkNodes = findMainTrunk(startId, nodes, edges);
    for (const id of trunkNodes) {
      const node = nodes.get(id);
      if (node) node.isMainTrunk = true;
    }
  }

  return { nodes, edges };
}

/**
 * Find the "main trunk" — first reachable path from startId following choice[0] at each branch.
 */
function findMainTrunk(startId, nodes, edges) {
  const trunk = [];
  const visited = new Set();
  let current = startId;

  while (current !== null && !visited.has(current)) {
    trunk.push(current);
    visited.add(current);
    const outEdges = edges.filter(e => e.source === current && e.valid);
    if (outEdges.length === 0) break;
    current = outEdges[0].target; // follow first choice
  }

  return trunk;
}

/**
 * Convert the graph to a simple JSON-serializable format.
 */
export function graphToJSON(nodes, edges) {
  return {
    nodes: Array.from(nodes.values()).map(n => ({
      id: n.id,
      title: n.title,
      isTerminal: n.isTerminal,
      isStart: n.isStart,
      isMainTrunk: n.isMainTrunk,
      reachable: n.reachable,
      tags: n.tags,
    })),
    edges: edges.map(e => ({
      source: e.source,
      target: e.target,
      label: e.label,
      valid: e.valid,
    })),
    metadata: {
      terminalNodeIds: Array.from(nodes.values())
        .filter(n => n.isTerminal)
        .map(n => n.id),
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * Export graph to Mermaid format.
 */
export function graphToMermaid(nodes, edges) {
  const lines = ['flowchart TD'];
  for (const node of nodes.values()) {
    const label = node.title.replace(/"/g, "'");
    if (node.isTerminal) {
      lines.push(`  ${node.id}["${node.id}: ${label} ⏹"]`);
    } else if (node.isStart) {
      lines.push(`  ${node.id}(["${node.id}: ${label} ▶"])`);
    } else {
      lines.push(`  ${node.id}["${node.id}: ${label}"]`);
    }
  }
  for (const edge of edges) {
    const label = edge.label.replace(/"/g, "'").substring(0, 30);
    lines.push(`  ${edge.source} -->|"${label}"| ${edge.target}`);
  }
  return lines.join('\n');
}
