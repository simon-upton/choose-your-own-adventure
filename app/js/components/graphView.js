/**
 * graphView.js
 * D3.js force-directed graph visualization for story fragments.
 */

import { buildGraph } from '../services/graphBuilder.js';

let _state = null;
let _simulation = null;

export function initGraphView(state) {
  _state = state;
}

export function renderGraph() {
  const container = document.getElementById('graph-svg-container');
  if (!container) return;

  container.innerHTML = ''; // clear

  const { fragments, startId } = _state;
  if (fragments.length === 0) {
    container.innerHTML = `<div class="empty-state" style="color:#aaa;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;">
      <div style="font-size:3rem;opacity:0.5">🗺️</div>
      <div style="font-size:1rem;font-weight:600">No fragments to graph</div>
      <div style="font-size:0.8rem">Add fragments in the Author tab first.</div>
    </div>`;
    return;
  }

  const { nodes, edges } = buildGraph(fragments, startId);
  renderD3Graph(container, nodes, edges);
}

function renderD3Graph(container, nodes, edges) {
  const W = container.clientWidth || 800;
  const H = container.clientHeight || 560;

  const nodesArr = Array.from(nodes.values());
  const edgesArr = edges.filter(e => e.valid);

  // Create SVG
  const svg = d3.select(container)
    .append('svg')
    .attr('width', W)
    .attr('height', H);

  // Define arrowhead marker
  const defs = svg.append('defs');
  const markerColors = {
    default: '#74b9ff',
    trunk: '#a29bfe',
    dangling: '#e17055',
  };

  Object.entries(markerColors).forEach(([key, color]) => {
    defs.append('marker')
      .attr('id', `arrow-${key}`)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', color);
  });

  // Zoom/pan group
  const g = svg.append('g').attr('class', 'graph-group');

  svg.call(d3.zoom()
    .scaleExtent([0.15, 3])
    .on('zoom', e => g.attr('transform', e.transform)));

  // Build link set for D3
  const d3Links = edgesArr.map(e => ({
    source: e.source,
    target: e.target,
    label: e.label,
    isTrunk: (() => {
      const srcNode = nodes.get(e.source);
      const tgtNode = nodes.get(e.target);
      return srcNode?.isMainTrunk && tgtNode?.isMainTrunk;
    })(),
  }));

  const d3Nodes = nodesArr.map(n => ({ ...n }));

  // Force simulation
  _simulation = d3.forceSimulation(d3Nodes)
    .force('link', d3.forceLink(d3Links).id(d => d.id).distance(130).strength(0.7))
    .force('charge', d3.forceManyBody().strength(-500))
    .force('center', d3.forceCenter(W / 2, H / 2))
    .force('collision', d3.forceCollide(50));

  // Draw edges
  const link = g.append('g').attr('class', 'links')
    .selectAll('line')
    .data(d3Links)
    .join('line')
    .attr('stroke', d => d.isTrunk ? '#a29bfe' : '#4a5568')
    .attr('stroke-width', d => d.isTrunk ? 2.5 : 1.5)
    .attr('stroke-opacity', 0.8)
    .attr('marker-end', d => `url(#arrow-${d.isTrunk ? 'trunk' : 'default'})`);

  // Draw nodes
  const nodeGroup = g.append('g').attr('class', 'nodes')
    .selectAll('g')
    .data(d3Nodes)
    .join('g')
    .attr('class', 'node-g')
    .call(d3.drag()
      .on('start', dragStart)
      .on('drag', dragged)
      .on('end', dragEnd));

  // Node circles
  nodeGroup.append('circle')
    .attr('r', d => d.isStart ? 22 : d.isTerminal ? 18 : 20)
    .attr('fill', d => {
      if (d.isStart) return '#00b894';
      if (d.isTerminal) return '#e17055';
      if (d.isMainTrunk) return '#6c5ce7';
      return '#74b9ff';
    })
    .attr('stroke', '#1a1a2e')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer');

  // Node ID labels
  nodeGroup.append('text')
    .text(d => d.id)
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')
    .attr('fill', 'white')
    .attr('font-size', 11)
    .attr('font-weight', '700')
    .style('pointer-events', 'none');

  // Node title labels (below circle)
  nodeGroup.append('text')
    .text(d => truncate(d.title, 18))
    .attr('text-anchor', 'middle')
    .attr('dy', d => (d.isStart ? 34 : d.isTerminal ? 30 : 32))
    .attr('fill', '#e0e0f0')
    .attr('font-size', 9)
    .style('pointer-events', 'none');

  // Tooltip
  const tooltip = d3.select(container).append('div').attr('class', 'node-tooltip');

  nodeGroup
    .on('mouseenter', (event, d) => {
      const choiceLines = _state.fragments.find(f => f.id === d.id)?.choices
        .map(c => `→ ${c.targetId}: ${truncate(c.text, 40)}`)
        .join('<br>') || 'Terminal (no choices)';

      tooltip
        .style('display', 'block')
        .style('left', `${event.offsetX + 14}px`)
        .style('top', `${event.offsetY - 10}px`)
        .html(`
          <strong>Fragment ${d.id}</strong><br>
          <em>${escapeHtml(d.title)}</em><br><br>
          ${choiceLines}
          ${d.isStart ? '<br><br>▶ <strong>Start node</strong>' : ''}
          ${d.isTerminal ? '<br><br>⏹ <strong>Terminal node</strong>' : ''}
        `);
    })
    .on('mousemove', event => {
      tooltip
        .style('left', `${event.offsetX + 14}px`)
        .style('top', `${event.offsetY - 10}px`);
    })
    .on('mouseleave', () => {
      tooltip.style('display', 'none');
    })
    .on('click', (event, d) => {
      // Switch to author tab and select fragment
      _state.selectedFragmentId = d.id;
      document.querySelector('[data-panel="author"]')?.click();
    });

  // Simulation tick
  _simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Drag handlers
  function dragStart(event, d) {
    if (!event.active) _simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  function dragEnd(event, d) {
    if (!event.active) _simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
}

// ===== HELPERS =====
function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '…' : str;
}
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
