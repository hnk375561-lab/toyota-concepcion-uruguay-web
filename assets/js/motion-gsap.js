document.addEventListener("DOMContentLoaded", function(){
  (function(){

  "use strict";
  if(!window.gsap||!window.ScrollTrigger)return;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce){document.documentElement.dataset.motion="reduced";return;}
  var MOTION=window.__toyotaMotionTokens=window.__toyotaMotionTokens||{entrance:"power3.out",ui:"power2.out",exit:"power2.in",micro:.14,base:.32,slow:.72,hero:1.1,stagger:.072,distance:24,scrollDuration:.72};
  window.__toyotaMotionRuntime=window.__toyotaMotionRuntime||{};
  if(!window.__toyotaMotionRuntime.scrollTriggerRegistered){gsap.registerPlugin(ScrollTrigger);window.__toyotaMotionRuntime.scrollTriggerRegistered=true;}
  var mm=gsap.matchMedia();
  var splitInstances=[];
  var cleanupFns=[];
  // Misma curva de firma que el hero (toyotaEase); si CustomEase no cargó todavía, se
  // degrada a power3.out sin romper nada. Objetivo: una sola sensación de movimiento
  // para headings, tarjetas y tilt, en vez de varias curvas "power*" mezcladas.
  var premiumEase=MOTION.entrance;
  if(window.CustomEase){
    if(!window.__toyotaMotionRuntime.customEaseRegistered){gsap.registerPlugin(CustomEase);CustomEase.create("toyotaEase","M0,0 C0.16,0.8 0.28,1 1,1");window.__toyotaMotionRuntime.customEaseRegistered=true;}
    premiumEase="toyotaEase";
  }
  var ctx=gsap.context(function(){
    var hero=document.querySelector(".hero");
    // The hero deliberately has no continuous scrub. The controlled comparison
    // showed that this was the measurable source of its frame-time spikes.

    // Section storytelling: headings reveal by word once, while the cards remain scroll-fluid.
    var headings=gsap.utils.toArray("#gama .section-head h2, #destacados .section-head h2, #canje h2, #financiacion h2, #mantenimiento h2, #taller h2, #faq h2, #concesionario h2");
    headings.forEach(function(head){
      if(window.SplitText){
        var split=SplitText.create(head,{type:"words",aria:"auto"});
        splitInstances.push(split);
        gsap.set(split.words,{opacity:0,y:18,rotateX:-18,transformOrigin:"50% 100%"});
        gsap.to(split.words,{opacity:1,y:0,rotateX:0,stagger:MOTION.stagger,duration:.58,ease:premiumEase,scrollTrigger:{trigger:head,start:"top 84%",once:true}});
      }else{
        gsap.fromTo(head,{opacity:0,y:MOTION.distance*.75},{opacity:1,y:0,duration:.58,ease:premiumEase,scrollTrigger:{trigger:head,start:"top 84%",once:true}});
      }
    });

    // Image choreography: reveal image content without changing layout or dimensions.
    var revealImages=gsap.utils.toArray(".highlight-visual img");
    revealImages.forEach(function(img){
      gsap.fromTo(img,{scale:1.06,opacity:.72},{scale:1,opacity:1,duration:MOTION.slow,ease:premiumEase,scrollTrigger:{trigger:img,start:"top 91%",once:true}});
    });

    // One delegated hover system, avoiding dozens of permanent timelines.
    // Consolidado: y + scale + icon scale para todas las tarjetas, más tilt 3D (rotationX/Y)
    // solo para .model/.highlight-card/.category-card en punteros finos con hover real.
    var fineHover=window.matchMedia&&window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var hoverCards=gsap.utils.toArray(".model, .highlight-card, .category-card, .serv-item, .expansion-card");
    hoverCards.forEach(function(card){
      var move=gsap.quickTo(card,"y",{duration:MOTION.base,ease:premiumEase});
      var scale=gsap.quickTo(card,"scale",{duration:MOTION.base,ease:premiumEase});
      var icon=card.querySelector(".model-photo, .highlight-visual img, .ico svg, svg");
      var iconScale=icon?gsap.quickTo(icon,"scale",{duration:MOTION.base,ease:premiumEase}):null;
      var tiltCard=fineHover&&card.matches(".model, .highlight-card, .category-card");
      var rx=tiltCard?gsap.quickTo(card,"rotationX",{duration:MOTION.base,ease:premiumEase}):null;
      var ry=tiltCard?gsap.quickTo(card,"rotationY",{duration:MOTION.base,ease:premiumEase}):null;
      var rect=null;
      var enter=function(){move(-5);scale(1.008);if(iconScale)iconScale(1.035);if(tiltCard)rect=card.getBoundingClientRect();};
      var onMove=function(e){if(!tiltCard||!rect)return;var px=(e.clientX-rect.left)/rect.width-.5,py=(e.clientY-rect.top)/rect.height-.5;rx(py*-3.2);ry(px*3.2);};
      var leave=function(){move(0);scale(1);if(iconScale)iconScale(1);if(tiltCard){rect=null;rx(0);ry(0);}};
      var pressed=false;
      var down=function(){pressed=true;scale(.985);};
      var up=function(){if(!pressed)return;pressed=false;scale(card.matches(":hover")?1.008:1);};
      card.addEventListener("pointerenter",enter,{passive:true});
      if(tiltCard)card.addEventListener("pointermove",onMove,{passive:true});
      card.addEventListener("pointerleave",leave,{passive:true});
      card.addEventListener("pointerdown",down,{passive:true});
      card.addEventListener("pointerup",up,{passive:true});
      cleanupFns.push(function(){card.removeEventListener("pointerenter",enter);if(tiltCard)card.removeEventListener("pointermove",onMove);card.removeEventListener("pointerleave",leave);card.removeEventListener("pointerdown",down);card.removeEventListener("pointerup",up);});
    });

    // Filter transition: capture before the existing handler, then let Flip preserve spatial continuity.
    var filterbar=document.getElementById("filterbar");
    if(filterbar){
      var onFilter=function(){
        if(!window.Flip){if(window.__loadToyotaFlip)window.__loadToyotaFlip();return;}
        var gamaGridEl=document.getElementById("gama-grid");
        var state=Flip.getState(gamaGridEl?gamaGridEl.querySelectorAll(".model"):[]);
        requestAnimationFrame(function(){
          if(document.documentElement.dataset.motion!=="reduced")Flip.from(state,{duration:.62,ease:"power3.inOut",absolute:false,stagger:.035,prune:true,scale:true,clearProps:"transform"});
        });
      };
      filterbar.addEventListener("click",onFilter,true);
      cleanupFns.push(function(){filterbar.removeEventListener("click",onFilter,true);});
    }

    // Modal: animate backdrop panel and information blocks after the existing open class changes.
    var detail=document.getElementById("modelDetail"),panel=detail&&detail.querySelector(".detail-panel");
    if(detail&&panel){
      var modalObserver=new MutationObserver(function(){
        if(!detail.classList.contains("open"))return;
        var bits=panel.querySelectorAll(".detail-head, .detail-grid, .detail-actions, .detail-foot");
        gsap.fromTo(detail,{opacity:0},{opacity:1,duration:.4,ease:"power2.out",overwrite:true});
        gsap.fromTo(panel,{opacity:0,y:24,scale:.97},{opacity:1,y:0,scale:1,duration:.5,ease:premiumEase,overwrite:true});
        gsap.fromTo(bits,{opacity:0,y:12},{opacity:1,y:0,duration:.36,stagger:.055,ease:"power2.out",delay:.08,overwrite:true});
      });
      modalObserver.observe(detail,{attributes:true,attributeFilter:["class"]});
      cleanupFns.push(function(){modalObserver.disconnect();});
    }

    // Detail CTA and primary actions get tactile, restrained feedback instead of elastic bounce.
    // Nota de auditoría: el transform inline que ponía GSAP (solo scale:1.018) tapaba el
    // translateY(-3px) que el CSS de .btn:hover/.float-wa:hover/.float-advisor:hover ya
    // pedía (el inline siempre gana sobre :hover normal). Se restaura ese lift por elemento
    // -mismo valor que su propio CSS- para que quede una sola fuente de verdad, sin colisión.
    gsap.utils.toArray(".btn.primary, .float-wa, .float-advisor").forEach(function(button){
      var targetScale=button.classList.contains("float-wa")?1.08:button.classList.contains("float-advisor")?1.05:1.03;
      var enter=function(){gsap.to(button,{y:-3,scale:targetScale,duration:.24,ease:premiumEase,overwrite:true});};
      var leave=function(){gsap.to(button,{y:0,scale:1,duration:.32,ease:premiumEase,overwrite:true});};
      button.addEventListener("pointerenter",enter,{passive:true});
      button.addEventListener("pointerleave",leave,{passive:true});
      cleanupFns.push(function(){button.removeEventListener("pointerenter",enter);button.removeEventListener("pointerleave",leave);});
    });

    // Retroalimentación táctil inmediata: el resto del sistema cubre hover/salida,
    // pero el instante del click en sí no tenía respuesta propia en ningún control.
    var pressTargets=gsap.utils.toArray(".btn, .loc-btn, .faq-q, .filterbtn, .access-filter, .faq-tab, .compare-btn, .expand-btn");
    pressTargets.forEach(function(el){
      var down=function(){gsap.to(el,{scale:.965,duration:.11,ease:"power2.out",overwrite:"auto"});};
      var up=function(){gsap.to(el,{scale:1,duration:.32,ease:premiumEase,overwrite:"auto"});};
      el.addEventListener("pointerdown",down,{passive:true});
      el.addEventListener("pointerup",up,{passive:true});
      el.addEventListener("pointerleave",up,{passive:true});
      cleanupFns.push(function(){el.removeEventListener("pointerdown",down);el.removeEventListener("pointerup",up);el.removeEventListener("pointerleave",up);});
    });

      // Los botones flotantes son canales de contacto críticos: quedan visibles desde
      // el primer frame. La animación anterior podía dejarlos en opacity:0 si otro
      // timeline se interrumpía o se destruía antes de completar.
      gsap.set(".float-wa, .float-advisor, .float-social",{clearProps:"opacity,visibility"});

  },document.body);

  window.__destroyToyotaGsapMotion=function(){
    cleanupFns.forEach(function(fn){try{fn();}catch(e){}});
    splitInstances.forEach(function(split){try{split.revert();}catch(e){}});
    mm.revert();
    ctx.revert();
  };
  window.addEventListener("pagehide",window.__destroyToyotaGsapMotion,{once:true});
  })();
  (function(){

  "use strict";
  if(!window.gsap||!window.ScrollTrigger)return;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(reduce)return;
  var MOTION=window.__toyotaMotionTokens=window.__toyotaMotionTokens||{entrance:"power3.out",ui:"power2.out",exit:"power2.in",micro:.14,base:.32,slow:.72,hero:1.1,stagger:.072,distance:24,scrollDuration:.72};
  window.__toyotaMotionRuntime=window.__toyotaMotionRuntime||{};
  if(!window.__toyotaMotionRuntime.scrollTriggerRegistered){gsap.registerPlugin(ScrollTrigger);window.__toyotaMotionRuntime.scrollTriggerRegistered=true;}
  var mm=gsap.matchMedia();
  var cleanup=[];
  var ctx=gsap.context(function(){
    var ease=window.__toyotaMotionRuntime&&window.__toyotaMotionRuntime.customEaseRegistered?"toyotaEase":MOTION.entrance;
    if(window.CustomEase&&!window.__toyotaMotionRuntime.customEaseRegistered){gsap.registerPlugin(CustomEase);CustomEase.create("toyotaEase","M0,0 C0.16,0.8 0.28,1 1,1");window.__toyotaMotionRuntime.customEaseRegistered=true;ease="toyotaEase";}
    var desktop="(min-width: 901px)";
    var tablet="(min-width: 561px) and (max-width: 900px)";

    // Mismo criterio ya aplicado al hero: el scrub continuo era el origen medible de los
    // picos de frame-time. Se reemplaza por un reveal una sola vez al entrar en viewport.
    [".cta-banner","#usados .used-visual","#instalaciones .facility-visual","#taller .workshop-visual"].forEach(function(selector){
      gsap.utils.toArray(selector).forEach(function(el){
        var inner=el.querySelector("img,svg")||el;
        gsap.fromTo(inner,{yPercent:-2,scale:1.05,opacity:.85},{yPercent:0,scale:1,opacity:1,duration:MOTION.slow,ease:ease,scrollTrigger:{trigger:el,start:"top 88%",once:true}});
      });
    });

    // A deliberate section-level rhythm: content arrives in overlapping waves, not isolated fade-ins.
    ["#gama .model","#porque .value-card","#categorias .category-card","#como-comprar .journey-line article","#contacto-ampliado .contact-plus-card","#servicios .serv-item"].forEach(function(selector){
      var items=gsap.utils.toArray(selector);
      if(!items.length)return;
      gsap.fromTo(items,{opacity:.28,y:MOTION.distance,rotateX:-5,transformOrigin:"50% 100%"},{opacity:1,y:0,rotateX:0,duration:MOTION.slow,stagger:{each:MOTION.stagger,from:"start"},ease:ease,scrollTrigger:{trigger:items[0].parentElement,start:"top 82%",once:true}});
    });

    // Data animation uses only values already printed in the interface (01–04), never invented business KPIs.
    gsap.utils.toArray(".value-icon, .journey-line article>b").forEach(function(el){
      var raw=(el.textContent||"").trim(), target=parseInt(raw,10);
      if(!/^\d{2}$/.test(raw)||!target)return;
      var state={v:0};
      gsap.to(state,{v:target,duration:MOTION.slow,ease:MOTION.ui,scrollTrigger:{trigger:el,start:"top 86%",once:true},onUpdate:function(){el.textContent=String(Math.round(state.v)).padStart(2,"0");}});
    });

    // Physical cards: pointer tilt only on real fine pointers; touch and keyboard remain unaffected.
    // .model/.highlight-card/.category-card ya reciben su tilt en el listener delegado
    // de gsap-max-motion-runtime; acá queda solo .contact-plus-card, que no está cubierta ahí.
    if(window.matchMedia&&window.matchMedia("(hover: hover) and (pointer: fine)").matches){
      gsap.utils.toArray(".contact-plus-card").forEach(function(card){
        var rx=gsap.quickTo(card,"rotationX",{duration:.35,ease:ease});
        var ry=gsap.quickTo(card,"rotationY",{duration:.35,ease:ease});
        var rect=null;
        var enter=function(){rect=card.getBoundingClientRect();};
        var move=function(e){if(!rect)return;var px=(e.clientX-rect.left)/rect.width-.5,py=(e.clientY-rect.top)/rect.height-.5;rx(py*-3.2);ry(px*3.2);};
        var leave=function(){rect=null;rx(0);ry(0);};
        card.addEventListener("pointerenter",enter,{passive:true});card.addEventListener("pointermove",move,{passive:true});card.addEventListener("pointerleave",leave,{passive:true});
        cleanup.push(function(){card.removeEventListener("pointerenter",enter);card.removeEventListener("pointermove",move);card.removeEventListener("pointerleave",leave);});
      });
    }

    // Magnetic action system: stronger on desktop, subtle on tablet, disabled on mobile.
    // Corrección de auditoría: estos mismos botones (.hero/.cta-banner/.detail-actions
    // .btn.primary) ya reciben un lift discreto en "y" desde gsap-max-motion-runtime
    // (pointerenter/leave, con overwrite:true). Ese sistema y este magnetismo competían
    // por la misma propiedad "y" en cada pointermove, produciendo un micro-temblor
    // vertical en vez de un movimiento limpio. Se deja el magnetismo solo en "x": el
    // lift vertical queda como única fuente de verdad para "y" en estos botones.
    mm.add("(min-width: 561px)",function(){
      gsap.utils.toArray(".hero .btn.primary,.cta-banner .btn.primary,.detail-actions .btn.primary").forEach(function(button){
        var x=gsap.quickTo(button,"x",{duration:.3,ease:ease});
        var rect=null;
        var enter=function(){rect=button.getBoundingClientRect();};
        var move=function(e){if(!rect)return;var dx=e.clientX-(rect.left+rect.width/2);x(dx*.055);};
        var leave=function(){rect=null;x(0);};
        button.addEventListener("pointerenter",enter,{passive:true});button.addEventListener("pointermove",move,{passive:true});button.addEventListener("pointerleave",leave,{passive:true});
        cleanup.push(function(){button.removeEventListener("pointerenter",enter);button.removeEventListener("pointermove",move);button.removeEventListener("pointerleave",leave);});
      });
    });

    // Navigation and mobile drawer choreography, driven by the existing class state.
    var mobilePanel=document.getElementById("mobilepanel"),burger=document.getElementById("burger");
    if(mobilePanel&&burger){
      var observer=new MutationObserver(function(){
        if(!mobilePanel.classList.contains("open"))return;
        gsap.fromTo(mobilePanel.querySelectorAll("a"),{opacity:0,x:18},{opacity:1,x:0,duration:.32,stagger:.035,ease:ease,overwrite:true});
      });
      observer.observe(mobilePanel,{attributes:true,attributeFilter:["class"]});
      cleanup.push(function(){observer.disconnect();});
    }

    // Scroll spy gives the header a sense of place without changing navigation semantics.
    var navTargets=gsap.utils.toArray("#gama,#destacados,#como-comprar,#servicios,#contacto");
    navTargets.forEach(function(target){
      var id=target.id, link=document.querySelector('.site-header a[href="#'+id+'"]');
      if(!link)return;
      // Muchos de estos enlaces viven dentro de un dropdown mega-panel cerrado: marcarlos
      // a ellos solos no se ve nunca. Se marca también el disparador visible (el <summary>)
      // para que la navegación sí comunique en qué sección está el usuario.
      var trigger=link.closest("details.navmega");
      var summary=trigger?trigger.querySelector("summary"):null;
      ScrollTrigger.create({trigger:target,start:"top 45%",end:"bottom 45%",onToggle:function(self){link.classList.toggle("is-motion-active",self.isActive);if(summary)summary.classList.toggle("is-motion-active",self.isActive);}});
    });

    // Final impression: the footer arrives as one composed object, then its channels settle.
    var footer=document.querySelector("footer");
    if(footer){
      var footerBits=footer.querySelectorAll("h4, p, a, .footer-note, .fgrid > *");
      gsap.set(footer,{opacity:0,y:MOTION.distance*.65});
      gsap.set(footerBits,{opacity:0,y:MOTION.distance*.35});
      gsap.to(footer,{opacity:1,y:0,duration:MOTION.slow,ease:ease,scrollTrigger:{trigger:footer,start:"top 88%",once:true}});
      gsap.to(footerBits,{opacity:1,y:0,duration:MOTION.base,stagger:{each:MOTION.stagger,from:"start"},delay:MOTION.footerDelay,ease:ease,scrollTrigger:{trigger:footer,start:"top 86%",once:true}});
    }

    // ScrollTrigger already refreshes on its native load/resize events.
    // Do not add a second global refresh pass to the Lenis frame pipeline.
  },document.body);
  window.__destroyToyotaGalacticMotion=function(){cleanup.forEach(function(fn){try{fn();}catch(e){}});mm.revert();ctx.revert();};
  window.addEventListener("pagehide",window.__destroyToyotaGalacticMotion,{once:true});
  })();

  (function(){
  "use strict";
  var stage=document.querySelector(".hero-editorial-stage");
  if(!stage||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var fine=window.matchMedia("(hover: hover) and (pointer: fine)");
  if(fine.matches)return;
  var primary=stage.querySelector(".hero-editorial-vehicle:not(.hero-editorial-secondary)"),secondary=stage.querySelector(".hero-editorial-secondary"),wordmark=stage.querySelector(".hero-editorial-wordmark"),ticking=false;
  function update(){ticking=false;var rect=stage.getBoundingClientRect(),progress=Math.max(-1,Math.min(1,(window.innerHeight*.5-(rect.top+rect.height*.5))/Math.max(window.innerHeight,rect.height)));if(primary)primary.style.transform="translate3d(0,"+(progress*-5).toFixed(2)+"px,0)";if(secondary)secondary.style.transform="translate3d(0,"+(progress*3).toFixed(2)+"px,0)";if(wordmark)wordmark.style.transform="translate3d(0,"+(progress*-2).toFixed(2)+"px,0)";}
  function request(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
  var lenis=window.__toyotaLenis,resizeHandler=request,usingLenis=!!(lenis&&lenis.on);
  if(usingLenis){lenis.on("scroll",update);}else{window.addEventListener("scroll",request,{passive:true});}
  window.addEventListener("resize",resizeHandler,{passive:true});request();
  window.addEventListener("pagehide",function(){
    if(usingLenis){lenis.off("scroll",update);}else{window.removeEventListener("scroll",request);}
    window.removeEventListener("resize",resizeHandler);
  },{once:true});
  })();
});
