# Codebase Notes

## Purpose

This workspace extracts text from the scanned PDF of The Cave of Time, builds a story graph from the extracted pages, writes all possible bounded story paths, and renders the graph as SVG.

## Canonical Source Of Truth

The canonical extracted page set is:

- output/cot-pages-ocr-v2

Do not use the older cot-pages extraction workflow. It had bad OCR and was removed.

## Important PDF Mapping

The scan is a two-page spread layout.

Story start mapping:

- PDF page 8 contains story page 2 on the left and story page 3 on the right
- PDF page 9 contains story page 4 on the left and story page 5 on the right

The story begins on story page 2 with:

- "You've hiked through Snake Canyon once before ..."

Do not confuse story page numbers with PDF page numbers.

## Current Scripts

Canonical scripts in scripts/:

- reextract_cot_ocr_split.py
- build_story_graph.py
- write_all_stories.py
- render_story_graph_svg.py

Superseded scripts were deleted:

- extract_cot.py
- reextract_cot_spreads.py

## What Each Script Does

### reextract_cot_ocr_split.py

Re-extracts story pages from the PDF using OCR on left/right halves of each PDF spread page.

Typical command:

```bash
python3 scripts/reextract_cot_ocr_split.py \
  --pdf samples/the-cave-of-time.pdf \
  --pdf-start-page 8 \
  --pdf-end-page 66 \
  --story-start-page 2 \
  --output-dir output/cot-pages-ocr-v2
```

### build_story_graph.py

Builds Mermaid graph output from the corrected OCR page files.

Typical command:

```bash
python3 scripts/build_story_graph.py \
  --pages-dir output/cot-pages-ocr-v2 \
  --output output/cot-story-graph.mmd
```

Notes:

- Reads explicit "turn to page X" choices from page text.
- Adds sequential continuation edges for pages that continue onto the next numbered page before any explicit choice appears.

### write_all_stories.py

Writes all possible bounded stories from the graph.

Typical command:

```bash
python3 scripts/write_all_stories.py \
  --graph output/cot-story-graph.mmd \
  --pages-dir output/cot-pages-ocr-v2 \
  --start-page 2 \
  --max-decisions 20 \
  --output-dir output/cot-stories
```

Important behavior:

- Starts from story page 2
- Stops on cycles
- Stops if decision points exceed 20
- Clears old story-\*.txt files in the target output directory before writing new ones

### render_story_graph_svg.py

Renders the Mermaid graph to SVG without external layout tools.

Typical command:

```bash
python3 scripts/render_story_graph_svg.py \
  --graph output/cot-story-graph.mmd \
  --output output/cot-story-graph.svg
```

Current visual behavior:

- Uses a layered Sugiyama-style layout with iterative barycenter ordering
- Colors terminal pages differently
- Highlights the main trunk from page 2

## Current Canonical Outputs

Keep these:

- output/cot-pages-ocr-v2
- output/cot-story-graph.mmd
- output/cot-story-graph.svg
- output/cot-stories

These older directories were deleted because they were exploratory or obsolete:

- output/cot-pages
- output/cot-pages-reextract
- output/cot-stories-from-page-02
- output/cot-stories-start10
- output/tmp

## Current Known State

At the end of this session:

- The corrected OCR v2 extraction produced story pages in output/cot-pages-ocr-v2
- The graph was rebuilt from OCR v2 pages and saved to output/cot-story-graph.mmd
- The bounded story writer generated 45 stories into output/cot-stories
- The graph SVG was rendered to output/cot-story-graph.svg

## Caveats

OCR is improved but not perfect.

- Some pages still have minor OCR noise
- Page continuations across spreads are important; graph construction relies on sequential edges when no explicit choice appears
- Story page numbers, not PDF page numbers, control graph edges and story traversal

## Next-Time Guidance

When resuming work:

1. Read this file first.
2. Treat output/cot-pages-ocr-v2 as the current source text.
3. If extraction quality needs improvement, update reextract_cot_ocr_split.py rather than rebuilding older workflows.
4. If graph or story outputs need regeneration, rerun build_story_graph.py, write_all_stories.py, and render_story_graph_svg.py in that order.

## Web Fork Progress

### 2026-04-14

- Completed P0-01: created a story fragment schema spec for the web authoring fork.
- New file: docs/story-fragment-schema.md
- The spec defines required fields (`id`, `text`, `choices`, `metadata`), validation rules, and valid/invalid JSON examples.
- This is a planning/data-contract step only. No existing scripts or output artifacts were modified.
- Completed P0-02: created a graph JSON schema spec derived from story fragments.
- New file: docs/story-graph-schema.md
- The spec defines node and edge formats, terminal node representation (`isTerminal` plus `metadata.terminalNodeIds`), validation rules, and valid/invalid JSON examples.
- This is also a planning/data-contract step only. No existing scripts or output artifacts were modified.
- Completed P0-03: documented a canonical web app project structure.
- New file: docs/web-project-structure.md
- The structure defines `app`, `api`, `data`, and `scripts-bridge` folders with responsibilities and rationale, while staying stack-agnostic.
- This step is architectural planning only. No existing scripts or output artifacts were modified.
- Completed P0-04: created a minimal seed dataset from the existing OCR output.
- New file: data/seed/cot-minimal-subset.json
- The seed contains 8 fragments (pages 2, 3, 4, 5, 6, 16, 22, 114) extracted and reformatted from output/cot-pages-ocr-v2, forming a small representative branching story.
- Follows the JSON fragment schema defined in docs/story-fragment-schema.md.
- Created data/ folder structure per docs/web-project-structure.md.
