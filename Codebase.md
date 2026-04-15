# Codebase Notes

## Purpose

This workspace extracts text from the scanned PDF of The Cave of Time, builds a story graph from the extracted pages, writes all possible bounded story paths, renders the graph as SVG, and provides a web-based authoring and reading tool for CYOA stories.

---

## Canonical Source Of Truth

The canonical extracted page set is:

- output/cot-pages-ocr-v2

Do not use the older cot-pages extraction workflow. It had bad OCR and was removed.

---

## Important PDF Mapping

The scan is a two-page spread layout.

Story start mapping:

- PDF page 8 contains story page 2 on the left and story page 3 on the right
- PDF page 9 contains story page 4 on the left and story page 5 on the right

The story begins on story page 2 with "You've hiked through Snake Canyon once before ..."

Do not confuse story page numbers with PDF page numbers.

---

## Python Pipeline Scripts (original)

Canonical scripts in scripts/:

- reextract_cot_ocr_split.py
- build_story_graph.py
- write_all_stories.py
- render_story_graph_svg.py

These produce:

- output/cot-pages-ocr-v2 — corrected OCR text per page
- output/cot-story-graph.mmd — Mermaid graph
- output/cot-story-graph.svg — rendered SVG
- output/cot-stories — 45 bounded story paths

Typical commands are in the original README section at the bottom of this file.

---

## Web Application (added April 2026)

### Overview

A single-page vanilla JS web app (no build step) using ES modules and D3.js for graph visualization. Deploys to GitHub Pages via GitHub Actions.

### Entry Point

- app/index.html — loads CSS, D3.js from CDN, and app/js/app.js as ES module

### Technology Choices

- Vanilla HTML/CSS/JavaScript with ES modules (no framework, no bundler)
- D3.js v7 via CDN (cdnjs.cloudflare.com) for force-directed graph
- GitHub Actions (.github/workflows/deploy.yml) for automatic GitHub Pages deployment
- No npm, no build step: push to main and it deploys automatically

### App Folder Structure

```
app/
  index.html               — single-page app shell with four tab panels
  css/
    style.css              — all styling, CSS variables, responsive grid
  js/
    app.js                 — boot, global state, tab routing, file load/export
    services/
      fragmentLoader.js    — validates and loads fragment JSON
      graphBuilder.js      — builds node/edge graph, marks trunk, exports Mermaid/JSON
      validator.js         — dangling links, unreachable nodes, cycle detection
      traversalEngine.js   — interactive reader traversal (session-based)
    components/
      authorEditor.js      — fragment list, editor form, choice management
      graphView.js         — D3 force-directed graph with zoom/pan/drag
      readerPanel.js       — interactive story reader with choice buttons and history
      validationPanel.js   — issue list display with error/warning badges
  data/
    seed/
      cot-minimal-subset.json  — 8 curated fragments from CoT (seed dataset)
```

### Global State (in app.js)

```js
{
  fragments: [],          // array of validated fragment objects
  startId: null,          // id of the start fragment
  selectedFragmentId: null, // currently selected in author editor
  dirty: false,           // unsaved changes flag
  currentTab: 'author',   // active panel
  onDataChange: fn,       // called whenever fragments/startId changes
}
```

### Tab Panels

- Author: fragment list (searchable), editor form with choice management, stats row
- Graph: D3 force-directed graph; nodes colored by type (start=green, terminal=orange, trunk=purple, default=blue); click node to jump to author editor
- Reader: pick start node, click choices, see path history; handles terminal, cycle, and depth-limit endings
- Validation: dangling link errors, unreachable node warnings, cycle warnings; badge in nav header

### Data Flow

1. On boot, app.js fetches data/seed/cot-minimal-subset.json via loadFromUrl()
2. fragmentLoader.js validates the JSON and returns { fragments, errors }
3. Global state is set and the active tab renders
4. Any edit in authorEditor triggers onDataChange(), which re-renders the current tab
5. graphBuilder.buildGraph() is called fresh on each graph render
6. Export buttons write Blob downloads (JSON, Mermaid .mmd, graph JSON)

### Deployment

Push to main branch. GitHub Actions reads .github/workflows/deploy.yml and deploys app/ to GitHub Pages.

Required one-time setup: Settings → Pages → Source: GitHub Actions.

To test locally: cd app && python3 -m http.server 8080, then open http://localhost:8080.

---

## Caveats

- The app uses fetch() to load the seed JSON. Must be served via HTTP, not file://.
- ES modules require a server context.
- OCR is improved but not perfect.

---

## Next-Time Guidance

When resuming work on the Python pipeline:

1. Read this file first.
2. Treat output/cot-pages-ocr-v2 as the current source text.
3. If extraction quality needs improvement, update reextract_cot_ocr_split.py.
4. If graph or story outputs need regeneration, rerun build_story_graph.py, write_all_stories.py, and render_story_graph_svg.py in that order.

When resuming work on the web app:

1. Read this file first.
2. The app lives entirely in app/ and deploys without any build step.
3. To add fragments, edit app/data/seed/cot-minimal-subset.json or use the Load JSON button.
4. State is entirely in-memory per session. Use the Export buttons to persist edits.

---

## Web Fork Progress

### 2026-04-14 (original planning session)

- Completed P0-01 through P0-04: fragment schema, graph schema, project structure, and seed dataset.

### 2026-04-14 (implementation session — kieran)

- Implemented all P1 tasks: fragmentLoader, graphBuilder, validator, traversalEngine, authorEditor, graphView, readerPanel, validationPanel.
- Implemented all P2 export tasks: JSON, Mermaid, graph JSON downloads.
- Implemented P3-01: GitHub Actions deploy workflow.
- Technology choice: vanilla HTML/CSS/JS with D3.js (no build step).
- Updated Brainstorm.md with Decision 2 (stack) and Decision 6 (D3).
- Updated ToDo.md marking completed tasks.
- New files: app/index.html, app/css/style.css, app/js/app.js, app/js/services/*, app/js/components/*, .github/workflows/deploy.yml.

---

## Original README Commands

### Build Story Graph

```bash
python3 scripts/build_story_graph.py \
  --pages-dir output/cot-pages-ocr-v2 \
  --output output/cot-story-graph.mmd
```

### Generate All Story Variants

```bash
python3 scripts/write_all_stories.py \
  --graph output/cot-story-graph.mmd \
  --pages-dir output/cot-pages-ocr-v2 \
  --output-dir output/cot-stories \
  --start-page 2 \
  --max-decisions 20
```

### Re-Extract From PDF

```bash
python3 scripts/reextract_cot_ocr_split.py \
  --pdf samples/the-cave-of-time.pdf \
  --pdf-start-page 8 \
  --pdf-end-page 66 \
  --story-start-page 2 \
  --output-dir output/cot-pages-ocr-v2
```
