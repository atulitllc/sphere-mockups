# SPHERE mockups (public)

Interactive UI previews for **SPHERE**. White-default chrome with a light/dark theme toggle and a desktop-collapsible left nav (icons-only rail; preference in `localStorage`) on every module.

- **Entry:** `studies.html` — pick a study, then open the in-study workspace
- **Style lock:** `mock-shells.html` (+ `shared-white.css`) — spreadsheet-like shell editor (double-click cells, row indent toolbar, footnotes blocks); **Copy to study…** creates a new Draft in another same-tenant study (layout/title/type/analysis set/footnotes/notes only — never lock/QC/approve or generated Word/RTF); build the React app against this look
- **Modules (all white + toggle):** `studies.html`, `study-home.html`, `mock-shells.html`, `data-hub.html`, `files.html`, `tracker.html`, `define.html`, `publisher.html`, `copilot.html`, `audit.html`, `admin.html`
- **Define** (`define.html`): CDISC Define-XML 2.0/2.1 stub for SDTM/ADaM from study metadata + dataset specs; human review/approve before publish (separate from shell lock and Tracker)
- **Files** (`files.html`): study tree + folder **Manage access** (users/teams, View|Edit; inherits). QC-frozen paths show **Frozen / View only on share** when Tracker Send to QC updates share ACLs
- **Tracker** absorbs Compute run UI in the prototype: row multi-select, **Run selected (R/SAS)**, job stubs, tags, SAP sections, import from study `programs/`; Send to QC also freezes share ACLs (cross-link Files)
- `compute.html` is a redirect/alias note so old links do not 404
- `mock-shells-white.html` is kept as an alias of `mock-shells.html` for older Pages links
- Product PRD / build plan: private repo [`atulitllc/sphere`](https://github.com/atulitllc/sphere)

GitHub Pages: https://atulitllc.github.io/sphere-mockups/

Brand: sidebar uses Remy nav lockup (mark + wordmark; light/dark). Full expansion lockup is docs/marketing only.
