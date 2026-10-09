/* SPHERE manual-ingest copies (prototype). Files stay in localStorage and show up in File Explorer. */
(function () {
  var KEY = 'sphere-ingest-uploads-v1';
  var FOLDER = { Raw: 'raw', SDTM: 'sdtm', ADaM: 'adam' };

  function read() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s && Array.isArray(s.items)) return s;
    } catch (e) {}
    return { items: [] };
  }
  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  window.SPHERE_INGEST = {
    KEY: KEY,
    read: read,
    folderId: function (dest) { return FOLDER[dest] || ''; },
    add: function (items) {
      var s = read();
      (items || []).forEach(function (it) { s.items.push(it); });
      write(s);
      return s.items;
    },
    forStudy: function (studyPath) {
      return read().items.filter(function (it) { return it.studyPath === studyPath && it.status === 'success'; });
    },
    namesIn: function (studyPath, dest) {
      return read().items.filter(function (it) {
        return it.studyPath === studyPath && it.dest === dest && it.status === 'success';
      }).map(function (it) { return it.name; });
    }
  };
})();
