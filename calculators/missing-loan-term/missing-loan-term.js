// calculators/missing-loan-term/missing-loan-term.js
(function (global) {
  "use strict";

  const { setAriaMessage } = global.BudgetUtils || {};

  /* ------------------------------
     Helpers
  --------------------------------*/

  function sn(num) {
    num = num.toString();
    let rnum = "";
    let first = num.charAt(0);
    if (first === "-") rnum = "-";

    for (let i = 0; i < num.length; i++) {
      const c = num.charAt(i);
      if ("0123456789.".includes(c)) rnum += c;
    }

    if (rnum === "" || rnum === "-") return 0;
    return Number(rnum);
  }

  function formatNumber(num, decimals) {
    if (!isFinite(num)) return "";
    const factor = Math.pow(10, decimals);
    return (Math.round(num * factor) / factor).toString();
  }

  /* ------------------------------
     Info text
  --------------------------------*/

  const loanTermTips = {
    principal: {
      title: "Principal (current payoff amount)",
      body:
        "This is the amount you still owe on the loan today — essentially the balance required to pay it off in full.",
      tip:
        "Look for 'principal balance' or 'outstanding balance' on a recent statement."
    },
    interest: {
      title: "Interest rate (APR, %)",
      body:
        "The annual percentage rate (APR) represents the yearly cost of borrowing. This calculator assumes a fixed rate with monthly compounding.",
      tip:
        "Your APR is typically listed on your loan agreement or monthly statement."
    },
    payments: {
      title: "Number of payments remaining",
      body:
        "The total number of scheduled payments left on the loan. A 30-year loan with monthly payments has 360 total payments.",
      tip:
        "Reducing this number can significantly lower total interest paid."
    },
    payment: {
      title: "Payment amount",
      body:
        "Your regular scheduled payment, usually monthly. This includes principal and interest only.",
      tip:
        "If escrow is included, check how much is principal & interest versus taxes or insurance."
    }
  };

  /* ------------------------------
     Internal: compute interest rate
     (Newton method)
  --------------------------------*/

  function computeIntRate(n, P, PMT, guessPct) {
    // n = number of payments
    // P = principal
    // PMT = payment
    // Returns APR percent (not decimal)
    let r = (guessPct || 10) / 100 / 12; // monthly rate guess
    if (!isFinite(r) || r <= 0) r = 0.01;

    // f(r) = PMT - P*r*(1+r)^n / ((1+r)^n - 1) = 0
    // Use Newton-Raphson numeric derivative
    for (let i = 0; i < 50; i++) {
      const pow = Math.pow(1 + r, n);
      const denom = pow - 1;
      if (denom === 0) break;

      const f = PMT - (P * r * pow) / denom;

      const eps = 1e-8;
      const r2 = r + eps;
      const pow2 = Math.pow(1 + r2, n);
      const denom2 = pow2 - 1;
      if (denom2 === 0) break;

      const f2 = PMT - (P * r2 * pow2) / denom2;
      const df = (f2 - f) / eps;

      if (Math.abs(df) < 1e-12) break;

      const next = r - f / df;
      if (!isFinite(next)) break;

      // Constrain to sensible bounds
      r = Math.max(1e-9, Math.min(next, 1)); // up to 1200% APR monthly ~ extreme bound
      if (Math.abs(f) < 1e-10) break;
    }

    return r * 12 * 100;
  }

  /* ------------------------------
     Init
  --------------------------------*/

  function init(root) {
    const scope = root || document;

    const form = scope.querySelector("#missing-loan-form");
    const principalInput = scope.querySelector("#principal");
    const interestInput = scope.querySelector("#interest");
    const paymentsInput = scope.querySelector("#payments");
    const paymentInput = scope.querySelector("#payment");
    const clearButton = scope.querySelector("#loan-clear");
    const errorEl = scope.querySelector("#loan-error");
    const detailsEl = scope.querySelector("#loan-term-details");

    if (
      !form ||
      !principalInput ||
      !interestInput ||
      !paymentsInput ||
      !paymentInput ||
      !clearButton ||
      !detailsEl
    ) {
      return;
    }

    function clearHighlights() {
      scope
        .querySelectorAll(".loan-input")
        .forEach((el) => el.classList.remove("highlight-input"));
    }

    function resetInfoButtons() {
      scope
        .querySelectorAll(".info-btn")
        .forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    }

    function resetDetails() {
      detailsEl.innerHTML =
        'Click an <strong>info</strong> icon next to a field to see more detail about that value and how to think about it.';
      resetInfoButtons();
    }

    function clearLoanForm() {
      form.reset();
      if (setAriaMessage) setAriaMessage(errorEl, "", "polite");
      clearHighlights();
      resetDetails();
    }

    /* ------------------------------
       Computation (unchanged)
    --------------------------------*/

    function computeMissingValue() {
      if (setAriaMessage) setAriaMessage(errorEl, "", "polite");
      clearHighlights();

      const hasP = principalInput.value.trim() !== "";
      const hasR = interestInput.value.trim() !== "";
      const hasN = paymentsInput.value.trim() !== "";
      const hasPMT = paymentInput.value.trim() !== "";

      const filled = [hasP, hasR, hasN, hasPMT].filter(Boolean).length;
      if (filled < 3) {
        if (setAriaMessage) {
          setAriaMessage(
            errorEl,
            "Please enter at least three of the four values to calculate the missing one.",
            "polite"
          );
        }
        return;
      }

      const P = hasP ? sn(principalInput.value) : null;
      const rAPR = hasR ? sn(interestInput.value) : null;
      const n = hasN ? sn(paymentsInput.value) : null;
      const PMT = hasPMT ? sn(paymentInput.value) : null;

      if (
        (hasP && P <= 0) ||
        (hasR && rAPR <= 0) ||
        (hasN && n <= 0) ||
        (hasPMT && PMT <= 0)
      ) {
        if (setAriaMessage) {
          setAriaMessage(
            errorEl,
            "Values must be positive numbers. Please check your entries.",
            "polite"
          );
        }
        return;
      }

      const rMonthly = hasR ? rAPR / 100 / 12 : null;

      if (!hasPMT) {
        const pow = Math.pow(1 + rMonthly, n);
        paymentInput.value = formatNumber((P * pow * rMonthly) / (pow - 1), 2);
        paymentInput.classList.add("highlight-input");
      } else if (!hasP) {
        const pow = Math.pow(1 + rMonthly, n);
        principalInput.value = formatNumber(((pow - 1) * PMT) / (pow * rMonthly), 2);
        principalInput.classList.add("highlight-input");
      } else if (!hasN) {
        const ratio = PMT / (PMT - P * rMonthly);
        paymentsInput.value = formatNumber(Math.log(ratio) / Math.log(1 + rMonthly), 0);
        paymentsInput.classList.add("highlight-input");
      } else if (!hasR) {
        interestInput.value = formatNumber(computeIntRate(n, P, PMT, 10), 4);
        interestInput.classList.add("highlight-input");
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      computeMissingValue();
    });

    clearButton.addEventListener("click", clearLoanForm);

    /* ------------------------------
       Info buttons
    --------------------------------*/

    form.addEventListener("click", function (event) {
      const btn = event.target.closest(".info-btn");
      if (!btn) return;

      const field = btn.getAttribute("data-field");
      const info = loanTermTips[field];
      if (!info) return;

      detailsEl.innerHTML =
        `<strong>${info.title}</strong><br>` +
        `${info.body}<br><br><em>${info.tip}</em>`;

      detailsEl.scrollIntoView({ behavior: "smooth", block: "start" });

      resetInfoButtons();
      btn.setAttribute("aria-expanded", "true");
    });

    resetDetails();

    // ✅ NEW: related stories (non-blocking)
    initRelatedStories(scope);
  }

  /* ------------------------------------------------------------
     Related Stories (NEW)
  ------------------------------------------------------------ */

  // IMPORTANT: Must match key in assets/data/calculator-stories.json
  const CALCULATOR_ID = "missing-loan-term";

  function viewerHref(storyId) {
    // This script runs under /calculators/missing-loan-term/
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

  global.MissingLoanCalculator = { init };
})(window);
