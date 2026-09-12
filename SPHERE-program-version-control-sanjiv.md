# SPHERE — Program version control & folders

Product direction (Sanjiv). Mockups follow this; the real product should too.

## Program version control

Tenant Admin chooses the storage backend. The programmer UX stays the same either way.

- **Local history** (default) — SPHERE keeps snapshots on the tenant.
- **Enterprise GitHub** — same History + restore UI; GitHub is the backend (org/repo). MVP is Local plus an Admin stub for GitHub (no OAuth required in the demo).

History + restore live in **In dev** and **Revise** (the only editable stages). Snapshots are taken on save, handoff, restore, and promote.

## Program folders

Keep a single `programs/` mode. The split mode is three folders, not two:

| Path | Role |
|---|---|
| `programs/dev` | Editable. Author here (In dev / Revise). |
| `programs/qc` | QC copies. Send to QC promotes/copies here. |
| `programs/prod` | Approved / production. Read-only after Approve / promote. |

Flow: author in **dev** → **Send to QC** copies into **qc** → **Approve / promote** copies into **prod**.

Same History + restore UX whether files sit in one `programs/` tree or under `dev` / `qc` / `prod`.
