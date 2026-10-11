/* Tenant branding (Admin > Tenant config > Branding). Stored in localStorage
   'sphere-tenant-branding' as { name, accent, logo (data URL), savedAt }.
   Loaded in the head of every page: the accent applies before paint, and once the
   DOM is ready the tenant name replaces the default everywhere it is shown.
   The header slot that held the name pill shows the tenant logo (default Sample
   Biopharma lockup, or an uploaded logo). With no logo at all, that slot falls
   back to the text pill. A personal accent picked later in the header accent
   menu wins over the tenant accent. */
(function () {
  var KEY = 'sphere-tenant-branding';
  var DEFAULT_NAME = 'Sample Biopharma';
  var DEFAULT_ACCENT = '#2563EB';
  var LOGO_H = 'assets/sample-biopharma-logo-horizontal.svg';
  var LOGO_H_DARK = 'assets/sample-biopharma-logo-horizontal-dark.svg';
  var LOGO_MARK = 'assets/sample-biopharma-mark.svg';
  var PERSONAL_AT = 'sphere-accent-chosen-at';
  /* null = follow what is saved. 'default' | 'none' | 'custom' are live Admin previews. */
  var previewMode = null;
  var previewUrl = '';

  function read() {
    try {
      var b = JSON.parse(localStorage.getItem(KEY) || 'null');
      return b && typeof b === 'object' ? b : {};
    } catch (e) { return {}; }
  }
  function name() { var n = String(read().name || '').trim(); return n || DEFAULT_NAME; }
  /* Accessible name for a logo image: 'Sample Pharma logo'. */
  function logoLabel() { return name() + ' logo'; }
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
  function storedLogoState() {
    var b = read();
    if (b.logo) return { mode: 'custom', url: String(b.logo) };
    /* logoRemoved is set only by Remove logo. Older saves with an empty logo
       still get the built-in Sample Biopharma lockup. */
    if (b.logoRemoved) return { mode: 'none', url: '' };
    return { mode: 'default', url: '' };
  }
  function logoState() {
    if (previewMode === 'custom') return { mode: 'custom', url: previewUrl };
    if (previewMode === 'none') return { mode: 'none', url: '' };
    if (previewMode === 'default') return { mode: 'default', url: '' };
    return storedLogoState();
  }
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
  function rememberLabel(pill) {
    if (pill.hasAttribute('data-tenant-suffix')) return;
    var raw = pill.textContent.replace(/\s+/g, ' ').trim();
    var idx = raw.indexOf(' · ');
    pill.setAttribute('data-tenant-suffix', idx >= 0 ? raw.slice(idx) : '');
  }
  function labelFor(pill) {
    rememberLabel(pill);
    return name() + (pill.getAttribute('data-tenant-suffix') || '');
  }
  function refit() {
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
  }
  function imgEl(cls, src, tenant, named) {
    var img = document.createElement('img');
    img.className = cls;
    img.alt = named ? tenant : '';
    if (named) img.setAttribute('aria-label', tenant);
    else img.setAttribute('aria-hidden', 'true');
    img.addEventListener('load', refit);
    img.src = src;
    return img;
  }
  /* Header slot: logo when the tenant has one, otherwise the existing text pill.
     Default assets switch in CSS (horizontal at 1024+, mark below that). */
  function paintHeader(state) {
    var tenant = logoLabel();
    document.querySelectorAll('header.top .tenant-pill, header.top .company-pill').forEach(function (pill) {
      rememberLabel(pill);
      pill.classList.remove('has-tenant-logo', 'is-custom-logo');
      if (state.mode === 'none') {
        pill.removeAttribute('role');
        pill.removeAttribute('aria-label');
        pill.removeAttribute('title');
        pill.textContent = labelFor(pill);
        return;
      }
      pill.classList.add('has-tenant-logo');
      if (state.mode === 'custom') pill.classList.add('is-custom-logo');
      pill.setAttribute('role', 'img');
      pill.setAttribute('aria-label', tenant);
      pill.title = tenant;
      while (pill.firstChild) pill.removeChild(pill.firstChild);
      if (state.mode === 'custom') {
        pill.appendChild(imgEl('tenant-logo tenant-logo-custom', state.url, tenant, true));
      } else {
        pill.appendChild(imgEl('tenant-logo tenant-logo-light', LOGO_H, tenant, true));
        pill.appendChild(imgEl('tenant-logo tenant-logo-dark', LOGO_H_DARK, tenant, false));
        pill.appendChild(imgEl('tenant-logo tenant-logo-mark', LOGO_MARK, tenant, false));
      }
    });
  }
  /* Phone drawer: the mark lives here only when the header slot has been shed. */
  function paintNav(state) {
    var client = document.querySelector('.nav-mobile-client');
    if (!client) return;
    var img = client.querySelector('.nav-mobile-mark');
    if (state.mode === 'none') {
      if (img) img.remove();
      client.classList.remove('is-custom');
      return;
    }
    if (!img) {
      img = document.createElement('img');
      img.className = 'nav-mobile-mark';
      client.insertBefore(img, client.firstChild);
    }
    var tenant = logoLabel();
    img.alt = tenant;
    img.setAttribute('aria-label', tenant);
    img.title = tenant;
    var src = state.mode === 'custom' ? state.url : LOGO_MARK;
    if (img.getAttribute('src') !== src) img.setAttribute('src', src);
    client.classList.toggle('is-custom', state.mode === 'custom');
  }
  /* Login uses the horizontal lockup (or the upload). v2 stays in assets as the bordered reference. */
  function paintLogin(state) {
    var row = document.querySelector('.login-tenant');
    if (!row) return;
    row.querySelectorAll('.login-tenant-logo').forEach(function (n) { n.remove(); });
    row.classList.remove('has-tenant-logo', 'is-custom-logo');
    var strong = row.querySelector('strong');
    if (strong) strong.removeAttribute('aria-hidden');
    if (state.mode === 'none') return;
    row.classList.add('has-tenant-logo');
    var tenant = logoLabel();
    var anchor = row.querySelector('.login-tenant-dot');
    if (state.mode === 'custom') {
      row.classList.add('is-custom-logo');
      var custom = imgEl('login-tenant-logo is-custom', state.url, tenant, true);
      custom.title = tenant;
      if (anchor) anchor.insertAdjacentElement('afterend', custom);
      else row.insertBefore(custom, row.firstChild);
    } else {
      var light = imgEl('login-tenant-logo is-light', LOGO_H, tenant, true);
      var dark = imgEl('login-tenant-logo is-dark', LOGO_H_DARK, tenant, false);
      light.title = tenant;
      if (anchor) {
        anchor.insertAdjacentElement('afterend', dark);
        anchor.insertAdjacentElement('afterend', light);
      } else {
        row.insertBefore(dark, row.firstChild);
        row.insertBefore(light, row.firstChild);
      }
    }
    if (strong) strong.setAttribute('aria-hidden', 'true');
  }
  function paintLogo() {
    if (observer) observer.disconnect();
    var state = logoState();
    paintHeader(state);
    paintNav(state);
    paintLogin(state);
    if (observer && document.body) observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    refit();
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
            if (node.nodeType === 1 && (node.matches('.tenant-pill, .company-pill, .nav-mobile-client, .login-tenant') || node.querySelector('.tenant-pill, .company-pill, .nav-mobile-client, .login-tenant'))) needLogo = true;
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
    var hasLogo = !!(patch && Object.prototype.hasOwnProperty.call(patch, 'logo'));
    Object.keys(patch || {}).forEach(function (k) {
      if (k === 'logo') return;
      b[k] = patch[k];
    });
    if (hasLogo) {
      if (patch.logo) {
        b.logo = patch.logo;
        delete b.logoRemoved;
      } else if (patch.logo == null) {
        delete b.logo;
        delete b.logoRemoved;
      } else {
        b.logo = '';
        b.logoRemoved = true;
      }
    }
    b.savedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(b)); } catch (e) { return false; }
    previewMode = null;
    applyAccent();
    applyDom();
    try { window.dispatchEvent(new CustomEvent('sphere-branding-change', { detail: b })); } catch (e2) {}
    return true;
  }
  function reset() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    previewMode = null;
    applyAccent();
    applyDom();
    try { window.dispatchEvent(new CustomEvent('sphere-branding-change', { detail: {} })); } catch (e2) {}
  }
  window.SPHERE_BRAND = {
    DEFAULT_NAME: DEFAULT_NAME,
    DEFAULT_ACCENT: DEFAULT_ACCENT,
    get: function () {
      var b = read();
      var st = storedLogoState();
      return { name: name(), accent: validHex(b.accent) ? b.accent : DEFAULT_ACCENT, logo: st.mode === 'custom' ? st.url : '', logoMode: st.mode };
    },
    logoState: logoState,
    /* Admin preview. null follows storage, '' hides the logo, 'default' shows the built-in lockup, a data URL shows that file. */
    previewLogo: function (url) {
      if (url == null) previewMode = null;
      else if (url === '') { previewMode = 'none'; previewUrl = ''; }
      else if (url === 'default') { previewMode = 'default'; previewUrl = ''; }
      else { previewMode = 'custom'; previewUrl = String(url); }
      paintLogo();
    },
    name: name,
    logoLabel: logoLabel,
    repaint: paintLogo,
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
