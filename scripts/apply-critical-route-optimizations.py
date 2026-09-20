from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'index.html'
html = path.read_text(encoding='utf-8')

old_head = '''<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link as="image" fetchpriority="high" href="toyota-sharp-assets/hero-sw4-desktop-1800.avif" media="(min-width: 761px)" rel="preload" type="image/avif"/>
<link as="image" fetchpriority="high" href="toyota-sharp-assets/hero-sw4-mobile-4to5-640.avif" media="(max-width: 760px)" rel="preload" type="image/avif"/>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&amp;family=Manrope:wght@500;600;700;800&amp;display=swap" rel="stylesheet"/>
<link crossorigin="" href="https://cdnjs.cloudflare.com" rel="preconnect"/>
<link crossorigin="" href="https://cdn.jsdelivr.net" rel="preconnect"/>'''
new_head = '''<link as="font" crossorigin="" href="toyota-sharp-assets/fonts/manrope-700-latin.woff2" rel="preload" type="font/woff2"/>
<link as="font" crossorigin="" href="toyota-sharp-assets/fonts/ibm-plex-sans-400-latin.woff2" rel="preload" type="font/woff2"/>
<link as="image" fetchpriority="high" href="toyota-sharp-assets/hero-sw4-desktop-1800.avif" media="(min-width: 761px)" rel="preload" type="image/avif"/>
<link as="image" fetchpriority="high" href="toyota-sharp-assets/hero-sw4-mobile-4to5-640.avif" media="(max-width: 760px)" rel="preload" type="image/avif"/>
<link href="toyota-sharp-assets/fonts.css" rel="stylesheet"/>
<link crossorigin="" href="https://cdnjs.cloudflare.com" rel="preconnect"/>'''
if html.count(old_head) != 1:
    raise SystemExit(f'head block count: {html.count(old_head)}')
html = html.replace(old_head, new_head)

old_loader = '''<script id="conditional-lenis-loader">
(function(){
  var touch=window.matchMedia&&window.matchMedia("(pointer: coarse)").matches;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!touch&&!reduce){document.write('<script src="https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js" defer><\\/script>');}
})();
</script>'''
new_loader = '''<script id="conditional-lenis-loader">
(function(){
  var touch=window.matchMedia&&window.matchMedia("(pointer: coarse)").matches;
  var reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(touch||reduce)return;
  var load=function(){
    if(window.Lenis||window.__toyotaLenisLoading)return;
    window.__toyotaLenisLoading=true;
    var tag=document.createElement("script");
    tag.src="https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.min.js";
    tag.async=true;
    tag.onload=function(){window.__toyotaLenisLoading=false;if(window.__initToyotaLenis)window.__initToyotaLenis();};
    tag.onerror=function(){window.__toyotaLenisLoading=false;};
    document.head.appendChild(tag);
  };
  var idle=window.requestIdleCallback||function(cb){setTimeout(cb,1)};
  if(document.readyState==="complete")idle(load);else window.addEventListener("load",function(){idle(load)},{once:true});
})();
</script>'''
if html.count(old_loader) != 1:
    raise SystemExit(f'loader block count: {html.count(old_loader)}')
html = html.replace(old_loader, new_loader)

old_vars = '''--display:"Manrope", Arial, sans-serif;
  --body:"IBM Plex Sans", Arial, sans-serif;'''
new_vars = '''--display:"Manrope", "Manrope Fallback", Arial, sans-serif;
  --body:"IBM Plex Sans", "IBM Plex Sans Fallback", Arial, sans-serif;'''
if html.count(old_vars) != 1:
    raise SystemExit(f'font variables count: {html.count(old_vars)}')
html = html.replace(old_vars, new_vars)

old_lenis_start = '''  if(window.__toyotaLenis || coarsePointer || !window.Lenis || !window.gsap || !window.ScrollTrigger){'''
new_lenis_start = '''  window.__initToyotaLenis=function(){
  if(window.__toyotaLenis || coarsePointer || !window.Lenis || !window.gsap || !window.ScrollTrigger){'''
if html.count(old_lenis_start) != 1:
    raise SystemExit(f'lenis start count: {html.count(old_lenis_start)}')
html = html.replace(old_lenis_start, new_lenis_start)

old_lenis_end = '''  } else {
    window.__toyotaLenis=null;
  }
  if(!window.gsap||reduce)return;'''
new_lenis_end = '''  } else {
    window.__toyotaLenis=null;
  }
  };
  window.__initToyotaLenis();
  if(!window.gsap||reduce)return;'''
if html.count(old_lenis_end) != 1:
    raise SystemExit(f'lenis end count: {html.count(old_lenis_end)}')
html = html.replace(old_lenis_end, new_lenis_end)

# Keep fallback metrics local to the existing critical CSS and avoid layout jumps while fonts swap.
marker = '''  --body:"IBM Plex Sans", "IBM Plex Sans Fallback", Arial, sans-serif;'''
fallback = '''  --body:"IBM Plex Sans", "IBM Plex Sans Fallback", Arial, sans-serif;
  --font-fallback-display:"Manrope Fallback", Arial, sans-serif;
  --font-fallback-body:"IBM Plex Sans Fallback", Arial, sans-serif;'''
html = html.replace(marker, fallback, 1)

fallback_css = '''\n@font-face{font-family:"Manrope Fallback";src:local("Arial");size-adjust:106%;ascent-override:93%;descent-override:24%;line-gap-override:0%}\n@font-face{font-family:"IBM Plex Sans Fallback";src:local("Arial");size-adjust:100%;ascent-override:102%;descent-override:24%;line-gap-override:0%}\n'''
css_marker = '<style id="consolidated-site-css">'
if html.count(css_marker) != 1:
    raise SystemExit('critical CSS marker missing')
html = html.replace(css_marker, css_marker + fallback_css, 1)
path.write_text(html, encoding='utf-8')
print('applied critical-route optimizations')
