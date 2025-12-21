// calculators/smart-budget/smart-budget-init.js
(function () {
  "use strict";

  const CSS_ID = "smart-budget-css";
  const JS_ID = "smart-budget-js";
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

  function findExistingStylesheet(hrefEndsWith) {
    const links = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'));
    return (
      links.find((l) => {
        try {
          const u = new URL(l.href, window.location.href);
          return u.pathname.endsWith(hrefEndsWith);
        } catch {
          return false;
        }
      }) || null
    );
  }

  function loadCSSOnce(baseUrl) {
    if (!baseUrl) return;

    // If we already injected it, we're done.
    const existingById = document.getElementById(CSS_ID);
    if (existingById) return;

    // If the page already includes smart-budget.css (calculator page), reuse it and set the id.
    const existingByHref = findExistingStylesheet("smart-budget.css");
    if (existingByHref) {
      existingByHref.id = CSS_ID;
      return;
    }

    // Otherwise inject it (home embed)
    const link = document.createElement("link");
    link.id = CSS_ID;
    link.rel = "stylesheet";
    link.href = new URL("smart-budget.css", baseUrl).href;
    document.head.appendChild(link);
  }

  function loadScriptOnce(baseUrl) {
    return new Promise((resolve, reject) => {
      if (!baseUrl) return resolve();

      // If already present/loaded, done.
      if (window.SmartBudget && typeof window.SmartBudget.init === "function") return resolve();
      if (document.getElementById(JS_ID)) return resolve();

      const script = document.createElement("script");
      script.id = JS_ID;
      script.src = new URL("smart-budget.js", baseUrl).href;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("[SmartBudget] Failed to load smart-budget.js"));
      document.head.appendChild(script);
    });
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
    return json;
  }

  async function loadCategoryInfo(baseUrl) {
    if (!baseUrl) return null;
    const url = new URL("budget-category-info.json", baseUrl).href;

    const json = await loadJson(url);
    if (!json) {
      console.warn("[SmartBudget] Failed to load/parse category info JSON:", url);
      return null;
    }
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
    // Required elements must exist before init can wire everything up.
    return Boolean(
      root.querySelector("#budget-table") &&
        root.querySelector("#results-body") &&
        root.querySelector("#income-form") &&
        root.querySelector("#income")
    );
  }

  function initWhenReady() {
    const root = findRoot();
    if (!root) return false;

    // Wait until the embed markup is present.
    if (!rootLooksReady(root)) return false;

    // Prevent double init if scripts are injected twice or embed re-renders.
    if (root.getAttribute(INIT_FLAG) === "true") return true;

    if (!window.SmartBudget || typeof window.SmartBudget.init !== "function") return false;

    root.setAttribute(INIT_FLAG, "true");
    window.SmartBudget.init(root, {
      profilesJson: window.__SmartBudgetProfilesJson || null,
      categoryInfoJson: window.__SmartBudgetCategoryInfoJson || null
    });

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

    // Ensure assets exist (safe on calculator page + required for home embed)
    loadCSSOnce(baseUrl);

    // Load JS + JSON in parallel (JS required; JSON optional but recommended)
    let profilesJson = null;
    let categoryInfoJson = null;

    try {
      const profilesPromise = loadProfiles(baseUrl);
      const categoryInfoPromise = loadCategoryInfo(baseUrl);

      // Ensure SmartBudget code exists (home embed safety)
      await loadScriptOnce(baseUrl);

      profilesJson = await profilesPromise;
      categoryInfoJson = await categoryInfoPromise;
    } catch (err) {
      console.warn(String(err));
    }

    // Cache for init + any later init calls
    window.__SmartBudgetProfilesJson = profilesJson || null;
    window.__SmartBudgetCategoryInfoJson = categoryInfoJson || null;

    // Try immediately; if home injects later, retry for ~2 seconds
    const start = Date.now();
    const maxMs = 2000;

    (function retry() {
      const ok = initWhenReady();
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
