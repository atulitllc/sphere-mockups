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
    { id: 'u4', name: 'Sam Okonkwo', username: 'sokonkwo', email: 'sam.okonkwo@xpharma.com', admin: false, company: 'X Pharma' },
    { id: 'mchen', name: 'Mei Chen', username: 'mchen', email: 'm.chen@xpharma.example', admin: false, role: 'Reviewer', company: 'X Pharma' },
    { id: 'alopez', name: 'Avery Lopez', username: 'alopez', email: 'a.lopez@xpharma.example', admin: false, role: 'Reviewer', company: 'X Pharma', invited: true }
  ];
  /* Legacy demo addresses stay stored. Screens show the Northwind domain. */
  function displayEmail(email) {
    return String(email || '')
      .replace(/@xpharma\.com/ig, '@northwindbio.example')
      .replace(/@xpharma\.example/ig, '@northwindbio.example');
  }
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
        if (raw.audit) s.audit = raw.audit.filter(function (e) { return !!e; });
      }
    } catch (e) {}
    USERS.forEach(function (u) {
      if (!s.users[u.id]) s.users[u.id] = { company: u.company, admin: u.admin, name: u.name, username: u.username, email: u.email, role: u.role || '', invited: !!u.invited, deactivated: false, accessRevoked: false };
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
      email: displayEmail(over.email || (base && base.email) || ''),
      deactivated: !!over.deactivated,
      accessRevoked: !!over.accessRevoked,
      role: over.role || (base && base.role) || '',
      invited: !!(over.invited != null ? over.invited : base && base.invited)
    };
  }
  function resolveUser(token, s) {
    if (!token) return null;
    var key = String(token);
    var ids = [];
    USERS.forEach(function (u) { ids.push(u.id); });
    Object.keys(s.users || {}).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); });
    var hit = null;
    ids.forEach(function (id) {
      var u = user(id, s);
      if (!u) return;
      if (u.id === key || u.username === key || u.name === key || displayEmail(u.email).toLowerCase() === displayEmail(key).toLowerCase()) hit = u;
    });
    return hit;
  }
  function requireActiveActor() {
    var s = read();
    var who = s.currentId ? user(s.currentId, s) : null;
    if (!who) throw deny('Unknown user');
    if (who.deactivated) throw deny('A deactivated account cannot perform this action');
    return who;
  }
  function activeAdminIds(s) {
    var ids = [];
    USERS.forEach(function (u) {
      var row = user(u.id, s);
      if (row && row.admin && !row.deactivated) ids.push(row.id);
    });
    return ids;
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
      var key = displayEmail(String(email || '').trim()).toLowerCase();
      if (!key) return null;
      var hit = null;
      api.users().forEach(function (u) {
        if (displayEmail(u.email || '').toLowerCase() === key || (u.username || '').toLowerCase() === key) hit = u;
      });
      return hit;
    },
    username: function () { return api.current().username; },
    isAdmin: function (id) {
      var u = id ? user(id) : api.current();
      return !!(u && u.admin && !u.deactivated);
    },
    matchesName: function (display, userName) {
      var a = String(display || '').trim().toLowerCase();
      var b = String(userName || '').trim().toLowerCase();
      if (!a || !b) return false;
      if (a === b) return true;
      var parts = b.split(/\s+/);
      if (parts.length < 2) return false;
      var last = parts[parts.length - 1];
      var initial = parts[0].charAt(0);
      return a === initial + '. ' + last || a === initial + ' ' + last;
    },
    deactivatedLabel: function (display) {
      var s = String(display || '').trim();
      if (!s || !api.users) return '';
      var dead = api.users().some(function (u) {
        return u.deactivated && api.matchesName(s, u.name);
      });
      return dead ? ' <span class="muted">(deactivated)</span>' : '';
    },
    leads: function (compound) { return (read().leads[compound] || []).slice(); },
    isLead: function (compound, id) {
      return (read().leads[compound] || []).indexOf(id || read().currentId) >= 0;
    },
    setLeads: function (compound, ids) {
      requireActiveActor();
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
      requireActiveActor();
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
      requireActiveActor();
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
      requireActiveActor();
      if (level !== 'compound' && level !== 'protocol' && level !== 'folder') {
        throw deny('Access can be set only at compound, protocol, or folder level');
      }
      api.assertManage(compound);
      var s = read();
      (grants || []).forEach(function (g) {
        var who = resolveUser(g.userId || g.who || g.name, s);
        if (who && who.deactivated) throw deny('A deactivated account cannot be granted access');
      });
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
    soleLeadOf: function (userId) {
      var s = read();
      var out = [];
      Object.keys(s.leads || {}).forEach(function (c) {
        var ids = s.leads[c] || [];
        if (ids.length === 1 && ids[0] === userId) out.push(c);
      });
      return out;
    },
    deactivate: function (userId) {
      requireActiveActor();
      if (!api.isAdmin()) throw deny('Only Admin can deactivate an account');
      var s = read();
      var before = user(userId, s);
      if (!before) throw deny('Unknown user');
      if (userId === s.currentId) throw deny('You cannot deactivate your own account');
      if (before.admin && !before.deactivated && activeAdminIds(s).length <= 1) throw deny('The last active Admin cannot be deactivated');
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
      var s0 = read();
      var actor0 = s0.currentId ? user(s0.currentId, s0) : null;
      if (!actor0) throw deny('Unknown user');
      if (actor0.deactivated && actor0.id === userId) throw deny('A deactivated account cannot reactivate itself');
      if (actor0.deactivated) throw deny('A deactivated account cannot perform this action');
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
