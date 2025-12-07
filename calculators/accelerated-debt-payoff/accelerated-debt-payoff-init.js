// calculators/accelerated-debt-payoff/accelerated-debt-payoff-init.js
// Wires up the Accelerated Debt Payoff calculator without inline handlers.

(function () {
  "use strict";

  function setupEventHandlers() {
    // Prefer the named form "debts", fall back to an element with id "debts-form"
    var form = document.forms.debts || document.getElementById("debts-form");
    if (!form) return;

    // For each debt row, only trigger computeLoan when the Monthly payment
    // field loses focus. This lets the user finish entering balance and rate
    // first without being interrupted by the "never paid off" alert.
    for (var line = 1; line <= 10; line++) {
      (function (lineCopy) {
        var paymentInput = document.getElementById("pmt" + lineCopy);
        if (!paymentInput) return;

        paymentInput.addEventListener("blur", function () {
          if (typeof window.computeLoan === "function") {
            window.computeLoan(lineCopy);
          }
        });
      })(line);
    }

    // Extra payment: clear previous results when user edits the value
    var extraInput = document.getElementById("accel_pmt");
    if (extraInput) {
      extraInput.addEventListener("input", function () {
        if (typeof window.clearResults === "function") {
          window.clearResults(form);
        }
      });
    }

    // Calculate results button
    var calcBtn = document.getElementById("btn-calc");
    if (calcBtn) {
      calcBtn.addEventListener("click", function () {
        if (typeof window.computeForm === "function") {
          window.computeForm(form);
        }
      });
    }

    // Clear button: rely on native form reset plus our own cleanup
    var clearBtn = document.getElementById("btn-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        if (typeof window.clearResults === "function") {
          window.clearResults(form);
        }
        if (typeof window.focusFirstDebt === "function") {
          window.focusFirstDebt();
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupEventHandlers);
  } else {
    setupEventHandlers();
  }
})();
