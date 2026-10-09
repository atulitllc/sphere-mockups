/* SPHERE tenant study layout + study registry (demo, localStorage).
   Levels: 1 = {protocol}/subfolders (default) · 2 = {protocol}/{deliverable}/subfolders · 3 = {compound}/{protocol}/{deliverable}/subfolders
   Study paths are always DERIVED from each study's compound/protocol/deliverable metadata + the saved tenant layout. */
(function () {
  var LAYOUT_KEY = 'sphere-tenant-study-layout';
  var REG_KEY = 'sphere-study-registry-v2';
  var SEED_LEVEL = 3;
  var DEFAULT_SUBFOLDERS = ['data/raw', 'sdtm', 'adam', 'programs', 'tlf', 'logs', 'docs'];
  var LEVELS = {
    1: { id: 1, label: 'Protocol', template: '{protocol}/', segs: ['protocol'] },
    2: { id: 2, label: 'Protocol / Deliverable', template: '{protocol}/{deliverable}/', segs: ['protocol', 'deliverable'] },
    3: { id: 3, label: 'Compound / Protocol / Deliverable', template: '{compound}/{protocol}/{deliverable}/', segs: ['compound', 'protocol', 'deliverable'] }
  };
  var SEED = [
    { compound: 'XP-204', protocol: 'ONC-204-301', deliverable: 'CSR', name: 'Metastatic NSCLC', phase: '3', current: true, row: true, created: '2023-03-20', studyType: 'Submission', lead: 'Jordan Patel', statistician: 'Riley Nguyen', fpfv: '2023-04-12', lplv: '2025-11-30', dblock: '2026-03-15', status: 'Active', statusBadge: 'locked' },
    { compound: 'XP-118', protocol: 'ONC-118-402', deliverable: 'CSR', name: 'HER2+ breast cancer', phase: '2', row: true, created: '2024-01-10', studyType: 'DMC', lead: 'Alex Rivera', statistician: 'Dana Brooks', fpfv: '2024-01-08', status: 'Active', statusBadge: 'locked' },
    { compound: 'XV-302', protocol: 'VAC-302-011', deliverable: 'CSR', name: 'RSV vaccine · adults 60 and older', phase: '3', row: true, created: '2024-05-02', studyType: 'Interim analysis', lead: 'Sam Okonkwo', statistician: 'Taylor Kim', fpfv: '2025-09-01', status: 'Startup', statusBadge: 'running' },
    { compound: 'XH-220', protocol: 'HEM-220-015', deliverable: 'CSR', name: 'Relapsed / refractory AML', phase: '1/2', row: true, created: '2024-09-12', studyType: 'Regulatory', lead: 'Chris Nguyen', statistician: 'Priya Shah', fpfv: '2021-06-20', lplv: '2024-02-14', dblock: '2024-05-01', status: 'Closed', statusBadge: 'not-started' },
    { compound: 'XP-204', protocol: 'ONC-204-301', deliverable: 'DSUR', name: 'Metastatic NSCLC · DSUR 2026', phase: '3', created: '2026-07-15', studyType: 'Submission', lead: 'Jordan Patel', statistician: 'Riley Nguyen', status: 'Active', statusBadge: 'locked' },
    { compound: 'XP-204', protocol: 'ONC-204-302', deliverable: 'CSR', name: 'NSCLC 1L combination · CSR', phase: '3', created: '2026-08-01', studyType: 'Submission', lead: 'Jordan Patel', statistician: 'Riley Nguyen', status: 'Active', statusBadge: 'locked' },
    { compound: 'CMP-101', protocol: 'PRO-001', deliverable: 'CSR', name: 'CMP-101 Phase 2 · CSR', phase: '2', created: '2026-03-10', studyType: 'Submission', status: 'Active', statusBadge: 'locked' },
    { compound: 'CMP-101', protocol: 'PRO-001', deliverable: 'DSUR', name: 'CMP-101 · DSUR 2026', phase: '2', created: '2026-05-20', studyType: 'Submission', status: 'Active', statusBadge: 'locked' },
    { compound: 'CMP-101', protocol: 'PRO-002', deliverable: 'CSR', name: 'CMP-101 Phase 3 · CSR', phase: '3', created: '2026-08-18', studyType: 'Submission', status: 'Active', statusBadge: 'locked' }
  ];

  try { if (/[?&]reset=1\b/.test(location.search)) { localStorage.removeItem(REG_KEY); localStorage.removeItem(LAYOUT_KEY); } } catch (e) {}
  function readJson(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function writeJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function getLayout() {
    var l = readJson(LAYOUT_KEY) || {};
    var level = parseInt(l.level, 10);
    if (!LEVELS[level]) level = 1;
    var subs = Array.isArray(l.subfolders) && l.subfolders.length ? l.subfolders : DEFAULT_SUBFOLDERS.slice();
    return { level: level, subfolders: subs };
  }
  function setLayout(patch) {
    var cur = getLayout();
    var next = { level: patch.level != null ? parseInt(patch.level, 10) : cur.level, subfolders: patch.subfolders || cur.subfolders };
    writeJson(LAYOUT_KEY, next);
    try { window.dispatchEvent(new CustomEvent('sphere-study-layout-change', { detail: next })); } catch (e) {}
    return next;
  }
  function tidyName(n) {
    return String(n || '')
      .replace(/\u2014/g, ' · ')
      .replace(/\u2013/g, '-')
      .replace(/\s+-\s+/g, ' · ');
  }
  function matchSeed(e) {
    var hits = SEED.filter(function (s) {
      return s.protocol === e.protocol && s.deliverable === e.deliverable;
    });
    if (!hits.length) return null;
    var named = hits.filter(function (s) {
      return s.created === e.created || tidyName(s.name) === tidyName(e.name) || s.name === e.name;
    });
    return (named[0] || (hits.length === 1 ? hits[0] : null));
  }
  function registry() {
    var r = readJson(REG_KEY);
    var fresh = !Array.isArray(r);
    if (fresh) {
      r = SEED.map(function (e) { return Object.assign({ lead: 'Jordan Patel', statistician: 'Riley Nguyen', sponsor: 'X Pharma' }, e); });
    }
    var changed = fresh;
    r.forEach(function (e) {
      var nextName = tidyName(e.name);
      if (nextName !== e.name) { e.name = nextName; changed = true; }
      var seed = matchSeed(e);
      if (seed) {
        ['studyType', 'fpfv', 'lplv', 'dblock', 'status', 'statusBadge', 'phase'].forEach(function (k) {
          if ((e[k] == null || e[k] === '' || e[k] === '-') && seed[k]) { e[k] = seed[k]; changed = true; }
        });
        if ((!e.lead || e.lead === 'Jordan Patel') && seed.lead && e.lead !== seed.lead) { e.lead = seed.lead; changed = true; }
        if ((!e.statistician || e.statistician === 'Riley Nguyen') && seed.statistician && e.statistician !== seed.statistician) { e.statistician = seed.statistician; changed = true; }
        if (seed.name && (e.name === e.protocol || e.name.indexOf(' · ') < 0 && seed.name.indexOf(' · ') >= 0)) { e.name = seed.name; changed = true; }
      }
      if (!e.sponsor) { e.sponsor = 'X Pharma'; changed = true; }
    });
    if (changed) writeJson(REG_KEY, r);
    return r;
  }
  function segsFor(entry, level) {
    level = level || getLayout().level;
    return LEVELS[level].segs.map(function (k) { return entry[k] || '{' + k + '}'; });
  }
  function pathFor(entry, level) { return segsFor(entry, level).join('/') + '/'; }
  function entryPath(e) { return pathFor(e, getLayout().level); }
  function studyId(e) { return e.protocol || e.compound; }
  function uniq(a) { var o = {}; return a.filter(function (x) { if (!x || o[x]) return false; o[x] = 1; return true; }); }
  function compounds() { return uniq(registry().map(function (e) { return e.compound; })).sort(); }
  function protocols(c) { return uniq(registry().filter(function (e) { return e.compound === c; }).map(function (e) { return e.protocol; })).sort(); }
  function deliverables(c, p) { return uniq(registry().filter(function (e) { return e.compound === c && e.protocol === p; }).map(function (e) { return e.deliverable; })); }
  function exists(entry, level) {
    var p = pathFor(entry, level);
    return registry().some(function (e) { return entryPath(e) === p; });
  }
  function addStudy(entry) {
    var r = registry();
    entry.created = entry.created || new Date().toISOString().slice(0, 10);
    entry.createdLevel = getLayout().level;
    if (!entry.sponsor) entry.sponsor = 'X Pharma';
    r.push(entry);
    writeJson(REG_KEY, r);
    return entry;
  }
  /* Mark one registry row as the study the user is in. Persists in localStorage so Files reloads on it. */
  function setCurrent(entry) {
    if (!entry) return null;
    var r = registry();
    var match = null;
    if (entry.compound && entry.protocol && entry.deliverable) {
      match = r.filter(function (e) {
        return e.compound === entry.compound && e.protocol === entry.protocol && e.deliverable === entry.deliverable;
      })[0] || null;
    }
    if (!match && (entry.protocol || entry.compound)) {
      var id = entry.protocol || entry.compound;
      var hits = r.filter(function (e) { return e.protocol === id || e.compound === id; });
      match = (entry.deliverable && hits.filter(function (e) { return e.deliverable === entry.deliverable; })[0])
        || hits.filter(function (e) { return e.current; })[0]
        || hits[0]
        || null;
    }
    if (!match) return null;
    r.forEach(function (e) { e.current = e === match; });
    writeJson(REG_KEY, r);
    try { sessionStorage.setItem('sphere-open-study', JSON.stringify({ c: match.compound, p: match.protocol, d: match.deliverable })); } catch (err) {}
    try { window.dispatchEvent(new CustomEvent('sphere-current-study', { detail: match })); } catch (err) {}
    return match;
  }
  function removeStudy(entry) {
    var r = registry().filter(function (e) {
      if (entry && entry.compound && entry.protocol && entry.deliverable) {
        return !(e.compound === entry.compound && e.protocol === entry.protocol && e.deliverable === entry.deliverable);
      }
      var id = (entry && (entry.protocol || entry.id)) || entry;
      return e.protocol !== id && e.compound !== id;
    });
    writeJson(REG_KEY, r);
    return r;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  /* Nested tree (compound → protocol → deliverable) for all registry entries (+ optional pending entry). */
  function buildNest(level, extra) {
    var list = registry().slice();
    if (extra) list.push(Object.assign({ pending: true }, extra));
    var root = {};
    list.forEach(function (e) {
      var node = root;
      var segs = e.pending ? segsFor(e, level) : entryPath(e).replace(/\/$/, '').split('/');
      segs.forEach(function (seg, i, arr) {
        node[seg] = node[seg] || { _kids: {}, _pending: false, _entry: null };
        if (i === arr.length - 1) { if (!node[seg]._entry || !node[seg]._entry.current || e.pending) node[seg]._entry = e; if (e.pending) node[seg]._pending = true; }
        if (e.pending) node[seg]._touched = true;
        node = node[seg]._kids;
      });
    });
    return root;
  }
  function treeHtml(opts) {
    opts = opts || {};
    var layout = getLayout();
    var level = opts.level || layout.level;
    var subs = opts.subfolders || layout.subfolders;
    var nest = buildNest(level, opts.pending || null);
    var showSubsFor = opts.pending ? 'pending' : (opts.expandCurrent ? 'current' : null);
    function walk(node, depth) {
      return '<ul class="lt-tree' + (depth ? '' : ' lt-root') + '">' + Object.keys(node).sort().map(function (k) {
        var n = node[k];
        var isLeaf = !!n._entry && !Object.keys(n._kids).length;
        var cls = 'lt-node' + (n._pending ? ' is-new' : '') + (n._touched && !n._pending ? ' is-path' : '') + (n._entry && n._entry.current && !opts.pending ? ' is-current' : '') +
          (opts.activePath && n._entry && entryPath(n._entry) === opts.activePath ? ' is-active' : '');
        var dirHtml = (opts.link && n._entry && !n._pending)
          ? '<a class="lt-dir" href="' + opts.link(n._entry) + '" title="' + esc(entryPath(n._entry)) + '">' + esc(k) + '/</a>'
          : '<span class="lt-dir">' + esc(k) + '/</span>';
        var label = dirHtml + (n._pending ? '<span class="lt-badge">new</span>' : '') +
          (n._entry && n._entry.current && !opts.pending ? '<span class="lt-badge cur">current</span>' : '');
        var inner = '';
        if (Object.keys(n._kids).length) inner = walk(n._kids, depth + 1);
        var expand = isLeaf && ((showSubsFor === 'pending' && n._pending) || (showSubsFor === 'current' && (opts.activePath ? entryPath(n._entry) === opts.activePath : n._entry.current)));
        if (expand) inner += '<ul class="lt-tree lt-subs">' + subs.map(function (s) { return '<li class="lt-node lt-sub"><span class="lt-dir">' + esc(s) + '/</span></li>'; }).join('') + '</ul>';
        return '<li class="' + cls + '">' + label + inner + '</li>';
      }).join('') + '</ul>';
    }
    return walk(nest, 0);
  }
  /* Static example trees for the Admin radio cards. */
  function exampleTreeHtml(level, subs) {
    subs = (subs || getLayout().subfolders).slice(0, 4);
    var more = (subs.length < getLayout().subfolders.length) ? '<li class="lt-node lt-sub lt-more">…</li>' : '';
    function subList() { return '<ul class="lt-tree lt-subs">' + subs.map(function (s) { return '<li class="lt-node lt-sub"><span class="lt-dir">' + esc(s) + '/</span></li>'; }).join('') + more + '</ul>'; }
    function dir(name, inner) { return '<li class="lt-node"><span class="lt-dir">' + esc(name) + '/</span>' + (inner || '') + '</li>'; }
    var body;
    if (level === 1) body = dir('PRO-001', subList()) + dir('PRO-002', '') + dir('ONC-204-301', '');
    else if (level === 2) body = dir('PRO-001', '<ul class="lt-tree">' + dir('CSR', subList()) + dir('DSUR', '') + '</ul>') + dir('PRO-002', '<ul class="lt-tree">' + dir('CSR', '') + '</ul>');
    else body = dir('CMP-101', '<ul class="lt-tree">' + dir('PRO-001', '<ul class="lt-tree">' + dir('CSR', subList()) + dir('DSUR', '') + '</ul>') + dir('PRO-002', '<ul class="lt-tree">' + dir('CSR', '') + '</ul>') + '</ul>');
    return '<ul class="lt-tree lt-root">' + body + '</ul>';
  }

  function openedStudy() {
    try {
      var q = new URLSearchParams(location.search);
      var reg = registry();
      function pick(list) { return list.filter(function (x) { return x.current; })[0] || list[0]; }
      var e = (q.get('path') && pick(reg.filter(function (x) { return entryPath(x) === q.get('path'); }))) ||
        (q.get('study') && pick(reg.filter(function (x) { return studyId(x) === q.get('study'); })));
      if (e) return setCurrent(e) || e;
      if (/studies\.html/.test(location.pathname)) return null;
      var saved = JSON.parse(sessionStorage.getItem('sphere-open-study') || 'null');
      if (saved) return reg.filter(function (x) { return x.compound === saved.c && x.protocol === saved.p && x.deliverable === saved.d; })[0] || null;
    } catch (err) {}
    return null;
  }
  function paintOpenedStudy() {
    var e = openedStudy();
    if (!e) return;
    var path = entryPath(e);
    var label = studyId(e) + (getLayout().level >= 2 && e.deliverable ? ' · ' + e.deliverable : '');
    if (!/studies\.html/.test(location.pathname)) {
      var crumb = document.querySelector('.crumb strong');
      if (crumb) crumb.textContent = label;
      var foot = document.querySelector('.nav-footer');
      if (foot && !/admin\.html/.test(location.pathname)) foot.textContent = label + ' · Phase ' + (e.phase || 'Not set');
    }
    var qs = 'study=' + encodeURIComponent(studyId(e)) + '&path=' + encodeURIComponent(path);
    document.querySelectorAll('a[href^="files.html"]').forEach(function (a) {
      a.setAttribute('href', a.getAttribute('href').split('?')[0] + '?' + qs);
    });
    document.querySelectorAll('.nav a[href^="study-home.html"]').forEach(function (a) {
      a.setAttribute('href', 'study-home.html?' + qs);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', paintOpenedStudy);
  else paintOpenedStudy();

  window.SPHERE_LAYOUT = {
    openedStudy: openedStudy,
    setCurrent: setCurrent,
    removeStudy: removeStudy,
    LEVELS: LEVELS,
    DEFAULT_SUBFOLDERS: DEFAULT_SUBFOLDERS,
    get: getLayout,
    set: setLayout,
    registry: registry,
    compounds: compounds,
    protocols: protocols,
    deliverables: deliverables,
    exists: exists,
    addStudy: addStudy,
    pathFor: pathFor,
    entryPath: entryPath,
    studyId: studyId,
    segsFor: segsFor,
    treeHtml: treeHtml,
    exampleTreeHtml: exampleTreeHtml,
    levelLabel: function (l) { return LEVELS[l || getLayout().level].label; },
    findByPath: function (p) { var m = registry().filter(function (e) { return entryPath(e) === p; }); return m.filter(function (e) { return e.current; })[0] || m[0] || null; },
    /* entries whose folder is the same under the current layout (layout 1: several deliverables share one protocol folder) */
    samePath: function (e) { var p = entryPath(e); return registry().filter(function (x) { return entryPath(x) === p; }); },
    findByProtocol: function (p) { return registry().filter(function (e) { return e.protocol === p || e.compound === p; })[0] || null; },
    reset: function () { try { localStorage.removeItem(REG_KEY); localStorage.removeItem(LAYOUT_KEY); } catch (e) {} }
  };
})();
