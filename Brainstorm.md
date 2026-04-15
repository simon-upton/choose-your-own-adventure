# Brainstorm: CYOA Authoring Tool Fork

## Working Agreement

- We will not jump into broad feature work without a scoped task.
- We will implement one approved task at a time.
- After each implemented task, we will update Codebase.md.

## Product Direction (From Fork Instructions)

- Primary goal: web-based authoring tool for branching CYOA stories.
- Secondary goal: web-based reader flow.
- Seed dataset/reference behavior: The Cave of Time extracted pages, graph, and bounded story outputs.

## Canonical Inputs and Behaviors To Preserve

- Canonical page text source: output/cot-pages-ocr-v2.
- Graph behavior: explicit "turn to page X" links plus sequential continuation before first explicit choice.
- Story generation guardrails: bounded decision depth, cycle stop, deterministic traversal rules.

## MVP Boundary (Cycle 1)

- In scope:
- Create/edit story fragments (text + choices).
- Validate links between fragments (no dangling targets).
- Generate and view graph from current fragments.
- Read story interactively from chosen start fragment.
- Out of scope:
- Multi-user collaboration.
- Advanced auth roles.
- Rich text editing.
- AI-assisted writing.

## Decision Log

### Decision 1: Delivery Priority

- Choice: Authoring-first.
- Rationale: The fork objective emphasizes reducing branching-management pain for authors.
- Impact: Reader UI is implemented early but kept minimal.

### Decision 2: Stack Commitment

- Choice: Keep stack-agnostic during planning.
- Rationale: Avoid premature lock-in before data model and API boundary are clear.
- Impact: We define interfaces first; framework selection can follow.

### Decision 3: Task Granularity

- Choice: Fine-grained tasks with acceptance criteria.
- Rationale: Better supervision, easier review, lower rework risk.
- Impact: ToDo.md will use small tasks (roughly 0.5 to 2 hours each).

## Key Design Questions and Candidate Options

### 1) Story Data Model

- Option A: Node-centric model (fragment id, body, choices[] of target ids).
- Option B: Page-number-centric model (integer page id, body, choices[] of page numbers).
- Recommendation: Start with integer page-style ids for compatibility with current scripts; keep field naming generic for later migration.

### 2) Graph Persistence Format

- Option A: Mermaid as the only graph representation.
- Option B: JSON graph as source of truth + Mermaid as derived export.
- Recommendation: Option B. JSON is better for validation and API usage.

### 3) Validation Scope For MVP

- Option A: Basic link validation only.
- Option B: Link validation + unreachable node detection + cycle reporting.
- Recommendation: Option B (all read-only diagnostics, no hard blocks except dangling links).

### 4) Reader Flow For MVP

- Option A: Dynamic reader (click choices, navigate node-by-node).
- Option B: Pre-generated full-path story pages only.
- Recommendation: Option A, with optional export later.

### 5) Authoring UI Shape For MVP

- Option A: Form-based editor + graph panel.
- Option B: Graph-first canvas editing.
- Recommendation: Option A first for speed and predictable scope.

## Risks

- OCR noise may leak into seed data and confuse validation.
- Early schema mistakes can ripple into API and UI.
- Graph rendering complexity can cause scope creep.

## Mitigations

- Keep seed content editable and decoupled from OCR pipeline.
- Freeze a minimal schema before building UI.
- Start with basic graph rendering and add interaction incrementally.

## Exit Criteria For Planning Phase

- Decision log approved.
- MVP scope approved.
- Initial implementation backlog approved in ToDo.md.
