// js/story-viewer.js
// Loads story metadata from stories.json (flat array) and renders:
// - HTML stories inline (no iframe) to avoid iOS double-scroll
// - PDF stories in an iframe as fallback
//
// Supports both URL shapes:
//   New:    /stories/?story=<id>
//   Legacy: /stories/?category=<categoryId>&story=<id>

(function () {
  "use strict";

  const searchParams = new URLSearchParams(window.location.search);
  const categoryParam = searchParams.get("category"); // legacy
  const storyParam = searchParams.get("story");       // required

  const titleEl = document.getElementById("story-title");
  const subtitleEl = document.getElementById("story-subtitle");
  const descEl = document.getElementById("story-description");
  const categoryEl = document.getElementById("story-category");

  const storyContentEl = document.getElementById("story-content");

  const frameEl = document.getElementById("story-frame");
  const frameWrapperEl = document.getElementById("story-frame-wrapper");

  const downloadWrapEl = document.getElementById("story-download");
  const downloadLinkEl = document.getElementById("story-download-link");

  const statusEl = document.getElementById("story-status");
  const globalStatusEl = document.getElementById("global-status");

  const STORIES_URL = "../assets/data/stories.json";
  const CATEGORIES_URL = "../assets/data/categories.json";

  function setStatus(message) {
    const msg = message || "";
    if (statusEl) statusEl.textContent = msg;
    if (globalStatusEl) globalStatusEl.textContent = msg;
  }

  function showError(message) {
    if (titleEl) titleEl.textContent = "Story not available";
    if (subtitleEl) subtitleEl.textContent = "";
    if (descEl) descEl.textContent = "";
    if (categoryEl) categoryEl.textContent = "";

    if (storyContentEl) storyContentEl.style.display = "none";
    if (frameWrapperEl) frameWrapperEl.style.display = "none";
    if (downloadWrapEl) downloadWrapEl.style.display = "none";

    setStatus(
      message ||
        "We couldn't load this story. Please return to the stories list and try again."
    );
  }

  function isAbsoluteUrl(u) {
    return (
      /^([a-z]+:)?\/\//i.test(u) ||
      u.startsWith("data:") ||
      u.startsWith("/") ||
      u.startsWith("#")
    );
  }

  function normalizePath(p) {
    // Normalize stored metadata path (commonly like "news/2026-01-04/stories/x.html")
    // Return without leading slash.
    if (!p || typeof p !== "string") return "";
    return p.charAt(0) === "/" ? p.slice(1) : p;
  }

  function viewerToSitePath(p) {
    // story metadata paths are site-root relative. Viewer is /stories/.
    // Convert "news/..." => "../news/..."
    const np = normalizePath(p);
    if (!np) return "";
    return isAbsoluteUrl(np) ? np : "../" + np;
  }

  function resolveRelative(u, baseDir) {
    if (!u || isAbsoluteUrl(u)) return u;
    if (u.startsWith("./")) u = u.slice(2);
    return baseDir + u;
  }

  function rewriteRelativeUrls(rootEl, baseDir) {
    // Rewrite src, href, srcset
    const nodes = rootEl.querySelectorAll("[src], [href], [srcset]");
    nodes.forEach(function (el) {
      if (el.hasAttribute("src")) {
        el.setAttribute("src", resolveRelative(el.getAttribute("src"), baseDir));
      }

      if (el.hasAttribute("href")) {
        el.setAttribute(
          "href",
          resolveRelative(el.getAttribute("href"), baseDir)
        );
      }

      if (el.hasAttribute("srcset")) {
        const srcset = el.getAttribute("srcset");
        const parts = srcset
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);

        const rewritten = parts.map(function (p) {
          const bits = p.split(/\s+/);
          const url = bits[0];
          bits[0] = resolveRelative(url, baseDir);
          return bits.join(" ");
        });

        el.setAttribute("srcset", rewritten.join(", "));
      }
    });
  }

  function injectHtmlStory(story) {
    if (!storyContentEl) {
      throw new Error("Missing #story-content in stories/index.html");
    }

    // Hide iframe for HTML stories
    if (frameWrapperEl) frameWrapperEl.style.display = "none";
    if (frameEl) frameEl.removeAttribute("src");

    storyContentEl.style.display = "block";
    storyContentEl.innerHTML = "";

    setStatus("Loading story…");

    const htmlUrl = viewerToSitePath(story.html);

    // baseDir = folder containing story.html as seen from viewer page
    // Example story.html: "news/2026-01-04/stories/x.html"
    // => viewer fetch URL "../news/2026-01-04/stories/x.html"
    // => baseDir "../news/2026-01-04/stories/"
    const normalizedHtml = normalizePath(story.html);
    const baseDir = "../" + normalizedHtml.split("/").slice(0, -1).join("/") + "/";

    return fetch(htmlUrl)
      .then(function (r) {
        if (!r.ok) throw new Error("Failed to load story HTML");
        return r.text();
      })
      .then(function (htmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // 1) Inject story-local styles (from story <head>) into viewer <head>
        // Replace previous injected story style to avoid buildup
        const prev = document.getElementById("injected-story-style");
        if (prev) prev.remove();

        const storyStyleNodes = doc.querySelectorAll("style");
        let combinedCss = "";
        storyStyleNodes.forEach(function (s) {
          combinedCss += "\n" + (s.textContent || "");
        });

        if (combinedCss.trim()) {
          const styleEl = document.createElement("style");
          styleEl.id = "injected-story-style";
          styleEl.textContent = combinedCss;
          document.head.appendChild(styleEl);
        }

        // 2) Extract story content reliably
        // Prefer <article class="card">, else <article>, else main, else body
        let content =
          doc.querySelector("article.card") ||
          doc.querySelector("article") ||
          doc.querySelector("main") ||
          doc.body;

        if (!content) throw new Error("Story HTML missing content");

        const clone = content.cloneNode(true);

        // Fix relative image/link paths
        rewriteRelativeUrls(clone, baseDir);

        // 3) Wrap injected content so it looks like a “real story page”
        const wrapper = document.createElement("div");
        wrapper.className = "story-injected-wrap";

        // If we grabbed an article.card, unwrap it so we don't get "card inside card"
        if (
          clone.tagName &&
          clone.tagName.toLowerCase() === "article" &&
          clone.classList.contains("card")
        ) {
          while (clone.firstChild) wrapper.appendChild(clone.firstChild);
        } else {
          wrapper.appendChild(clone);
        }

        storyContentEl.appendChild(wrapper);
        setStatus("");
      });
  }

  function showPdfStory(story) {
    if (storyContentEl) storyContentEl.style.display = "none";
    if (frameWrapperEl) frameWrapperEl.style.display = "block";

    const pdfUrl = viewerToSitePath(story.pdf);
    if (frameEl) frameEl.src = pdfUrl;

    setStatus("");
  }

  function slugifyForDownload(name) {
    return (name || "story")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + url);
      return r.json();
    });
  }

  function categoryLabelFromStory(story, categories) {
    // If legacy categoryParam exists and matches, show that.
    // Otherwise show first category from story.categories.
    // If multiple categories, show the first (simple + clean for now).
    if (!categoryEl) return;

    const map = {};
    (Array.isArray(categories) ? categories : []).forEach(function (c) {
      if (c && c.id) map[c.id] = c.label || c.id;
    });

    let chosen = "";
    if (categoryParam && map[categoryParam]) {
      chosen = map[categoryParam];
    } else if (Array.isArray(story.categories) && story.categories.length > 0) {
      const first = story.categories[0];
      chosen = map[first] || first;
    }

    categoryEl.textContent = chosen ? "Category: " + chosen : "";
  }

  function init() {
    if (!storyParam) {
      showError(
        "We couldn't find the requested story. Please return to the stories list and try again."
      );
      return;
    }

    setStatus("Loading story…");

    Promise.all([fetchJson(STORIES_URL), fetchJson(CATEGORIES_URL)])
      .then(function (results) {
        const storiesData = results[0];
        const categoriesData = results[1];

        // stories.json is now expected to be a flat array.
        // If someone accidentally still has the old shape, fail gracefully.
        if (!Array.isArray(storiesData)) {
          showError(
            "Stories metadata is in an unexpected format. Please check your stories.json structure."
          );
          return;
        }

        const story = storiesData.find(function (s) {
          return s && s.id === storyParam;
        });

        if (!story) {
          showError(
            "The requested story could not be found. It may have been removed or renamed."
          );
          return;
        }

        // Populate viewer hero
        document.title = (story.title || "Story") + " – My Super Calculators";
        if (titleEl) titleEl.textContent = story.title || "Untitled story";
        if (subtitleEl) subtitleEl.textContent = story.subtitle || "";
        if (descEl) descEl.textContent = story.description || "";

        categoryLabelFromStory(story, categoriesData);

        // Download link (if PDF exists)
        const hasPdf = !!story.pdf;
        if (downloadWrapEl) downloadWrapEl.style.display = hasPdf ? "block" : "none";
        if (hasPdf && downloadLinkEl) {
          downloadLinkEl.href = viewerToSitePath(story.pdf);
          downloadLinkEl.setAttribute("download", slugifyForDownload(story.title) + ".pdf");
        }

        // Render story content
        if (story.html) {
          return injectHtmlStory(story).catch(function (err) {
            console.error(err);

            // Fallback to PDF if HTML fails
            if (story.pdf) {
              setStatus("Loaded PDF version (web story unavailable).");
              showPdfStory(story);
              return;
            }

            showError("There was a problem loading this story. Please try again later.");
          });
        }

        if (story.pdf) {
          showPdfStory(story);
          return;
        }

        showError("This story is missing its content. Please check back later.");
      })
      .catch(function (err) {
        console.error(err);
        showError("There was a problem loading this story. Please try again later.");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
