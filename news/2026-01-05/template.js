// news/<issue>/template.js  (also works as templates/news/template.js)
(function (global) {
  "use strict";

  var NEWS_JSON_URL = "/assets/data/news.json";
  var STORIES_JSON_URL = "/assets/data/stories.json";

  // Site-level archive page (optional)
  var NEWS_ARCHIVE_PATH = "news-archive.html";

  // Site root (two levels up from /news/<issue>/)
  var SITE_ROOT = new URL("/", global.location.href);


  var setAriaMessage =
    (global.BudgetUtils && global.BudgetUtils.setAriaMessage) ||
    function () {};

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function getParam(name) {
    var params = new URLSearchParams(global.location.search);
    return params.get(name);
  }

  function parseDateSafe(iso) {
    if (!iso) return null;

    // Force local date parsing for YYYY-MM-DD
    var parts = iso.split("-");
    if (parts.length !== 3) return null;

    var year = Number(parts[0]);
    var month = Number(parts[1]) - 1;
    var day = Number(parts[2]);

    var d = new Date(year, month, day);
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

  function normalizePath(p) {
    if (!p || typeof p !== "string") return "";
    return p.charAt(0) === "/" ? p.slice(1) : p;
  }

  // Viewer link format
  function viewerHref(storyId) {
    return "../../stories/?story=" + encodeURIComponent(storyId || "");
  }

  function archiveHref() {
    return new URL(NEWS_ARCHIVE_PATH, SITE_ROOT).href;
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + url);
      return r.json();
    });
  }

  // Build story index by storyId (flat stories.json array)
  function buildStoryIndex(storiesData) {
    var idx = {};
    if (!Array.isArray(storiesData)) return idx;

    storiesData.forEach(function (s) {
      if (!s || !s.id) return;
      idx[s.id] = s;
    });

    return idx;
  }

  // Newsletter image resolution
  // - "images/..." => local to issue folder
  // - "../" or "./" => relative to current page
  // - else => resolve from site root
  function resolveAssetPath(src) {
    if (!src) return "";

    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("data:")
    ) {
      return src;
    }

    if (src.startsWith("../") || src.startsWith("./")) {
      return new URL(src, global.location.href).href;
    }

    if (src.startsWith("images/")) {
      return new URL(src, global.location.href).href;
    }

    return new URL(src, SITE_ROOT).href;
  }

  function renderPhoto(photo) {
    if (!photo || !photo.src) return null;

    var fig = el("figure", "news-photo");
    var img = document.createElement("img");

    var resolved = resolveAssetPath(photo.src);
    img.src = resolved;
    img.alt = photo.alt || "";
    img.loading = "lazy";

    img.onerror = function () {
      console.warn("Newsletter image failed to load:", resolved);
      fig.style.display = "none";
    };

    fig.appendChild(img);

    if (photo.caption) {
      fig.appendChild(el("figcaption", null, photo.caption));
    }

    return fig;
  }

  function pickIssue(issues, desiredId) {
    var list = Array.isArray(issues) ? issues.slice() : [];
    list.sort(function (a, b) {
      var da = parseDateSafe(a && a.publishedDate) || new Date(0);
      var db = parseDateSafe(b && b.publishedDate) || new Date(0);
      return db.getTime() - da.getTime();
    });

    if (!list.length) return null;
    if (desiredId) {
      var exact = list.find(function (i) {
        return i && i.id === desiredId;
      });
      if (exact) return exact;
    }
    return list[0];
  }

  function renderMasthead(issue) {
    var mast = el("header", "news-masthead");

    var top = el("div", "news-masthead-top");

    var left = el("div");
    var name = el("h1", "news-name", issue.title || "Newsletter");
    var tagline = el("p", "news-tagline", issue.tagline || issue.subtitle || "");
    left.appendChild(name);
    if (tagline.textContent) left.appendChild(tagline);

    var right = el("div", "news-masthead-meta");

    var issueNo = issue.issueNumber || issue.issue || "1";
    var edition = issue.edition || "Digital Edition";
    var website = issue.website || "";
    var dateStr = issue.publishedDate ? formatDisplayDate(issue.publishedDate) : "";

    right.appendChild(el("p", "news-meta-line", "Issue " + issueNo));
    if (dateStr) right.appendChild(el("p", "news-meta-line", dateStr));
    right.appendChild(el("p", "news-meta-line", edition));
    if (website) right.appendChild(el("p", "news-meta-line", website));

    // Archive button/link on the right side (optional but kept)
    var archive = document.createElement("a");
    archive.className = "news-archive-link";
    archive.href = archiveHref();
    archive.textContent = "Archive";
    archive.setAttribute("aria-label", "View newsletter archive");
    right.appendChild(archive);

    top.appendChild(left);
    top.appendChild(right);

    mast.appendChild(top);

    // ✅ Removed the badge row ("Front Page", "X sections", "Free")
    return mast;
  }

  function renderStoryBlock(item, storyMeta, options) {
    var opts = options || {};
    var story = el(
      "article",
      "news-story" + (opts.lead ? " news-story--lead" : "")
    );

    if (opts.sectionLabel) {
      var label = el("div", "news-section-label");
      label.appendChild(el("h2", null, opts.sectionLabel));
      if (opts.sectionHint) label.appendChild(el("p", null, opts.sectionHint));
      story.appendChild(label);
    }

    var headline = el(
      "h3",
      "news-headline",
      item.headline || (storyMeta && storyMeta.title) || "Untitled story"
    );
    story.appendChild(headline);

    var sub = item.subhead || item.dek || (storyMeta && storyMeta.subtitle) || "";
    if (sub) story.appendChild(el("p", "news-subhead", sub));

    if (item.photo && item.photo.src) {
      var fig = renderPhoto(item.photo);
      if (fig) story.appendChild(fig);
    }

    var snippet =
      item.snippet ||
      item.blurb ||
      (storyMeta && storyMeta.description) ||
      "Add a short teaser paragraph here (2–4 lines).";
    story.appendChild(el("p", "news-snippet", snippet));

    var actions = el("div", "news-actions");

    var read = document.createElement("a");
    read.className = "btn-primary";
    read.textContent = "Read more";
    read.href = viewerHref(item.storyId);
    actions.appendChild(read);

    story.appendChild(actions);

    return story;
  }

  function renderColumns(issue, storyIndex) {
    var body = el("section", "news-body");
    var cols = el("div", "news-columns");

    var col1 = el("div");
    var col2 = el("div");
    var col3 = el("div");

    var allItems = [];
    (issue.sections || []).forEach(function (sec) {
      (sec.items || []).forEach(function (it) {
        allItems.push({
          sectionLabel: sec.label || "",
          sectionHint: sec.hint || "",
          item: it
        });
      });
    });

    function metaFor(it) {
      // ✅ Simplified: story lookup by storyId only
      return (it && it.storyId && storyIndex[it.storyId]) ? storyIndex[it.storyId] : null;
    }

    var lead = allItems[0];
    var a = allItems[1];
    var b = allItems[2];
    var c = allItems[3];
    var d = allItems[4];
    var e = allItems[5];

    if (lead) {
      col1.appendChild(
        renderStoryBlock(lead.item, metaFor(lead.item), {
          lead: true,
          sectionLabel: lead.sectionLabel || "Lead",
          sectionHint: lead.sectionHint || "Featured"
        })
      );
    }

    if (a) {
      col1.appendChild(
        renderStoryBlock(a.item, metaFor(a.item), {
          sectionLabel: a.sectionLabel || "Inside",
          sectionHint: a.sectionHint || ""
        })
      );
    }

    if (b) {
      col2.appendChild(
        renderStoryBlock(b.item, metaFor(b.item), {
          sectionLabel: b.sectionLabel || "Inside",
          sectionHint: b.sectionHint || ""
        })
      );
    }
    if (c) {
      col2.appendChild(
        renderStoryBlock(c.item, metaFor(c.item), {
          sectionLabel: c.sectionLabel || "More",
          sectionHint: c.sectionHint || ""
        })
      );
    }
    if (d) {
      col2.appendChild(
        renderStoryBlock(d.item, metaFor(d.item), {
          sectionLabel: d.sectionLabel || "More",
          sectionHint: d.sectionHint || ""
        })
      );
    }

    // Right rail
    var rail = el("aside", "news-rail");
    rail.appendChild(el("h3", null, "This Issue"));
    rail.appendChild(
      el(
        "p",
        null,
        issue.sidebarNote ||
          "Add an editor note, spotlight tool, or announcement here."
      )
    );

    rail.appendChild(el("hr", "news-divider"));

    rail.appendChild(el("h3", null, "Quick Links"));
    var links = el("p", null, "");
    links.innerHTML =
      '<a href="../../calculators.html">Explore calculators</a> · ' +
      '<a href="https://www.super.com/home/superplus" target="_blank" rel="noopener">Super+ Home</a> · ' +
      '<a href="https://www.super.com/help" target="_blank" rel="noopener">Help Center</a> · ' +
      '<a href="https://www.super.com/reviews" target="_blank" rel="noopener">Reviews</a>';
    rail.appendChild(links);

    if (issue.callout) {
      rail.appendChild(el("hr", "news-divider"));
      rail.appendChild(el("h3", null, issue.callout.title || "Try This Next"));
      rail.appendChild(el("p", null, issue.callout.text || ""));
    }

    col3.appendChild(rail);

    if (e) {
      col3.appendChild(
        renderStoryBlock(e.item, metaFor(e.item), {
          sectionLabel: e.sectionLabel || "More",
          sectionHint: e.sectionHint || ""
        })
      );
    }

    cols.appendChild(col1);
    cols.appendChild(col2);
    cols.appendChild(col3);

    body.appendChild(cols);
    return body;
  }

  function renderPaper(root, issue, storyIndex) {
    root.innerHTML = "";
    root.appendChild(renderMasthead(issue));
    root.appendChild(renderColumns(issue, storyIndex));
    root.appendChild(
      el(
        "div",
        "news-paper-note",
        issue.footerNote || ""
      )
    );
  }

  function init(doc) {
    var d = doc || document;
    var root = d.getElementById("news-root");
    var statusEl = d.getElementById("global-status");
    if (!root) return;

    setAriaMessage(statusEl, "Loading newsletter…", "polite");

    var desiredIssueId = getParam("issue");

    Promise.all([fetchJson(NEWS_JSON_URL), fetchJson(STORIES_JSON_URL)])
      .then(function (res) {
        var newsData = res[0] || {};
        var storiesData = res[1] || [];

        var issue = pickIssue(newsData.issues, desiredIssueId);
        if (!issue) {
          root.innerHTML =
            '<div class="news-masthead"><h1 class="news-name">Newsletter</h1><p class="news-tagline">No issues found in news.json.</p></div>';
          setAriaMessage(statusEl, "No newsletter issues found.", "polite");
          return;
        }

        var storyIndex = buildStoryIndex(storiesData);
        renderPaper(root, issue, storyIndex);

        var titleBits = [];
        if (issue.title) titleBits.push(issue.title);
        if (issue.publishedDate) titleBits.push(issue.publishedDate);
        d.title = titleBits.length
          ? titleBits.join(" – ") + " – My Super Calculators"
          : "News – My Super Calculators";

        setAriaMessage(statusEl, "", "polite");
      })
      .catch(function (err) {
        console.error(err);
        root.innerHTML =
          '<div class="news-masthead"><h1 class="news-name">Newsletter</h1><p class="news-tagline">There was a problem loading this newsletter.</p></div>';
        setAriaMessage(statusEl, "Problem loading newsletter.", "polite");
      });
  }

  global.NewsletterTemplate = { init: init };
})(window);
