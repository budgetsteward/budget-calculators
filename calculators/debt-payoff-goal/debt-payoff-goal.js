// calculators/debt-payoff-goal/debt-payoff-goal.js
// Debt Payoff Goal Calculator + Related Stories

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

  // ------------------------------------------------------------
  // Related Stories (NEW)
  // ------------------------------------------------------------

  // IMPORTANT: Must match the key in assets/data/calculator-stories.json
  const CALCULATOR_ID = "debt-payoff-goal";

  function viewerHref(storyId) {
    // This script runs under /calculators/debt-payoff-goal/
    // so we must go up to site root first.
    return "../../stories/?story=" + encodeURIComponent(storyId || "");
  }

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + url);
      return r.json();
    });
  }

  function buildStoriesById(storiesData) {
    const map = {};
    if (!Array.isArray(storiesData)) return map;
    storiesData.forEach(function (s) {
      if (s && s.id) map[s.id] = s;
    });
    return map;
  }

  function findRelatedStoriesHost(scope) {
    return (
      scope.querySelector("#related-stories") ||
      scope.querySelector("[data-related-stories]") ||
      scope.querySelector(".related-stories")
    );
  }

  function renderRelatedStories(scope, relatedRefs, storiesById) {
    const host = findRelatedStoriesHost(scope);
    if (!host) return;

    host.innerHTML = "";
    host.classList.add("related-stories");

    const title = document.createElement("h3");
    title.className = "related-stories-title";
    title.textContent = "Related Stories";
    host.appendChild(title);

    if (!Array.isArray(relatedRefs) || relatedRefs.length === 0) {
      const empty = document.createElement("p");
      empty.className = "related-stories-empty";
      empty.textContent = "No related stories yet.";
      host.appendChild(empty);
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "related-stories-ul";

    relatedRefs.forEach(function (ref) {
      const storyId = ref && ref.storyId ? String(ref.storyId) : "";
      if (!storyId) return;

      const story = storiesById[storyId];
      if (!story) return;

      const li = document.createElement("li");

      const item = document.createElement("div");
      item.className = "related-story-item";

      const icon = document.createElement("span");
      icon.className = "story-icon";
      icon.setAttribute("aria-hidden", "true");

      const textWrap = document.createElement("div");
      textWrap.className = "story-text";

      const a = document.createElement("a");
      a.className = "related-stories-link";
      a.href = viewerHref(storyId);
      a.textContent = story.title || storyId;

      textWrap.appendChild(a);

      if (story.subtitle) {
        const meta = document.createElement("div");
        meta.className = "related-stories-meta";
        meta.textContent = story.subtitle;
        textWrap.appendChild(meta);
      }

      item.appendChild(icon);
      item.appendChild(textWrap);

      li.appendChild(item);
      ul.appendChild(li);
    });

    if (!ul.hasChildNodes()) {
      const empty2 = document.createElement("p");
      empty2.className = "related-stories-empty";
      empty2.textContent = "No related stories yet.";
      host.appendChild(empty2);
      return;
    }

    host.appendChild(ul);
  }

  function initRelatedStories(scope) {
    const calcStoriesUrl = "../../assets/data/calculator-stories.json";
    const storiesUrl = "../../assets/data/stories.json";

    Promise.all([fetchJson(calcStoriesUrl), fetchJson(storiesUrl)])
      .then(function (res) {
        const calcStories = res[0] || {};
        const storiesData = res[1] || [];
        const relatedRefs = calcStories[CALCULATOR_ID] || [];
        const storiesById = buildStoriesById(storiesData);

        renderRelatedStories(scope, relatedRefs, storiesById);
      })
      .catch(function (e) {
        console.warn("Related stories failed to load:", e);
      });
  }

  // ------------------------------------------------------------
  // Calculator init
  // ------------------------------------------------------------

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

      // ✅ Smooth scroll to the info panel
      infoPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    // Initial info panel state
    resetInfoPanel(scope, infoPanel);

    // ✅ NEW: related stories (non-blocking)
    initRelatedStories(scope);
  }

  global.DebtPayoffGoal = {
    init
  };
})(window);
