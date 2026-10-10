/* Shared permission check for compound leads and Manage Access.
   Only Admin assigns or removes leads, and only Admin deactivates or reactivates
   an account. SPH-R-405/406: a deactivated user cannot manage access, copy or
   paste, or open a guarded route. Reactivation restores sign-in only.
   Only a lead of the compound in view may change access, and only at compound,
   protocol, or folder level. */
(function () {
  var KEY = 'sphere-access-v1';
  var USERS = [
    { id: 'jpatel', name: 'Jordan Patel', username: 'jpatel', email: 'jordan.patel@xpharma.com', admin: true, company: 'X Pharma' },
    { id: 'rlee', name: 'Riley Nguyen', username: 'rlee', email: 'riley.nguyen@xpharma.com', admin: false, company: 'X Pharma' },
    { id: 'u3', name: 'Alex Rivera', username: 'arivera', email: 'alex.rivera@xpharma.com', admin: false, company: 'X Pharma' },
    { id: 'u4', name: 'Sam Okonkwo', username: 'sokonkwo', email: 'sam.okonkwo@xpharma.com', admin: false, company: 'X Pharma' }
  ];
  function deny(msg) {
    var err = new Error(msg || 'Not authorized');
    err.code = 'authorization';
    return err;
  }
  function blank() {
    return {
      currentId: 'jpatel',
      users: {},
      leads: { 'XP-204': ['jpatel', 'rlee'], 'XP-118': ['jpatel'] },
      grants: {},
      audit: []
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
        if (raw.audit) {
          s.audit = raw.audit.filter(function (e) {
            return e && e.note !== 'company change' && e.type !== 'company change';
          });
        }
      }
    } catch (e) {}
    USERS.forEach(function (u) {
      if (!s.users[u.id]) s.users[u.id] = { company: u.company, admin: u.admin, name: u.name, username: u.username, email: u.email, deactivated: false, accessRevoked: false };
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
      company: over.company || (base && base.company) || '',
      email: over.email || (base && base.email) || '',
      deactivated: !!over.deactivated,
      accessRevoked: !!over.accessRevoked
    };
  }
  var api = {
    users: function () { return USERS.map(function (u) { return user(u.id); }); },
    current: function () { return user(read().currentId); },
    setCurrent: function (id) {
      var s = read();
      var who = user(id, s);
      if (!who) throw deny('Unknown user');
      if (who.deactivated) throw deny('This account is deactivated');
      s.currentId = id;
      write(s);
      return user(id, s);
    },
    findByEmail: function (email) {
      var key = String(email || '').trim().toLowerCase();
      if (!key) return null;
      var hit = null;
      api.users().forEach(function (u) {
        if ((u.email || '').toLowerCase() === key || (u.username || '').toLowerCase() === key) hit = u;
      });
      return hit;
    },
    username: function () { return api.current().username; },
    isAdmin: function (id) {
      var u = id ? user(id) : api.current();
      return !!(u && u.admin);
    },
    leads: function (compound) { return (read().leads[compound] || []).slice(); },
    isLead: function (compound, id) {
      return (read().leads[compound] || []).indexOf(id || read().currentId) >= 0;
    },
    setLeads: function (compound, ids) {
      if (!api.isAdmin()) throw deny('Only Admin can assign or remove compound leads');
      var s = read();
      var next = [];
      (ids || []).forEach(function (id) {
        var who = user(id, s);
        if (who && !who.deactivated && next.indexOf(id) < 0) next.push(id);
      });
      s.leads[compound] = next;
      write(s);
      return next;
    },
    assignLead: function (compound, id) {
      var who = user(id);
      if (who && who.deactivated) throw deny('A deactivated account cannot be assigned as a lead');
      var cur = api.leads(compound);
      if (cur.indexOf(id) < 0) cur.push(id);
      var next = api.setLeads(compound, cur);
      if (who && who.accessRevoked) {
        var s = read();
        if (s.users[id]) s.users[id].accessRevoked = false;
        write(s);
      }
      return next;
    },
    removeLead: function (compound, id) {
      return api.setLeads(compound, api.leads(compound).filter(function (x) { return x !== id; }));
    },
    canManage: function (compound, id) {
      var who = user(id || read().currentId);
      if (!who || who.deactivated) return false;
      return api.isLead(compound, who.id);
    },
    assertManage: function (compound) {
      if (!api.canManage(compound)) throw deny('Not authorized to manage access for ' + (compound || 'this compound'));
      return true;
    },
    setFolderAccess: function (compound, level, path, grants) {
      if (level !== 'compound' && level !== 'protocol' && level !== 'folder') {
        throw deny('Access can be set only at compound, protocol, or folder level');
      }
      api.assertManage(compound);
      var s = read();
      s.grants[compound + '|' + level + '|' + path] = grants || [];
      (grants || []).forEach(function (g) {
        var id = g.userId || g.who;
        if (id && s.users[id] && s.users[id].accessRevoked && !s.users[id].deactivated) s.users[id].accessRevoked = false;
      });
      write(s);
      return true;
    },
    canEdit: function (path) {
      var s = read();
      var who = user(s.currentId, s);
      if (!who || who.deactivated) return false;
      var first = String(path || '').replace(/^\/+|\/+$/g, '').split('/')[0];
      function hasGrants(c) {
        return Object.keys(s.grants).some(function (k) { return k.indexOf(c + '|') === 0; });
      }
      var compound = (first && hasGrants(first)) ? first : (window.SPHERE_filesCompound || first || '');
      var keys = Object.keys(s.grants).filter(function (k) { return k.indexOf(compound + '|') === 0; });
      if (!keys.length) return who.accessRevoked ? false : who.company === 'X Pharma';
      var ok = false;
      keys.forEach(function (k) {
        (s.grants[k] || []).forEach(function (g) {
          var id = g.userId || g.who || g.name;
          var role = String(g.role || '');
          if (role !== 'Edit' && role !== 'edit') return;
          if (id === who.id || id === who.username || id === who.name) ok = true;
        });
      });
      return ok;
    },
    audit: function () { return read().audit.slice(); },
    deactivate: function (userId) {
      if (!api.isAdmin()) throw deny('Only Admin can deactivate an account');
      var s = read();
      var before = user(userId, s);
      if (!before) throw deny('Unknown user');
      if (!s.users[userId]) s.users[userId] = {};
      s.users[userId].deactivated = true;
      s.users[userId].accessRevoked = true;
      s.users[userId].name = before.name;
      Object.keys(s.leads).forEach(function (c) {
        s.leads[c] = (s.leads[c] || []).filter(function (id) { return id !== userId; });
      });
      Object.keys(s.grants).forEach(function (k) {
        s.grants[k] = (s.grants[k] || []).filter(function (g) {
          var id = g.userId || g.who || g.name;
          return id !== userId && id !== before.username && id !== before.name;
        });
      });
      var actor = user(s.currentId, s);
      s.audit.push({
        type: 'deactivate',
        actor: actor ? actor.name : '',
        actorId: s.currentId,
        user: before.name,
        userId: before.id,
        at: new Date().toISOString()
      });
      write(s);
      return user(userId, s);
    },
    reactivate: function (userId) {
      if (!api.isAdmin()) throw deny('Only Admin can reactivate an account');
      var s = read();
      var before = user(userId, s);
      if (!before) throw deny('Unknown user');
      if (!s.users[userId]) s.users[userId] = {};
      s.users[userId].deactivated = false;
      var actor = user(s.currentId, s);
      s.audit.push({
        type: 'reactivate',
        actor: actor ? actor.name : '',
        actorId: s.currentId,
        user: before.name,
        userId: before.id,
        at: new Date().toISOString()
      });
      write(s);
      return user(userId, s);
    }
  };
  window.SPHERE_ACCESS = api;
})();
