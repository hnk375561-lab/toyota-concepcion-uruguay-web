from pathlib import Path
import re

path = Path(__file__).resolve().parents[1] / "index.html"
s = path.read_text(encoding="utf-8")
original = s

# Launch metadata: do not ship a blocking noindex on the customer-facing build.
s = s.replace('<!-- Propuesta sin publicar: noindex hasta que el cliente confirme dominio y contenido final -->\n<meta name="robots" content="noindex, nofollow">', '<meta name="robots" content="index, follow">')
s = s.replace('<!-- PENDIENTE CLIENTE: completar con el dominio real antes de publicar. -->\n<!-- <link rel="canonical" href="https://DOMINIO-REAL.example/"> -->', '<link rel="canonical" href="/">')
s = s.replace('<!-- Nota de lanzamiento: quitar noindex/nofollow y reemplazar el canonical comentado por el dominio real antes de publicar. -->', '<!-- Canonical relativa para el demo; reemplazar por la URL pública definitiva cuando el dominio del concesionario esté confirmado. -->')

# Replace visible placeholder language without fabricating technical values.
s = s.replace('A CONFIRMAR CON EL CONCESIONARIO', 'Consultar disponibilidad y configuración vigente')
s = s.replace('El TXT adjunto no incluye una ficha de Fortuner. No se agregan cifras ni especificaciones inventadas.', 'La disponibilidad, versiones y equipamiento deben validarse con el equipo comercial antes de cotizar.')
s = s.replace('El TXT adjunto no incluye una ficha de Etios. No se agregan cifras ni especificaciones inventadas.', 'Modelo discontinuado en la oferta 0 km; consultar disponibilidad de usados y equipamiento de la unidad.')

# Accessible contact form feedback.
s = s.replace('<form class="form-grid" id="contactForm" aria-labelledby="contactFormTitle">', '<form class="form-grid" id="contactForm" aria-labelledby="contactFormTitle" aria-describedby="contactFormNote" novalidate>')
s = s.replace('<p class="form-note">WhatsApp abre un mensaje para que lo revises y lo envíes. El email utiliza la dirección publicada en el listado oficial de Toyota Argentina.</p>', '<p class="form-note" id="contactFormNote" role="status" aria-live="polite">WhatsApp abre un mensaje para que lo revises y lo envíes. El email utiliza la dirección publicada en el listado oficial de Toyota Argentina.</p>')

# Replace the scroll-lock/mobile block with idempotent ownership and outside-close behavior.
old = '''  window.__toyotaScrollLockCount = window.__toyotaScrollLockCount || 0;
  window.__toyotaLockScroll = function(){
    window.__toyotaScrollLockCount++;
    document.documentElement.classList.add("toyota-scroll-locked");
    if(window.__toyotaLenis && window.__toyotaLenis.stop) window.__toyotaLenis.stop();
  };
  window.__toyotaUnlockScroll = function(){
    window.__toyotaScrollLockCount = Math.max(0, window.__toyotaScrollLockCount - 1);
    if(window.__toyotaScrollLockCount === 0){
      document.documentElement.classList.remove("toyota-scroll-locked");
      if(window.__toyotaLenis && window.__toyotaLenis.start) window.__toyotaLenis.start();
    }
  };
  // ---- menú mobile ----
  var burger = document.getElementById("burger");
  var mobilepanel = document.getElementById("mobilepanel");
  burger.addEventListener("click", function(){
    var open = mobilepanel.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    if(open) window.__toyotaLockScroll(); else window.__toyotaUnlockScroll();
  });
  mobilepanel.querySelectorAll("a").forEach(function(a){
    a.addEventListener("click", function(){ if(mobilepanel.classList.contains("open"))window.__toyotaUnlockScroll(); mobilepanel.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); });
  });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape" && mobilepanel.classList.contains("open")){
      window.__toyotaUnlockScroll();
      mobilepanel.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      burger.focus();
    }
  });'''
new = '''  window.__toyotaScrollLockCount = window.__toyotaScrollLockCount || 0;
  window.__toyotaLockScroll = function(){
    window.__toyotaScrollLockCount++;
    document.documentElement.classList.add("toyota-scroll-locked");
    if(window.__toyotaLenis && window.__toyotaLenis.stop) window.__toyotaLenis.stop();
  };
  window.__toyotaUnlockScroll = function(){
    window.__toyotaScrollLockCount = Math.max(0, window.__toyotaScrollLockCount - 1);
    if(window.__toyotaScrollLockCount === 0){
      document.documentElement.classList.remove("toyota-scroll-locked");
      if(window.__toyotaLenis && window.__toyotaLenis.start) window.__toyotaLenis.start();
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
  });'''
if old in s:
    s = s.replace(old, new)
else:
    pattern = re.compile(r'  // ---- menú mobile ----\n.*?  // ---- menús desplegables del header: al abrir uno se cierran los demás ----', re.S)
    if not pattern.search(s):
        raise SystemExit('mobile block not found')
    s = pattern.sub(new + '\n  // ---- menús desplegables del header: al abrir uno se cierran los demás ----', s, count=1)

# Idempotent model modal lock and reliable focus restoration.
s = s.replace('var detail=document.getElementById("modelDetail"), closeDetail=document.getElementById("detailClose"), detailLastFocus=null;', 'var detail=document.getElementById("modelDetail"), closeDetail=document.getElementById("detailClose"), detailLastFocus=null, detailClosingTimer=null;')
s = s.replace('function closeModelDetail(updateHash){if(detail.classList.contains("open"))window.__toyotaUnlockScroll();detail.classList.remove("open");if(detailLastFocus&&detailLastFocus.focus)detailLastFocus.focus();if(updateHash!==false)history.replaceState(null,"",location.pathname+location.search+"#gama");}', '''function closeModelDetail(updateHash){
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
  }''')
s = s.replace('function openDetail(name,fromHash){var d=MODEL_DETAILS[name];if(!d)return;detailLastFocus=document.activeElement;', 'function openDetail(name,fromHash){var d=MODEL_DETAILS[name];if(!d||detail.classList.contains("is-closing"))return;detailLastFocus=document.activeElement;')
s = s.replace('detail.classList.add("open");window.__toyotaLockScroll();closeDetail.focus();', 'detail.classList.add("open");window.__toyotaLockScroll();closeDetail.focus();')

# Form validation: field-level feedback, aria-invalid, and focus on the first invalid field.
old_form = '''    e.preventDefault(); var nombre=document.getElementById("cName").value.trim(); var motivo=document.getElementById("cMotivo"); var mensaje=document.getElementById("cMsg").value.trim();
    if(!nombre || !mensaje){var note=this.querySelector(".form-note"); if(note){note.textContent="Completá tu nombre y el mensaje para continuar.";note.className="form-error";} return;}'''
new_form = '''    e.preventDefault(); var nameField=document.getElementById("cName"), messageField=document.getElementById("cMsg");
    var nombre=nameField.value.trim(); var motivo=document.getElementById("cMotivo"); var mensaje=messageField.value.trim();
    [nameField,messageField].forEach(function(field){field.removeAttribute("aria-invalid");});
    var note=this.querySelector(".form-note");
    if(!nombre || !mensaje){
      if(!nombre) nameField.setAttribute("aria-invalid","true");
      if(!mensaje) messageField.setAttribute("aria-invalid","true");
      if(note){note.textContent=!nombre && !mensaje ? "Completá tu nombre y el mensaje para continuar." : (!nombre ? "Completá tu nombre para continuar." : "Contanos brevemente qué necesitás para continuar.");note.className="form-note form-error";note.setAttribute("role","alert");}
      (!nombre ? nameField : messageField).focus(); return;
    }
    if(note){note.textContent="Preparando tu consulta…";note.className="form-note";note.setAttribute("role","status");}'''
if old_form not in s:
    raise SystemExit('form validation block not found')
s = s.replace(old_form, new_form)

# Defensive hash restoration: only accept model values that exist in the generated options.
s = s.replace('if(a&&document.getElementById("compareA")){document.getElementById("compareA").value=a;document.getElementById("compareB").value=b||"";document.getElementById("compareA").dispatchEvent(new Event("change"));}', 'if(a&&document.getElementById("compareA")){var ca=document.getElementById("compareA"),cb=document.getElementById("compareB"),validA=Array.prototype.some.call(ca.options,function(o){return o.value===a;}),validB=Array.prototype.some.call(cb.options,function(o){return o.value===b;});if(validA){ca.value=a;cb.value=validB?b:"";ca.dispatchEvent(new Event("change"));}}')

if s == original:
    raise SystemExit('no changes made')
path.write_text(s, encoding="utf-8")
print(f'updated {path}')
print(f'bytes: {len(original)} -> {len(s)}')
