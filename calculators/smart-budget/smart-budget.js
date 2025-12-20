// calculators/smart-budget/smart-budget.js
(function (global) {
  "use strict";

  const Utils = global.BudgetUtils || {};
  const formatCurrency = Utils.formatCurrency || ((n) => `$${Number(n || 0).toFixed(0)}`);
  const safeNumber = Utils.safeNumber || ((v, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  });

  // Category definitions (display + info panel content)
  // Keys MUST match budget-profiles.json categories keys
  const CATEGORY_DEFS = [
    {
      key: "housing",
      name: "Housing (incl. utilities)",
      description:
        "Rent or mortgage, property taxes, HOA dues, basic home maintenance, and household utilities like electricity, water, gas, trash, and internet.",
      tip:
        "Tip: Housing costs tend to creep upward every year—review insurance, utilities, and any subscriptions annually to avoid silent increases.",
      superTip:
        "Included with Super+, Subscription Management shows recurring charges in one place so you can cancel unwanted ones before they renew."
    },
    {
      key: "food",
      name: "Food",
      description:
        "Groceries, household staples, work or school lunches, occasional takeout, coffee runs, and snacks.",
      tip:
        "Tip: Planning a few repeatable meals each week and reusing ingredients can reduce food waste and spending.",
      superTip:
        "Earn cashback with Super+ when shopping at grocery stores and restaurants—redirect those savings to your goals."
    },
    {
      key: "transportation",
      name: "Transportation",
      description:
        "Car payments, gas, insurance, rideshares, public transit, parking, maintenance, and tolls.",
      tip:
        "Tip: A realistic transportation budget includes maintenance and insurance—not just gas or your car payment.",
      superTip:
        "Use SuperTravel and SuperShop to find savings that reduce transportation and travel costs over time."
    },
    {
      key: "healthcare",
      name: "Healthcare",
      description:
        "Insurance premiums, co-pays, deductibles, prescriptions, dental care, vision care, and mental health expenses.",
      tip:
        "Tip: Preventive care and in-network providers can significantly reduce medical surprises later.",
      superTip:
        "Cutting costs in other budget categories using Super+ rewards frees up more room for health needs when they arise."
    },
    {
      key: "lifestyle",
      name: "Lifestyle / Discretionary",
      description:
        "Streaming services, hobbies, vacations, events, dining upgrades, shopping, and personal treats.",
      tip:
        "Tip: Give yourself a guilt-free fun-money amount each month—once it’s gone, wait until next month before spending more.",
      superTip:
        "Super+ helps you unlock more value from the trips, entertainment, and experiences you already plan to enjoy."
    },
    {
      key: "savingsDebt",
      name: "Savings & Debt",
      description:
        "Emergency fund savings, retirement contributions from take-home pay, extra debt payments, and long-term goals.",
      tip:
        "Tip: Automate transfers or debt payments the day after payday so you never miss your saving goals.",
      superTip:
        "Use cashback earned with Super+ to accelerate debt payoff or grow your long-term savings faster."
    }
  ];

  const DEFAULT_PROFILES = {
    categories: CATEGORY_DEFS.map((c) => ({ key: c.key, label: c.name })),
    profiles: [
      {
        id: "typical",
        label: "Typical household",
        description: "A general baseline for many U.S. households.",
        avgPct: { housing: 38, food: 13, transportation: 17, healthcare: 8, lifestyle: 14, savingsDebt: 10 },
        targetPct: { housing: 30, food: 11, transportation: 14, healthcare: 7, lifestyle: 13, savingsDebt: 25 }
      }
    ]
  };

  function isValidId(id) {
    return typeof id === "string" && /^[a-z0-9_-]{2,40}$/i.test(id);
  }

  function pctSum(obj, keys) {
    let sum = 0;
    for (const k of keys) sum += safeNumber(obj?.[k], 0);
    return sum;
  }

  function validateProfilesJson(json) {
    // Defensive parsing: return a normalized object or null
    const categories = Array.isArray(json?.categories) ? json.categories : null;
    const profiles = Array.isArray(json?.profiles) ? json.profiles : null;
    if (!categories || !profiles) return null;

    const keys = categories.map((c) => c?.key).filter(Boolean);
    if (keys.length !== CATEGORY_DEFS.length) return null;

    // Keys must match our known set (prevents a non-dev from accidentally renaming keys and breaking logic)
    const known = new Set(CATEGORY_DEFS.map((c) => c.key));
    for (const k of keys) if (!known.has(k)) return null;

    const normalizedProfiles = [];
    for (const p of profiles) {
      const id = p?.id;
      if (!isValidId(id)) continue;

      const label = typeof p?.label === "string" ? p.label.trim() : "";
      if (!label) continue;

      const avgPct = p?.avgPct || {};
      const targetPct = p?.targetPct || {};

      // Validate ranges + totals
      const avgTotal = pctSum(avgPct, keys);
      const targetTotal = pctSum(targetPct, keys);
      if (Math.round(avgTotal) !== 100) continue;
      if (Math.round(targetTotal) !== 100) continue;

      // Range check
      let ok = true;
      for (const k of keys) {
        const a = safeNumber(avgPct[k], NaN);
        const t = safeNumber(targetPct[k], NaN);
        if (!Number.isFinite(a) || !Number.isFinite(t)) { ok = false; break; }
        if (a < 0 || a > 100 || t < 0 || t > 100) { ok = false; break; }
      }
      if (!ok) continue;

      normalizedProfiles.push({
        id,
        label,
        description: typeof p?.description === "string" ? p.description.trim() : "",
        avgPct: keys.reduce((acc, k) => (acc[k] = safeNumber(avgPct[k], 0), acc), {}),
        targetPct: keys.reduce((acc, k) => (acc[k] = safeNumber(targetPct[k], 0), acc), {})
      });
    }

    if (normalizedProfiles.length === 0) return null;

    return {
      categories: categories.map((c) => ({ key: c.key, label: String(c.label || c.key) })),
      profiles: normalizedProfiles
    };
  }

  function formatMoney(value) {
    return formatCurrency(value);
  }

  function ensureProfileUI(scope) {
    // We’ll look for an existing select; if missing, we’ll inject it above the toggle/table.
    let select = scope.querySelector("#profile-select");
    let label = scope.querySelector('label[for="profile-select"]');
    let help = scope.querySelector("#profile-help");
    let status = scope.querySelector("#profile-status");

    if (select && label) {
      return { select, statusEl: status, helpEl: help };
    }


    // Find a reasonable insertion point: before the mode toggle row if present, else before table.
    const toggleRow = scope.querySelector(".mode-toggle-row");
    const table = scope.querySelector("#budget-table");
    const insertBefore = toggleRow || (table ? table.parentElement : null);

    const wrap = document.createElement("div");
    wrap.className = "profile-row";

    label = document.createElement("label");
    label.setAttribute("for", "profile-select");
    label.textContent = "";

    // Build label text + tooltip
    const labelText = document.createElement("span");
    labelText.textContent = "Budget profile";

    const tooltipWrap = document.createElement("span");
    tooltipWrap.className = "tooltip-wrap";

    const tipBtn = document.createElement("button");
    tipBtn.type = "button";
    tipBtn.className = "tooltip-btn";
    tipBtn.setAttribute("aria-label", "About budget profiles");
    tipBtn.setAttribute("aria-expanded", "false");
    tipBtn.textContent = "?";

    const tipPanel = document.createElement("div");
    tipPanel.className = "tooltip-panel";
    tipPanel.hidden = true;
    tipPanel.textContent =
      "Choose a profile that best matches your situation. The table updates to show how average and target allocations can differ by household type. These are guidelines, not rules.";

    // Assemble tooltip
    tooltipWrap.appendChild(tipBtn);
    tooltipWrap.appendChild(tipPanel);

    // Assemble label
    label.appendChild(labelText);
    label.appendChild(tooltipWrap);

    // Tooltip behavior
    tipBtn.addEventListener("click", () => {
      const open = !tipPanel.hidden;
      tipPanel.hidden = open;
      tipBtn.setAttribute("aria-expanded", String(!open));
    });

    document.addEventListener("click", (e) => {
      if (!tooltipWrap.contains(e.target)) {
        tipPanel.hidden = true;
        tipBtn.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        tipPanel.hidden = true;
        tipBtn.setAttribute("aria-expanded", "false");
      }
    });


    select = document.createElement("select");
    select.id = "profile-select";
    select.name = "profile";
    select.setAttribute("aria-describedby", "profile-help profile-status");

    help = document.createElement("p");
    help.id = "profile-help";
    help.className = "muted";
    help.textContent =
      "Profiles adjust the average and target percentages to better match different household situations.";

    status = document.createElement("div");
    status.id = "profile-status";
    status.className = "sr-only";
    status.setAttribute("aria-live", "polite");

    wrap.appendChild(label);
    wrap.appendChild(select);
    wrap.appendChild(help);
    wrap.appendChild(status);

    if (insertBefore && insertBefore.parentElement) {
      insertBefore.parentElement.insertBefore(wrap, insertBefore);
    } else {
      // Fallback: append near top of calculator
      scope.appendChild(wrap);
    }

    return { select, statusEl: status, helpEl: help };
  }

  function init(root, options = {}) {
    const scope = root || document;

    const resultsBody = scope.querySelector("#results-body");
    const incomeForm = scope.querySelector("#income-form");
    const incomeInput = scope.querySelector("#income");
    const resetButton = scope.querySelector("#reset-button");
    const totalAvgAmtCell = scope.querySelector("#total-avg-amt");
    const totalTargetAmtCell = scope.querySelector("#total-target-amt");
    const categoryDetails = scope.querySelector("#category-details");
    const errorMessage = scope.querySelector("#error-message");

    const modeToggle = scope.querySelector("#mode-toggle");
    const modeStatus = scope.querySelector("#mode-status");
    const budgetTable = scope.querySelector("#budget-table");

    if (!resultsBody || !incomeForm || !incomeInput || !budgetTable) return;

    // Profiles
    const profilesSource = options.profilesJson || global.__SmartBudgetProfilesJson || null;
    const validated = validateProfilesJson(profilesSource) || DEFAULT_PROFILES;

    const profileKeys = validated.categories.map((c) => c.key);
    const profiles = validated.profiles;

    const ui = ensureProfileUI(scope);
    const profileSelect = ui.select;
    const profileStatus = ui.statusEl;

    // pick default profile
    let currentProfileId = profiles[0].id;
    const defaultIdx = profiles.findIndex((p) => p.id === "typical");
    if (defaultIdx >= 0) currentProfileId = "typical";

    function getCurrentProfile() {
      return profiles.find((p) => p.id === currentProfileId) || profiles[0];
    }

    function setMode(isTargetMode) {
      if (isTargetMode) {
        budgetTable.classList.add("show-target");
        if (modeStatus) modeStatus.textContent = "Showing target plan values.";
      } else {
        budgetTable.classList.remove("show-target");
        if (modeStatus) modeStatus.textContent = "Showing average values.";
      }
    }

    function initTable() {
      resultsBody.innerHTML = "";
      CATEGORY_DEFS.forEach((cat, index) => {
        const tr = document.createElement("tr");

        const nameTd = document.createElement("td");
        nameTd.classList.add("name-cell");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = cat.name;

        const infoBtn = document.createElement("button");
        infoBtn.type = "button";
        infoBtn.className = "info-btn";
        infoBtn.textContent = "i";
        infoBtn.setAttribute("aria-label", `Show information for ${cat.name}`);
        infoBtn.setAttribute("aria-controls", "category-details");
        infoBtn.setAttribute("aria-expanded", "false");
        infoBtn.dataset.index = String(index);

        nameTd.appendChild(nameSpan);
        nameTd.appendChild(infoBtn);

        const avgPctTd = document.createElement("td");
        const avgAmtTd = document.createElement("td");
        const targetPctTd = document.createElement("td");
        const targetAmtTd = document.createElement("td");

        avgPctTd.dataset.role = "avg-pct";
        avgAmtTd.dataset.role = "avg-amt";
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

    function updateTable(income) {
      const profile = getCurrentProfile();

      let totalAvg = 0;
      let totalTarget = 0;

      const rows = resultsBody.querySelectorAll("tr");
      rows.forEach((row, idx) => {
        const cat = CATEGORY_DEFS[idx];
        const k = cat.key;

        const avgPctCell = row.querySelector('[data-role="avg-pct"]');
        const avgAmtCell = row.querySelector('[data-role="avg-amt"]');
        const targetPctCell = row.querySelector('[data-role="target-pct"]');
        const targetAmtCell = row.querySelector('[data-role="target-amt"]');

        const avgPct = safeNumber(profile.avgPct?.[k], 0);
        const targetPct = safeNumber(profile.targetPct?.[k], 0);

        avgPctCell.textContent = `${avgPct}%`;
        targetPctCell.textContent = `${targetPct}%`;

        const avgAmt = (income * avgPct) / 100;
        const targetAmt = (income * targetPct) / 100;

        avgAmtCell.textContent = income > 0 ? formatMoney(avgAmt) : "—";
        targetAmtCell.textContent = income > 0 ? formatMoney(targetAmt) : "—";

        totalAvg += avgAmt;
        totalTarget += targetAmt;
      });

      if (totalAvgAmtCell) totalAvgAmtCell.textContent = income > 0 ? formatMoney(totalAvg) : "—";
      if (totalTargetAmtCell) totalTargetAmtCell.textContent = income > 0 ? formatMoney(totalTarget) : "—";
    }

    function resetInfoButtons() {
      const infoBtns = resultsBody.querySelectorAll(".info-btn");
      infoBtns.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    }

    // Populate selector options (textContent only)
    profileSelect.innerHTML = "";
    for (const p of profiles) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.label;
      profileSelect.appendChild(opt);
    }
    profileSelect.value = currentProfileId;

    profileSelect.addEventListener("change", () => {
      currentProfileId = profileSelect.value;

      const p = getCurrentProfile();
      if (profileStatus) profileStatus.textContent = `Profile set to ${p.label}. Table updated.`;

      // Update table using current income
      const income = safeNumber(incomeInput.value, 0);
      updateTable(income > 0 ? income : 0);
    });

    incomeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const income = safeNumber(incomeInput.value, 0);

      if (!Number.isFinite(income) || income <= 0) {
        if (errorMessage) errorMessage.textContent = "Please enter a positive monthly take-home income.";
        updateTable(0);
        return;
      }
      if (errorMessage) errorMessage.textContent = "";
      updateTable(income);
    });

    if (resetButton) {
      resetButton.addEventListener("click", () => {
        incomeForm.reset();
        if (errorMessage) errorMessage.textContent = "";

        // Reset profile
        currentProfileId = (profiles.find((p) => p.id === "typical") ? "typical" : profiles[0].id);
        profileSelect.value = currentProfileId;
        if (profileStatus) profileStatus.textContent = "Profile reset. Showing default profile.";

        // Reset mode
        if (modeToggle) modeToggle.checked = false;
        setMode(false);

        // Reset display
        updateTable(0);
        if (categoryDetails) {
          categoryDetails.textContent =
            "Tip: If your actual spending in a category is higher than the target, make small adjustments over 1–3 months rather than trying to fix everything at once.";
        }
        resetInfoButtons();

        incomeInput.focus();
      });
    }

    if (modeToggle) {
      modeToggle.addEventListener("change", () => {
        setMode(Boolean(modeToggle.checked));
      });
    }

    // Info panel (trusted strings only) + auto-scroll
    resultsBody.addEventListener("click", (event) => {
      const btn = event.target.closest(".info-btn");
      if (!btn) return;

      const idx = Number(btn.dataset.index);
      const cat = CATEGORY_DEFS[idx];
      if (!cat || !categoryDetails) return;

      // Trusted content only (no user input)
      const html = `
        <strong>${cat.name}</strong><br/>
        ${cat.description}<br/><br/>
        ${cat.tip}<br/><br/>
        <strong>Super+ Tip</strong><br/>
        <em>${cat.superTip}</em>
      `;
      categoryDetails.innerHTML = html;

      const allInfoBtns = resultsBody.querySelectorAll(".info-btn");
      allInfoBtns.forEach((b) => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", "true");

      // Auto-scroll to details
      categoryDetails.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Initial render
    initTable();
    setMode(false);
    updateTable(0);

    if (categoryDetails) {
      categoryDetails.textContent =
        "Tip: If your actual spending in a category is higher than the target, make small adjustments over 1–3 months rather than trying to fix everything at once.";
    }
    resetInfoButtons();
  }

  global.SmartBudget = { init };
})(window);
