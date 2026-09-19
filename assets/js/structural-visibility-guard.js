(function(){
  "use strict";
  function revealSections(){
    document.querySelectorAll(".premium-reveal").forEach(function(section){
      section.classList.add("is-visible");
      section.style.removeProperty("opacity");
      section.style.removeProperty("transform");
      section.style.removeProperty("visibility");
    });
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", revealSections, {once:true});
  else revealSections();
  window.addEventListener("load", revealSections, {once:true});
})();
