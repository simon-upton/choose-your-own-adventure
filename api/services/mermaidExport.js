/**
 * mermaidExport.js — P2-01
 * Converts a graph object (from graphBuilder.js) to Mermaid flowchart syntax
 * and triggers a .mmd file download.
 *
 * Usage:
 *   import { graphToMermaid, downloadMermaid } from '../../api/services/mermaidExport.js';
 *   downloadMermaid(store.graph);
 */

/**
 * Convert a graph object to a Mermaid flowchart string.
 * @param {object} graph - graph object from buildGraph()
 * @returns {string} Mermaid flowchart markup
 */
export function graphToMermaid(graph) {
  if (!graph || graph.nodes.length === 0) {
    return 'flowchart TD\n  empty["No fragments loaded"]';
  }

  const lines = ['flowchart TD'];
  const terminalSet = new Set(graph.metadata.terminalNodeIds);

  // Node declarations
  for (const node of graph.nodes) {
    const safeTitle = sanitize(node.title || `Page ${node.id}`);
    const label = `${node.id}: ${safeTitle}`;

    if (node.id === graph.startNodeId) {
      // Start node: stadium shape
      lines.push(`  N${node.id}(["${label} ▶"])`);
    } else if (terminalSet.has(node.id)) {
      // Terminal node: subroutine shape
      lines.push(`  N${node.id}[["${label} ⏹"]]`);
    } else {
      // Regular node: rectangle
      lines.push(`  N${node.id}["${label}"]`);
    }
  }

  lines.push('');

  // Edge declarations
  for (const edge of graph.edges) {
    const choiceLabel = sanitize(truncate(edge.choiceText, 30));
    lines.push(`  N${edge.from} -->|"${choiceLabel}"| N${edge.to}`);
  }

  lines.push('');

  // Style classes
  lines.push('  classDef startNode fill:#d4edda,stroke:#2d9e5f,stroke-width:2px,color:#155724');
  lines.push('  classDef terminalNode fill:#fce8e8,stroke:#d63031,stroke-width:1.5px,color:#721c24');
  lines.push('  classDef defaultNode fill:#e8f0fe,stroke:#4c6ef5,stroke-width:1.5px,color:#1a1a1a');

  // Apply classes
  const startNodes = graph.nodes
    .filter(n => n.id === graph.startNodeId)
    .map(n => `N${n.id}`)
    .join(',');
  const terminalNodes = graph.nodes
    .filter(n => terminalSet.has(n.id))
    .map(n => `N${n.id}`)
    .join(',');
  const defaultNodes = graph.nodes
    .filter(n => n.id !== graph.startNodeId && !terminalSet.has(n.id))
    .map(n => `N${n.id}`)
    .join(',');

  if (startNodes) lines.push(`  class ${startNodes} startNode`);
  if (terminalNodes) lines.push(`  class ${terminalNodes} terminalNode`);
  if (defaultNodes) lines.push(`  class ${defaultNodes} defaultNode`);

  return lines.join('\n');
}

/**
 * Trigger a browser download of the Mermaid graph as a .mmd file.
 * @param {object} graph - graph object from buildGraph()
 * @param {string} [filename]
 */
export function downloadMermaid(graph, filename = 'story-graph.mmd') {
  const content = graphToMermaid(graph);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- helpers ---

function sanitize(str) {
  // Escape double quotes for Mermaid labels
  return String(str || '').replace(/"/g, "'").replace(/[\r\n]+/g, ' ');
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
