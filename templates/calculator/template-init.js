// templates/calculator/template-init.js
// Wires up the generic calculator template on page load.

(function () {
  "use strict";

  function initTemplate() {
    if (window.CalculatorTemplate && typeof CalculatorTemplate.init === "function") {
      // Pass the whole document as the root, same as the old inline script did.
      CalculatorTemplate.init(document);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTemplate);
  } else {
    initTemplate();
  }
})();
