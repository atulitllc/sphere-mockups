# Shared styles

Every SPHERE mockup page loads `shared-white.css`. Add new controls with the classes in that file. Do not invent a one-off border, leave a `<button>` without a component class, or start a second stylesheet for the same kind of control.

## Buttons

| Role | Class |
| --- | --- |
| Secondary (surface) | `btn` |
| Primary | `btn primary` |
| Ghost | `btn ghost` |
| Small | `btn sm` |
| Icon only | `btn icon-btn` |
| Toolbar icon plus label | `action-icon-btn` |
| Danger | `btn danger` |

`a.btn` is the same control when the action is a link.

## Tables, pills, fields

- Sortable headers use `button.sort-h`. Put the arrow in `span.sort-arrow` on the active column only. Plain `th` labels stay uppercase so Size, Access, and the sortable columns match.
- Empty values use `span.cell-empty` around a hyphen (`-`). Do not write `Not set`.
- Status pills use `badge` with `locked`, `running`, `not-started`, `draft`, or `review`.
- Short tags use `tag-chip`.
- Inputs and `select` elements inherit the shared field rules. Pages that already use `field-input` or `label.meta-field` should keep those.

## Menus, modals, tooltips

- A menu is a trigger plus a `role="menu"` panel. Mock Shells export uses `.export-wrap` and `.export-menu`. Tracker run menus use `.row-exec-menu` and `.bulk-run-menu`. File Explorer uses `.ctx-menu`.
- Dialogs use the existing `.modal` and `.modal-backdrop` markup.
- Short notes go in the `title` attribute. Richer role notes use `.row-people-tip`. Do not drop a scrolling note inside a table title cell.

## Themes and copy

Light and dark tokens live on `:root`, `[data-theme="light"]`, and `[data-theme="dark"]`. Color new UI with `var(--text)`, `var(--surface)`, `var(--border)`, `var(--accent)`, and the status tokens.

Do not use em dashes in user-visible text or seed data. Use a middle dot, a colon, or plain wording.

## Why unclassed buttons look empty

`shared-white.css` resets `button` (no browser border, background, or padding) because inheriting only the font left native gray buttons on the page. Component classes paint the real control. If something should look like a button, give it `btn`.
