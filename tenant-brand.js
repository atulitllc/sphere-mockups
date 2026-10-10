/* Tenant branding (Admin > Tenant config > Branding). Stored in localStorage
   'sphere-tenant-branding' as { name, accent, logo (data URL), savedAt }.
   Loaded in the head of every page: the accent applies before paint, and once the
   DOM is ready the tenant name replaces the default everywhere it is shown and the
   logo appears in the tenant pill. A personal accent picked later in the header
   accent menu wins over the tenant accent. */
(function () {
  var KEY = 'sphere-tenant-branding';
  var DEFAULT_NAME = 'Northwind Biopharma';
  var DEFAULT_ACCENT = '#2563EB';
  var PERSONAL_AT = 'sphere-accent-chosen-at';
  function read() {
    try {
      var b = JSON.parse(localStorage.getItem(KEY) || 'null');
      return b && typeof b === 'object' ? b : {};
    } catch (e) { return {}; }
  }
  function name() { var n = String(read().name || '').trim(); return n || DEFAULT_NAME; }
  function validHex(v) { return /^#[0-9a-f]{6}$/i.test(String(v || '')); }
  function applyAccent() {
    var root = document.documentElement;
    var b = read();
    var personal = 0;
    try { personal = parseInt(localStorage.getItem(PERSONAL_AT) || '0', 10) || 0; } catch (e) {}
    var on = validHex(b.accent) && b.accent.toLowerCase() !== DEFAULT_ACCENT.toLowerCase() && (b.savedAt || 0) > personal;
    if (on) {
      root.style.setProperty('--tenant-accent', b.accent);
      root.setAttribute('data-tenant-accent', '');
    } else {
      root.style.removeProperty('--tenant-accent');
      root.removeAttribute('data-tenant-accent');
    }
  }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  var lastName = DEFAULT_NAME;
  function replaceIn(root, from, to) {
    if (!root || from === to) return;
    if (root.nodeType === 3) {
      if (root.nodeValue.indexOf(from) >= 0) root.nodeValue = root.nodeValue.split(from).join(to);
      return;
    }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA)$/.test(root.nodeName)) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n;
    var hits = [];
    while ((n = walker.nextNode())) {
      if (n.nodeValue.indexOf(from) >= 0 && !(n.parentNode && /^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode.nodeName))) hits.push(n);
    }
    hits.forEach(function (t) { t.nodeValue = t.nodeValue.split(from).join(to); });
    var els = [root].concat(Array.prototype.slice.call(root.querySelectorAll('[title],[placeholder],[aria-label],option')));
    els.forEach(function (el) {
      ['title', 'placeholder', 'aria-label'].forEach(function (a) {
        var v = el.getAttribute && el.getAttribute(a);
        if (v && v.indexOf(from) >= 0) el.setAttribute(a, v.split(from).join(to));
      });
    });
  }
  /* The uploaded logo floats, faded, in the bottom-right corner of every app page
     (not in the header pill). Nothing is shown without a logo; login has no badge. */
  function paintLogo() {
    document.querySelectorAll('img.tenant-logo').forEach(function (img) { img.remove(); });
    document.querySelectorAll('.has-tenant-logo').forEach(function (el) { el.classList.remove('has-tenant-logo'); });
    var logo = read().logo || '';
    var box = document.getElementById('tenantFloatLogo');
    var appPage = !!document.querySelector('header.top, .app, .sidebar');
    if (!logo || !appPage) {
      if (box) box.remove();
      document.body.classList.remove('has-tenant-float-logo');
      return;
    }
    if (!box) {
      box = document.createElement('div');
      box.id = 'tenantFloatLogo';
      box.className = 'tenant-float-logo';
      box.setAttribute('aria-hidden', 'true');
      box.appendChild(document.createElement('img'));
      document.body.appendChild(box);
    }
    var img = box.querySelector('img');
    img.alt = '';
    if (img.getAttribute('src') !== logo) img.setAttribute('src', logo);
    box.title = name();
    document.body.classList.add('has-tenant-float-logo');
  }
  var observer = null;
  function applyDom() {
    if (!document.body) return;
    var to = name();
    if (observer) observer.disconnect();
    if (lastName !== to) replaceIn(document.body, lastName, to);
    if (to !== DEFAULT_NAME) replaceIn(document.body, DEFAULT_NAME, to);
    lastName = to;
    paintLogo();
    document.title = document.title.split(DEFAULT_NAME).join(to);
    watch();
  }
  /* Late content (rendered lists, chrome added by scripts) gets the tenant name too. */
  function watch() {
    if (!window.MutationObserver || !document.body) return;
    if (!observer) {
      observer = new MutationObserver(function (muts) {
        var to = name();
        var needLogo = false;
        observer.disconnect();
        muts.forEach(function (m) {
          if (to !== DEFAULT_NAME) {
            if (m.type === 'characterData') replaceIn(m.target, DEFAULT_NAME, to);
            Array.prototype.forEach.call(m.addedNodes || [], function (node) { replaceIn(node, DEFAULT_NAME, to); });
          }
          Array.prototype.forEach.call(m.addedNodes || [], function (node) {
            if (node.nodeType === 1 && (node.matches('.tenant-pill, .company-pill') || node.querySelector('.tenant-pill, .company-pill'))) needLogo = true;
          });
        });
        if (needLogo) paintLogo();
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      });
    }
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  function save(patch) {
    var b = read();
    Object.keys(patch || {}).forEach(function (k) { b[k] = patch[k]; });
    b.savedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) { return false; }
    applyAccent();
    applyDom();
    try { window.dispatchEvent(new CustomEvent('sphere-branding-change', { detail: b })); } catch (e2) {}
    return true;
  }
  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    applyAccent();
    applyDom();
    try { window.dispatchEvent(new CustomEvent('sphere-branding-change', { detail: {} })); } catch (e2) {}
  }
  window.SPHERE_BRAND = {
    DEFAULT_NAME: DEFAULT_NAME,
    DEFAULT_ACCENT: DEFAULT_ACCENT,
    get: function () { var b = read(); return { name: name(), accent: validHex(b.accent) ? b.accent : DEFAULT_ACCENT, logo: b.logo || '' }; },
    name: name,
    save: save,
    reset: reset,
    /* Called by the header accent menu: a personal pick overrides the tenant accent. */
    personalAccentChosen: function () {
      try { localStorage.setItem(PERSONAL_AT, String(Date.now())); } catch (e) {}
      applyAccent();
    },
    esc: esc
  };
  applyAccent();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyDom);
  else applyDom();
  window.addEventListener('storage', function (e) { if (e.key === KEY) { applyAccent(); applyDom(); } });
})();
