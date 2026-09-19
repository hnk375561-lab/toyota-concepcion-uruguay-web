(function(){
  if(location.hash)return;
  if("scrollRestoration" in history)history.scrollRestoration="manual";
  function reset(){window.scrollTo(0,0);if(window.__toyotaLenis)window.__toyotaLenis.scrollTo(0,{immediate:true});}
  window.addEventListener("pageshow",reset,{once:true});
  window.addEventListener("load",function(){setTimeout(reset,80);},{once:true,passive:true});
})();
