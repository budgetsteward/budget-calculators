// calculators/smart-budget/smart-budget.js
(function (global) {
  "use strict";

  const Utils = global.BudgetUtils || {};
  const formatCurrency = Utils.formatCurrency || ((n) => `$${Number(n || 0).toFixed(0)}`);
  const safeNumber =
    Utils.safeNumber ||
    ((v, d = 0) => {
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
      tip: "Tip: Housing costs tend to creep upward every year—review insurance, utilities, and any subscriptions annually to avoid silent increases.",
      superTip:
        "Included with Super+, Subscription Management shows recurring charges in one place so you can cancel unwanted ones before they renew."
    },
    {
      key: "food",
      name: "Food",
      description:
        "Groceries, household staples, work or school lunches, occasional takeout, coffee runs, and snacks.",
      tip: "Tip: Planning a few repeatable meals each week and reusing ingredients can reduce food waste and spending.",
      superTip:
        "Earn cashback with Super+ when shopping at grocery stores and restaurants—redirect those savings to your goals."
    },
    {
      key: "transportation",
      name: "Transportation",
      description:
        "Car payments, gas, insurance, rideshares, public transit, parking, maintenance, and tolls.",
      tip: "Tip: A realistic transportation budget includes maintenance and insurance—not just gas or your car payment.",
      superTip: "Use SuperTravel and SuperShop to find savings that reduce transportation and travel costs over time."
    },
    {
      key: "healthcare",
      name: "Healthcare",
      description:
        "Insurance premiums, co-pays, deductibles, prescriptions, dental care, vision care, and mental health expenses.",
      tip: "Tip: Preventive care and in-network providers can significantly reduce medical surprises later.",
      superTip:
        "Cutting costs in other budget categories using Super+ rewards frees up more room for health needs when they arise."
    },
    {
      key: "lifestyle",
      name: "Lifestyle / Discretionary",
      description:
        "Streaming services, hobbies, vacations, events, dining upgrades, shopping, and personal treats.",
      tip: "Tip: Give yourself a guilt-free fun-money amount each month—once it’s gone, wait until next month before spending more.",
      superTip: "Super+ helps you unlock more value from the trips, entertainment, and experiences you already plan to enjoy."
    },
    {
      key: "savingsDebt",
      name: "Savings & Debt",
      description:
        "Emergency fund savings, retirement contributions from take-home pay, extra debt payments, and long-term goals.",
      tip: "Tip: Automate transfers or debt payments the day after payday so you never miss your saving goals.",
      superTip: "Use cashback earned with Super+ to accelerate debt payoff or grow your long-term savings faster."
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
    const categories = Array.isArray(json?.categories) ? json.categories : null;
    const profiles = Array.isArray(json?.profiles) ? json.profiles : null;
    if (!categories || !profiles) return null;

    const keys = categories.map((c) => c?.key).filter(Boolean);
    if (keys.length !== CATEGORY_DEFS.length) return null;

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

      const avgTotal = pctSum(avgPct, keys);
      const targetTotal = pctSum(targetPct, keys);
      if (Math.round(avgTotal) !== 100) continue;
      if (Math.round(targetTotal) !== 100) continue;

      let ok = true;
      for (const k of keys) {
        const a = safeNumber(avgPct[k], NaN);
        const t = safeNumber(targetPct[k], NaN);
        if (!Number.isFinite(a) || !Number.isFinite(t)) {
          ok = false;
          break;
        }
        if (a < 0 || a > 100 || t < 0 || t > 100) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      normalizedProfiles.push({
        id,
        label,
        description: typeof p?.description === "string" ? p.description.trim() : "",
        avgPct: keys.reduce((acc, k) => ((acc[k] = safeNumber(avgPct[k], 0)), acc), {}),
        targetPct: keys.reduce((acc, k) => ((acc[k] = safeNumber(targetPct[k], 0)), acc), {})
      });
    }

    if (normalizedProfiles.length === 0) return null;

    return {
      categories: categories.map((c) => ({ key: c.key, label: String(c.label || c.key) })),
      profiles: normalizedProfiles
    };
  }

  function validateCategoryInfoJson(json, knownKeys) {
    const categories = Array.isArray(json?.categories) ? json.categories : null;
    if (!categories) return null;

    const byKey = {};
    for (const c of categories) {
      const key = String(c?.key || "").trim();
      if (!key || !knownKeys.has(key)) continue;

      const tipText = typeof c?.tip?.text === "string" ? c.tip.text.trim() : "";
      const tipMoreUrl = typeof c?.tip?.moreUrl === "string" ? c.tip.moreUrl.trim() : "";

      const superHeading =
        typeof c?.superTip?.heading === "string" && c.superTip.heading.trim()
          ? c.superTip.heading.trim()
          : "Super+ Tip";
      const superText = typeof c?.superTip?.text === "string" ? c.superTip.text.trim() : "";
      const superMoreUrl = typeof c?.superTip?.moreUrl === "string" ? c.superTip.moreUrl.trim() : "";

      byKey[key] = {
        heading: typeof c?.heading === "string" ? c.heading.trim() : "",
        description: typeof c?.description === "string" ? c.description.trim() : "",
        tip: { text: tipText, moreUrl: tipMoreUrl },
        superTip: { heading: superHeading, text: superText, moreUrl: superMoreUrl }
      };
    }

    // Must cover all keys (keeps UX consistent)
    for (const k of knownKeys) {
      if (!byKey[k]) return null;
    }

    // NEW: income (optional but recommended)
  const income = json?.income && typeof json.income === "object"
    ? {
        heading: String(json.income.heading || "").trim(),
        description: String(json.income.description || "").trim(),
        tip: {
          text: String(json.income.tip?.text || "").trim(),
          moreUrl: String(json.income.tip?.moreUrl || "").trim()
        },
        superTip: {
          heading: String(json.income.superTip?.heading || "Super+ Tip").trim() || "Super+ Tip",
          text: String(json.income.superTip?.text || "").trim(),
          moreUrl: String(json.income.superTip?.moreUrl || "").trim()
        }
      }
    : null;

    return { byKey, income };
  }

  // FIX: renderDetails must receive scope (root) since it's outside init()
  function renderDetails(categoryDetailsEl, content, scopeEl, expandedButton) {
    if (!categoryDetailsEl) return;

    categoryDetailsEl.innerHTML = ""; // clear

    // Collapse all info buttons (categories + income)
    const allInfoBtns = scopeEl.querySelectorAll(".info-btn");
    allInfoBtns.forEach((b) => b.setAttribute("aria-expanded", "false"));
    if (expandedButton) expandedButton.setAttribute("aria-expanded", "true");

    const h = document.createElement("strong");
    h.textContent = content.heading;
    categoryDetailsEl.appendChild(h);
    categoryDetailsEl.appendChild(document.createElement("br"));

    const desc = document.createElement("span");
    desc.textContent = content.description || "";
    categoryDetailsEl.appendChild(desc);

    // Tip
    categoryDetailsEl.appendChild(document.createElement("br"));
    categoryDetailsEl.appendChild(document.createElement("br"));

    const tipLabel = document.createElement("strong");
    tipLabel.textContent = "Tip";
    categoryDetailsEl.appendChild(tipLabel);
    categoryDetailsEl.appendChild(document.createElement("br"));

    const tipText = document.createElement("span");
    tipText.textContent = content.tipText || "";
    categoryDetailsEl.appendChild(tipText);

    if (content.tipMoreUrl) {
      categoryDetailsEl.appendChild(document.createElement("br"));
      const a = document.createElement("a");
      a.href = content.tipMoreUrl;
      a.target = "_blank";
      a.rel = "noopener";
      a.className = "btn-secondary";
      a.style.marginTop = "0.5rem";
      a.style.display = "inline-block";
      a.textContent = "More info";
      categoryDetailsEl.appendChild(document.createElement("br"));
      categoryDetailsEl.appendChild(a);
    }

    // Super tip
    categoryDetailsEl.appendChild(document.createElement("br"));
    categoryDetailsEl.appendChild(document.createElement("br"));

    const superLabel = document.createElement("strong");
    superLabel.textContent = content.superHeading || "Super+ Tip";
    categoryDetailsEl.appendChild(superLabel);
    categoryDetailsEl.appendChild(document.createElement("br"));

    const superText = document.createElement("em");
    superText.textContent = content.superText || "";
    categoryDetailsEl.appendChild(superText);

    if (content.superMoreUrl) {
      categoryDetailsEl.appendChild(document.createElement("br"));
      const a2 = document.createElement("a");
      a2.href = content.superMoreUrl;
      a2.target = "_blank";
      a2.rel = "noopener";
      a2.className = "btn-secondary";
      a2.style.marginTop = "0.5rem";
      a2.style.display = "inline-block";
      a2.textContent = "More info";
      categoryDetailsEl.appendChild(document.createElement("br"));
      categoryDetailsEl.appendChild(a2);
    }

    categoryDetailsEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function formatMoney(value) {
    return formatCurrency(value);
  }

  function ensureProfileUI(scope) {
    let select = scope.querySelector("#profile-select");
    let label = scope.querySelector('label[for="profile-select"]');
    let help = scope.querySelector("#profile-help");
    let status = scope.querySelector("#profile-status");

    // If markup exists already, keep it as-is (no tooltip enhancement).
    if (select && label) {
      return { select, statusEl: status, helpEl: help };
    }

    // Otherwise inject it (home embed or older markup)
    const toggleRow = scope.querySelector(".mode-toggle-row");
    const table = scope.querySelector("#budget-table");
    const insertBefore = toggleRow || (table ? table.parentElement : null);

    const wrap = document.createElement("div");
    wrap.className = "profile-row";

    label = document.createElement("label");
    label.setAttribute("for", "profile-select");
    label.textContent = "Budget profile";

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

    const knownKeys = new Set(CATEGORY_DEFS.map((c) => c.key));
    const categoryInfoSource = options.categoryInfoJson || global.__SmartBudgetCategoryInfoJson || null;
    const categoryInfo = validateCategoryInfoJson(categoryInfoSource, knownKeys) || null;
    const categoryInfoByKey = categoryInfo?.byKey || null;
    const incomeInfo = categoryInfo?.income || null;

    function setDetailsHtml(html, expandedButton) {
      if (!categoryDetails) return;

      categoryDetails.innerHTML = html;

      // Collapse all info buttons (categories + income)
      const allInfoBtns = scope.querySelectorAll(".info-btn");
      allInfoBtns.forEach((b) => b.setAttribute("aria-expanded", "false"));

      if (expandedButton) expandedButton.setAttribute("aria-expanded", "true");

      categoryDetails.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const incomeInfoBtn = scope.querySelector("#income-info-btn");
    if (incomeInfoBtn && categoryDetails) {
      incomeInfoBtn.addEventListener("click", () => {
        const info = incomeInfo; // may be null if not provided

        if (info) {
          renderDetails(
            categoryDetails,
            {
              heading: info.heading,
              description: info.description,
              tipText: info.tip?.text || "",
              tipMoreUrl: info.tip?.moreUrl || "",
              superHeading: info.superTip?.heading || "Super+ Tip",
              superText: info.superTip?.text || "",
              superMoreUrl: info.superTip?.moreUrl || ""
            },
            scope,
            incomeInfoBtn
          );
          return;
        }

        // If you want: keep a tiny fallback message or just do nothing.
        renderDetails(
          categoryDetails,
          {
            heading: "Monthly take-home income",
            description: "Use your after-tax income (net pay) for the month—what actually lands in your checking account.",
            tipText: "",
            tipMoreUrl: "",
            superHeading: "Super+ Tip",
            superText: "",
            superMoreUrl: ""
          },
          scope,
          incomeInfoBtn
        );
      });
    }


    const modeToggle = scope.querySelector("#mode-toggle");
    const modeStatus = scope.querySelector("#mode-status");
    const budgetTable = scope.querySelector("#budget-table");

    if (!resultsBody || !incomeForm || !incomeInput || !budgetTable) return;

    // Profiles
    const profilesSource = options.profilesJson || global.__SmartBudgetProfilesJson || null;
    const validated = validateProfilesJson(profilesSource) || DEFAULT_PROFILES;

    const profiles = validated.profiles;

    const ui = ensureProfileUI(scope);
    const profileSelect = ui.select;
    const profileStatus = ui.statusEl;

    // pick default profile
    let currentProfileId = profiles[0].id;
    if (profiles.some((p) => p.id === "typical")) currentProfileId = "typical";

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
      if (totalTargetAmtCell)
        totalTargetAmtCell.textContent = income > 0 ? formatMoney(totalTarget) : "—";
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

        currentProfileId = profiles.some((p) => p.id === "typical") ? "typical" : profiles[0].id;
        profileSelect.value = currentProfileId;
        if (profileStatus) profileStatus.textContent = "Profile reset. Showing default profile.";

        if (modeToggle) modeToggle.checked = false;
        setMode(false);

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

    // Info panel + auto-scroll (uses JSON when present; falls back to CATEGORY_DEFS if JSON missing)
    resultsBody.addEventListener("click", (event) => {
      const btn = event.target.closest(".info-btn");
      if (!btn) return;

      const idx = Number(btn.dataset.index);
      const cat = CATEGORY_DEFS[idx];
      if (!cat || !categoryDetails) return;

      const fromJson = categoryInfoByKey ? categoryInfoByKey[cat.key] : null;

      const detailsContent = {
        heading: fromJson?.heading || cat.name,
        description: fromJson?.description || cat.description,
        tipText: fromJson?.tip?.text || String(cat.tip || "").replace(/^Tip:\s*/i, ""),
        tipMoreUrl: fromJson?.tip?.moreUrl || "",
        superHeading: fromJson?.superTip?.heading || "Super+ Tip",
        superText: fromJson?.superTip?.text || cat.superTip,
        superMoreUrl: fromJson?.superTip?.moreUrl || ""
      };

      // FIX: pass scope into renderDetails
      renderDetails(categoryDetails, detailsContent, scope, btn);
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
