document.addEventListener("DOMContentLoaded", function(){
  "use strict";
  var form = document.getElementById("usedInterestForm");
  var emptyState = document.getElementById("usedEmpty");
  if(!form || !emptyState) return;

  var STORAGE_KEY = "toyota-used-interest";

  function readSaved(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }
  function writeSaved(data){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }catch(e){ /* sigue funcionando sin persistencia */ }
  }
  function clearSaved(){
    try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}
  }
  function formatDate(iso){
    try{
      var d = new Date(iso);
      return d.toLocaleDateString("es-AR", {day:"numeric", month:"long", year:"numeric"});
    }catch(e){ return ""; }
  }

  var banner = null;
  function renderBanner(data){
    if(!banner){
      banner = document.createElement("div");
      banner.className = "used-interest-saved";
      banner.setAttribute("role", "status");
      emptyState.insertBefore(banner, form);
    }
    banner.innerHTML =
      "<strong>Ya nos avisaste que buscás: " + data.wanted + ".</strong>" +
      "<span>Consulta enviada el " + formatDate(data.date) + ". Te contactamos apenas haya stock, o escribinos de nuevo cuando quieras.</span>" +
      '<button type="button" class="btn ghost used-interest-reset">Buscar otra cosa</button>';
    banner.querySelector(".used-interest-reset").addEventListener("click", function(){
      clearSaved();
      banner.remove();
      banner = null;
      form.hidden = false;
    });
    form.hidden = true;
  }

  var saved = readSaved();
  if(saved && saved.wanted) renderBanner(saved);

  // No reemplaza el envío por WhatsApp existente: solo además, recuerda la consulta.
  form.addEventListener("submit", function(){
    var select = document.getElementById("usedInterest");
    if(!select) return;
    var data = {wanted: select.value, date: new Date().toISOString()};
    writeSaved(data);
    setTimeout(function(){ renderBanner(data); }, 600);
  });
});
