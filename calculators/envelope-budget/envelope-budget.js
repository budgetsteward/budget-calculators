/* calculators/envelope-budget/envelope-budget.js
   Envelope Budget (complete)
   - Targets default to 0 (per month)
   - Target editing inside drawer
   - Envelope cards show Target/Actual + accessible over/under cues (income handled differently)
   - Month dropdown sorted DESC (newest first)
   - Prepare Next Month:
       - If no budget exists for real current month => create current month (catch-up)
       - Else => create the month AFTER the one the user is viewing (activeMonthKey)
     Copies TARGETS ONLY
     Button shows only on latest month (newest of existing + current month)
   - Export CSV (current month only) in Target/Actual row format
   - Backup/Import JSON (device transfer):
       - Backup always visible
       - Import visible ONLY if budget is empty (no entries anywhere + all targets 0)
   - Data controls: Delete all Envelope Budget data
   - UX polish:
       - Focus target input if 0 else description
       - Fix two-click envelope switching when target input was focused
       - Clear "Prepared..." and delete messages on next meaningful action
   - Category info panel:
       - Shows typical entries for envelope above "How this calculator works"
       - Loads from Smart Budget: ../smart-budget/budget-category-info.json
*/

(() => {
  "use strict";

  const STORAGE_KEY = "envelopeBudget.v1";

  const ENVELOPES = [
    { id: "income", label: "Income", kind: "income" },
    { id: "housing", label: "Housing", kind: "expense" },
    { id: "food", label: "Food", kind: "expense" },
    { id: "transportation", label: "Transportation", kind: "expense" },
    { id: "healthcare", label: "Healthcare", kind: "expense" },
    { id: "lifestyle", label: "Lifestyle / Discretionary", kind: "expense" },
    { id: "savingsDebt", label: "Savings / Debt", kind: "expense" }
  ];

  // ---------- Utilities ----------
  const pad2 = (n) => String(n).padStart(2, "0");

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function currentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }

  function monthKeyToLabel(monthKey) {
    const [y, m] = String(monthKey).split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleString(undefined, { month: "long", year: "numeric" });
  }

  function compareMonthKeys(a, b) {
    return String(a).localeCompare(String(b));
  }

  function nextMonthKey(monthKey) {
    const [y, m] = String(monthKey).split("-").map(Number);
    let year = y;
    let month = m + 1;
    if (month === 13) {
      month = 1;
      year += 1;
    }
    return `${year}-${pad2(month)}`;
  }

  function parseCurrencyToCents(input) {
    const s = String(input ?? "").trim();
    if (!s) return null;

    const cleaned = s.replace(/[$,\s]/g, "");
    if (!/^[+-]?\d+(\.\d{0,2})?$/.test(cleaned)) return null;

    const negative = cleaned.startsWith("-");
    const abs = cleaned.replace(/^[+-]/, "");
    const [whole, frac = ""] = abs.split(".");
    const frac2 = (frac + "00").slice(0, 2);

    const cents = Number(whole) * 100 + Number(frac2);
    if (!Number.isFinite(cents)) return null;

    return negative ? -cents : cents;
  }

  function formatCents(cents) {
    const sign = cents < 0 ? "-" : "";
    const abs = Math.abs(Number(cents || 0));
    const dollars = Math.floor(abs / 100);
    const centsPart = abs % 100;
    return `${sign}$${dollars.toLocaleString(undefined)}.${pad2(centsPart)}`;
  }

  function safeUUID() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function sumEntriesCents(entries) {
    return entries.reduce((acc, e) => acc + (Number(e.amountCents) || 0), 0);
  }

  function formatTargetForInput(targetCents) {
    const t = Number(targetCents || 0);
    if (t === 0) return "0";
    if (t % 100 === 0) return String(t / 100);
    return (t / 100).toFixed(2);
  }

  // diff = target - actual
  function statusForEnvelope(kind, diff) {
    if (diff === 0) return "neutral";
    if (kind === "income") return diff > 0 ? "warn" : "good"; // short vs ahead
    return diff < 0 ? "warn" : "good"; // over vs left
  }

  // ---------- CSV (current month only) ----------
  function escapeCsv(val) {
    const s = String(val ?? "");
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function centsToPlain(cents) {
    if (cents === "" || cents === null || cents === undefined) return "";
    return (Number(cents) / 100).toString();
  }

  // ---------- Category info (reuse Smart Budget JSON) ----------
  const CATEGORY_INFO_URL = "../smart-budget/budget-category-info.json";
  let categoryInfoByKey = null;

  async function loadCategoryInfo() {
    try {
      const res = await fetch(CATEGORY_INFO_URL, { cache: "no-cache" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // ---------- Storage ----------
  function makeDefaultMonth() {
    const envelopes = {};
    for (const e of ENVELOPES) envelopes[e.id] = { targetCents: 0, entries: [] };
    return { envelopes };
  }

  function makeDefaultState() {
    const mKey = currentMonthKey();
    return {
      version: 1,
      months: { [mKey]: makeDefaultMonth() },
      ui: { lastMonthKey: mKey, lastEnvelopeId: "income" }
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return makeDefaultState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1) return makeDefaultState();
      if (!parsed.months || typeof parsed.months !== "object") parsed.months = {};
      if (!parsed.ui || typeof parsed.ui !== "object") parsed.ui = {};
      return parsed;
    } catch {
      return makeDefaultState();
    }
  }

  function saveState(st) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
  }

  function ensureMonth(st, monthKey) {
    if (!st.months[monthKey]) st.months[monthKey] = makeDefaultMonth();
    const envs = st.months[monthKey].envelopes || (st.months[monthKey].envelopes = {});
    for (const e of ENVELOPES) {
      if (!envs[e.id]) envs[e.id] = { targetCents: 0, entries: [] };
      if (typeof envs[e.id].targetCents !== "number") envs[e.id].targetCents = 0;
      if (!Array.isArray(envs[e.id].entries)) envs[e.id].entries = [];
    }
  }

  // ---------- DOM ----------
  const gridEl = document.querySelector(".eb-grid");
  const monthSelect = document.getElementById("eb-monthSelect");
  const prepareNextBtn = document.getElementById("eb-prepareNextBtn");
  const exportBtn = document.getElementById("eb-exportBtn");

  const drawer = document.getElementById("eb-drawer");
  const drawerTitle = document.getElementById("eb-drawerTitle");
  const drawerMeta = document.getElementById("eb-drawerMeta");
  const drawerClose = document.getElementById("eb-drawerClose");

  const targetLabel = document.getElementById("eb-targetLabel");
  const targetInput = document.getElementById("eb-target");

  const entryForm = document.getElementById("eb-entryForm");
  const descInput = document.getElementById("eb-desc");
  const dateInput = document.getElementById("eb-date");
  const amountInput = document.getElementById("eb-amount");
  const formMsg = document.getElementById("eb-formMsg");
  const entriesList = document.getElementById("eb-entriesList");

  // Data controls
  const backupBtn = document.getElementById("eb-backupBtn");
  const importBtn = document.getElementById("eb-importBtn");
  const importFile = document.getElementById("eb-importFile");
  const forgetBtn = document.getElementById("eb-forgetBtn");
  const forgetMsg = document.getElementById("eb-forgetMsg");

  // Category info section (above "How this calculator works")
  const categoryInfoSection = document.getElementById("eb-category-info");
  const categoryHeadingEl = document.getElementById("eb-category-heading");
  const categoryDescEl = document.getElementById("eb-category-description");

  if (
    !gridEl ||
    !monthSelect ||
    !prepareNextBtn ||
    !exportBtn ||
    !drawer ||
    !entryForm ||
    !targetInput ||
    !drawerTitle ||
    !drawerMeta ||
    !drawerClose ||
    !descInput ||
    !dateInput ||
    !amountInput ||
    !entriesList
  ) {
    console.error("Envelope Budget: required DOM elements not found.");
    return;
  }

  function clearForgetMsg() {
    if (forgetMsg && forgetMsg.textContent) forgetMsg.textContent = "";
  }

  function clearFormMsg() {
    if (formMsg && formMsg.textContent) formMsg.textContent = "";
  }

  // ---------- App State ----------
  let state = loadState();
  let activeMonthKey = state.ui.lastMonthKey || currentMonthKey();
  let activeEnvelopeId = state.ui.lastEnvelopeId || "income";

  // Prevent target blur render from eating envelope click
  let suppressBlurRender = false;

  ensureMonth(state, currentMonthKey());
  ensureMonth(state, activeMonthKey);
  if (!ENVELOPES.some((e) => e.id === activeEnvelopeId)) activeEnvelopeId = "income";
  saveState(state);

  // ---------- Import visibility ----------
  function isBudgetEmpty(st) {
    const months = st?.months && typeof st.months === "object" ? st.months : {};
    for (const mKey of Object.keys(months)) {
      const envs = months[mKey]?.envelopes || {};
      for (const e of ENVELOPES) {
        const env = envs[e.id];
        if (!env) continue;
        const t = Number(env.targetCents || 0);
        if (t !== 0) return false;
        const entries = Array.isArray(env.entries) ? env.entries : [];
        if (entries.length > 0) return false;
      }
    }
    return true;
  }

  function updateImportVisibility() {
    if (!importBtn) return;
    importBtn.hidden = false; // always show
  }

  // ---------- Helpers ----------
  function getLatestMonthKey() {
    const keys = Object.keys(state.months || {});
    keys.push(currentMonthKey()); // include current month even if missing
    keys.sort(compareMonthKeys);
    return keys[keys.length - 1] || currentMonthKey();
  }

  function updatePrepareButtonVisibility() {
    const latest = getLatestMonthKey();
    prepareNextBtn.style.display = activeMonthKey === latest ? "" : "none";
  }

  function envelopeStats(monthKey, envelopeId) {
    const env = state.months[monthKey].envelopes[envelopeId];
    const target = Number(env.targetCents || 0);
    const actual = sumEntriesCents(env.entries || []);
    const diff = target - actual;
    return { target, actual, diff };
  }

  function updateCategoryInfoPanel() {
    if (!categoryInfoSection || !categoryHeadingEl || !categoryDescEl) return;

    // Only show this panel when an envelope (drawer) is open
    if (drawer.hidden) {
      categoryInfoSection.hidden = true;
      return;
    }

    if (!categoryInfoByKey) {
      categoryInfoSection.hidden = true;
      return;
    }

    const info = categoryInfoByKey[activeEnvelopeId];
    if (!info) {
      categoryInfoSection.hidden = true;
      return;
    }

    categoryHeadingEl.textContent = info.heading || "";
    categoryDescEl.textContent = info.description || "";
    categoryInfoSection.hidden = false;
  }

  // ---------- Rendering ----------
  function rebuildMonthSelect() {
    const keys = new Set(Object.keys(state.months || {}));
    keys.add(currentMonthKey());

    // DESCENDING (newest first)
    const all = Array.from(keys).sort((a, b) => String(b).localeCompare(String(a)));

    monthSelect.innerHTML = "";
    for (const k of all) {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = monthKeyToLabel(k);
      monthSelect.appendChild(opt);
    }

    if (!all.includes(activeMonthKey)) activeMonthKey = currentMonthKey();
    monthSelect.value = activeMonthKey;
  }

  function renderGrid() {
    gridEl.innerHTML = "";

    for (const envDef of ENVELOPES) {
      const { id, label, kind } = envDef;
      const { target, actual, diff } = envelopeStats(activeMonthKey, id);
      const status = statusForEnvelope(kind, diff);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "eb-envelope";
      btn.dataset.envelopeId = id;
      btn.dataset.kind = kind;
      btn.dataset.status = status;
      btn.setAttribute("aria-label", `${label} envelope`);
      btn.setAttribute("aria-pressed", id === activeEnvelopeId ? "true" : "false");

      // Mark intent to click another envelope BEFORE blur fires
      btn.addEventListener("pointerdown", () => {
        suppressBlurRender = true;
      });

      const head = document.createElement("div");
      head.className = "eb-envelope__head";

      const name = document.createElement("h3");
      name.className = "eb-envelope__name";
      name.textContent = label;

      const pill = document.createElement("span");
      pill.className = "eb-pill";
      pill.textContent = kind === "income" ? "Income" : "Expense";

      head.appendChild(name);
      head.appendChild(pill);

      const numbers = document.createElement("div");
      numbers.className = "eb-envelope__numbers";

      const targetRow = document.createElement("div");
      targetRow.className = "eb-row";
      const targetLabelSpan = document.createElement("span");
      targetLabelSpan.className = "eb-row__label";
      targetLabelSpan.textContent = "Target";
      const targetValue = document.createElement("span");
      targetValue.className = "eb-row__value";
      targetValue.textContent = formatCents(target);
      targetRow.appendChild(targetLabelSpan);
      targetRow.appendChild(targetValue);

      const actualRow = document.createElement("div");
      actualRow.className = "eb-row";
      const actualLabelSpan = document.createElement("span");
      actualLabelSpan.className = "eb-row__label";
      actualLabelSpan.textContent = "Actual";
      const actualValue = document.createElement("span");
      actualValue.className = "eb-row__value";
      actualValue.textContent = formatCents(actual);
      actualRow.appendChild(actualLabelSpan);
      actualRow.appendChild(actualValue);

      const diffLine = document.createElement("div");
      diffLine.className = `eb-diff eb-diff--${status}`;

      const diffAbs = Math.abs(diff);

      // Accessible wording + symbols (income treated differently)
      if (diff === 0) {
        diffLine.textContent = "• On target";
      } else if (kind === "income") {
        if (diff > 0) diffLine.textContent = `⚠️ Short by ${formatCents(diffAbs)}`;
        else diffLine.textContent = `✓ Ahead by ${formatCents(diffAbs)}`;
      } else {
        if (diff < 0) diffLine.textContent = `⚠️ Over by ${formatCents(diffAbs)}`;
        else diffLine.textContent = `✓ ${formatCents(diffAbs)} left`;
      }

      numbers.appendChild(targetRow);
      numbers.appendChild(actualRow);
      numbers.appendChild(diffLine);

      btn.appendChild(head);
      btn.appendChild(numbers);

      btn.addEventListener("click", () => {
        clearForgetMsg();
        clearFormMsg();
        suppressBlurRender = false;

        activeEnvelopeId = id;
        state.ui.lastEnvelopeId = id;
        saveState(state);

        openDrawer();
        renderAll();
      });

      gridEl.appendChild(btn);
    }
  }

  function updateDrawerHeaderAndTargetEditor() {
    const envDef = ENVELOPES.find((e) => e.id === activeEnvelopeId) || ENVELOPES[0];
    const { target, actual, diff } = envelopeStats(activeMonthKey, activeEnvelopeId);

    drawerTitle.textContent = envDef.label;

    const diffAbs = Math.abs(diff);
    let diffText = "On target";
    if (diff !== 0) {
      if (envDef.kind === "income") {
        diffText = diff > 0 ? `Short by ${formatCents(diffAbs)}` : `Ahead by ${formatCents(diffAbs)}`;
      } else {
        diffText = diff < 0 ? `Over by ${formatCents(diffAbs)}` : `${formatCents(diffAbs)} left`;
      }
    }

    drawerMeta.textContent =
      `${monthKeyToLabel(activeMonthKey)} • Target ${formatCents(target)} • Actual ${formatCents(actual)} • ${diffText}`;

    if (targetLabel) targetLabel.textContent = `Target for ${monthKeyToLabel(activeMonthKey)}`;
    targetInput.value = formatTargetForInput(target);
  }

  function renderEntriesList() {
    const env = state.months[activeMonthKey].envelopes[activeEnvelopeId];
    const entries = Array.isArray(env.entries) ? env.entries.slice() : [];

    entries.sort((a, b) => {
      const da = String(a.date || "");
      const db = String(b.date || "");
      if (da !== db) return db.localeCompare(da);
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    entriesList.innerHTML = "";

    if (entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "eb-empty";
      empty.textContent = "No entries yet. Add your first entry above.";
      entriesList.appendChild(empty);
      return;
    }

    for (const e of entries) {
      const row = document.createElement("div");
      row.className = "eb-entry";
      row.setAttribute("role", "listitem");

      const main = document.createElement("div");
      main.className = "eb-entry__main";

      const line1 = document.createElement("div");
      line1.className = "eb-entry__line1";

      const desc = document.createElement("span");
      desc.className = "eb-entry__desc";
      desc.textContent = e.desc && String(e.desc).trim() ? String(e.desc).trim() : "—";

      const amount = document.createElement("span");
      amount.className = "eb-entry__amount";
      amount.textContent = formatCents(Number(e.amountCents || 0));

      line1.appendChild(desc);
      line1.appendChild(amount);

      const date = document.createElement("div");
      date.className = "eb-entry__date";
      date.textContent = e.date || "";

      main.appendChild(line1);
      main.appendChild(date);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "eb-trash";
      del.textContent = "🗑";
      del.setAttribute("aria-label", `Delete entry: ${desc.textContent} ${amount.textContent} on ${date.textContent}`);

      del.addEventListener("click", () => {
        clearForgetMsg();
        clearFormMsg();
        const ok = confirm("Delete this entry?");
        if (!ok) return;
        deleteEntry(e.id);
      });

      row.appendChild(main);
      row.appendChild(del);
      entriesList.appendChild(row);
    }
  }

  function openDrawer() {
    drawer.hidden = false;

    if (!dateInput.value) dateInput.value = todayISO();

    updateDrawerHeaderAndTargetEditor();
    renderEntriesList();
    updateCategoryInfoPanel();

    drawerTitle.setAttribute("tabindex", "-1");
    drawerTitle.focus({ preventScroll: true });

    const { target } = envelopeStats(activeMonthKey, activeEnvelopeId);
    setTimeout(() => {
      if (target === 0) {
        targetInput.focus({ preventScroll: true });
        targetInput.select();
      } else {
        descInput.focus({ preventScroll: true });
      }
    }, 0);

    drawer.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeDrawer() {
    drawer.hidden = true;
    clearFormMsg();
    if (categoryInfoSection) categoryInfoSection.hidden = true;
  }

  function renderAll() {
    ensureMonth(state, activeMonthKey);
    rebuildMonthSelect();
    updatePrepareButtonVisibility();
    updateImportVisibility();
    renderGrid();

    if (!drawer.hidden) {
      updateDrawerHeaderAndTargetEditor();
      renderEntriesList();
      updateCategoryInfoPanel();
    }
  }

  // ---------- Data ops ----------
  function addEntry({ desc, date, amountCents }) {
    const env = state.months[activeMonthKey].envelopes[activeEnvelopeId];
    env.entries.push({
      id: safeUUID(),
      desc: String(desc || "").trim(),
      date,
      amountCents: Number(amountCents || 0),
      createdAt: Date.now()
    });
    saveState(state);
  }

  function deleteEntry(entryId) {
    const env = state.months[activeMonthKey].envelopes[activeEnvelopeId];
    const before = env.entries.length;
    env.entries = env.entries.filter((e) => e.id !== entryId);
    const after = env.entries.length;
    saveState(state);

    if (formMsg) formMsg.textContent = after < before ? "Entry deleted." : "Entry not found.";
    renderAll();
  }

  function setTargetForActiveEnvelope(newTargetCents, opts = { render: true }) {
    state.months[activeMonthKey].envelopes[activeEnvelopeId].targetCents = newTargetCents;
    saveState(state);
    if (opts.render) renderAll();
  }

  function copyTargetsOnly(fromKey, toKey) {
    ensureMonth(state, fromKey);
    ensureMonth(state, toKey);

    const src = state.months[fromKey].envelopes;
    const dst = state.months[toKey].envelopes;

    for (const envDef of ENVELOPES) {
      const id = envDef.id;
      dst[id].targetCents = Number(src[id].targetCents || 0);
      if (!Array.isArray(dst[id].entries)) dst[id].entries = [];
    }
  }

  function exportCsvCurrentMonth() {
    const header = [
      "Month",
      "Envelope",
      "EnvelopeType",
      "RowType",
      "Date",
      "Description",
      "TargetAmount",
      "ActualAmount"
    ];

    const rows = [header];

    const monthKey = activeMonthKey;
    ensureMonth(state, monthKey);

    for (const envDef of ENVELOPES) {
      const env = state.months[monthKey].envelopes[envDef.id];
      const envelopeType = envDef.kind === "income" ? "Income" : "Expense";

      // Target row
      rows.push([
        monthKey,
        envDef.label,
        envelopeType,
        "Target",
        "",
        "",
        centsToPlain(env.targetCents),
        ""
      ]);

      // Actual rows
      const entries = Array.isArray(env.entries) ? env.entries.slice() : [];
      entries.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

      for (const e of entries) {
        rows.push([
          monthKey,
          envDef.label,
          envelopeType,
          "Actual",
          String(e.date || ""),
          String(e.desc || "").trim(),
          "",
          centsToPlain(e.amountCents)
        ]);
      }
    }

    const csv = rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `envelope-budget-${monthKey}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportBackupJson() {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "envelope-budget-backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function validateAndNormalizeImportedState(json) {
    if (!json || typeof json !== "object") return null;
    if (json.version !== 1) return null;
    if (!json.months || typeof json.months !== "object") return null;

    const cleaned = {
      version: 1,
      months: {},
      ui: { lastMonthKey: currentMonthKey(), lastEnvelopeId: "income" }
    };

    for (const [monthKey, monthObj] of Object.entries(json.months)) {
      if (typeof monthKey !== "string" || !/^\d{4}-\d{2}$/.test(monthKey)) continue;

      cleaned.months[monthKey] = makeDefaultMonth();
      const dstEnvs = cleaned.months[monthKey].envelopes;
      const srcEnvs = monthObj?.envelopes && typeof monthObj.envelopes === "object" ? monthObj.envelopes : {};

      for (const envDef of ENVELOPES) {
        const src = srcEnvs[envDef.id] || {};
        const targetCents = Number(src.targetCents || 0);
        dstEnvs[envDef.id].targetCents = Number.isFinite(targetCents) ? targetCents : 0;

        const entries = Array.isArray(src.entries) ? src.entries : [];
        dstEnvs[envDef.id].entries = entries
          .filter((e) => e && typeof e === "object")
          .map((e) => ({
            id: typeof e.id === "string" ? e.id : safeUUID(),
            desc: String(e.desc || "").trim(),
            date: typeof e.date === "string" ? e.date : "",
            amountCents: Number.isFinite(Number(e.amountCents)) ? Number(e.amountCents) : 0,
            createdAt: Number.isFinite(Number(e.createdAt)) ? Number(e.createdAt) : Date.now()
          }));
      }
    }

    ensureMonth(cleaned, currentMonthKey());

    if (json.ui && typeof json.ui === "object") {
      if (typeof json.ui.lastMonthKey === "string") cleaned.ui.lastMonthKey = json.ui.lastMonthKey;
      if (typeof json.ui.lastEnvelopeId === "string") cleaned.ui.lastEnvelopeId = json.ui.lastEnvelopeId;
    }

    ensureMonth(cleaned, cleaned.ui.lastMonthKey || currentMonthKey());
    if (!ENVELOPES.some((e) => e.id === cleaned.ui.lastEnvelopeId)) cleaned.ui.lastEnvelopeId = "income";

    return cleaned;
  }

  async function importBackupFromFile(file) {
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const cleaned = validateAndNormalizeImportedState(json);
      if (!cleaned) {
        if (forgetMsg) forgetMsg.textContent = "Import failed: invalid backup file.";
        return;
      }

      state = cleaned;
      activeMonthKey = state.ui.lastMonthKey || currentMonthKey();
      activeEnvelopeId = state.ui.lastEnvelopeId || "income";
      ensureMonth(state, activeMonthKey);
      saveState(state);

      drawer.hidden = true;
      if (forgetMsg) forgetMsg.textContent = "Backup imported. This device was updated.";
      renderAll();
    } catch {
      if (forgetMsg) forgetMsg.textContent = "Import failed: could not read that file.";
    }
  }

  function forgetAllData() {
    const ok1 = confirm("This will permanently delete ALL Envelope Budget data stored in this browser. Continue?");
    if (!ok1) return;
    const ok2 = confirm("Are you absolutely sure? This cannot be undone.");
    if (!ok2) return;

    localStorage.removeItem(STORAGE_KEY);

    state = makeDefaultState();
    activeMonthKey = currentMonthKey();
    activeEnvelopeId = "income";
    suppressBlurRender = false;

    ensureMonth(state, activeMonthKey);
    saveState(state);

    drawer.hidden = true;
    clearFormMsg();
    if (forgetMsg) forgetMsg.textContent = "All Envelope Budget data was deleted from this browser.";

    renderAll();
  }

  // ---------- Prepare Next Month ----------
  function prepareFromButton() {
    const curKey = currentMonthKey();
    const hasCurrent = Boolean(state.months[curKey]);

    // If user has no current-month budget, create it first (catch-up).
    // Otherwise, create month AFTER the one they're viewing.
    const targetKey = hasCurrent ? nextMonthKey(activeMonthKey) : curKey;

    // Choose source:
    let sourceKey = null;
    if (!hasCurrent) {
      const existing = Object.keys(state.months || {}).sort(compareMonthKeys);
      sourceKey = existing.length
        ? existing[existing.length - 1]
        : (state.months[activeMonthKey] ? activeMonthKey : null);
    } else {
      sourceKey = activeMonthKey;
    }

    const targetLabel = monthKeyToLabel(targetKey);

    let msg;
    if (!sourceKey) msg = `Create ${targetLabel}? (Targets will start at 0.)`;
    else msg = `Create ${targetLabel} by copying targets from ${monthKeyToLabel(sourceKey)}?`;

    const ok = confirm(msg);
    if (!ok) return;

    ensureMonth(state, targetKey);
    if (sourceKey) copyTargetsOnly(sourceKey, targetKey);

    saveState(state);

    activeMonthKey = targetKey;
    state.ui.lastMonthKey = activeMonthKey;
    saveState(state);

    renderAll();
    openDrawer();

    if (formMsg) {
      formMsg.textContent = `Prepared ${targetLabel} (targets copied).`;
      setTimeout(() => clearFormMsg(), 3000);
    }
  }

  // ---------- Events ----------
  monthSelect.addEventListener("change", () => {
    clearForgetMsg();
    clearFormMsg();

    activeMonthKey = monthSelect.value;
    ensureMonth(state, activeMonthKey);
    state.ui.lastMonthKey = activeMonthKey;
    saveState(state);

    renderAll();
    if (!drawer.hidden) openDrawer();
  });

  prepareNextBtn.addEventListener("click", () => {
    clearForgetMsg();
    clearFormMsg();
    prepareFromButton();
  });

  exportBtn.addEventListener("click", () => {
    clearForgetMsg();
    clearFormMsg();
    exportCsvCurrentMonth();
  });

  drawerClose.addEventListener("click", () => {
    clearForgetMsg();
    clearFormMsg();
    closeDrawer();
  });

  // Target editor updates on blur / Enter
  targetInput.addEventListener("blur", () => {
    clearForgetMsg();
    clearFormMsg();

    const cents = parseCurrencyToCents(targetInput.value);
    const newCents = cents === null ? 0 : cents;

    // Save always; optionally skip render if switching envelopes
    setTargetForActiveEnvelope(newCents, { render: !suppressBlurRender });

    if (suppressBlurRender) {
      setTimeout(() => {
        suppressBlurRender = false;
      }, 0);
    }
  });

  targetInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      targetInput.blur();
    }
  });

  entryForm.addEventListener("submit", (e) => {
    clearForgetMsg();
    clearFormMsg();

    e.preventDefault();
    if (formMsg) formMsg.textContent = "";

    const date = String(dateInput.value || "").trim();
    if (!date) {
      if (formMsg) formMsg.textContent = "Please select a date.";
      dateInput.focus();
      return;
    }

    const cents = parseCurrencyToCents(amountInput.value);
    if (cents === null) {
      if (formMsg) formMsg.textContent = "Enter a valid amount (e.g., 125.50 or -25).";
      amountInput.focus();
      return;
    }
    if (cents === 0) {
      if (formMsg) formMsg.textContent = "Amount cannot be 0.";
      amountInput.focus();
      return;
    }

    addEntry({ desc: descInput.value, date, amountCents: cents });

    descInput.value = "";
    amountInput.value = "";
    descInput.focus();

    if (formMsg) formMsg.textContent = "Entry added.";
    renderAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !drawer.hidden) closeDrawer();
  });

  // Backup/Import/Delete controls
  if (backupBtn) {
    backupBtn.addEventListener("click", () => {
      clearForgetMsg();
      clearFormMsg();
      exportBackupJson();
      if (forgetMsg) forgetMsg.textContent = "Backup exported (JSON).";
    });
  }

  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => {
      clearForgetMsg();
      clearFormMsg();

      const ok1 = confirm(
        "Importing a backup will REPLACE all Envelope Budget data on this device.\n\n" +
        "If you want to keep your current data, click Cancel and use Backup (JSON) first."
      );
      if (!ok1) return;

      const ok2 = confirm("Are you sure you want to replace your current data?");
      if (!ok2) return;

      importFile.value = ""; // allow re-import of same file
      importFile.click();
    });

    importFile.addEventListener("change", async () => {
      clearForgetMsg();
      clearFormMsg();

      const file = importFile.files && importFile.files[0] ? importFile.files[0] : null;
      if (!file) return;

      await importBackupFromFile(file);
    });
  }

  if (forgetBtn) {
    forgetBtn.addEventListener("click", () => {
      // don't clearForgetMsg here; we want the delete message to persist until next action
      forgetAllData();
    });
  }

  // ---------- Boot ----------
  dateInput.value = todayISO();

  // Load category info non-blocking
  (async () => {
    const json = await loadCategoryInfo();
    if (json?.categories && Array.isArray(json.categories)) {
      const map = {};
      for (const c of json.categories) {
        const key = String(c?.key || "").trim();
        if (!key) continue;
        map[key] = {
          heading: String(c?.heading || "").trim(),
          description: String(c?.description || "").trim()
        };
      }
      categoryInfoByKey = map;
    }
    updateCategoryInfoPanel();
  })();

  renderAll();
})();
