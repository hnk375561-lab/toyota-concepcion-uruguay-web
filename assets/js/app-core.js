document.addEventListener("DOMContentLoaded", function(){
  "use strict";

  // ---- EDITAR ACÁ: números de WhatsApp reales (formato wa.me, sin +) ----
  var WHATSAPP_NUMEROS = {
    ventas:     "5493442473453",
    repuestos:  "5493442677433",
    neumaticos: "5493442502390"
  };

  function wa(numeroKey, mensaje){
    return "https://wa.me/" + WHATSAPP_NUMEROS[numeroKey] + "?text=" + encodeURIComponent(mensaje);
  }

  // ---- copiar dirección ----
  var copyBtn = document.getElementById("copyAddressBtn");
  if(copyBtn){
    var copyLabel = document.getElementById("copyAddressLabel");
    var addressText = "9 de Julio 1624, Concepción del Uruguay, Entre Ríos";
    var copyTimer = null;
    function manualCopyFallback(text){
      var fallback = document.getElementById("copyAddressFallback");
      if(!fallback){
        fallback = document.createElement("input");
        fallback.id = "copyAddressFallback";
        fallback.type = "text";
        fallback.value = text;
        fallback.readOnly = true;
        fallback.setAttribute("aria-label", "Dirección para copiar manualmente");
        fallback.style.cssText = "position:fixed;left:12px;bottom:84px;z-index:120;width:min(420px,calc(100% - 24px));padding:12px;border:2px solid var(--toyota-red);background:#fff;color:#1B1F22;font:14px var(--body);box-shadow:0 8px 24px rgba(0,0,0,.2);";
        document.body.appendChild(fallback);
      }
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
      if(copyLabel) copyLabel.textContent = "Texto seleccionado: usá Ctrl+C";
      setTimeout(function(){ if(fallback) fallback.hidden = true; }, 6000);
    }
    function copyFeedback(result){
      if(result === "manual"){ manualCopyFallback(addressText); return; }
      if(copyLabel) copyLabel.textContent = result ? "¡Dirección copiada!" : "No se pudo copiar";
      copyBtn.setAttribute("aria-live", "polite");
      if(copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(function(){
        if(copyLabel) copyLabel.textContent = "Copiar dirección";
        copyBtn.removeAttribute("aria-live");
      }, 2200);
    }
    function legacyCopy(text){
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-9999px";
      ta.style.left = "-9999px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      var copied = false;
      try{ copied = document.execCommand("copy") === true; }catch(err){ copied = false; }
      document.body.removeChild(ta);
      return copied;
    }
    copyBtn.addEventListener("click", function(){
      copyBtn.disabled = true;
      var operation;
      if(window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText){
        operation = navigator.clipboard.writeText(addressText).then(function(){ return true; }, function(){ return legacyCopy(addressText) ? true : "manual"; });
      }else{
        operation = Promise.resolve(legacyCopy(addressText) ? true : "manual");
      }
      operation.then(copyFeedback, function(){ copyFeedback("manual"); }).then(function(){ copyBtn.disabled = false; });
    });
  }

  // ---- captura contextual de interés en usados sin backend ni datos inventados ----
  var usedInterestForm = document.getElementById("usedInterestForm");
  if(usedInterestForm){
    usedInterestForm.addEventListener("submit", function(e){
      e.preventDefault();
      var wanted = document.getElementById("usedInterest").value;
      var note = document.getElementById("usedInterestNote");
      var message = "Hola! Quiero que me avisen si ingresa un usado: " + wanted + ". También quisiera conocer disponibilidad y condiciones.";
      if(note) note.textContent = "Abriendo WhatsApp con tu consulta preparada…";
      window.toyotaTrack("used_interest_click", {vehicle_type:wanted});
      window.open(wa("ventas", message), "_blank", "noopener");
      setTimeout(function(){if(note)note.textContent="La consulta quedó preparada en WhatsApp para que la revises y la envíes.";}, 500);
    });
  }

  // ---- header con sombra al scrollear ----
  var header = document.getElementById("site-header");
  window.__toyotaSyncHeader=function(y){
    if(!header)return;
    var scrolled=y>4;
    // Evita escrituras de clase y recalculo de estilo en cada evento si el estado no cambió.
    if(header.classList.contains("is-scrolled")!==scrolled)header.classList.toggle("is-scrolled",scrolled);
  };
  window.__toyotaHeaderScrollFallback=function(){
    if(!window.__toyotaLenis)window.__toyotaSyncHeader(window.scrollY);
  };
  window.addEventListener("scroll",window.__toyotaHeaderScrollFallback,{passive:true});

  // ---- bloqueo de scroll de fondo compartido: hasta ahora ningún overlay (menú mobile,
  // ficha de modelo) bloqueaba el scroll de la página detrás. Contador para que dos
  // overlays abiertos a la vez no se desbloqueen mutuamente al cerrar solo uno. ----
  window.__toyotaScrollLockCount = window.__toyotaScrollLockCount || 0;
  window.__toyotaLockScroll = function(){
    var y=window.scrollY||window.pageYOffset||0;
    window.scrollTo(0,y);
    window.__toyotaScrollLockCount++;
    document.documentElement.classList.add("toyota-scroll-locked");
    document.body.classList.add("toyota-scroll-locked");
    if(window.__toyotaLenis && window.__toyotaLenis.stop) window.__toyotaLenis.stop();
  };
  window.__toyotaUnlockScroll = function(){
    window.__toyotaScrollLockCount = Math.max(0, window.__toyotaScrollLockCount - 1);
    if(window.__toyotaScrollLockCount === 0){
      document.documentElement.classList.remove("toyota-scroll-locked");
      document.body.classList.remove("toyota-scroll-locked");
      if(window.__toyotaLenis && window.__toyotaLenis.start) setTimeout(function(){window.__toyotaLenis.start();},100);
    }
  };

  window.__toyotaScrollLockCount = window.__toyotaScrollLockCount || 0;
  window.__toyotaLockScroll = function(){
    var y=window.scrollY||window.pageYOffset||0;
    window.scrollTo(0,y);
    window.__toyotaScrollLockCount++;
    document.documentElement.classList.add("toyota-scroll-locked");
    document.body.classList.add("toyota-scroll-locked");
    if(window.__toyotaLenis && window.__toyotaLenis.stop) window.__toyotaLenis.stop();
  };
  window.__toyotaUnlockScroll = function(){
    window.__toyotaScrollLockCount = Math.max(0, window.__toyotaScrollLockCount - 1);
    if(window.__toyotaScrollLockCount === 0){
      document.documentElement.classList.remove("toyota-scroll-locked");
      document.body.classList.remove("toyota-scroll-locked");
      if(window.__toyotaLenis && window.__toyotaLenis.start) setTimeout(function(){window.__toyotaLenis.start();},100);
    }
  };
  // ---- menú mobile ----
  var burger = document.getElementById("burger");
  var mobilepanel = document.getElementById("mobilepanel");
  function closeMobilePanel(restoreFocus){
    if(!mobilepanel.classList.contains("open")) return;
    mobilepanel.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    window.__toyotaUnlockScroll();
    if(restoreFocus) burger.focus();
  }
  burger.addEventListener("click", function(){
    if(mobilepanel.classList.contains("open")) closeMobilePanel(false);
    else { mobilepanel.classList.add("open"); burger.setAttribute("aria-expanded", "true"); window.__toyotaLockScroll(); }
  });
  mobilepanel.querySelectorAll("a").forEach(function(a){ a.addEventListener("click", function(){ closeMobilePanel(false); }); });
  document.addEventListener("pointerdown", function(e){
    if(mobilepanel.classList.contains("open") && !mobilepanel.contains(e.target) && !burger.contains(e.target)) closeMobilePanel(false);
  });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && mobilepanel.classList.contains("open")) closeMobilePanel(true);
  });
  // ---- menús desplegables del header: al abrir uno se cierran los demás ----
  var navmegas = document.querySelectorAll(".navmega");
  navmegas.forEach(function(d){
    d.addEventListener("toggle", function(){
      if(d.open){
        navmegas.forEach(function(other){ if(other !== d) other.open = false; });
      }
    });
  });
  document.addEventListener("click", function(e){
    if(!e.target.closest(".navmega")){
      navmegas.forEach(function(d){ d.open = false; });
    }
  });

  // ---- gama de modelos ----
  var MODELOS_TOYOTA = [
    { nombre: "Hilux", tipo: "pickup", desc: "La pickup que no para nunca. Cabina simple o doble, 4x2 o 4x4.", badge: "", foto: "toyota-sharp-assets/enhanced-4a00d0bf85e9-800.webp", fotoW: 800, fotoH: 781 },
    { nombre: "SW4 Diamond", tipo: "suv", desc: "Siete asientos y el Toyota Safety Sense de serie.", badge: "", foto: "toyota-sharp-assets/enhanced-371d49eb8a93-800.webp", fotoW: 781, fotoH: 800 },
    { nombre: "Corolla Cross", tipo: "suv", desc: "El SUV compacto de Toyota, entre el Corolla y la SW4.", badge: "", foto: "toyota-sharp-assets/enhanced-6d088249b097-800.webp", fotoW: 800, fotoH: 780 },
    { nombre: "RAV4", tipo: "suv", desc: "Nafta, híbrida o híbrida enchufable, según cómo la uses.", badge: "", foto: "toyota-sharp-assets/enhanced-9608f3af165f-800.webp", fotoW: 800, fotoH: 793 },
    { nombre: "Corolla", tipo: "sedan", desc: "El sedán más vendido del mundo, también en versión híbrida.", badge: "", foto: "toyota-sharp-assets/enhanced-cf008c7d5b59-800.webp", fotoW: 800, fotoH: 778 },
    { nombre: "Yaris", tipo: "sedan", desc: "Compacto, ágil y con el respaldo de la red oficial Toyota.", badge: "", foto: "toyota-sharp-assets/enhanced-b77ea4b4185d-800.webp", fotoW: 800, fotoH: 749 },
    { nombre: "Land Cruiser 300", tipo: "suv", desc: "El buque insignia todoterreno de Toyota, máximo confort y capacidad off-road.", badge: "", foto: "toyota-sharp-assets/enhanced-40f34102e3e9-800.webp", fotoW: 766, fotoH: 800 },
    { nombre: "Fortuner", tipo: "suv", desc: "SUV robusto sobre plataforma de pick-up, pensado para el trabajo y la aventura.", badge: "", foto: "toyota-sharp-assets/enhanced-a70429bf61f7-800.webp", fotoW: 733, fotoH: 800 },
    { nombre: "Etios", tipo: "sedan", desc: "El acceso más simple a la gama Toyota, ideal para uso urbano diario.", badge: "", foto: "toyota-sharp-assets/enhanced-3cd7479efb85-800.webp", fotoW: 800, fotoH: 779 }
  ];

  var ICONOS = {
    pickup: 'Pick-up',
    suv: 'SUV',
    sedan: 'Sedán'
  };

  // MODEL_DETAILS is filled below; keep the first rendering pass safe so a
  // late catalog declaration cannot stop the rest of the page from loading.
  var MODEL_DETAILS = {};
  var gamaGrid = document.getElementById("gama-grid");
  MODELOS_TOYOTA.forEach(function(m){
    var el = document.createElement("div");
    el.className = "model";
    el.setAttribute("data-tipo", m.tipo);
    el.setAttribute("data-model", m.nombre);
    var hasDetail = Object.prototype.hasOwnProperty.call(MODEL_DETAILS, m.nombre);
    el.innerHTML =
      (m.badge ? '<span class="badge">' + m.badge + '</span>' : '') +
      (m.foto ? '<picture><source type="image/avif" srcset="' + m.foto.replace(/-800\.webp$/, '-800.avif') + ' 800w, ' + m.foto.replace(/-800\.webp$/, '-480.avif') + ' 480w" sizes="(max-width: 600px) 92vw, 280px"><source type="image/webp" srcset="' + m.foto.replace(/-800\.webp$/, '-480.webp') + ' 480w, ' + m.foto + ' 800w" sizes="(max-width: 600px) 92vw, 280px"><img class="model-photo" src="' + m.foto + '" alt="Toyota ' + m.nombre + '" loading="lazy" decoding="async" width="' + m.fotoW + '" height="' + m.fotoH + '"></picture>' : '<div class="ico ico-text">' + ICONOS[m.tipo] + '</div>') +
      '<h3>' + m.nombre + '</h3>' +
      '<p>' + m.desc + '</p>' +
      (hasDetail ? '<button class="model-detail-link" type="button" data-model-detail="' + m.nombre + '" style="border:0;background:none;color:var(--toyota-red);font:inherit;font-weight:700;font-size:13px;text-align:left;padding:0 0 8px;cursor:pointer;">Ver ficha del modelo ›</button>' : '') +
      '<div style="display:flex;gap:12px;border-top:1px solid var(--border);padding-top:11px;"><a target="_blank" rel="noopener" href="' + wa("ventas", "Hola! Quiero consultar por la " + m.nombre + ".") + '" style="border:0;padding:0;flex:1;">Consultar <span>&rsaquo;</span></a><button class="compare-btn" type="button" data-compare-model="' + m.nombre + '" style="border:0;background:none;color:var(--muted);font:inherit;cursor:pointer;">Comparar</button></div>';
    gamaGrid.appendChild(el);
  });
  gamaGrid.addEventListener("click", function(e){
    var b = e.target.closest("[data-model-detail]");
    if(b) openDetail(b.getAttribute("data-model-detail"));
  });

  var filterBar=document.getElementById("filterbar"), filterStorageKey="toyota-gama-filter";
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
  var hashFilter=(location.hash.match(/^#gama\?filter=([^&]+)/)||[])[1],savedFilter=null;
  try{savedFilter=sessionStorage.getItem(filterStorageKey);}catch(e){}
  applyGamaFilter(hashFilter?decodeURIComponent(hashFilter):(savedFilter||"todos"),false);


  // ---- plan canje: captura los datos y genera una consulta contextual, no una tasación automática ----
  var tradeForm=document.getElementById("tradeForm"); if(tradeForm){tradeForm.addEventListener("submit",function(e){
    e.preventDefault();
    var car=document.getElementById("tradeCar").value.trim(),year=document.getElementById("tradeYear").value.trim(),km=document.getElementById("tradeKm").value.trim(),condition=document.getElementById("tradeCondition").value;
    var interestSel=document.getElementById("tradeInterest");
    var interestLabel={"0km":"un 0 km","usado":"un usado certificado","no-se":"todavía no lo tengo decidido"};
    var note=document.getElementById("tradeNote");
    var yearOk = /^(19|20)\d{2}$/.test(year);
    var kmOk = /^\d{1,7}$/.test(km);
    ["tradeCar","tradeYear","tradeKm"].forEach(function(id){document.getElementById(id).removeAttribute("aria-invalid");});
    if(!car || !yearOk || !kmOk){
      var invalidId=!car?"tradeCar":(!yearOk?"tradeYear":"tradeKm");
      document.getElementById(invalidId).setAttribute("aria-invalid","true");
      note.textContent=!car?"Contanos marca y modelo de tu vehículo.":(!yearOk?"El año debe tener 4 dígitos, por ejemplo 2020.":"El kilometraje debe contener solo números.");
      note.className="form-note form-error";document.getElementById(invalidId).focus();return;
    }
    var text="Hola! Quiero tasar mi vehículo para un plan canje. Vehículo: "+car+". Año: "+year+". Kilometraje: "+km+" km. Estado: "+condition+". Me interesa a cambio: "+(interestLabel[interestSel.value]||interestSel.value)+".";
    window.toyotaTrack("trade_form_submit",{vehicle:car,vehicle_year:year,interest:interestSel.value});
    note.textContent = "¡Listo! Se abrió WhatsApp con tu consulta ya redactada.";
    note.className = "form-success";
    var tradeButton=tradeForm.querySelector("button[type=submit]");if(tradeButton){tradeButton.disabled=true;tradeButton.textContent="Abriendo WhatsApp…";}window.open(wa("ventas",text),"_blank");if(tradeButton)setTimeout(function(){tradeButton.disabled=false;tradeButton.textContent="Generar consulta de tasación ↗";},3000);
  });}

  // ---- servicios ----
  var SERVICIOS = [
    { titulo: "Service oficial", desc: "Mantenimiento programado con la garantía y los tiempos que pide Toyota.", numero: "ventas", msg: "Hola! Quiero sacar un turno de service." },
    { titulo: "Repuestos genuinos", desc: "Piezas originales, no alternativas. Consultá si tenemos la tuya.", numero: "repuestos", msg: "Hola! Quiero consultar por un repuesto." },
    { titulo: "Accesorios Toyota", desc: "Barras, estribos, taperas y el kit completo para tu Hilux.", numero: "repuestos", msg: "Hola! Quiero consultar por accesorios." },
    { titulo: "Neumáticos Bridgestone", desc: "Neumáticos originales, colocados en el concesionario oficial.", numero: "neumaticos", msg: "Hola! Quiero consultar por neumáticos Bridgestone." }
  ];

  var servList = document.getElementById("serv-list");
  SERVICIOS.forEach(function(s){
    var el = document.createElement("div");
    el.className = "serv-item";
    el.innerHTML =
      '<h3>' + s.titulo + '</h3>' +
      '<p>' + s.desc + '</p>' +
      '<a class="btn primary" target="_blank" rel="noopener" href="' + wa(s.numero, s.msg) + '">Escribir</a>';
    servList.appendChild(el);
  });

  // ---- simulador de financiación ----
  var montoRange = document.getElementById("montoRange");
  var montoLabel = document.getElementById("montoLabel");
  var anticipoRange = document.getElementById("anticipoRange");
  var anticipoLabel = document.getElementById("anticipoLabel");
  var plazoSeg = document.getElementById("plazoSeg");
  var plazoActual = 24;
  var TASA_ANUAL_EJEMPLO = 0.42;

  function formatoARS(n){
    return "$ " + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function tickMoney(el,value,suffix){
    if(!el)return;
    if(window.gsap&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){var obj={v:Number(el.dataset.moneyValue||0)};gsap.to(obj,{v:value,duration:.38,ease:"power2.out",overwrite:true,onUpdate:function(){el.textContent=formatoARS(obj.v)+(suffix||"");},onComplete:function(){el.dataset.moneyValue=String(value);}});}else{el.textContent=formatoARS(value)+(suffix||"");el.dataset.moneyValue=String(value);}
  }
  function calcular(){
    var monto = Number(montoRange.value);
    var anticipoPct = Number(anticipoRange.value) / 100;
    var montoFinanciado = monto * (1 - anticipoPct);
    var r = TASA_ANUAL_EJEMPLO / 12;
    var n = plazoActual;
    var cuota = montoFinanciado * r / (1 - Math.pow(1 + r, -n));
    montoLabel.textContent = formatoARS(monto);
    anticipoLabel.textContent = Number(anticipoRange.value) + "%";
    tickMoney(document.getElementById("cuotaResultado"),cuota," /mes");
    var financed=document.getElementById("montoFinanciadoLabel");if(financed){financed.textContent="Financiando "+formatoARS(montoFinanciado);financed.dataset.moneyValue=String(montoFinanciado);}
    var realCta=document.getElementById("financingRealCta");if(realCta){realCta.href=wa("ventas","Hola! Quiero conocer la tasa real para financiar un Toyota. Simulé "+formatoARS(monto)+" a "+n+" meses, con un anticipo del "+Math.round(anticipoPct*100)+"%. El monto financiado estimado sería "+formatoARS(montoFinanciado)+".");}
    var combinedCta=document.getElementById("combinedPurchaseCta");if(combinedCta){combinedCta.href=wa("ventas","Hola! Quiero consultar una operación combinada con usado y financiación. Simulé "+formatoARS(monto)+" a "+n+" meses, con un anticipo del "+Math.round(anticipoPct*100)+"%. El monto financiado estimado sería "+formatoARS(montoFinanciado)+". También quiero consultar cómo incorporar mi vehículo actual como parte de pago.");}
  }

  montoRange.addEventListener("input", function(){calcular();window.toyotaTrack("financing_simulator_change",{field:"monto",value:this.value});});
  anticipoRange.addEventListener("input", function(){calcular();window.toyotaTrack("financing_simulator_change",{field:"anticipo",value:this.value});});
  plazoSeg.addEventListener("click", function(e){
    var btn = e.target.closest("button");
    if(!btn) return;
    plazoSeg.querySelectorAll("button").forEach(function(b){ b.classList.remove("active"); });
    btn.classList.add("active");
    plazoActual = Number(btn.getAttribute("data-plazo"));
    window.toyotaTrack("financing_simulator_change",{field:"plazo",value:plazoActual});
    calcular();
  });
  calcular();

  // ---- opiniones reales: no se renderizan citas inventadas ----
  // Las reseñas se consultan en Google mediante el CTA visible en la sección.
  // ---- FAQ ----
  var FAQS = [
    { q: "¿El service oficial mantiene la garantía de fábrica?", a: "Sí. Al hacer el mantenimiento programado en el concesionario oficial, se cumple lo que pide Toyota para mantener la garantía vigente del vehículo." },
    { q: "¿Cuánto tardan en confirmarme un turno?", a: "La idea de pedirlo por WhatsApp es justamente esa: te confirmamos día y horario disponible en poco tiempo, sin esperar en una casilla de contacto genérica." },
    { q: "¿Los repuestos son siempre originales?", a: "Trabajamos con repuestos genuinos Toyota. Si consultás por una pieza puntual, te confirmamos disponibilidad antes de que vengas hasta el local." },
    { q: "¿Puedo entregar mi auto actual como parte de pago aunque no sea Toyota?", a: "Sí, el plan canje acepta vehículos de otras marcas. Lo tasamos y ese valor se descuenta del 0km o del usado que elijas." },
    { q: "¿La cuota del simulador es la que voy a pagar?", a: "No, es una referencia con una tasa de ejemplo para que tengas una idea de orden de magnitud. La cuota real depende de tu perfil crediticio y de la línea de financiación vigente al momento de la operación." },
    { q: "¿Qué documentación necesito para consultar financiación?", a: "Para iniciar una consulta, el asesor puede pedirte datos de contacto, información del vehículo y documentación de ingresos. La lista final depende de la línea vigente y de tu perfil." },
    { q: "¿Cómo funciona la tasación de mi usado?", a: "Se solicitan marca, modelo, año, kilometraje y estado general. El valor no se calcula automáticamente en esta página: un asesor revisa la información y confirma el siguiente paso." },
    { q: "¿Puedo consultar accesorios y neumáticos antes de ir?", a: "Sí. La página ofrece líneas directas para repuestos, accesorios y neumáticos; la disponibilidad y las medidas se confirman antes de acercarte." },
    { q: "¿Cómo coordino la entrega de un vehículo?", a: "Después de definir la operación, el concesionario confirma por sus canales directos la documentación, las condiciones y el día de entrega." },
    { q: "¿Cada cuánto debo hacer el service de mi Toyota?", a: "El intervalo depende del modelo, el año y el kilometraje. Consultá el manual de tu vehículo o escribinos con esos datos para confirmar qué mantenimiento corresponde." },
    { q: "¿Qué tengo que llevar al service?", a: "Para pedir orientación, tené a mano el modelo, el año, el kilometraje y una descripción breve de lo que necesitás. El equipo confirma si hace falta documentación adicional." },
    { q: "¿Puedo consultar una visita o test drive?", a: "Podés consultar por el modelo que te interesa y pedir información sobre disponibilidad y agenda. La posibilidad de realizar una visita o test drive se confirma directamente con el concesionario." }
  ];
  var faqList = document.getElementById("faqList");
  FAQS.forEach(function(f, i){
    var item = document.createElement("div");
    item.className = "faq-item";
    item.innerHTML =
      '<button class="faq-q" aria-expanded="false" aria-controls="faq-answer-' + i + '" type="button"><span>' + f.q + '</span><span class="faq-logo-tile" aria-hidden="true"><img src="toyota-sharp-assets/asset-bec83be10e47-256.webp" alt=""><b class="faq-toggle-badge">+</b></span></button>' +
      '<div class="faq-a" id="faq-answer-' + i + '"><p>' + f.a + '</p></div>';
    faqList.appendChild(item);
    var btn = item.querySelector(".faq-q");
    var panel = item.querySelector(".faq-a");
    btn.addEventListener("click", function(){
      var isOpen = item.classList.contains("open");
      faqList.querySelectorAll(".faq-item.open").forEach(function(openItem){
        if(openItem !== item){
          openItem.classList.remove("open");
          openItem.querySelector(".faq-q").setAttribute("aria-expanded", "false");
          var openPanel=openItem.querySelector(".faq-a");
          if(window.gsap&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){gsap.to(openPanel,{maxHeight:0,opacity:0,duration:.2,ease:"power2.out",overwrite:true});}else{openPanel.style.maxHeight=null;}
        }
      });
      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", (!isOpen).toString());
      if(window.gsap&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){gsap.fromTo(panel,{maxHeight:isOpen?panel.scrollHeight:0,opacity:isOpen?1:0},{maxHeight:isOpen?0:panel.scrollHeight,opacity:isOpen?0:1,duration:.26,ease:"power2.out",overwrite:true,onComplete:function(){if(!isOpen){panel.style.maxHeight="none";}}});}else{panel.style.maxHeight = isOpen ? null : panel.scrollHeight + "px";}
    });
  });


  // ---- detalle de modelos: fuentes oficiales, sin precios ni stock inventados ----
  var MODEL_DETAILS = {
    "Hilux": {intro:"Pick-up Toyota. La página oficial consultada publica versiones SRX, SRV, SR y DX.", specs:[["Motorización / transmisión","La ficha oficial consultada detalla motor diésel y transmisión manual de 6 velocidades para Cabina Simple DX."],["Equipamiento publicado","7 airbags, pantalla táctil de 9 pulgadas y conectividad inalámbrica Android Auto / Apple CarPlay."],["Fuente","Toyota Argentina — Hilux Cabina Simple"]], source:"https://www.toyota.com.ar/modelos/hilux-cabina-simple", gallery:["https://www.toyota.com.ar/modelos/hilux-cabina-simple","https://www.toyota.com.ar/descubri/newsroom/hub-de-recursos/modelos/hilux-hub-de-recursos","https://media.toyota.com.ar/1840b4e1-efd8-43a0-bd17-4e81e27a2d94.pdf"]},
    "SW4 Diamond": {intro:"SUV de siete asientos. Toyota Argentina publica la versión SW4 Diamond II 4x4 6 AT 7A.", specs:[["Motorización","Motor 2.8 litros, 204 CV y 500 Nm según la página oficial de SW4 Diamond."],["Equipamiento publicado","Toyota Safety Sense, visión 360°, BSM y RCTA en la versión Diamond."],["Disponibilidad","Versiones y equipamiento sujetos a confirmación con el concesionario oficial."]], source:"https://www.toyota.com.ar/modelos/sw4-diamond", gallery:["https://www.toyota.com.ar/modelos/sw4-diamond","https://www.toyota.com.ar/imagenes-sw4","https://media.toyota.com.ar/8c31aebb-0202-4c3e-9ae5-907790f3408b.pdf"]},
    "Corolla Cross": {intro:"SUV compacto con versiones nafteras, híbridas y GR-Sport publicadas por Toyota Argentina.", specs:[["Motorización","La página oficial consultada publica 2.0L Dynamic Force, 170 cv y 200 Nm para las versiones nafteras."],["Versiones publicadas","XLI, XEI y SEG 2.0 CVT; también HEV 1.8 y GR-Sport en páginas oficiales asociadas."],["Seguridad","Toyota Safety Sense en todas las versiones según la ficha consultada."]], source:"https://www.toyota.com.ar/modelos/corolla-cross", gallery:["https://www.toyota.com.ar/modelos/corolla-cross","https://www.toyota.com.ar/imagenes-corolla-cross","https://www.toyota.com.ar/modelos/corolla-cross-hybrid"]},
    "RAV4": {intro:"SUV híbrido. Toyota Argentina informó versiones HEV y PHEV para la sexta generación.", specs:[["Motorización","Oferta publicada: Limited HEV, XSE PHEV y GR-Sport PHEV, todas con tracción integral AWD."],["Potencia publicada","239 CV combinados para HEV y hasta 329 CV para PHEV, según la comunicación oficial consultada."],["Disponibilidad","Stock, versiones y especificaciones deben confirmarse con el concesionario."]], source:"https://www.toyota.com.ar/modelos/rav4-hev", gallery:["https://www.toyota.com.ar/modelos/rav4-hev","https://www.toyota.com.ar/imagenes-rav4","https://www.toyota.com.ar/descubri/newsroom/noticias-de-argentina/toyota-presento-la-nueva-generacion-de-rav4-con-motorizacion-hibrida-e-hibrida-enchufable-mas-aventura-para-el-suv-mas-famoso-del-mundo"]},
    "Corolla": {intro:"Sedán Toyota con versiones XLI, XEI y SEG publicadas en la página oficial argentina.", specs:[["Motorización","Toyota Argentina publica motor 2.0L Dynamic Force."],["Tecnología","Pantalla multimedia de 10 pulgadas con Android Auto y Apple CarPlay inalámbricos."],["Equipamiento","Las versiones varían en display, faros, llantas y cargador inalámbrico."]], source:"https://www.toyota.com.ar/modelos/corolla", gallery:["https://www.toyota.com.ar/modelos/corolla","https://media.toyota.com.ar/","https://www.toyota.com.ar/concesionarios"]},
    "Yaris": {intro:"Toyota Argentina mantiene páginas oficiales para Yaris Hatchback y Yaris Cross.", specs:[["Gama publicada","Yaris Hatchback y Yaris Cross aparecen en páginas oficiales separadas."],["Yaris Cross","La ficha consultada publica Full LED, pantalla multimedia de 10 pulgadas y conectividad inalámbrica."],["Disponibilidad","Versiones, stock y equipamiento deben confirmarse con el concesionario."]], source:"https://www.toyota.com.ar/modelos/yaris-hatchback", gallery:["https://www.toyota.com.ar/modelos/yaris-hatchback","https://www.toyota.com.ar/modelos/yaris-cross","https://www.toyota.com.ar/concesionarios"]}
  };
  // Restore detail buttons after the catalog is populated. The delegated
  // handler above will open the existing detail dialog when they are clicked.
  Object.keys(MODEL_DETAILS).forEach(function(name){
    var card=Array.prototype.slice.call(gamaGrid.querySelectorAll(".model")).filter(function(item){return item.getAttribute("data-model")===name;})[0];
    if(!card||card.querySelector("[data-model-detail]"))return;
    var button=document.createElement("button");
    button.className="model-detail-link";
    button.type="button";
    button.setAttribute("data-model-detail",name);
    button.textContent="Ver ficha del modelo ›";
    button.style.cssText="border:0;background:none;color:var(--toyota-red);font:inherit;font-weight:700;font-size:13px;text-align:left;padding:0 0 8px;cursor:pointer;";
    var heading=card.querySelector("h3");
    if(heading)heading.insertAdjacentElement("afterend",button);
  });
  var detail=document.getElementById("modelDetail"), closeDetail=document.getElementById("detailClose"), detailLastFocus=null, detailClosingTimer=null;
  function slugifyModel(name){return name.toLowerCase().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");}
  function closeModelDetail(updateHash){
    if(!detail.classList.contains("open")) return;
    window.__toyotaUnlockScroll();
    detail.classList.remove("open");
    detail.classList.add("is-closing");
    clearTimeout(detailClosingTimer);
    detailClosingTimer=setTimeout(function(){detail.classList.remove("is-closing");},320);
    var fallback=document.querySelector('.model-detail-link, #burger, a[href="#gama"]');
    if(detailLastFocus && document.contains(detailLastFocus) && typeof detailLastFocus.focus==="function") detailLastFocus.focus();
    else if(fallback) fallback.focus();
    if(updateHash!==false)history.replaceState(null,"",location.pathname+location.search+"#gama");
  }
  function openDetail(name,fromHash){var d=MODEL_DETAILS[name];if(!d)return;if(detail.classList.contains("is-closing")){clearTimeout(detailClosingTimer);detail.classList.remove("is-closing");}var wasOpen=detail.classList.contains("open");if(!wasOpen)detailLastFocus=document.activeElement;document.getElementById("detailTitle").textContent=name;document.getElementById("detailCrumb").textContent=name;document.getElementById("detailWhatsApp").href=wa("ventas","Hola! Quiero consultar por la Toyota "+name+".");document.getElementById("detailIntro").textContent=d.intro;document.getElementById("detailSpecs").innerHTML=d.specs.map(function(x){return '<div class="detail-spec"><strong>'+x[0]+'</strong>'+x[1]+'</div>';}).join("");document.getElementById("detailGallery").innerHTML=d.gallery.map(function(x,i){return '<a class="gallery-link" href="'+x+'" target="_blank" rel="noopener">Abrir material '+(i+1)+"</a>";}).join("");document.getElementById("detailSource").href=d.source;detail.classList.add("open");if(!wasOpen)window.__toyotaLockScroll();closeDetail.focus();if(!fromHash)history.pushState(null,"",location.pathname+location.search+"#modelo/"+slugifyModel(name));}
  closeDetail.addEventListener("click",function(){closeModelDetail();});detail.addEventListener("click",function(e){if(e.target===detail)closeModelDetail();});
  detail.querySelectorAll(".detail-actions a[href^='#']").forEach(function(a){a.addEventListener("click",function(){closeModelDetail(false);});});
  function trapDetailFocus(e){if(!detail.classList.contains("open"))return;if(e.key==="Escape"){e.preventDefault();closeModelDetail();return;}if(e.key!=="Tab")return;var f=detail.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');if(!f.length)return;var first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  document.addEventListener("keydown",trapDetailFocus);

  // ---- formulario contextual -> número y mensaje correctos ----
  document.getElementById("contactForm").addEventListener("submit", function(e){
    e.preventDefault(); var nameField=document.getElementById("cName"), messageField=document.getElementById("cMsg");
    var nombre=nameField.value.trim(); var motivo=document.getElementById("cMotivo"); var mensaje=messageField.value.trim();
    [nameField,messageField].forEach(function(field){field.removeAttribute("aria-invalid");});
    var submitButton=this.querySelector("button[type=submit]"),note=this.querySelector(".form-note");
    if(!nombre || !mensaje){
      if(!nombre) nameField.setAttribute("aria-invalid","true");
      if(!mensaje) messageField.setAttribute("aria-invalid","true");
      if(note){note.textContent=!nombre && !mensaje ? "Completá tu nombre y el mensaje para continuar." : (!nombre ? "Completá tu nombre para continuar." : "Contanos brevemente qué necesitás para continuar.");note.className="form-note form-error";note.setAttribute("role","alert");}
      (!nombre ? nameField : messageField).focus(); return;
    }
    if(note){note.textContent="Abriendo WhatsApp…";note.className="form-note";note.setAttribute("role","status");}if(submitButton){submitButton.disabled=true;submitButton.querySelector("span").textContent="Abriendo WhatsApp…";}
    var key=motivo.value==="repuestos"||motivo.value==="accesorios"?"repuestos":motivo.value==="neumaticos"?"neumaticos":"ventas";
    var labels={"0km":"Quiero consultar por un Toyota 0 km.","usados":"Quiero consultar por un vehículo usado disponible.","financiacion":"Quiero consultar opciones de financiación para un Toyota.","canje":"Quiero tasar mi vehículo para un plan canje.","turnos":"Quiero solicitar un turno de service.","repuestos":"Quiero consultar por un repuesto genuino Toyota.","accesorios":"Quiero consultar por accesorios Toyota.","neumaticos":"Quiero consultar por neumáticos Bridgestone.","general":"Quiero realizar una consulta general."};
    var texto="Hola! Soy "+nombre+". "+(labels[motivo.value]||labels.general)+" Detalle: "+mensaje; window.open(wa(key,texto),"_blank");if(note){note.textContent="¡Listo! Se abrió WhatsApp con tu consulta ya redactada.";note.className="form-note form-success";}if(submitButton){setTimeout(function(){submitButton.disabled=false;submitButton.querySelector("span").textContent="Solicitar asesoramiento por WhatsApp";},3000);}
  });

  // ---- fichas técnicas ampliadas: catálogo exclusivo del comparador ----
  // Mantiene MODEL_DETAILS intacto para no modificar las fichas/modal generales.
  var COMPARISON_DETAILS = {
    "Hilux": { specs: [
      ["Categoría", "Pick-up"],
      ["Versiones disponibles", "DX, SR, SRV, SRV+, SRX y Limited. Cabina Simple, Cabina Chasis y Cabina Doble. Combinaciones 4x2/4x4, manual/automática."],
      ["Motor", "2.4 turbodiésel 2GD, 4 cilindros, para DX/gama de acceso. 2.8 turbodiésel 1GD, 4 cilindros, para SR, SRV, SRV+, SRX y Limited."],
      ["Potencia", "2.4: 150 CV a 3.400 rpm. 2.8: 204 CV entre 3.000 y 3.400 rpm. Versiones anteriores del mismo motor entregaban 177 CV."],
      ["Torque", "2.4: 400 Nm entre 1.600 y 2.000 rpm. 2.8 manual: 420 Nm entre 1.400 y 3.400 rpm. 2.8 automática: 500 Nm entre 1.600 y 2.800 rpm."],
      ["Transmisión", "Manual de 6 velocidades o automática de 6 velocidades, según versión."],
      ["Tracción", "4x2 o 4x4 desconectable, con reductora en las versiones 4x4."],
      ["Consumo", "Consultar disponibilidad y configuración vigente. Toyota Argentina no publica cifra oficial de consumo combinado en la ficha pública."],
      ["Dimensiones", "Largo aproximado: 5.330 mm. Despeje al suelo superior a 28 cm. Distancia entre ejes: Consultar disponibilidad y configuración vigente; varía según cabina."],
      ["Baúl o capacidad de carga", "Superior a 1.000 kg según versión. La cifra exacta varía entre Cabina Simple, Chasis y Doble y debe confirmarse."],
      ["Tanque de combustible", "Consultar disponibilidad y configuración vigente."],
      ["Seguridad", "7 airbags: 2 frontales, 2 laterales delanteros, 2 de cortina y 1 de rodilla para conductor. Control de estabilidad, control de tracción, asistente de arranque en pendiente y control de velocidad crucero. Pantalla táctil de 9 pulgadas con Android Auto y Apple CarPlay inalámbricos desde versiones intermedias."],
      ["Garantía", "5 años o 150.000 km."],
      ["Precio de referencia", "Aproximadamente desde $39.900.000 en versiones de acceso hasta más de $72.000.000 en SRX/Limited. Valores variables: confirmar lista vigente con el concesionario."],
      ["Fuentes", "https://www.toyota.com.ar/modelos/hilux-cabina-simple · La Nación · Mercado Libre · Monkey Motor"],
      ["Rendimiento y equipamiento destacado", "La configuración, el equipamiento y la capacidad exacta dependen de cabina, versión, transmisión y tracción." ]
    ], source: "https://www.toyota.com.ar/modelos/hilux-cabina-simple" },
    "SW4 Diamond": { specs: [
      ["Categoría", "SUV de 7 asientos"],
      ["Versiones disponibles", "SRX, Diamond y GR-Sport; todas 4x4."],
      ["Motor", "1GD, 2.8 litros, 4 cilindros en línea, turbodiésel Diésel Grado 3, turbocompresor de geometría variable e intercooler. Euro 5 con filtro de partículas DPF, 16 válvulas, DOHC y cadena de distribución."],
      ["Potencia", "SRX/Diamond: 204 CV entre 3.000 y 3.400 rpm. GR-Sport: 224 CV."],
      ["Torque", "SRX/Diamond: 500 Nm entre 1.600 y 2.800 rpm. GR-Sport: 550 Nm."],
      ["Transmisión", "Automática de 6 velocidades con levas al volante. Modos ECO, NORM y SPORT."],
      ["Tracción", "4x4 desconectable con reductora."],
      ["Consumo", "Consultar disponibilidad y configuración vigente. No publicado oficialmente por Toyota Argentina en la ficha pública."],
      ["Dimensiones", "Consultar disponibilidad y configuración vigente. La ficha web actual no publica medidas exteriores exactas; comparte plataforma con Hilux."],
      ["Baúl o capacidad de carga", "7 asientos, con posibilidad de plegado de tercera fila. Capacidad exacta en litros: Consultar disponibilidad y configuración vigente."],
      ["Tanque de combustible", "80 litros."],
      ["Seguridad", "Toyota Safety Sense: precolisión frontal con detección de peatones y ciclistas, alerta de cambio de carril y control de velocidad crucero adaptativo. Visión 360°, BSM y RCTA. Suspensión delantera independiente de doble brazo y trasera de eje rígido con resortes helicoidales. Frenos a disco ventilados en las 4 ruedas y dirección hidráulica con asistencia variable."],
      ["Garantía", "5 años o 150.000 km."],
      ["Precio de referencia", "SW4 Diamond 4x4: aproximadamente $68.777.000. SW4 GR-Sport: aproximadamente $72.184.000. Referencia de mediados de 2025: confirmar lista vigente."],
      ["Fuentes", "https://www.toyota.com.ar/modelos/sw4-diamond · Diario UNO · Toyota Yacopini · Toyota Bhassa"],
      ["Rendimiento y equipamiento destacado", "SUV de 7 plazas con levas, reductora y modos de conducción. La configuración exacta debe confirmarse por versión." ]
    ], source: "https://www.toyota.com.ar/modelos/sw4-diamond" },
    "Corolla Cross": { specs: [
      ["Categoría", "SUV compacto"],
      ["Versiones disponibles", "XLI, XEI, SEG y GR-Sport nafta 2.0; XEI HEV y SEG HEV híbridas 1.8. Seis configuraciones."],
      ["Motor", "Nafta: 2.0 litros Dynamic Force, 4 cilindros. HEV: sistema autorrecargable con motor naftero 1.8 VVT-i y motor eléctrico."],
      ["Potencia", "Nafta: 171 CV. Híbrida: 122 CV combinados."],
      ["Torque", "Nafta: 203 Nm. Híbrida: 142 Nm."],
      ["Transmisión", "Nafta: automática CVT Direct Shift con 10 marchas preprogramadas. Híbrida: automática eCVT."],
      ["Tracción", "Delantera en toda la gama."],
      ["Consumo", "Cifra oficial combinada: Consultar disponibilidad y configuración vigente. La versión híbrida está orientada a reducir consumo urbano frente a la naftera equivalente."],
      ["Dimensiones", "4.460 mm de largo x 1.825 mm de ancho x 1.620 mm de alto. Distancia entre ejes: 2.640 mm."],
      ["Baúl o capacidad de carga", "440 litros en versiones nafta e híbrida."],
      ["Tanque de combustible", "47 litros en versiones nafta / 36 litros en versiones híbridas."],
      ["Seguridad", "Toyota Safety Sense de serie: precolisión frontal, control crucero adaptativo, alerta y asistencia de carril, luces altas automáticas, alerta de punto ciego y tráfico trasero, asistencia de frenado. 7 airbags, ABS/EBD/BA, control de tracción y estabilidad, Isofix/Latch, frenos a disco en las 4 ruedas, EPB y monitor 360°. Instrumental de 7 pulgadas en XLI/XEI o 12,3 pulgadas full digital en SEG/GR-Sport."],
      ["Garantía", "5 años o 100.000 km. Tren motriz híbrido y batería: 8 años o 160.000 km."],
      ["Precio de referencia", "Gama completa aproximadamente entre $51.918.000 y $64.083.000. Referencia septiembre de 2026: confirmar lista vigente."],
      ["Fuentes", "https://www.toyota.com.ar/modelos/corolla-cross · La Nación · Autotest.com.ar · Monkey Motor"],
      ["Rendimiento y equipamiento destacado", "Pantalla de instrumental de 7 o 12,3 pulgadas según versión. La disponibilidad de equipamiento debe confirmarse por configuración." ]
    ], source: "https://www.toyota.com.ar/modelos/corolla-cross" },
    "RAV4": { specs: [
      ["Categoría", "SUV híbrido / híbrido enchufable"],
      ["Versiones disponibles", "Limited HEV, XSE PHEV y GR-Sport PHEV. Sexta generación, lanzamiento argentino junio de 2026."],
      ["Motor", "HEV: naftero 2.5 litros de 4 cilindros + dos motogeneradores eléctricos MG1 y MG2, sistema híbrido Toyota de 5ª generación. PHEV: conjunto base + motor eléctrico sobre eje trasero y batería de 22,7 kWh."],
      ["Potencia", "HEV: 239 CV combinados. PHEV: hasta 329 CV combinados en GR-Sport PHEV."],
      ["Torque", "HEV: 221 Nm del conjunto térmico. PHEV: Consultar disponibilidad y configuración vigente; no publicado como cifra única del sistema."],
      ["Transmisión", "eCVT en ambas motorizaciones."],
      ["Tracción", "Integral AWD en toda la gama."],
      ["Consumo", "Aproximadamente 4,5 l/100 km promedio declarado como referencia de mercado para HEV: confirmar cifra oficial. PHEV: hasta 142 km de autonomía 100% eléctrica y autonomía total combinada superior a 1.000 km."],
      ["Dimensiones", "Consultar disponibilidad y configuración vigente. La ficha web actual no publica medidas exteriores exactas de la sexta generación."],
      ["Baúl o capacidad de carga", "456 litros en HEV / 421 litros en PHEV. Portón eléctrico manos libres en ambas."],
      ["Tanque de combustible", "HEV: 55 litros. PHEV: combina tanque de nafta y batería; cifra exacta del tanque: Consultar disponibilidad y configuración vigente."],
      ["Seguridad", "Toyota Safety Sense, 7 airbags, alerta de tráfico trasero, monitoreo de punto ciego con asistencia de salida segura, asistente de arranque y descenso. GR-Sport suma Head-Up Display, cámara 360°, techo solar eléctrico, audio JBL de 11 parlantes y pantalla multimedia de 12,9 pulgadas. Selector Multi-Terreno Trail/Snow/Normal y modos Normal/Eco/Sport/EV."],
      ["Garantía", "Programa Toyota 10: hasta 10 años o 200.000 km, según condiciones del programa."],
      ["Precio de referencia", "Lanzamiento desde aproximadamente USD 70.200. El resto de la gama y el valor en pesos varían: confirmar lista vigente."],
      ["Fuentes", "https://www.toyota.com.ar/descubri/newsroom/noticias-de-argentina/toyota-presento-la-nueva-generacion-de-rav4-con-motorizacion-hibrida-e-hibrida-enchufable-mas-aventura-para-el-suv-mas-famoso-del-mundo · Autoblog Argentina · Parabrisas · Perfil · 16 Válvulas · Autocosmos"],
      ["Rendimiento y equipamiento destacado", "Autonomía eléctrica PHEV de hasta 142 km según la ficha de referencia. Las cifras de autonomía, consumo y equipamiento deben confirmarse por versión." ]
    ], source: "https://www.toyota.com.ar/descubri/newsroom/noticias-de-argentina/toyota-presento-la-nueva-generacion-de-rav4-con-motorizacion-hibrida-e-hibrida-enchufable-mas-aventura-para-el-suv-mas-famoso-del-mundo" },
    "Corolla": { specs: [
      ["Categoría", "Sedán"],
      ["Versiones disponibles", "XLI, XEI, SEG y GR-Sport nafta 2.0; XEI Hybrid y SEG Hybrid 1.8. Carrocería sedán en Argentina."],
      ["Motor", "Nafta: 2.0 litros Dynamic Force, 4 cilindros en línea, 16 válvulas DOHC e inyección mixta D4-S. Híbrida: naftero 1.8 ciclo Atkinson de 98 CV + motor eléctrico de 72 CV."],
      ["Potencia", "Nafta: 171 CV a 6.600 rpm. Híbrida: 122 CV combinados."],
      ["Torque", "Nafta: 203 Nm. Híbrida: Consultar disponibilidad y configuración vigente; cifra combinada no publicada de forma unificada."],
      ["Transmisión", "Automática CVT con modo secuencial de 10 velocidades preprogramadas en nafta; e-CVT en híbrida."],
      ["Tracción", "Delantera en toda la gama."],
      ["Consumo", "Híbrida: promedio de 4 l/100 km en ciudad como referencia de mercado; confirmar cifra oficial. Nafta: Consultar disponibilidad y configuración vigente."],
      ["Dimensiones", "4.630 mm de largo x 1.780 mm de ancho x 1.435 mm de alto. Distancia entre ejes: 2.700 mm."],
      ["Baúl o capacidad de carga", "470 litros."],
      ["Tanque de combustible", "Consultar disponibilidad y configuración vigente."],
      ["Seguridad", "Toyota Safety Sense de serie desde SEG: control crucero adaptativo, frenado autónomo de emergencia, alerta de cambio de carril, alerta de punto ciego y tráfico cruzado trasero. Pantalla multimedia de 10 pulgadas con Android Auto/Apple CarPlay inalámbricos. Display de 7 pulgadas en XLI/XEI o full digital configurable de 12,3 pulgadas en SEG. Techo solar eléctrico reservado para XEI naftero."],
      ["Garantía", "5 años o 100.000 km general. Componentes híbridos: 8 años o 160.000 km."],
      ["Precio de referencia", "XLI: $44.082.000. XEI: $48.410.000. SEG: $54.392.000. GR-Sport: más de $57.000.000. XEI Hybrid: $50.764.000. SEG Hybrid: $56.180.000. Referencia agosto de 2026: confirmar lista vigente."],
      ["Fuentes", "https://www.toyota.com.ar/modelos/corolla · Autotest.com.ar · Mercado Libre · LM Neuquén"],
      ["Rendimiento y equipamiento destacado", "El equipamiento cambia según XLI, XEI, SEG, GR-Sport y variantes Hybrid. Confirmar configuración exacta antes de publicar una oferta." ]
    ], source: "https://www.toyota.com.ar/modelos/corolla" },
    "Yaris": { specs: [
      ["Categoría", "Hatchback (el sitio actual lo clasifica dentro de sedanes)"],
      ["Versiones disponibles", "XLI, XLS y XLS+ / S. La nomenclatura puede variar; manual en entrada y CVT desde XLS."],
      ["Motor", "2NR-FE, 1.5 litros, 4 cilindros en línea, 16 válvulas, Dual VVT-i y cadena de distribución."],
      ["Potencia", "107 CV."],
      ["Torque", "140 Nm."],
      ["Transmisión", "Manual de 6 marchas en versiones de entrada o automática CVT de 7 velocidades desde XLS, de serie en XLS+/S."],
      ["Tracción", "Delantera en toda la gama."],
      ["Consumo", "Consultar disponibilidad y configuración vigente. No publicado de forma oficial unificada."],
      ["Dimensiones", "Consultar disponibilidad y configuración vigente."],
      ["Baúl o capacidad de carga", "Consultar disponibilidad y configuración vigente. No publicado en las fuentes consultadas para el Hatchback."],
      ["Tanque de combustible", "Consultar disponibilidad y configuración vigente."],
      ["Seguridad", "Detalle completo: Consultar disponibilidad y configuración vigente. La gama incluye el paquete de seguridad Toyota estándar, airbags, ABS y control de estabilidad según las fuentes consultadas."],
      ["Garantía", "5 años o 100.000 km como política estándar; confirmar aplicación específica al Yaris Hatchback."],
      ["Precio de referencia", "Consultar disponibilidad y configuración vigente. Toyota ajustó precios de Yaris en septiembre de 2026 sin cifra exacta unificada en las fuentes consultadas."],
      ["Fuentes", "https://www.toyota.com.ar/modelos/yaris-hatchback · Mercado Libre"],
      ["Rendimiento y equipamiento destacado", "Esta ficha corresponde al Yaris Hatchback, no al Yaris Cross. El comparador conserva el ítem Yaris existente." ]
    ], source: "https://www.toyota.com.ar/modelos/yaris-hatchback" },
    "Land Cruiser 300": { specs: [
      ["Categoría", "SUV tope de gama off-road"],
      ["Versiones disponibles", "VX HEV y GR-S. Ambas con 7 plazas y tracción integral permanente."],
      ["Motor", "VX HEV: V6 naftero biturbo 3.5 litros + motor eléctrico de alta respuesta, sistema i-FORCE MAX. GR-S: V6 turbodiésel 3.3 litros biturbo."],
      ["Potencia", "VX HEV: 464 CV combinados. GR-S: 304 CV."],
      ["Torque", "VX HEV: Consultar disponibilidad y configuración vigente; no publicado como cifra combinada única. GR-S: 700 Nm."],
      ["Transmisión", "Automática de 10 velocidades en ambas versiones."],
      ["Tracción", "Integral permanente 4WD. GR-S suma bloqueo de diferencial delantero y trasero y suspensión dinámica electrónica E-KDSS."],
      ["Consumo", "Consultar disponibilidad y configuración vigente."],
      ["Dimensiones", "Consultar disponibilidad y configuración vigente; no publicadas para la versión argentina en las fuentes consultadas."],
      ["Baúl o capacidad de carga", "7 plazas en ambas versiones. Capacidad de baúl en litros: Consultar disponibilidad y configuración vigente."],
      ["Tanque de combustible", "Consultar disponibilidad y configuración vigente."],
      ["Seguridad", "Toyota Safety Sense, múltiples asistentes de conducción, 10 airbags, monitor Multi-Terreno 3D, cámara 360° y Head-Up Display. Modos Normal, Eco y Sport, con modos off-road adicionales en GR-S."],
      ["Garantía", "10 años o 200.000 km según comunicado de lanzamiento; confirmar condiciones del programa."],
      ["Precio de referencia", "VX HEV y GR-S: USD 168.300 desde el 01/09/2026 según comunicado de lanzamiento. Confirmar lista vigente."],
      ["Fuentes", "https://www.lanacion.com.ar/autos/toyota-presento-en-la-argentina-el-nuevo-land-cruiser-300-versiones-precios-y-equipamiento-nid07092026/ · https://cuyomotor.com.ar/2026/09/07/nuevo-land-cruiser-300-lanzamiento/ · https://diariodeautos.com.ar/index.php/autos/novedades/item/20502-toyota · Autoblog Argentina"],
      ["Rendimiento y equipamiento destacado", "VX HEV: 0 a 100 km/h en aproximadamente 6,5 s y velocidad máxima 210 km/h. GR-S: aproximadamente 8 s y 210 km/h. Climatizador de 4 zonas, asientos delanteros eléctricos calefaccionados y ventilados, audio JBL de 14 parlantes y pantallas multimedia de 12,3 pulgadas. VX suma techo solar y dos pantallas traseras de 11,6 pulgadas." ]
    ], source: "https://diariodeautos.com.ar/index.php/autos/novedades/item/20502-toyota" },
    "Fortuner": { specs: [
      ["Categoría", "SUV"], ["Versiones disponibles", "Consultar disponibilidad y configuración vigente."], ["Motor", "Consultar disponibilidad y configuración vigente."], ["Potencia", "Consultar disponibilidad y configuración vigente."], ["Torque", "Consultar disponibilidad y configuración vigente."], ["Transmisión", "Consultar disponibilidad y configuración vigente."], ["Tracción", "Consultar disponibilidad y configuración vigente."], ["Consumo", "Consultar disponibilidad y configuración vigente."], ["Dimensiones", "Consultar disponibilidad y configuración vigente."], ["Baúl o capacidad de carga", "Consultar disponibilidad y configuración vigente."], ["Tanque de combustible", "Consultar disponibilidad y configuración vigente."], ["Seguridad", "Consultar disponibilidad y configuración vigente."], ["Garantía", "Consultar disponibilidad y configuración vigente."], ["Precio de referencia", "Consultar disponibilidad y configuración vigente."], ["Fuentes", "Consultar disponibilidad y configuración vigente."], ["Rendimiento y equipamiento destacado", "La disponibilidad, versiones y equipamiento deben validarse con el equipo comercial antes de cotizar."]
    ], source: "https://www.toyota.com.ar/concesionarios" },
    "Etios": { specs: [
      ["Categoría", "Sedán / compacto"], ["Versiones disponibles", "Consultar disponibilidad y configuración vigente."], ["Motor", "Consultar disponibilidad y configuración vigente."], ["Potencia", "Consultar disponibilidad y configuración vigente."], ["Torque", "Consultar disponibilidad y configuración vigente."], ["Transmisión", "Consultar disponibilidad y configuración vigente."], ["Tracción", "Consultar disponibilidad y configuración vigente."], ["Consumo", "Consultar disponibilidad y configuración vigente."], ["Dimensiones", "Consultar disponibilidad y configuración vigente."], ["Baúl o capacidad de carga", "Consultar disponibilidad y configuración vigente."], ["Tanque de combustible", "Consultar disponibilidad y configuración vigente."], ["Seguridad", "Consultar disponibilidad y configuración vigente."], ["Garantía", "Consultar disponibilidad y configuración vigente."], ["Precio de referencia", "Consultar disponibilidad y configuración vigente."], ["Fuentes", "Consultar disponibilidad y configuración vigente."], ["Rendimiento y equipamiento destacado", "Modelo discontinuado en la oferta 0 km; consultar disponibilidad de usados y equipamiento de la unidad."]
    ], source: "https://www.toyota.com.ar/concesionarios" }
  };
  // ---- comparador de modelos: usa los mismos datos de MODELOS_TOYOTA / COMPARISON_DETAILS, no inventa specs nuevas ----
  (function(){
    var selA = document.getElementById("compareA");
    var selB = document.getElementById("compareB");
    var result = document.getElementById("compareResult");
    var empty = document.getElementById("compareEmpty");
    var table = document.getElementById("compareTable");
    var waA = document.getElementById("compareWaA");
    var waB = document.getElementById("compareWaB");
    var resetBtn = document.getElementById("compareReset");
    if(!selA || !selB) return;

    var TIPO_LABEL = {pickup:"Pick-up", suv:"SUV", sedan:"Sedán"};

    MODELOS_TOYOTA.forEach(function(m){
      [selA, selB].forEach(function(sel){
        var opt = document.createElement("option");
        opt.value = m.nombre; opt.textContent = m.nombre;
        if(m.nombre === "Fortuner" || m.nombre === "Etios"){opt.disabled=true;opt.textContent += " — ficha en actualización";}
        sel.appendChild(opt);
      });
    });
    selB.selectedIndex = MODELOS_TOYOTA.length > 1 ? 2 : 0;

    function escapeCompare(value){return String(value).replace(/[&<>"']/g,function(ch){return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch];});}
    function compareValue(value){return escapeCompare(value).replace(/(https?:\/\/[^\s<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');}
    function comparisonSpecs(nombre){var d=COMPARISON_DETAILS[nombre];return d&&d.specs?d.specs:[];}

    function render(){
      var a = selA.value, b = selB.value;
      if(!a || !b){ result.hidden = true; empty.hidden = false; return; }
      if(a === b){ table.innerHTML = "<p class=\"compare-na\" style=\"padding:14px 0;\">Elegí dos modelos distintos para comparar.</p>"; empty.hidden = true; result.hidden = false; waA.style.display="none"; waB.style.display="none"; return; }
      waA.style.display=""; waB.style.display="";
      var mA = MODELOS_TOYOTA.filter(function(m){return m.nombre===a;})[0];
      var mB = MODELOS_TOYOTA.filter(function(m){return m.nombre===b;})[0];
      var dA = COMPARISON_DETAILS[a], dB = COMPARISON_DETAILS[b];
      var rowsA=comparisonSpecs(a), rowsB=comparisonSpecs(b);
      var axes=rowsA.map(function(row){return row[0];});
      table.innerHTML=
        "<table class=\"compare-detail-table\"><caption class=\"sr-only\">Comparación técnica detallada entre "+escapeCompare(a)+" y "+escapeCompare(b)+"</caption><thead><tr><th scope=\"col\">Eje técnico</th><th scope=\"col\">"+escapeCompare(a)+"</th><th scope=\"col\">"+escapeCompare(b)+"</th></tr></thead><tbody>"+
        axes.map(function(axis,index){var va=rowsA[index]&&rowsA[index][1]||"Consultar disponibilidad y configuración vigente.";var vb=rowsB[index]&&rowsB[index][1]||"Consultar disponibilidad y configuración vigente.";return "<tr><th scope=\"row\">"+escapeCompare(axis)+"</th><td>"+compareValue(va)+"</td><td>"+compareValue(vb)+"</td></tr>";}).join("")+
        "</tbody></table>";
      waA.textContent = "Consultar " + a + " ↗";
      waB.textContent = "Consultar " + b + " ↗";
      waA.href = wa("ventas", "Hola! Estoy comparando la " + a + " con la " + b + " y quiero consultar por la " + a + ".");
      waB.href = wa("ventas", "Hola! Estoy comparando la " + a + " con la " + b + " y quiero consultar por la " + b + ".");
      empty.hidden = true; result.hidden = false;
      if(window.gsap && !window.matchMedia("(prefers-reduced-motion: reduce)").matches){
        var freshRows=table.querySelectorAll("tbody tr");
        gsap.fromTo(freshRows,{opacity:0,y:10},{opacity:1,y:0,duration:.4,stagger:.045,ease:"power2.out",overwrite:true});
        gsap.fromTo([waA,waB],{opacity:0,y:8},{opacity:1,y:0,duration:.35,stagger:.06,delay:.1,ease:"power2.out",overwrite:true});
      }
    }

    function syncCompareHash(){var a=selA.value,b=selB.value;if(a&&b)history.replaceState(null,"",location.pathname+location.search+"#comparar?a="+encodeURIComponent(a)+"&b="+encodeURIComponent(b));}
    selA.addEventListener("change", function(){render();syncCompareHash();});
    selB.addEventListener("change", function(){render();syncCompareHash();});
    if(resetBtn) resetBtn.addEventListener("click", function(){ selA.value=""; selB.value=""; render(); });
    render();
  })();


  // ---- rutas compartibles por hash ----
  function restoreHashRoute(){var h=location.hash.replace(/^#/,"");if(h.indexOf("modelo/")===0){var slug=h.slice(7),name=Object.keys(MODEL_DETAILS).filter(function(k){return slugifyModel(k)===slug;})[0];if(name)openDetail(name,true);return;}if(h.indexOf("comparar")===0){var q=h.split("?")[1]||"",p=new URLSearchParams(q),a=p.get("a"),b=p.get("b");if(a&&document.getElementById("compareA")){var ca=document.getElementById("compareA"),cb=document.getElementById("compareB"),validA=Array.prototype.some.call(ca.options,function(o){return o.value===a&&!o.disabled;}),validB=Array.prototype.some.call(cb.options,function(o){return o.value===b&&!o.disabled;});if(validA){ca.value=a;cb.value=validB?b:"";ca.dispatchEvent(new Event("change"));}}var c=document.getElementById("comparar");if(c)window.__toyotaScrollToElement(c);return;}if(h.indexOf("gama?")===0){var gama=document.getElementById("gama");if(gama)setTimeout(function(){window.__toyotaScrollToElement(gama);},0);return;}if(h){var target=document.getElementById(h);if(target)setTimeout(function(){window.__toyotaScrollToElement(target);},0);}}
  window.addEventListener("hashchange",function(){if(!location.hash.match(/^#modelo\//))closeModelDetail(false);restoreHashRoute();});
  restoreHashRoute();


  // ---- expansión de contenido: destacados, categorías, vistos recientes y filtros ----
  var highlightTrack=document.getElementById("highlightTrack");
  function renderHighlights(){if(!highlightTrack)return;highlightTrack.innerHTML="";MODELOS_TOYOTA.filter(function(m){return !!m.foto;}).slice(0,4).forEach(function(m){var card=document.createElement("article");card.className="highlight-card";card.innerHTML='<div><div class="highlight-visual"><picture><source type="image/avif" srcset="'+m.foto.replace(/-800\.webp$/,"-800.avif")+' 800w, '+m.foto.replace(/-800\.webp$/,"-480.avif")+' 480w" sizes="(max-width: 600px) 92vw, 360px"><source type="image/webp" srcset="'+m.foto.replace(/-800\.webp$/,"-480.webp")+' 480w, '+m.foto+' 800w" sizes="(max-width: 600px) 92vw, 360px"><img src="'+m.foto+'" alt="Toyota '+m.nombre+'" loading="lazy" decoding="async" width="'+m.fotoW+'" height="'+m.fotoH+'"></picture></div><h3>'+m.nombre+'</h3><p>'+m.desc+'</p></div><div class="highlight-actions"><a class="btn primary" target="_blank" rel="noopener" href="'+wa("ventas","Hola! Quiero consultar por la "+m.nombre+".")+'">Consultar ↗</a></div>';highlightTrack.appendChild(card);});}
  renderHighlights();
  if(highlightTrack){highlightTrack.addEventListener("click",function(e){var b=e.target.closest(".highlight-detail");if(b)openDetail(b.dataset.model);});}
  var hp=document.getElementById("highlightPrev"),hn=document.getElementById("highlightNext");
  function glideHighlight(delta){if(!highlightTrack||!window.gsap)return;var target=Math.max(0,Math.min(highlightTrack.scrollWidth-highlightTrack.clientWidth,highlightTrack.scrollLeft+delta));gsap.to(highlightTrack,{scrollLeft:target,duration:.72,ease:"power3.out",overwrite:true});}
  if(hp)hp.addEventListener("click",function(){glideHighlight(-highlightTrack.clientWidth*.78);});
  if(hn)hn.addEventListener("click",function(){glideHighlight(highlightTrack.clientWidth*.78);});

  document.querySelectorAll(".category-link").forEach(function(a){a.addEventListener("click",function(){var type=this.closest(".category-card").dataset.category;var filter=document.querySelector('.filterbtn[data-filter="'+type+'"]');if(filter)filter.click();});});

  var recentKey="toyota-recent-models";
  function readRecent(){try{return JSON.parse(sessionStorage.getItem(recentKey)||"[]");}catch(e){return[];}}
  function renderRecent(){var box=document.getElementById("vistos"),list=document.getElementById("recentList");if(!box||!list)return;var items=readRecent();box.hidden=!items.length;list.innerHTML=items.map(function(n){return '<a class="recent-chip" href="#modelo/'+slugifyModel(n)+'" data-recent-model="'+n+'">'+n+' <span aria-hidden="true">↗</span></a>';}).join("");list.querySelectorAll("[data-recent-model]").forEach(function(a){a.addEventListener("click",function(e){e.preventDefault();openDetail(this.dataset.recentModel);});});}
  function rememberRecent(name){var items=readRecent().filter(function(x){return x!==name;});items.unshift(name);try{sessionStorage.setItem(recentKey,JSON.stringify(items.slice(0,4)));}catch(e){}renderRecent();}
  var originalOpenDetail=openDetail;
  openDetail=function(name,fromHash){rememberRecent(name);return originalOpenDetail(name,fromHash);};
  renderRecent();

  var accessoryGrid=document.querySelector("#accesorios .access-grid"), accessorySort=document.getElementById("accessorySort");
  function sortAccessories(mode){if(!accessoryGrid)return;var figs=[].slice.call(accessoryGrid.querySelectorAll("figure"));figs.sort(function(a,b){var aa=a.querySelector("figcaption").textContent.trim(),bb=b.querySelector("figcaption").textContent.trim();return mode==="za"?bb.localeCompare(aa,"es"):mode==="az"?aa.localeCompare(bb,"es"):0;});figs.forEach(function(f){accessoryGrid.appendChild(f);});}
  function animateAccessoryLayout(mutator){if(!accessoryGrid||!window.gsap){mutator();return;}var state=window.Flip?Flip.getState(accessoryGrid.querySelectorAll("figure")):null;mutator();if(state&&window.Flip&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches)Flip.from(state,{duration:.55,ease:"power2.inOut",absolute:false,stagger:.025});}
  document.querySelectorAll(".access-filter").forEach(function(btn){btn.addEventListener("click",function(){document.querySelectorAll(".access-filter").forEach(function(x){x.classList.remove("active");});this.classList.add("active");var cat=this.dataset.accessFilter;animateAccessoryLayout(function(){if(accessoryGrid)accessoryGrid.querySelectorAll("figure").forEach(function(fig){fig.hidden=cat!=="todos"&&fig.querySelector("img").dataset.accessoryCategory!==cat;});});});});
  if(accessorySort)accessorySort.addEventListener("change",function(){animateAccessoryLayout(function(){sortAccessories(accessorySort.value);});});

  // Compuerta de calidad honesta: los recursos pequeños no se fuerzan a ocupar un hero.

  // ---- GSAP + ScrollTrigger reveal system ----
  if(window.gsap && window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var revealSections = document.querySelectorAll(".premium-reveal");
    // Curva de firma compartida: mismo bezier "toyotaEase" usado en los demás runtimes,
    // registrada acá también por si este bloque corre antes de que otro script lo cree.
    // Se adelanta (antes vivía más abajo) para que gobierne también el reveal de secciones.
    var premiumEase="power3.out";
    if(window.CustomEase){gsap.registerPlugin(CustomEase);CustomEase.create("toyotaEase","M0,0 C0.16,0.8 0.28,1 1,1");premiumEase="toyotaEase";}
    if(reduceMotion){ revealSections.forEach(function(el){el.classList.add("is-visible");}); }
    else {
      revealSections.forEach(function(el){
        el.classList.add("gsap-ready");
        // Reveal compositable: opacity + transform evita repaints grandes de clip-path
        // en cada entrada y conserva una llegada sobria, estable y premium.
        // No animar la visibilidad de la sección completa: si ScrollTrigger se refresca
        // durante una carga lenta, un trigger puede no entrar y dejar el contenido en opacity:0.
        // La sección queda visible desde el inicio; solo los elementos internos tienen motion.
        el.classList.add("is-visible");
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
      });
      // Los reveals de secciones bajo el pliegue se registran después del primer render:
      // ScrollTrigger.batch mide el layout de cada grilla y, en móvil, ese trabajo competía
      // con el pintado del hero (LCP). Nada de esto es visible en el primer frame.
      var afterFirstPaint=function(fn){
        var run=function(){if(window.requestIdleCallback){requestIdleCallback(fn,{timeout:1500});}else{setTimeout(fn,200);}};
        if(window.requestAnimationFrame){requestAnimationFrame(function(){setTimeout(run,0);});}else{run();}
      };
      afterFirstPaint(function(){
        [".gama-grid .model",".highlight-track .highlight-card",".access-grid figure",".expansion-grid > *",".category-browser > *",".maintenance-grid > *"].forEach(function(selector){
          ScrollTrigger.batch(selector,{start:"top 88%",once:true,onEnter:function(batch){
            gsap.from(batch,{opacity:0,y:22,duration:.55,ease:"power2.out",stagger:.07,clearProps:"opacity,transform"});
          }});
        });
      });
      var heroTl=gsap.timeline({defaults:{ease:premiumEase}});
      var heroTitle=document.querySelector(".hero h1");
      var heroSplit=window.SplitText&&heroTitle?SplitText.create(heroTitle,{type:"words,chars",aria:"auto"}):null;
      if(heroSplit){gsap.set(heroSplit.chars,{opacity:0,y:24,rotateX:-35,transformOrigin:"50% 100%"});}
      // Elementos del hero editorial que hasta ahora aparecían de golpe sin choreografía propia:
      // rieles laterales, foto principal/secundaria, wordmark, specs y el aviso de scroll.
      // Solo se anima clip-path/opacity/transform del contenedor (nunca la imagen, que ya
      // lleva su propio transform:scale con !important) para no pelear con el CSS existente
      // ni alterar el recorte final: clearProps deja el DOM exactamente como estaba en reposo.
      var heroRails=gsap.utils.toArray(".hero-editorial-rail");
      var heroPrimaryFig=document.querySelector(".hero-editorial-vehicle:not(.hero-editorial-secondary)");
      var heroSecondaryFig=document.querySelector(".hero-editorial-secondary");
      var heroWordmark=document.querySelector(".hero-editorial-wordmark");
      var heroSpecs=gsap.utils.toArray(".hero-editorial-specs > span");
      var heroScrollCue=document.querySelector(".hero-editorial-scroll");
      var heroWash=document.querySelector(".hero-editorial-wash");
      var heroCta=document.querySelector(".editorial-cta");
      // Pass 1 — ritmo: el ambiente (wash) abre la escena como un telón, el vehículo entra
      // casi encima de él (no después), y la tipografía empieza a revelarse mientras el
      // vehículo todavía está terminando de asentarse. Nada espera a que lo anterior termine
      // del todo: se superponen a propósito para que lea como una toma coreografiada.
      heroTl
        .fromTo(heroWash,{opacity:0},{opacity:1,duration:.7,ease:"power1.out",clearProps:"opacity"},0)
        .from(heroRails,{opacity:0,y:14,duration:.5,stagger:.08},.04)
        .fromTo(heroPrimaryFig,{clipPath:"inset(0% 0% 100% 0%)",scale:1.055,opacity:.85},{clipPath:"inset(0% 0% 0% 0%)",scale:1,opacity:1,duration:1.05,ease:premiumEase,clearProps:"clipPath,scale,opacity"},.1)
        .fromTo(heroSecondaryFig,{clipPath:"inset(0% 0% 100% 0%)",opacity:0,y:16},{clipPath:"inset(0% 0% 0% 0%)",opacity:1,y:0,duration:.85,ease:premiumEase,clearProps:"clipPath,opacity,y"},.32)
        .from(heroWordmark,{opacity:0,x:-14,duration:.6},.42)
        .from(".hero .tag",{opacity:0,x:-18,duration:.45},.46)
        .to(heroSplit?heroSplit.chars:{},heroSplit?{opacity:1,y:0,rotateX:0,stagger:.018,duration:.52,ease:premiumEase}:{duration:.52},.58)
        .from(".hero .lead",{opacity:0,y:18,duration:.5},"-=.28")
        .from(".hero-editorial-actions > *",{opacity:0,y:16,scale:.97,stagger:.09,duration:.48,ease:"back.out(1.4)"},"-=.22")
        .from(heroSpecs,{opacity:0,y:10,duration:.42,stagger:.06},"-=.18")
        .from(heroScrollCue,{opacity:0,duration:.5},"-=.12");
      // El móvil no hereda el tempo de escritorio tal cual: el mismo guion pero ~20% más
      // rápido, porque en pantallas chicas una entrada larga se percibe como demora, no lujo.
      if(window.matchMedia&&window.matchMedia("(max-width:760px)").matches){heroTl.timeScale(1.2);}
      // Hover de .highlight-card consolidado en gsap-max-motion-runtime (un solo listener por tarjeta).

      // Barrido de luz sobre el vehículo principal al cierre de la entrada: una sola
      // pasada, no un loop — el gesto de "campaña automotriz" sin volverse decorativo.
      if(heroPrimaryFig){
        var heroSheen=document.createElement("span");
        heroSheen.setAttribute("aria-hidden","true");
        heroSheen.style.cssText="position:absolute;inset:0;z-index:2;pointer-events:none;mix-blend-mode:overlay;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.55) 50%,transparent 60%);transform:translateX(-120%) skewX(-12deg);";
        heroPrimaryFig.style.position=heroPrimaryFig.style.position||"absolute";
        heroPrimaryFig.appendChild(heroSheen);
        heroTl.to(heroSheen,{xPercent:220,duration:1.05,ease:"power2.inOut",onComplete:function(){heroSheen.remove();}},"-=.35");
      }

      // Profundidad por capas: el wordmark, el vehículo secundario y el principal se
      // mueven a distinta velocidad detrás del cursor, como planos reales de cámara.
      // Restringido a punteros finos de escritorio para no interferir con el touch.
      if(window.matchMedia&&window.matchMedia("(hover: hover) and (pointer: fine)").matches){
        var heroStage=document.querySelector(".hero-editorial-stage");
        if(heroStage){
          var heroLayers=[
            {el:heroWordmark,x:10,y:6},
            {el:heroSecondaryFig,x:-14,y:8},
            {el:heroPrimaryFig,x:-6,y:4}
          ].filter(function(l){return l.el;});
          var heroMovers=heroLayers.map(function(l){return {x:gsap.quickTo(l.el,"x",{duration:.9,ease:"power3.out"}),y:gsap.quickTo(l.el,"y",{duration:.9,ease:"power3.out"}),depth:l};});
          var heroStageMove=function(e){
            var rect=heroStage.getBoundingClientRect();
            var px=(e.clientX-rect.left)/rect.width-.5, py=(e.clientY-rect.top)/rect.height-.5;
            heroMovers.forEach(function(m){m.x(px*m.depth.x);m.y(py*m.depth.y);});
          };
          var heroStageLeave=function(){heroMovers.forEach(function(m){m.x(0);m.y(0);});};
          heroStage.addEventListener("pointermove",heroStageMove,{passive:true});
          heroStage.addEventListener("pointerleave",heroStageLeave,{passive:true});
        }
      }

      // El aviso de scroll respira suavemente en vez de quedar inerte una vez que apareció.
      if(heroScrollCue){
        gsap.to(heroScrollCue,{opacity:.45,duration:1.3,ease:"sine.inOut",yoyo:true,repeat:-1,delay:1.4});
      }

      // Pass 2 — el CTA principal ya tenía atracción magnética (x/y) desde flagship-motion-runtime,
      // pero nunca respondía en profundidad ni al instante del click: se sentía "pegado" al
      // fondo en vez de un control físico que se puede presionar. Se suma escala en hover/press
      // sobre la misma referencia, sin tocar x/y para no pisar el magnetismo existente.
      if(heroCta){
        var ctaScale=gsap.quickTo(heroCta,"scale",{duration:.32,ease:premiumEase});
        var ctaPressed=false;
        heroCta.addEventListener("pointerenter",function(){ctaScale(1.035);},{passive:true});
        heroCta.addEventListener("pointerleave",function(){ctaPressed=false;ctaScale(1);},{passive:true});
        heroCta.addEventListener("pointerdown",function(){ctaPressed=true;ctaScale(.96);},{passive:true});
        heroCta.addEventListener("pointerup",function(){if(!ctaPressed)return;ctaPressed=false;ctaScale(heroCta.matches(":hover")?1.035:1);},{passive:true});
      }

      // Pass 3 — salida del Hero: los elementos livianos (marca de agua, specs, aviso de
      // scroll) se retiran gradualmente a medida que el Hero sale de pantalla, para que la
      // transición a la siguiente sección se sienta continua en vez de un corte seco. El
      // scrub queda limitado a opacity/y de estos elementos chicos — nunca a la imagen
      // principal, que es la fuente medible de frame drops descartada en otro runtime.
}
  } else { document.querySelectorAll(".premium-reveal").forEach(function(el){el.classList.add("is-visible");}); }

});
