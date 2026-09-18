(function(){
  'use strict';
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gs=window.gsap;
  var st=window.ScrollTrigger;
  document.documentElement.classList.add('pm-motion-layer');
  document.body.classList.add('pm-ready');
  if(!gs){document.querySelectorAll('.pm-reveal').forEach(function(el){el.classList.add('pm-inview');});return;}
  if(st&&window.gsap.registerPlugin) window.gsap.registerPlugin(st);
  var ease='power3.out', fast='power2.out';
  function q(s,c){return (c||document).querySelector(s)}
  function qa(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
  function animateIn(el){if(!el||el.dataset.pmAnimated==='1')return;el.dataset.pmAnimated='1';if(reduce){gs.set(el,{clearProps:'all'});return}gs.to(el,{opacity:1,x:0,y:0,scale:1,duration:.78,ease:ease,overwrite:'auto'});}
  function reveal(){
    qa('section,footer').forEach(function(sec){
      var head=qa('.section-head > *, .section-title, .section-kicker, .tag',sec).slice(0,3);
      var cards=qa('.model,.highlight-card,.service-card,.contact-card,.reason-card,.used-card,.access-card,.facility-card,.review-card,.process-step,.faq-item',sec);
      var targets=head.concat(cards.slice(0,12));
      targets.forEach(function(el,i){if(el.classList.contains('pm-reveal'))return;el.classList.add('pm-reveal');if(i%4===1)el.classList.add('pm-reveal-left');if(i%4===2)el.classList.add('pm-reveal-scale');});
      if(sec.id){var line=document.createElement('span');line.className='pm-section-line';line.setAttribute('aria-hidden','true');line.style.display='block';line.style.height='1px';line.style.background='linear-gradient(90deg,rgba(227,24,43,.8),transparent)';line.style.margin='0 0 20px';var anchor=q('.section-head',sec);if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(line,anchor);}
    });
    if(reduce){qa('.pm-reveal').forEach(animateIn);return}
    if(st){qa('.pm-reveal').forEach(function(el){st.create({trigger:el,start:'top 88%',once:true,onEnter:function(){animateIn(el)}})});qa('.pm-section-line').forEach(function(el){st.create({trigger:el,start:'top 88%',once:true,onEnter:function(){gs.to(el,{scaleX:1,duration:1.05,ease:ease})}})});}
    else qa('.pm-reveal').forEach(animateIn);
  }
  function hero(){
    var hero=q('#hero')||q('.hero')||q('main section');if(!hero)return;
    var title=q('h1',hero), photo=q('.hero-photo, .hero-showcase img, .hero-media img',hero), ctas=qa('.btn',hero);
    var tl=gs.timeline({defaults:{ease:ease}});
    if(reduce){tl.set([title,photo,ctas],{clearProps:'all'});return}
    if(title){var words=title.querySelectorAll('.word,.line,span');if(words.length)tl.from(words,{yPercent:105,opacity:0,stagger:.045,duration:.72,clipPath:'inset(0 0 100% 0)'},.1);else tl.from(title,{y:42,opacity:0,duration:.8},.1)}
    if(photo)tl.fromTo(photo,{scale:1.11,x:18,opacity:0},{scale:1,x:0,opacity:1,duration:1.25},.18);
    if(ctas.length)tl.from(ctas,{y:16,opacity:0,stagger:.08,duration:.5},.55);
    if(st&&photo)gs.to(photo,{yPercent:-7,scale:1.045,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1.1}});
    if(st)gs.to(hero,{opacity:.92,scrollTrigger:{trigger:hero,start:'65% top',end:'bottom top',scrub:1}});
  }
  function header(){
    var h=q('.site,.site-header')||q('#site-header');if(!h)return;
    function state(){h.classList.toggle('pm-scrolled',window.scrollY>28)}
    state();window.addEventListener('scroll',state,{passive:true});
    var burger=q('#burger'),panel=q('#mobilepanel');
    qa('a[href^="#"]',h).forEach(function(a){a.addEventListener('click',function(){if(panel&&burger&&burger.getAttribute('aria-expanded')==='true')setTimeout(function(){burger.click()},30)})});
    if(st){qa('main section[id]').forEach(function(sec){st.create({trigger:sec,start:'top 42%',end:'bottom 42%',onEnter:function(){mark(sec.id)},onEnterBack:function(){mark(sec.id)}})});}
    function mark(id){qa('a[href^="#"]',h).forEach(function(a){a.classList.toggle('pm-active',a.getAttribute('href')==='#'+id)})}
  }
  function cards(){
    qa('.model,.highlight-card,.service-card,.contact-card,.reason-card,.used-card,.access-card,.facility-card,.review-card,.process-step').forEach(function(card){
      card.addEventListener('pointerenter',function(){if(reduce)return;gs.to(card,{y:-5,duration:.35,ease:fast,overwrite:'auto'})});
      card.addEventListener('pointerleave',function(){if(reduce)return;gs.to(card,{y:0,duration:.55,ease:ease,overwrite:'auto'})});
    });
    var filter=q('#filterbar');if(filter)filter.addEventListener('click',function(){var self=this;self.classList.add('pm-filtering');requestAnimationFrame(function(){var visible=qa('.model:not([hidden])');if(!reduce)gs.fromTo(visible,{opacity:0,y:12,scale:.985},{opacity:1,y:0,scale:1,stagger:.045,duration:.45,ease:ease,overwrite:'auto'});setTimeout(function(){self.classList.remove('pm-filtering')},500)})});
    document.addEventListener('click',function(e){var b=e.target.closest('.compare-btn');if(b){qa('.model').forEach(function(c){c.classList.toggle('pm-selected',c.dataset.model===b.dataset.compareModel)});}});
  }
  function modal(){
    var modal=q('#modelDetail');if(!modal)return;
    var observer=new MutationObserver(function(){if(modal.classList.contains('open')){var panel=q('.detail-panel,.detail-modal,.modal-content',modal)||modal;gs.fromTo(panel,{opacity:0,y:26,scale:.97},{opacity:1,y:0,scale:1,duration:.55,ease:ease,overwrite:'auto'});gs.fromTo(qa('.detail-spec,.gallery-link',modal),{opacity:0,y:10},{opacity:1,y:0,stagger:.055,duration:.4,ease:ease,delay:.18,overwrite:'auto'});} });
    observer.observe(modal,{attributes:true,attributeFilter:['class']});
  }
  function simulator(){
    var result=q('#cuotaResultado')||q('.simulator-result,.financing-result');if(!result)return;
    var wrap=result.parentNode;wrap.addEventListener('input',function(e){if(!/Range|SELECT/.test(e.target.tagName))return;result.classList.remove('pm-pulse');void result.offsetWidth;result.classList.add('pm-pulse');setTimeout(function(){result.classList.remove('pm-pulse')},330)});
    if(st&&!reduce)st.create({trigger:result,start:'top 90%',once:true,onEnter:function(){gs.from(result,{y:16,opacity:0,duration:.65,ease:ease})}});
  }
  function forms(){
    qa('form').forEach(function(form){form.addEventListener('submit',function(){var btn=q('button[type="submit"]',form);if(btn&&!reduce){gs.fromTo(btn,{scale:1},{scale:.97,duration:.1,yoyo:true,repeat:1,ease:fast});}});});
    qa('a[href*="wa.me"],a[href*="google.com/maps"],a[href^="mailto:"],a[href^="tel:"]').forEach(function(a){a.addEventListener('pointerdown',function(){if(!reduce)gs.fromTo(a,{scale:1},{scale:.96,duration:.1,yoyo:true,repeat:1,ease:fast})})});
  }
  function artDirection(){
    var hero=q('.hero');
    if(hero)hero.classList.add('pm-scene-transition');
    qa('#gama,#comparar,#canje,#financiacion,#mantenimiento,#servicios,#concesionario,#testimonios,#faq,#contacto').forEach(function(sec,i){
      sec.classList.add('pm-editorial-band');
      if(i%3===1)sec.classList.add('pm-scene-transition');
    });
    var compare=q('#compareResult'), a=q('#compareA'), b=q('#compareB');
    function refreshCompare(){
      if(!compare||reduce)return;
      compare.classList.remove('pm-refresh');
      void compare.offsetWidth;
      compare.classList.add('pm-refresh');
      setTimeout(function(){compare.classList.remove('pm-refresh')},620);
    }
    if(a)a.addEventListener('change',refreshCompare);
    if(b)b.addEventListener('change',refreshCompare);
    qa('.copy-address,.map-cta,#copyAddressBtn,#shareBtn').forEach(function(el){el.addEventListener('pointerdown',function(){if(!reduce)gs.fromTo(el,{y:0},{y:-2,duration:.12,yoyo:true,repeat:1,ease:fast})})});
    qa('.faq-item').forEach(function(item){var button=q('.faq-q',item);if(button)button.addEventListener('click',function(){item.classList.add('pm-opening');setTimeout(function(){item.classList.remove('pm-opening')},500)})});
  }
  function sync(){
    if(window.__toyotaDemoHealth)window.__toyotaDemoHealth.premiumMotion=true;
    window.__toyotaPremiumMotion={version:'1.0',reducedMotion:reduce,gsap:!!gs,scrollTrigger:!!st};
  }
  reveal();hero();header();cards();modal();simulator();forms();artDirection();sync();
  if(window.ScrollTrigger)window.ScrollTrigger.refresh();
})();

/* Premium dealership value section motion */
(function(){
  "use strict";
  function initDealerValueMotion(){
    var section=document.querySelector(".dealer-value-section");
    if(!section||!window.gsap||!window.ScrollTrigger)return;
    gsap.registerPlugin(ScrollTrigger);
    var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var heading=section.querySelector(".dealer-value-heading");
    var positioning=section.querySelector(".dealer-value-positioning");
    var cards=section.querySelectorAll(".dealer-value-card");
    var footer=section.querySelector(".dealer-value-footer");
    if(reduce){section.classList.add("dealer-value-motion-ready");return;}
    var ctx=gsap.context(function(){
      gsap.fromTo(heading,{opacity:0,clipPath:"inset(0 0 100% 0)"},{opacity:1,clipPath:"inset(0 0 0% 0)",duration:.72,ease:"power3.out",scrollTrigger:{trigger:section,start:"top 78%",once:true}});
      gsap.fromTo(positioning,{opacity:0,x:18},{opacity:1,x:0,duration:.62,ease:"power2.out",scrollTrigger:{trigger:section,start:"top 70%",once:true}});
      gsap.fromTo(cards,{clipPath:"inset(0 0 100% 0)",y:10},{clipPath:"inset(0 0 0% 0)",y:0,duration:.72,stagger:.09,ease:"power3.out",scrollTrigger:{trigger:cards[0],start:"top 84%",once:true}});
      gsap.fromTo(footer,{opacity:0,y:8},{opacity:1,y:0,duration:.5,ease:"power2.out",scrollTrigger:{trigger:footer,start:"top 92%",once:true}});
    },section);
    window.addEventListener("pagehide",function(){ctx.revert();},{once:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initDealerValueMotion,{once:true});else initDealerValueMotion();
})();


/* Editorial hero direction: one restrained camera move, tied to scroll and reduced-motion safe. */
(function(){
  if(!window.gsap || !window.ScrollTrigger) return;
  var hero=document.querySelector('.hero-editorial');
  var img=document.querySelector('.hero-editorial-vehicle img');
  if(!hero||!img||window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  gsap.fromTo(img,{scale:1.04,yPercent:-1},{scale:1.11,yPercent:4,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.8}});
  gsap.fromTo('.hero-editorial-copy',{y:8,opacity:.92},{y:-16,opacity:.72,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.8}});
  gsap.fromTo('.hero-editorial-wordmark',{x:0},{x:-24,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:.8}});
})();