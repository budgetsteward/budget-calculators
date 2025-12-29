// js/story-redirect.js
// Redirect humans from /news/.../stories/<id>.html to the story viewer:
//   /stories/?story=<id>
// Bots/crawlers stay on the static HTML for SEO.

(function () {
  "use strict";

  // Detect basic bot / crawler user agents
  var ua = (navigator.userAgent || "").toLowerCase();
  var isBot =
    ua.includes("googlebot") ||
    ua.includes("bingbot") ||
    ua.includes("duckduckbot") ||
    ua.includes("slurp") ||
    ua.includes("baiduspider") ||
    ua.includes("yandex");

  if (isBot) return;

  // Determine storyId from a path ending with "/stories/<id>.html"
  var path = window.location.pathname || "/";
  var match = path.match(/\/stories\/([^\/]+)\.html$/);
  if (!match || !match[1]) return;

  var storyId = match[1];

  // Support GitHub Pages base path (e.g., /budget-calculators/)
  var parts = path.split("/").filter(Boolean);
  var base =
    parts.length &&
    parts[0] !== "news" &&
    parts[0] !== "stories" &&
    parts[0] !== "calculators"
      ? "/" + parts[0] + "/"
      : "/";

  window.location.replace(
    base + "stories/?story=" + encodeURIComponent(storyId)
  );
})();
