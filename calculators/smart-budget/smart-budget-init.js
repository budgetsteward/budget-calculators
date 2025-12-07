// calculators/smart-budget/smart-budget-init.js
// Initializes the Smart Budget calculator when its own page loads.

(function () {
  "use strict";

  function init() {
    if (window.SmartBudget && typeof SmartBudget.init === "function") {
      // Use the whole document as the scope, same as before.
      SmartBudget.init(document);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
