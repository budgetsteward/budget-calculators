// calculators/debt-payoff-goal/debt-payoff-goal.js
// Debt Payoff Goal Calculator

(function (global) {
  "use strict";

  const { safeNumber, formatCurrency, setAriaMessage } =
    global.BudgetUtils || {};

  const fieldInfo = {
    balance: {
      title: "Current balance",
      body:
        "Enter the total amount you still owe on this specific debt, including any recent charges that are already on the account.",
      tip:
        "If you’re not sure, check your latest statement or your lender’s website for the current payoff balance."
    },
    rate: {
      title: "Annual interest rate (APR)",
      body:
        "Use the annual percentage rate (APR) for this debt. This is usually printed near the top of your statement or in your account details.",
      tip:
        "Type the whole percent (for example, 18 for 18% APR), not a decimal like 0.18."
    },
    goalDate: {
      title: "Payoff goal date",
      body:
        "Choose the month and year when you’d like this debt to be fully paid off. The calculator will figure out the monthly payment needed to hit that goal.",
      tip:
        "Picking a date a little sooner will increase your monthly payment but cut interest costs. A later date reduces the payment but increases interest."
    }
  };

  function monthsBetweenNowAnd(goalMonth, goalYear) {
    const today = new Date();
    const nowYear = today.getFullYear();
    const nowMonth = today.getMonth() + 1; // 1–12

    const nowIndex = nowYear * 12 + nowMonth;
    const goalIndex = goalYear * 12 + goalMonth;

    return goalIndex - nowIndex;
  }

  function computeMonthlyPayment(principal, numMonths, annualRate) {
    if (numMonths <= 0) return NaN;

    if (!annualRate || annualRate === 0) {
      return principal / numMonths;
    }

    const r = annualRate / 100 / 12; // monthly rate
    const pow = Math.pow(1 + r, numMonths);
    return (principal * r * pow) / (pow - 1);
  }

  function populateYearOptions(yearSelect) {
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    const maxYear = currentYear + 40;

    yearSelect.innerHTML = "";
    for (let y = currentYear; y <= maxYear; y++) {
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = String(y);
      yearSelect.appendChild(opt);
    }
  }

  function setDefaultGoalDate(monthSelect, yearSelect) {
    if (!monthSelect || !yearSelect) return;

    const now = new Date();
    const defaultMonth = now.getMonth() + 1; // same month
    const defaultYear = now.getFullYear() + 1; // next year

    if (!yearSelect.options.length) {
      populateYearOptions(yearSelect);
    }

    monthSelect.value = String(defaultMonth);
    yearSelect.value = String(defaultYear);
  }

  function resetInfoPanel(scope, infoPanel) {
    if (!infoPanel) return;

    infoPanel.innerHTML =
      'Click an <strong>info</strong> icon next to an input to see more detail about how to use that field.';

    const infoButtons = scope.querySelectorAll(".info-btn");
    infoButtons.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
  }

  function init(root) {
    const scope = root || document;

    const form = scope.querySelector("#calc-form");
    const balanceInput = scope.querySelector("#debt-balance");
    const rateInput = scope.querySelector("#annual-rate");
    const goalMonthSelect = scope.querySelector("#goal-month");
    const goalYearSelect = scope.querySelector("#goal-year");
    const resetButton = scope.querySelector("#calc-reset");
    const errorEl = scope.querySelector("#calc-error");
    const resultsEl = scope.querySelector("#calc-results");
    const infoPanel = scope.querySelector("#calc-info-panel");

    if (
      !form ||
      !balanceInput ||
      !rateInput ||
      !goalMonthSelect ||
      !goalYearSelect ||
      !resetButton ||
      !resultsEl ||
      !infoPanel
    ) {
      return;
    }

    // Set initial goal date (same month next year)
    setDefaultGoalDate(goalMonthSelect, goalYearSelect);

    function renderResults(principal, months, payment, totalInterest) {
      const paymentText = formatCurrency(payment, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      const interestText = formatCurrency(totalInterest, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      const monthsText = Number.isFinite(months)
        ? months.toLocaleString("en-US")
        : "—";

      resultsEl.innerHTML = `
        <div class="results-table-container">
          <table>
            <tbody>
              <tr>
                <th scope="row">Required monthly payment</th>
                <td>${paymentText}</td>
              </tr>
              <tr>
                <th scope="row">Months until payoff</th>
                <td>${monthsText}</td>
              </tr>
              <tr>
                <th scope="row">Interest cost until payoff</th>
                <td>${interestText}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const principal = safeNumber(balanceInput.value, NaN);
      const rate = safeNumber(rateInput.value, NaN);
      const goalMonth = Number(goalMonthSelect.value);
      const goalYear = Number(goalYearSelect.value);

      // Basic validation
      if (!isFinite(principal) || principal <= 0) {
        setAriaMessage(
          errorEl,
          "Please enter a valid current balance greater than zero.",
          "polite"
        );
        resultsEl.innerHTML = `
          <p class="muted">
            Enter a valid balance, rate, and payoff date, then select
            <strong>Calculate</strong> to see results.
          </p>
        `;
        return;
      }

      if (!isFinite(rate) || rate < 0) {
        setAriaMessage(
          errorEl,
          "Please enter a valid annual interest rate.",
          "polite"
        );
        resultsEl.innerHTML = `
          <p class="muted">
            Enter a valid balance, rate, and payoff date, then select
            <strong>Calculate</strong> to see results.
          </p>
        `;
        return;
      }

      if (!goalMonth || !goalYear) {
        setAriaMessage(
          errorEl,
          "Please choose a payoff goal month and year.",
          "polite"
        );
        resultsEl.innerHTML = `
          <p class="muted">
            Select a payoff goal date in the future to see the required monthly
            payment.
          </p>
        `;
        return;
      }

      const months = monthsBetweenNowAnd(goalMonth, goalYear);

      if (!Number.isFinite(months) || months <= 0) {
        setAriaMessage(
          errorEl,
          "The payoff goal must be in the future. Please choose a later month or year.",
          "polite"
        );
        resultsEl.innerHTML = `
          <p class="muted">
            Choose a payoff goal date that is after the current month.
          </p>
        `;
        return;
      }

      // Clear previous error
      setAriaMessage(errorEl, "", "polite");

      const payment = computeMonthlyPayment(principal, months, rate);
      if (!isFinite(payment) || payment <= 0) {
        setAriaMessage(
          errorEl,
          "We were unable to compute a valid payment with these inputs. Please double-check your entries.",
          "polite"
        );
        return;
      }

      const totalInterest = payment * months - principal;

      renderResults(principal, months, payment, totalInterest);
    });

    resetButton.addEventListener("click", function () {
      form.reset();
      setAriaMessage(errorEl, "", "polite");
      resultsEl.innerHTML = `
        <p class="muted">
          Enter your values and select <strong>Calculate</strong> to see
          results here.
        </p>
      `;
      setDefaultGoalDate(goalMonthSelect, goalYearSelect);
      resetInfoPanel(scope, infoPanel);
    });

    // Info buttons (delegated)
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

      const infoButtons = scope.querySelectorAll(".info-btn");
      infoButtons.forEach((b) => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", "true");
    });

    // Initial info panel state
    resetInfoPanel(scope, infoPanel);
  }

  global.DebtPayoffGoal = {
    init
  };
})(window);
