(function(){
  var promise;
  window.__loadToyotaFlip=function(){
    if(window.Flip)return Promise.resolve(window.Flip);
    if(promise)return promise;
    promise=new Promise(function(resolve,reject){
      var tag=document.createElement("script");
      tag.src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.0/Flip.min.js";
      tag.async=true;
      tag.onload=function(){resolve(window.Flip);};
      tag.onerror=reject;
      document.head.appendChild(tag);
    });
    return promise;
  };
})();
