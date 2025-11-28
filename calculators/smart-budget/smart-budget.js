// calculators/smart-budget/smart-budget.js
(function (global) {
  "use strict";

  const {
    formatCurrency,
    safeNumber,
    setAriaMessage
  } = global.BudgetUtils || {};

  // --------------------------------------------
  // CATEGORY DATA (6 categories)
  // --------------------------------------------
  const categories = [
    {
      name: "Housing (incl. utilities)",
      avgPct: 38,
      targetPct: 30,
      description:
        "Rent or mortgage, property taxes, HOA dues, basic home maintenance, and household utilities like electricity, water, gas, trash, and internet.",
      tip:
        "Tip: Housing costs tend to creep upward every year—review insurance, utilities, and any subscriptions annually to avoid silent increases.",
      superTip:
        "Included with Super+, Subscription Management shows all your recurring charges in one place so you can cancel unwanted ones before they renew."
    },
    {
      name: "Food",
      avgPct: 13,
      targetPct: 11,
      description:
        "Groceries, household staples, work or school lunches, occasional takeout, coffee runs, and snacks.",
      tip:
        "Tip: Planning 3–4 main meals each week and reusing ingredients can cut grocery spending without sacrificing quality.",
      superTip:
        "Earn cashback with Super+ when shopping at grocery stores and restaurants—redirect those savings to your goals."
    },
    {
      name: "Transportation",
      avgPct: 17,
      targetPct: 14,
      description:
        "Car payments, gas, insurance, rideshares, public transit, parking, maintenance, and tolls.",
      tip:
        "Tip: A realistic transportation budget includes maintenance and insurance—not just gas or your car payment.",
      superTip:
        "Use SuperTravel and SuperShop to find savings that reduce your transportation and travel costs over time."
    },
    {
      name: "Healthcare",
      avgPct: 8,
      targetPct: 7,
      description:
        "Insurance premiums, co-pays, deductibles, prescriptions, dental care, vision care, and mental health expenses.",
      tip:
        "Tip: Preventive care and in-network providers can significantly reduce medical surprises later.",
      superTip:
        "Cutting costs in other budget categories using Super+ rewards frees up more room for health needs when they arise."
    },
    {
      name: "Lifestyle / Discretionary",
      avgPct: 14,
      targetPct: 13,
      description:
        "Streaming services, hobbies, vacations, events, dining upgrades, shopping, and personal treats.",
      tip:
        "Tip: Give yourself a guilt-free ‘fun money’ amount each month—once it’s gone, wait until next month before spending more.",
      superTip:
        "Super+ helps you unlock more value from the trips, entertainment, and experiences you already plan to enjoy."
    },
    {
      name: "Savings & Debt",
      avgPct: 10,
      targetPct: 25,
      description:
        "Emergency fund savings, retirement contributions from take-home pay, extra debt payments, and long-term goals.",
      tip:
        "Tip: Automate transfers or debt payments the day after payday so you never miss your saving goals.",
      superTip:
        "Use cashback earned with Super+ to accelerate debt payoff or grow your long-term savings faster."
    }
  ];

  const MAIN_TIP_HTML =
    "Tip: If your actual spending in a category is higher than the target, " +
    "make small adjustments over 1–3 months rather than trying to fix everything at once.";

  function formatMoney(value) {
    if (!global.BudgetUtils) return "—";
    return formatCurrency(value);
  }

  // --------------------------------------------
  // INITIALIZER
  // --------------------------------------------
  function init(root) {
    const scope = root || document;

    const resultsBody        = scope.querySelector("#results-body");
    const incomeForm         = scope.querySelector("#income-form");
    const incomeInput        = scope.querySelector("#income");
    const resetButton        = scope.querySelector("#reset-button");
    const totalAvgAmtCell    = scope.querySelector("#total-avg-amt");
    const totalTargetAmtCell = scope.querySelector("#total-target-amt");
    const categoryDetails    = scope.querySelector("#category-details");
    const tableContainer     = scope.querySelector(".results-table-container");
    const scrollHint         = scope.querySelector("#scroll-hint");
    const errorMessage       = scope.querySelector("#error-message");

    if (!resultsBody || !incomeForm || !incomeInput) return;

    // Reset ARIA expanded on all info buttons in this calculator scope
    function resetInfoButtons() {
      const infoBtns = resultsBody.querySelectorAll(".info-btn");
      infoBtns.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    }

    // --------------------------------------------
    // BUILD TABLE ROWS
    // --------------------------------------------
    function initTable() {
      resultsBody.innerHTML = "";
      categories.forEach((cat, index) => {
        const tr = document.createElement("tr");

        const nameTd = document.createElement("td");
        nameTd.classList.add("name-cell");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = cat.name;

        const infoBtn = document.createElement("button");
        infoBtn.type = "button";
        infoBtn.className = "info-btn";
        infoBtn.textContent = "i";
        infoBtn.setAttribute(
          "aria-label",
          `Show information for ${cat.name}`
        );
        infoBtn.setAttribute("aria-controls", "category-details");
        infoBtn.setAttribute("aria-expanded", "false");
        infoBtn.dataset.index = index;

        nameTd.appendChild(nameSpan);
        nameTd.appendChild(infoBtn);

        const avgPctTd    = document.createElement("td");
        const avgAmtTd    = document.createElement("td");
        const targetPctTd = document.createElement("td");
        const targetAmtTd = document.createElement("td");

        avgPctTd.dataset.role    = "avg-pct";
        avgAmtTd.dataset.role    = "avg-amt";
        targetPctTd.dataset.role = "target-pct";
        targetAmtTd.dataset.role = "target-amt";

        tr.appendChild(nameTd);
        tr.appendChild(avgPctTd);
        tr.appendChild(avgAmtTd);
        tr.appendChild(targetPctTd);
        tr.appendChild(targetAmtTd);

        resultsBody.appendChild(tr);
      });
    }

    // --------------------------------------------
    // UPDATE TABLE BASED ON INCOME
    // --------------------------------------------
    function updateTable(income) {
      let totalAvg = 0;
      let totalTarget = 0;

      const rows = resultsBody.querySelectorAll("tr");
      rows.forEach((row, idx) => {
        const cat = categories[idx];
        const avgPctCell    = row.querySelector('[data-role="avg-pct"]');
        const avgAmtCell    = row.querySelector('[data-role="avg-amt"]');
        const targetPctCell = row.querySelector('[data-role="target-pct"]');
        const targetAmtCell = row.querySelector('[data-role="target-amt"]');

        avgPctCell.textContent    = `${cat.avgPct}%`;
        targetPctCell.textContent = `${cat.targetPct}%`;

        const avgAmt    = (income * cat.avgPct) / 100;
        const targetAmt = (income * cat.targetPct) / 100;

        avgAmtCell.textContent =
          income > 0 ? formatMoney(avgAmt) : "—";
        targetAmtCell.textContent =
          income > 0 ? formatMoney(targetAmt) : "—";

        totalAvg += avgAmt;
        totalTarget += targetAmt;
      });

      totalAvgAmtCell.textContent =
        income > 0 ? formatMoney(totalAvg) : "—";
      totalTargetAmtCell.textContent =
        income > 0 ? formatMoney(totalTarget) : "—";
    }

    // --------------------------------------------
    // SHOW / HIDE SCROLL HINT
    // --------------------------------------------
    function updateScrollHint() {
      if (!tableContainer || !scrollHint) return;
      const needsScroll =
        tableContainer.scrollWidth > tableContainer.clientWidth + 10;
      scrollHint.style.display = needsScroll ? "inline-flex" : "none";
    }

    // --------------------------------------------
    // FORM SUBMIT
    // --------------------------------------------
    incomeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const income = safeNumber(incomeInput.value, 0);

      if (!isFinite(income) || income <= 0) {
        setAriaMessage(
          errorMessage,
          "Please enter a positive monthly take-home income.",
          "polite"
        );
        updateTable(0);
        return;
      }

      setAriaMessage(errorMessage, "", "polite");
      updateTable(income);
    });

    // --------------------------------------------
    // RESET
    // --------------------------------------------
    resetButton.addEventListener("click", () => {
      incomeForm.reset();
      setAriaMessage(errorMessage, "", "polite");
      updateTable(0);
      categoryDetails.innerHTML = MAIN_TIP_HTML;
      resetInfoButtons();
      incomeInput.focus();
    });

    // --------------------------------------------
    // INFO BUTTON HANDLER (with ARIA updates)
    // --------------------------------------------
    resultsBody.addEventListener("click", (event) => {
      const btn = event.target.closest(".info-btn");
      if (!btn) return;

      const idx = Number(btn.dataset.index);
      const cat = categories[idx];
      if (!cat) return;

      const html = `
        <strong>${cat.name}</strong><br/>
        ${cat.description}<br/><br/>
        ${cat.tip}<br/><br/>
        <strong>Super+ Tip</strong><br/>
        <em>${cat.superTip}</em><br/><br/>
        <a href="https://www.super.com/superplus"
           class="btn-primary"
           style="display:inline-block; margin-top:0.5rem;">
           Learn More →
        </a>
      `;
      categoryDetails.innerHTML = html;

      // ARIA: mark this button expanded, others collapsed
      const allInfoBtns = resultsBody.querySelectorAll(".info-btn");
      allInfoBtns.forEach((b) => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", "true");
    });

    // --------------------------------------------
    // INIT
    // --------------------------------------------
    initTable();
    updateTable(0);
    categoryDetails.innerHTML = MAIN_TIP_HTML;
    resetInfoButtons();
    updateScrollHint();

    global.addEventListener("resize", updateScrollHint);
  }

  global.SmartBudget = { init };
})(window);
