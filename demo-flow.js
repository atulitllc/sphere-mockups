/* SPHERE demo flow store — Mock Shells → Tracker → QC → Stats → Released to MW.
   Front-end only; state lives in localStorage so it survives page navigation.
   Reset: add ?reset=1 to any page URL (or Admin → Reset demo data). */
(function () {
  var KEY = 'sphere-demo-flow-v1';
  var STUDY = 'ONC-204-301';
  var CURRENT_USER = 'Jordan Patel';

  function read() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    s = s || {};
    s.shells = s.shells || {};      /* studyId -> shells[] */
    s.records = s.records || [];    /* tracker records created from Mock Shells */
    s.status = s.status || {};      /* program -> status override (existing rows) */
    s.events = s.events || {};      /* program -> [history events] (existing rows) */
    s.sources = s.sources || {};    /* program -> saved source (existing rows) */
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
      localStorage.removeItem('sphere-study-registry-v1');
      justReset = true;
      qs.delete('reset');
      var q = qs.toString();
      history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
    }
  } catch (e) {}

  function qcName(prog) {
    prog = String(prog || '').split('/').pop();
    if (!prog || prog === '—') return '';
    if (/^qc-/i.test(prog)) return prog;
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
  function programHeader(rec, which) {
    var isQc = which === 'qc';
    var prog = isQc ? qcName(rec.program) : rec.program;
    var macro = prog.replace(/\.sas$/i, '').replace(/[^A-Za-z0-9_]/g, '_');
    var date = String(rec.syncedAt || stamp()).slice(0, 10);
    var bar = '*' + new Array(79).join('*');
    var dash = '*' + new Array(79).join('-');
    var outId = (rec.type || 'Table') + ' ' + rec.number;
    var L = [];
    L.push('/' + bar);
    L.push(line('Program', prog + (isQc ? '   [QC / VALIDATION PROGRAM]' : '')));
    L.push(line('Study/Protocol', STUDY + ' (Phase 3)'));
    L.push(line('Output ID', outId));
    L.push(line('Title', rec.title));
    L.push(line('Population', rec.population));
    L.push(line('Source data', (rec.sources || []).join(', ')));
    if (rec.keyVars) L.push(line('Key variables', rec.keyVars));
    if (rec.sortOrder) L.push(line('Sort order', rec.sortOrder));
    L.push(line('Output file', '/studies/onc-204-301/output/tlf/' + (isQc ? 'qc/' : '') + rec.program.replace(/\.sas$/i, '') + (isQc ? '.sas7bdat' : '.rtf')));
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
    { id: 'Demographics', name: 'Demographics', ref: 'SAP §14.1' },
    { id: 'Efficacy', name: 'Efficacy', ref: 'SAP §14.2' },
    { id: 'Safety TLFs', name: 'Safety TLFs', ref: 'SAP §14.3' },
    { id: 'Labs', name: 'Labs', ref: 'SAP §14.3.5' }
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
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} },
    getShells: function (study) { var s = read(); return s.shells[study || STUDY] || null; },
    setShells: function (study, shells) { var s = read(); s.shells[study || STUDY] = shells; write(s); },
    records: function () { return read().records; },
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
    syncShell: function (shell) {
      var s = read();
      var ex = s.records.filter(function (x) { return x.shellId === shell.id; })[0];
      if (ex) return ex;
      var lay = shell.layout || {};
      var now = new Date();
      var rec = {
        id: 'rec-' + String(shell.id).replace(/[^A-Za-z0-9]+/g, '-'),
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
        history: []
      };
      rec.history.push({ at: stamp(now), action: 'Synced from Mock Shells', status: 'Not started', person: CURRENT_USER, note: 'Shell ' + shell.number + ' finalized → tracker record created' });
      rec.history.push({ at: stamp(now), action: 'SAS header generated', status: 'In dev', person: 'SPHERE', note: rec.program + ' + ' + qcName(rec.program) + ' created with standard header' });
      s.records.push(rec);
      write(s);
      return rec;
    },
    programHeader: programHeader,
    getStatus: function (prog) { return read().status[prog] || null; },
    setStatus: function (prog, status) { var s = read(); s.status[prog] = status; write(s); },
    getEvents: function (prog) { return read().events[prog] || []; },
    addEvent: function (prog, ev) { var s = read(); (s.events[prog] = s.events[prog] || []).push(ev); write(s); },
    getSource: function (key) { return read().sources[key] || null; },
    setSource: function (key, src) { var s = read(); s.sources[key] = src; write(s); }
  };
  window.SPHERE_DEMO = api;
})();
