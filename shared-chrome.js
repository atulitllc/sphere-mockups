/* SPHERE mockup chrome: compact accent dropdown (sphere-accent + data-accent) */
(function () {
  var ACCENTS = {
    blue: '#2563EB',
    teal: '#0d9488',
    indigo: '#4f46e5',
    emerald: '#059669',
    slate: '#475569',
    violet: '#7c3aed',
    rose: '#e11d48',
    amber: '#d97706',
    cyan: '#0891b2',
    fuchsia: '#c026d3'
  };
  var ACCENT_KEYS = Object.keys(ACCENTS);

  /* Tenant module flags (Admin → Modules). Demo: localStorage sphere-module-<id> = "on"|"off" */
  var MODULE_DEFAULTS = {
    metadata: 'off' /* optional; tenants opt in */
  };

  function getModuleFlag(id) {
    var def = MODULE_DEFAULTS[id] || 'off';
    try {
      var v = localStorage.getItem('sphere-module-' + id);
      if (v === 'on' || v === 'off') return v;
    } catch (e) {}
    return def;
  }

  function setModuleFlag(id, on) {
    try { localStorage.setItem('sphere-module-' + id, on ? 'on' : 'off'); } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('sphere-module-change', { detail: { id: id, on: !!on } }));
    } catch (e) {}
  }

  function isModuleEnabled(id) {
    return getModuleFlag(id) === 'on';
  }

  window.SPHERE = window.SPHERE || {};
  window.SPHERE.getModuleFlag = getModuleFlag;
  window.SPHERE.setModuleFlag = setModuleFlag;
  window.SPHERE.isModuleEnabled = isModuleEnabled;

  function currentAccent() {
    var a = document.documentElement.getAttribute('data-accent');
    return ACCENTS[a] ? a : 'blue';
  }

  function applyAccent(accent) {
    if (!ACCENTS[accent]) accent = 'blue';
    document.documentElement.setAttribute('data-accent', accent);
    try { localStorage.setItem('sphere-accent', accent); } catch (e) {}

    var swatch = document.getElementById('accentCurrentSwatch');
    if (swatch) swatch.style.setProperty('--swatch', ACCENTS[accent]);

    var btn = document.getElementById('accentPickerBtn');
    if (btn) {
      var label = accent.charAt(0).toUpperCase() + accent.slice(1);
      btn.setAttribute('aria-label', 'Accent theme: ' + label);
      btn.setAttribute('title', 'Accent: ' + label);
    }

    document.querySelectorAll('.accent-menu-item').forEach(function (item) {
      var on = item.getAttribute('data-accent-value') === accent;
      item.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }

  function initAccentPicker() {
    var picker = document.getElementById('accentPicker');
    var btn = document.getElementById('accentPickerBtn');
    var menu = document.getElementById('accentMenu');
    if (!picker || !btn || !menu) return;

    menu.innerHTML = ACCENT_KEYS.map(function (key) {
      var label = key.charAt(0).toUpperCase() + key.slice(1);
      return '<button type="button" class="accent-menu-item" role="option" data-accent-value="' + key + '" aria-selected="false">' +
        '<span class="accent-swatch" style="--swatch:' + ACCENTS[key] + '" aria-hidden="true"></span>' +
        '<span class="accent-menu-label">' + label + '</span></button>';
    }).join('');

    function setOpen(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) menu.removeAttribute('hidden');
      else menu.setAttribute('hidden', '');
    }

    function isOpen() {
      return btn.getAttribute('aria-expanded') === 'true';
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!isOpen());
    });

    menu.querySelectorAll('.accent-menu-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        applyAccent(item.getAttribute('data-accent-value'));
        setOpen(false);
        btn.focus();
      });
    });

    document.addEventListener('click', function (e) {
      if (!picker.contains(e.target)) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        btn.focus();
      }
    });

    applyAccent(currentAccent());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccentPicker);
  } else {
    initAccentPicker();
  }
})();


/* Page note pull-down: title-row icon toggles .note-banner (page-sub stays visible) */
(function () {
  function setOpen(btn, banner, open) {
    if (!btn || !banner) return;
    banner.classList.toggle('is-collapsed', !open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('title', open ? 'Hide note' : 'Show note');
    btn.setAttribute('aria-label', open ? 'Hide note' : 'Show note');
    btn.classList.toggle('is-open', !!open);
  }

  function initPageNotes() {
    document.querySelectorAll('.page-note-toggle').forEach(function (btn) {
      if (btn.getAttribute('data-note-bound') === '1') return;
      btn.setAttribute('data-note-bound', '1');
      var id = btn.getAttribute('aria-controls');
      var banner = id ? document.getElementById(id) : null;
      if (!banner) {
        var intro = btn.closest('.page-intro');
        var sib = intro ? intro.nextElementSibling : null;
        if (sib && sib.classList.contains('note-banner')) banner = sib;
      }
      if (!banner) {
        btn.hidden = true;
        return;
      }
      setOpen(btn, banner, false);
      btn.addEventListener('click', function () {
        setOpen(btn, banner, banner.classList.contains('is-collapsed'));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPageNotes);
  } else {
    initPageNotes();
  }
})();

(function () {

  /* In-context Copilot (demo: scripted). Mock Shells + Tracker first. */
  function initCopilotPanel() {
    var path = (location.pathname || '').split('/').pop() || '';
    var page = 'generic';
    if (/mock-shells/i.test(path)) page = 'mock-shells';
    else if (/tracker/i.test(path)) page = 'tracker';
    else if (/publisher/i.test(path)) page = 'publisher';
    else if (/data-hub|files/i.test(path)) page = 'files';
    else return; /* only study work screens for v1 demo */

    var topRight = document.querySelector('header.top .top-right');
    if (!topRight || document.getElementById('copilotLaunch')) return;

    var launch = document.createElement('button');
    launch.type = 'button';
    launch.id = 'copilotLaunch';
    launch.className = 'copilot-launch';
    launch.title = 'Ask Copilot';
    launch.setAttribute('aria-haspopup', 'dialog');
    launch.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.2 6.6L21 12l-6.8 2.4L12 21l-2.2-6.6L3 12l6.8-2.4z"/></svg><span>Ask Copilot</span>';
    topRight.insertBefore(launch, topRight.firstChild);

    var backdrop = document.createElement('div');
    backdrop.className = 'copilot-backdrop';
    backdrop.id = 'copilotBackdrop';
    backdrop.hidden = true;

    var chips =
      page === 'mock-shells' ? [
        { id: 'draft-shell', label: 'Draft shell from SAP' },
        { id: 'fill-meta', label: 'Suggest metadata' },
        { id: 'footnotes', label: 'Propose footnotes' }
      ] : page === 'tracker' ? [
        { id: 'explain-fail', label: 'Explain failed job' },
        { id: 'fix-note', label: 'Draft fix note' },
        { id: 'run-order', label: 'Suggest run order' }
      ] : page === 'publisher' ? [
        { id: 'bundle-toc', label: 'Order this package' },
        { id: 'missing-out', label: 'Flag missing outputs' }
      ] : [
        { id: 'map-assist', label: 'Suggest a mapping' },
        { id: 'where-file', label: 'Where should this land?' }
      ];

    var replies = {
      'draft-shell': 'Draft suggestion (demo): create shell <strong>14.3.5 Laboratory — chemistry shifts</strong> from SAP §11.4. Columns Placebo / Drug X; rows AST, ALT, ALP, BILI. Status stays <em>Draft</em> until you lock — Copilot cannot lock or run.',
      'fill-meta': 'For automatable safety tables, metadata could include: analysis dataset, population flag, treatment variable, sort vars, subgroup, and denominator. Open <strong>Metadata</strong> (if the module is on) to edit the spreadsheet stub.',
      'footnotes': 'Suggested footnotes (demo): “Baseline = last non-missing before first dose.” “N = subjects in Safety population.” Accept would create a Draft note on the shell only.',
      'explain-fail': 'Demo read of a typical fail: missing treatment label for TRT01A = “Drug X 200mg” (n=2). Suggested action: add a label map entry, then re-run from Tracker. Copilot will not re-run for you.',
      'fix-note': 'Fix note (demo): “Add TRT01A label for Drug X 200mg before re-run of tfl_14_3_1_ae.R.” Accept lands in the governed Suggestions inbox — human lock still required.',
      'run-order': 'Suggested order for a First-look list (demo): ADSL → ADAE → 14.1.1 Demographics → 14.3.1 AE summary. Save as a <strong>custom list</strong> on Tracker to reuse for Run and Generate PDF Package.',
      'bundle-toc': 'Package order tip (demo): keep SAP section order; put figures after related tables. Use a Tracker custom list so Run and PDF share one sequence.',
      'missing-out': 'Demo check: if a list program has no locked output under tlf/, flag it before packaging. Copilot only suggests — it does not assemble the PDF.',
      'map-assist': 'Mapping Assist (demo): LB_CHEM.LBTESTCD = AST → SDTM LB.LBTESTCD = AST with units IU/L. Accept opens as Pending review in Copilot inbox.',
      'where-file': 'Land raw vendor extracts under <code>raw/</code>, derived under <code>sdtm/</code> or <code>adam/</code> per the tenant template. Extract data is the pull entry point from File Explorer.',
      'default': 'I can help with this screen’s tasks as Draft suggestions only. Writes still need a human lock — Copilot cannot lock or run programs. Open the full <a href="copilot.html">Suggestions inbox</a> to accept or reject.'
    };

    var panel = document.createElement('aside');
    panel.className = 'copilot-panel';
    panel.id = 'copilotPanel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Ask Copilot');
    panel.innerHTML =
      '<div class="copilot-panel-head">' +
        '<div><h2>Ask Copilot</h2><p class="hint">Context: this screen · Draft suggestions only</p></div>' +
        '<button type="button" class="btn sm" id="copilotClose" aria-label="Close">Close</button>' +
      '</div>' +
      '<div class="copilot-chips" id="copilotChips"></div>' +
      '<div class="copilot-thread" id="copilotThread"></div>' +
      '<div class="copilot-compose">' +
        '<input class="search" id="copilotInput" type="text" placeholder="Ask about this screen…" aria-label="Ask Copilot" />' +
        '<button type="button" class="btn primary" id="copilotSend">Ask</button>' +
      '</div>' +
      '<div class="copilot-panel-foot">Human lock only · <a href="copilot.html">Open Suggestions inbox</a></div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    var chipsEl = document.getElementById('copilotChips');
    chips.forEach(function (ch) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'copilot-chip';
      b.textContent = ch.label;
      b.addEventListener('click', function () { ask(ch.label, ch.id); });
      chipsEl.appendChild(b);
    });

    var thread = document.getElementById('copilotThread');
    function addMsg(role, html) {
      var d = document.createElement('div');
      d.className = 'copilot-msg ' + role;
      if (role === 'bot') {
        d.innerHTML = '<span class="badge warn">Demo · not live AI</span><div>' + html + '</div>';
      } else {
        d.textContent = html;
      }
      thread.appendChild(d);
      thread.scrollTop = thread.scrollHeight;
    }
    function ask(text, id) {
      addMsg('user', text);
      var html = replies[id] || replies.default;
      setTimeout(function () { addMsg('bot', html); }, 280);
    }
    function open() {
      backdrop.hidden = false;
      panel.hidden = false;
      if (!thread.childNodes.length) {
        addMsg('bot', replies.default);
      }
      var inp = document.getElementById('copilotInput');
      if (inp) inp.focus();
    }
    function close() {
      backdrop.hidden = true;
      panel.hidden = true;
    }
    launch.addEventListener('click', open);
    backdrop.addEventListener('click', close);
    document.getElementById('copilotClose').addEventListener('click', close);
    document.getElementById('copilotSend').addEventListener('click', function () {
      var inp = document.getElementById('copilotInput');
      var v = (inp && inp.value || '').trim();
      if (!v) return;
      inp.value = '';
      ask(v, 'default');
    });
    document.getElementById('copilotInput').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') document.getElementById('copilotSend').click();
    });
  }

  /* Ask Copilot header button removed from mock chrome (page kept for inbox demo). */

})();

(function () {
  /* Tenant Tracker workflow roles. Primary + QC always on; Stats / MW optional. */
  var WF_KEY = 'sphere-tracker-workflow';
  var WF_DEFAULT = { stats: true, mw: true, programsFolders: 'single', versionControl: 'local' };
  /* programsFolders: 'single' = one programs/ tree with editable+locked files
     'dev-qc-prod' = programs/dev (editable) + programs/qc (QC copies) + programs/prod (approved)
     legacy 'dev-prod' is treated as 'dev-qc-prod'
     versionControl: 'local' (default) | 'github' (Enterprise GitHub backend stub) */

  function normalizeProgramsFolderMode(mode) {
    if (mode === 'dev-qc-prod' || mode === 'dev-prod') return 'dev-qc-prod';
    return 'single';
  }

  function normalizeVersionControl(v) {
    return v === 'github' ? 'github' : 'local';
  }

  function readStoredWorkflow() {
    try {
      var raw = localStorage.getItem(WF_KEY);
      if (raw) return JSON.parse(raw) || {};
    } catch (e) {}
    return {};
  }

  function readWorkflowFlags() {
    var o = readStoredWorkflow();
    var has = Object.keys(o).length > 0;
    if (has) {
      return {
        stats: o.stats !== false,
        mw: o.mw !== false,
        programsFolders: normalizeProgramsFolderMode(o.programsFolders),
        versionControl: normalizeVersionControl(o.versionControl)
      };
    }
    return {
      stats: WF_DEFAULT.stats,
      mw: WF_DEFAULT.mw,
      programsFolders: WF_DEFAULT.programsFolders,
      versionControl: WF_DEFAULT.versionControl
    };
  }

  function writeWorkflowFlags(flags) {
    var prev = readWorkflowFlags();
    var next = {
      stats: flags && flags.stats != null ? !!flags.stats : prev.stats,
      mw: flags && flags.mw != null ? !!flags.mw : prev.mw,
      programsFolders: normalizeProgramsFolderMode(
        flags && flags.programsFolders != null ? flags.programsFolders : prev.programsFolders
      ),
      versionControl: normalizeVersionControl(
        flags && flags.versionControl != null ? flags.versionControl : prev.versionControl
      )
    };
    try {
      localStorage.setItem(WF_KEY, JSON.stringify(next));
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('sphere-workflow-change'));
    } catch (e) {}
  }

  function getProgramsFolderMode() {
    return readWorkflowFlags().programsFolders || 'single';
  }

  function isSplitProgramsFolderMode() {
    return getProgramsFolderMode() === 'dev-qc-prod';
  }

  function isQcProgramStatus(status) {
    return status === 'In QC';
  }

  /** Subfolder under programs/ in split mode: dev | qc | prod. */
  function programFolderForStatus(status) {
    if (isProgramEditable(status)) return 'dev';
    if (isQcProgramStatus(status)) return 'qc';
    return 'prod';
  }

  /** Path hint for a program given status + tenant folder mode. */
  function programPathHint(filename, status) {
    var mode = getProgramsFolderMode();
    if (mode === 'dev-qc-prod') {
      return 'programs/' + programFolderForStatus(status) + '/' + filename;
    }
    return 'programs/' + filename;
  }

  function getProgramVersionControl() {
    return readWorkflowFlags().versionControl || 'local';
  }

  /** Ordered review stages after Primary work (In dev / Revise). */
  function getTrackerWorkflow() {
    var f = readWorkflowFlags();
    var stages = [
      { id: 'primary', label: 'Primary', short: 'Primary', role: 'Production programmer', statuses: ['Not started', 'In dev', 'Revise'] },
      { id: 'qc', label: 'QC', short: 'QC', role: 'QC programmer', statuses: ['In QC'] }
    ];
    if (f.stats) {
      stages.push({ id: 'stats', label: 'Stats', short: 'Stats', role: 'Statistician', statuses: ['In Stats'] });
    }
    if (f.mw) {
      stages.push({ id: 'mw', label: 'Medical writing', short: 'MW', role: 'Medical writer', statuses: ['In MW'] });
    }
    stages.push({ id: 'done', label: 'Approved', short: 'Done', role: '—', statuses: ['Approved', 'Frozen'] });
    return { flags: f, stages: stages };
  }

  function isProgramEditable(status) {
    return status === 'In dev' || status === 'Revise';
  }

  /** Next handoff from a status given current tenant workflow. */
  function nextHandoff(status) {
    var f = readWorkflowFlags();
    if (status === 'Not started' || status === 'In dev' || status === 'Revise') {
      return { action: 'to-qc', label: 'Send to QC', nextStatus: 'In QC' };
    }
    if (status === 'In QC') {
      if (f.stats) return { action: 'to-stats', label: 'Send to Stats', nextStatus: 'In Stats' };
      if (f.mw) return { action: 'to-mw', label: 'Send to MW', nextStatus: 'In MW' };
      return { action: 'approve', label: 'Approve', nextStatus: 'Approved' };
    }
    if (status === 'In Stats') {
      if (f.mw) return { action: 'to-mw', label: 'Send to MW', nextStatus: 'In MW' };
      return { action: 'approve', label: 'Approve', nextStatus: 'Approved' };
    }
    if (status === 'In MW') {
      return { action: 'approve', label: 'Approve', nextStatus: 'Approved' };
    }
    return null;
  }

  function returnHandoff(status) {
    if (status === 'In QC' || status === 'In Stats' || status === 'In MW') {
      return { action: 'revise', label: 'Return to Revise', nextStatus: 'Revise' };
    }
    return null;
  }

  window.SPHERE = window.SPHERE || {};
  window.SPHERE.getTrackerWorkflow = getTrackerWorkflow;
  window.SPHERE.setTrackerWorkflowFlags = writeWorkflowFlags;
  window.SPHERE.getTrackerWorkflowFlags = readWorkflowFlags;
  window.SPHERE.isProgramEditable = isProgramEditable;
  window.SPHERE.nextHandoff = nextHandoff;
  window.SPHERE.returnHandoff = returnHandoff;
  window.SPHERE.getProgramsFolderMode = getProgramsFolderMode;
  window.SPHERE.isSplitProgramsFolderMode = isSplitProgramsFolderMode;
  window.SPHERE.programFolderForStatus = programFolderForStatus;
  window.SPHERE.programPathHint = programPathHint;
  window.SPHERE.getProgramVersionControl = getProgramVersionControl;
})();



/* SPHERE a11y: font zoom + contrast (dropdown) */
(function () {
  var ZOOM_STEPS = [85, 90, 100, 110, 125];
  var DEFAULT_ZOOM = 100;

  function readZoom() {
    try {
      var z = parseInt(localStorage.getItem('sphere-ui-zoom'), 10);
      if (ZOOM_STEPS.indexOf(z) >= 0) return z;
    } catch (e) {}
    return DEFAULT_ZOOM;
  }

  function readContrast() {
    try {
      var c = localStorage.getItem('sphere-contrast');
      if (c === 'high' || c === 'low' || c === 'normal') return c;
    } catch (e) {}
    return 'normal';
  }

  function syncMenuState() {
    var z = readZoom();
    var c = readContrast();
    var label = document.getElementById('a11yTriggerLabel');
    if (label) {
      var parts = [];
      if (z !== DEFAULT_ZOOM) parts.push(z + '%');
      if (c === 'high') parts.push('Hi');
      if (c === 'low') parts.push('Lo');
      label.textContent = parts.length ? parts.join(' · ') : 'A11y';
    }
    document.querySelectorAll('.a11y-menu [data-zoom]').forEach(function (btn) {
      var on = parseInt(btn.getAttribute('data-zoom'), 10) === z;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    document.querySelectorAll('.a11y-menu [data-contrast]').forEach(function (btn) {
      var on = btn.getAttribute('data-contrast') === c;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    var out = document.getElementById('a11yZoomOut');
    var inn = document.getElementById('a11yZoomIn');
    if (out) out.disabled = z <= ZOOM_STEPS[0];
    if (inn) inn.disabled = z >= ZOOM_STEPS[ZOOM_STEPS.length - 1];
  }

  function applyZoom(z) {
    if (ZOOM_STEPS.indexOf(z) < 0) z = DEFAULT_ZOOM;
    document.documentElement.setAttribute('data-ui-zoom', String(z));
    document.documentElement.style.setProperty('--ui-zoom', String(z / 100));
    document.documentElement.style.zoom = String(z / 100);
    try { localStorage.setItem('sphere-ui-zoom', String(z)); } catch (e) {}
    syncMenuState();
  }

  function applyContrast(c) {
    if (c !== 'high' && c !== 'low') c = 'normal';
    document.documentElement.setAttribute('data-contrast', c);
    try { localStorage.setItem('sphere-contrast', c); } catch (e) {}
    syncMenuState();
  }

  applyZoom(readZoom());
  applyContrast(readContrast());

  function stepZoom(dir) {
    var z = readZoom();
    var i = ZOOM_STEPS.indexOf(z);
    if (i < 0) i = ZOOM_STEPS.indexOf(DEFAULT_ZOOM);
    i = Math.max(0, Math.min(ZOOM_STEPS.length - 1, i + dir));
    applyZoom(ZOOM_STEPS[i]);
  }

  function initA11yPicker() {
    if (document.getElementById('a11yPicker')) return;
    var themeBtn = document.getElementById('themeToggle');
    if (!themeBtn) return;

    var picker = document.createElement('div');
    picker.className = 'a11y-picker';
    picker.id = 'a11yPicker';
    picker.innerHTML =
      '<button type="button" class="a11y-picker-trigger" id="a11yPickerBtn" aria-haspopup="true" aria-expanded="false" aria-controls="a11yMenu" title="Accessibility" aria-label="Accessibility">' +
        '<span class="a11y-trigger-mark" aria-hidden="true">Aa</span>' +
        '<span class="a11y-trigger-label" id="a11yTriggerLabel">A11y</span>' +
        '<svg class="a11y-picker-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
      '</button>' +
      '<div class="a11y-menu" id="a11yMenu" hidden>' +
        '<div class="a11y-menu-section" role="group" aria-label="Text size">' +
          '<div class="a11y-menu-heading">Text size</div>' +
          '<div class="a11y-zoom-row">' +
            '<button type="button" class="a11y-menu-btn" id="a11yZoomOut" title="Zoom out" aria-label="Zoom out">A−</button>' +
            '<button type="button" class="a11y-menu-btn a11y-menu-btn-reset" id="a11yZoomReset" data-zoom="100" title="Reset zoom" aria-label="Reset zoom to 100%">100%</button>' +
            '<button type="button" class="a11y-menu-btn" id="a11yZoomIn" title="Zoom in" aria-label="Zoom in">A+</button>' +
          '</div>' +
        '</div>' +
        '<div class="a11y-menu-section" role="radiogroup" aria-label="Contrast">' +
          '<div class="a11y-menu-heading">Contrast</div>' +
          '<button type="button" class="a11y-menu-item a11y-menu-item-row" data-contrast="normal" role="menuitemradio" aria-checked="false">Default</button>' +
          '<button type="button" class="a11y-menu-item a11y-menu-item-row" data-contrast="high" role="menuitemradio" aria-checked="false">High contrast</button>' +
          '<button type="button" class="a11y-menu-item a11y-menu-item-row" data-contrast="low" role="menuitemradio" aria-checked="false">Low contrast</button>' +
        '</div>' +
      '</div>';

    themeBtn.insertAdjacentElement('afterend', picker);

    var btn = document.getElementById('a11yPickerBtn');
    var menu = document.getElementById('a11yMenu');

    function setOpen(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) menu.removeAttribute('hidden');
      else menu.setAttribute('hidden', '');
    }
    function isOpen() {
      return btn.getAttribute('aria-expanded') === 'true';
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!isOpen());
    });

    document.getElementById('a11yZoomOut').addEventListener('click', function (e) {
      e.stopPropagation();
      stepZoom(-1);
    });
    document.getElementById('a11yZoomIn').addEventListener('click', function (e) {
      e.stopPropagation();
      stepZoom(1);
    });

    menu.addEventListener('click', function (e) {
      e.stopPropagation();
      var zoomBtn = e.target.closest('[data-zoom]');
      if (zoomBtn) {
        applyZoom(parseInt(zoomBtn.getAttribute('data-zoom'), 10));
        return;
      }
      var contrastBtn = e.target.closest('[data-contrast]');
      if (contrastBtn) {
        applyContrast(contrastBtn.getAttribute('data-contrast'));
      }
    });

    document.addEventListener('click', function (e) {
      if (!picker.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) {
        setOpen(false);
        btn.focus();
      }
    });

    syncMenuState();
    window.SPHERE = window.SPHERE || {};
    window.SPHERE.setUiZoom = applyZoom;
    window.SPHERE.setContrast = applyContrast;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initA11yPicker);
  } else {
    initA11yPicker();
  }
})();


/* Signed-in user chip + logout (all chrome pages) */
(function () {
  function readUser() {
    var name = '';
    var email = '';
    try {
      name = localStorage.getItem('sphere-user-name') || '';
      email = localStorage.getItem('sphere-user-email') || '';
    } catch (e) {}
    if (!name && !email) {
      name = 'Jordan Patel';
      email = 'jordan.patel@acmebiometrics.com';
    } else if (!name && email) {
      name = email.split('@')[0];
    }
    return { name: name, email: email };
  }

  function initUserChrome() {
    if (document.getElementById('userChrome')) return;
    var topRight = document.querySelector('header.top .top-right');
    if (!topRight) return;
    var path = (location.pathname || '').split('/').pop() || '';
    if (/^login\.html$/i.test(path)) return;

    var u = readUser();
    var box = document.createElement('div');
    box.className = 'user-chrome';
    box.id = 'userChrome';
    box.innerHTML =
      '<div class="user-chrome-who" title="' + (u.email || u.name).replace(/"/g, '&quot;') + '">' +
        '<span class="user-chrome-avatar" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5z"/></svg>' +
        '</span>' +
        '<span class="user-chrome-name">' + u.name.replace(/</g, '&lt;') + '</span>' +
        '<button type="button" class="user-chrome-logout" id="btnLogout" title="Sign out" aria-label="Sign out">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" d="M16 17l5-5-5-5"/><path fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" d="M21 12H9"/></svg>' +
        '</button>' +
      '</div>';

    var tenant = topRight.querySelector('.tenant-pill');
    if (tenant) topRight.insertBefore(box, tenant);
    else topRight.appendChild(box);

    var btn = document.getElementById('btnLogout');
    if (btn) {
      btn.addEventListener('click', function () {
        try {
          localStorage.removeItem('sphere-signed-in');
          localStorage.removeItem('sphere-user-name');
          localStorage.removeItem('sphere-user-email');
        } catch (e) {}
        location.href = 'login.html';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserChrome);
  } else {
    initUserChrome();
  }
})();
