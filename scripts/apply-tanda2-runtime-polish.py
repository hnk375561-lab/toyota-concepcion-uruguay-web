from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'index.html'
html = path.read_text(encoding='utf-8')
old = "document.addEventListener('DOMContentLoaded',function(){document.querySelectorAll('svg').forEach(function(svg){if(!svg.hasAttribute('aria-label'))svg.setAttribute('aria-hidden','true');});document.querySelectorAll('.contact-plus-icon').forEach(function(icon){icon.setAttribute('aria-hidden','true');});});"
new = "document.addEventListener('DOMContentLoaded',function(){var mark=function(){document.querySelectorAll('svg').forEach(function(svg){if(!svg.hasAttribute('aria-label'))svg.setAttribute('aria-hidden','true');});document.querySelectorAll('.contact-plus-icon').forEach(function(icon){icon.setAttribute('aria-hidden','true');});};(window.requestIdleCallback||function(cb){setTimeout(cb,1)})(mark);});"
if html.count(old) != 1:
    raise SystemExit(f'analytics initializer count: {html.count(old)}')
html = html.replace(old, new)
old_css = '.hero-editorial-vehicle img{will-change:transform}'
if html.count(old_css) != 1:
    raise SystemExit(f'will-change rule count: {html.count(old_css)}')
html = html.replace(old_css, '.hero-editorial-vehicle img{will-change:auto}')
path.write_text(html, encoding='utf-8')
print('applied Tanda 2 runtime polish')
