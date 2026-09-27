# SPHERE MVP — Product Requirements (living document)

## Decisions: Mock Shell → Tracker demo flow (flow1, Sep 2026)

These are durable product decisions from the client demo flow. The mockups are front-end only; demo state lives in browser `localStorage` (key `sphere-demo-flow-v1`). To reset it, open any page with `?reset=1` or use **Admin → Reset demo data**.

### 1. Mock Shells: content, metadata and autosave
- Every shell follows CDISC / ICH E3 conventions. Each has an output ID (`Table 14.x.x`, `Figure …`, `Listing …`), a title, a population subtitle (Safety / ITT / mITT / PP) and treatment-arm columns with `N=xx` (Placebo, Drug X 10 mg, Total). Rows hold placeholder cells (`xx (xx.x)`, `xx.x (xx.xx)`, median, min–max), followed by footnotes and a `Source: … Program: …` line.
- Figure shells show axis, legend and number-at-risk placeholders. Listing shells show column headers plus a few placeholder rows.
- New shells (**+ Add**) start from a clean, SAP-aware template. They are auto-numbered within their SAP section (14.1.x Demographics, 14.2.x Efficacy, 14.3.x Safety) and start as Draft v0.1.
- **Status dropdown drives the lifecycle** (flow3): a clearly visible, colour-coded **Status** select in the shell header (Draft / In review / Final / Locked). The editor toolbar keeps only **Metadata**, **Copy to study** and **Lock**; Save draft, Save & generate and the Finalize button were removed. Setting Final bumps a pre-1.0 version to v1.0. Edits **autosave** silently to the browser (demo); a neutral version label (e.g. `v1.0 · In Tracker`) sits next to the title.
- Demo seed: 14.1.3 Subject disposition and 14.3.7 Vital signs start as **Final** (+ usable immediately); 14.3.0 starts In review.
- The editor pane is sticky-friendly: the TOC list fills the viewport height below the header and stays in view while the editor scrolls (resizes with the window; works at 125% UI zoom; stacks on narrow screens).
- **Metadata** is enabled for every shell (the tenant module is on by default). It is editable and saved with the shell, and it feeds the Tracker record and the program header. Fields: output ID, title, type, population, analysis datasets, key variables, sort order, footnotes, status, version, and last modified by/at. SAS macro parameters are listed underneath.

### 2. Send to Tracker (sync)
- Each shell in the Mock Shells list that isn't in the Tracker yet has a **+** button (26 px, with a larger invisible hit area). It is **enabled only when Status is Final** (or Locked), tooltip "Send to Tracker". Otherwise it shows muted/disabled with the tooltip "Set status to Final to send to Tracker". Changing the Status dropdown enables/disables it immediately; a shell already synced keeps its synced icon whatever its status.
- On click, a brief spinner runs, then the button becomes a **synced** icon (accent colour, tooltip "Synced to Tracker · time"). A toast appears with a **View in Tracker** link.
- Shells that already have Tracker rows show as synced (linked).
- The Tracker record is created in the SAP section that matches the output type. It carries the output ID and title, a program name `t_|f_|l_<number>_<slug>.sas`, SAS as the language, status In dev, and assigned roles. It gets a "New" chip until its first workflow move.

### 3. Programs: generated SAS headers and QC program naming
- Every Tracker record has a production program and a **QC program named `qc-<production program>`**, for example `t_14_3_1_ae.sas` → `qc-t_14_3_1_ae.sas`. Both are shown in the Program cell.
- A standard header is generated automatically: Program, Study/Protocol, Output ID + title, Population, Source datasets, Key variables, Sort order, Output file, Mock shell reference/version, Author, QC programmer, Date, SAS version, and a Modification history table. A stub macro body follows the header.
- The QC program gets a matching header marked **QC / VALIDATION PROGRAM**, with purpose, production-program reference and a PROC COMPARE stub.
- The program name in each row opens the editor, which has **Production / QC** tabs. Production is editable in In dev / Revise. QC is editable through In QC. Other stages open read-only. Every save seals a version and is logged to History.

### 4. Workflow stages
- Stages: **Dev (In dev / Revise) → QC → Stats review → Released to MW** (tenant flags can switch off the Stats and MW stages).
- **Released to MW is the final stage.** It offers no further workflow actions (no Approve and no Return to Revise). Its stepper shows complete, and the row takes a subtle green "Released" state. The legacy Approved/Frozen end state applies only to tenants that switch the MW stage off.
- Clicking the status pill opens a 4-step stepper with the next action: **Send to QC**, **QC passed · send to Stats**, **Stats approved · release to MW**, or **Return to Revise**. Each action has an inline confirm.
- Each move changes the pill colour and records time + user (the role owner for that stage) in History. A toast confirms the move.
- The same actions work on several rows at once from the sticky selection bar.
- History shows the stepper with the date/time of each stage.

### 5. Tracker assignment and roles
- The "Owner" column is renamed **Assigned To** everywhere: the column header, the filter ("All assignees"), the Edit form, tooltips and History.
- **Row layout (flow3):** the first cell holds the output ID + title (+ tags) on line 1 and the role chips directly underneath on line 2 (compact, muted). The production and QC program names live in their own **Programs** column on the right (after Job, before Files/Actions), stacked: program on top, `QC qc-…` muted below; both open the editor. Actions stay pinned on the right when the board scrolls horizontally (large zoom / narrow screens).
- All roles are shown inline on every record as compact chips: **PR · QC · Stats · MW**, each with the role label and a short name (e.g. "PR J. Patel"), no initials avatars; the full name is on hover. At large zoom the chips wrap or truncate names with an ellipsis rather than falling back to initials. The signed-in user's chips are highlighted. The Roles button remains for detail/editing.
- A **My Assignments** toggle in the toolbar shows only records where the signed-in user is Assigned To or holds any role (PR, QC, Stats or MW). It has a count badge, an active state and a one-click clear (×).
- Toolbar buttons show their labels by default (My Assignments, Custom Lists, Import programs, Export CSV).

### 6. Study home
- The "Create study structure" button (and its modal) is removed from Study home. Folder scaffolding is a tenant/Admin concern (Admin → Study layout).
- Study home shows the study's **Folder path** (linked to File Explorer), plus Compound / Protocol / Deliverable, from the study registry.

### 7. Tenant study layout (flow3)
- **Admin → Tenant config → Study layout** offers three radio cards, each with a mini folder-tree preview. The choice is stored per tenant (demo: `localStorage` key `sphere-tenant-study-layout`):
  1. `{compound}/<subfolders>`
  2. `{compound}/{protocol}/<subfolders>`
  3. `{compound}/{protocol}/{deliverable}/<subfolders>` (default)
- The **standard subfolders** list (default `data/raw, sdtm, adam, programs, tlf, logs, docs`) is editable: add (nested names with `/` allowed), rename, remove, reorder, reset. It persists with the layout and drives the card previews and the path preview.
- Changing the layout affects **new** studies only; existing studies keep their paths.
- **New study** (Studies → New study) follows the tenant level. It shows only the fields that level needs (Compound; + Protocol; + Deliverable), each as *pick existing* or *+ New…*. Many protocols per compound and many deliverables per protocol are supported; deliverables that already exist under the chosen protocol are disabled, and a duplicate path blocks Create. A hint reads "Tenant layout: … · change in Admin".
- A live preview shows the resulting path and the nested tenant tree, with the new node and its subfolders highlighted, before Create.
- After Create, the study is added to the study registry (demo: `sphere-study-registry-v1`), appears in the Studies list/cards with its folder path, in **File Explorer** (a Studies tree grouped compound → protocol → deliverable above Folders; `files.html?path=…` switches the root and breadcrumb; new studies show the template subfolders) and in Study home metadata.
- Demo seed: `XP-204/ONC-204-301/{CSR,DSUR}`, `XP-204/ONC-204-302/CSR`, `CMP-101/PRO-001/{CSR,DSUR}`, `CMP-101/PRO-002/CSR`, plus the other listed studies under their compounds.

### 8. Shared SAP sections (flow3)
- SAP sections (the TOC groups in Mock Shells and the section groups in the Tracker) are **one shared list** (demo: stored in the demo state, `sphere-demo-flow-v1` → `sections`). Seed: Demographics (SAP §14.1), Efficacy (§14.2), Safety TLFs (§14.3), Labs (§14.3.5), so both pages start identical.
- Mock Shells: **+ New section** at the bottom of the TOC opens a small form with name, optional SAP reference (defaults to the next §14.x) and order. The **⋯** on each section header edits it (rename, change the reference, reorder). A numeric reference drives auto-numbering of new shells in that section (e.g. §14.4 → 14.4.1). Empty sections show "No shells yet — drag a shell here or use + Add". Clicking that line targets **+ Add** at the section, and shells can be dragged between sections or moved with the SAP dropdown.
- Renaming a section updates the shells and Tracker records that use it.
- Tracker: sections follow the shared order and show their SAP reference. A section with no rows shows as an empty group ("No outputs yet") instead of disappearing. **+ New SAP section** under the board writes to the same list. The SAP filter and bulk "Assign SAP…" options come from the list too.
- Shells sent with **+** land in the Tracker section that matches their SAP section.
