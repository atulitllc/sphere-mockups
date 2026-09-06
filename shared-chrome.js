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


/* Collapsible page help + note banners */
(function () {
  function setToggleOpen(btn, panel, open, showLabel, hideLabel) {
    if (!btn || !panel) return;
    if (open) panel.removeAttribute('hidden');
    else panel.setAttribute('hidden', '');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('title', open ? hideLabel : showLabel);
    btn.setAttribute('aria-label', open ? hideLabel : showLabel);
    btn.classList.toggle('is-open', !!open);
  }

  function wireToggle(btn, panel, collapseBtn, showLabel, hideLabel, onOpenChange) {
    if (!btn || !panel || btn.getAttribute('data-help-bound') === '1') return;
    btn.setAttribute('data-help-bound', '1');
    function setOpen(open) {
      setToggleOpen(btn, panel, open, showLabel, hideLabel);
      if (typeof onOpenChange === 'function') onOpenChange(open);
    }
    btn.addEventListener('click', function () {
      setOpen(panel.hasAttribute('hidden'));
    });
    if (collapseBtn) {
      collapseBtn.addEventListener('click', function () { setOpen(false); });
    }
  }

  function initPageHelp() {
    document.querySelectorAll('.page-intro-compact').forEach(function (intro) {
      var btn = intro.querySelector('.page-help-toggle');
      var text = intro.querySelector('.page-help-text');
      var collapse = intro.querySelector('.page-help-collapse');
      wireToggle(btn, text, collapse, 'Show help', 'Hide help');
    });
  }

  function initNoteBanners() {
    document.querySelectorAll('.note-banner.note-collapsible').forEach(function (banner) {
      var btn = banner.querySelector('.note-help-toggle');
      var body = banner.querySelector('.note-banner-body');
      var collapse = banner.querySelector('.note-help-collapse');
      wireToggle(btn, body, collapse, 'Show note', 'Hide note', function (open) {
        banner.classList.toggle('is-collapsed', !open);
      });
      // Ensure default collapsed chrome matches hidden body
      if (body && body.hasAttribute('hidden')) {
        banner.classList.add('is-collapsed');
        if (btn) {
          btn.setAttribute('aria-expanded', 'false');
          btn.classList.remove('is-open');
        }
      }
    });
  }

  function init() {
    initPageHelp();
    initNoteBanners();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
