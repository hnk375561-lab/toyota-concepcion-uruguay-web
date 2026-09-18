from pathlib import Path

path = Path(__file__).resolve().parents[1] / "index.html"
s = path.read_text(encoding="utf-8")

s = s.replace('<link rel="preload" as="image" href="toyota-sharp-assets/hero-sw4-1800.webp" type="image/webp" fetchpriority="high">', '<link rel="preload" as="image" href="toyota-sharp-assets/hero-sw4-1800.webp" imagesrcset="toyota-sharp-assets/hero-sw4-480.webp 480w, toyota-sharp-assets/hero-sw4-1800.webp 1800w" imagesizes="(max-width: 760px) 100vw, 68vw" type="image/webp" fetchpriority="high">')
s = s.replace('<picture><source type="image/webp" srcset="toyota-sharp-assets/hero-sw4-1800.webp"><img src="toyota-sharp-assets/hero-sw4-1800.jpg" alt="Toyota SW4 Diamond, imagen del vehículo" fetchpriority="high" decoding="sync" width="1800" height="1844"></picture>', '<picture><source type="image/webp" media="(max-width: 760px)" srcset="toyota-sharp-assets/hero-sw4-480.webp"><source type="image/webp" srcset="toyota-sharp-assets/hero-sw4-1800.webp"><img src="toyota-sharp-assets/hero-sw4-1800.jpg" alt="Toyota SW4 Diamond, imagen del vehículo" fetchpriority="high" decoding="async" width="1800" height="1844"></picture>')
s = s.replace('.model-photo{', '.model-photo{aspect-ratio:4 / 3;object-fit:contain;')
s = s.replace('.mobilebar{display:none;position:fixed;', '.mobilebar{display:none;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .3s ease,transform .3s ease;will-change:opacity,transform;position:fixed;')
s = s.replace('.mobilebar a:last-child{border-right:0}', '.mobilebar a:last-child{border-right:0}.mobilebar.is-visible{opacity:1;transform:translateY(0);pointer-events:auto}')
s = s.replace('.hero-rail-label,.hero-rail-detail{\n  display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;', '.hero-rail-label,.hero-rail-detail{\n  display:grid!important;place-items:center!important;align-content:center!important;justify-content:center!important;align-items:center!important;overflow:hidden!important;')

old_lock = '''  window.__toyotaLockScroll = function(){
    window.__toyotaScrollLockCount++;
    document.documentElement.classList.add("toyota-scroll-locked");
    if(window.__toyotaLenis && window.__toyotaLenis.stop) window.__toyotaLenis.stop();
  };'''
new_lock = '''  window.__toyotaLockScroll = function(){
    var y=window.scrollY||window.pageYOffset||0;
    window.scrollTo(0,y);
    window.__toyotaScrollLockCount++;
    document.documentElement.classList.add("toyota-scroll-locked");
    document.body.classList.add("toyota-scroll-locked");
    if(window.__toyotaLenis && window.__toyotaLenis.stop) window.__toyotaLenis.stop();
  };'''
s = s.replace(old_lock, new_lock)
s = s.replace('document.documentElement.classList.remove("toyota-scroll-locked");\n      if(window.__toyotaLenis && window.__toyotaLenis.start) window.__toyotaLenis.start();', 'document.documentElement.classList.remove("toyota-scroll-locked");\n      document.body.classList.remove("toyota-scroll-locked");\n      if(window.__toyotaLenis && window.__toyotaLenis.start) setTimeout(function(){window.__toyotaLenis.start();},100);')

old_filter = '''  document.getElementById("filterbar").addEventListener("click", function(e){
    var btn = e.target.closest(".filterbtn");
    if(!btn) return;
    this.querySelectorAll(".filterbtn").forEach(function(b){ b.classList.remove("active"); });
    btn.classList.add("active");
    var filtro = btn.getAttribute("data-filter");
    gamaGrid.querySelectorAll(".model").forEach(function(card){
      card.hidden = filtro !== "todos" && card.getAttribute("data-tipo") !== filtro;
    });
  });'''
new_filter = '''  var filterBar=document.getElementById("filterbar"), filterStorageKey="toyota-gama-filter";
  function applyGamaFilter(filtro,updateUrl){
    if(!filterBar)return;
    var btn=filterBar.querySelector('.filterbtn[data-filter="'+filtro+'"]')||filterBar.querySelector('.filterbtn[data-filter="todos"]');
    filtro=btn.getAttribute("data-filter");
    filterBar.querySelectorAll(".filterbtn").forEach(function(b){b.classList.toggle("active",b===btn);b.setAttribute("aria-pressed",b===btn?"true":"false");});
    gamaGrid.querySelectorAll(".model").forEach(function(card){card.hidden=filtro!=="todos"&&card.getAttribute("data-tipo")!==filtro;});
    try{sessionStorage.setItem(filterStorageKey,filtro);}catch(e){}
    if(updateUrl){var next=filtro==="todos"?location.pathname+location.search+"#gama":location.pathname+location.search+"#gama?filter="+encodeURIComponent(filtro);history.replaceState(null,"",next);}
  }
  filterBar.querySelectorAll(".filterbtn").forEach(function(btn){btn.setAttribute("aria-pressed",btn.classList.contains("active")?"true":"false");});
  filterBar.addEventListener("click",function(e){var btn=e.target.closest(".filterbtn");if(btn)applyGamaFilter(btn.getAttribute("data-filter"),true);});
  var hashFilter=(location.hash.match(/^#gama\\?filter=([^&]+)/)||[])[1],savedFilter=null;
  try{savedFilter=sessionStorage.getItem(filterStorageKey);}catch(e){}
  applyGamaFilter(hashFilter?decodeURIComponent(hashFilter):(savedFilter||"todos"),false);'''
if old_filter not in s:
    raise SystemExit("filter block not found")
s = s.replace(old_filter, new_filter)

old_faq = "var keys=['postventa','postventa','postventa','usados','financiacion','financiacion','usados','postventa','usados'];original.forEach(function(item,i){item.dataset.faqCategory=keys[i]||'todos';});"
new_faq = "var keys=['postventa','postventa','postventa','usados','financiacion','financiacion','usados','postventa','usados'];if(original.length!==keys.length)console.warn('FAQ category count mismatch',original.length,keys.length);original.forEach(function(item,i){item.dataset.faqCategory=item.dataset.faqCategory||keys[i]||'postventa';});"
if old_faq not in s:
    raise SystemExit("faq block not found")
s = s.replace(old_faq, new_faq)

old_trade = '''    if(!car || !yearOk || !kmOk){
      note.textContent = !car ? "Contanos marca y modelo de tu vehículo." : (!yearOk ? "Ingresá un año válido, por ejemplo 2020." : "Ingresá el kilometraje solo con números.");
      note.className = "form-error";
      return;
    }'''
new_trade = '''    ["tradeCar","tradeYear","tradeKm"].forEach(function(id){document.getElementById(id).removeAttribute("aria-invalid");});
    if(!car || !yearOk || !kmOk){
      var invalidId=!car?"tradeCar":(!yearOk?"tradeYear":"tradeKm");
      document.getElementById(invalidId).setAttribute("aria-invalid","true");
      note.textContent=!car?"Contanos marca y modelo de tu vehículo.":(!yearOk?"El año debe tener 4 dígitos, por ejemplo 2020.":"El kilometraje debe contener solo números.");
      note.className="form-note form-error";document.getElementById(invalidId).focus();return;
    }'''
if old_trade not in s:
    raise SystemExit("trade block not found")
s = s.replace(old_trade, new_trade)

# Contact success state and duplicate-submit guard.
s = s.replace('var note=this.querySelector(".form-note");', 'var submitButton=this.querySelector("button[type=submit]"),note=this.querySelector(".form-note");')
s = s.replace('if(note){note.textContent="Preparando tu consulta…";note.className="form-note";note.setAttribute("role","status");}', 'if(note){note.textContent="Abriendo WhatsApp…";note.className="form-note";note.setAttribute("role","status");}if(submitButton){submitButton.disabled=true;submitButton.querySelector("span").textContent="Abriendo WhatsApp…";}')
s = s.replace('window.open(wa(key,texto),"_blank");', 'window.open(wa(key,texto),"_blank");if(note){note.textContent="¡Listo! Se abrió WhatsApp con tu consulta ya redactada.";note.className="form-note form-success";}if(submitButton){setTimeout(function(){submitButton.disabled=false;submitButton.querySelector("span").textContent="Solicitar asesoramiento por WhatsApp";},3000);}')

# Trade submit duplicate guard and restore label after timeout.
s = s.replace('window.open(wa("turnos",text),"_blank");', 'var tradeButton=tradeForm.querySelector("button[type=submit]");if(tradeButton){tradeButton.disabled=true;tradeButton.textContent="Abriendo WhatsApp…";}window.open(wa("turnos",text),"_blank");if(tradeButton)setTimeout(function(){tradeButton.disabled=false;tradeButton.textContent="Generar consulta de tasación ↗";},3000);')

# Add non-fine-pointer hero motion and stable touch/Safari CSS.
css = '''\n<style id="p1-p2-rest-polish">\nbody.toyota-scroll-locked{overscroll-behavior:none;touch-action:none}\n.model-photo{aspect-ratio:4 / 3;object-fit:contain}\n.rive-vehicle-preview:not(.is-ready) .rive-vehicle-canvas{opacity:0!important}\n.rive-vehicle-preview:not(.is-ready) .rive-vehicle-fallback{opacity:1!important;visibility:visible!important}\n@media(max-width:480px){.hero-editorial-rail-right,.hero-editorial-rail .hero-rail-detail{display:none!important}.hero-editorial-frame{grid-template-columns:38px 1fr!important}.hero-editorial-rail{width:38px!important;overflow:hidden!important}}\n@media(prefers-reduced-motion:reduce){.mobilebar{transition:none!important}}\n</style>\n'''
s = s.replace('</head>', css + '</head>', 1)
js = '''\n<script id="p1-p2-responsive-motion">\ndocument.addEventListener("DOMContentLoaded",function(){\n  "use strict";\n  var stage=document.querySelector(".hero-editorial-stage");\n  if(!stage||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;\n  var fine=window.matchMedia("(hover: hover) and (pointer: fine)");\n  if(fine.matches)return;\n  var primary=stage.querySelector(".hero-editorial-vehicle:not(.hero-editorial-secondary)"),secondary=stage.querySelector(".hero-editorial-secondary"),wordmark=stage.querySelector(".hero-editorial-wordmark"),ticking=false;\n  function update(){ticking=false;var rect=stage.getBoundingClientRect(),progress=Math.max(-1,Math.min(1,(window.innerHeight*.5-(rect.top+rect.height*.5))/Math.max(window.innerHeight,rect.height)));if(primary)primary.style.transform="translate3d(0,"+(progress*-5).toFixed(2)+"px,0)";if(secondary)secondary.style.transform="translate3d(0,"+(progress*3).toFixed(2)+"px,0)";if(wordmark)wordmark.style.transform="translate3d(0,"+(progress*-2).toFixed(2)+"px,0)";}\n  function request(){if(!ticking){ticking=true;requestAnimationFrame(update);}}\n  window.addEventListener("scroll",request,{passive:true});window.addEventListener("resize",request,{passive:true});request();\n});\n</script>\n'''
s = s.replace('</body>', js + '</body>', 1)

path.write_text(s, encoding="utf-8")
print(f"updated {path}")
