// calculators/simple-loan/simple-loan.js
// Simple Loan Calculator
// Uses principal, annual interest rate, and term in years
// to estimate monthly payment and total interest.

(function (global) {
  "use strict";

  const Utils = global.BudgetUtils || {};

  // Fallbacks (so this file works even if BudgetUtils isn't present)
  const safeNumber =
    typeof Utils.safeNumber === "function"
      ? Utils.safeNumber
      : function (value, fallback) {
          const n = parseFloat(String(value).trim());
          return Number.isFinite(n) ? n : fallback;
        };

  const formatCurrency =
    typeof Utils.formatCurrency === "function"
      ? Utils.formatCurrency
      : function (amount, options) {
          const opts = Object.assign(
            { style: "currency", currency: "USD" },
            options || {}
          );
          try {
            return new Intl.NumberFormat(undefined, opts).format(amount);
          } catch (e) {
            // Very small fallback
            const fixed =
              typeof opts.maximumFractionDigits === "number"
                ? amount.toFixed(opts.maximumFractionDigits)
                : String(amount);
            return "$" + fixed;
          }
        };

  const setAriaMessage =
    typeof Utils.setAriaMessage === "function"
      ? Utils.setAriaMessage
      : function (el, message) {
          if (!el) return;
          el.textContent = message || "";
        };

  // Info text for the three inputs (shown below Results)
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
      tip: "Tip: If your rate is 7.5%, enter 7.5 — not 0.075."
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
    if (!Number.isFinite(months) || months <= 0) return NaN;

    const monthlyRate = annualRatePct / 100 / 12;

    if (!Number.isFinite(monthlyRate) || Math.abs(monthlyRate) < 1e-10) {
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

    // Ensure core panels are visible (older versions used is-hidden)
    resultsEl.classList.remove("is-hidden");
    if (notesEl) notesEl.classList.remove("is-hidden");
    infoPanel.classList.remove("is-hidden");

    function collapseInfoButtons() {
      const infoButtons = scope.querySelectorAll("#simple-loan-form .info-btn");
      infoButtons.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    }

    function setDefaultResultsMessage() {
      resultsEl.innerHTML = `
        <p class="muted">
          Enter your values and select <strong>Calculate</strong> to see
          your estimated payment and total interest.
        </p>
      `;
    }

    function resetInfoPanel() {
      infoPanel.innerHTML =
        'Click an <strong>info</strong> icon next to an input to see tips for that field.';
      infoPanel.classList.remove("is-hidden");
      collapseInfoButtons();
    }

    function showInfoForKey(key, triggerBtn) {
      const info = fieldInfo[key];
      if (!info) return;

      infoPanel.innerHTML = `
        <strong>${info.title}</strong><br />
        ${info.body}<br /><br />
        <em>${info.tip}</em>
      `;
      infoPanel.classList.remove("is-hidden");

      collapseInfoButtons();
      if (triggerBtn) triggerBtn.setAttribute("aria-expanded", "true");

      // Smooth scroll to the info panel below results
      infoPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function hideInfoPanel() {
      infoPanel.classList.add("is-hidden");
      collapseInfoButtons();
    }

    // Calculate
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const principal = safeNumber(principalInput.value, NaN);
      const rate = safeNumber(rateInput.value, NaN);
      const years = safeNumber(yearsInput.value, NaN);

      if (
        !Number.isFinite(principal) ||
        principal <= 0 ||
        !Number.isFinite(rate) ||
        rate < 0 ||
        !Number.isFinite(years) ||
        years <= 0
      ) {
        setAriaMessage(
          errorEl,
          "Please enter a positive loan amount, a non-negative interest rate, and a positive number of years.",
          "polite"
        );
        return; // Results stay visible; we just show the error
      }

      setAriaMessage(errorEl, "", "polite");

      const monthlyPayment = calculateMonthlyPayment(principal, rate, years);
      if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
        setAriaMessage(
          errorEl,
          "The calculation did not produce a valid payment. Please check your inputs.",
          "polite"
        );
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
    });

    // Clear
    resetButton.addEventListener("click", function () {
      form.reset();
      setAriaMessage(errorEl, "", "polite");
      setDefaultResultsMessage();
      resetInfoPanel();
      principalInput.focus();
    });

    // Info buttons: delegated handler
    form.addEventListener("click", function (event) {
      const btn = event.target.closest(".info-btn");
      if (!btn) return;

      const key = btn.getAttribute("data-field");
      if (!key) return;

      // Toggle behavior: if this one is already expanded and panel visible, collapse it
      const isExpanded = btn.getAttribute("aria-expanded") === "true";
      const isHidden = infoPanel.classList.contains("is-hidden");

      if (isExpanded && !isHidden) {
        hideInfoPanel();
        return;
      }

      showInfoForKey(key, btn);
    });

    // Initial state
    // (Results already have a default message in HTML, but we keep it safe if anything changed.)
    if (!resultsEl.textContent || resultsEl.textContent.trim().length === 0) {
      setDefaultResultsMessage();
    }
    resetInfoPanel();
  }

  global.SimpleLoanCalculator = { init };
})(window);
