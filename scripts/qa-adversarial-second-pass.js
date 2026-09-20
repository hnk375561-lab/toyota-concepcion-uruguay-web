const { chromium, devices } = require('/home/ubuntu/node_modules/playwright-core');
const fs=require('fs');
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:320,height:900},deviceScaleFactor:1});
 const all=[]; const consoleErrors=[]; const responseErrors=[];
 p.on('console',m=>{if(m.type()==='error') consoleErrors.push(m.text())}); p.on('pageerror',e=>consoleErrors.push(e.message));
 p.on('response',r=>{if(r.status()>=400) responseErrors.push({url:r.url(),status:r.status()})});
 await p.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded'});
 const widths=[...Array(161).keys()].map(i=>320+i*10).concat([360,390,768,830,1024,1280,1440,1600,1920]);
 for(const w of widths){
  await p.setViewportSize({width:w,height:900}); await p.evaluate(()=>{document.querySelectorAll('.premium-reveal').forEach(e=>{e.classList.add('is-visible');e.style.opacity='1';e.style.visibility='visible';e.style.transform='none'});}); await p.waitForTimeout(30);
  const r=await p.evaluate(()=>{
   const vw=innerWidth, vh=innerHeight; const q=s=>[...document.querySelectorAll(s)];
   const visible=e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return r.width>0&&r.height>0&&c.display!=='none'&&c.visibility!=='hidden'};
   const els=q('body *').filter(visible); const clickable=q('a,button,input,select,textarea,[role="button"]').filter(visible);
   const overflow=els.filter(e=>{const r=e.getBoundingClientRect();return r.right>vw+1||r.left<-1}).slice(0,20).map(e=>({tag:e.tagName,cl:e.className?.toString().slice(0,80),right:Math.round(e.getBoundingClientRect().right)}));
   const clipped=els.filter(e=>{const r=e.getBoundingClientRect(),c=getComputedStyle(e);return ((e.scrollWidth>e.clientWidth+1)||(e.scrollHeight>e.clientHeight+1))&&c.overflow!=='visible'&&c.overflowX!=='auto'}).slice(0,20).map(e=>({tag:e.tagName,cl:e.className?.toString().slice(0,80)}));
   const narrow=els.filter(e=>{const r=e.getBoundingClientRect();return r.width<140&&e.innerText?.trim().split(/\s+/).length>3}).slice(0,20).map(e=>({tag:e.tagName,cl:e.className?.toString().slice(0,80),text:e.innerText.trim().slice(0,80)}));
   const touch=vw<=820?clickable.filter(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44}).slice(0,20).map(e=>({tag:e.tagName,cl:e.className?.toString().slice(0,80),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)})):[];
   const covered=clickable.filter(e=>{const r=e.getBoundingClientRect();if(r.bottom<0||r.top>vh)return false;const x=Math.max(1,Math.min(vw-1,(r.left+r.right)/2)),y=Math.max(1,Math.min(vh-1,(r.top+r.bottom)/2));const top=document.elementFromPoint(x,y);return top&&!e.contains(top)&&top!==e}).slice(0,20).map(e=>({tag:e.tagName,cl:e.className?.toString().slice(0,80)}));
   const buttons=q('.loc-btn,.btn,.route-buttons a,.brand-plaque-actions a,button').filter(visible).filter(e=>{const r=e.getBoundingClientRect(),text=e.innerText?.trim();return text&&r.width/r.height<1.25}).slice(0,20).map(e=>({cl:e.className?.toString().slice(0,80),text:e.innerText.trim().slice(0,60),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}));
   const f=q('.float-advisor,.float-social,.float-wa').filter(visible).map(e=>{const r=e.getBoundingClientRect();return {cl:e.className.toString(),top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right)}});
   return {width:vw,overflow:overflow.length,clipped:clipped.length,narrow:narrow.length,touch:touch.length,covered:covered.length,buttons:buttons.length,fabs:f,examples:{overflow,clipped,narrow,touch,covered,buttons}};
  }); all.push(r);
 }
 fs.writeFileSync('/home/ubuntu/toyota-second-audit.json',JSON.stringify({results:all,consoleErrors,responseErrors},null,2));
 console.log(JSON.stringify({widths:all.length,nonzero:{overflow:all.filter(x=>x.overflow),clipped:all.filter(x=>x.clipped),narrow:all.filter(x=>x.narrow),touch:all.filter(x=>x.touch),covered:all.filter(x=>x.covered),buttons:all.filter(x=>x.buttons)},consoleErrors,responseErrors},null,2));
 await b.close();
})();
