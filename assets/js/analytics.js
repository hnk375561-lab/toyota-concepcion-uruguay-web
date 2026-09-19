window.dataLayer=window.dataLayer||[];
window.toyotaTrack=function(name,details){window.dataLayer.push(Object.assign({event:name},details||{}));};
document.addEventListener('click',function(event){var link=event.target.closest&&event.target.closest('a[href*="wa.me"]');if(link)window.toyotaTrack('whatsapp_click',{link_url:link.href,link_text:(link.textContent||'').trim().slice(0,80)});});
document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('svg').forEach(function(svg){if(!svg.hasAttribute('aria-label'))svg.setAttribute('aria-hidden','true');});document.querySelectorAll('.contact-plus-icon').forEach(function(icon){icon.setAttribute('aria-hidden','true');});});
