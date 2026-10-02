(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 960px)").matches) {
          nav.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  var anchors = document.querySelectorAll(".anchor-nav a");
  if (anchors.length && "IntersectionObserver" in window) {
    var byId = {};
    anchors.forEach(function (link) {
      var id = (link.getAttribute("href") || "").replace("#", "");
      if (id) byId[id] = link;
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || !byId[entry.target.id]) return;
          anchors.forEach(function (link) {
            link.classList.remove("is-active");
          });
          byId[entry.target.id].classList.add("is-active");
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.01 }
    );

    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  var form = document.getElementById("partner-form");
  if (!form) return;

  var status = document.getElementById("form-status");

  function field(name) {
    return form.elements[name];
  }

  function value(name) {
    var el = field(name);
    return el ? String(el.value || "").trim() : "";
  }

  function clearErrors() {
    form.querySelectorAll(".field-error").forEach(function (node) {
      node.hidden = true;
      node.textContent = "";
    });
    form.querySelectorAll(".is-invalid").forEach(function (node) {
      node.classList.remove("is-invalid");
      node.removeAttribute("aria-invalid");
    });
  }

  function showError(name, message) {
    var el = field(name);
    var error = document.getElementById(name + "-error");
    if (el) {
      el.classList.add("is-invalid");
      el.setAttribute("aria-invalid", "true");
      if (error) el.setAttribute("aria-describedby", error.id);
    }
    if (error) {
      error.hidden = false;
      error.textContent = message;
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();

    var errors = [];
    var name = value("name");
    var firm = value("firm");
    var email = value("email");
    var role = value("role");
    var setting = value("setting");
    var motion = value("motion");
    var owns = value("owns");
    var due = value("due");
    var notes = value("notes");

    if (!name) {
      showError("name", "Enter your name.");
      errors.push("name");
    }
    if (!firm) {
      showError("firm", "Enter your firm.");
      errors.push("firm");
    }
    if (!email) {
      showError("email", "Enter your work email.");
      errors.push("email");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("email", "Enter an email address with a domain.");
      errors.push("email");
    }
    if (!setting) {
      showError("setting", "Choose a regulated setting.");
      errors.push("setting");
    }
    if (!motion) {
      showError("motion", "Choose how you expect to work.");
      errors.push("motion");
    }
    if (!notes) {
      showError("notes", "Add a short note about the pursuit.");
      errors.push("notes");
    }

    if (errors.length) {
      if (status) {
        status.hidden = false;
        status.classList.add("is-error");
        status.textContent = "Check the highlighted fields before sending.";
      }
      var first = field(errors[0]);
      if (first) first.focus();
      return;
    }

    var body = [
      "Name: " + name,
      "Firm: " + firm,
      "Email: " + email,
      "Role: " + (role || "—"),
      "Regulated setting: " + setting,
      "Expected motion: " + motion,
      "What should not be replaced: " + (owns || "—"),
      "Proposal or workshop timing: " + (due || "—"),
      "",
      notes
    ].join("\n");

    var href =
      "mailto:partnerships@amisoftsolutions.com" +
      "?subject=" +
      encodeURIComponent("Partner conversation — " + firm) +
      "&body=" +
      encodeURIComponent(body);

    if (status) {
      status.hidden = false;
      status.classList.remove("is-error");
      status.textContent =
        "Your email application should open with this note addressed to partnerships@amisoftsolutions.com. If it does not, send the same details directly.";
    }

    window.location.href = href;
  });
})();
