// calculators/missing-loan-term/missing-loan-term-init.js
// Initializes the Missing Loan Term calculator when the page loads.

(function () {
  "use strict";

  function init() {
    if (
      window.MissingLoanCalculator &&
      typeof window.MissingLoanCalculator.init === "function"
    ) {
      // Use the whole document as the root, same as the old inline script.
      window.MissingLoanCalculator.init(document);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
