// calculators/accelerated-debt-payoff/accelerated-debt-payoff.js
//
// Core payoff math cloned from the legacy accelerateddebtpayoffcalc.htm
// so results match your original calculator. Layout is handled in HTML/CSS.

(function () {
  "use strict";

  function fn(num, places, comma) {
    var isNeg = 0;

    if (num < 0) {
      num = num * -1;
      isNeg = 1;
    }

    var myDecFact = 1;
    var myPlaces = 0;
    var myZeros = "";
    while (myPlaces < places) {
      myDecFact = myDecFact * 10;
      myPlaces = Number(myPlaces) + Number(1);
      myZeros = myZeros + "0";
    }

    var onum = Math.round(num * myDecFact) / myDecFact;
    var integer = Math.floor(onum);
    var decimal;

    if (Math.ceil(onum) === integer) {
      decimal = myZeros;
    } else {
      decimal = Math.round((onum - integer) * myDecFact);
    }

    decimal = decimal.toString();
    if (decimal.length < places) {
      var fillZeroes = places - decimal.length;
      for (var z = 0; z < fillZeroes; z++) {
        decimal = "0" + decimal;
      }
    }

    if (places > 0) {
      decimal = "." + decimal;
    }

    var finNum;
    if (comma === 1) {
      integer = integer.toString();
      var tmpnum = "";
      var tmpinteger = "";
      var y = 0;

      for (var x = integer.length; x > 0; x--) {
        tmpnum = tmpnum + integer.charAt(x - 1);
        y = y + 1;
        if (y === 3 && x > 1) {
          tmpnum = tmpnum + ",";
          y = 0;
        }
      }

      for (x = tmpnum.length; x > 0; x--) {
        tmpinteger = tmpinteger + tmpnum.charAt(x - 1);
      }

      finNum = tmpinteger + "" + decimal;
    } else {
      finNum = integer + "" + decimal;
    }

    if (isNeg === 1) {
      finNum = "-" + finNum;
    }

    return finNum;
  }

  function sn(num) {
    num = num.toString();

    var len = num.length;
    var rnum = "";
    var b = num.substring(0, 1);
    if (b === "-") {
      rnum = "-";
    }

    for (var i = 0; i <= len; i++) {
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
        rnum = rnum + "" + b;
      }
    }

    if (rnum === "" || rnum === "-") {
      rnum = 0;
    }

    rnum = Number(rnum);
    return rnum;
  }

  // Compute interest cost + # of payments for a single debt row
  window.computeLoan = function (line) {
    var my_prin_cell = document.getElementById("prin" + line);
    var my_rate_cell = document.getElementById("intRate" + line);
    var my_pmt_cell = document.getElementById("pmt" + line);

    var my_prin = sn(my_prin_cell.value);
    var my_rate = sn(my_rate_cell.value);
    var my_pmt = sn(my_pmt_cell.value);

    var my_intLeft_cell = document.getElementById("intLeft" + line);
    var my_pmtLeft_cell = document.getElementById("pmtLeft" + line);

    var my_intPort = 0;
    var my_i = 0;
    var my_prinPort = 0;
    var my_accumInt = 0;
    var my_count = 0;

    if (my_prin > 0 && my_pmt > 0) {
      if (my_rate === 0) {
        my_i = 0;
      } else {
        my_i = my_rate;
        if (my_i >= 1) {
          my_i /= 100;
        }
        my_i /= 12;
      }

      while (my_prin > 0) {
        my_intPort = my_prin * my_i;
        my_accumInt = Number(my_accumInt) + Number(my_intPort);
        my_prinPort = Number(my_pmt) - Number(my_intPort);
        my_prin = Number(my_prin) - Number(my_prinPort);
        my_count = Number(my_count) + 1;
        if (my_count > 1000) {
          break;
        }
      }

      if (my_count >= 1000) {
        alert(
          "At the terms you entered, debt #" +
            line +
            " will never be paid off. Please either decrease the balance, decrease the interest rate, or increase the payment amount until this message no longer pops up."
        );
        if (my_intLeft_cell) my_intLeft_cell.value = "ERROR";
        if (my_pmtLeft_cell) my_pmtLeft_cell.value = "ERROR";
      } else {
        if (my_intLeft_cell) {
          my_intLeft_cell.value = "$" + fn(my_accumInt, 2, 1);
        }
        if (my_pmtLeft_cell) {
          my_pmtLeft_cell.value = my_count;
        }
      }
    }

    clearResults(document.debts);
  };

  window.computeForm = function (form) {
    var debtCnt = 0;
    var i = 0;
    var totalDebtInt = 0;
    var totalDebtPmts = 0;
    var max_npr = 0;

    var name_arr = [];
    var prin_arr = [];
    var adp_bal_arr = [];
    var rate_arr = [];
    var pmt_arr = [];
    var adp_pmt_arr = [];
    var npr_arr = [];
    var cost_arr = [];
    var sum_rows_arr = [];

    var Vschedule_head =
      "<tr><td><font face='arial'><small><b>Pmt#</b></small></font></td>";

    var count = 0;
    var prinPort = 0;
    var intPort = 0;
    var name = "";
    var prin = 0;
    var intRate = 0;
    var intLeft = 0;
    var accumInt = 0;
    var accumPrin = 0;
    var pmt = 0;

    var Vtotalprin = 0;

    while (i < 10) {
      i = Number(i) + 1;

      var name_cell = document.getElementById("D" + i);
      var prin_cell = document.getElementById("prin" + i);
      var intRate_cell = document.getElementById("intRate" + i);
      var pmt_cell = document.getElementById("pmt" + i);
      var intLeft_cell = document.getElementById("intLeft" + i);
      var pmtLeft_cell = document.getElementById("pmtLeft" + i);

      name = name_cell ? name_cell.value : "";
      prin = sn(prin_cell.value);
      intRate = sn(intRate_cell.value);
      pmt = sn(pmt_cell.value);
      intLeft = sn(intLeft_cell.value);

      Vtotalprin = Number(Vtotalprin) + Number(prin);

      if (prin > 0 && pmt > 0) {
        debtCnt = Number(debtCnt) + 1;
        accumPrin = Number(accumPrin) + Number(prin);

        Vschedule_head =
          Vschedule_head +
          "<td align='center'><font face='arial'><small><b>" +
          debtCnt +
          "</b></small></font></td>\n";
        sum_rows_arr[i] =
          "<tr><td><font face='arial'><small>" +
          name +
          "</small></font></td>\n";

        accumInt = 0;
        count = 0;

        if (intRate === 0) {
          intRate = 0;
        } else {
          if (intRate >= 1) {
            intRate /= 100;
          }
          intRate /= 12;
        }

        name_arr[debtCnt] = name;
        prin_arr[debtCnt] = prin;
        adp_bal_arr[debtCnt] = prin;
        rate_arr[debtCnt] = intRate;
        pmt_arr[debtCnt] = pmt;
        adp_pmt_arr[debtCnt] = pmt;

        while (prin > 0) {
          intPort = prin * intRate;
          accumInt = Number(accumInt) + Number(intPort);
          prinPort = Number(pmt) - Number(intPort);
          prin = Number(prin) - Number(prinPort);
          count = Number(count) + 1;
          if (count > 1000) {
            break;
          }
        }
        totalDebtInt = Number(totalDebtInt) + accumInt;
        totalDebtPmts = Number(totalDebtPmts) + Number(pmt);

        if (count > max_npr) {
          max_npr = count;
        }

        npr_arr[debtCnt] = count;
        cost_arr[debtCnt] = accumInt;

        if (pmtLeft_cell) pmtLeft_cell.value = count;
        if (intLeft_cell)
          intLeft_cell.value = "$" + fn(accumInt, 2, 1);
      }
    }

    // Totals for current plan
    form.totalprin.value = "$" + fn(Vtotalprin, 2, 1);
    form.adp_totalprin.value = "$" + fn(Vtotalprin, 2, 1);
    form.totalint.value = "$" + fn(totalDebtInt, 2, 1);
    form.totalnprs.value = max_npr;
    form.totalpmt.value = "$" + fn(totalDebtPmts, 2, 1);

    Vschedule_head = Vschedule_head + "</tr>\n";
    form.schedule_head.value = Vschedule_head;

    // Extra payment & ADP totals
    var Vaccel_pmt = sn(form.accel_pmt.value);
    var Vadp_totalpmt = Number(totalDebtPmts) + Number(Vaccel_pmt);
    form.adp_totalpmt.value = "$" + fn(Vadp_totalpmt, 2, 1);

    var v_summary_cell = document.getElementById("summary");
    var v_summary_txt =
      "The total of your current monthly debt payments ($" +
      fn(totalDebtPmts, 2, 1) +
      "), plus the additional monthly amount of $" +
      fn(Vaccel_pmt, 2, 1) +
      ", is equal to $" +
      fn(Vadp_totalpmt, 2, 1) +
      ".  This is how much you will allocate to paying off your debts until all of the above debts are paid off.";
    if (v_summary_cell) {
      v_summary_cell.innerHTML =
        "<font face='arial'><small>" + v_summary_txt + "</small></font>";
    }

    // ADP simulation (unchanged from legacy)
    i = 0;
    var npr_cnt = 0;
    var adp_bal = 0;
    var adp_combo_prin = accumPrin;
    var debts_paid_off = 0;
    var Vadp_totalint = 0;
    var sum_col_print = 0;

    var adp_intPort = 0;
    var adp_prinPort = 0;
    var adp_rate = 0;
    var adp_excess_pmt = 0;
    var adp_pmt_amt = 0;
    var tot_period_pmts = 0;
    var cur_adp_debt = 1;
    var num_pmts = 0;
    var Vschedule_cols = "";
    var Vschedule_rows = "";
    var Vsummary_head =
      "<tr><td><font face='arial'><small><b>Name of Debt</b></small></font></td><td><font face='arial'><small><b>Begin<br>Bal:<br>Pmt:</b></small></font></td>";

    while (debts_paid_off < debtCnt) {
      npr_cnt = Number(npr_cnt) + 1;
      i = 0;
      adp_pmt_amt = Vaccel_pmt;

      while (i < debtCnt) {
        i = Number(i) + 1;
        num_pmts = Number(num_pmts) + 1;

        adp_bal = adp_bal_arr[i];
        adp_rate = rate_arr[i];
        var adp_pmt = pmt_arr[i];

        if (npr_cnt === 1) {
          sum_rows_arr[i] =
            sum_rows_arr[i] +
            "<td><font face='arial'><small>$" +
            fn(adp_bal, 0, 1) +
            "<br>$" +
            fn(adp_pmt, 0, 1) +
            "</small></font></td>";
        }

        if (adp_bal > 0) {
          adp_intPort = adp_bal * adp_rate;
          Vadp_totalint = Number(Vadp_totalint) + Number(adp_intPort);
          adp_prinPort = Number(adp_pmt) - Number(adp_intPort);
          adp_bal = Number(adp_bal) - Number(adp_prinPort);
          if (adp_bal <= 0) {
            adp_excess_pmt = Number(adp_bal * -1);
            adp_pmt = Number(adp_pmt) - Number(adp_excess_pmt);
            adp_prinPort = Number(adp_prinPort) - Number(adp_excess_pmt);
            adp_pmt_amt = Number(adp_pmt_amt) + Number(adp_excess_pmt);
            adp_bal = 0;
            debts_paid_off = Number(debts_paid_off) + 1;
            sum_col_print = 1;
          }
          adp_bal_arr[i] = adp_bal;
          adp_combo_prin = Number(adp_combo_prin) - Number(adp_prinPort);
        } else {
          cur_adp_debt = Number(cur_adp_debt) + 1;
          adp_pmt_amt = Number(adp_pmt_amt) + Number(adp_pmt);
          adp_pmt = 0;
        }

        adp_pmt_arr[i] = adp_pmt;

        if (i > 10) {
          break;
        }
      }

      i = 0;

      if (adp_pmt_amt > 0) {
        adp_combo_prin = Number(adp_combo_prin) - Number(adp_pmt_amt);

        while (i < debtCnt) {
          i = Number(i) + 1;

          if (adp_bal_arr[i] > 0) {
            adp_bal_arr[i] = Number(adp_bal_arr[i]) - Number(adp_pmt_amt);

            if (adp_bal_arr[i] > 0) {
              adp_pmt_arr[i] =
                Number(adp_pmt_arr[i]) + Number(adp_pmt_amt);
              adp_pmt_amt = 0;
            } else {
              adp_pmt_arr[i] =
                Number(adp_pmt_arr[i]) +
                Number(adp_pmt_amt) +
                Number(adp_bal_arr[i]);
              adp_pmt_amt =
                Number(adp_pmt_amt) -
                (Number(adp_pmt_amt) + Number(adp_bal_arr[i]));
              adp_bal_arr[i] = 0;
              debts_paid_off = Number(debts_paid_off) + 1;
              sum_col_print = 1;
            }
          }
        }
      }

      i = 0;
      while (i < debtCnt) {
        i = Number(i) + 1;

        tot_period_pmts =
          Number(tot_period_pmts) + Number(adp_pmt_arr[i]);
        if (adp_pmt_arr[i] === 0) {
          Vschedule_cols = Vschedule_cols + "<td align='right'> </td>";
        } else {
          Vschedule_cols =
            Vschedule_cols +
            "<td align='right'><font face='arial'><small>" +
            fn(adp_pmt_arr[i], 2, 1) +
            "</small></font></td>";
        }

        if (
          (adp_pmt_arr[debts_paid_off] === 0 && sum_col_print === 1) ||
          debts_paid_off === debtCnt
        ) {
          if (i === 1) {
            Vsummary_head =
              Vsummary_head +
              "<td><font face='arial'><small><b>Month " +
              npr_cnt +
              "<br>Bal:<br>Pmt:</b></small></font></td>";
          }

          if (adp_bal_arr[i] === 0) {
            sum_rows_arr[i] =
              sum_rows_arr[i] +
              "<td align='top'><font face='arial'><small>$0</small></font></td>";
          } else {
            sum_rows_arr[i] =
              sum_rows_arr[i] +
              "<td align='top'><font face='arial'><small>$" +
              fn(adp_bal_arr[i], 0, 1) +
              "<br>$" +
              fn(adp_pmt_arr[i], 0, 1) +
              "</small></font></td>";
          }

          if (i === debtCnt) {
            sum_col_print = 0;
          }
        }
      }

      Vschedule_rows =
        Vschedule_rows +
        "<tr><td align='right'><font face='arial'><small>" +
        npr_cnt +
        "</small></font></td>" +
        Vschedule_cols +
        "</tr>\r";
      tot_period_pmts = 0;
      Vschedule_cols = "";

      if (npr_cnt > 600) {
        break;
      }
    }

    form.adp_totalnprs.value = npr_cnt;
    form.adp_totalint.value = "$" + fn(Vadp_totalint, 2, 1);

    var Vadp_npr_save = Number(max_npr) - Number(npr_cnt);
    form.adp_npr_save.value = Vadp_npr_save;

    var Vadp_int_save = Number(totalDebtInt) - Number(Vadp_totalint);
    form.adp_int_save.value = "$" + fn(Vadp_int_save, 2, 1);

    Vsummary_head = Vsummary_head + "</tr>";
    form.schedule_rows.value = Vschedule_rows;
    form.summary_head.value = Vsummary_head;

    i = 0;
    var Vsummary_rows = "";
    while (i < debtCnt) {
      i = Number(i) + 1;
      Vsummary_rows = Vsummary_rows + "" + sum_rows_arr[i] + "</tr>";
    }
    form.summary_rows.value = Vsummary_rows;

    // ---- Copy internal fields into the visible summary spans ----
    var displayTotalPrin = document.getElementById("display-totalprin");
    var displayTotalPmt = document.getElementById("display-totalpmt");
    var displayTotalNprs = document.getElementById("display-totalnprs");
    var displayAdpTotalPmt = document.getElementById("display-adp-totalpmt");
    var displayAdpTotalNprs = document.getElementById("display-adp-totalnprs");
    var resultsContainer = document.getElementById("calc-results");

    if (displayTotalPrin)
      displayTotalPrin.textContent = form.totalprin.value || "";
    if (displayTotalPmt)
      displayTotalPmt.textContent = form.totalpmt.value || "";
    if (displayTotalNprs)
      displayTotalNprs.textContent = form.totalnprs.value || "";

    if (displayAdpTotalPmt)
      displayAdpTotalPmt.textContent = form.adp_totalpmt.value || "";
    if (displayAdpTotalNprs)
      displayAdpTotalNprs.textContent = form.adp_totalnprs.value || "";

    if (resultsContainer) {
      resultsContainer.innerHTML =
        "<p class='muted'>Use the summary below to compare your current plan with the accelerated snowball plan.</p>";
    }

    // ---- Auto-scroll to Results after calculation ----
    var resultsSection = document.querySelector(".results-summary");
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

  };

  window.clearResults = function (form) {
    if (!form) form = document.debts;
    if (!form) return;

    form.totalprin.value = "";
    form.totalpmt.value = "";
    form.totalint.value = "";
    form.totalnprs.value = "";

    form.adp_totalprin.value = "";
    form.adp_totalpmt.value = "";
    form.adp_totalint.value = "";
    form.adp_totalnprs.value = "";

    form.adp_int_save.value = "";
    form.adp_npr_save.value = "";

    form.schedule_head.value = "";
    form.schedule_rows.value = "";
    form.summary_head.value = "";
    form.summary_rows.value = "";

    var v_summary_cell = document.getElementById("summary");
    if (v_summary_cell) v_summary_cell.innerHTML = "";

    // Clear the visible summary spans too
    var ids = [
      "display-totalprin",
      "display-totalpmt",
      "display-totalnprs",
      "display-adp-totalpmt",
      "display-adp-totalnprs"
    ];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = "";
    });

    // ---- Auto-scroll back to first debt input ----
    var firstInput = document.getElementById("prin1");
    if (firstInput) {
      firstInput.focus({ preventScroll: false });
    }

    var resultsContainer = document.getElementById("calc-results");
    if (resultsContainer) {
      resultsContainer.innerHTML =
        "<p class='muted'>Enter your debts and extra payment, then select <strong>Calculate results</strong> to see your payoff timeline.</p>";
    }

    var errorEl = document.getElementById("calc-error");
    if (errorEl) errorEl.textContent = "";
  };
})();
