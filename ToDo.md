# ToDo: Supervised Implementation Queue

## Status Key

- [ ] Not started
- [~] In progress
- [x] Done

## P0 Foundation Tasks

- [x] P0-01 Define story fragment JSON schema in a new spec doc.
  - Acceptance criteria: Required fields documented (id, text, choices, metadata), one valid example and one invalid example.

- [x] P0-02 Define graph JSON schema derived from fragments.
  - Acceptance criteria: Node and edge format documented, terminal node representation documented.

- [x] P0-03 Decide canonical project structure for web app folders.
  - Acceptance criteria: Folder layout documented (app, data, docs), rationale noted.

- [x] P0-04 Create minimal seed dataset from existing output for web MVP.
  - Acceptance criteria: At least one small curated story subset exported to structured JSON.

## P1 Core Logic Tasks

- [x] P1-01 Implement fragment loader for the seed JSON format.
  - File: app/js/services/fragmentLoader.js
  - Acceptance criteria: Validates required fields, returns structured in-memory model with error reporting.

- [x] P1-02 Implement graph builder from fragment model.
  - File: app/js/services/graphBuilder.js
  - Acceptance criteria: Produces deterministic node/edge output, marks terminal fragments, marks main trunk, exports Mermaid.

- [x] P1-03 Implement validation checks (dangling links, unreachable nodes, cycle report).
  - File: app/js/services/validator.js
  - Acceptance criteria: Validation output contains issue type, source id, severity, and human-readable message.

- [x] P1-04 Implement traversal engine for interactive reader mode.
  - File: app/js/services/traversalEngine.js
  - Acceptance criteria: Given a start id and choice index sequence, returns visited nodes in order; handles cycles and depth limit.

## P1 UI Tasks (Authoring-first)

- [x] P1-05 Build basic author editor form (fragment text + choices).
  - File: app/js/components/authorEditor.js
  - Acceptance criteria: User can create/update/delete one fragment in local data store with full choice management.

- [x] P1-06 Build basic graph view panel.
  - File: app/js/components/graphView.js
  - Acceptance criteria: D3 force-directed graph renders current fragments; zoom/pan/drag; terminal/trunk/start nodes colored differently; click to edit.

- [x] P1-07 Build basic reader panel.
  - File: app/js/components/readerPanel.js
  - Acceptance criteria: User can start at any node, progress by clicking choices, see reading history, restart at any time.

- [x] P1-08 Show validation warnings in UI.
  - File: app/js/components/validationPanel.js
  - Acceptance criteria: Dangling links shown as blocking errors; unreachable nodes and cycles shown as warnings. Badge visible in nav.

## P2 Output and Tooling Tasks

- [x] P2-01 Add export of current graph to Mermaid.
  - Acceptance criteria: Export button generates a .mmd file matching current graph state.

- [x] P2-02 Add export of fragments to JSON.
  - Acceptance criteria: Export button writes fragment array JSON that can be re-imported.

- [x] P2-03 Add export of graph JSON.
  - Acceptance criteria: Export writes structured graph JSON with nodes, edges, and terminal metadata.

- [ ] P2-04 Add smoke tests for loader, graph builder, and traversal.
  - Acceptance criteria: Automated run covers happy-path and at least one invalid dataset case.

## P3 Deployment and Polish Tasks

- [x] P3-01 Configure GitHub Pages deployment via GitHub Actions.
  - File: .github/workflows/deploy.yml
  - Acceptance criteria: Push to main triggers deploy; app/ folder served as web root.

- [ ] P3-02 Update README.md with deployed URL (fill in after first deploy).
  - Acceptance criteria: README includes deployed URL and repo URL.

- [ ] P3-03 Make all team members contributors on GitHub.
  - Acceptance criteria: Each person has at least one commit on the main branch.

- [ ] P3-04 Verify deployed site loads seed data and all four tabs work.
  - Acceptance criteria: Manual smoke test on the deployed GitHub Pages URL.

## Extension Tasks (Post-MVP)

- [ ] EXT-01 Add AI-assisted story suggestion panel.
  - When: After MVP is stable. Approach: Call an LLM API to suggest next fragment ideas.

- [ ] EXT-02 Add import from .mmd Mermaid file.

- [ ] EXT-03 Add full story export as readable HTML.

- [ ] EXT-04 Implement character/item state tracking for conditional choices.

## Documentation Tasks

- [x] DOC-01 Update Codebase.md with changed files and behavior deltas.
- [ ] DOC-02 Write AI-Instructions.md entry for this session.
  - Acceptance criteria: Date-stamped, describes what was asked and what AI did.
