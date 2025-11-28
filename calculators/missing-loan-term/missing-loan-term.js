// calculators/missing-loan-term/missing-loan-term.js
(function (global) {
  "use strict";

  const { setAriaMessage } = global.BudgetUtils || {};

  // Sanitize numeric input: keep digits, dot, and leading minus.
  function sn(num) {
    num = num.toString();
    let len = num.length;
    let rnum = "";
    let b = num.substring(0, 1);
    if (b === "-") rnum = "-";

    for (let i = 0; i <= len; i++) {
      b = num.substring(i, i + 1);
      if (
        b === "0" ||
        b === "1" ||
        b === "2" ||
        b === "3" ||
        b === "4" ||
        b === "5" ||
        b === "6" ||
        b === "7" ||
        b === "8" ||
        b === "9" ||
        b === "."
      ) {
        rnum = rnum + b;
      }
    }

    if (rnum === "" || rnum === "-") rnum = 0;
    return Number(rnum);
  }

  // Compute interest rate given n payments, principal, payment amount, and a starting APR guess (%)
  function computeIntRate(myNumPmts, myPrin, myPmtAmt, myGuess) {
    let myDecRate = 0;
    let myDecGuess;

    if (!myGuess || String(myGuess).length === 0) {
      myDecGuess = 10;
    } else {
      myDecGuess = myGuess;
      if (myDecGuess >= 1) {
        myDecGuess = myDecGuess / 100;
      }
    }

    myDecRate = myDecGuess / 12;
    let myNewPmtAmt = 0;
    let pow = 1;

    for (let j = 0; j < myNumPmts; j++) {
      pow = pow * (1 + myDecRate);
    }

    myNewPmtAmt = (myPrin * pow * myDecRate) / (pow - 1);

    function pmtAtRate(rate) {
      let p = 1;
      for (let k = 0; k < myNumPmts; k++) {
        p = p * (1 + rate);
      }
      return (myPrin * p * rate) / (p - 1);
    }

    const decPlace2Rate = (myDecGuess + 0.01) / 12;
    const decPlace3Rate = (myDecGuess + 0.001) / 12;
    const decPlace4Rate = (myDecGuess + 0.0001) / 12;
    const decPlace5Rate = (myDecGuess + 0.00001) / 12;

    const decPlace2Amt = pmtAtRate(decPlace2Rate) - myNewPmtAmt;
    const decPlace3Amt = pmtAtRate(decPlace3Rate) - myNewPmtAmt;
    const decPlace4Amt = pmtAtRate(decPlace4Rate) - myNewPmtAmt;
    const decPlace5Amt = pmtAtRate(decPlace5Rate) - myNewPmtAmt;

    let myPmtDiff = 0;

    if (myNewPmtAmt < myPmtAmt) {
      while (myNewPmtAmt < myPmtAmt) {
        myPmtDiff = myPmtAmt - myNewPmtAmt;
        if (myPmtDiff > decPlace2Amt) {
          myDecRate += 0.01 / 12;
        } else if (myPmtDiff > decPlace3Amt) {
          myDecRate += 0.001 / 12;
        } else if (myPmtDiff > decPlace4Amt) {
          myDecRate += 0.0001 / 12;
        } else if (myPmtDiff > decPlace5Amt) {
          myDecRate += 0.00001 / 12;
        } else {
          myDecRate += 0.000001 / 12;
        }

        pow = 1;
        for (let m = 0; m < myNumPmts; m++) {
          pow = pow * (1 + myDecRate);
        }
        myNewPmtAmt = (myPrin * pow * myDecRate) / (pow - 1);
      }
    } else {
      while (myNewPmtAmt > myPmtAmt) {
        myPmtDiff = myNewPmtAmt - myPmtAmt;
        if (myPmtDiff > decPlace2Amt) {
          myDecRate -= 0.01 / 12;
        } else if (myPmtDiff > decPlace3Amt) {
          myDecRate -= 0.001 / 12;
        } else if (myPmtDiff > decPlace4Amt) {
          myDecRate -= 0.0001 / 12;
        } else if (myPmtDiff > decPlace5Amt) {
          myDecRate -= 0.00001 / 12;
        } else {
          myDecRate -= 0.000001 / 12;
        }

        pow = 1;
        for (let n = 0; n < myNumPmts; n++) {
          pow = pow * (1 + myDecRate);
        }
        myNewPmtAmt = (myPrin * pow * myDecRate) / (pow - 1);
      }
    }

    myDecRate = myDecRate * 12 * 100; // APR %
    return myDecRate;
  }

  function formatNumber(num, decimals) {
    if (!isFinite(num)) return "";
    const factor = Math.pow(10, decimals);
    return (Math.round(num * factor) / factor).toString();
  }

  // Info text for each field
  const loanTermTips = {
    principal: {
      title: "Principal (current payoff amount)",
      body:
        "This is the amount you are looking to borrow or the amount you still owe on the loan today — essentially the balance you would need to pay off in full.",
      tip:
        "On a recent statement, look for the 'principal balance' or 'outstanding balance' line."
    },
    interest: {
      title: "Interest rate (APR, %)",
      body:
        "The annual percentage rate (APR) is the yearly cost of borrowing, expressed as a percentage. This calculator assumes a fixed rate and monthly compounding.",
      tip:
        "On most loans, the APR is listed on your loan agreement and monthly statement."
    },
    payments: {
      title: "Number of payments remaining",
      body:
        "How many scheduled payments you have left on the loan. For example, a 30-year mortgage with monthly payments has 360 payments, and a 15-year mortgage has 180.",
      tip:
        "The total interest paid over the loan’s life is very sensitive to this value; paying off a loan faster can save significant interest."
    },
    payment: {
      title: "Payment amount",
      body:
        "Your regular scheduled payment for the loan, usually monthly. This includes principal and interest only, not escrowed taxes or insurance.",
      tip:
        "If your payment includes escrow, check your statement to see how much is principal & interest versus taxes & insurance."
    }
  };

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
    const methodologyEl = scope.querySelector("#loan-methodology");

    if (
      !form ||
      !principalInput ||
      !interestInput ||
      !paymentsInput ||
      !paymentInput ||
      !clearButton ||
      !errorEl ||
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
      const infoButtons = scope.querySelectorAll(".info-btn");
      infoButtons.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
    }

    function resetDetails() {
      detailsEl.innerHTML =
        'Click an <strong>info</strong> icon next to a field to see more detail about that value and how to think about it.';
      resetInfoButtons();

      if (methodologyEl) {
        methodologyEl.style.display = "block";
      }
    }

    function clearLoanForm() {
      form.reset();
      setAriaMessage(errorEl, "", "polite");
      clearHighlights();
      resetDetails();
    }

    function computeMissingValue() {
      setAriaMessage(errorEl, "", "polite");
      clearHighlights();

      const hasPrincipal = principalInput.value.trim() !== "";
      const hasInterest = interestInput.value.trim() !== "";
      const hasPayments = paymentsInput.value.trim() !== "";
      const hasPayment = paymentInput.value.trim() !== "";

      const nonEmptyCount =
        (hasPrincipal ? 1 : 0) +
        (hasInterest ? 1 : 0) +
        (hasPayments ? 1 : 0) +
        (hasPayment ? 1 : 0);

      if (nonEmptyCount < 3) {
        setAriaMessage(
          errorEl,
          "Please enter at least three of the four values to calculate the missing one.",
          "polite"
        );
        return;
      }

      const P = hasPrincipal ? sn(principalInput.value) : null;
      const rAPR = hasInterest ? sn(interestInput.value) : null;
      const n = hasPayments ? sn(paymentsInput.value) : null;
      const PMT = hasPayment ? sn(paymentInput.value) : null;

      if (
        (hasPrincipal && P <= 0) ||
        (hasInterest && rAPR <= 0) ||
        (hasPayments && n <= 0) ||
        (hasPayment && PMT <= 0)
      ) {
        setAriaMessage(
          errorEl,
          "Values must be positive numbers. Please check your entries.",
          "polite"
        );
        return;
      }

      const rMonthly = hasInterest ? rAPR / 100 / 12 : null;

      // All four values present: recalc payment
      if (nonEmptyCount === 4) {
        if (!hasPrincipal || !hasInterest || !hasPayments) {
          setAriaMessage(
            errorEl,
            "To recalculate the payment, principal, interest rate, and payments must all be entered.",
            "polite"
          );
          return;
        }
        const powAll = Math.pow(1 + rMonthly, n);
        const newPMT = (P * powAll * rMonthly) / (powAll - 1);
        paymentInput.value = formatNumber(newPMT, 2);
        paymentInput.classList.add("highlight-input");
        return;
      }

      // Solve for the missing value
      if (!hasPayment) {
        if (!hasPrincipal || !hasInterest || !hasPayments) {
          setAriaMessage(
            errorEl,
            "To solve for the payment, enter principal, interest rate, and number of payments.",
            "polite"
          );
          return;
        }
        const powPmt = Math.pow(1 + rMonthly, n);
        const calcPMT = (P * powPmt * rMonthly) / (powPmt - 1);
        paymentInput.value = formatNumber(calcPMT, 2);
        paymentInput.classList.add("highlight-input");
      } else if (!hasPrincipal) {
        if (!hasInterest || !hasPayments) {
          setAriaMessage(
            errorEl,
            "To solve for the principal, enter interest rate, number of payments, and payment amount.",
            "polite"
          );
          return;
        }
        const powPrin = Math.pow(1 + rMonthly, n);
        const calcP = ((powPrin - 1) * PMT) / (powPrin * rMonthly);
        principalInput.value = formatNumber(calcP, 2);
        principalInput.classList.add("highlight-input");
      } else if (!hasPayments) {
        if (!hasInterest || !hasPrincipal) {
          setAriaMessage(
            errorEl,
            "To solve for the number of payments, enter principal, interest rate, and payment amount.",
            "polite"
          );
          return;
        }
        const ratio = PMT / (PMT - P * rMonthly);
        if (ratio <= 0) {
          setAriaMessage(
            errorEl,
            "Inputs result in an invalid payment schedule. Check that the payment is large enough to cover interest.",
            "polite"
          );
          return;
        }
        const calcN = Math.log(ratio) / Math.log(1 + rMonthly);
        paymentsInput.value = formatNumber(calcN, 0);
        paymentsInput.classList.add("highlight-input");
      } else if (!hasInterest) {
        if (!hasPrincipal || !hasPayments) {
          setAriaMessage(
            errorEl,
            "To solve for the interest rate, enter principal, number of payments, and payment amount.",
            "polite"
          );
          return;
        }
        const estAPR = computeIntRate(n, P, PMT, 10);
        interestInput.value = formatNumber(estAPR, 4);
        interestInput.classList.add("highlight-input");
      }
    }

    // Submit → compute
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      computeMissingValue();
    });

    // Clear → reset form & show methodology again
    clearButton.addEventListener("click", function () {
      clearLoanForm();
      if (methodologyEl) {
        methodologyEl.style.display = "block";
      }
    });

    // Info buttons: show field-specific text, hide methodology, update aria-expanded
    form.addEventListener("click", function (event) {
      const btn = event.target.closest(".info-btn");
      if (!btn) return;

      const field = btn.getAttribute("data-field");
      const info = loanTermTips[field];
      if (!info) return;

      detailsEl.innerHTML =
        "<strong>" +
        info.title +
        "</strong><br>" +
        info.body +
        "<br><br><em>" +
        info.tip +
        "</em>";

      if (methodologyEl) {
        methodologyEl.style.display = "none";
      }

      const allButtons = scope.querySelectorAll(".info-btn");
      allButtons.forEach((b) => b.setAttribute("aria-expanded", "false"));
      btn.setAttribute("aria-expanded", "true");
    });

    // Initial state
    resetDetails();
  }

  global.MissingLoanCalculator = {
    init
  };
})(window);
