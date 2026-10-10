/* SPHERE demo flow store - Mock Shells → Tracker → QC → Stats → Released to MW.
   Front-end only; state lives in localStorage so it survives page navigation.
   Reset: add ?reset=1 to any page URL (or Admin → Reset demo data). */
(function () {
  var KEY = 'sphere-demo-flow-v1';
  var STUDY = 'ONC-204-301';
  var CURRENT_USER = 'Jordan Patel';

  /* PR #19 replaced this across the whole JSON blob, including lookup values.
     Restored keys (one-time, _keyRestore 1):
       templateKey, layout.templateKey, templates[] entries, and any object key
       "Primary endpoint: ORR" -> "Primary endpoint - ORR"
     Left as display text (render-time only, not rewritten here):
       shell/layout title, subtitle, footnotes, notes, subgroup, labelHeader, row labels,
       shellSync title/footnotes, record titles.
     No other stored key matched the old "Primary endpoint" replace. */
  var KEY_RESTORE_VERSION = 1;
  var TEMPLATE_KEY_RESTORE = { 'Primary endpoint: ORR': 'Primary endpoint - ORR' };

  function restoreLookupString(value) {
    return Object.prototype.hasOwnProperty.call(TEMPLATE_KEY_RESTORE, value) ? TEMPLATE_KEY_RESTORE[value] : value;
  }
  function restoreLookupKeys(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(restoreLookupKeys);
      return;
    }
    Object.keys(node).forEach(function (key) {
      var nextKey = restoreLookupString(key);
      if (nextKey !== key) {
        if (!Object.prototype.hasOwnProperty.call(node, nextKey)) node[nextKey] = node[key];
        delete node[key];
        key = nextKey;
      }
      var value = node[key];
      if (key === 'templateKey' && typeof value === 'string') {
        node[key] = restoreLookupString(value);
        return;
      }
      if (key === 'templates' && Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
          if (typeof value[i] === 'string') value[i] = restoreLookupString(value[i]);
          else restoreLookupKeys(value[i]);
        }
        return;
      }
      restoreLookupKeys(value);
    });
  }

  function sourceTextGenerated(text) {
    return /Initial (?:version|QC program) generated from mock shell/.test(String(text || ''));
  }
  function copySourceIfBetter(s, fromKey, toKey) {
    if (!fromKey || !toKey || fromKey === toKey) return;
    var from = s.sources[fromKey];
    if (from == null || from === '') return;
    var to = s.sources[toKey];
    if (to == null || to === '' || (sourceTextGenerated(to) && !sourceTextGenerated(from))) s.sources[toKey] = from;
  }
  /* Main saved 14.1.3 under the record id, and seed QC under the production program name. */
  function aliasSavedSources(s) {
    var home = 'ONC-204-301';
    Object.keys(s.sources || {}).forEach(function (k) {
      var cut = k.lastIndexOf(':');
      if (cut < 0) return;
      var side = k.slice(cut + 1);
      if (side !== 'qc') return;
      var left = k.slice(0, cut);
      var bar = left.indexOf('|');
      if (bar < 0) return;
      var name = left.slice(bar + 1);
      if (!name || /^qc[-_]/i.test(name)) return;
      copySourceIfBetter(s, k, left.slice(0, bar) + '|' + qcName(name) + ':qc');
    });
    (s.records || []).forEach(function (rec) {
      if (!rec || !rec.id || !rec.program) return;
      var scope = rec.study || home;
      var prog = String(rec.program).split('/').pop();
      if (!prog) return;
      copySourceIfBetter(s, scope + '|' + rec.id + ':prod', scope + '|' + prog + ':prod');
      copySourceIfBetter(s, scope + '|' + rec.id + ':qc', scope + '|' + qcName(prog) + ':qc');
      copySourceIfBetter(s, scope + '|' + prog + ':qc', scope + '|' + qcName(prog) + ':qc');
    });
  }
  function scopeFileRenames(s) {
    var home = 'ONC-204-301';
    var raw = s.fileRenames || {};
    var next = {};
    var unscoped = {};
    Object.keys(raw).forEach(function (k) {
      var parts = String(k).split('|');
      if (parts.length >= 3 && parts[0] && parts[parts.length - 1]) next[k] = raw[k];
      else unscoped[k] = raw[k];
    });
    function follow(name) {
      var seen = {};
      var cur = name;
      while (unscoped[cur] && !seen[cur]) {
        seen[cur] = 1;
        cur = unscoped[cur];
      }
      return cur;
    }
    Object.keys(unscoped).forEach(function (oldName) {
      var direct = unscoped[oldName];
      var latest = follow(oldName);
      if (!latest || latest === oldName) return;
      var hits = [];
      function consider(rec) {
        if (!rec || !rec.id) return;
        var i;
        for (i = 0; i < hits.length; i++) if (hits[i].id === rec.id) return;
        hits.push(rec);
      }
      function owns(rec) {
        if (!rec) return false;
        if (rec.program === latest || rec.program === direct) return true;
        var hist = rec.history || [];
        var i;
        for (i = 0; i < hist.length; i++) {
          var act = String((hist[i] && hist[i].action) || '');
          if (act.indexOf('Renamed from ' + oldName + ' to ') === 0 && (rec.program === latest || rec.program === direct)) return true;
        }
        var st = rec.id && s.rowState ? s.rowState[rec.id] : null;
        return !!(st && (st.program === latest || st.program === direct));
      }
      (s.records || []).forEach(function (r) { if (owns(r)) consider(r); });
      Object.keys(s.rowState || {}).forEach(function (id) {
        var st = s.rowState[id];
        if (!st || (st.program !== latest && st.program !== direct)) return;
        var rec = (s.records || []).filter(function (r) { return r && r.id === id; })[0];
        if (rec) consider(rec);
        else if (id.indexOf('seed-') === 0) consider({ id: id, study: home, program: st.program });
      });
      var nonHome = hits.filter(function (r) { return (r.study || home) !== home; });
      var owners = nonHome.length ? nonHome : hits;
      owners.forEach(function (owner) {
        var scope = owner.study || home;
        next[scope + '|' + owner.id + '|' + oldName] = latest;
      });
    });
    s.fileRenames = next;
  }
  function read() {
    var s = null;
    var had = false;
    var parsed = false;
    try {
      var raw = localStorage.getItem(KEY);
      had = raw != null && raw !== '';
      raw = raw || 'null';
      if (raw.indexOf('\u00a7') >= 0) raw = raw.replace(/SAP \u00a7/g, 'SAP ').replace(/\u00a7\s*/g, '');
      s = JSON.parse(raw);
      parsed = true;
    } catch (e) { s = null; }
    s = s || {};
    s.shells = s.shells || {};      /* studyId -> shells[] */
    s.records = s.records || [];    /* tracker records created from Mock Shells */
    s.status = s.status || {};      /* program -> status override (existing rows) */
    s.events = s.events || {};      /* program -> [history events] (existing rows) */
    s.sources = s.sources || {};    /* scope|program:side -> saved source */
    s.roles = s.roles || {};        /* row key -> {prod,qc,stats,mw} role overrides (Roles editor) */
    s.shellSync = s.shellSync || {}; /* study|number -> {title, footnotes, changedAt, why} */
    s.lastRun = s.lastRun || {};     /* program -> ISO time of last completed run */
    s.programTx = s.programTx || []; /* program renames: old, new, user, time */
    s.programByNumber = s.programByNumber || {}; /* study|number -> program file name */
    s.fileRenames = s.fileRenames || {}; /* scope|recordId|old file name -> new file name */
    s.files = s.files || {}; /* scope|filename -> 1 when that program file exists */
    s.rowState = s.rowState || {}; /* record id -> persisted program name and run flags */
    var upgraded = false;
    /* Scope saved sources before key repair so a later walk sees the stored shape. */
    if (!s.sourcesScoped) {
      var migrated = {};
      var home = 'ONC-204-301';
      Object.keys(s.sources).forEach(function (k) {
        if (k.indexOf('|') >= 0) migrated[k] = s.sources[k];
        else migrated[home + '|' + k] = s.sources[k];
      });
      s.sources = migrated;
      s.sourcesScoped = 1;
      upgraded = true;
    }
    /* Carry main's record-id and program:qc saves onto the keys the viewer reads. */
    if (!s.sourcesAliased) {
      aliasSavedSources(s);
      s.sourcesAliased = 1;
      upgraded = true;
    }
    /* Unscoped renames belong to the non-home record that made them. Home keeps its own names. */
    if (!s.renamesScoped) {
      scopeFileRenames(s);
      s.renamesScoped = 1;
      upgraded = true;
    }
    /* Template lookup keys only. Display dashes stay in storage and are tidied at render. */
    if (parsed && had && s._keyRestore !== KEY_RESTORE_VERSION) {
      restoreLookupKeys(s);
      s._keyRestore = KEY_RESTORE_VERSION;
      upgraded = true;
    }
    if (upgraded) write(s);
    return s;
  }
  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function stamp(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
  }
  function hhmm(d) { d = d || new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }

  /* ?reset=1 */
  var justReset = false;
  try {
    var qs = new URLSearchParams(location.search);
    if (qs.get('reset') === '1') {
      localStorage.removeItem(KEY);
      localStorage.removeItem('sphere-study-registry-v2');
      localStorage.removeItem('sphere-tenant-study-layout');
      localStorage.removeItem('sphere-tracker-runtime-rows');
      localStorage.removeItem('sphere-tracker-id-seq');
      localStorage.removeItem('sphere-tracker-job-seq');
      justReset = true;
      qs.delete('reset');
      var q = qs.toString();
      history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
    }
  } catch (e) {}

  function qcName(prog) {
    prog = String(prog || '').split('/').pop();
    if (!prog || prog === '-') return '';
    if (/^qc[-_]/i.test(prog)) return prog;
    return 'qc-' + prog;
  }

  var STOP = { of: 1, and: 1, the: 1, by: 1, to: 1, in: 1, for: 1, with: 1, a: 1, an: 1, on: 1, from: 1, set: 1, analysis: 1, new: 1, table: 1, listing: 1, figure: 1 };
  function programFor(shell) {
    var pre = shell.type === 'Figure' ? 'f_' : (shell.type === 'Listing' ? 'l_' : 't_');
    var num = String(shell.number || '').replace(/[^0-9.]/g, '').replace(/\./g, '_') || 'x';
    var t = String(shell.title || '').toLowerCase()
      .replace(/treatment[- ]emergent adverse events?/g, 'teae').replace(/serious adverse events?/g, 'sae')
      .replace(/adverse events? of special interest/g, 'aesi').replace(/adverse events?/g, 'ae')
      .replace(/concomitant medications?/g, 'cm').replace(/vital signs?/g, 'vs').replace(/overall survival/g, 'os')
      .replace(/objective response rate/g, 'orr').replace(/duration of response/g, 'dor');
    var ABBR = { maximum: 'max', grade: 'gr', laboratory: 'lb', chemistry: 'chem', hematology: 'heme', demographics: 'demog', baseline: 'base', disposition: 'disp',
      characteristics: 'char', summary: 'sum', listing: 'list', severity: 'sev', discontinuation: 'disc', relationship: 'rel', response: 'resp', shifts: 'shift', change: 'chg' };
    var words = t.replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(function (w) { return w && !STOP[w] && w.length > 1; })
      .map(function (w) { return ABBR[w] || w; });
    var slug = words.slice(0, 3).map(function (w) { return w.slice(0, 6); }).join('_') || 'out';
    return pre + num + '_' + slug + '.sas';
  }
  function populationFor(set) {
    var m = {
      Safety: 'Safety analysis set (SAFFL = "Y")',
      ITT: 'Intent-to-treat set (ITTFL = "Y")',
      mITT: 'Modified ITT set (MITTFL = "Y")',
      PP: 'Per-protocol set (PPROTFL = "Y")'
    };
    return m[set] || (set || 'Safety') + ' analysis set';
  }
  function popFlag(set) {
    return { Safety: 'saffl', ITT: 'ittfl', mITT: 'mittfl', PP: 'pprotfl' }[set] || 'saffl';
  }
  function sourcesFor(shell) {
    var t = String(shell.title || '').toLowerCase();
    var sap = shell.sap || '';
    var ds = ['ADAM.ADSL'];
    if (/lab|chem|hemat|shift/.test(t) || sap === 'Labs') ds.push('ADAM.ADLB');
    else if (/vital/.test(t)) ds.push('ADAM.ADVS');
    else if (/con.*med|medication/.test(t)) ds.push('ADAM.ADCM');
    else if (/survival|time to|kaplan|duration/.test(t)) ds.push('ADAM.ADTTE');
    else if (/response|orr|efficacy/.test(t) || sap === 'Efficacy') ds.push('ADAM.ADRS');
    else if (/adverse|teae|ae\b|safety|death|sae/.test(t) || sap === 'Safety TLFs') ds.push('ADAM.ADAE');
    return ds;
  }
  function trackerSap(shell) {
    var sap = shell.sap || '';
    if (sap && sap !== 'Unassigned') return sectionName(sap);
    var n = String(shell.number || '');
    if (/^14\.1/.test(n)) return 'Demographics';
    if (/^14\.2/.test(n)) return 'Efficacy';
    return 'Safety TLFs';
  }
  function rolesFor(shell) {
    return { prod: CURRENT_USER, qc: 'Priya Shah', stats: 'Dana Brooks', mw: 'Avery Lopez' };
  }

  function line(label, val) {
    var l = '* ' + (label + '              ').slice(0, 15) + ': ' + val;
    return l;
  }
  function programScope(rec) {
    var scope = String((rec && rec.study) || STUDY);
    var cut = scope.indexOf('::');
    var protocol = cut < 0 ? scope : scope.slice(0, cut);
    var deliverable = cut < 0 ? 'CSR' : (scope.slice(cut + 2) || 'CSR');
    var root = '/studies/' + protocol.toLowerCase() + '/';
    if (deliverable !== 'CSR') root += deliverable.toLowerCase() + '/';
    var label = deliverable === 'CSR' ? protocol : (protocol + ' / ' + deliverable);
    var phase = '';
    if (window.SPHERE_LAYOUT && SPHERE_LAYOUT.registry) {
      var hit = SPHERE_LAYOUT.registry().filter(function (e) {
        return e.protocol === protocol && (e.deliverable || 'CSR') === deliverable;
      })[0];
      if (hit && hit.phase) phase = ' (Phase ' + hit.phase + ')';
    }
    return { label: label + phase, root: root };
  }
  function datasetFileBase(prog) {
    var file = String(prog || '').split('/').pop().replace(/^qc[-_]/i, '');
    var adam = file.match(/^adam_(ad[a-z0-9]+)/i);
    if (adam) return adam[1].toLowerCase();
    return file.replace(/\.[^.]+$/, '').replace(/^adam_/i, '').toLowerCase();
  }
  function outputFilePath(rec, isQc) {
    var scopeBits = programScope(rec);
    var type = (rec && rec.type) || 'Table';
    var prog = (rec && rec.program) || '';
    if (type === 'Dataset') {
      var ext = /\.r$/i.test(prog) ? '.xpt' : '.sas7bdat';
      var base = datasetFileBase(prog);
      if (isQc) return scopeBits.root + 'data/adam/qc/qc_' + base + ext;
      return scopeBits.root + 'data/adam/' + base + ext;
    }
    var num = String((rec && rec.number) || '').replace(/\./g, '_').replace(/-/g, '_');
    if (!num) {
      var tfl = String(prog).match(/tfl_(\d+(?:_\d+)*)/i);
      num = tfl ? tfl[1].split('_').slice(0, 4).join('_') : 'out';
    }
    var pre = type === 'Figure' ? 'f_' : (type === 'Listing' ? 'l_' : 't_');
    return scopeBits.root + 'output/tlf/' + (isQc ? 'qc/' : '') + pre + num + '.rtf';
  }
  function programHeader(rec, which) {
    var isQc = which === 'qc';
    var prog = isQc ? qcName(rec.program) : rec.program;
    var macro = prog.replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_]/g, '_');
    var date = String(rec.syncedAt || stamp()).slice(0, 10);
    var bar = '*' + new Array(79).join('*');
    var dash = '*' + new Array(79).join('-');
    var outId = (rec.type || 'Table') + ' ' + rec.number;
    var scopeBits = programScope(rec);
    var L = [];
    L.push('/' + bar);
    L.push(line('Program', prog + (isQc ? '   [QC / VALIDATION PROGRAM]' : '')));
    L.push(line('Study/Protocol', scopeBits.label));
    L.push(line('Output ID', outId));
    L.push(line('Title', rec.title));
    L.push(line('Population', rec.population));
    L.push(line('Source data', (rec.sources || []).join(', ')));
    if (rec.keyVars) L.push(line('Key variables', rec.keyVars));
    if (rec.sortOrder) L.push(line('Sort order', rec.sortOrder));
    L.push(line('Output file', outputFilePath(rec, isQc)));
    L.push(line('Mock shell', 'Mock Shells ' + rec.number + ' v' + (rec.shellVersion || '0.1') + ' · synced ' + rec.syncedAt));
    if (isQc) {
      L.push(line('Purpose', 'Independent double programming of ' + rec.program));
      L.push(line('Author', rec.roles.qc + ' (QC programmer)'));
      L.push(line('Production pgm', rec.program + ' by ' + rec.roles.prod));
      L.push(line('Compare', 'PROC COMPARE vs production dataset; 0 diffs expected'));
    } else {
      L.push(line('Author', rec.roles.prod + ' (Production programmer)'));
      L.push(line('QC programmer', rec.roles.qc + ' · ' + qcName(rec.program)));
    }
    L.push(line('Date created', date));
    L.push(line('SAS version', 'SAS 9.4 M8'));
    L.push(dash);
    L.push('* Modification history');
    L.push('* Date        Author          Ver  Description');
    L.push('* ----------  --------------  ---  ------------------------------------------');
    L.push('* ' + date + '  ' + ((isQc ? rec.roles.qc : rec.roles.prod) + '                ').slice(0, 14) + '  1.0  ' +
      (isQc ? 'Initial QC program generated from mock shell' : 'Initial version generated from mock shell'));
    L.push(bar + '/');
    L.push('');
    L.push('%let pgm   = ' + macro + ';');
    L.push('%let outid = ' + rec.number + ';');
    L.push('');
    L.push('%macro ' + macro + ';');
    L.push('');
    L.push('  /* 1. Analysis population */');
    L.push('  data work.adsl;');
    L.push('    set adam.adsl;');
    L.push('    where ' + popFlag(rec.analysisSet) + ' = "Y";');
    L.push('  run;');
    L.push('');
    L.push('  /* 2. Statistics per mock shell layout */');
    (rec.rows || []).slice(0, 12).forEach(function (r) {
      if (r) L.push('  /*    - ' + r + ' */');
    });
    if (rec.columns && rec.columns.length) L.push('  /*    Columns: ' + rec.columns.join(' | ') + ' */');
    L.push('  /* TODO: derive counts / percentages */');
    L.push('');
    if (isQc) {
      L.push('  /* 3. Compare with production output data */');
      L.push('  proc compare base=prod.' + rec.program.replace(/\.sas$/i, '') + ' compare=work.qc_final listall;');
      L.push('  run;');
    } else {
      L.push('  /* 3. Produce output */');
      L.push('  %sphere_rtf(data=work.final, outid=&outid., title=%str(' + rec.title.replace(/[()%;]/g, ' ') + '));');
    }
    L.push('');
    L.push('%mend ' + macro + ';');
    L.push('');
    L.push('%' + macro + ';');
    L.push('');
    return L.join('\n');
  }

  /* Shared SAP sections (Mock Shells TOC groups == Tracker groups) */
  var SEED_SECTIONS = [
    { id: 'Demographics', name: 'Demographics', ref: 'SAP 14.1' },
    { id: 'Efficacy', name: 'Efficacy', ref: 'SAP 14.2' },
    { id: 'Safety TLFs', name: 'Safety TLFs', ref: 'SAP 14.3' },
    { id: 'Labs', name: 'Labs', ref: 'SAP 14.3.5' }
  ];
  function getSections() {
    var s = read();
    if (!Array.isArray(s.sections) || !s.sections.length) return SEED_SECTIONS.map(function (x) { return Object.assign({}, x); });
    return s.sections;
  }
  function setSections(list) {
    var s = read(); s.sections = list; write(s);
    try { window.dispatchEvent(new CustomEvent('sphere-sap-sections-change')); } catch (e) {}
  }
  function sectionPrefix(name) {
    var sec = getSections().filter(function (x) { return x.name === name; })[0];
    var m = sec && /(\d+(?:\.\d+)+)/.exec(sec.ref || '');
    return m ? m[1] : null;
  }
  function addSection(name, ref, index) {
    name = String(name || '').trim();
    if (!name) return null;
    var list = getSections().slice();
    if (list.some(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })) return null;
    var sec = { id: name, name: name, ref: String(ref || '').trim(), created: stamp() };
    if (index == null || index < 0 || index > list.length) list.push(sec); else list.splice(index, 0, sec);
    setSections(list);
    return sec;
  }
  function updateSection(oldName, patch) {
    var list = getSections().slice();
    var sec = list.filter(function (x) { return x.name === oldName; })[0];
    if (!sec) return null;
    var newName = patch.name != null ? String(patch.name).trim() : sec.name;
    if (!newName) return null;
    if (newName !== oldName && list.some(function (x) { return x !== sec && x.name.toLowerCase() === newName.toLowerCase(); })) return null;
    sec.name = newName;
    if (patch.ref != null) sec.ref = String(patch.ref).trim();
    if (patch.index != null) {
      list.splice(list.indexOf(sec), 1);
      list.splice(Math.max(0, Math.min(list.length, patch.index)), 0, sec);
    }
    var st = read();
    st.sections = list;
    if (newName !== oldName) {
      st.records.forEach(function (r) { if (r.sap === oldName) r.sap = newName; });
      Object.keys(st.shells).forEach(function (k) { (st.shells[k] || []).forEach(function (sh) { if (sh.sap === oldName) sh.sap = newName; }); });
    }
    write(st);
    try { window.dispatchEvent(new CustomEvent('sphere-sap-sections-change')); } catch (e) {}
    return sec;
  }
  /* Map an original (seed) section id to its current name (after renames). */
  function sectionName(idOrName) {
    var list = getSections();
    var byName = list.filter(function (x) { return x.name === idOrName; })[0];
    if (byName) return byName.name;
    var byId = list.filter(function (x) { return x.id === idOrName; })[0];
    return byId ? byId.name : idOrName;
  }

  var api = {
    KEY: KEY,
    getSections: getSections,
    setSections: setSections,
    addSection: addSection,
    updateSection: updateSection,
    sectionName: sectionName,
    sectionPrefix: sectionPrefix,
    STUDY: STUDY,
    CURRENT_USER: CURRENT_USER,
    justReset: justReset,
    stamp: stamp,
    hhmm: hhmm,
    qcName: qcName,
    seedFile: seedFile,
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} },
    getShells: function (study) { var s = read(); return s.shells[study || STUDY] || null; },
    setShells: function (study, shells) { var s = read(); s.shells[study || STUDY] = shells; write(s); },
    records: function () { return read().records; },
    /* Records with no study belong to the home CSR board. Other stores are explicit. */
    recordsFor: function (study) {
      var id = study || STUDY;
      return read().records.filter(function (r) { return (r.study || STUDY) === id; });
    },
    addRecord: function (rec) {
      var s = read();
      s.records = s.records || [];
      s.records.push(rec);
      write(s);
      return rec;
    },
    record: function (id) { return read().records.filter(function (r) { return r.id === id; })[0] || null; },
    recordByProgram: function (prog) { return read().records.filter(function (r) { return r.program === prog; })[0] || null; },
    updateRecord: function (id, fn) {
      var s = read();
      var r = s.records.filter(function (x) { return x.id === id; })[0];
      if (!r) return null;
      fn(r);
      write(s);
      return r;
    },
    /* Create (or return existing) tracker record from a finalized mock shell. */
    syncShell: function (shell, study) {
      var s = read();
      var home = study || STUDY;
      var ex = s.records.filter(function (x) {
        return x.shellId === shell.id && (x.study || STUDY) === home;
      })[0];
      if (ex) return ex;
      var lay = shell.layout || {};
      var now = new Date();
      var rec = {
        id: 'rec-' + String(home).replace(/[^A-Za-z0-9]+/g, '-') + '-' + String(shell.id).replace(/[^A-Za-z0-9]+/g, '-'),
        shellId: shell.id,
        number: shell.number,
        title: shell.title,
        type: shell.type || 'Table',
        sap: trackerSap(shell),
        analysisSet: shell.analysisSet || 'Safety',
        population: populationFor(shell.analysisSet),
        sources: shell.datasets ? String(shell.datasets).split(/\s*,\s*/).filter(Boolean).map(function (d) { return /\./.test(d) ? d.toUpperCase() : 'ADAM.' + d.toUpperCase(); }) : sourcesFor(shell),
        keyVars: shell.keyVars || '',
        sortOrder: shell.sortOrder || '',
        shellVersion: shell.version || '1.0',
        columns: (lay.columns || []).slice(0, 6),
        rows: (lay.rows || []).map(function (r) { return String(r.label || '').trim(); }).filter(Boolean),
        program: programFor(shell),
        status: 'In dev',
        roles: rolesFor(shell),
        syncedAt: stamp(now),
        isNew: true,
        history: [],
        study: home
      };
      rec.history.push({ at: stamp(now), action: 'Synced from Mock Shells', status: 'Not started', person: CURRENT_USER, note: 'Shell ' + shell.number + ' finalized → tracker record created' });
      rec.history.push({ at: stamp(now), action: 'SAS header generated', status: 'In dev', person: 'SPHERE', note: rec.program + ' + ' + qcName(rec.program) + ' created with standard header' });
      s.records.push(rec);
      s.files[home + '|' + rec.program] = 1;
      s.sources[home + '|' + rec.program + ':prod'] = programHeader(rec, 'prod');
      var qcProg = qcName(rec.program);
      if (qcProg) {
        s.files[home + '|' + qcProg] = 1;
        s.sources[home + '|' + qcProg + ':qc'] = programHeader(rec, 'qc');
      }
      write(s);
      return rec;
    },
    programHeader: programHeader,
    getStatus: function (prog) {
      var s = read();
      if (!prog || !Object.prototype.hasOwnProperty.call(s.status, prog)) return null;
      return s.status[prog];
    },
    /* Record the row's real status the first time we see it. Does not move a status that is already stored. */
    rememberStatus: function (prog, status) {
      if (!prog || !status) return null;
      var s = read();
      if (Object.prototype.hasOwnProperty.call(s.status, prog)) return s.status[prog];
      s.status[prog] = status;
      write(s);
      return status;
    },
    /* Frozen is allowed only when the stored status is Approved. The from argument is not the current status. */
    setStatus: function (prog, status) {
      var s = read();
      var has = Object.prototype.hasOwnProperty.call(s.status, prog);
      var current = has ? s.status[prog] : null;
      if (status === 'Frozen' && current !== 'Approved') return null;
      s.status[prog] = status;
      write(s);
      return status;
    },
    getEvents: function (prog) { return read().events[prog] || []; },
    getRoles: function (key) { return read().roles[key] || null; },
    setRoles: function (key, roles) { var s = read(); s.roles[key] = roles; write(s); },
    eventKey: function (ev) {
      if (!ev) return '';
      if (ev.id) return String(ev.id);
      return [ev.at, ev.action, ev.status, ev.person, ev.note, ev.comment, ev.justification, ev.from, ev.to].join('\u0001');
    },
    newEventId: function () {
      return 'ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    },
    addEvent: function (prog, ev) {
      if (!prog || !ev) return;
      var s = read();
      if (!ev.id) ev.id = api.newEventId();
      var list = s.events[prog] = s.events[prog] || [];
      var id = String(ev.id);
      for (var i = 0; i < list.length; i++) {
        if (list[i] && list[i].id && String(list[i].id) === id) return;
      }
      list.push(ev);
      write(s);
    },
    /* Fold alias keys into one list and drop duplicate events already stored under more than one key. */
    mergeEvents: function (canon, aliases) {
      if (!canon) return [];
      var s = read();
      var keys = [canon].concat(aliases || []);
      var seen = {};
      var out = [];
      var changed = false;
      keys.forEach(function (k) {
        if (!k) return;
        (s.events[k] || []).forEach(function (ev) {
          if (!ev) return;
          /* Id-less copies from older saves collapse once. A new rename always carries its own id. */
          if (!ev.id) { ev.id = api.eventKey(ev); changed = true; }
          var id = String(ev.id);
          if (seen[id]) { changed = true; return; }
          seen[id] = 1;
          out.push(ev);
        });
      });
      var prev = JSON.stringify(s.events[canon] || []);
      s.events[canon] = out;
      if (JSON.stringify(out) !== prev) changed = true;
      keys.forEach(function (k) {
        if (!k || k === canon || !s.events[k]) return;
        delete s.events[k];
        changed = true;
      });
      if (changed) write(s);
      return out;
    },
    getSource: function (key) { return read().sources[key] || null; },
    setSource: function (key, src) { var s = read(); s.sources[key] = src; write(s); },
    fileExists: function (scope, name) {
      var n = String(name || '').split('/').pop();
      if (!n) return false;
      return !!read().files[String(scope || STUDY) + '|' + n];
    },
    noteFile: function (scope, name) {
      var n = String(name || '').split('/').pop();
      if (!n || n === '-') return;
      var key = String(scope || STUDY) + '|' + n;
      var s = read();
      if (s.files[key]) return;
      s.files[key] = 1;
      write(s);
    },
    forgetFile: function (scope, name) {
      var n = String(name || '').split('/').pop();
      if (!n) return;
      var key = String(scope || STUDY) + '|' + n;
      var s = read();
      if (!s.files[key]) return;
      delete s.files[key];
      write(s);
    },
    rowState: function (id) {
      if (!id) return null;
      return read().rowState[id] || null;
    },
    setRowState: function (id, patch) {
      if (!id) return null;
      var s = read();
      s.rowState[id] = Object.assign({}, s.rowState[id] || {}, patch || {});
      write(s);
      return s.rowState[id];
    },
    retargetProgramText: function (text, sourceId, destId) {
      if (!text || !destId || sourceId === destId) return text || '';
      var src = programScope({ study: sourceId || STUDY });
      var dst = programScope({ study: destId });
      var out = String(text);
      if (src.root && src.root !== dst.root) out = out.split(src.root).join(dst.root);
      if (src.label && src.label !== dst.label) out = out.split(src.label).join(dst.label);
      var srcProto = String(sourceId || STUDY).split('::')[0];
      out = out.split('\n').map(function (line) {
        if (!/Study\/Protocol|Output file/.test(line)) return line;
        if (srcProto && line.indexOf(srcProto) >= 0 && line.indexOf(dst.label) < 0) return line.split(srcProto).join(dst.label);
        return line;
      }).join('\n');
      return out;
    },
    moveProgramStorage: function (info) {
      if (!info || !info.oldName || !info.newName || info.oldName === info.newName) return null;
      var s = read();
      var scope = info.scope || STUDY;
      function moveSource(oldName, newName, side) {
        if (!oldName || !newName || oldName === newName) return;
        var from = scope + '|' + oldName + ':' + side;
        var to = scope + '|' + newName + ':' + side;
        if (s.sources[from] != null && s.sources[to] == null) s.sources[to] = s.sources[from];
        if (s.sources[from] != null) delete s.sources[from];
      }
      function moveFile(oldName, newName) {
        if (!oldName || !newName || oldName === newName) return;
        var from = scope + '|' + oldName;
        var to = scope + '|' + newName;
        if (s.files[from] && !s.files[to]) s.files[to] = 1;
        if (s.files[from]) delete s.files[from];
      }
      function stemOf(name) {
        return String(name || '').replace(/\.[^.]+$/, '');
      }
      function retitle(text, pairs) {
        var out = text == null ? '' : String(text);
        return out.split('\n').map(function (row) {
          if (/Output file/.test(row)) return row;
          var next = row;
          pairs.forEach(function (pair) {
            if (!pair[0] || !pair[1] || pair[0] === pair[1]) return;
            next = next.split(pair[0]).join(pair[1]);
          });
          return next;
        }).join('\n');
      }
      moveSource(info.oldName, info.newName, 'prod');
      moveSource(info.oldQc, info.newQc, 'qc');
      var pairs = [
        [info.oldName, info.newName],
        [info.oldQc, info.newQc],
        [stemOf(info.oldName), stemOf(info.newName)],
        [stemOf(info.oldQc), stemOf(info.newQc)]
      ];
      ['prod', 'qc'].forEach(function (side) {
        var name = side === 'qc' ? info.newQc : info.newName;
        if (!name) return;
        var key = scope + '|' + name + ':' + side;
        if (s.sources[key] != null) s.sources[key] = retitle(s.sources[key], pairs);
      });
      moveFile(info.oldName, info.newName);
      moveFile(info.oldQc, info.newQc);
      var canon = info.recordId || info.newName;
      if (info.oldName && Object.prototype.hasOwnProperty.call(s.status, info.oldName)) {
        if (!Object.prototype.hasOwnProperty.call(s.status, canon)) s.status[canon] = s.status[info.oldName];
        delete s.status[info.oldName];
      }
      if (info.newName && info.newName !== canon && Object.prototype.hasOwnProperty.call(s.status, info.newName)) {
        if (!Object.prototype.hasOwnProperty.call(s.status, canon)) s.status[canon] = s.status[info.newName];
        delete s.status[info.newName];
      }
      if (info.recordId) {
        var prev = s.rowState[info.recordId] || {};
        s.rowState[info.recordId] = Object.assign({}, prev, info.state || {}, {
          program: info.newName,
          origProgram: prev.origProgram || info.origProgram || info.oldName
        });
      }
      var renamePrefix = scope + '|' + (info.recordId || '') + '|';
      Object.keys(s.fileRenames).forEach(function (k) {
        if (k.indexOf(renamePrefix) === 0 && s.fileRenames[k] === info.oldName) s.fileRenames[k] = info.newName;
      });
      s.fileRenames[renamePrefix + info.oldName] = info.newName;
      write(s);
      return s.rowState[info.recordId] || null;
    },
    /* SPH-R-701: title and footnotes only. Programming notes and subgroup are not synced. */
    noteShellContent: function (study, info) {
      if (!info || !info.number) return null;
      var changed = info.changed || [];
      if (!changed.length) return null;
      var s = read();
      var key = (study || STUDY) + '|' + info.number;
      var title = String(info.title || '');
      var footnotes = String(info.footnotes || '');
      var parts = changed.filter(function (c) { return c === 'title' || c === 'footnotes'; });
      if (!parts.length) return null;
      var prev = s.shellSync[key];
      var stillPending = prev && prev.pending && prev.pending.length && !(prev.clearedAt && prev.changedAt && prev.clearedAt >= prev.changedAt);
      var pending = stillPending ? prev.pending.slice() : [];
      parts.forEach(function (c) { if (pending.indexOf(c) < 0) pending.push(c); });
      var names = pending.map(function (c) { return c === 'title' ? 'Title' : 'Footnotes'; });
      var rec = {
        number: String(info.number),
        title: title,
        footnotes: footnotes,
        changedAt: new Date().toISOString(),
        changed: pending,
        pending: pending,
        clearedAt: '',
        why: 'Changed in mock shell: ' + names.join(', ')
      };
      s.shellSync[key] = rec;
      s.records.forEach(function (r) {
        if ((r.study || STUDY) !== (study || STUDY)) return;
        var hit = (info.shellId && r.shellId === info.shellId) || String(r.number) === String(info.number);
        if (!hit) return;
        if (pending.indexOf('title') >= 0) r.title = title;
        if (pending.indexOf('footnotes') >= 0) r.footnotes = footnotes;
      });
      write(s);
      return rec;
    },
    shellContent: function (study, number) {
      var s = read();
      return s.shellSync[(study || STUDY) + '|' + number] || null;
    },
    rerunWhy: function (study, number, lastRunIso) {
      var rec = api.shellContent(study, number);
      if (!rec || !rec.changedAt || !rec.pending || !rec.pending.length) return '';
      if (lastRunIso && String(lastRunIso) >= rec.changedAt) return '';
      return rec.why || '';
    },
    markProgramRan: function (prog, iso, shellNumber, study) {
      var name = String(prog || '').split('/').pop();
      if (!name) return;
      var s = read();
      var when = iso || new Date().toISOString();
      var scope = study || STUDY;
      s.lastRun[scope + '|' + name] = when;
      if (scope === STUDY) s.lastRun[name] = when;
      var num = shellNumber ? String(shellNumber) : '';
      var prefix = scope + '|';
      Object.keys(s.shellSync).forEach(function (k) {
        if (k.indexOf(prefix) !== 0) return;
        var rec = s.shellSync[k];
        if (!rec || !num || String(rec.number) !== num) return;
        rec.pending = [];
        rec.changed = [];
        rec.clearedAt = when;
        rec.why = '';
      });
      write(s);
    },
    renameProgram: function (info) {
      if (!info || !info.newName || info.oldName === info.newName) return null;
      var s = read();
      var when = new Date().toISOString();
      var user = info.user || CURRENT_USER;
      var tx = {
        at: when,
        oldName: info.oldName || '',
        newName: info.newName,
        user: user,
        study: info.study || STUDY,
        shellId: info.shellId || '',
        number: info.number || '',
        action: 'Renamed from ' + (info.oldName || '') + ' to ' + info.newName
      };
      s.programTx.push(tx);
      if (info.number) s.programByNumber[(info.study || STUDY) + '|' + info.number] = info.newName;
      if (info.oldName) {
        var renameScope = info.study || STUDY;
        var renameId = info.recordId || info.shellId || info.number || '';
        var renamePrefix = renameScope + '|' + renameId + '|';
        Object.keys(s.fileRenames).forEach(function (k) {
          if (k.indexOf(renamePrefix) === 0 && s.fileRenames[k] === info.oldName) s.fileRenames[k] = info.newName;
        });
        s.fileRenames[renamePrefix + info.oldName] = info.newName;
      }
      (s.records || []).forEach(function (r) {
        if ((r.study || STUDY) !== (info.study || STUDY)) return;
        var hit = (info.shellId && r.shellId === info.shellId) ||
          (info.oldName && r.program === info.oldName) ||
          (info.number && String(r.number) === String(info.number));
        if (!hit) return;
        r.program = info.newName;
        r.history = r.history || [];
        r.history.push({ at: when, action: tx.action, person: user, oldName: tx.oldName, newName: info.newName, note: '' });
      });
      if (info.oldName && s.status[info.oldName]) {
        s.status[info.newName] = s.status[info.oldName];
        delete s.status[info.oldName];
      }
      if (info.oldName) {
        (s.events[info.newName] = s.events[info.newName] || s.events[info.oldName] || []).push({
          id: 'ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8),
          at: stamp(new Date()), action: tx.action, person: user, status: '', note: '', oldName: tx.oldName, newName: info.newName
        });
      }
      function moveStoredName(oldName, newName) {
        if (!oldName || !newName || oldName === newName) return;
        var scope = info.study || STUDY;
        var fromFile = scope + '|' + oldName;
        var toFile = scope + '|' + newName;
        var existed = !!s.files[fromFile] || seedFile(scope, oldName);
        if (s.files[fromFile] && !s.files[toFile]) s.files[toFile] = s.files[fromFile];
        if (s.files[fromFile]) delete s.files[fromFile];
        if (existed) s.files[toFile] = s.files[toFile] || 1;
        ['prod', 'qc'].forEach(function (side) {
          var from = scope + '|' + oldName + ':' + side;
          var to = scope + '|' + newName + ':' + side;
          if (s.sources[from] == null) return;
          var text = String(s.sources[from]);
          if (s.sources[to] == null) s.sources[to] = text.split(oldName).join(newName);
          delete s.sources[from];
        });
        if (s.lastRun[fromFile] && !s.lastRun[toFile]) s.lastRun[toFile] = s.lastRun[fromFile];
        if (scope === STUDY && s.lastRun[oldName] && !s.lastRun[newName]) s.lastRun[newName] = s.lastRun[oldName];
      }
      function pinProgram(id) {
        if (!id) return;
        var prev = s.rowState[id] || {};
        s.rowState[id] = Object.assign({}, prev, {
          program: info.newName,
          origProgram: prev.origProgram || info.oldName || ''
        });
      }
      if (info.oldName) {
        moveStoredName(info.oldName, info.newName);
        moveStoredName(qcName(info.oldName), qcName(info.newName));
      }
      pinProgram(info.recordId);
      pinProgram(info.shellId);
      if (info.number) {
        pinProgram('num:' + info.number);
        pinProgram('seed-' + info.number);
        pinProgram('rec-' + String(info.number).replace(/\./g, '-'));
      }
      (s.records || []).forEach(function (r) {
        if (r && r.program === info.newName && (r.study || STUDY) === (info.study || STUDY)) pinProgram(r.id);
      });
      write(s);
      return tx;
    },
    programTransactions: function () { return read().programTx.slice(); },
    programForNumber: function (study, number) {
      return read().programByNumber[(study || STUDY) + '|' + number] || '';
    },
    fileRenames: function (scope) {
      var map = read().fileRenames || {};
      var want = String(scope || '');
      var out = {};
      if (!want) return out;
      var prefix = want + '|';
      Object.keys(map).forEach(function (k) {
        if (k.indexOf(prefix) !== 0) return;
        var rest = k.slice(prefix.length);
        var bar = rest.indexOf('|');
        var oldName = bar < 0 ? rest : rest.slice(bar + 1);
        if (!oldName || oldName === map[k]) return;
        out[oldName] = map[k];
      });
      return out;
    },
    outputFilePath: outputFilePath,
    lastRun: function (prog, study) {
      var name = String(prog || '').split('/').pop();
      var s = read();
      var scope = study || STUDY;
      if (s.lastRun[scope + '|' + name]) return s.lastRun[scope + '|' + name];
      if (scope === STUDY) return s.lastRun[name] || '';
      return '';
    },
    /* SPH-R-602: Tracker send-to-QC moves the linked shell in that same scope to In Review. */
    noteShellSentToQc: function (number, study) {
      var num = String(number || '');
      if (!num) return null;
      var scope = study || STUDY;
      var s = read();
      var user = CURRENT_USER;
      try { if (window.SPHERE_ACCESS && SPHERE_ACCESS.username) user = SPHERE_ACCESS.username() || user; } catch (e) {}
      var at = new Date().toISOString();
      var list = s.shells[scope];
      if (list && list.length) {
        var sh = null;
        for (var i = 0; i < list.length; i++) if (String(list[i].number) === num) sh = list[i];
        if (!sh) return null;
        var cur = sh.status === 'In review' ? 'In Review' : (sh.status === 'Locked' ? 'Final' : (sh.status || 'Draft'));
        if (cur === 'In Review') return sh;
        sh.statusHistory = sh.statusHistory || [];
        sh.statusHistory.push({ user: user, at: at, from: cur, to: 'In Review', reason: '', cause: 'Tracker record sent to QC' });
        sh.status = 'In Review';
        sh.qc = 'In Review';
        write(s);
        return sh;
      }
      s.qcShell = s.qcShell || {};
      s.qcShell[scope + '|' + num] = { user: user, at: at, cause: 'Tracker record sent to QC' };
      write(s);
      return { queued: true, number: num, study: scope };
    },
    applyQueuedQc: function (study, shells) {
      var s = read();
      var scope = study || STUDY;
      var qmap = s.qcShell || {};
      var changed = false;
      (shells || []).forEach(function (sh) {
        var num = String(sh.number);
        var q = qmap[scope + '|' + num];
        if (!q && scope === STUDY) q = qmap[num];
        if (!q) return;
        var cur = sh.status === 'In review' ? 'In Review' : (sh.status === 'Locked' ? 'Final' : (sh.status || 'Draft'));
        if (cur !== 'In Review') {
          sh.statusHistory = sh.statusHistory || [];
          sh.statusHistory.push({ user: q.user, at: q.at, from: cur, to: 'In Review', reason: '', cause: 'Tracker record sent to QC' });
          sh.status = 'In Review';
          sh.qc = 'In Review';
        }
        delete qmap[scope + '|' + num];
        if (scope === STUDY) delete qmap[num];
        changed = true;
      });
      if (changed) {
        s.shells[scope] = shells;
        s.qcShell = qmap;
        write(s);
      }
      return shells;
    }
  };
  /* Home-board programs that exist before Tracker has loaded. QC only where the seed opened with one. */
  var HOME_SEED_FILES = {
    'tfl_14_1_1_demog.R': 1,
    'adam_adsl.sas': 1,
    'tfl_14_1_2_base.R': 1,
    'tfl_14_2_1_orr.R': 1,
    'tfl_14_2_3_orr_dorr.sas': 1,
    'adam_adae.sas': 1,
    'tfl_14_3_1_ae.R': 1,
    'tfl_14_3_8_cm.sas': 1,
    'tfl_14_3_1_1_ae_soc_pt.R': 1,
    'tfl_14_3_1_2_sae_rel.R': 1,
    'tfl_14_3_1_3_ae_disc.R': 1,
    'tfl_14_3_1_4_ae_g3.R': 1,
    'tfl_14_3_1_5_aesi.R': 1,
    'tfl_14_3_1_6_ae_ttf.R': 1,
    'tfl_14_3_2_1_sae_list.R': 1,
    'tfl_14_3_2_2_death_list.R': 1,
    'tfl_14_3_3_ae_sev.R': 1,
    'tfl_14_3_4_ae_common.R': 1,
    'tfl_14_3_5_lb.R': 1,
    'tfl_14_3_5_1_lb_chem.sas': 1,
    'tfl_14_3_5_2_lb_heme.R': 1,
    't_14_1_3_subj_disp.sas': 1,
    'qc-t_14_1_3_subj_disp.sas': 1
  };
  function seedFile(scope, name) {
    var n = String(name || '').split('/').pop();
    if (!n) return false;
    if (String(scope || STUDY) !== STUDY) return false;
    return !!HOME_SEED_FILES[n];
  }
  /* 14.1.3 is a catalog shell with a Tracker record that the static board omitted. */
  (function ensureDispositionRecord() {
    var s = read();
    var id = 'rec-14-1-3';
    var rec = (s.records || []).filter(function (r) {
      if (!r) return false;
      if (r.id === id) return true;
      return r.shellId === '14.1.3' && (r.study || STUDY) === STUDY;
    })[0];
    var changed = false;
    if (!rec) {
      rec = {
        id: id,
        shellId: '14.1.3',
        number: '14.1.3',
        title: 'Subject disposition',
        type: 'Table',
        sap: 'Demographics',
        analysisSet: 'ITT',
        population: 'Intent-to-treat set (ITTFL = "Y")',
        sources: ['ADAM.ADSL', 'ADAM.ADDS'],
        keyVars: 'USUBJID, TRT01P, RANDFL, SAFFL, EOTSTT, DCTREAS, EOSSTT, DCSREAS',
        sortOrder: 'Status then reason (descending frequency)',
        shellVersion: '1.0',
        program: 't_14_1_3_subj_disp.sas',
        status: 'In dev',
        roles: { prod: CURRENT_USER, qc: 'Priya Shah', stats: 'Dana Brooks', mw: 'Avery Lopez' },
        syncedAt: '2026-09-02 11:05',
        isNew: false,
        history: [{ at: '2026-09-02 11:05', action: 'Synced from Mock Shells', status: 'In dev', person: CURRENT_USER, note: 'Shell 14.1.3' }]
      };
      s.records.push(rec);
      changed = true;
    }
    if (!rec.program) { rec.program = 't_14_1_3_subj_disp.sas'; changed = true; }
    if (!rec.roles) {
      rec.roles = { prod: CURRENT_USER, qc: 'Priya Shah', stats: 'Dana Brooks', mw: 'Avery Lopez' };
      changed = true;
    }
    var home = rec.study || STUDY;
    function ensureSide(name, side) {
      if (!name) return;
      var fileKey = home + '|' + name;
      var sourceKey = fileKey + ':' + side;
      if (!s.files[fileKey]) { s.files[fileKey] = 1; changed = true; }
      var current = s.sources[sourceKey];
      if (current && !sourceTextGenerated(current)) return;
      var saved = '';
      var legacy = [home + '|' + rec.id + ':' + side];
      if (rec.program) legacy.push(home + '|' + String(rec.program).split('/').pop() + ':' + side);
      var i;
      for (i = 0; i < legacy.length; i++) {
        var text = s.sources[legacy[i]];
        if (text && !sourceTextGenerated(text)) { saved = text; break; }
      }
      if (saved) {
        if (current !== saved) { s.sources[sourceKey] = saved; changed = true; }
        return;
      }
      if (!current) { s.sources[sourceKey] = programHeader(rec, side); changed = true; }
    }
    ensureSide(rec.program, 'prod');
    ensureSide(qcName(rec.program), 'qc');
    if (changed) write(s);
  })();
  /* Studies list counts: Mock Shells, TLFs, SDTM and ADaM datasets per study store.
     Home study (ONC-204-301 CSR) uses its demo data: the Mock Shells catalog (22 seed
     shells, or the saved catalog), the static Tracker board (20 Table/Listing/Figure
     rows) plus Tracker records saved for that store, File Explorer sdtm/ datasets, and
     ADaM datasets from adam/ plus Tracker Dataset rows. Other stores use a saved
     catalog and saved records when present, otherwise stable numbers seeded from the
     store id, scaled down for studies still in startup. */
  var HOME_COUNTS = {
    shells: 22,
    tlf: 20,
    sdtm: ['AE', 'DM', 'EX', 'VS'],
    adam: ['ADSL', 'ADAE', 'ADTTE']
  };
  function seedHash(str) {
    var h = 2166136261;
    str = String(str || '');
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function datasetName(rec) {
    var t = String(rec.title || rec.program || '').split(/\s|·/)[0];
    return t.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  }
  api.studyCounts = function (storeId, meta) {
    meta = meta || {};
    var id = storeId || STUDY;
    var s = read();
    var saved = s.shells[id];
    var recs = (s.records || []).filter(function (r) { return r && (r.study || STUDY) === id; });
    var recTlf = recs.filter(function (r) { return /^(Table|Listing|Figure)$/i.test(r.type || 'Table'); }).length;
    var recData = recs.filter(function (r) { return /^Dataset$/i.test(r.type || ''); });
    var out;
    if (id === STUDY) {
      var adam = {};
      HOME_COUNTS.adam.forEach(function (n) { adam[n] = 1; });
      recData.forEach(function (r) { var n = datasetName(r); if (/^AD/.test(n)) adam[n] = 1; });
      out = {
        shells: saved && saved.length ? saved.length : HOME_COUNTS.shells,
        tlf: HOME_COUNTS.tlf + recTlf,
        sdtm: HOME_COUNTS.sdtm.length,
        adam: Object.keys(adam).length,
        seeded: false
      };
    } else {
      var h = seedHash(id);
      var csr = !meta.deliverable || meta.deliverable === 'CSR';
      var startup = /startup/i.test(meta.status || '');
      var shells = csr ? 24 + h % 23 : 8 + h % 9;
      var tlf = Math.round(shells * (0.78 + ((h >>> 5) % 20) / 100));
      var sdtm = csr ? 14 + (h >>> 9) % 11 : 8 + (h >>> 9) % 6;
      var adamN = csr ? 8 + (h >>> 13) % 8 : 4 + (h >>> 13) % 4;
      if (startup) {
        shells = Math.max(3, Math.round(shells * 0.45));
        tlf = Math.round(tlf * 0.12);
        sdtm = 2 + (h >>> 17) % 5;
        adamN = (h >>> 21) % 3;
      }
      out = {
        shells: saved && saved.length ? saved.length : shells,
        tlf: tlf + recTlf,
        sdtm: sdtm,
        adam: adamN + recData.length,
        seeded: !(saved && saved.length)
      };
    }
    return out;
  };
  window.SPHERE_DEMO = api;
})();
