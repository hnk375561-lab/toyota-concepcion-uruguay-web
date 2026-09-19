document.addEventListener("DOMContentLoaded", function(){
  "use strict";
  var gamaGrid = document.getElementById("gama-grid");
  var filterBar = document.getElementById("filterbar");
  if(!gamaGrid || !filterBar) return;

  var STORAGE_KEY = "toyota-favoritos";

  function readFavorites(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    }catch(e){ return []; }
  }
  function writeFavorites(list){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }catch(e){ /* localStorage no disponible: la función sigue andando en memoria */ }
  }

  var favorites = readFavorites();

  function isFavorite(name){ return favorites.indexOf(name) !== -1; }
  function toggleFavorite(name){
    var idx = favorites.indexOf(name);
    if(idx === -1) favorites.push(name); else favorites.splice(idx, 1);
    writeFavorites(favorites);
    updateCounter();
    return isFavorite(name);
  }

  // ---- botón de favorito en cada card ----
  var cards = gamaGrid.querySelectorAll(".model[data-model]");
  cards.forEach(function(card){
    var name = card.getAttribute("data-model");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "favorite-toggle";
    btn.setAttribute("aria-pressed", isFavorite(name) ? "true" : "false");
    btn.setAttribute("aria-label", "Guardar " + name + " en favoritos");
    btn.innerHTML = "<span aria-hidden=\"true\">" + (isFavorite(name) ? "★" : "☆") + "</span>";
    if(isFavorite(name)) btn.classList.add("is-favorite");
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      var nowFav = toggleFavorite(name);
      btn.classList.toggle("is-favorite", nowFav);
      btn.setAttribute("aria-pressed", nowFav ? "true" : "false");
      btn.querySelector("span").textContent = nowFav ? "★" : "☆";
      btn.setAttribute("aria-label", (nowFav ? "Quitar " : "Guardar ") + name + (nowFav ? " de favoritos" : " en favoritos"));
      if(favoritesOnly && !nowFav){ card.hidden = true; }
    });
    card.appendChild(btn);
  });

  // ---- botón "Favoritos" en la barra de filtros existente ----
  var favBtn = document.createElement("button");
  favBtn.className = "filterbtn favorite-filter";
  favBtn.type = "button";
  favBtn.setAttribute("data-filter", "favoritos");
  favBtn.setAttribute("aria-pressed", "false");
  favBtn.innerHTML = "★ Favoritos <span class=\"favorite-count\">(" + favorites.length + ")</span>";
  filterBar.appendChild(favBtn);

  var favoritesOnly = false;
  function updateCounter(){
    var countEl = favBtn.querySelector(".favorite-count");
    if(countEl) countEl.textContent = "(" + favorites.length + ")";
  }

  favBtn.addEventListener("click", function(){
    favoritesOnly = !favoritesOnly;
    favBtn.classList.toggle("active", favoritesOnly);
    favBtn.setAttribute("aria-pressed", favoritesOnly ? "true" : "false");
    if(favoritesOnly){
      filterBar.querySelectorAll(".filterbtn[data-filter]:not(.favorite-filter)").forEach(function(b){ b.classList.remove("active"); b.setAttribute("aria-pressed","false"); });
      gamaGrid.querySelectorAll(".model[data-model]").forEach(function(card){
        card.hidden = !isFavorite(card.getAttribute("data-model"));
      });
    } else {
      var todosBtn = filterBar.querySelector('.filterbtn[data-filter="todos"]');
      if(todosBtn) todosBtn.click();
      else gamaGrid.querySelectorAll(".model[data-model]").forEach(function(card){ card.hidden = false; });
    }
  });

  // Si el usuario usa un filtro normal (pickup/suv/sedan/todos), salimos del modo favoritos.
  filterBar.querySelectorAll(".filterbtn[data-filter]:not(.favorite-filter)").forEach(function(b){
    b.addEventListener("click", function(){
      if(favoritesOnly){
        favoritesOnly = false;
        favBtn.classList.remove("active");
        favBtn.setAttribute("aria-pressed", "false");
      }
    });
  });
});
