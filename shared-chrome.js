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
