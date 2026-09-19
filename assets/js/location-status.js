document.addEventListener('DOMContentLoaded',function(){
  var box=document.getElementById('locationStatus'), label=document.getElementById('locationStatusText'), note=document.getElementById('locationStatusNote');
  if(!box||!label||!note)return;
  var now=new Date(), parts={};
  try{parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Argentina/Buenos_Aires',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(now).reduce(function(a,p){a[p.type]=p.value;return a;},{});}catch(e){parts={weekday:'Mon',hour:'12',minute:'00'};}
  var day={Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6,Sun:0}[parts.weekday]; var minutes=(Number(parts.hour)||0)*60+(Number(parts.minute)||0); var open=(day>=1&&day<=5&&((minutes>=480&&minutes<720)||(minutes>=900&&minutes<1140)))||(day===6&&minutes>=480&&minutes<720);
  var next=day===0||day===6||minutes>=720?'08:00':'15:00';
  box.classList.toggle('is-closed',!open); label.textContent=open?'Abierto ahora':'Cerrado ahora'; note.textContent=open?' · Atención en el concesionario':' · Abre hoy a las '+next;
  var rows=document.querySelectorAll('#ubicacion .hours-table tr'); if(rows[day===6?1:day>=1&&day<=5?0:2])rows[day===6?1:day>=1&&day<=5?0:2].classList.add('is-today');
});
