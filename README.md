# Choose Your Own Adventure — Authoring Tool

A web-based authoring and reading tool for branching CYOA stories, built as a fork of [pisan382/choose-your-own-adventure](https://github.com/pisan382/choose-your-own-adventure).

## 🌐 Live Site

> **Deployed URL:** `https://kieranmoy.github.io/cyoa_origin/`

## 📂 Repository

> **GitHub Repository:** `https://github.com/KieranMoy/cyoa_origin`

## 👥 Team Members

- Kieran Moynihan (kiemoy@uw.edu)
- Bennett
- Simon Upton

---

## What This Does

The app has four tabs:

- **Author** — Create, edit, and delete story fragments. Each fragment has text, choices that link to other fragments, and metadata. Search fragments, manage choices, set the start node.
- **Story Graph** — Interactive D3.js force-directed graph of all fragments. Nodes are color-coded (green = start, orange = terminal, purple = main trunk, blue = branch). Click a node to jump to its editor. Zoom, pan, drag.
- **Reader** — Interactively read through the story by clicking choices. Tracks your path history. Handles terminal endings, cycles, and depth limits gracefully.
- **Validate** — Checks for dangling links (choices pointing to non-existent fragments), unreachable nodes, and cycles. Errors and warnings appear with badges in the nav.

You can **load** your own fragment JSON and **export** fragments, Mermaid graphs, and graph JSON at any time.

---

## Project Structure

```
.
├── app/                        ← Web application (deployed to GitHub Pages)
│   ├── index.html              ← Entry point
│   ├── css/style.css           ← All styling
│   ├── js/
│   │   ├── app.js              ← Boot, global state, routing, exports
│   │   ├── services/
│   │   │   ├── fragmentLoader.js   ← JSON validation and loading
│   │   │   ├── graphBuilder.js     ← Node/edge graph construction
│   │   │   ├── validator.js        ← Story integrity checks
│   │   │   └── traversalEngine.js  ← Reader traversal engine
│   │   └── components/
│   │       ├── authorEditor.js     ← Author tab UI
│   │       ├── graphView.js        ← D3 graph visualization
│   │       ├── readerPanel.js      ← Reader tab UI
│   │       └── validationPanel.js  ← Validation tab UI
│   └── data/seed/
│       └── cot-minimal-subset.json ← 8-fragment seed story
├── data/                       ← Source data assets
├── docs/                       ← Schema documentation
├── output/                     ← Python pipeline outputs (story graph, OCR pages)
├── scripts/                    ← Python pipeline scripts
├── .github/workflows/
│   └── deploy.yml              ← GitHub Pages auto-deploy on push to main
├── AI-Instructions.md          ← Human-authored AI session log
├── Brainstorm.md               ← Planning and decision log
├── Codebase.md                 ← Architecture and state notes for AI continuity
└── ToDo.md                     ← Implementation task backlog
```

---

## Running Locally

The app is plain HTML/JS with no build step. Just serve the `app/` folder:

```bash
# Python (built-in)
cd app
python3 -m http.server 8080
# then open http://localhost:8080
```

> **Note:** You must use a local server (not open `index.html` directly as `file://`) because ES modules and `fetch()` require HTTP.

---

## Deploying to GitHub Pages

1. Fork this repo.
2. Go to **Settings → Pages → Source** and select **GitHub Actions**.
3. Push to the `main` branch.
4. The workflow in `.github/workflows/deploy.yml` will automatically deploy `app/` to `https://<username>.github.io/<reponame>/`.
5. Update the **Live Site** URL in this README.

---

## Working With Story Data

The seed data lives at `app/data/seed/cot-minimal-subset.json`. It contains 8 fragments from *The Cave of Time*.

To add more fragments from the Python pipeline, see `Codebase.md` for the full commands.

---

## Contributing

Each team member should:

1. Fork this repo (or be added as a collaborator).
2. Create a feature branch for your work.
3. Open a pull request to `main`.
4. Every team member must have at least one commit on the main branch (check `https://github.com/KieranMoy/cyoa_origin/commits/main`).

---

## AI Methodology

This project uses AI-assisted development:

- Human writes intentions into `AI-Instructions.md` (AI does not edit this file).
- AI reads `Codebase.md` to understand current project state before starting work.
- AI reads `ToDo.md` for the task backlog and updates it after completing tasks.
- AI reads `Brainstorm.md` for design decisions and constraints.
- After each session, AI updates `Codebase.md` with what changed.
