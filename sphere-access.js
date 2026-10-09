/* Shared permission checks for Manage Access, copy/paste, and company change.
   Only an Admin may assign or remove compound leads. Only a compound's leads
   may change access on that compound and its subfolders. */
(function () {
  var KEY = 'sphere-access-v1';
  var USERS = [
    { id: 'jpatel', name: 'Jordan Patel', username: 'jpatel', admin: true, company: 'X Pharma' },
    { id: 'rlee', name: 'Riley Nguyen', username: 'rlee', admin: false, company: 'X Pharma' },
    { id: 'u3', name: 'Alex Rivera', username: 'arivera', admin: false, company: 'X Pharma' },
    { id: 'u4', name: 'Sam Okonkwo', username: 'sokonkwo', admin: false, company: 'X Pharma' }
  ];

  function blank() {
    return {
      currentId: 'jpatel',
      users: {},
      leads: { 'XP-204': ['jpatel', 'rlee'], 'XP-118': ['jpatel'] },
      grants: {}
    };
  }
  function read() {
    var s = blank();
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && typeof raw === 'object') {
        if (raw.currentId) s.currentId = raw.currentId;
        if (raw.users) s.users = raw.users;
        if (raw.leads) s.leads = raw.leads;
        if (raw.grants) s.grants = raw.grants;
      }
    } catch (e) {}
    USERS.forEach(function (u) {
      if (!s.users[u.id]) s.users[u.id] = { company: u.company, admin: u.admin, name: u.name, username: u.username };
    });
    return s;
  }
  function write(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }
  function user(id, s) {
    s = s || read();
    var base = null;
    USERS.forEach(function (u) { if (u.id === id) base = u; });
    var over = s.users[id] || {};
    if (!base && !over.name) return null;
    return {
      id: id,
      name: over.name || (base && base.name) || id,
      username: over.username || (base && base.username) || id,
      admin: !!(over.admin != null ? over.admin : base && base.admin),
      company: over.company || (base && base.company) || ''
    };
  }
  function deny(msg) {
    var err = new Error(msg || 'Not authorized');
    err.code = 'authorization';
    return err;
  }
  function compoundOf(path) {
    var parts = String(path || '').replace(/^\/+|\/+$/g, '').split('/');
    return parts[0] || '';
  }

  var api = {
    users: function () { return USERS.map(function (u) { return user(u.id); }); },
    current: function () { return user(read().currentId); },
    setCurrent: function (id) {
      var s = read();
      if (!user(id, s)) throw deny('Unknown user');
      s.currentId = id;
      write(s);
      return user(id, s);
    },
    username: function () { return api.current().username; },
    isAdmin: function (id) {
      var u = id ? user(id) : api.current();
      return !!(u && u.admin);
    },
    leads: function (compound) {
      var s = read();
      return (s.leads[compound] || []).slice();
    },
    isLead: function (compound, id) {
      var who = id || read().currentId;
      return (read().leads[compound] || []).indexOf(who) >= 0;
    },
    setLeads: function (compound, ids) {
      if (!api.isAdmin()) throw deny('Only Admin can assign or remove compound leads');
      var s = read();
      var next = [];
      (ids || []).forEach(function (id) {
        if (user(id, s) && next.indexOf(id) < 0) next.push(id);
      });
      s.leads[compound] = next;
      write(s);
      return next;
    },
    assignLead: function (compound, id) {
      var cur = api.leads(compound);
      if (cur.indexOf(id) < 0) cur.push(id);
      return api.setLeads(compound, cur);
    },
    removeLead: function (compound, id) {
      return api.setLeads(compound, api.leads(compound).filter(function (x) { return x !== id; }));
    },
    canManage: function (compound, id) {
      return api.isLead(compound, id || read().currentId);
    },
    assertManage: function (compound) {
      if (!api.canManage(compound)) throw deny('Not a lead of ' + compound);
      return true;
    },
    setFolderAccess: function (compound, level, path, grants) {
      if (level !== 'compound' && level !== 'protocol' && level !== 'folder') {
        throw deny('Access can be set only at compound, protocol, or folder level');
      }
      api.assertManage(compound);
      var s = read();
      s.grants[compound + '|' + level + '|' + path] = grants || [];
      write(s);
      return true;
    },
    canEdit: function (path) {
      var s = read();
      var who = s.currentId;
      var compound = compoundOf(path);
      var u = user(who, s);
      if (!u) return false;
      var keys = Object.keys(s.grants).filter(function (k) { return k.indexOf(compound + '|') === 0; });
      if (!keys.length) return u.company === 'X Pharma';
      var ok = false;
      keys.forEach(function (k) {
        (s.grants[k] || []).forEach(function (g) {
          if (g.userId === who && g.role === 'Edit') ok = true;
        });
      });
      return ok;
    },
    changeCompany: function (userId, company) {
      if (!api.isAdmin()) throw deny('Only Admin can change a user company');
      var s = read();
      if (!s.users[userId]) s.users[userId] = {};
      s.users[userId].company = company;
      Object.keys(s.leads).forEach(function (c) {
        s.leads[c] = (s.leads[c] || []).filter(function (id) { return id !== userId; });
      });
      Object.keys(s.grants).forEach(function (k) {
        s.grants[k] = (s.grants[k] || []).filter(function (g) { return g.userId !== userId; });
      });
      write(s);
      return user(userId, s);
    }
  };
  window.SPHERE_ACCESS = api;
})();
