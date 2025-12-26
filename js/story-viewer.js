// js/story-viewer.js
// Handles loading and displaying a single story based on URL parameters.

(function () {
  "use strict";

  var searchParams = new URLSearchParams(window.location.search);
  var categoryParam = searchParams.get("category");
  var storyParam = searchParams.get("story");

  var titleEl = document.getElementById("story-title");
  var subtitleEl = document.getElementById("story-subtitle");
  var descEl = document.getElementById("story-description");
  var categoryEl = document.getElementById("story-category");
  var frameEl = document.getElementById("story-frame");
  var frameWrapperEl = document.getElementById("story-frame-wrapper");
  var downloadLinkEl = document.getElementById("story-download-link");
  var statusEl = document.getElementById("story-status");
  var globalStatusEl = document.getElementById("global-status");

  function setStatus(message) {
    if (statusEl) statusEl.textContent = message || "";
    if (globalStatusEl) globalStatusEl.textContent = message || "";
  }

  function showError(message) {
    if (titleEl) titleEl.textContent = "Story not available";
    if (subtitleEl) subtitleEl.textContent = "";
    if (descEl) descEl.textContent = "";
    if (categoryEl) categoryEl.textContent = "";

    if (frameWrapperEl) frameWrapperEl.style.display = "none";
    if (downloadLinkEl) downloadLinkEl.style.display = "none";

    setStatus(
      message ||
        "We couldn't load this story. Please return to the stories list and try again."
    );
  }

  function init() {
    if (!categoryParam || !storyParam) {
      showError(
        "We couldn't find the requested story. Please return to the stories list and try again."
      );
      return;
    }

    fetch("../assets/data/stories.json")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Failed to load stories metadata.");
        }
        return response.json();
      })
      .then(function (data) {
        var category = data[categoryParam];

        if (!category || !Array.isArray(category.stories)) {
          showError(
            "This story category could not be found. Please return to the stories list."
          );
          return;
        }

        var story = category.stories.find(function (s) {
          return s.id === storyParam;
        });

        if (!story) {
          showError(
            "The requested story could not be found. It may have been removed or renamed."
          );
          return;
        }

        // Update document title
        if (story.title) {
          document.title = story.title + " – My Super Calculators";
        } else {
          document.title = "Story – My Super Calculators";
        }

        // Fill in header details
        if (categoryEl) {
          categoryEl.textContent = category.label
            ? "Category: " + category.label
            : "";
        }

        if (titleEl) {
          titleEl.textContent = story.title || "Untitled story";
        }

        if (subtitleEl) {
          subtitleEl.textContent = story.subtitle || "";
        }

        if (descEl) {
          descEl.textContent = story.description || "";
        }

        // NEW: Prefer HTML story when available; fall back to PDF
        var hasHtml = !!story.html;
        var hasPdf = !!story.pdf;

        if (hasHtml || hasPdf) {
          if (frameWrapperEl) frameWrapperEl.style.display = "block";
          if (frameEl) frameEl.src = hasHtml ? story.html : story.pdf;
          setStatus("");
        } else {
          if (frameWrapperEl) frameWrapperEl.style.display = "none";
          setStatus("This story is missing its content. Please check back later.");
        }

        // Download link remains PDF only (if available)
        if (hasPdf) {
          if (downloadLinkEl) {
            downloadLinkEl.style.display = "inline";
            downloadLinkEl.href = story.pdf;

            if (story.title) {
              var safeName = story.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "");
              downloadLinkEl.setAttribute("download", safeName + ".pdf");
            }
          }
        } else {
          if (downloadLinkEl) downloadLinkEl.style.display = "none";
        }
      })
      .catch(function (err) {
        console.error(err);
        showError(
          "There was a problem loading this story. Please try again later."
        );
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
