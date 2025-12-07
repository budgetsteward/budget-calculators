// js/home.js
// Bootstraps the Smart Budget spotlight calculator on the home page.

(function () {
  "use strict";

  function embedSmartBudget() {
    var container = document.getElementById("smart-budget-embed");
    if (!container) return;

    fetch("calculators/smart-budget/index.html")
      .then(function (response) {
        return response.text();
      })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, "text/html");
        var section = doc.querySelector("#smart-budget");
        if (!section) return;

        // Remove the internal H1 so we don't get duplicate headings
        var internalH1 = section.querySelector("h1");
        if (internalH1 && internalH1.parentElement === section) {
          internalH1.remove();
        }

        // Remove the "back" link container if present
        var backLink = section.querySelector(".muted a");
        if (backLink && backLink.parentElement) {
          backLink.parentElement.remove();
        }

        container.appendChild(section);

        // Initialize calculator inside this container
        if (window.SmartBudget && typeof SmartBudget.init === "function") {
          SmartBudget.init(container);
        }
      })
      .catch(function (err) {
        console.error("Failed to embed calculator:", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", embedSmartBudget);
  } else {
    embedSmartBudget();
  }
})();
