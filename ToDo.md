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
- Acceptance criteria: Folder layout documented (app, data, api, scripts bridge), rationale noted.

- [x] P0-04 Create minimal seed dataset from existing output for web MVP.
- Acceptance criteria: At least one small curated story subset is exported to structured JSON and committed.

## P1 Core Logic Tasks

- [ ] P1-01 Implement fragment loader for the seed JSON format.
- Acceptance criteria: Loader validates required fields and returns structured in-memory model.

- [ ] P1-02 Implement graph builder from fragment model.
- Acceptance criteria: Produces deterministic node/edge output and marks terminal fragments.

- [ ] P1-03 Implement validation checks (dangling links, unreachable nodes, cycle report).
- Acceptance criteria: Validation output contains issue type, source id, and human-readable message.

- [ ] P1-04 Implement traversal engine for interactive reader mode.
- Acceptance criteria: Given a start id and choice index sequence, returns visited nodes in order.

## P1 UI Tasks (Authoring-first)

- [ ] P1-05 Build basic author editor form (fragment text + choices).
- Acceptance criteria: User can create/update one fragment in local data store.

- [ ] P1-06 Build basic graph view panel.
- Acceptance criteria: Graph renders current fragments and updates after save.

- [ ] P1-07 Build basic reader panel.
- Acceptance criteria: User can start at configured node and progress by clicking choices.

- [ ] P1-08 Show validation warnings in UI.
- Acceptance criteria: Dangling links shown as blocking errors; other issues shown as warnings.

## P2 Output and Tooling Tasks

- [ ] P2-01 Add export of current graph to Mermaid.
- Acceptance criteria: Export command generates a .mmd file matching current graph state.

- [ ] P2-02 Add export of bounded stories from current graph.
- Acceptance criteria: Export writes text files and a manifest, with depth/cycle safeguards.

- [ ] P2-03 Add smoke tests for loader, graph builder, and traversal.
- Acceptance criteria: Automated run covers happy-path and at least one invalid dataset case.

## Documentation Tasks (Run After Each Completed Implementation Task)

- [x] DOC-01 Update Codebase.md with changed files and behavior deltas.
- Acceptance criteria: Includes what changed, why, and any new caveats.

## Proposed First Implementation Task

- Candidate: P0-01 Define story fragment JSON schema in a new spec doc.
- Why first: It anchors all later logic and UI contracts while keeping stack-agnostic planning intact.
