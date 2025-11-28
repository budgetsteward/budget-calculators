// js/stories.js
// Builds the Stories page from assets/data/stories.json

(function () {
  "use strict";

  var STORIES_JSON_URL = "assets/data/stories.json";
  var ROOT_ID = "stories-root";

  function createEl(tagName, className) {
    var el = document.createElement(tagName);
    if (className) {
      el.className = className;
    }
    return el;
  }

  function setGlobalStatus(message) {
    var globalStatus = document.getElementById("global-status");
    if (globalStatus) {
      globalStatus.textContent = message || "";
    }
  }

  function showStatus(root, message) {
    if (!root) return;
    root.innerHTML = "";

    var p = createEl("p", "item-card-meta");
    p.textContent = message || "There was a problem loading stories.";
    root.appendChild(p);

    setGlobalStatus(message || "");
  }

  function renderStories(root, data) {
    if (!root) return;

    root.innerHTML = "";

    var categoryKeys = Object.keys(data || {});
    if (categoryKeys.length === 0) {
      showStatus(root, "No stories are available yet. Please check back soon.");
      return;
    }

    // Detect small screens once (phone-ish)
    var isSmallScreen = window.matchMedia("(max-width: 640px)").matches;

    categoryKeys.forEach(function (categoryKey) {
      var category = data[categoryKey];
      if (!category || !Array.isArray(category.stories) || category.stories.length === 0) {
        return;
      }

      var section = createEl("section", "stories-category-section");
      section.setAttribute("aria-label", category.label || categoryKey);

      var heading = createEl("h2");
      heading.textContent = category.label || categoryKey;
      heading.id = categoryKey;
      section.appendChild(heading);

      var list = createEl("div", "item-list");

      category.stories.forEach(function (story) {
        if (!story || !story.id) return;

        var article = createEl("article", "item-card");

        // Optional thumbnail
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

        var titleEl = createEl("h3", "item-card-title");
        var link = document.createElement("a");

        // Desktop / tablet: go to viewer page
        if (!isSmallScreen) {
          link.href =
            "stories/?category=" +
            encodeURIComponent(categoryKey) +
            "&story=" +
            encodeURIComponent(story.id);
        }
        // Small screens: open the PDF directly in a new tab
        else {
          // story.pdf is relative to /stories/, so prefix that folder
          link.href = "stories/" + story.pdf;
          link.target = "_blank";
          link.rel = "noopener";
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

        if (story.readingTime) {
          var readingTime = createEl("p", "item-card-meta");
          readingTime.textContent = "Estimated reading time: " + story.readingTime;
          article.appendChild(readingTime);
        }

        var formatLabel = createEl("p", "item-card-meta");
        formatLabel.textContent = "Format: PDF Story";
        article.appendChild(formatLabel);

        list.appendChild(article);
      });

      section.appendChild(list);
      root.appendChild(section);
    });

    if (!root.hasChildNodes()) {
      showStatus(root, "No stories are available yet. Please check back soon.");
    } else {
      // Clear any loading status for screen readers
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

    fetch(STORIES_JSON_URL)
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load stories.json");
        }
        return response.json();
      })
      .then(function (data) {
        renderStories(root, data);
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
