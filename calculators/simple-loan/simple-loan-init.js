// calculators/simple-loan/simple-loan-init.js
// Initializes the Simple Loan calculator when the page loads.

(function () {
  "use strict";

  function init() {
    if (
      window.SimpleLoanCalculator &&
      typeof window.SimpleLoanCalculator.init === "function"
    ) {
      // Use the whole document as the root, same as the old inline script.
      window.SimpleLoanCalculator.init(document);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
