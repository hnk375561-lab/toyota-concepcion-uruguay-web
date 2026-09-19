(function(){
  "use strict";
  window.__toyotaHealth = {
    build: "2026-09-18",
    requiredIds: ["gama-grid","compareA","compareB","contactForm","tradeForm","modelDetail","faqList","mobilepanel","burger"],
    check: function(){
      var missing = this.requiredIds.filter(function(id){ return !document.getElementById(id); });
      return {ready: document.readyState === "complete", missing: missing, missingCount: missing.length};
    }
  };
})();
