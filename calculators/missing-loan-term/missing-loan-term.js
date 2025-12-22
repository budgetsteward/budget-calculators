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
      setAriaMessage(errorEl, "", "polite");
      clearHighlights();
      resetDetails();
    }

    /* ------------------------------
       Computation (unchanged)
    --------------------------------*/

    function computeMissingValue() {
      setAriaMessage(errorEl, "", "polite");
      clearHighlights();

      const hasP = principalInput.value.trim() !== "";
      const hasR = interestInput.value.trim() !== "";
      const hasN = paymentsInput.value.trim() !== "";
      const hasPMT = paymentInput.value.trim() !== "";

      const filled = [hasP, hasR, hasN, hasPMT].filter(Boolean).length;
      if (filled < 3) {
        setAriaMessage(
          errorEl,
          "Please enter at least three of the four values to calculate the missing one.",
          "polite"
        );
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
        setAriaMessage(
          errorEl,
          "Values must be positive numbers. Please check your entries.",
          "polite"
        );
        return;
      }

      const rMonthly = hasR ? rAPR / 100 / 12 : null;

      if (!hasPMT) {
        const pow = Math.pow(1 + rMonthly, n);
        paymentInput.value = formatNumber(
          (P * pow * rMonthly) / (pow - 1),
          2
        );
        paymentInput.classList.add("highlight-input");
      } else if (!hasP) {
        const pow = Math.pow(1 + rMonthly, n);
        principalInput.value = formatNumber(
          ((pow - 1) * PMT) / (pow * rMonthly),
          2
        );
        principalInput.classList.add("highlight-input");
      } else if (!hasN) {
        const ratio = PMT / (PMT - P * rMonthly);
        paymentsInput.value = formatNumber(
          Math.log(ratio) / Math.log(1 + rMonthly),
          0
        );
        paymentsInput.classList.add("highlight-input");
      } else if (!hasR) {
        interestInput.value = formatNumber(
          computeIntRate(n, P, PMT, 10),
          4
        );
        interestInput.classList.add("highlight-input");
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      computeMissingValue();
    });

    clearButton.addEventListener("click", clearLoanForm);

    /* ------------------------------
       Info buttons (FIXED)
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
  }

  global.MissingLoanCalculator = { init };
})(window);
