// js/stories.js
// Builds the Stories page from:
// - assets/data/stories.json (flat array)
// - assets/data/categories.json (id + label)

(function () {
  "use strict";

  var STORIES_JSON_URL = "assets/data/stories.json";
  var CATEGORIES_JSON_URL = "assets/data/categories.json";
  var ROOT_ID = "stories-root";

  function createEl(tagName, className) {
    var el = document.createElement(tagName);
    if (className) el.className = className;
    return el;
  }

  function setGlobalStatus(message) {
    var globalStatus = document.getElementById("global-status");
    if (globalStatus) globalStatus.textContent = message || "";
  }

  function showStatus(root, message) {
    if (!root) return;
    root.innerHTML = "";

    var p = createEl("p", "item-card-meta");
    p.textContent = message || "There was a problem loading stories.";
    root.appendChild(p);

    setGlobalStatus(message || "");
  }

  function safeArray(val) {
    return Array.isArray(val) ? val : [];
  }

  function normalizePath(p) {
    // Accept "news/..." or "/news/..." and normalize to no leading slash.
    if (!p || typeof p !== "string") return "";
    return p.charAt(0) === "/" ? p.slice(1) : p;
  }

  function viewerHref(storyId) {
    // Viewer URL (new format supported by updated story-viewer.js)
    return "stories/?story=" + encodeURIComponent(storyId || "");
  }

  function fetchJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error("Failed to load " + url);
      return response.json();
    });
  }

  function groupStoriesByCategory(stories) {
    var grouped = {}; // categoryId -> [story...]
    safeArray(stories).forEach(function (s) {
      if (!s || !s.id) return;

      // Keep future-proof: story can be HTML-only, PDF-only, or both
      if (!s.html && !s.pdf) return;

      var cats = safeArray(s.categories);
      if (cats.length === 0) return;

      cats.forEach(function (catId) {
        if (!catId) return;
        if (!grouped[catId]) grouped[catId] = [];
        grouped[catId].push(s);
      });
    });

    // Stable order within a category: title asc (or id fallback)
    Object.keys(grouped).forEach(function (catId) {
      grouped[catId].sort(function (a, b) {
        var at = (a.title || a.id || "").toLowerCase();
        var bt = (b.title || b.id || "").toLowerCase();
        if (at < bt) return -1;
        if (at > bt) return 1;
        return 0;
      });
    });

    return grouped;
  }

  function renderStoryCard(story) {
    var article = createEl("article", "item-card");

    // Optional thumbnail support
    if (story.thumbnail) {
      var thumbWrapper = createEl("div", "item-card-thumbnail");
      var img = document.createElement("img");
      img.src = story.thumbnail;
      img.alt = story.title
        ? 'Thumbnail for "' + story.title + '"'
        : "Story thumbnail";
      thumbWrapper.appendChild(img);
      article.appendChild(thumbWrapper);
    }

    var htmlPath = normalizePath(story.html);
    var pdfPath = normalizePath(story.pdf);

    // Title link:
    // - Prefer HTML (SEO-friendly)
    // - Otherwise, route PDF-only through the viewer
    var titleEl = createEl("h3", "item-card-title");
    var link = document.createElement("a");

    if (htmlPath) {
      link.href = htmlPath;
    } else if (pdfPath) {
      link.href = viewerHref(story.id);
    } else {
      link.href = "#";
    }

    link.textContent = story.title || "Untitled story";
    titleEl.appendChild(link);
    article.appendChild(titleEl);

    if (story.subtitle) {
      var meta = createEl("p", "item-card-meta");
      meta.textContent = story.subtitle;
      article.appendChild(meta);
    }

    if (story.description) {
      var body = createEl("p", "item-card-body");
      body.textContent = story.description;
      article.appendChild(body);
    }

    // Helpful actions if PDF exists
    if (pdfPath) {
      var reader = createEl("p", "item-card-meta");
      var aReader = document.createElement("a");
      aReader.href = viewerHref(story.id);
      aReader.textContent = "Open in Story Viewer";
      reader.appendChild(aReader);
      article.appendChild(reader);

      var dl = createEl("p", "item-card-meta");
      var aDl = document.createElement("a");
      aDl.href = pdfPath;
      aDl.textContent = "Download PDF";
      aDl.setAttribute("download", "");
      dl.appendChild(aDl);
      article.appendChild(dl);
    }

    // Format label
    var formatLabel = createEl("p", "item-card-meta");
    if (htmlPath && pdfPath) {
      formatLabel.textContent = "Format: Web Story + PDF";
    } else if (pdfPath) {
      formatLabel.textContent = "Format: PDF Story";
    } else {
      formatLabel.textContent = "Format: Web Story";
    }
    article.appendChild(formatLabel);

    return article;
  }

  function renderStories(root, categories, stories) {
    if (!root) return;

    root.innerHTML = "";

    var categoryList = safeArray(categories);
    var storyList = safeArray(stories);

    if (categoryList.length === 0) {
      showStatus(root, "No categories are available yet.");
      return;
    }

    if (storyList.length === 0) {
      showStatus(root, "No stories are available yet. Please check back soon.");
      return;
    }

    var grouped = groupStoriesByCategory(storyList);
    var renderedAny = false;

    // Render sections in the order categories.json provides
    categoryList.forEach(function (cat) {
      if (!cat || !cat.id) return;

      var storiesForCat = grouped[cat.id];
      if (!storiesForCat || storiesForCat.length === 0) return;

      renderedAny = true;

      var section = createEl("section", "stories-category-section");
      section.setAttribute("aria-label", cat.label || cat.id);

      var heading = createEl("h2");
      heading.textContent = cat.label || cat.id;
      heading.id = cat.id;
      section.appendChild(heading);

      var list = createEl("div", "item-list");
      storiesForCat.forEach(function (story) {
        list.appendChild(renderStoryCard(story));
      });

      section.appendChild(list);
      root.appendChild(section);
    });

    if (!renderedAny) {
      showStatus(root, "No stories are available yet. Please check back soon.");
    } else {
      setGlobalStatus("");
    }
  }

  function init() {
    var root = document.getElementById(ROOT_ID);
    if (!root) {
      console.error(
        "stories.js: No element with id '" +
          ROOT_ID +
          "' found on this page. Cannot render stories."
      );
      return;
    }

    root.innerHTML = "";
    var loading = createEl("p", "item-card-meta");
    loading.textContent = "Loading stories…";
    root.appendChild(loading);

    setGlobalStatus("Loading stories…");

    Promise.all([fetchJson(CATEGORIES_JSON_URL), fetchJson(STORIES_JSON_URL)])
      .then(function (results) {
        renderStories(root, results[0], results[1]);
      })
      .catch(function (error) {
        console.error(error);
        showStatus(
          root,
          "There was a problem loading stories. Please try again later."
        );
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
