document.addEventListener('DOMContentLoaded',function(){
  var form=document.getElementById('contactForm'), select=document.getElementById('cMotivo'), name=document.getElementById('cName'), msg=document.getElementById('cMsg'), preview=document.getElementById('messagePreview');
  if(!form||!select)return;
  var chips=form.querySelectorAll('[data-reason]');
  function sync(){chips.forEach(function(chip){chip.classList.toggle('is-selected',chip.dataset.reason===select.value);});var label=select.options[select.selectedIndex]?select.options[select.selectedIndex].text:'Consulta general';var text=(msg&&msg.value.trim())||'Quiero hacer una consulta por '+label.toLowerCase()+'.';if(preview)preview.textContent='Hola, '+(name&&name.value.trim()?name.value.trim()+'. ':'')+text;}
  chips.forEach(function(chip){chip.addEventListener('click',function(){select.value=chip.dataset.reason;select.dispatchEvent(new Event('change',{bubbles:true}));sync();});});
  [select,name,msg].forEach(function(el){if(el){el.addEventListener('input',sync);el.addEventListener('change',sync);}});sync();
});
