/**
 * Graph View — P1-06
 * Renders the story graph as an SVG inside the given container.
 * Re-renders whenever the store changes.
 */

import { store } from '../shared/store.js';

const NODE_W = 110;
const NODE_H = 40;
const H_GAP = 60;
const V_GAP = 80;
const PAD = 30;

/**
 * Mount the graph view into the given container element.
 * @param {HTMLElement} container
 * @param {{ onNodeClick?: (nodeId: number) => void }} [options]
 */
export function mountGraphView(container, options = {}) {
  container.innerHTML = '<div class="graph-panel"><h2>Graph View</h2><div id="svg-wrap"></div></div>';
  const wrap = container.querySelector('#svg-wrap');

  const render = () => {
    const graph = store.graph;
    if (!graph || graph.nodes.length === 0) {
      wrap.innerHTML = '<p class="empty-state">No fragments loaded — add fragments in the editor.</p>';
      return;
    }
    wrap.innerHTML = '';
    wrap.appendChild(buildSVG(graph, options.onNodeClick));
  };

  store.subscribe(render);
  render();
}

// --- layout & SVG ---

function buildSVG(graph, onNodeClick) {
  const positions = computeLayout(graph);
  let maxX = 0, maxY = 0;
  for (const pos of positions.values()) {
    maxX = Math.max(maxX, pos.x + NODE_W);
    maxY = Math.max(maxY, pos.y + NODE_H);
  }
  const svgW = maxX + PAD;
  const svgH = maxY + PAD;

  const svg = svgEl('svg', {
    width: svgW, height: svgH,
    viewBox: `0 0 ${svgW} ${svgH}`,
    class: 'story-graph-svg',
  });

  // Arrowhead marker
  const defs = svgEl('defs');
  const marker = svgEl('marker', {
    id: 'arrow', markerWidth: 8, markerHeight: 8,
    refX: 6, refY: 3, orient: 'auto',
  });
  marker.appendChild(svgEl('path', { d: 'M0,0 L0,6 L8,3 z', fill: '#666' }));
  defs.appendChild(marker);
  svg.appendChild(defs);

  const terminalSet = new Set(graph.metadata.terminalNodeIds);
  const startId = graph.startNodeId;

  // Draw edges first (behind nodes)
  for (const edge of graph.edges) {
    const src = positions.get(edge.from);
    const tgt = positions.get(edge.to);
    if (!src || !tgt) continue;
    svg.appendChild(buildEdge(src, tgt, edge));
  }

  // Draw nodes
  for (const node of graph.nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;
    const g = buildNode(node, pos, terminalSet.has(node.id), node.id === startId, onNodeClick);
    svg.appendChild(g);
  }

  return svg;
}

function buildNode(node, pos, isTerminal, isStart, onNodeClick) {
  const g = svgEl('g', {
    class: ['graph-node',
      isTerminal ? 'terminal' : '',
      isStart ? 'start-node' : '',
    ].filter(Boolean).join(' '),
    transform: `translate(${pos.x},${pos.y})`,
    style: 'cursor:pointer',
  });

  const rect = svgEl('rect', {
    width: NODE_W, height: NODE_H, rx: 6,
    class: 'node-rect',
  });
  g.appendChild(rect);

  const label = svgEl('text', {
    x: NODE_W / 2, y: NODE_H / 2 + 5,
    'text-anchor': 'middle',
    class: 'node-label',
  });
  label.textContent = `#${node.id}${node.title ? ': ' + truncate(node.title, 10) : ''}`;
  g.appendChild(label);

  if (onNodeClick) {
    g.addEventListener('click', () => onNodeClick(node.id));
  }

  const title = svgEl('title');
  title.textContent = `${node.label}${node.title ? ' — ' + node.title : ''}${node.textPreview ? '\n' + node.textPreview : ''}`;
  g.appendChild(title);

  return g;
}

function buildEdge(src, tgt, edge) {
  const x1 = src.x + NODE_W / 2;
  const y1 = src.y + NODE_H;
  const x2 = tgt.x + NODE_W / 2;
  const y2 = tgt.y;

  // Bezier curve
  const cy = (y1 + y2) / 2;
  const d = `M${x1},${y1} C${x1},${cy} ${x2},${cy} ${x2},${y2}`;

  const path = svgEl('path', {
    d,
    class: 'edge-path',
    'marker-end': 'url(#arrow)',
    fill: 'none',
  });

  const g = svgEl('g', { class: 'graph-edge' });
  g.appendChild(path);

  // Edge label (choice text, abbreviated)
  const labelX = (x1 + x2) / 2;
  const labelY = cy - 4;
  const text = svgEl('text', {
    x: labelX, y: labelY,
    'text-anchor': 'middle',
    class: 'edge-label',
  });
  text.textContent = truncate(edge.choiceText, 18);
  g.appendChild(text);

  const title = svgEl('title');
  title.textContent = edge.choiceText;
  g.appendChild(title);

  return g;
}

/**
 * BFS-based layered layout.
 * Returns a Map<nodeId, {x, y}>.
 */
function computeLayout(graph) {
  const startId = graph.startNodeId ?? graph.nodes[0]?.id;
  const nodeIds = graph.nodes.map(n => n.id);

  // Assign layers via BFS from start
  const layer = new Map();
  const queue = [startId];
  layer.set(startId, 0);

  // Build adjacency
  const adj = new Map(nodeIds.map(id => [id, []]));
  for (const edge of graph.edges) {
    adj.get(edge.from)?.push(edge.to);
  }

  while (queue.length > 0) {
    const cur = queue.shift();
    const nextLayer = layer.get(cur) + 1;
    for (const neighbor of adj.get(cur) ?? []) {
      if (!layer.has(neighbor)) {
        layer.set(neighbor, nextLayer);
        queue.push(neighbor);
      }
    }
  }

  // Unreachable nodes get their own layer at the end
  const maxLayer = layer.size > 0 ? Math.max(...layer.values()) : 0;
  let unreachableLayer = maxLayer + 1;
  for (const id of nodeIds) {
    if (!layer.has(id)) {
      layer.set(id, unreachableLayer++);
    }
  }

  // Group by layer
  const layerGroups = new Map();
  for (const [id, l] of layer) {
    if (!layerGroups.has(l)) layerGroups.set(l, []);
    layerGroups.get(l).push(id);
  }

  // Assign positions
  const positions = new Map();
  for (const [l, ids] of layerGroups) {
    const totalW = ids.length * NODE_W + (ids.length - 1) * H_GAP;
    let x = PAD + (ids.length > 1 ? 0 : 0); // start from pad
    // Center in a reasonable canvas — simple approach: just space them
    for (const [i, id] of ids.entries()) {
      positions.set(id, {
        x: PAD + i * (NODE_W + H_GAP),
        y: PAD + l * (NODE_H + V_GAP),
      });
    }
  }

  return positions;
}

// --- helpers ---

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function truncate(str, maxLen) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
