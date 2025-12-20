// calculators/smart-budget/smart-budget-init.js
(function () {
  "use strict";

  const CSS_ID = "smart-budget-css";
  const INIT_FLAG = "data-smart-budget-initialized";

  function findThisScript() {
    return (
      document.currentScript ||
      document.querySelector(
        'script[src$="smart-budget-init.js"], script[src*="smart-budget-init.js"]'
      )
    );
  }

  function getBaseUrlFromThisScript() {
    const scriptEl = findThisScript();
    if (!scriptEl || !scriptEl.src) return null;
    const scriptUrl = new URL(scriptEl.src, window.location.href);
    return new URL("./", scriptUrl); // folder containing init script
  }

  function loadCSSOnce(baseUrl) {
    if (!baseUrl) return;
    if (document.getElementById(CSS_ID)) return;

    const link = document.createElement("link");
    link.id = CSS_ID;
    link.rel = "stylesheet";
    link.href = new URL("smart-budget.css", baseUrl).href;
    document.head.appendChild(link);
  }

  async function loadJson(url) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async function loadProfiles(baseUrl) {
    if (!baseUrl) return null;
    const url = new URL("budget-profiles.json", baseUrl).href;

    const json = await loadJson(url);
    if (!json) {
      console.warn("[SmartBudget] Failed to load/parse profiles JSON:", url);
      return null;
    }

    console.info("[SmartBudget] Profiles JSON loaded:", url);
    return json;
  }

  function findRoot() {
    // Calculator page root
    const fullPage = document.getElementById("smart-budget");
    if (fullPage) return fullPage;

    // Home spotlight container root
    const embed = document.getElementById("smart-budget-embed");
    if (embed) return embed;

    return null;
  }

  function rootLooksReady(root) {
    // We need these elements to exist before init can wire everything up
    return Boolean(
      root.querySelector("#budget-table") &&
        root.querySelector("#results-body") &&
        root.querySelector("#income-form") &&
        root.querySelector("#income")
    );
  }

  function initWhenReady(profilesJson) {
    const root = findRoot();
    if (!root) return false;

    // If home injects markup inside #smart-budget-embed, the ready elements will be inside it.
    // Wait until they exist.
    if (!rootLooksReady(root)) return false;

    // Prevent double init from home.js or repeated injections
    if (root.getAttribute(INIT_FLAG) === "true") return true;

    if (!window.SmartBudget || typeof window.SmartBudget.init !== "function") return false;

    root.setAttribute(INIT_FLAG, "true");
    window.SmartBudget.init(root, { profilesJson });
    return true;
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  onReady(async () => {
    const baseUrl = getBaseUrlFromThisScript();
    loadCSSOnce(baseUrl);

    // Load and cache profiles for any later init calls
    const profilesJson = await loadProfiles(baseUrl);
    window.__SmartBudgetProfilesJson = profilesJson || null;

    // Try immediately; if home injects later, retry for ~2 seconds
    const start = Date.now();
    const maxMs = 2000;

    (function retry() {
      const ok = initWhenReady(window.__SmartBudgetProfilesJson);
      if (ok) return;

      if (Date.now() - start < maxMs) {
        requestAnimationFrame(retry);
      } else {
        // Not fatal; just means the embed never appeared
        console.warn("[SmartBudget] Init skipped: calculator DOM not found/ready.");
      }
    })();
  });
})();
