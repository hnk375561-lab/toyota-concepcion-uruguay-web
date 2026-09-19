#!/usr/bin/env python3
"""QA reproducible de interactividad; no envía mensajes ni navega a servicios sensibles."""
import argparse, json, time
from pathlib import Path
from playwright.sync_api import sync_playwright

SENSITIVE = ("https://wa.me/", "https://api.whatsapp.com/", "tel:", "mailto:")
VIEWPORTS = [(390, 844), (1440, 900)]

def safe_route(route):
    if route.request.url.startswith(SENSITIVE):
        route.fulfill(status=200, content_type="text/plain", body="intercepted")
    else:
        route.continue_()

def state(page):
    return page.evaluate("""() => ({
      scrollY, htmlClass: document.documentElement.className,
      bodyClass: document.body.className,
      html: {overflow:getComputedStyle(document.documentElement).overflow, position:getComputedStyle(document.documentElement).position},
      body: {overflow:getComputedStyle(document.body).overflow, position:getComputedStyle(document.body).position},
      lenis: window.__toyotaLenis ? {exists:true, isStopped:!!window.__toyotaLenis.isStopped} : {exists:false},
      overlay: Array.from(document.querySelectorAll('[role=dialog],.lightbox,.modal,.overlay')).map(e=>({id:e.id,cls:e.className,display:getComputedStyle(e).display,opacity:getComputedStyle(e).opacity,pointerEvents:getComputedStyle(e).pointerEvents,open:e.classList.contains('open')})),
      center: document.elementFromPoint(innerWidth/2,innerHeight/2)?.tagName || null
    })""")

def inventory(page):
    return page.evaluate("""() => Array.from(document.querySelectorAll('a[href],button,[role=button],select,input[type=range],.filterbtn,[data-filter],[data-category],[data-reason],.faq-q')).map((e,i)=>({
      index:i, tag:e.tagName.toLowerCase(), id:e.id||null, selector:e.id?'#'+e.id:e.className?'.'+String(e.className).trim().split(/\\s+/).join('.'):e.tagName.toLowerCase(),
      section:e.closest('section')?.id||null, label:(e.innerText||e.getAttribute('aria-label')||e.getAttribute('title')||e.value||'').trim().slice(0,120), href:e.getAttribute('href'), expected: e.matches('.filterbtn')?'cambia cantidad de tarjetas':e.matches('.faq-q')?'abre/cierra respuesta':e.matches('a[href^="#"]')?'navega al ancla':'cambia estado, abre modal o ejecuta acción'
    }))""")

def run(url, out):
    result={"url":url,"generated_at":time.strftime('%Y-%m-%dT%H:%M:%S%z'),"viewports":{},"inventory":[]}
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True, executable_path="/usr/bin/chromium", args=["--no-sandbox"])
        for width,height in VIEWPORTS:
            page=browser.new_page(viewport={"width":width,"height":height})
            errors=[]; pageerrors=[]
            page.on("console",lambda m: errors.append({"type":m.type,"text":m.text}) if m.type=="error" else None)
            page.on("pageerror",lambda e: pageerrors.append(str(e)))
            page.route("**/*",safe_route)
            page.goto(url,wait_until="domcontentloaded",timeout=30000); page.wait_for_timeout(1500)
            inv=inventory(page)
            if not result["inventory"]: result["inventory"]=inv
            filters={}
            for kind,expected in [("todos",9),("pickup",1),("suv",5),("sedan",3)]:
                page.locator(f'#filterbar .filterbtn[data-filter="{kind}"]').click(); page.wait_for_timeout(250)
                filters[kind]={"visible":page.locator('#gama-grid .model:not([hidden])').count(),"expected":expected,"active":page.locator('#filterbar .filterbtn.active').get_attribute('data-filter')}
            page.locator('#filterbar .filterbtn[data-filter="todos"]').click()
            image_states=[]
            for i in range(min(page.locator('#gama-grid img').count(),9)):
                img=page.locator('#gama-grid img').nth(i); img.scroll_into_view_if_needed(); before=state(page); img.click(); page.wait_for_timeout(150); after=state(page); page.keyboard.press('Escape'); page.wait_for_timeout(150); closed=state(page); image_states.append({"index":i,"before":before,"after":after,"closed":closed})
            result["viewports"][f"{width}x{height}"]={"filters":filters,"images":image_states,"console_errors":errors,"pageerrors":pageerrors,"inventory_count":len(inv),"horizontal_overflow":page.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth')}
            page.close()
        browser.close()
    Path(out).parent.mkdir(parents=True,exist_ok=True); Path(out).write_text(json.dumps(result,ensure_ascii=False,indent=2)); print(out)

if __name__ == '__main__':
    ap=argparse.ArgumentParser(); ap.add_argument('url'); ap.add_argument('--out',default='/tmp/fase3-evidence/qa-interactividad.json'); args=ap.parse_args(); run(args.url,args.out)
