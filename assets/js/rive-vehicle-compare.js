(function(){
  "use strict";
  var stage=document.querySelector("[data-rive-vehicle-card]");
  var canvas=document.getElementById("riveVehicleCanvas");
  if(!stage||!canvas||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  var asset="https://cdn.rive.app/animations/vehicles.riv";
  var runtime="https://unpkg.com/@rive-app/canvas@2.40.1";
  var instance=null,started=false,scriptPromise=null;
  var compareA=document.getElementById("compareA");
  var compareB=document.getElementById("compareB");
  var compareResult=document.getElementById("compareResult");
  var label=stage.querySelector(".rive-vehicle-caption-label");
  var meta=stage.querySelector(".rive-vehicle-caption-meta");
  function fail(){stage.classList.add("is-failed");}
  function syncContext(){
    var hasA=!!(compareA&&compareA.value),hasB=!!(compareB&&compareB.value);
    var nameA=hasA&&compareA.selectedOptions[0]?compareA.selectedOptions[0].textContent.trim():"";
    var nameB=hasB&&compareB.selectedOptions[0]?compareB.selectedOptions[0].textContent.trim():"";
    stage.classList.remove("is-selecting-a","is-selecting-b","is-complete");
    if(hasA&&hasB){
      stage.classList.add("is-complete");
      if(label)label.textContent=nameA+" × "+nameB;
      if(meta)meta.textContent="vista 3D · lado a lado";
    }else if(hasA){
      stage.classList.add("is-selecting-b");
      if(label)label.textContent=nameA;
      if(meta)meta.textContent="vista 3D · elegí el segundo";
    }else{
      stage.classList.add("is-selecting-a");
      if(label)label.textContent="Elegí un modelo";
      if(meta)meta.textContent="vista 3D · paso 01/02";
    }
  }
  [compareA,compareB].forEach(function(select){if(select)select.addEventListener("change",syncContext);});
  if(compareResult){
    new MutationObserver(syncContext).observe(compareResult,{attributes:true,attributeFilter:["hidden"]});
  }
  syncContext();
  function loadRuntime(){
    if(window.rive)return Promise.resolve(window.rive);
    if(scriptPromise)return scriptPromise;
    scriptPromise=new Promise(function(resolve,reject){
      var tag=document.createElement("script");
      tag.src=runtime;tag.async=true;tag.crossOrigin="anonymous";
      tag.onload=function(){window.rive?resolve(window.rive):reject(new Error("Rive runtime unavailable"));};
      tag.onerror=reject;document.head.appendChild(tag);
    });
    return scriptPromise;
  }
  function bindPointer(){
    if(!instance)return;
    ["pointermove","pointerdown","pointerup"].forEach(function(type){
      canvas.addEventListener(type,function(event){
        if(!instance)return;
        try{instance[type](event);}catch(error){/* Runtime versions without pointer helpers stay graceful. */}
      },{passive:true});
    });
  }
  var visibilityObserver=null;
  function syncPlayback(isVisible){
    if(!instance)return;
    try{
      if(isVisible && !document.hidden){instance.play();}
      else if(instance.pause){instance.pause();}
    }catch(error){/* Older Rive runtimes may not expose playback controls. */}
  }
  function start(){
    if(started)return;started=true;
    loadRuntime().then(function(rive){
      var ready=function(){
        if(!instance||stage.classList.contains("is-ready"))return;
        instance.resizeDrawingSurfaceToCanvas();
        stage.classList.add("is-ready");
        bindPointer();
        syncPlayback(true);
        window.addEventListener("resize",function(){if(instance)instance.resizeDrawingSurfaceToCanvas();},{passive:true});
        if("IntersectionObserver" in window){
          visibilityObserver=new IntersectionObserver(function(entries){
            if(entries[0])syncPlayback(entries[0].isIntersecting);
          },{rootMargin:"0px"});
          visibilityObserver.observe(stage);
        }
        document.addEventListener("visibilitychange",function(){syncPlayback(!document.hidden && !!instance);},{passive:true});
      };
      instance=new rive.Rive({
        src:asset,canvas:canvas,autoplay:false,autoBind:false,
        onLoad:ready,
        onLoadError:fail
      });
      if(rive.EventType&&instance.on){
        instance.on(rive.EventType.Load,ready);
        instance.on(rive.EventType.LoadError,fail);
      }
    }).catch(fail);
  }
  if("IntersectionObserver" in window){
    var observer=new IntersectionObserver(function(entries){
      if(entries.some(function(entry){return entry.isIntersecting;})){observer.disconnect();start();}
    },{rootMargin:"80px 0px"});
    observer.observe(stage);
  }else{start();}
  window.addEventListener("pagehide",function(){if(instance&&instance.cleanup)instance.cleanup();},{once:true});
  window.__toyotaRive={start:start,getInstance:function(){return instance;},asset:asset};
})();
