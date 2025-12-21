// js/home-alert.js
// Home page only: loads a single site alert from JSON and tracks "last viewed" in localStorage.

(function () {
  "use strict";

  const ALERT_URL = "assets/data/site-alert.json";
  const LS_LAST_VIEWED_KEY = "msc_site_alert_last_viewed"; // ISO datetime string

  const btn = document.getElementById("home-alert-btn");
  const popover = document.getElementById("home-alert-popover");
  const closeBtn = popover ? popover.querySelector(".home-alert-close") : null;
  const headingEl = document.getElementById("home-alert-heading");


  const titleEl = document.getElementById("home-alert-title");
  const dateEl = document.getElementById("home-alert-date");
  const textEl = document.getElementById("home-alert-text");

  // If markup isn't present (non-home pages), do nothing.
  if (!btn || !popover || !headingEl || !dateEl || !textEl) return;


  let postedAtMs = 0;

  function safeParseDateMs(value) {
    const t = Date.parse(value);
    return Number.isFinite(t) ? t : 0;
  }

  function getLastViewedMs() {
    try {
      const raw = localStorage.getItem(LS_LAST_VIEWED_KEY);
      return safeParseDateMs(raw);
    } catch {
      return 0;
    }
  }

  function setLastViewedNow() {
    try {
      localStorage.setItem(LS_LAST_VIEWED_KEY, new Date().toISOString());
    } catch {
      // Ignore storage failures (private mode, disabled, etc.)
    }
  }

  function setUnreadState(isUnread) {
    if (isUnread) btn.classList.add("is-unread");
    else btn.classList.remove("is-unread");
  }

  function isUnread() {
    const lastViewed = getLastViewedMs();
    // Unread if user has never viewed OR last viewed is before postedAt
    return postedAtMs > 0 && lastViewed < postedAtMs;
  }

  function formatPostedDate(isoString) {
    const ms = safeParseDateMs(isoString);
    if (!ms) return "";
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit"
      }).format(new Date(ms));
    } catch {
      return "";
    }
  }

  function openPopover() {
    popover.hidden = false;
    btn.setAttribute("aria-expanded", "true");

    // Mark viewed when opened (or keep it until close if you prefer)
    setLastViewedNow();
    setUnreadState(false);
  }

  function closePopover() {
    popover.hidden = true;
    btn.setAttribute("aria-expanded", "false");
  }

  function togglePopover() {
    if (popover.hidden) openPopover();
    else closePopover();
  }

  function clickOutsideHandler(event) {
    if (popover.hidden) return;

    const target = event.target;
    if (popover.contains(target) || btn.contains(target)) return;

    closePopover();
  }

  function keyHandler(event) {
    if (event.key === "Escape" && !popover.hidden) {
      closePopover();
      btn.focus();
    }
  }

  async function loadAlert() {
    try {
      const res = await fetch(ALERT_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("Failed to load site alert JSON.");
      const data = await res.json();

      const postedAt = String(data.postedAt || "");
      postedAtMs = safeParseDateMs(postedAt);

      const heading = String(data.heading || "").trim();
      const message = String(data.message || "").trim();

      headingEl.textContent = heading || "Update";
      dateEl.textContent = postedAt
        ? "Posted " + formatPostedDate(postedAt)
        : "";
      textEl.textContent =
        message || "No updates are available right now.";


      setUnreadState(isUnread());
    } catch (err) {
      // If alert can't load, hide the bell entirely (quiet failure).
      console.warn("[home-alert] " + String(err));
      btn.style.display = "none";
      popover.style.display = "none";
    }
  }

  // Wire up events
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    togglePopover();
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      closePopover();
      btn.focus();
    });
  }

  document.addEventListener("click", clickOutsideHandler);
  document.addEventListener("keydown", keyHandler);

  // Initial load
  loadAlert();
})();
