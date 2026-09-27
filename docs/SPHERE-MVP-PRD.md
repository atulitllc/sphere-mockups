# SPHERE MVP — Product Requirements (living document)

## Decisions: Mock Shell → Tracker demo flow (flow1, Sep 2026)

These are durable product decisions from the client demo flow. The mockups are front-end only; demo state lives in browser `localStorage` (key `sphere-demo-flow-v1`). To reset it, open any page with `?reset=1` or use **Admin → Reset demo data**.

### 1. Mock Shells: content, metadata and autosave
- Every shell follows CDISC / ICH E3 conventions. Each has an output ID (`Table 14.x.x`, `Figure …`, `Listing …`), a title, a population subtitle (Safety / ITT / mITT / PP) and treatment-arm columns with `N=xx` (Placebo, Drug X 10 mg, Total). Rows hold placeholder cells (`xx (xx.x)`, `xx.x (xx.xx)`, median, min–max), followed by footnotes and a `Source: … Program: …` line.
- Figure shells show axis, legend and number-at-risk placeholders. Listing shells show column headers plus a few placeholder rows.
- New shells (**+ Add**) start from a clean, SAP-aware template. They are auto-numbered within their SAP section (14.1.x Demographics, 14.2.x Efficacy, 14.3.x Safety) and start as Draft v0.1.
- **Status dropdown drives the lifecycle** (flow3): a clearly visible, colour-coded **Status** select in the shell header (Draft / In review / Final / Locked). The editor toolbar keeps only **Metadata**, **Copy to study** and **Lock**; Save draft, Save & generate and the Finalize button were removed. Setting Final bumps a pre-1.0 version to v1.0. Edits **autosave** silently to the browser (demo); a neutral version label (e.g. `v1.0 · In Tracker`) sits next to the title.
- **Locked shells** (Lock button or Status = Locked) render muted and read-only: titles, grid and footnotes greyed (≈0.6 opacity, light tint; dark mode too), no editing, row toolbar and + Add Row hidden, and a "Locked" banner with an **Unlock** action (demo: the lead programmer may unlock). The Lock button toggles to Unlock. Unlocking restores the previous status (default Final) and the normal look.
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
- Toolbar styling: no separators, 8px gap, uniform 34px buttons (16px icons, semibold labels). A solid blue fill means only "toggle ON / view active": My Assignments while filtering, Custom Lists while its panel is open (both use `aria-pressed`; the tooltip reads "Custom Lists (showing)"). Action buttons (Import, Export) stay neutral.
- Status column shows only the status pill (no mini progress bar). The 4-step stepper lives in the status popover and in History.
- **Stage chip**: the role chip under the title is highlighted by workflow stage (In dev/Revise → PR, In QC → QC, Stats review → Stats, Released to MW → MW; none for Not started/Approved/Frozen). Other chips stay muted. It updates live on any status change, and the tooltip reads e.g. "Currently with QC · P. Shah".
- **Roles editor**: the row Roles button opens a body-level popover. It flips up or down to whichever side has room, stays inside the viewport, and scrolls its body while the header and Save/Cancel stay fixed. It has a searchable team dropdown for each role (PR takes multiple people; QC, Stats and MW take one each). Save updates the role chips, the My Assignments count and History ("Roles updated by …") and persists in the demo state (cleared by `?reset=1`). The bulk bar has "Assign roles" for the selected rows; empty roles are left unchanged.

### 6. Study home
- The "Create study structure" button (and its modal) is removed from Study home. Folder scaffolding is a tenant/Admin concern (Admin → Study layout).
- Study home shows the study's **Folder path** (linked to File Explorer), plus Compound / Protocol / Deliverable, from the study registry.

### 7. Tenant study layout (revised)
- **Admin → Tenant config → Study layout** offers three radio cards with mini folder-tree previews:
  1. `{protocol}/{subfolders}` — **default**
  2. `{protocol}/{deliverable}/{subfolders}`
  3. `{compound}/{protocol}/{deliverable}/{subfolders}`
- Picking a card marks the page "Unsaved changes"; **Save layout** (next to the cards and at the bottom of the panel) stores the choice per tenant (demo: `localStorage` `sphere-tenant-study-layout`), shows a "Layout saved" toast and a **View in File Explorer →** link. `?reset=1` resets the layout to option 1 and re-seeds the study registry.
- The **standard subfolders** list (default `data/raw, sdtm, adam, programs, tlf, logs, docs`) is editable (add with `/` nesting, rename, remove, reorder, reset) and saved with the layout.
- **Paths are derived, not stored**: every study keeps compound / protocol / deliverable metadata, and its folder path is computed from the saved layout. Saving a new layout immediately re-renders all studies (seeded and user-created) in File Explorer's Studies tree and breadcrumb, the info bar, the Studies list/cards, Study home ("Folder path", layout label) and the New study preview. In layout 1, several deliverables of one protocol share a single protocol folder (Study home lists "Shares folder with").
- **New study** follows the saved layout: Compound (always captured; marked "metadata · not in path" unless layout 3) and Protocol, each pick-existing or "+ New…"; Deliverable is a folder level in layouts 2–3 (existing ones disabled), and in layout 1 the Deliverable Type is kept as metadata. A duplicate path blocks Create. Hint: "Tenant layout: … · change in Admin". Live path + nested tree preview before Create.
- The header breadcrumb and sidebar footer show the study currently opened in File Explorer / Study home (e.g. "PRO-001 · CSR"), and the Study home / File Explorer nav links keep that study.
- Demo seed (metadata): XP-204 / ONC-204-301 / {CSR, DSUR}, XP-204 / ONC-204-302 / CSR, CMP-101 / PRO-001 / {CSR, DSUR}, CMP-101 / PRO-002 / CSR, plus XP-118 / ONC-118-402, XV-302 / VAC-302-011, XH-220 / HEM-220-015 (CSR).

### 8. Shared SAP sections (flow3)
- SAP sections (the TOC groups in Mock Shells and the section groups in the Tracker) are **one shared list** (demo: stored in the demo state, `sphere-demo-flow-v1` → `sections`). Seed: Demographics (SAP §14.1), Efficacy (§14.2), Safety TLFs (§14.3), Labs (§14.3.5), so both pages start identical.
- Mock Shells: **+ New section** at the bottom of the TOC opens a small form with name, optional SAP reference (defaults to the next §14.x) and order. The **⋯** on each section header edits it (rename, change the reference, reorder). A numeric reference drives auto-numbering of new shells in that section (e.g. §14.4 → 14.4.1). Empty sections show "No shells yet — drag a shell here or use + Add". Clicking that line targets **+ Add** at the section, and shells can be dragged between sections or moved with the SAP dropdown.
- Renaming a section updates the shells and Tracker records that use it.
- Tracker: sections follow the shared order and show their SAP reference. A section with no rows shows as an empty group ("No outputs yet") instead of disappearing. **+ New SAP section** under the board writes to the same list. The SAP filter and bulk "Assign SAP…" options come from the list too.
- Shells sent with **+** land in the Tracker section that matches their SAP section.
