(function(){
  window.__toyotaScrollToElement = function(target, options){
    if(!target) return;
    options = options || {};
    var lenis = window.__toyotaLenis;
    if(lenis){
      lenis.scrollTo(target, {offset: options.offset || 0, duration: options.duration || 0.85, immediate: false});
    } else {
      target.scrollIntoView({behavior: options.behavior || "auto", block: options.block || "start"});
    }
  };
})();
