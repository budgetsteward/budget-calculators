// calculators/simple-loan/simple-loan.js
// Simple Loan Calculator
// Uses principal, annual interest rate, and term in years
// to estimate monthly payment and total interest.

(function (global) {
  "use strict";

  const {
    safeNumber,
    formatCurrency,
    setAriaMessage
  } = global.BudgetUtils || {};

  // Info text for the three inputs (shown in the side panel)
  const fieldInfo = {
    principal: {
      title: "Loan amount (principal)",
      body:
        "This is the amount you plan to borrow before interest charges. For an auto or personal loan, this is usually the price minus any down payment.",
      tip:
        "Tip: Round to the nearest dollar. You can adjust later to see how different amounts change your payment."
    },
    rate: {
      title: "Annual interest rate (APR)",
      body:
        "Enter the yearly interest rate charged on the loan. Lenders usually quote this as a percentage (APR).",
      tip:
        "Tip: If your rate is 7.5%, enter 7.5 — not 0.075."
    },
    term: {
      title: "Number of years",
      body:
        "This is how long you will take to repay the loan. The calculator converts years to monthly payments.",
      tip:
        "Tip: Try shorter and longer terms to see how they affect your payment and total interest."
    }
  };

  function calculateMonthlyPayment(principal, annualRatePct, years) {
    const months = years * 12;
    if (!isFinite(months) || months <= 0) return NaN;

    const monthlyRate = annualRatePct / 100 / 12;

    if (!isFinite(monthlyRate) || Math.abs(monthlyRate) < 1e-10) {
      // No interest (or extremely small rate): simple division
      return principal / months;
    }

    const pow = Math.pow(1 + monthlyRate, months);
    return (principal * monthlyRate * pow) / (pow - 1);
  }

  function init(root) {
    const scope = root || document;

    const form = scope.querySelector("#simple-loan-form");
    const principalInput = scope.querySelector("#loan-principal");
    const rateInput = scope.querySelector("#loan-rate");
    const yearsInput = scope.querySelector("#loan-years");
    const resetButton = scope.querySelector("#simple-loan-reset");
    const errorEl = scope.querySelector("#simple-loan-error");
    const resultsEl = scope.querySelector("#simple-loan-results");
    const notesEl = scope.querySelector("#simple-loan-notes");
    const infoPanel = scope.querySelector("#simple-loan-info");

    if (
      !form ||
      !principalInput ||
      !rateInput ||
      !yearsInput ||
      !resetButton ||
      !resultsEl ||
      !infoPanel
    ) {
      // Markup missing: nothing to wire up.
      return;
    }

    function collapseInfoButtons() {
      const infoButtons = scope.querySelectorAll(
        "#simple-loan-form .info-btn"
      );
      infoButtons.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    }

    function resetInfoPanel() {
      // Default message when no specific field is selected
      infoPanel.innerHTML =
        'Click an <strong>info</strong> icon next to an input to see tips for that field.';
      infoPanel.classList.remove("is-hidden");
      collapseInfoButtons();
    }

    function hideInfoPanel() {
      infoPanel.classList.add("is-hidden");
      collapseInfoButtons();
    }

    function hideResultsAndNotes() {
      resultsEl.classList.add("is-hidden");
      if (notesEl) {
        notesEl.classList.add("is-hidden");
      }
    }

    function showResultsAndNotes() {
      resultsEl.classList.remove("is-hidden");
      if (notesEl) {
        notesEl.classList.remove("is-hidden");
      }
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const principal = safeNumber(principalInput.value, NaN);
      const rate = safeNumber(rateInput.value, NaN);
      const years = safeNumber(yearsInput.value, NaN);

      if (
        !isFinite(principal) ||
        principal <= 0 ||
        !isFinite(rate) ||
        rate < 0 ||
        !isFinite(years) ||
        years <= 0
      ) {
        // Invalid inputs: show an error, keep results hidden, and hide any info text
        setAriaMessage(
          errorEl,
          "Please enter a positive loan amount, a non-negative interest rate, and a positive number of years.",
          "polite"
        );
        hideResultsAndNotes();
        hideInfoPanel();
        return;
      }

      // Clear any previous error
      setAriaMessage(errorEl, "", "polite");

      const monthlyPayment = calculateMonthlyPayment(principal, rate, years);
      if (!isFinite(monthlyPayment) || monthlyPayment <= 0) {
        setAriaMessage(
          errorEl,
          "The calculation did not produce a valid payment. Please check your inputs.",
          "polite"
        );
        hideResultsAndNotes();
        hideInfoPanel();
        return;
      }

      const months = Math.round(years * 12);
      const totalPaid = monthlyPayment * months;
      const totalInterest = totalPaid - principal;

      const monthlyDisplay = formatCurrency(monthlyPayment, {
        maximumFractionDigits: 2
      });
      const totalPaidDisplay = formatCurrency(totalPaid, {
        maximumFractionDigits: 2
      });
      const totalInterestDisplay = formatCurrency(totalInterest, {
        maximumFractionDigits: 2
      });

    resultsEl.innerHTML = `
        <div class="results-table" role="group" aria-label="Loan results">

            <div class="results-row">
            <div class="results-label">Estimated monthly payment</div>
            <div class="results-value results-value-strong">${monthlyDisplay}</div>
            </div>

            <div class="results-row">
            <div class="results-label">Number of payments</div>
            <div class="results-value">${months}</div>
            </div>

            <div class="results-row">
            <div class="results-label">Total amount paid</div>
            <div class="results-value">${totalPaidDisplay}</div>
            </div>

            <div class="results-row">
            <div class="results-label">Total interest paid</div>
            <div class="results-value">${totalInterestDisplay}</div>
            </div>

        </div>
        `;


      // Show results + notes, hide any info text that was open
      showResultsAndNotes();
      hideInfoPanel();
    });

    resetButton.addEventListener("click", function () {
      form.reset();
      setAriaMessage(errorEl, "", "polite");

      // After Clear: hide results + notes and hide any info text
      hideResultsAndNotes();
      hideInfoPanel();

      // Focus back on the first field
      principalInput.focus();
    });

    // Info buttons: delegated handler
    form.addEventListener("click", function (event) {
      const btn = event.target.closest(".info-btn");
      if (!btn) return;

      const key = btn.getAttribute("data-field");
      const info = fieldInfo[key];
      if (!info) return;

      infoPanel.innerHTML = `
        <strong>${info.title}</strong><br />
        ${info.body}<br /><br />
        <em>${info.tip}</em>
      `;
      infoPanel.classList.remove("is-hidden");

      const infoButtons = scope.querySelectorAll(
        "#simple-loan-form .info-btn"
      );
      infoButtons.forEach((b) => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", "true");

      // Make sure results stay hidden until a successful calculate
      // (info text is what we want the user to notice in mobile view).
      hideResultsAndNotes();
    });

    // Initial state: no results yet, but show the generic info message
    hideResultsAndNotes();
    resetInfoPanel();
  }

  global.SimpleLoanCalculator = {
    init
  };
})(window);
