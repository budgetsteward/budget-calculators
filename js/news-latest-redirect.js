// js/news-latest-redirect.js
(function () {
  "use strict";

  var NEWS_JSON_URL = "assets/data/news.json";

  function parseDateSafe(iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
  }

  function pickLatestIssue(issues) {
    if (!Array.isArray(issues) || !issues.length) return null;

    return issues
      .slice()
      .sort(function (a, b) {
        var da = parseDateSafe(a && a.publishedDate) || new Date(0);
        var db = parseDateSafe(b && b.publishedDate) || new Date(0);
        return db.getTime() - da.getTime();
      })[0];
  }

  function redirect(url) {
    window.location.replace(url);
  }

  function checkExists(url) {
    return fetch(url, { method: "HEAD", cache: "no-cache" })
      .then(function (r) {
        return r.ok;
      })
      .catch(function () {
        return false;
      });
  }

  fetch(NEWS_JSON_URL, { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("Failed to load news.json");
      return r.json();
    })
    .then(function (data) {
      var issue = pickLatestIssue(data && data.issues);
      if (!issue || !issue.id) {
        throw new Error("No issues found in news.json");
      }

      var canonical = "news/" + encodeURIComponent(issue.id) + "/index.html";
      var fallback =
        "templates/news/template.html?issue=" + encodeURIComponent(issue.id);

      checkExists(canonical).then(function (exists) {
        redirect(exists ? canonical : fallback);
      });
    })
    .catch(function (err) {
      console.error(err);
      var box = document.querySelector(".news-loader");
      if (box) {
        box.innerHTML =
          "<h1>Unable to load the latest issue</h1>" +
          "<p>Please check <code>assets/data/news.json</code> or visit the " +
          '<a href="news-archive.html">archive</a>.</p>';
      }
    });
})();
