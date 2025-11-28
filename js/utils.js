// js/utils.js
// Shared helpers for formatting, parsing, and basic accessibility.
// Exposes a global object: window.BudgetUtils

(function (global) {
  "use strict";

  /**
   * Basic configuration for localization and formatting.
   * You can change locale/currency here later, or even make it dynamic.
   */
  const config = {
    locale: "en-US",
    currency: "USD",
    currencyMaximumFractionDigits: 0
  };

  /**
   * Create an Intl.NumberFormat for currency, based on current config.
   */
  function createCurrencyFormatter(options) {
    const base = {
      style: "currency",
      currency: config.currency,
      maximumFractionDigits: config.currencyMaximumFractionDigits
    };
    return new Intl.NumberFormat(config.locale, Object.assign(base, options));
  }

  /**
   * Create a generic number formatter.
   */
  function createNumberFormatter(options) {
    const base = {
      maximumFractionDigits: 2
    };
    return new Intl.NumberFormat(config.locale, Object.assign(base, options));
  }

  const currencyFormatter = createCurrencyFormatter();
  const numberFormatter = createNumberFormatter();

  /**
   * Format a numeric value as currency, using current locale & currency.
   * Returns "—" if the value is not a positive number.
   */
  function formatCurrency(value, options) {
    const num = Number(value);
    if (!isFinite(num) || num <= 0) return "—";

    if (options) {
      return createCurrencyFormatter(options).format(num);
    }
    return currencyFormatter.format(num);
  }

  /**
   * Format a number as a percentage string, e.g. 0.125 -> "12.5%".
   * Accepts either a fraction (0.15) or a whole percent (15).
   * - If assumeFraction is true, treats input as 0–1.
   */
  function formatPercent(value, decimals, assumeFraction) {
    const num = Number(value);
    if (!isFinite(num)) return "";

    const d = typeof decimals === "number" ? decimals : 0;
    const pct = assumeFraction ? num * 100 : num;

    return pct.toFixed(d) + "%";
  }

  /**
   * Parse a user-entered numeric string into a Number.
   * - Strips currency symbols, commas, spaces, and percent signs.
   * - Returns NaN if input cannot be parsed.
   */
  function parseNumber(value) {
    if (value === null || value === undefined) return NaN;
    if (typeof value === "number") return value;

    const str = String(value)
      .replace(/[,$%\s]/g, "") // remove commas, $, %, whitespace
      .trim();

    if (!str) return NaN;
    const num = Number(str);
    return isFinite(num) ? num : NaN;
  }

  /**
   * Return a safe number: parsed numeric value if valid, otherwise fallback.
   */
  function safeNumber(value, fallback) {
    const num = parseNumber(value);
    return isFinite(num) ? num : (fallback !== undefined ? fallback : 0);
  }

  /**
   * Clamp a numeric value between min and max.
   */
  function clamp(value, min, max) {
    const num = Number(value);
    if (!isFinite(num)) return NaN;
    return Math.min(Math.max(num, min), max);
  }

  /**
   * Set an ARIA live region message.
   * - elementOrSelector: element or CSS selector string
   * - message: string to announce
   * - politeness: "polite" or "assertive"
   */
  function setAriaMessage(elementOrSelector, message, politeness) {
    let el = elementOrSelector;
    if (typeof elementOrSelector === "string") {
      el = document.querySelector(elementOrSelector);
    }
    if (!el) return;

    const politenessValue = politeness === "assertive" ? "assertive" : "polite";
    el.setAttribute("aria-live", politenessValue);
    el.textContent = message || "";
  }

  /**
   * Attach a keyboard handler that runs when user presses Enter or Space
   * on a non-button element to make it behave like a button.
   * Useful for custom interactive elements if needed.
   */
  function makeClickableWithKeyboard(element, handler) {
    if (!element || typeof handler !== "function") return;

    element.setAttribute("tabindex", "0");
    element.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handler(event);
      }
    });
    element.addEventListener("click", handler);
  }

  /**
   * Add a delegated event listener.
   * - root: element or selector
   * - eventType: "click", "input", etc.
   * - selector: CSS selector to match
   * - handler: callback(event, target)
   */
  function addDelegatedListener(root, eventType, selector, handler) {
    const rootEl =
      typeof root === "string" ? document.querySelector(root) : root;
    if (!rootEl || typeof handler !== "function") return;

    rootEl.addEventListener(eventType, function (event) {
      const target = event.target.closest(selector);
      if (target && rootEl.contains(target)) {
        handler(event, target);
      }
    });
  }

  /**
   * Public API
   */
  const BudgetUtils = {
    // config
    config,

    // formatting
    formatCurrency,
    formatPercent,
    parseNumber,
    safeNumber,
    clamp,

    // Intl formatters if a page needs custom behavior
    createCurrencyFormatter,
    createNumberFormatter,

    // accessibility helpers
    setAriaMessage,
    makeClickableWithKeyboard,
    addDelegatedListener
  };

  global.BudgetUtils = BudgetUtils;
})(window);
