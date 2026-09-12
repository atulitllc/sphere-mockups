/* SPHERE mockup chrome: compact accent dropdown (sphere-accent + data-accent) */
(function () {
  var ACCENTS = {
    blue: '#2563EB',
    teal: '#0d9488',
    indigo: '#4f46e5',
    emerald: '#059669',
    slate: '#475569'
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCopilotPanel);
  } else {
    initCopilotPanel();
  }

})();

(function () {
  /* Tenant Tracker workflow roles. Primary + QC always on; Stats / MW optional. */
  var WF_KEY = 'sphere-tracker-workflow';
  var WF_DEFAULT = { stats: true, mw: true, programsFolders: 'single' };
  /* programsFolders: 'single' = one programs/ tree with editable+locked files
     'dev-prod' = programs/dev (editable) + programs/prod (read-only copies) */

  function readWorkflowFlags() {
    try {
      var raw = localStorage.getItem(WF_KEY);
      if (raw) {
        var o = JSON.parse(raw);
        var mode = o.programsFolders === 'dev-prod' ? 'dev-prod' : 'single';
        return {
          stats: o.stats !== false,
          mw: o.mw !== false,
          programsFolders: mode
        };
      }
    } catch (e) {}
    return {
      stats: WF_DEFAULT.stats,
      mw: WF_DEFAULT.mw,
      programsFolders: WF_DEFAULT.programsFolders
    };
  }

  function writeWorkflowFlags(flags) {
    var mode = flags && flags.programsFolders === 'dev-prod' ? 'dev-prod' : 'single';
    try {
      localStorage.setItem(WF_KEY, JSON.stringify({
        stats: !!flags.stats,
        mw: !!flags.mw,
        programsFolders: mode
      }));
    } catch (e) {}
    try {
      window.dispatchEvent(new CustomEvent('sphere-workflow-change'));
    } catch (e) {}
  }

  function getProgramsFolderMode() {
    return readWorkflowFlags().programsFolders || 'single';
  }

  /** Path hint for a program given status + tenant folder mode. */
  function programPathHint(filename, status) {
    var mode = getProgramsFolderMode();
    var editable = isProgramEditable(status);
    if (mode === 'dev-prod') {
      return editable ? ('programs/dev/' + filename) : ('programs/prod/' + filename);
    }
    return 'programs/' + filename;
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
  window.SPHERE.programPathHint = programPathHint;
})();

