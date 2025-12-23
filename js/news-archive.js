// js/news-archive.js
(function () {
  "use strict";

  var NEWS_JSON_URL = "assets/data/news.json";

  // Canonical issue URL (preferred):
  //   /news/<issueId>/index.html
  function issueCanonicalHref(issueId) {
    return "news/" + encodeURIComponent(issueId) + "/index.html";
  }

  // Template fallback (works even if canonical issue page isn't created yet)
  function issueTemplateHref(issueId) {
    return "templates/news/template.html?issue=" + encodeURIComponent(issueId);
  }

  function setAriaMessage(el, msg, politeness) {
    if (window.BudgetUtils && typeof window.BudgetUtils.setAriaMessage === "function") {
      window.BudgetUtils.setAriaMessage(el, msg, politeness || "polite");
      return;
    }
    if (!el) return;
    el.setAttribute("aria-live", politeness || "polite");
    el.textContent = msg || "";
  }

  function parseDateSafe(iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatDisplayDate(iso) {
    var d = parseDateSafe(iso);
    if (!d) return "";
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function sortIssuesNewestFirst(issues) {
    return (issues || []).slice().sort(function (a, b) {
      var da = parseDateSafe(a && a.publishedDate) || new Date(0);
      var db = parseDateSafe(b && b.publishedDate) || new Date(0);
      return db.getTime() - da.getTime();
    });
  }

  // Some static servers don’t support HEAD; we’ll try HEAD and if it fails, we still render a link.
  function checkExists(url) {
    return fetch(url, { method: "HEAD", cache: "no-cache" })
      .then(function (r) { return r.ok; })
      .catch(function () { return false; });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function renderIssueCard(issue) {
    var card = el("article", "item-card");

    var h2 = el("h2", "item-card-title");
    var link = document.createElement("a");
    link.textContent = issue.title || "Newsletter Issue";
    link.href = issueCanonicalHref(issue.id || "");
    h2.appendChild(link);
    card.appendChild(h2);

    // Meta line: Issue number + date
    var metaParts = [];
    if (issue.issueNumber || issue.issue) metaParts.push("Issue " + (issue.issueNumber || issue.issue));
    if (issue.publishedDate) metaParts.push(formatDisplayDate(issue.publishedDate));
    if (issue.edition) metaParts.push(issue.edition);

    if (metaParts.length) {
      card.appendChild(el("p", "item-card-meta", metaParts.join(" • ")));
    }

    // Description (prefer tagline/subtitle)
    var desc = issue.tagline || issue.subtitle || issue.description || "";
    if (desc) {
      card.appendChild(el("p", "item-card-body", desc));
    }

    // “Open issue” + ensure link works even if canonical doesn't exist
    var actions = el("p", "item-card-body", "");
    var openBtn = document.createElement("a");
    openBtn.className = "btn-primary";
    openBtn.textContent = "Open issue";
    openBtn.href = issueCanonicalHref(issue.id || "");
    actions.appendChild(openBtn);

    card.appendChild(actions);

    // If canonical doesn’t exist, point both links to the template fallback.
    // (We do this async; user can still click immediately.)
    if (issue.id) {
      var canonical = issueCanonicalHref(issue.id);
      checkExists(canonical).then(function (exists) {
        if (!exists) {
          var fallback = issueTemplateHref(issue.id);
          link.href = fallback;
          openBtn.href = fallback;
        }
      });
    }

    return card;
  }

  function init() {
    var listEl = document.getElementById("news-archive-list");
    var statusEl = document.getElementById("global-status");
    if (!listEl) return;

    setAriaMessage(statusEl, "Loading archive…", "polite");

    fetch(NEWS_JSON_URL, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("Failed to load " + NEWS_JSON_URL);
        return r.json();
      })
      .then(function (data) {
        var issues = sortIssuesNewestFirst((data && data.issues) || []);
        listEl.innerHTML = "";

        if (!issues.length) {
          listEl.appendChild(
            el("p", "list-page-intro", "No newsletter issues found.")
          );
          setAriaMessage(statusEl, "", "polite");
          return;
        }

        issues.forEach(function (issue) {
          // Skip malformed entries
          if (!issue || !issue.id) return;
          listEl.appendChild(renderIssueCard(issue));
        });

        setAriaMessage(statusEl, "", "polite");
      })
      .catch(function (err) {
        console.error(err);
        listEl.innerHTML = "";
        listEl.appendChild(
          el(
            "p",
            "list-page-intro",
            "Unable to load the archive. Please verify assets/data/news.json."
          )
        );
        setAriaMessage(statusEl, "Unable to load archive.", "polite");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
