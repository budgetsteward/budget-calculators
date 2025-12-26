// js/related-stories.js
// Renders "Related Stories" inside calculators using assets/data/calculator-stories.json

(function () {
  "use strict";

  var STORIES_URL = "../../assets/data/stories.json";
  var MAP_URL = "../../assets/data/calculator-stories.json";

  function $(id) {
    return document.getElementById(id);
  }

  function createEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (typeof text === "string") el.textContent = text;
    return el;
  }

  function getCalculatorSlugFromPath(pathname) {
    // expects: /calculators/<slug>/ (or /calculators/<slug>/index.html)
    var parts = (pathname || "").split("/").filter(Boolean);
    var idx = parts.indexOf("calculators");
    if (idx === -1) return null;
    return parts[idx + 1] || null;
  }

  function findStory(storiesData, categoryKey, storyId) {
    var cat = storiesData && storiesData[categoryKey];
    if (!cat || !Array.isArray(cat.stories)) return null;
    for (var i = 0; i < cat.stories.length; i++) {
      if (cat.stories[i] && cat.stories[i].id === storyId) return cat.stories[i];
    }
    return null;
  }

  function renderRelatedStories(container, slug, mapData, storiesData) {
    container.innerHTML = "";

    var heading = createEl("h3", "related-stories-title", "Related Stories");
    container.appendChild(heading);

    var listWrap = createEl("div", "related-stories-list");
    container.appendChild(listWrap);

    var refs = (mapData && mapData[slug]) || [];
    if (!Array.isArray(refs) || refs.length === 0) {
      listWrap.appendChild(createEl("p", "related-stories-empty", "No related stories yet."));
      return;
    }

    var ul = createEl("ul", "related-stories-ul");
    listWrap.appendChild(ul);

    refs.forEach(function (ref) {
      if (!ref || !ref.category || !ref.storyId) return;

      var story = findStory(storiesData, ref.category, ref.storyId);

      // If mapping points to something missing, just skip (keeps non-dev edits forgiving)
      if (!story) return;

      var li = createEl("li", "related-stories-li related-story-item");

      // icon
      var icon = createEl("span", "story-icon");
      icon.setAttribute("aria-hidden", "true");

      // text wrapper
      var textWrap = createEl("div", "story-text");

      var a = document.createElement("a");
      a.className = "related-stories-link";
      a.href =
        "../../stories/?category=" +
        encodeURIComponent(ref.category) +
        "&story=" +
        encodeURIComponent(ref.storyId);
      a.textContent = story.title || "Untitled story";

      textWrap.appendChild(a);

      if (story.subtitle) {
        textWrap.appendChild(createEl("div", "related-stories-meta", story.subtitle));
      } else if (story.description) {
        textWrap.appendChild(createEl("div", "related-stories-meta", story.description));
      }

      li.appendChild(icon);
      li.appendChild(textWrap);
      ul.appendChild(li);

    });

    // If everything was skipped because of bad IDs, show empty message
    if (!ul.hasChildNodes()) {
      listWrap.innerHTML = "";
      listWrap.appendChild(createEl("p", "related-stories-empty", "No related stories yet."));
    }
  }

  function init(doc) {
    doc = doc || document;

    var container = $("related-stories");
    if (!container) return; // calculator pages without the section won't error

    var slug = getCalculatorSlugFromPath(window.location.pathname);
    if (!slug) {
      container.innerHTML = "";
      container.appendChild(createEl("p", "related-stories-empty", "No related stories yet."));
      return;
    }

    // Load both JSON files
    Promise.all([
      fetch(MAP_URL).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }),
      fetch(STORIES_URL).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; })
    ])
      .then(function (results) {
        var mapData = results[0] || {};
        var storiesData = results[1] || {};
        renderRelatedStories(container, slug, mapData, storiesData);
      })
      .catch(function () {
        // On unexpected failure, still keep the UX clean
        container.innerHTML = "";
        container.appendChild(createEl("p", "related-stories-empty", "No related stories yet."));
      });
  }

  window.RelatedStories = { init: init };
})();
