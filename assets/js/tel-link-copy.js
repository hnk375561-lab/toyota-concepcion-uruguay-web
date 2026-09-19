/* En PC, los links tel: hacen que Windows/macOS intenten abrir una app de
   llamadas (Skype, Tu Teléfono, FaceTime, etc.) y eso puede colgar el diálogo
   del sistema. En touch/celular el comportamiento nativo (llamar) se deja
   intacto; en desktop, el click copia el número y avisa, sin disparar tel:. */
(function(){
  "use strict";
  var isTouch = (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) || ("ontouchstart" in window);
  if(isTouch) return;

  function showCopiedTip(anchor, text){
    var tip = document.createElement("span");
    tip.textContent = text;
    tip.setAttribute("role", "status");
    tip.style.cssText = "position:fixed;z-index:9999;background:#171a1b;color:#f4f1eb;font:600 12px/1 var(--display, sans-serif);padding:8px 12px;border-radius:7px;pointer-events:none;box-shadow:0 10px 24px rgba(0,0,0,.3);opacity:0;transition:opacity .15s ease, transform .15s ease;transform:translateY(4px)";
    document.body.appendChild(tip);
    var r = anchor.getBoundingClientRect();
    tip.style.left = Math.max(8, r.left) + "px";
    tip.style.top = Math.max(8, r.top - 38) + "px";
    requestAnimationFrame(function(){ tip.style.opacity = "1"; tip.style.transform = "translateY(0)"; });
    setTimeout(function(){
      tip.style.opacity = "0";
      setTimeout(function(){ tip.remove(); }, 200);
    }, 1500);
  }

  document.addEventListener("click", function(e){
    var a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if(!a) return;
    e.preventDefault();
    var digits = a.getAttribute("href").replace(/^tel:\+?54\s?9?/, "");
    var copyText = digits.length === 10 ? "0" + digits.slice(0, 4) + " " + digits.slice(4, 6) + "-" + digits.slice(6) : digits;
    function done(ok){ showCopiedTip(a, ok ? "Número copiado: " + copyText : copyText); }
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(copyText).then(function(){ done(true); }, function(){ done(false); });
    } else {
      done(false);
    }
  }, true);
})();
