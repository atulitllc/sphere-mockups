# SPHERE MVP — Product Requirements (living document)

## Decisions: Mock Shell → Tracker demo flow (flow1, Sep 2026)

These are durable product decisions from the client demo flow. The mockups are front-end only; demo state lives in browser `localStorage` (key `sphere-demo-flow-v1`). To reset it, open any page with `?reset=1` or use **Admin → Reset demo data**.

### 1. Mock Shells: content, metadata and finalize
- Every shell follows CDISC / ICH E3 conventions. Each has an output ID (`Table 14.x.x`, `Figure …`, `Listing …`), a title, a population subtitle (Safety / ITT / mITT / PP) and treatment-arm columns with `N=xx` (Placebo, Drug X 10 mg, Total). Rows hold placeholder cells (`xx (xx.x)`, `xx.x (xx.xx)`, median, min–max), followed by footnotes and a `Source: … Program: …` line.
- Figure shells show axis, legend and number-at-risk placeholders. Listing shells show column headers plus a few placeholder rows.
- New shells (**+ Add**) start from a clean, SAP-aware template. They are auto-numbered within their SAP section (14.1.x Demographics, 14.2.x Efficacy, 14.3.x Safety) and start as Draft v0.1.
- Shell lifecycle: **Draft → In review → Final → Locked**. A **Finalize** action (with a confirm) sets Final and v1.0, and a status badge sits next to the title.
- **Metadata** is enabled for every shell (the tenant module is on by default). It is editable and saved with the shell, and it feeds the Tracker record and the program header. Fields: output ID, title, type, population, analysis datasets, key variables, sort order, footnotes, status, version, and last modified by/at. SAS macro parameters are listed underneath.

### 2. Send to Tracker (sync)
- Each shell in the Mock Shells list has a subtle **+** button labelled "Send to Tracker". It is enabled only when the shell is Final or Locked; otherwise its tooltip reads "Finalize shell first".
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
- All roles are shown inline on every record as compact chips: **PR · QC · Stats · MW**, each with initials or a short name and the full name on hover. The signed-in user's chips are highlighted. The Roles button remains for detail/editing.
- A **My Assignments** toggle in the toolbar shows only records where the signed-in user is Assigned To or holds any role (PR, QC, Stats or MW). It has a count badge, an active state and a one-click clear (×).
- Toolbar buttons show their labels by default (My Assignments, Custom Lists, Import programs, Export CSV).

### 6. Study home
- The "Create study structure" button (and its modal) is removed from Study home. Folder scaffolding is a tenant/Admin concern (Admin → Study layout).
