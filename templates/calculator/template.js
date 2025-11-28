// templates/calculator/template.js
// Generic pattern for a calculator page.
// When you create a new calculator, copy this file into the calculator's folder,
// rename it (e.g., "missing-loan-term.js"), and update the logic + namespace.

(function (global) {
  "use strict";

  const {
    safeNumber,
    formatCurrency,
    setAriaMessage
  } = global.BudgetUtils || {};

  // Example field info text. When you build a real calculator,
  // update these titles and bodies to explain your inputs.
  const fieldInfo = {
    input1: {
      title: "Input #1",
      body:
        "Describe what this field represents (for example, a monthly payment amount, a loan balance, or a savings goal).",
      tip:
        "Tip: Add a short, practical suggestion that helps people enter a sensible value."
    },
    input2: {
      title: "Input #2",
      body:
        "Describe what this second field represents and how it interacts with the first input.",
      tip:
        "Tip: Use this area to clarify units (months vs. years, percent vs. decimal, etc.)."
    }
  };

  function init(root) {
    const scope = root || document;

    const form = scope.querySelector("#calc-form");
    const input1 = scope.querySelector("#calc-input-1");
    const input2 = scope.querySelector("#calc-input-2");
    const resetButton = scope.querySelector("#calc-reset");
    const errorEl = scope.querySelector("#calc-error");
    const resultsEl = scope.querySelector("#calc-results");
    const infoPanel = scope.querySelector("#calc-info-panel");

    if (!form || !input1 || !input2 || !resetButton || !resultsEl || !infoPanel) {
      // Markup missing: nothing to wire up.
      return;
    }

    function renderResults(value1, value2, computed) {
      resultsEl.innerHTML = `
        <p>
          Based on your inputs of <strong>${value1}</strong> and
          <strong>${value2}</strong>, the computed value is:
        </p>
        <p class="calc-results-strong">
          ${computed}
        </p>
      `;
    }

    function resetInfoPanel() {
      infoPanel.innerHTML =
        'Click an <strong>info</strong> icon next to an input to see more detail about how to use that field.';
      const infoButtons = scope.querySelectorAll(".info-btn");
      infoButtons.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const v1Raw = input1.value;
      const v2Raw = input2.value;

      const v1 = safeNumber(v1Raw, NaN);
      const v2 = safeNumber(v2Raw, NaN);

      if (!isFinite(v1) || !isFinite(v2) || v1 < 0 || v2 < 0) {
        setAriaMessage(
          errorEl,
          "Please enter valid, non-negative numbers in all fields.",
          "polite"
        );
        resultsEl.innerHTML = `
          <p class="muted">
            Enter valid numbers above and select <strong>Calculate</strong> to see results.
          </p>
        `;
        return;
      }

      // Clear any previous error
      setAriaMessage(errorEl, "", "polite");

      // ---------------------------------------------------------
      // TODO: Replace this with your real formula.
      // For now we just add the two numbers and show as currency.
      // ---------------------------------------------------------
      const sum = v1 + v2;
      const formatted = formatCurrency(sum);

      renderResults(v1, v2, formatted);
    });

    resetButton.addEventListener("click", function () {
      form.reset();
      setAriaMessage(errorEl, "", "polite");
      resultsEl.innerHTML = `
        <p class="muted">
          Enter your values and select <strong>Calculate</strong> to see results here.
        </p>
      `;
      resetInfoPanel();
      input1.focus();
    });

    // Info buttons: delegated handler
    form.addEventListener("click", function (event) {
      const btn = event.target.closest(".info-btn");
      if (!btn) return;

      const key = btn.getAttribute("data-field");
      const info = fieldInfo[key];
      if (!info) return;

      infoPanel.innerHTML = `
        <strong>${info.title}</strong><br/>
        ${info.body}<br/><br/>
        <em>${info.tip}</em>
      `;

      // Update aria-expanded states
      const infoButtons = scope.querySelectorAll(".info-btn");
      infoButtons.forEach((b) => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", "true");
    });

    // Initial state
    resultsEl.innerHTML = `
      <p class="muted">
        Enter your values and select <strong>Calculate</strong> to see results here.
      </p>
    `;
    resetInfoPanel();
  }

  // Expose a template namespace.
  // When you copy this file for a real calculator, rename "CalculatorTemplate"
  // to something like "MissingLoanCalculator" and update the init call in HTML.
  global.CalculatorTemplate = {
    init
  };
})(window);
