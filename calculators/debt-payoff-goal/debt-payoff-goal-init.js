// calculators/debt-payoff-goal/debt-payoff-goal-init.js
// Initializes the Debt Payoff Goal calculator when the page loads.

(function () {
  "use strict";

  function init() {
    if (window.DebtPayoffGoal && typeof window.DebtPayoffGoal.init === "function") {
      // Use the whole document as the root, same as the old inline script.
      window.DebtPayoffGoal.init(document);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
