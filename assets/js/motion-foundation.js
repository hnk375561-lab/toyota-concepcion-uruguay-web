document.addEventListener("DOMContentLoaded", function(){
  (function(){
  "use strict";
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarsePointer=window.matchMedia&&window.matchMedia("(pointer: coarse)").matches;
  var mobileViewport=window.matchMedia&&window.matchMedia("(max-width:760px)").matches;
  var MOTION=window.__toyotaMotionTokens=window.__toyotaMotionTokens||{entrance:"power3.out",ui:"power2.out",exit:"power2.in",micro:mobileViewport ? .12 : .14,base:mobileViewport ? .28 : .32,slow:mobileViewport ? .58 : .72,hero:mobileViewport ? .9 : 1.1,stagger:mobileViewport ? .045 : .072,distance:mobileViewport ? 16 : 24,scrollDuration:mobileViewport ? .62 : .72,lerp:mobileViewport ? .12 : .18,wheelMultiplier:mobileViewport ? .9 : .96,velocityMax:mobileViewport ? 2.5 : 4,velocityShift:mobileViewport ? 1.5 : 3,footerDelay:mobileViewport ? .08 : .14};
  // Touch devices keep native scrolling: it is lower-latency and avoids an unnecessary ticker.
  if(window.__toyotaLenis || coarsePointer || !window.Lenis || !window.gsap || !window.ScrollTrigger){
    if(reduce) window.__toyotaLenis=null;
  } else if(!reduce){
    var lenis=new Lenis({
      // One interpolation model only: lerp avoids competing duration/easing paths.
      // Higher lerp reduces perceived drag without adding a second smoothing layer.
      lerp:MOTION.lerp,
      smoothWheel:true,
      wheelMultiplier:MOTION.wheelMultiplier,
      syncTouch:false,
      anchors:true,
      allowNestedScroll:false,
      autoRaf:false
    });
    var lenisRaf=function(time){lenis.raf(time*1000)};
    var heroVelocityImage=document.querySelector(".hero-art img, .hero-editorial-stage img");
    var heroVelocityY=heroVelocityImage?gsap.quickTo(heroVelocityImage,"y",{duration:MOTION.base,ease:MOTION.entrance}):null;
    var heroVelocityScale=heroVelocityImage?gsap.quickTo(heroVelocityImage,"scale",{duration:MOTION.base,ease:MOTION.entrance}):null;
    var onLenisVelocity=function(event){
      if(!heroVelocityImage||!event)return;
      var velocity=Math.max(-MOTION.velocityMax,Math.min(MOTION.velocityMax,event.velocity||0));
      var magnitude=Math.min(MOTION.velocityMax,Math.abs(velocity));
      if(heroVelocityY)heroVelocityY(-velocity*MOTION.velocityShift);
      if(heroVelocityScale)heroVelocityScale(1+magnitude*.0012);
    };
    window.__toyotaLenis=lenis;
    if(window.__toyotaHeaderScrollFallback)window.removeEventListener("scroll",window.__toyotaHeaderScrollFallback);
    var headerSync=function(event){if(window.__toyotaSyncHeader)window.__toyotaSyncHeader(event&&typeof event.scroll==="number"?event.scroll:lenis.scroll);};
    lenis.on("scroll",headerSync);
    lenis.on("scroll",ScrollTrigger.update);
    lenis.on("scroll",onLenisVelocity);
    gsap.ticker.add(lenisRaf);
    gsap.ticker.lagSmoothing(0);
    window.__toyotaScrollToElement=function(target,options){
      if(!target)return;
      options=options||{};
      lenis.scrollTo(target,{offset:options.offset||0,duration:options.duration||MOTION.scrollDuration,immediate:false});
    };
    window.__destroyToyotaLenis=function(){
      gsap.ticker.remove(lenisRaf);
      lenis.off("scroll",headerSync);
      lenis.off("scroll",ScrollTrigger.update);
      lenis.off("scroll",onLenisVelocity);
      lenis.destroy();
      window.__toyotaLenis=null;
    };
  } else {
    window.__toyotaLenis=null;
  }
  if(!window.gsap||reduce)return;
  var primary=document.querySelector(".editorial-cta");
  if(primary){var label=primary.querySelector("span"),primaryRect=null,movePrimary=gsap.quickTo(primary,"x",{duration:.28,ease:"power3.out"}),movePrimaryY=gsap.quickTo(primary,"y",{duration:.28,ease:"power3.out"}),moveLabel=label?gsap.quickTo(label,"x",{duration:.28,ease:"power3.out"}):null,moveLabelY=label?gsap.quickTo(label,"y",{duration:.28,ease:"power3.out"}):null;primary.addEventListener("pointerenter",function(){primaryRect=primary.getBoundingClientRect();},{passive:true});primary.addEventListener("pointermove",function(e){if(!primaryRect)return;var x=(e.clientX-primaryRect.left-primaryRect.width/2)*.08,y=(e.clientY-primaryRect.top-primaryRect.height/2)*.08;movePrimary(x);movePrimaryY(y);if(moveLabel){moveLabel(x*.25);moveLabelY(y*.25);}} ,{passive:true});primary.addEventListener("pointerleave",function(){primaryRect=null;gsap.to([primary,label].filter(Boolean),{x:0,y:0,duration:.55,ease:"elastic.out(1,.55)",overwrite:true});},{passive:true});}
  document.querySelectorAll(".review-stars span").forEach(function(star,i){gsap.to(star,{opacity:1,scale:1,duration:.28,delay:i*.07,scrollTrigger:{trigger:star.parentElement,start:"top 88%",once:true}})});
  document.querySelectorAll(".faq-item").forEach(function(item){var answer=item.querySelector(".faq-answer");if(answer){answer.style.overflow="hidden";answer.dataset.motionReady="1";}});
  })();
  (function(){
  "use strict";
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var splitInstances=[];
  if(window.gsap){
    if(window.CustomEase){gsap.registerPlugin(CustomEase);CustomEase.create("toyotaEase","M0,0 C0.16,0.8 0.28,1 1,1");}
    if(window.Flip)gsap.registerPlugin(Flip);
    var ease=window.CustomEase?"toyotaEase":"power2.out";
    if(window.ScrollTrigger){
      var heads=document.querySelectorAll(".section-head h2");
      // Estos headings ya reciben su SplitText (versión con rotateX) en gsap-max-motion-runtime;
      // evitamos correr SplitText dos veces sobre el mismo nodo.
      var richSplitSelector="#gama .section-head h2, #destacados .section-head h2, #canje h2, #financiacion h2, #mantenimiento h2, #taller h2, #faq h2, #concesionario h2";
      if(window.SplitText&&!reduce){heads.forEach(function(head){if(head.closest(".hero"))return;if(head.matches(richSplitSelector))return;var split=SplitText.create(head,{type:"words",aria:"auto"});splitInstances.push(split);gsap.set(split.words,{opacity:0,y:20});gsap.to(split.words,{opacity:1,y:0,stagger:.035,duration:.5,ease:ease,scrollTrigger:{trigger:head,start:"top 84%",once:true}});});}
    }
  }
  window.__destroyToyotaSignatureMotion=function(){splitInstances.forEach(function(split){try{split.revert();}catch(e){}});};
  window.addEventListener("pagehide",window.__destroyToyotaSignatureMotion,{once:true});
  document.addEventListener("click",function(e){var compare=e.target.closest("[data-compare-model]");if(compare){var name=compare.getAttribute("data-compare-model"),a=document.getElementById("compareA"),b=document.getElementById("compareB");if(a&&b){if(!a.value||a.value===name)a.value=name;else b.value=name;a.dispatchEvent(new Event("change"));window.__toyotaScrollToElement(document.getElementById("comparar"),{block:"start"});}}});
  var mobileBar=document.querySelector(".mobilebar"),hero=document.querySelector(".hero");
  function scrollTopSmooth(){if(window.__toyotaLenis)window.__toyotaLenis.scrollTo(0,{duration:.8});else window.scrollTo({top:0,behavior:"smooth"});}
  if(mobileBar&&hero){if(window.ScrollTrigger&&!reduce){ScrollTrigger.create({trigger:hero,start:"bottom top",onEnter:function(){mobileBar.classList.add("is-visible")},onLeaveBack:function(){mobileBar.classList.remove("is-visible")}});}else if(reduce){window.addEventListener("scroll",function(){mobileBar.classList.toggle("is-visible",window.scrollY>hero.offsetHeight);},{passive:true});}}
  // Lightweight cursor-follow is intentionally omitted: touch/mobile visitors are the primary audience,
  // and a custom cursor would add visual noise rather than improve the dealership decision path.
  })();
});
