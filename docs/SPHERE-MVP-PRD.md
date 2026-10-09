---
title: "SPHERE: Product Requirements Document"
subtitle: "Statistical Programming Hub for Execution and Reporting Environment"
author: "SPHERE"
date: "2026-09-27"
---

# 1. Document control

| Item | Value |
|------|----------------|
| Document | SPHERE Product Requirements Document (PRD) |
| Version | 2.0 |
| Date | 2026-09-27 |
| Status | Current baseline. Replaces the earlier "MVP PRD (living document)". |
| Owner | SPHERE product team |
| Source material | Earlier PRD notes (flow1 to flow3j decisions), every page of the interactive mockups, the mockup repository history (141 commits, 4 to 27 September 2026), and program version control notes |
| Audience | Product, engineering, validation/quality, and early customer reviewers |

## 1.1 Change log

| Version | Date | Author | Summary |
|----|------|----|--------------|
| 0.x | 2026-09-04 to 2026-09-27 | SPHERE | Decisions appended section by section while the mockups evolved (Mock Shell to Tracker flow, study layout, shared SAP sections, roles editor, and more). |
| 2.0 | 2026-09-27 | SPHERE | Consolidated rewrite: one structured PRD covering vision, users, scope, feature requirements with IDs, workflows, permissions, folder model, deployment, non-functional requirements, validation approach, open questions and glossary. |

## 1.2 How to read this document

- **Requirement IDs** look like `PRD-TRK-001`. The middle part names the module (see section 7). IDs are stable: new requirements get new numbers; retired ones are marked "Retired", not reused.
- **Priority**: **MVP** means it must be in the first product a customer can use for real work. **Later** means planned but not in the first release.
- **"Demo"** marks behaviour that exists only in the clickable mockups (for example, storage in the web browser, or simulated program runs). The real product must do the same thing for real.
- Plain language is used on purpose. Technical terms are explained in the glossary (section 16).

# 2. Purpose and vision

## 2.1 Purpose of this document

This PRD describes what SPHERE is, who it is for, what it must do, and how we will know it works. It is the single reference for building the first release and for talking to customers and validation teams. The interactive mockups show the intended look and behaviour; this document states the rules behind them.

## 2.2 What SPHERE is

**SPHERE** (Statistical Programming Hub for Execution and Reporting Environment) is a statistical computing environment for pharmaceutical and biotech companies and the contract research organisations (CROs) that work for them. It gives the people who turn clinical trial data into tables, listings, figures and datasets one controlled place to:

- plan outputs as **mock shells** (empty table layouts agreed with the statistical analysis plan);
- track every program and output through **development, QC, statistical review and release to medical writing**;
- **run SAS and R programs** on the customer's own computing servers and keep the logs;
- keep study folders tidy and consistent across the company;
- produce **Define-XML** and **PDF/Word packages** for submissions and study reports;
- keep a complete, tamper-evident **audit trail** that supports inspections.

## 2.3 Vision

> One governed workspace where a study's outputs go from agreed shell to released result with no spreadsheets, no emailed programs, and no guesswork about who has what.

SPHERE does not replace the customer's SAS or R installations, their file servers, or their clinical data systems. It sits on top of them, inside the customer's own environment, and adds structure, traceability and a modern, accessible interface. Customers can adopt it gradually: start with Mock Shells, add the Tracker, then running programs, Define-XML and packages.

## 2.4 Success measures (first 12 months)

| Measure | Target |
|----------|-----|
| First paying customer live on at least one study | Yes |
| Share of a pilot study's TLFs tracked end to end in SPHERE (shell to released) | 80% or more |
| Time from shell set to Final to Tracker record with program headers | Under 1 minute (today: hours of manual setup) |
| Status meetings/spreadsheets replaced for pilot study | Tracker is the only status source |
| Audit findings attributable to SPHERE in customer audits | Zero critical or major |
| OQ evidence generated automatically per release | 100% of validated requirements covered |

# 3. Target users and personas

SPHERE is built for four groups in biometrics (the part of a pharma company that handles trial data and statistics), plus administrators.

| Persona (demo name) | Role | What they do in SPHERE | What they need most |
|------|-----|--------|------|
| **Jordan Patel**, lead statistical programmer | Statistical programming | Owns a study's programming; assigns work; writes production programs; unlocks shells when needed | One view of all outputs, who owns each, and what stage it is in; fast program setup |
| **Priya Shah**, QC programmer | Statistical programming | Writes independent QC (double) programs; compares results; passes or returns outputs | Clear list of what is waiting for QC; read-only access to production code; one-click "Both" runs (production program, then QC program) |
| **Riley Nguyen / Dana Brooks**, biostatistician | Biostatistics | Agrees shells with the SAP; reviews results; approves release to medical writing | Shells that match the SAP; a simple "Stats approved" step; history of every change |
| **Mei Chen**, reviewer / study lead | Programming or biostatistics lead | Locks shells and datasets after sign-off; watches progress | Reliable locks; progress by SAP section; audit timeline |
| **Avery Lopez**, medical writer | Medical writing | Receives released outputs for the clinical study report (CSR) | Knows exactly which outputs are released and final; PDF/Word packages in the right order |
| **Sam Okonkwo**, data manager | Data management | Brings raw data in (uploads, data cuts, connector pulls) | Controlled landing of data into the study's raw folder with checksums and history |
| **Alex Rivera**, tenant administrator | IT / business administrator | Switches modules on or off, sets sign-in, study folder layout and workflow; manages users and teams | A small, clear set of settings; no custom code per customer |
| Auditor / quality assurance | Quality | Reviews the audit trail and validation evidence | Complete, unchangeable, exportable history |

# 4. Problems solved

| Today (typical company) | With SPHERE |
|-----|-----|
| Mock shells live in Word files; changes after sign-off are hard to spot. | Shells are edited in a structured, spreadsheet-like editor with a Status (Draft, In review, Final, Locked); locked shells cannot be changed. |
| Programming trackers are Excel spreadsheets updated by hand and often out of date. | The Tracker is created from Final shells and updated by the work itself (status moves, runs, role changes). |
| Program headers and QC program names are typed by hand and drift from the shell. | Headers are generated from shell metadata; QC programs are always named `qc-<program>`. |
| Nobody is sure who owns QC or statistical review for an output. | Every row shows its roles (PR, QC, Stats, MW) and highlights who has it now; "My Assignments" shows your work. |
| Each study's folders are organised differently. | A company-wide study folder layout, chosen once by the administrator, is applied to every new study. |
| Running programs means logging on to a server and hunting for logs. | Runs start from the Tracker; a background queue shows progress; logs open in one click. |
| Audit trails are spread across file servers, email and spreadsheets. | One append-only audit trail covers shells, workflow, runs, locks, data loads and assistant suggestions. |
| Cloud tools ask companies to move sensitive trial data to a vendor. | SPHERE is installed in the customer's own environment; data stays under their IT control. |

# 5. Scope

## 5.1 MVP (first release)

| Area | In the MVP |
|---|--------|
| Sign-in and access | Company single sign-on (SSO); role-based access; per-study access |
| Studies | Studies list (list and card views), New study following the company layout, Study home |
| Study layout | Three company layouts; editable standard subfolders; paths derived from study details |
| File Explorer | Studies tree, compact information bar, browse study folders, folder access (View / Edit) |
| Extract data | Manual uploads and data-cut snapshots into the raw folder, with checksums and history |
| Mock Shells | Realistic shell editor, Status dropdown, lock, Metadata panel, shared SAP sections, Copy to study, Send to Tracker |
| Tracker | Records from shells or program import; generated program headers and QC programs; workflow In dev, QC, Stats review, Released to MW; roles; My Assignments; bulk actions; runs of SAS/R with queue and logs; History; custom lists; CSV export |
| Program version control | Local history with restore in editable stages |
| Generate PDF Package | Package locked shells and outputs as PDF and/or Word with a table of contents |
| Define | Define-XML 2.0/2.1 draft generation for SDTM/ADaM with human review before release |
| Copilot | Suggest-only assistant (TLF Assist, Log QC, Mapping Assist as suggestions), every decision audited |
| Admin | Modules, branding, SSO, connectors (settings only), Tracker workflow, version control, users and teams, study layout, compliance, audit |
| Audit | Append-only audit trail, searchable and exportable |
| Accessibility | Font zoom, contrast modes, light/dark mode, accent colours, keyboard use |

## 5.2 Later (planned, not in the MVP)

- Electronic signatures (Part 11 e-signature) on workflow approvals and locks.
- Enterprise GitHub (or other company Git server) as the program history store.
- Live connectors to clinical data systems (for example eClinical Solutions elluminate, Medidata Rave) beyond settings and file-based loads; running programs on SAS hosted inside those systems.
- Automatic population of shells from macro metadata (full "automatable TLF" generation).
- Syncing teams from SSO groups automatically.
- Audit record of Copy to study (source and target): shown as "later release" in the mockups.
- "Apply to existing studies" for a changed folder layout (currently a stub that needs explicit confirmation).
- Split program folders `programs/dev`, `programs/qc`, `programs/prod` beyond the settings stub (single `programs/` is the MVP default).
- Portfolio dashboards across studies.

## 5.3 Out of scope

- Replacing SAS, R, or the customer's file servers. SPHERE uses what the customer already has.
- Hosting customer trial data on SPHERE-run servers.
- Electronic data capture (EDC) or data management review tools.
- Mapping Assist as a full mapping grid (raw to SDTM). Only suggestions via Copilot.
- Medical coding (for example MedDRA dictionary coding).
- Writing the clinical study report text itself.
- Separate code bases per customer. Differences are handled by settings and on/off switches only.

# 6. Product principles

1. **Customer's environment, customer's data.** SPHERE runs where the customer's data already lives and connects to their SAS, R and file systems. We never need a copy of trial data.
2. **One product, configured.** Every customer gets the same build. Differences come from company settings and module switches ("feature flags"), never custom code.
3. **A fixed spine, optional modules.** Sign-in, studies, folder layout and audit trail are always on. Mock Shells, Tracker, File Explorer, Extract data, running programs, PDF packages, Define and Copilot can be switched on or off.
4. **Humans decide; the system records.** Locks, approvals and releases are always done by a person. Copilot can only suggest. Every decision is logged.
5. **Editability follows stage, not check-out.** Programs are editable only in In dev and Revise; everything else is read-only. There is no check-in/check-out.
6. **Generate, do not retype.** Anything that can be derived (program headers, QC names, folder paths, auto-numbers) is generated from the source of truth.
7. **One list, many views.** SAP sections, roles and study details are stored once and shown in every module that needs them.
8. **Plain, accessible interface.** Readable at any zoom, usable in high contrast and by keyboard. Blue fill means "on/active", nothing else.
9. **Gradual adoption.** Each module must be useful alone (for example Mock Shells as a standalone product) and better together.
10. **Frugal until revenue.** No paid tools, services or licences until the first paying customer. Prefer open-source and free tiers; any paid dependency needs an explicit decision.
11. **Do not gold-plate Admin.** Admin holds configuration only; validation kits and questionnaires live outside the product screens.

# 7. Feature requirements by module

Module codes: GEN (shared interface), AUTH (sign-in), STU (Studies and Study home), LAY (study layout), FE (File Explorer), EXT (Extract data), MS (Mock Shells), TRK (Tracker), VC (program version control), PKG (Generate PDF Package), DEF (Define), COP (Copilot), ADM (Admin), AUD (Audit), A11Y (accessibility).

## 7.1 Shared interface (GEN)

**User stories**

- As any user, I want the same navigation on every screen so I always know where I am and which study I am in.
- As a user who works on one study all day, I want the study I opened to stay selected as I move between modules.

**Requirements**

- **PRD-GEN-001** (MVP) Left navigation lists: Studies, Study home, File Explorer, Mock Shells, Tracker, Define, Admin. Only modules switched on for the company are shown. Generate PDF Package and Extract data open from within Tracker and File Explorer, not the main menu.
- **PRD-GEN-002** (MVP) The navigation can collapse to an icon-only rail on desktop; the choice is remembered per user.
- **PRD-GEN-003** (MVP) A breadcrumb in the header (for example "Studies / ONC-204-301 / Tracker") and the navigation footer show the study currently open (for example "PRO-001 · CSR"). Study home and File Explorer links keep that study.
- **PRD-GEN-004** (MVP) Every page has a one-line description. Pages with longer guidance have a note icon that pulls down a note banner; pages without a note have no icon.
- **PRD-GEN-005** (MVP) Company name is shown in the header (for example "X Pharma").
- **PRD-GEN-006** (MVP) Confirmations appear as short "toast" messages, with a link where useful (for example "View in Tracker").
- **PRD-GEN-007** (MVP) Old links to retired pages (Compute) show a short "moved to Tracker" page instead of an error.

**Acceptance criteria**

- Given a module is switched off in Admin, when any user loads any page, then that module does not appear in navigation and its page cannot be opened directly.
- Given I open study PRO-001 · CSR in File Explorer, when I click Study home, then Study home shows PRO-001 · CSR.

## 7.2 Sign-in and access (AUTH)

**User stories**

- As a user, I want to sign in with my company account so I do not manage another password.
- As an administrator, I want access to follow our identity system so leavers lose access automatically.

**Requirements**

- **PRD-AUTH-001** (MVP) Sign-in page with "Continue with company SSO" (SAML 2.0 or OpenID Connect, the two common company sign-in standards) and, where the company allows it, email and password.
- **PRD-AUTH-002** (MVP) The sign-in page shows the active company (tenant) and a link for help ("Need access? Contact your SPHERE admin").
- **PRD-AUTH-003** (MVP) After sign-in the user lands on Studies.
- **PRD-AUTH-004** (MVP) "Keep me signed in" and session time-out follow company policy set by the administrator.
- **PRD-AUTH-005** (MVP) Every sign-in, sign-out and failed sign-in is recorded in the audit trail.
- **PRD-AUTH-006** (Later) Group membership from SSO maps automatically to SPHERE roles and teams.

**Acceptance criteria**

- Given SSO is configured, when a user with a valid company account chooses "Continue with company SSO", then they are signed in without a SPHERE password and land on Studies.
- Given a user's account is disabled in the company identity system, when they try to sign in, then access is refused and the attempt is audited.

## 7.3 Studies and Study home (STU)

**User stories**

- As a programmer, I want to find my study fast and open its workspace.
- As a lead, I want to create a new study that automatically gets our standard folders.
- As anyone on a study, I want a home page that summarises the study and its recent activity.

**Requirements: Studies list**

- **PRD-STU-001** (MVP) Studies list with list and card views, search, and status filter (Active, Startup, Closed).
- **PRD-STU-002** (MVP) Key columns: Protocol, Study name, Deliverable type, Lead programmer, Statistician, first patient first visit (FPFV), last patient last visit (LPLV), database lock, Phase, Status. Cards show the same details plus protocol/SAP version and subject count, with "Open workspace".
- **PRD-STU-003** (MVP) Closed studies open as a read-only archive.

**Requirements: New study**

- **PRD-STU-010** (MVP) "+ New study" opens a form that follows the saved company study layout (see LAY). Fields: study name; Compound and Protocol (each pick existing or "+ New…"); Deliverable (folder level in layouts 2 and 3; existing deliverables for that protocol are disabled); description; deliverable type (Submission, DMC, Custom, CSR, Exploratory, Other); study type (Submission, DMC, Custom); phase; indication; lead programmer; statistician; sponsor; FPFV; LPLV; planned database lock.
- **PRD-STU-011** (MVP) Compound is always captured. When it is not part of the folder path (layouts 1 and 2) it is labelled "metadata · not in path". In layout 1 the deliverable type is kept as metadata only.
- **PRD-STU-012** (MVP) The form shows the layout in use ("Tenant layout: … · change in Admin"), a live folder path, and a tree preview of the folders that will be created (new folders highlighted).
- **PRD-STU-013** (MVP) If the resulting folder already exists, Create is blocked with "This folder already exists: pick another protocol / deliverable". Exception: in layout 1, several deliverables of one protocol intentionally share one folder.
- **PRD-STU-014** (MVP) On Create, the study folder and standard subfolders are created on the customer's file system and the study is added to the study registry. The action is audited.

**Requirements: Study home**

- **PRD-STU-020** (MVP) Study summary: study ID and name, status, phase, design, protocol and SAP versions, sponsor, indication, data cut-off, subjects, lead programmer, lead biostatistician, SAP status, delivery target.
- **PRD-STU-021** (MVP) Study details from the registry: Compound, Protocol, Deliverable, layout label, and **Folder path** (linked to File Explorer). In layout 1, "Shares folder with" lists other deliverables using the same protocol folder.
- **PRD-STU-022** (MVP) Library status tiles for raw, SDTM, ADaM, programs, TLF and logs (for example "SDTM Locked · 42 domains").
- **PRD-STU-023** (MVP) Module tiles for the enabled modules, and a Recent activity feed (latest audited events for the study).
- **PRD-STU-024** (MVP) Study home has no "Create study structure" button; folder set-up belongs to Admin → Study layout and New study.

**Acceptance criteria**

- Given the company uses layout 2, when I create a study with protocol PRO-003 and deliverable CSR, then the folder `PRO-003/CSR/` with all standard subfolders is created and appears in File Explorer and Study home.
- Given `PRO-001/CSR` already exists in layout 2, when I pick PRO-001 and CSR, then Create is disabled with the duplicate message.

## 7.4 Company study layout (LAY)

**User stories**

- As an administrator, I want to choose once how study folders are organised so every study looks the same.
- As a lead, I want to adjust the standard subfolders without breaking existing paths.

**Requirements**

- **PRD-LAY-001** (MVP) Admin → Study layout offers three options as cards with small folder-tree previews:
    1. `{protocol}/{subfolders}`: **default**. One folder per protocol; all deliverables share it.
    2. `{protocol}/{deliverable}/{subfolders}`: separate CSR, DSUR, ISS and so on per protocol.
    3. `{compound}/{protocol}/{deliverable}/{subfolders}`: many protocols per compound and many deliverables per protocol.
- **PRD-LAY-002** (MVP) Choosing a card marks the page "Unsaved changes". "Save layout" (beside the cards and at the bottom) stores the choice for the company, shows "Layout saved" and a "View in File Explorer →" link.
- **PRD-LAY-003** (MVP) Standard subfolders are editable: add (with `/` for nesting, for example `data/raw`), rename, remove, drag to reorder, and "Reset to base". Default list: `data/raw, sdtm, adam, programs, tlf, logs, docs`. Saved together with the layout.
- **PRD-LAY-004** (MVP) **Paths are derived, not stored.** Each study keeps its compound, protocol and deliverable; its folder path is calculated from the saved layout and shown consistently in File Explorer (tree and breadcrumb), the information bar, Studies, Study home and the New study preview.
- **PRD-LAY-005** (MVP) Saving a new layout applies to **new studies**. Moving existing studies' folders requires the separate, explicit "Apply to existing…" action with confirmation (Later; stub in the mockups). In the demo, saving re-renders all studies to show the effect.
- **PRD-LAY-006** (MVP) Default template pack (for example company standard v1.4, ICH E3 core, oncology TLF pack) and default output formats (Word + RTF, Word only, RTF only) are set on the same page.
- **PRD-LAY-007** (MVP) Layout and subfolder changes are audited with before and after values.

**Acceptance criteria**

- Given layout 1 is saved, when I open New study, then only Compound and Protocol affect the path and the preview shows `{protocol}/data/raw … docs`.
- Given I add subfolder `outputs/qc` and save, when I create a new study, then `outputs/qc` exists in the new study's tree; existing studies are unchanged unless "Apply to existing" is confirmed.

## 7.5 File Explorer (FE)

**User stories**

- As a programmer, I want to browse the study folders my programs read from and write to, without logging on to a server.
- As a lead, I want to control who can view or edit each folder.

**Requirements**

- **PRD-FE-001** (MVP) A **Studies tree** on the left lists all studies the user can open, arranged by the company layout (compound → protocol → deliverable as applicable), expanding into the study's subfolders.
- **PRD-FE-002** (MVP) A single **compact information bar** above the file list shows the study (name and path) and the programs folder mode (single `programs/` or `programs/dev`, `programs/qc`, `programs/prod`) with a link to Admin.
- **PRD-FE-003** (MVP) File list with Name, Type, Size, Modified and Share access; path breadcrumb; actions Upload, New folder, Download, Open (according to permissions).
- **PRD-FE-004** (MVP) File Explorer shows the customer's real study folders: the same folders SAS `libname` and R `setwd` statements point to. It is not a second copy of data.
- **PRD-FE-005** (MVP) **Manage access** on any folder (right-click or ⋯): add users or teams with **View** or **Edit**. Permissions pass down to subfolders unless overridden.
- **PRD-FE-006** (MVP) Where a workflow stage makes program files read-only, File Explorer shows them as read-only ("Frozen / View only").
- **PRD-FE-007** (MVP) The Extract data entry point lives in File Explorer on the raw folder.

**Acceptance criteria**

- Given team "QC reviewers" has View on `programs/`, when a member opens a program there, then they can read but not save or delete it.
- Given the layout changes to option 3 and "Apply to existing" has not been run, then existing studies keep their current paths and the tree still finds them.

## 7.6 Extract data (EXT)

**User stories**

- As a data manager, I want to load a data cut or file into the study's raw folder in a controlled, recorded way.

**Requirements**

- **PRD-EXT-001** (MVP) List of loads with source, label, received time, target library, status (Complete, In review, Uploaded, Needs fix, Archived) and a source filter.
- **PRD-EXT-002** (MVP) New load: choose source type (manual upload, snapshot file, EDC export), label and target library (Raw; SDTM only if the company allows). Accepts SAS transport, CSV, Excel and zip packages.
- **PRD-EXT-003** (MVP) Each load records a checksum, user and time, and is audited.
- **PRD-EXT-004** (MVP) Study documents (SAP, annotated CRF, shell templates) are uploaded and listed with the modules that use them.
- **PRD-EXT-005** (Later) Connector pulls from clinical data systems (for example elluminate: choose study, schema and domains such as DM, AE, LB, VS, CM, EX) into Raw. Mockups show this as a demo only.

**Acceptance criteria**

- Given I upload a pharmacokinetic concentration CSV to Raw, then it appears in `raw/` with a checksum and an audit entry "Ingest".

## 7.7 Mock Shells (MS)

**User stories**

- As a biostatistician, I want to draft realistic table, listing and figure shells that follow the SAP so programmers build the right thing.
- As a lead, I want a clear status on every shell and to lock shells after sign-off so they cannot change silently.
- As a programmer, I want a Final shell to create its Tracker record and program headers for me.

**Requirements: shell content**

- **PRD-MS-001** (MVP) Shells follow CDISC and ICH E3 conventions: output ID (for example Table 14.3.1), title, population subtitle (Safety, ITT, mITT, PP), treatment columns with `N=xx` (for example Placebo, Drug X 10 mg, Total), rows with placeholder cells (`xx (xx.x)`, `xx.x (xx.xx)`, median, min to max), footnotes, and a `Source: … Program: …` line.
- **PRD-MS-002** (MVP) Figure shells show axes, legend and number-at-risk placeholders. Listing shells show column headers and placeholder rows.
- **PRD-MS-003** (MVP) Spreadsheet-like editor: double-click to edit cells; add, delete, indent, outdent and move rows; insert and delete columns; group column headers under a parent (up to two levels); right-click menu; footnotes and programming notes blocks; program name as editable text; SAP/aCRF references.
- **PRD-MS-004** (MVP) The shell list (table of contents) shows Number and Title grouped by SAP section, with search and type filter, multi-select, right-click Duplicate/Delete, drag between sections, and a resizable split with the editor. The list fills the window height and stays visible while the editor scrolls; it stacks on narrow screens and works at 125% zoom.
- **PRD-MS-005** (MVP) **+ Add** creates a new shell from a clean, SAP-aware template, auto-numbered in its section (for example 14.1.x Demographics, 14.2.x Efficacy, 14.3.x Safety), starting as Draft v0.1. If a template is not available in the study, the shell is set to Custom with a notice.
- **PRD-MS-006** (MVP) Edits **autosave**. A neutral version label sits next to the title (for example "v1.0 · In Tracker").

**Requirements: status and lock**

- **PRD-MS-010** (MVP) A clearly visible, colour-coded **Status** dropdown in the shell header: **Draft, In review, Final, Locked**. The toolbar keeps only **Metadata**, **Copy to study** and **Lock** (no separate Save draft, Save & generate or Finalize buttons).
- **PRD-MS-011** (MVP) Setting Final raises a version below 1.0 to v1.0.
- **PRD-MS-012** (MVP) **Locked shells** (via Lock or Status = Locked) are greyed out and read-only: title, grid and footnotes muted (in light and dark mode), row toolbar and "+ Add Row" hidden, and a "Locked" banner with **Unlock** for authorised users (lead programmer). Lock toggles to Unlock; unlocking restores the previous status (default Final).
- **PRD-MS-013** (MVP) Shell lock freezes titles, columns and footnotes only. It is separate from program freezing in the Tracker and from Define approval.
- **PRD-MS-014** (MVP) Status changes, locks and unlocks are audited with user, time and optional reason; Copilot can never lock.

**Requirements: metadata**

- **PRD-MS-020** (MVP) **Metadata** panel available on every shell (module on by default; the administrator can switch it off). Editable and saved with the shell. Fields: output ID, title, type, population, analysis datasets, key variables, sort order, footnotes, status, version, last modified by/at, and a table of SAS macro parameters (parameter, value, notes).
- **PRD-MS-021** (MVP) Metadata feeds the Tracker record and the generated program headers.

**Requirements: shared SAP sections**

- **PRD-MS-030** (MVP) SAP sections are **one shared list** for Mock Shells and Tracker (seed: Demographics SAP 14.1, Efficacy 14.2, Safety TLFs 14.3, Labs 14.3.5).
- **PRD-MS-031** (MVP) "+ New section" (bottom of the list) asks for name, optional SAP reference (defaults to the next 14.x) and order. The ⋯ on a section header renames, changes the reference or reorders. A numeric reference drives auto-numbering (14.4 → 14.4.1, 14.4.2…).
- **PRD-MS-032** (MVP) Empty sections show "No shells yet: drag a shell here or use + Add"; clicking that line targets + Add at the section.
- **PRD-MS-033** (MVP) Renaming a section updates every shell and Tracker record that uses it. SAP references are written without "§" (for example "SAP 14.1").

**Requirements: Send to Tracker**

- **PRD-MS-040** (MVP) Each shell not yet in the Tracker has a **+** button in the list, **enabled only when Status is Final** (or Locked), with tooltip "Send to Tracker". Otherwise it is muted with tooltip "Set status to Final to send to Tracker". It updates immediately when the status changes; it has a larger invisible click area.
- **PRD-MS-041** (MVP) Clicking + shows a short spinner, then a **synced icon** (accent colour, tooltip "Synced to Tracker · time") and a toast with "View in Tracker". A synced shell keeps its synced icon whatever its later status.
- **PRD-MS-042** (MVP) The Tracker record is created in the matching SAP section with output ID, title, program name (`t_`, `f_` or `l_` + number + short name + `.sas`), language SAS, status In dev, assigned roles, and a "New" chip until its first workflow move.

**Requirements: Copy to study**

- **PRD-MS-050** (MVP) "Copy to study…" creates a new **Draft** in another study of the same company that the user can open and create in. Copies: layout, title, type, analysis set, footnotes, programming notes, program name as plain text. Never copies: lock, QC or approval state, generated Word/RTF files, programs, or anything across companies. Optional new number and title; SAP/aCRF references cleared by default.
- **PRD-MS-051** (Later) Copy to study records source and target in the audit trail.
- **PRD-MS-052** (MVP) Generate Word/RTF shell documents from templates.

**Acceptance criteria**

- Given a shell in Draft, then its + is disabled with the "Set status to Final" tooltip; when I set Final, then + is enabled at once and the version becomes v1.0.
- Given I click + on a Final shell 14.3.1, then within a few seconds a Tracker record "14.3.1" exists in the Safety section with program `t_14_3_1_ae.sas`, QC program `qc-t_14_3_1_ae.sas`, status In dev, and the shell shows the synced icon.
- Given a shell is Locked, then no cell can be edited, + Add Row is hidden, the content is greyed, and only an authorised user sees Unlock.
- Given I rename section "Labs" to "Laboratory", then the Tracker section and all its records show "Laboratory".

## 7.8 Tracker (TRK)

**User stories**

- As a lead programmer, I want every output, its program, its stage and its people on one board, grouped by SAP section.
- As a QC programmer, I want to see only my assignments and run the production program, then the QC program, in one go.
- As a statistician, I want to approve and release outputs to medical writing with a clear record.
- As a medical writer, I want to know exactly which outputs are released.

**Requirements: records and programs**

- **PRD-TRK-001** (MVP) Records are created from Final shells (MS-040) or by **Import programs**, which lists R and SAS files in the study `programs/` folder and creates records for the ones selected. Records can also be added and edited in an Edit form (title, program file name, type, status, SAP section, shell status, tags, Assigned To).
- **PRD-TRK-002** (MVP) Every record has a production program and a **QC program named `qc-<production program>`** (for example `t_14_3_1_ae.sas` → `qc-t_14_3_1_ae.sas`).
- **PRD-TRK-003** (MVP) An **automatic SAS program header** is generated for both programs: Program, Study/Protocol, Output ID, Title, Population, Source data, Key variables, Sort order, Output file, Mock shell reference and version, Author, QC programmer, Date created, SAS version, and a Modification history table; followed by a starter macro body based on the shell layout. The QC header is marked **QC / VALIDATION PROGRAM** with purpose (independent double programming), production program reference and a PROC COMPARE starter.
- **PRD-TRK-004** (MVP) Clicking the **production program name** opens a viewer scoped to production with tabs **Program · Log · RTF**. Clicking the **QC program name** opens the same pattern for QC. The Program tab keeps edit/view + save (Production editable in In dev and Revise; QC editable up to and including QC; every other stage read-only). Each save creates a version and a History entry. Log reuses the simulated run log; RTF shows TLF output as HTML (datasets and QC note when there is no TLF RTF).

**Requirements: board layout**

- **PRD-TRK-010** (MVP) Records are grouped by **SAP section** (shared list, in shared order, showing the SAP reference), collapsible, each with a count and "Select all". Empty sections show "No outputs yet". "+ New SAP section" under the board writes to the shared list.
- **PRD-TRK-011** (MVP) Row layout: first cell has output ID + title (+ tags) on line 1 and **role chips** on line 2. Columns: **Programs** (production on top, `QC qc-…` muted below; each opens a scoped Program · Log · RTF viewer), Type, Status, **Assigned To**, Shell, Job, Actions. There is no Files column. Actions stay visible on the right when the board scrolls sideways.
- **PRD-TRK-012** (MVP) Status column shows only a colour-coded status pill. Header counters show how many records are in each status.
- **PRD-TRK-013** (MVP) The former "Owner" is called **Assigned To** everywhere (column, filter "All assignees", Edit form, tooltips, History).
- **PRD-TRK-014** (MVP) Filters: search by ID or title, type, status, tag, SAP section, Assigned To. Light zebra striping aids reading of long titles.
- **PRD-TRK-015** (MVP) The **Shell** cell links to Mock Shells when the row has a real shell state (Locked, Draft, Synced, and any other state). The link opens that output's shell (`mock-shells.html?shell=` plus the output ID). Blank and **n/a** stay plain text.

**Requirements: roles**

- **PRD-TRK-020** (MVP) **Role chips** under every title: **PR** (production programmer), **QC**, **Stats**, **MW**, each with the role label and short name (for example "PR J. Patel"); full name on hover; no initials avatars; wrap or shorten with "…" at large zoom. The signed-in user's chips are highlighted.
- **PRD-TRK-021** (MVP) The chip for the **current stage is highlighted** (In dev/Revise → PR, QC → QC, Stats review → Stats, Released to MW → MW; none for Not started, Approved, Frozen). Other chips stay muted. It updates immediately on any status change; tooltip for example "Currently with QC · P. Shah".
- **PRD-TRK-022** (MVP) **Roles popup**: the row's Roles button opens an editor that opens up or down depending on space and stays inside the window, with a searchable team picker per role (PR can hold several people; QC, Stats and MW one each), and fixed Save/Cancel. Save updates chips, the My Assignments count and History ("Roles updated by …").
- **PRD-TRK-023** (MVP) **Bulk Assign roles** from the selection bar applies roles to all selected rows; roles left empty are unchanged.
- **PRD-TRK-024** (MVP) **My Assignments** toggle shows only records where I am Assigned To or hold any role, with a count badge, active state and a one-click clear (×).

**Requirements: workflow**

- **PRD-TRK-030** (MVP) Stages: **Not started → In dev → QC → Stats review → Released to MW**, with **Revise** as the return path. The company can switch off Stats review and/or Released to MW in Admin; production programmer and QC are always in the path.
- **PRD-TRK-031** (MVP) **Released to MW is the final stage**: no further actions, stepper shows complete, row gets a subtle green "Released" look. For companies with the MW stage switched off, the end stage is Approved (and Frozen when frozen).
- **PRD-TRK-032** (MVP) Clicking the status pill opens a 4-step stepper with the next action and an inline confirm: **Send to QC**, **QC passed · send to Stats**, **Stats approved · release to MW**, or **Return to Revise**.
- **PRD-TRK-033** (MVP) Only the person holding the role for the current stage (or a lead) can move a record on. Each move changes the pill colour, records time and user in History, and shows a toast.
- **PRD-TRK-034** (MVP) Send to QC makes production files read-only (and, in split-folder mode, copies them to `programs/qc`). Approval/promotion copies to `programs/prod` in split mode.

**Requirements: toolbar and selection**

- **PRD-TRK-040** (MVP) Toolbar buttons with labels: **My Assignments, Custom Lists, Import programs, Export CSV**. No separators, equal size. **Solid blue means "on/active" only** (My Assignments filtering; Custom Lists panel open), announced to screen readers as pressed. Action buttons stay neutral.
- **PRD-TRK-041** (MVP) Delete and Generate PDF Package icons in the header bar are enabled only when rows are selected.
- **PRD-TRK-042** (MVP) The **sticky selection bar** appears when rows are selected and stays pinned under the header while scrolling. It shows the count and offers: workflow moves (smart: only actions valid for the whole selection), **Run Prod** with a menu (Production programs, QC programs only, Both (Prod then QC)), **Assign roles**, Generate PDF Package, tags, Assign SAP section, Add to list, Clear.
- **PRD-TRK-043** (MVP) **Custom Lists**: named, ordered lists of programs (drag to reorder several at once) used for "Run list" and for the order of PDF packages.
- **PRD-TRK-044** (MVP) Export CSV of the current (filtered) board.

**Requirements: running programs**

- **PRD-TRK-050** (MVP) Run from a row (Execute: Production, QC, or Both) or from the selection bar. Runs go to the customer's own SAS or R servers. (Mockups: simulated runs, "no compute engine attached".)
- **PRD-TRK-051** (MVP) **Both** runs the production program first, then the QC program. The menu label is **Both (Prod then QC)**. Toasts, job text, background-job lines, log tabs, and run summaries use the same order (production, then QC).
- **PRD-TRK-052** (MVP) A **background queue** runs a limited number of programs at once (demo: 3) and queues the rest with their position. Work continues while runs proceed. A Background jobs panel shows running, queued and finished jobs with SAS/R labels and "Clear finished".
- **PRD-TRK-053** (MVP) The Job column shows Queued, Running (with elapsed time), Done, or Done with warnings. Programs already queued or running are not queued twice; rows without a program or in Frozen are skipped with a message ("2 skipped").
- **PRD-TRK-054** (MVP) **Logs** open from the job; the viewer scrolls to the first WARNING or ERROR, wraps long lines, and offers Copy log. Logs are stored in the study `logs/` folder.
- **PRD-TRK-055** (MVP) Every run records program, version, mode, language, user, start and end time, and result in the audit trail.

**Requirements: history**

- **PRD-TRK-060** (MVP) Per-row **History** popup with tabs: **Log** (workflow timeline with stepper and date/time of each stage, role changes, runs) and **Versions** (list of program versions, side-by-side view, difference against current, "Restore as current" in editable stages).
- **PRD-TRK-061** (MVP) Program names open a **scoped artifact viewer** (not an Actions icon). Production name → **Program · Log · RTF** for prod; QC name → the same for QC. Default tab is Program. Title/subtitle name the file and side (Prod vs QC). TLF RTF is rendered as HTML (demo table/listing/figure files ship with the mockup). Dataset rows and the QC RTF tab show a clear empty state when there is no TLF RTF. Logs use the same simulated SAS/R text as the job log. There is no single crowded viewer that dumps prod + QC + output together.

**Acceptance criteria**

- Given a record In dev with PR J. Patel and QC P. Shah, when J. Patel chooses Send to QC and confirms, then the pill shows QC, the QC chip is highlighted with "Currently with QC · P. Shah", production code becomes read-only, and History shows the move with time and user.
- Given record status is Released to MW, when I open the status stepper, then no actions are offered and all four steps show complete.
- Given I select 5 rows and choose Both (Prod then QC), then each production program runs before its QC program; toasts and the live job line say Prod then QC; at most the configured number run at once; the rest show "Queued · n".
- Given a finished run with warnings, when I open its log, then the viewer is scrolled to the first WARNING.
- Given I open artifacts on a table, listing, or figure, then the tabs are the production program, production log, Output (RTF as HTML), QC program, and QC log, in that order.
- Given I open artifacts on a dataset, then Output says there is no TLF RTF, and the production program, production log, QC program, and QC log tabs still open when a program is on the record.
- Given I turn on My Assignments, then the button is solid blue, a count shows, and only my records are listed; × clears it.
- Given I bulk-assign QC = P. Shah to 10 rows with Stats left empty, then all 10 show P. Shah as QC and their Stats roles are unchanged.

## 7.9 Program version control (VC)

**Requirements**

- **PRD-VC-001** (MVP) **Local history** (default): SPHERE keeps snapshots of program files in the customer's environment, taken on save, handoff, restore and promote.
- **PRD-VC-002** (MVP) History and restore are available in In dev and Revise (the only editable stages). The experience is the same whatever the storage.
- **PRD-VC-003** (MVP) Programs folder mode: single `programs/` (default; files stay put and the stage makes them read-only) or split `programs/dev` (editable), `programs/qc` (QC copies), `programs/prod` (approved, read-only).
- **PRD-VC-004** (Later) Company Git server (for example Enterprise GitHub) as storage, with the same History and restore screens. Admin settings stub only in the MVP.

**Acceptance criteria**

- Given a program in Revise with 3 versions, when I restore version 1, then it becomes the current version, a new snapshot is made, and History records the restore.

## 7.10 Generate PDF Package (PKG)

**User stories**

- As a medical writer or lead, I want to bundle locked shells and their outputs into one PDF or Word package with bookmarks.

**Requirements**

- **PRD-PKG-001** (MVP) Opened from the Tracker (header icon or selection bar), not from the main menu.
- **PRD-PKG-002** (MVP) Only **human-locked shells and their outputs** can be included; others show as "not eligible". "Select all locked" and filter.
- **PRD-PKG-003** (MVP) Settings: package name; format (PDF, Word, both); include (shells + outputs, shells only, outputs only); bookmark/TOC style (CSR standard section 14, flat by number, custom outline); cover page and TOC; reviewer notes.
- **PRD-PKG-004** (MVP) Order follows SAP section order or a Tracker custom list. Preview TOC, save draft package, build package, list of recent packages with download.
- **PRD-PKG-005** (MVP) Each build is versioned (for example v0.2) and audited.

**Acceptance criteria**

- Given 3 locked and 2 unlocked items are selected in the Tracker, when I open Generate PDF Package, then only the 3 locked items are included and the others are marked not eligible.

## 7.11 Define (DEF)

**User stories**

- As a programmer, I want to generate a draft Define-XML from study metadata and dataset specifications instead of writing XML by hand.

**Requirements**

- **PRD-DEF-001** (MVP) Choose package (SDTM, ADaM, both), Define-XML version (2.0 or 2.1), study OID and output name.
- **PRD-DEF-002** (MVP) Sources come from the study folders: `sdtm/`, `adam/`, optional annotated CRF and dataset specifications in `docs/`.
- **PRD-DEF-003** (MVP) Domain/dataset catalogue with selection; package contents views for datasets, value-level metadata, codelists (with NCI codes) and methods/comments.
- **PRD-DEF-004** (MVP) Validate, Generate, preview, download. A **human review gate** ("Needs review" → Lock/approve) is required before any publishing. Define approval is separate from shell locks and Tracker stages.
- **PRD-DEF-005** (MVP) Recent Define packages list with version, generated by/at and review status.

**Acceptance criteria**

- Given 6 SDTM domains are selected, when I generate, then a Define-XML 2.0 draft is produced, marked "Needs review", and cannot be marked published until a reviewer approves it.

## 7.12 Copilot (COP)

**User stories**

- As a user, I want helpful suggestions in context without risking uncontrolled changes.

**Requirements**

- **PRD-COP-001** (MVP) "Ask Copilot" panel available on every app screen with context-specific tips and quick-action chips.
- **PRD-COP-002** (MVP) Suggestion types: **TLF Assist** (draft shells or footnotes from SAP text), **Log QC** (explain log problems, suggest a fix note), **Mapping Assist** (mapping suggestions only), Define gap checks, package order tips.
- **PRD-COP-003** (MVP) **Suggest-only**: every suggestion is accepted or rejected by a person. Copilot cannot lock, run programs, publish, write outside Draft, or skip QC. Accepting a shell suggestion keeps the shell in Draft.
- **PRD-COP-004** (MVP) Suggestion inbox (open, accepted, rejected) and every accept/reject logged in the audit trail with the user's comment.
- **PRD-COP-005** (MVP) Copilot uses an AI model approved by the customer and running in, or approved for, the customer's environment; it can be switched off per company. No trial data is sent to outside services unless the customer explicitly allows it.

**Acceptance criteria**

- Given a Copilot suggestion to change a locked shell, then Accept is not available and the attempt is blocked.
- Given I reject a suggestion with a comment, then the audit trail shows "Copilot suggestion rejected" with my comment.

## 7.13 Admin (ADM)

**User stories**

- As an administrator, I want a short set of settings that tailor SPHERE to our company without custom code.

**Requirements**

- **PRD-ADM-001** (MVP) Sections: Overview, Modules, Branding, SSO, Connectors, Tracker workflow, Version control, Users & roles, Study layout, Compliance, Audit.
- **PRD-ADM-002** (MVP) **Modules**: the spine (company, SSO, studies, folder layout, audit trail) is always on. Switchable: Mock Shells (also sold alone), Metadata (on by default), Extract data, File Explorer, running programs, Tracker, Generate PDF Package, Define, Copilot, Audit browser.
- **PRD-ADM-003** (MVP) **Branding**: display name, accent colour, logo.
- **PRD-ADM-004** (MVP) **SSO**: SAML 2.0 or OIDC settings (entity ID, metadata URL, read-only SPHERE return address to give to the identity team), Test connection.
- **PRD-ADM-005** (MVP) **Connectors**: settings for clinical data systems (for example elluminate URL, credentials stored securely, sync mode: reference only, copy selected domains, or hybrid). Live pulls are Later.
- **PRD-ADM-006** (MVP) **Tracker workflow**: production programmer and QC always on; Statistician and Medical writing optional; programs folder mode (single or dev/qc/prod).
- **PRD-ADM-007** (MVP) **Version control**: Local history (default) or company Git server (Later).
- **PRD-ADM-008** (MVP) **Users & roles**: invite users, assign roles, see status and last activity. **Teams** for folder access and role pickers.
- **PRD-ADM-009** (MVP) **Study layout**: see LAY.
- **PRD-ADM-010** (MVP) **Compliance**: audit retention (default 7 years), e-signature status (Later), note that validation kits live outside the screen.
- **PRD-ADM-011** (MVP) **Audit**: company and study audit trail (see AUD).
- **PRD-ADM-012** (MVP) Every settings change is audited with before and after values.
- **PRD-ADM-013** (Demo only) "Reset demo data" clears browser-stored demo state (also `?reset=1`).

**Acceptance criteria**

- Given I switch off Statistician in Tracker workflow and save, then new moves go QC → Released to MW (or Approved when MW is also off), and the change appears in the audit trail.

## 7.14 Audit trail (AUD)

**Requirements**

- **PRD-AUD-001** (MVP) Append-only, time-ordered log of all create, change, delete, status, lock/unlock, run, load, export, permission, sign-in and Copilot accept/reject events.
- **PRD-AUD-002** (MVP) Each entry: who, what (object and ID), when (date and time with time zone), action, old and new values where relevant, and reason/comment where given.
- **PRD-AUD-003** (MVP) Search by actor or object; filter by event type (Lock, Copilot reject, Copilot accept, Ingest, Job, Shell edit, Export, Workflow, Settings); study and company views.
- **PRD-AUD-004** (MVP) Export (CSV and PDF) for inspections. No user, including administrators and Copilot, can change or delete entries.
- **PRD-AUD-005** (MVP) Retained for the period set in Admin (default 7 years).

## 7.15 Accessibility and appearance (A11Y)

**Requirements**

- **PRD-A11Y-001** (MVP) Accessibility menu in the header: **font zoom** (85%, 90%, 100%, 110%, 125%, with reset to 100%) and **contrast** (Default, High contrast, and a softer low-contrast option).
- **PRD-A11Y-002** (MVP) **Themes**: light and dark mode, and accent colours (Blue default, Teal, Indigo, Emerald, Slate, Violet, Rose, Amber, Cyan, Fuchsia). Preferences are remembered per user.
- **PRD-A11Y-003** (MVP) Layout works at every zoom step without cut-off or overlapping controls (chips wrap, lists stack, Actions stay visible).
- **PRD-A11Y-004** (MVP) Full keyboard use, visible focus, correct labels for screen readers (for example toggle buttons announce pressed state), and colour is never the only signal (status pills carry text).
- **PRD-A11Y-005** (MVP) Target: WCAG 2.2 level AA.

# 8. Workflows

## 8.1 Main flow: Mock Shell → Tracker → release

1. **Set up the study.** A lead creates the study with "+ New study". SPHERE creates the folder tree from the company layout and standard subfolders (LAY-001 to 003, STU-010 to 014).
2. **Set up SAP sections.** The biostatistician or lead creates or adjusts SAP sections (for example Demographics SAP 14.1, Efficacy 14.2) in Mock Shells. The same list appears in the Tracker (MS-030).
3. **Draft shells.** The biostatistician adds shells with "+ Add"; each is auto-numbered in its section and starts as Draft v0.1. They edit layout, footnotes and Metadata; changes autosave (MS-005, MS-006, MS-020).
4. **Review.** The shell status is set to **In review**; reviewers comment and the author revises.
5. **Finalise.** The shell status is set to **Final**. The version becomes v1.0 and the **+** in the shell list becomes active (MS-010, MS-011, MS-040).
6. **Send to Tracker.** The lead or programmer clicks **+**. SPHERE creates the Tracker record in the matching SAP section with the production program name, the QC program `qc-<program>`, generated SAS headers from the shell metadata, status **In dev** and default roles. The shell shows the synced icon (MS-041, MS-042, TRK-002, TRK-003).
7. **Optionally lock the shell.** After sign-off the shell is locked; it becomes read-only and greyed out (MS-012).
8. **Assign roles.** The lead sets PR, QC, Stats and MW for each record, one by one in the Roles popup or in bulk with "Assign roles" (TRK-022, TRK-023). People find their work with **My Assignments** (TRK-024).
9. **Develop.** The production programmer edits the program (In dev), runs it on the customer's SAS or R server, reads the log, and saves versions (TRK-004, TRK-050 to 055).
10. **Send to QC.** The production programmer chooses **Send to QC**. Production code becomes read-only; the QC chip is highlighted (TRK-021, TRK-032, TRK-034).
11. **QC.** The QC programmer completes `qc-<program>` and runs **Both (Prod then QC)** to compare results. If there are differences, they choose **Return to Revise** (back to step 9, program editable again). If clean, they choose **QC passed · send to Stats**.
12. **Statistical review.** The statistician reviews the output. If changes are needed, **Return to Revise**. Otherwise **Stats approved · release to MW**.
13. **Released to MW.** The record reaches its final stage: no further actions, green "Released" look, MW chip highlighted. The medical writer uses the output (TRK-031).
14. **Package.** The lead or medical writer selects locked shells and released outputs (or a custom list) and builds a PDF/Word package (PKG-001 to 005).
15. **Audit.** Every step above is in the History of the record and in the audit trail (TRK-060, AUD-001).

If a company switches off Stats review, step 12 is skipped. If it switches off Released to MW, the record ends at Approved (and can then be Frozen).

## 8.2 Status diagram (text form)

| From | Action | To | Who |
|----|------|----|---|
| Not started | Start work (or record created from shell) | In dev | PR / lead |
| In dev | Send to QC | QC | PR |
| QC | QC passed · send to Stats | Stats review | QC |
| QC | Return to Revise | Revise | QC |
| Stats review | Stats approved · release to MW | Released to MW | Stats |
| Stats review | Return to Revise | Revise | Stats |
| Revise | Send to QC | QC | PR |
| Released to MW | no (final) | no | no |

## 8.3 Other workflows

- **Import existing programs:** Tracker → Import programs → choose files from `programs/` → Create tracker records → assign roles and SAP sections.
- **Data load:** File Explorer → raw → Extract data → choose source and files → load → checksum and audit entry.
- **Define-XML:** Define → choose package and version → select domains → Generate → review → Lock/approve → download.
- **Copy a shell to another study:** Mock Shells → Copy to study → pick target study (same company) → new Draft created there.
- **Change company layout:** Admin → Study layout → choose option → edit subfolders → Save layout → new studies follow it.

# 9. Roles and permissions

## 9.1 Roles

- **Company administrator:** configures SPHERE for the company; manages users and teams. Does not do study work by default.
- **Lead programmer:** runs a study's programming; assigns roles; can unlock shells and move any record.
- **Production programmer (PR):** writes production programs.
- **QC programmer (QC):** writes QC programs and passes or returns outputs.
- **Statistician (Stats):** owns shell content with the lead; approves outputs.
- **Medical writer (MW):** receives released outputs; builds packages.
- **Data manager:** loads data into raw.
- **Viewer / auditor:** read-only access to studies and the audit trail.

Study roles (PR, QC, Stats, MW) are given per record in the Tracker; the other roles are given per study or company. The mockups' simpler set (programmer, reviewer, admin) maps onto this list; see open question Q3.

## 9.2 Permissions matrix

Key: Lead = lead programmer; DM = data manager; Viewer = viewer or auditor. **Y** = allowed; **Own** = only on records where the person holds that role; **: ** = not allowed.

| Action | Admin | Lead | PR | QC | Stats | MW | DM | Viewer |
|---------|---|---|--|--|---|--|--|---|
| Change company settings (modules, SSO, layout, workflow) | Y | no | no | no | no | no | no | no |
| Manage users and teams | Y | no | no | no | no | no | no | no |
| Create study | Y | Y | no | no | no | no | no | no |
| Manage folder access | Y | Y | no | no | no | no | no | no |
| Create/edit shells (Draft, In review) | no | Y | Y | no | Y | no | no | no |
| Set shell to Final | no | Y | no | no | Y | no | no | no |
| Lock shell | no | Y | no | no | Y | no | no | no |
| Unlock shell | no | Y | no | no | no | no | no | no |
| Send shell to Tracker | no | Y | Y | no | Y | no | no | no |
| Edit/create SAP sections | no | Y | no | no | Y | no | no | no |
| Assign roles (single or bulk) | no | Y | no | no | no | no | no | no |
| Edit production program (In dev / Revise) | no | Y | Own | no | no | no | no | no |
| Edit QC program (up to QC) | no | Y | no | Own | no | no | no | no |
| Run programs | no | Y | Own | Own | no | no | no | no |
| Send to QC | no | Y | Own | no | no | no | no | no |
| QC passed / Return to Revise from QC | no | Y | no | Own | no | no | no | no |
| Stats approved / Return to Revise from Stats | no | Y | no | no | Own | no | no | no |
| Build PDF/Word package | no | Y | no | no | Y | Y | no | no |
| Generate Define-XML | no | Y | Y | no | no | no | no | no |
| Approve Define-XML | no | Y | no | Y | Y | no | no | no |
| Load data into raw | no | Y | no | no | no | no | Y | no |
| Accept/reject Copilot suggestions | no | Y | Y | Y | Y | Y | Y | no |
| View study content | Y | Y | Y | Y | Y | Y | Y | Y |
| View and export audit trail | Y | Y | no | no | no | no | no | Y |

Folder access (View / Edit) set in File Explorer further limits what a person can open or change on the file system, and read-only stages always win over folder Edit rights.

# 10. Data and folder model

## 10.1 Main records

| Record | Key fields | Notes |
|---|-------|----|
| Company (tenant) | ID, display name, branding, SSO settings, module switches, layout, subfolders, workflow settings, version control choice, retention | One per customer installation (can hold several business units later) |
| Study | Study ID, name, compound, protocol, deliverable, deliverable type, phase, indication, status, lead programmer, statistician, sponsor, FPFV, LPLV, DB lock | Folder path is **calculated** from compound/protocol/deliverable and the company layout |
| SAP section | Name, SAP reference, order | One shared list per study; used by Mock Shells and Tracker |
| Mock shell | Number, title, type, population, status, version, grid, footnotes, notes, program name text, SAP section, metadata, macro parameters, lock state, Tracker link | Autosaved; versioned |
| Tracker record | Output ID, title, type, SAP section, tags, status, Assigned To, roles (PR list, QC, Stats, MW), production program, QC program, shell link and version, job state | Status changes and role changes go to History |
| Program version | Program path, version number, content snapshot, author, time, reason | Local history by default |
| Run (job) | Job ID, programs, mode (Prod, QC, Both), language, user, start, end, result, log path | Logs stored in `logs/` |
| Data load | Source, label, files, checksum, target, user, time, status | |
| Package | Name, format, items and order, version, builder, time, file | |
| Define package | Type, version, domains, status, reviewer | |
| Copilot suggestion | Type, text, affected object, decision, user, comment | |
| Audit entry | Time, user, action, object, old value, new value, reason | Append-only |

## 10.2 Folder layouts

The company picks one layout. `{subfolders}` is the company's standard subfolder list.

| Option | Pattern | Example |
|---|-----|-----|
| 1 (default) | `{protocol}/{subfolders}` | `ONC-204-301/adam/` (CSR and DSUR share it) |
| 2 | `{protocol}/{deliverable}/{subfolders}` | `ONC-204-301/CSR/adam/` |
| 3 | `{compound}/{protocol}/{deliverable}/{subfolders}` | `XP-204/ONC-204-301/CSR/adam/` |

Default standard subfolders:

```
data/raw     raw data as received (loads land here)
sdtm         SDTM datasets
adam         ADaM analysis datasets
programs     SAS and R programs (or programs/dev, programs/qc, programs/prod)
tlf          tables, listings, figures (outputs)
logs         run logs
docs         SAP, annotated CRF, specifications, shell documents
```

Rules:

- The folder path is never typed by users; it is calculated from the study's details and the saved layout.
- In layout 1, deliverables of one protocol share a folder; Study home lists "Shares folder with".
- A new path that already exists blocks study creation.
- Changing the layout affects new studies only, unless "Apply to existing" is explicitly confirmed.
- Program naming: production `t_|l_|f_<number>_<short name>.sas` (or `.R`), QC `qc-<production name>`; dataset programs `adam_<dataset>.sas`.

# 11. Integrations and deployment model

## 11.1 Deployment model

- **Installed in the customer's environment.** SPHERE is delivered as software the customer (or we, under their control) installs on servers they own or rent, inside their own network. We do not host their trial data.
- **Connects to what they already have.** SPHERE uses the customer's existing SAS and R installations to run programs and their existing file systems (network drives or file servers) for study folders. File Explorer shows those real folders.
- **Data stays under the customer's IT control.** Backups, retention, network rules and access to servers are managed by the customer's IT team. SPHERE never needs to copy data out.
- **Customer sign-in.** Users sign in with the customer's single sign-on (SAML 2.0 or OIDC).
- **Gradual adoption.** Customers can start with one module (for example Mock Shells alone) and one study, then add modules and studies. Each module works with existing folders and programs, so nothing has to be migrated up front.
- **Environments.** Customers typically run separate test and production installations (for example Dev / QC / Prod) so upgrades can be checked before go-live.
- Note: early mockup Admin pages mention a dedicated hosted network and a cloud region. These are superseded by this installed model.

## 11.2 Integrations

| Integration | MVP | Notes |
|------|--|--------|
| Company sign-in (SAML 2.0 / OIDC) | Yes | Settings in Admin → SSO |
| SAS (9.4 and later) on customer servers | Yes | Runs production and QC programs; logs returned |
| R (4.x) on customer servers | Yes | Same as SAS |
| Customer file system (network share / file server) | Yes | Study folders, programs, outputs, logs |
| Folder permissions on the file system | Yes | View / Edit from File Explorer, aligned with stage locks |
| Local program history | Yes | Default |
| Company Git server (for example Enterprise GitHub) | Later | Admin stub only |
| Clinical data systems (elluminate, Rave) | Later | Admin settings stub; file-based loads in MVP |
| AI model for Copilot | Yes (optional) | Customer-approved model; can be switched off |

# 12. Non-functional requirements

## 12.1 Security

- **PRD-NFR-SEC-001** All sign-in through customer SSO (or local accounts only where the customer allows).
- **PRD-NFR-SEC-002** Role-based and per-study access; folder access on the file system; least privilege by default.
- **PRD-NFR-SEC-003** All traffic encrypted in transit (HTTPS/TLS); secrets such as connector credentials stored encrypted, never shown after saving.
- **PRD-NFR-SEC-004** Study isolation: users cannot see studies they have no access to; Copy to study only within the same company.
- **PRD-NFR-SEC-005** Session time-out and account lockout follow company policy.
- **PRD-NFR-SEC-006** No trial data leaves the customer environment through SPHERE (including Copilot) unless explicitly allowed.
- **PRD-NFR-SEC-007** Security questionnaire answers and a basic threat review ready before the first customer go-live.

## 12.2 Audit trail

- **PRD-NFR-AUD-001** Every change to regulated records (shells, Tracker records, programs, workflow, locks, data loads, Define, packages, settings) is recorded automatically: who, what, when, old and new value, reason.
- **PRD-NFR-AUD-002** Entries cannot be changed or deleted by anyone; tampering is detectable.
- **PRD-NFR-AUD-003** Time stamps are server time with time zone; displayed in the user's time zone.
- **PRD-NFR-AUD-004** Audit trail is searchable, exportable and retained for the configured period (default 7 years).

## 12.3 Performance

- **PRD-NFR-PERF-001** Pages open in under 2 seconds for a study with 1,000 Tracker records and 500 shells.
- **PRD-NFR-PERF-002** Filters, My Assignments and status changes respond in under 0.5 seconds.
- **PRD-NFR-PERF-003** Send to Tracker completes in under 5 seconds including header generation.
- **PRD-NFR-PERF-004** Queued runs start within 10 seconds of a free slot; the number of parallel runs is configurable to match the customer's SAS/R capacity.
- **PRD-NFR-PERF-005** Supports at least 100 concurrent users per installation in the MVP.

## 12.4 Accessibility

- **PRD-NFR-A11Y-001** WCAG 2.2 AA target; see A11Y requirements.
- **PRD-NFR-A11Y-002** Usable at 85% to 125% font zoom and in high contrast, light and dark mode.
- **PRD-NFR-A11Y-003** Works in current Chrome, Edge and Firefox on desktop; readable on tablets; key pages usable on phones.

## 12.5 Reliability and support

- **PRD-NFR-REL-001** No data loss on browser close (autosave) or server restart (runs recover or are marked failed, never silently lost).
- **PRD-NFR-REL-002** Upgrades are delivered as versioned releases with release notes and validation evidence; customers decide when to upgrade.
- **PRD-NFR-REL-003** Backups follow the customer's IT procedures; SPHERE documents what must be backed up.

## 12.6 Compliance support

- **PRD-NFR-COMP-001** Designed to support 21 CFR Part 11 (US FDA rules on electronic records and signatures) and EU GMP Annex 11 (EU rules on computerised systems): audit trails, access control, record integrity, time stamps, and human-only locks and approvals.
- **PRD-NFR-COMP-002** Electronic signatures are Later; until then, approvals are recorded as attributable audited actions, and customers may use their own signature process.
- **PRD-NFR-COMP-003** Supports CDISC standards (SDTM, ADaM, Define-XML 2.0/2.1) and ICH E3 output conventions.
- **PRD-NFR-COMP-004** SPHERE supports compliance; the customer remains responsible for their validated state and procedures.

# 13. Validation approach (summary)

- **Classification.** SPHERE is configurable off-the-shelf software: **GAMP 5 Category 4**. Customers configure it (modules, layout, workflow) but do not change its code.
- **Supplier (our) activities.** We build under a documented quality process: requirements (this PRD, with IDs), design notes, code review, automated tests, risk assessment per requirement, release notes and traceability from requirement to test.
- **Automated OQ evidence.** For each release we run automated operational qualification (OQ) tests that check each validated requirement (for example PRD-TRK-032 workflow moves, PRD-MS-012 locked shells) and produce a signed-off evidence pack: test scripts, results, screenshots and a traceability matrix.
- **Installation (IQ).** An installation checklist and automated checks confirm SPHERE is installed correctly in the customer environment (versions, connections to SAS/R, file system, SSO).
- **Customer-owned UAT.** The customer runs user acceptance testing (UAT, sometimes called PQ) against their own processes and configuration. We provide template scripts based on the workflows in section 8.
- **Part 11 / Annex 11 support.** A mapping document shows how SPHERE features support each relevant clause (audit trail, access, record copies, time stamps, signatures when available).
- **Change control.** Each release lists changed requirements and re-runs the affected OQ tests; customers assess impact before upgrading.
- **Frugal tooling.** Validation tooling uses free and open-source tools until the first paying customer (see principle 10).

# 14. Operating constraints

- **No paid tools until the first paying customer.** Development, testing, documentation and demos use free or open-source tools and free tiers. Any paid tool, service or licence needs an explicit decision and is logged in section 15.2.
- The mockups are front-end only: demo state is kept in the browser (`sphere-demo-flow-v1`, `sphere-tenant-study-layout`, theme and accessibility preferences) and reset with `?reset=1` or Admin → Reset demo data. Program runs are simulated.
- One code base; customer differences through settings only.
- Documentation and product text use plain language.

# 15. Open questions and decisions log

## 15.1 Open questions

| # | Question | Why it matters | Proposed direction |
|-|--------|------|------|
| Q1 | Who can set a shell to Final and Locked: statistician only, lead programmer, or both? | Gates Send to Tracker and locks | Both, configurable per company |
| Q2 | Should unlocking a shell that is already in the Tracker send the record back to Revise or just flag it? | Keeps shells and programs consistent | Flag the record ("shell changed after sync") and let the lead decide |
| Q3 | Final role model: map the mockups' programmer/reviewer/admin onto the fuller list in section 9? | Permissions and UAT scripts | Adopt section 9 list; keep "reviewer" as an alias |
| Q4 | Should the QC programmer's `qc-` program become read-only after "QC passed"? | Record integrity | Yes, read-only after QC passed |
| Q5 | How are R programs named and headed (the header today is SAS-style)? | Mixed SAS/R studies | Same header fields in R comment syntax; QC `qc-<name>.R` |
| Q6 | What exactly counts as "released": the program, the output file, or both? Where do released outputs live? | Medical writing hand-off and packages | Both; copy outputs to `tlf/` with version stamp |
| Q7 | When is "Apply to existing" for layout changes needed, and how are moved folders handled for running programs? | Risk of broken paths | Keep out of MVP; derived paths only for new studies |
| Q8 | Which AI model runs Copilot inside customer environments, and at what cost? | Data control and the no-paid-tools rule | Open-source model the customer hosts; off by default |
| Q9 | Is electronic signature needed for the first customer, or is an audited approval enough? | Part 11 scope | Audited approval in MVP; e-sign Later |
| Q10 | Maximum parallel runs and how to share SAS licences fairly between users? | Performance and licence use | Company setting; default 3 per user, configurable |
| Q11 | Do we need both Approved and Frozen when the MW stage is off, or just one end state? | Simpler workflow | Keep both for now; review after first customer |
| Q12 | Packaging: must packages include only Released outputs as well as locked shells? | Package eligibility rules | Locked shells plus Released (or Approved) outputs |
| Q13 | Which clinical data system connector comes first after MVP? | Roadmap | Decide with first paying customer |
| Q14 | Supported operating systems and databases for the installed product? | Installation and IQ | Linux servers first; confirm with first customer IT |

## 15.2 Decisions log

| Date | Decision |
|--|-----------|
| 2026-09-04 | Compute folded into Tracker; "Run selected (R/SAS)" on the board; old Compute page kept as a redirect note. |
| 2026-09-04 | Define-XML module: generated from metadata and specs, human review before publish, separate from shell locks and Tracker. |
| 2026-09-05 | Copy to study creates a Draft in another same-company study; never copies lock, QC, approval or generated files. |
| 2026-09-06 | Tracker grouped by SAP section; Mock Shells TOC grouped by SAP section with drag and drop; column header grouping up to two levels. |
| 2026-09-10 | Navigation simplified: File Explorer houses Extract data; Publisher renamed Generate PDF Package and opened from Tracker. Metadata made an optional module. |
| 2026-09-12 | No check-in/check-out; editability follows stage (In dev, Revise). Statistician and Medical writing roles optional per company. Programs folder modes: single or dev/qc/prod. Local history default; Enterprise GitHub stub. |
| 2026-09-12 | Tracker History popup with Log and Versions (side-by-side, difference, restore). |
| 2026-09-12 to 13 | Accessibility bar (font zoom, contrast) and extra accent themes; Copilot panel restored on every screen. |
| 2026-09-27 | Simulated SAS/R run engine: per-row status, queue, background jobs panel, log viewer scrolling to first warning; bulk Run QC or Both. |
| 2026-09-27 | flow1: Final shell → Send to Tracker; generated SAS/QC headers; `qc-` naming; workflow stepper; My Assignments; inline roles; "Owner" renamed "Assigned To"; realistic shells; shell Metadata. "Create study structure" removed from Study home. |
| 2026-09-27 | flow2: Released to MW is the final stage (no Approve/Revise after it). |
| 2026-09-27 | flow3: + gated by Status dropdown (Final); autosave; tenant study layout; Programs column; roles under the title. |
| 2026-09-27 | flow3c to 3e: shared SAP sections between Mock Shells and Tracker; File Explorer single compact information bar; layout options revised with protocol as default; saved layout drives derived paths; locked shells read-only and muted. |
| 2026-09-27 | flow3f to 3j: toolbar blue = active only; status pill only; Roles popup with searchable pickers and bulk Assign roles; stage-highlighted role chip; "§" dropped from SAP references. |
| 2026-09-27 | Deployment: installed in the customer's environment, using their SAS/R, file systems and SSO; hosted-cloud wording retired. |
| 2026-09-27 | Validation: GAMP 5 Category 4; Part 11/Annex 11 support; automated OQ evidence; customer-owned UAT. |
| 2026-09-27 | Operating constraint: no paid tools until the first paying customer. |
| 2026-09-27 | PRD v2.0 consolidated rewrite replaces the appended living document. |
| 2026-10-02 | Both runs execute the production (primary) program first, then the QC program. |
| 2026-10-02 | Tracker has no Files column. Program names open a scoped Program · Log · RTF viewer (Prod or QC); the crowded all-in-one artifacts icon was removed. |

# 16. Glossary

| Term | Meaning |
|---|---------|
| ADaM | Analysis Data Model: CDISC standard for analysis datasets (for example ADSL, ADAE). |
| aCRF | Annotated case report form: the data collection form marked with SDTM variable names. |
| Annex 11 | EU GMP Annex 11: European rules for computerised systems in regulated work. |
| Assigned To | The person responsible for a Tracker record overall (formerly "Owner"). |
| Audit trail | A permanent, time-stamped record of who did what and when. |
| Both run | Running the production program and then the QC program in one request. |
| CDISC | Clinical Data Interchange Standards Consortium: sets data standards used for submissions. |
| Compound | The drug or product being studied; may contain several protocols. |
| Copilot | SPHERE's suggest-only assistant; a person must accept or reject every suggestion. |
| CRO | Contract research organisation: a company that runs trial work for sponsors. |
| CSR | Clinical study report: the main report of a trial's results. |
| Define-XML | CDISC file that describes the structure and content of submitted datasets. |
| Deliverable | A set of outputs for a purpose, for example CSR, DSUR, DMC, ISS. |
| DMC | Data monitoring committee: independent group that reviews trial data during the study. |
| DSUR | Development safety update report: yearly safety report for a drug in development. |
| Feature flag | An on/off switch that turns a module or feature on for a company without changing the software. |
| FPFV / LPLV | First patient first visit / last patient last visit. |
| GAMP 5 | Industry guide for validating computerised systems; Category 4 means configured off-the-shelf software. |
| ICH E3 | International guideline on the structure and content of clinical study reports. |
| IQ / OQ / UAT | Installation qualification (installed correctly) / operational qualification (works as specified) / user acceptance testing (fits the customer's process). |
| ITT / mITT / PP | Intent-to-treat / modified intent-to-treat / per-protocol analysis populations. |
| Locked (shell) | A shell that is read-only after sign-off; only authorised users can unlock it. |
| Medical writing (MW) | The team that writes study reports using released outputs. |
| Mock shell | An empty table, listing or figure layout showing what an output will look like. |
| My Assignments | Tracker filter showing only records where you are Assigned To or hold a role. |
| OIDC / SAML | Two common standards for company single sign-on. |
| Part 11 | US FDA 21 CFR Part 11: rules for trustworthy electronic records and signatures. |
| Pharmacokinetic | Relating to how the body absorbs, distributes and eliminates a drug. |
| PR | Production programmer: writes the main program for an output. |
| Protocol | The plan for one clinical trial; identified by a protocol number (for example ONC-204-301). |
| QC | Quality control: independent check, usually by writing a second (QC) program and comparing results. In the interface this stage is shown as "In QC". |
| Released to MW | Final Tracker stage: output approved and handed to medical writing. |
| Revise | Stage where a returned output is corrected; programs are editable again. |
| SAP | Statistical analysis plan: the document that defines the analyses and outputs. |
| SAP section | A group of outputs matching a SAP chapter (for example Demographics, SAP 14.1). |
| SDTM | Study Data Tabulation Model: CDISC standard for collected trial data. |
| SSO | Single sign-on: signing in once with your company account. |
| Stats review | Stage where the statistician reviews the output (shown as "In Stats"). |
| Study layout | The company rule for how study folders are organised (three options). |
| Tenant | One customer company's SPHERE configuration: its settings, users and studies. |
| TLF | Tables, listings and figures: the statistical outputs of a trial. |
| Tracker | SPHERE's board of all outputs, programs, stages and people for a study. |
| WCAG | Web Content Accessibility Guidelines: the standard for accessible web software. |
