(function(){
  var touch=window.matchMedia&&window.matchMedia("(pointer: coarse)").matches;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!touch&&!reduce){
    var s=document.createElement("script");
    s.src="https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js";
    s.async=false;
    document.head.appendChild(s);
  }
})();
