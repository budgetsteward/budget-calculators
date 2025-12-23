// templates/news/template.js
(function (global) {
  "use strict";

  var NEWS_JSON_URL = "../../assets/data/news.json";
  var STORIES_JSON_URL = "../../assets/data/stories.json";

  // Site-level archive page (we'll create later)
  var NEWS_ARCHIVE_PATH = "news-archive.html";

  // NOTE:
  // We keep SITE_ROOT for site-level assets (assets/data, stories, etc).
  // But newsletter images are LOCAL to the newsletter folder:
  //   templates/news/images/...
  // and later the same idea for a real issue:
  //   news/<issue>/images/...
  var SITE_ROOT = new URL("../../", global.location.href);

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

  function viewerHref(category, storyId) {
    return (
      "../../stories/?category=" +
      encodeURIComponent(category) +
      "&story=" +
      encodeURIComponent(storyId)
    );
  }

  function archiveHref() {
    return new URL(NEWS_ARCHIVE_PATH, SITE_ROOT).href;
  }

  function buildStoryIndex(storiesData) {
    var idx = {};
    if (!storiesData) return idx;

    Object.keys(storiesData).forEach(function (categoryKey) {
      var cat = storiesData[categoryKey];
      if (!cat || !Array.isArray(cat.stories)) return;

      cat.stories.forEach(function (s) {
        if (!s || !s.id) return;
        idx[categoryKey + "|" + s.id] = {
          title: s.title || "",
          subtitle: s.subtitle || "",
          description: s.description || "",
          readingTime: s.readingTime || "",
          pdf: s.pdf || "",
          categoryLabel: cat.label || categoryKey
        };
      });
    });

    return idx;
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

    // NEW: Archive button/link on the right side
    var archive = document.createElement("a");
    archive.className = "news-archive-link";
    archive.href = archiveHref();
    archive.textContent = "Archive";
    archive.setAttribute("aria-label", "View newsletter archive");
    right.appendChild(archive);

    top.appendChild(left);
    top.appendChild(right);

    var rule = el("div", "news-rulebar");
    rule.appendChild(el("span", "news-kicker-badge", "🗞️ Front Page"));

    var sectionCount = Array.isArray(issue.sections) ? issue.sections.length : 0;
    if (sectionCount) {
      rule.appendChild(el("span", "news-kicker-badge", sectionCount + " sections"));
    }

    rule.appendChild(el("span", "news-kicker-badge", issue.price || "Free"));

    mast.appendChild(top);
    mast.appendChild(rule);
    return mast;
  }

  /**
   * Image path rules for newsletters:
   * - If src starts with "images/", treat it as LOCAL to the newsletter folder
   *   (templates/news/images or news/<issue>/images).
   * - If src starts with "../" or "./", resolve relative to current page.
   * - If src starts with "assets/" or "stories/" etc, resolve relative to SITE_ROOT.
   * - http/https/data are left as-is.
   */
  function resolveAssetPath(src) {
    if (!src) return "";

    if (
      src.startsWith("http://") ||
      src.startsWith("https://") ||
      src.startsWith("data:")
    ) {
      return src;
    }

    // Explicit relative path
    if (src.startsWith("../") || src.startsWith("./")) {
      return new URL(src, global.location.href).href;
    }

    // LOCAL newsletter images folder (this is the key change)
    if (src.startsWith("images/")) {
      return new URL(src, global.location.href).href;
    }

    // Site-root-ish content (assets/, stories/, etc)
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
    read.href = viewerHref(item.category, item.storyId);
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
      return storyIndex[it.category + "|" + it.storyId];
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
          sectionHint: "Featured"
        })
      );
    }

    if (a) {
      col1.appendChild(
        renderStoryBlock(a.item, metaFor(a.item), {
          sectionLabel: a.sectionLabel || "Inside",
          sectionHint: "Quick read"
        })
      );
    }

    if (b) {
      col2.appendChild(
        renderStoryBlock(b.item, metaFor(b.item), {
          sectionLabel: b.sectionLabel || "Inside",
          sectionHint: ""
        })
      );
    }
    if (c) {
      col2.appendChild(
        renderStoryBlock(c.item, metaFor(c.item), {
          sectionLabel: c.sectionLabel || "More",
          sectionHint: ""
        })
      );
    }
    if (d) {
      col2.appendChild(
        renderStoryBlock(d.item, metaFor(d.item), {
          sectionLabel: d.sectionLabel || "More",
          sectionHint: ""
        })
      );
    }

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
      '<a href="../../stories.html">Browse all stories</a> · <a href="../../calculators.html">Explore calculators</a>';
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
          sectionHint: "Short"
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
        issue.footerNote ||
          "Publisher tip: use 1–2 photos max per issue and keep snippets short for a classic front-page layout."
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

    Promise.all([
      fetch(NEWS_JSON_URL).then(function (r) {
        if (!r.ok) throw new Error("Failed to load news.json");
        return r.json();
      }),
      fetch(STORIES_JSON_URL)
        .then(function (r) {
          if (!r.ok) return null;
          return r.json();
        })
        .catch(function () {
          return null;
        })
    ])
      .then(function (res) {
        var newsData = res[0] || {};
        var storiesData = res[1] || null;

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
