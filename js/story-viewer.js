// js/story-viewer.js
// Loads story metadata from stories.json and renders:
// - HTML stories inline (no iframe) to avoid iOS double-scroll
// - PDF stories in an iframe as fallback

(function () {
  "use strict";

  const searchParams = new URLSearchParams(window.location.search);
  const categoryParam = searchParams.get("category");
  const storyParam = searchParams.get("story");

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

    // baseDir is folder containing story.html (relative to /stories/)
    const baseDir = story.html.split("/").slice(0, -1).join("/") + "/";

    setStatus("Loading story…");

    return fetch(story.html)
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

        // If we grabbed an article.card, unwrap it so we don't get a "card inside card"
        // but still keep the inner content styled
        if (clone.tagName && clone.tagName.toLowerCase() === "article" && clone.classList.contains("card")) {
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
    if (frameEl) frameEl.src = story.pdf;
    setStatus("");
  }

  function init() {
    if (!categoryParam || !storyParam) {
      showError(
        "We couldn't find the requested story. Please return to the stories list and try again."
      );
      return;
    }

    setStatus("Loading story…");

    fetch("../assets/data/stories.json")
      .then(function (response) {
        if (!response.ok) throw new Error("Failed to load stories metadata.");
        return response.json();
      })
      .then(function (data) {
        const category = data[categoryParam];

        if (!category || !Array.isArray(category.stories)) {
          showError(
            "This story category could not be found. Please return to the stories list."
          );
          return;
        }

        const story = category.stories.find(function (s) {
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
        if (categoryEl) {
          categoryEl.textContent = category.label
            ? "Category: " + category.label
            : "";
        }
        if (titleEl) titleEl.textContent = story.title || "Untitled story";
        if (subtitleEl) subtitleEl.textContent = story.subtitle || "";
        if (descEl) descEl.textContent = story.description || "";

        // Download link: PDF only
        const hasPdf = !!story.pdf;
        if (downloadWrapEl) downloadWrapEl.style.display = hasPdf ? "block" : "none";
        if (hasPdf && downloadLinkEl) {
          downloadLinkEl.href = story.pdf;

          if (story.title) {
            const safeName = story.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            downloadLinkEl.setAttribute("download", safeName + ".pdf");
          }
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
