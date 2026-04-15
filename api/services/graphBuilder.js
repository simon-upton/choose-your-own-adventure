/**
 * Graph Builder — P1-02
 * Builds a deterministic graph object from a validated fragment array.
 * Output conforms to docs/story-graph-schema.md.
 */

/**
 * @param {Fragment[]} fragments - validated fragment objects from fragmentLoader
 * @param {number} startNodeId - default entry point for reader
 * @param {object} [options]
 * @param {string} [options.graphId]
 * @param {string} [options.version]
 * @param {string} [options.sourceDataset]
 * @returns {Graph} graph object per story-graph-schema.md
 */
export function buildGraph(fragments, startNodeId, options = {}) {
  const { graphId = 'graph-snapshot', version = '0.1', sourceDataset } = options;

  // Sort fragments by id for deterministic output
  const sorted = [...fragments].sort((a, b) => a.id - b.id);

  const nodes = sorted.map(f => {
    const node = {
      id: f.id,
      label: `Page ${f.id}`,
      isTerminal: f.choices.length === 0,
    };
    if (f.title) node.title = f.title;
    if (f.text) {
      node.textPreview = f.text.length > 100 ? f.text.slice(0, 100) + '…' : f.text;
    }
    return node;
  });

  // Build edges — deterministic: sorted by (from, order)
  const edges = [];
  for (const f of sorted) {
    for (const choice of f.choices) {
      edges.push({
        id: `${f.id}->${choice.targetId}#${choice.order}`,
        from: f.id,
        to: choice.targetId,
        choiceText: choice.text,
        order: choice.order,
        type: 'choice',
      });
    }
  }

  const terminalNodeIds = nodes
    .filter(n => n.isTerminal)
    .map(n => n.id)
    .sort((a, b) => a - b);

  const metadata = {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    terminalNodeIds,
    generatedAt: new Date().toISOString(),
  };
  if (sourceDataset) metadata.sourceDataset = sourceDataset;

  return { graphId, version, startNodeId, nodes, edges, metadata };
}
