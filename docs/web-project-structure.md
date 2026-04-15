# Web Project Structure (MVP v0.1)

## Purpose

Defines the canonical folder layout for the web-based CYOA authoring fork while keeping implementation stack-agnostic.

## Goals

- Separate product-facing application code from story data contracts and generated data.
- Keep graph/story generation bridges isolated from core app code.
- Support incremental evolution from local-only workflow to API-backed workflow.

## Canonical Layout

```text
choose-your-own-adventure/
  app/
    author/
    reader/
    graph/
    shared/
  api/
    routes/
    services/
    validation/
    adapters/
  data/
    seed/
    working/
    generated/
    schemas/
  scripts-bridge/
    graph/
    export/
    import/
  docs/
  output/
  samples/
  scripts/
```

## Folder Responsibilities

### app/

Contains user-facing web application code.

- author/: Authoring features (fragment editor, choice editor, validation panel).
- reader/: Reader experience (start node, choice navigation, current path).
- graph/: Graph rendering and interaction logic (node inspect, highlights, filtering).
- shared/: Shared UI/domain utilities used by multiple app areas.

### api/

Contains API boundary and domain services.

- routes/: Endpoint or handler definitions.
- services/: Core use-cases (build graph, validate dataset, traverse story).
- validation/: Input/output validation logic for requests and payloads.
- adapters/: Integration boundaries (file storage, in-memory store, future DB adapters).

### data/

Contains versioned data assets and schema references.

- seed/: Small curated starter datasets for MVP and tests.
- working/: Editable local datasets used during authoring.
- generated/: Exported graph/story artifacts produced by app workflows.
- schemas/: Canonical JSON contract references for fragments and graph.

### scripts-bridge/

Contains thin bridge scripts that interface with legacy Python scripts where useful.

- graph/: Bridge commands related to graph generation and comparison.
- export/: Bridge commands for story export and Mermaid export.
- import/: Bridge commands for converting OCR/script outputs into web data format.

### Existing Legacy/Reference Directories

- scripts/: Current Python pipeline scripts remain source references and utility tools.
- output/: Current canonical generated assets remain preserved for comparison and validation.
- samples/: Input sample assets, including source PDF.

## Rationale

- app/api/data separation keeps product code maintainable as scope grows.
- scripts-bridge prevents tight coupling between new web architecture and old CLI pipeline.
- data/schemas provides a single contract source for validation and tooling.
- data/generated avoids writing new generated artifacts into output/ during MVP experimentation.

## Non-Goals For This Step

- No framework lock-in.
- No runtime/build tooling decision.
- No immediate migration of legacy scripts.

## Migration Notes

- Existing docs/story-fragment-schema.md and docs/story-graph-schema.md should be treated as source docs and later mirrored under data/schemas/ as machine-consumable JSON Schema if needed.
- Until bridge tooling is implemented, scripts/ remains the canonical executable pipeline.
