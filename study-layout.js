/* SPHERE tenant study layout + study registry (demo, localStorage).
   Levels: 1 = {compound}/subfolders · 2 = {compound}/{protocol}/subfolders · 3 = {compound}/{protocol}/{deliverable}/subfolders */
(function () {
  var LAYOUT_KEY = 'sphere-tenant-study-layout';
  var REG_KEY = 'sphere-study-registry-v1';
  var SEED_LEVEL = 3;
  var DEFAULT_SUBFOLDERS = ['data/raw', 'sdtm', 'adam', 'programs', 'tlf', 'logs', 'docs'];
  var LEVELS = {
    1: { id: 1, label: 'Compound', template: '{compound}/', segs: ['compound'] },
    2: { id: 2, label: 'Compound / Protocol', template: '{compound}/{protocol}/', segs: ['compound', 'protocol'] },
    3: { id: 3, label: 'Compound / Protocol / Deliverable', template: '{compound}/{protocol}/{deliverable}/', segs: ['compound', 'protocol', 'deliverable'] }
  };
  var SEED = [
    { compound: 'XP-204', protocol: 'ONC-204-301', deliverable: 'CSR', name: 'Metastatic NSCLC', phase: '3', current: true, row: true, created: '2023-03-20' },
    { compound: 'XP-118', protocol: 'ONC-118-402', deliverable: 'CSR', name: 'ONC-118-402', row: true, created: '2024-01-10' },
    { compound: 'XV-302', protocol: 'VAC-302-011', deliverable: 'CSR', name: 'VAC-302-011', row: true, created: '2024-05-02' },
    { compound: 'XH-220', protocol: 'HEM-220-015', deliverable: 'CSR', name: 'HEM-220-015', row: true, created: '2024-09-12' },
    { compound: 'XP-204', protocol: 'ONC-204-301', deliverable: 'DSUR', name: 'Metastatic NSCLC — DSUR 2026', phase: '3', created: '2026-07-15' },
    { compound: 'XP-204', protocol: 'ONC-204-302', deliverable: 'CSR', name: 'NSCLC 1L combination — CSR', phase: '3', created: '2026-08-01' },
    { compound: 'CMP-101', protocol: 'PRO-001', deliverable: 'CSR', name: 'CMP-101 Phase 2 — CSR', phase: '2', created: '2026-03-10' },
    { compound: 'CMP-101', protocol: 'PRO-001', deliverable: 'DSUR', name: 'CMP-101 — DSUR 2026', phase: '2', created: '2026-05-20' },
    { compound: 'CMP-101', protocol: 'PRO-002', deliverable: 'CSR', name: 'CMP-101 Phase 3 — CSR', phase: '3', created: '2026-08-18' }
  ];

  try { if (/[?&]reset=1\b/.test(location.search)) localStorage.removeItem(REG_KEY); } catch (e) {}
  function readJson(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function writeJson(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function getLayout() {
    var l = readJson(LAYOUT_KEY) || {};
    var level = parseInt(l.level, 10);
    if (!LEVELS[level]) level = 3;
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
  function registry() {
    var r = readJson(REG_KEY);
    if (!Array.isArray(r)) {
      r = SEED.map(function (e) { var c = Object.assign({ level: SEED_LEVEL, lead: 'Jordan Patel', statistician: 'Riley Nguyen', sponsor: 'X Pharma' }, e); c.path = pathFor(c, SEED_LEVEL); return c; });
      writeJson(REG_KEY, r);
    }
    return r;
  }
  function segsFor(entry, level) {
    level = level || getLayout().level;
    return LEVELS[level].segs.map(function (k) { return entry[k] || '{' + k + '}'; });
  }
  function pathFor(entry, level) { return segsFor(entry, level).join('/') + '/'; }
  function entryPath(e) { return e.path || pathFor(e, e.level || SEED_LEVEL); }
  function studyId(e) { return (e.level || SEED_LEVEL) === 1 ? e.compound : e.protocol; }
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
    entry.level = getLayout().level;
    entry.path = pathFor(entry, entry.level);
    r.push(entry);
    writeJson(REG_KEY, r);
    return entry;
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
        if (i === arr.length - 1) { node[seg]._entry = e; if (e.pending) node[seg]._pending = true; }
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
    if (level === 1) body = dir('CMP-101', subList()) + dir('CMP-202', '');
    else if (level === 2) body = dir('CMP-101', '<ul class="lt-tree">' + dir('PRO-001', subList()) + dir('PRO-002', '') + '</ul>');
    else body = dir('CMP-101', '<ul class="lt-tree">' + dir('PRO-001', '<ul class="lt-tree">' + dir('CSR', subList()) + dir('DSUR', '') + '</ul>') + dir('PRO-002', '<ul class="lt-tree">' + dir('CSR', '') + '</ul>') + '</ul>');
    return '<ul class="lt-tree lt-root">' + body + '</ul>';
  }

  window.SPHERE_LAYOUT = {
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
    findByPath: function (p) { return registry().filter(function (e) { return entryPath(e) === p; })[0] || null; },
    findByProtocol: function (p) { return registry().filter(function (e) { return e.protocol === p || e.compound === p; })[0] || null; },
    reset: function () { try { localStorage.removeItem(REG_KEY); localStorage.removeItem(LAYOUT_KEY); } catch (e) {} }
  };
})();
