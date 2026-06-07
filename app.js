/* =====================================================================
   Telluris Labs — shared documentation behavior
   Works on every page; each feature guards for the elements it needs,
   so the same file serves both the rail pages and the simple home page.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Render LaTeX equations (KaTeX) ---------- */
  if (window.katex) {
    document.querySelectorAll(".katex-eq").forEach(function (el) {
      try {
        window.katex.render(el.getAttribute("data-tex"), el,
          { displayMode: true, throwOnError: false });
      } catch (e) { /* leave the raw LaTeX fallback in place */ }
    });
  }

  var THEME_KEY = "telluris-theme";  // site-wide so the choice persists across pages
  var root = document.documentElement;

  /* ---------- Theme toggle (guarded localStorage) ---------- */
  function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage unavailable */ }
  }
  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      setTheme(current === "dark" ? "light" : "dark");
    });
  }
  // Follow OS changes only while the user hasn't made an explicit choice.
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      var saved = null;
      try { saved = localStorage.getItem(THEME_KEY); } catch (err) { /* ignore */ }
      if (!saved) root.setAttribute("data-theme", e.matches ? "dark" : "light");
    });
  }

  /* ---------- Active link highlighting by current page ---------- */
  (function () {
    var currentFile = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    var links = document.querySelectorAll("nav.subnav .topnav-links a, nav.toc-nav a");
    links.forEach(function (a) {
      var href = a.getAttribute("href") || "";
      var url = new URL(href, location.href);
      var file = (url.pathname.split("/").pop() || "index.html").toLowerCase();
      // Only mark same-page links that are NOT in-page anchors (those are scrollspy's job).
      if (file === currentFile && !url.hash) a.classList.add("active");
    });
    // Top-nav: keep "atmoflux" highlighted across all atmoflux doc pages.
    if (currentFile !== "index.html" && currentFile !== "") {
      var atm = document.querySelector('nav.subnav .topnav-links a[href$="atmoflux.html"]');
      if (atm) atm.classList.add("active");
    }
  })();

  /* ---------- Sidebar filter ---------- */
  var filter = document.getElementById("navFilter");
  var sidebarNav = document.getElementById("sidebarNav");
  var emptyMsg = document.getElementById("filterEmpty");
  if (filter && sidebarNav) {
    var groups = Array.prototype.slice.call(sidebarNav.querySelectorAll(".nav-group"));
    filter.addEventListener("input", function () {
      var q = filter.value.trim().toLowerCase();
      var anyVisible = false;
      groups.forEach(function (group) {
        var groupHasMatch = false;
        group.querySelectorAll("a").forEach(function (link) {
          var match = link.textContent.toLowerCase().indexOf(q) !== -1;
          link.classList.toggle("hidden", !match);
          if (match) groupHasMatch = true;
        });
        group.style.display = groupHasMatch ? "" : "none";
        if (groupHasMatch) anyVisible = true;
      });
      if (emptyMsg) emptyMsg.style.display = anyVisible ? "none" : "block";
    });
  }

  /* ---------- Mobile collapsible left rail ---------- */
  var railToggle = document.getElementById("railToggle");
  if (railToggle) {
    var railSidebar = railToggle.closest("aside.sidebar");
    railToggle.addEventListener("click", function () {
      var open = railSidebar.classList.toggle("rail-open");
      railToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // Collapse after choosing a destination on mobile.
    railSidebar.querySelectorAll(".rail-body a").forEach(function (a) {
      a.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 760px)").matches) {
          railSidebar.classList.remove("rail-open");
          railToggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  /* ---------- Copy buttons ---------- */
  document.querySelectorAll(".codeblock").forEach(function (block) {
    var pre = block.querySelector("pre");
    if (!pre) return;
    var btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.type = "button";
    btn.textContent = "Copy";
    btn.setAttribute("aria-label", "Copy code to clipboard");
    block.appendChild(btn);
    btn.addEventListener("click", function () {
      // Strip leading ">>> " / "... " prompts when copying.
      var text = pre.innerText.split("\n").map(function (line) {
        return line.replace(/^(>>> |\.\.\. )/, "");
      }).join("\n");
      var done = function () {
        btn.textContent = "Copied";
        btn.classList.add("copied");
        setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, done);
      } else { done(); }
    });
  });

  /* ---------- Scrollspy (hash links in sidebar + on-this-page) ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  if (sections.length && "IntersectionObserver" in window) {
    function setActiveHash(id) {
      document.querySelectorAll("nav.toc-nav a, aside.onthispage a").forEach(function (a) {
        var href = a.getAttribute("href") || "";
        var hash = href.indexOf("#") !== -1 ? href.split("#")[1] : null;
        if (hash) a.classList.toggle("active", hash === id);
      });
    }
    var visible = new Set();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      var topmost = null, topY = Infinity;
      visible.forEach(function (id) {
        var y = document.getElementById(id).getBoundingClientRect().top;
        if (y < topY) { topY = y; topmost = id; }
      });
      if (topmost) setActiveHash(topmost);
    }, { rootMargin: "-80px 0px -70% 0px", threshold: 0 });
    sections.forEach(function (s) { observer.observe(s); });
  }
})();
