# Story Graph JSON Schema (MVP v0.1)

## Purpose

Defines the canonical graph JSON representation derived from story fragments for validation, visualization, and traversal.

## Relationship To Fragment Schema

- Source data comes from fragments defined in docs/story-fragment-schema.md.
- Each fragment maps to one graph node.
- Each choice maps to one directed graph edge.

## Top-Level Graph Object

### Required Fields

- `graphId` (string)
- Identifier for this graph snapshot.

- `version` (string)
- Schema version, for example `"0.1"`.

- `startNodeId` (integer)
- Default reader entry node.

- `nodes` (array of node objects)
- All nodes in the graph.

- `edges` (array of edge objects)
- All directed edges in the graph.

- `metadata` (object)
- Generation and summary info.

## Node Object

### Required Fields

- `id` (integer)
- Unique node id.

- `label` (string)
- Short display label, usually based on fragment id or title.

- `isTerminal` (boolean)
- True when the node has no outgoing edges.

### Optional Fields

- `title` (string)
- Optional node title for UI display.

- `textPreview` (string)
- Optional short excerpt for tooltips.

## Edge Object

### Required Fields

- `id` (string)
- Unique edge id, for example `"2->10#0"`.

- `from` (integer)
- Source node id.

- `to` (integer)
- Target node id.

- `choiceText` (string)
- Reader-facing choice text that created this edge.

### Optional Fields

- `order` (integer)
- Display or traversal order among sibling choices.

- `type` (string)
- Edge classification. MVP values: `"choice"` and `"continuation"`.

## Metadata Object

### Required Fields

- `nodeCount` (integer)
- Number of nodes.

- `edgeCount` (integer)
- Number of edges.

- `terminalNodeIds` (array of integers)
- Node ids where `isTerminal` is true.

- `generatedAt` (string, ISO 8601)
- Graph generation timestamp in UTC.

### Optional Fields

- `sourceDataset` (string)
- Dataset label such as `"cot-pages-ocr-v2"`.

- `notes` (string)
- Human-readable notes about generation assumptions.

## Validation Rules (MVP)

- `nodes[*].id` values are unique.
- `edges[*].id` values are unique.
- Every `edges[*].from` and `edges[*].to` must exist in `nodes`.
- A node marked `isTerminal: true` must have zero outgoing edges.
- A node with zero outgoing edges must be listed in `metadata.terminalNodeIds`.
- `metadata.nodeCount` must equal `nodes.length`.
- `metadata.edgeCount` must equal `edges.length`.
- `startNodeId` must exist in `nodes`.

## Valid Example

```json
{
  "graphId": "cot-mvp-snapshot-001",
  "version": "0.1",
  "startNodeId": 2,
  "nodes": [
    {
      "id": 2,
      "label": "Page 2",
      "isTerminal": false,
      "title": "Snake Canyon Entrance"
    },
    {
      "id": 10,
      "label": "Page 10",
      "isTerminal": true
    }
  ],
  "edges": [
    {
      "id": "2->10#0",
      "from": 2,
      "to": 10,
      "choiceText": "Enter the cave.",
      "order": 0,
      "type": "choice"
    }
  ],
  "metadata": {
    "nodeCount": 2,
    "edgeCount": 1,
    "terminalNodeIds": [10],
    "generatedAt": "2026-04-14T19:00:00Z",
    "sourceDataset": "cot-pages-ocr-v2"
  }
}
```

## Invalid Example

```json
{
  "graphId": "bad-graph",
  "version": "0.1",
  "startNodeId": 99,
  "nodes": [
    {
      "id": 2,
      "label": "Page 2",
      "isTerminal": true
    }
  ],
  "edges": [
    {
      "id": "2->10#0",
      "from": 2,
      "to": 10,
      "choiceText": "Enter the cave."
    }
  ],
  "metadata": {
    "nodeCount": 1,
    "edgeCount": 2,
    "terminalNodeIds": [],
    "generatedAt": "not-a-date"
  }
}
```

Why invalid:

- `startNodeId` (99) is not in `nodes`.
- Edge target `to` (10) is missing from `nodes`.
- Node `2` is marked terminal but has an outgoing edge.
- `metadata.edgeCount` does not match actual edge count.
- `metadata.terminalNodeIds` does not include terminal node `2`.
- `metadata.generatedAt` is not a valid ISO 8601 timestamp.
