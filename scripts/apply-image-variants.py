from pathlib import Path
p=Path(__file__).resolve().parents[1]/'index.html'
s=p.read_text()
# Hero keeps its existing visual/crop; use the already-kept WebP as fallback after removing the unused JPG.
s=s.replace('src="toyota-sharp-assets/hero-sw4-1800.jpg"','src="toyota-sharp-assets/hero-sw4-1800.webp"')
# Dynamic model catalog: point cards at 800px WebP and let the browser choose 480/800 AVIF/WebP.
for base in ['4a00d0bf85e9','371d49eb8a93','6d088249b097','9608f3af165f','cf008c7d5b59','b77ea4b4185d','40f34102e3e9','a70429bf61f7','3cd7479efb85']:
    s=s.replace(f'toyota-sharp-assets/enhanced-{base}.webp',f'toyota-sharp-assets/enhanced-{base}-800.webp')
old="(m.foto ? '<picture><source type=\"image/webp\" srcset=\"' + m.foto.replace(/\\.jpg$/, '.webp') + '\"><img class=\"model-photo\" src=\"' + m.foto + '\" alt=\"Toyota ' + m.nombre + '\" loading=\"lazy\" decoding=\"async\" width=\"' + m.fotoW + '\" height=\"' + m.fotoH + '\">"
new="(m.foto ? '<picture><source type=\"image/avif\" srcset=\"' + m.foto.replace(/-800\\.webp$/, '-800.avif') + ' 800w, ' + m.foto.replace(/-800\\.webp$/, '-480.avif') + ' 480w\" sizes=\"(max-width: 600px) 92vw, 280px\"><source type=\"image/webp\" srcset=\"' + m.foto.replace(/-800\\.webp$/, '-480.webp') + ' 480w, ' + m.foto + ' 800w\" sizes=\"(max-width: 600px) 92vw, 280px\"><img class=\"model-photo\" src=\"' + m.foto + '\" alt=\"Toyota ' + m.nombre + '\" loading=\"lazy\" decoding=\"async\" width=\"' + m.fotoW + '\" height=\"' + m.fotoH + '\">"
if old not in s: raise SystemExit('catalog render block not found')
s=s.replace(old,new)
old2="'<picture><source type=\"image/webp\" srcset=\"'+m.foto.replace(/\\.jpg$/ ,\".webp\")+'\"><img src=\"'+m.foto+'\" alt=\"Toyota '+m.nombre+'\" loading=\"lazy\" decoding=\"async\" width=\"'+m.fotoW+'\" height=\"'+m.fotoH+'\">"
# tolerate the actual no-space form used in this file
if old2 not in s:
 old2="'<picture><source type=\"image/webp\" srcset=\"'+m.foto.replace(/\\.jpg$/ ,\".webp\")+'\"><img src=\"'+m.foto+'\" alt=\"Toyota '+m.nombre+'\" loading=\"lazy\" decoding=\"async\" width=\"'+m.fotoW+'\" height=\"'+m.fotoH+'\">"
# Highlight cards are also dynamic; replace their source tag only.
s=s.replace("'<picture><source type=\"image/webp\" srcset=\"'+m.foto.replace(/\\.jpg$/ ,\".webp\")+'\"><img", "'<picture><source type=\"image/avif\" srcset=\"'+m.foto.replace(/-800\\.webp$/,\"-800.avif\")+' 800w, '+m.foto.replace(/-800\\.webp$/,\"-480.avif\")+' 480w\" sizes=\"(max-width: 600px) 92vw, 360px\"><source type=\"image/webp\" srcset=\"'+m.foto.replace(/-800\\.webp$/,\"-480.webp\")+' 480w, '+m.foto+' 800w\" sizes=\"(max-width: 600px) 92vw, 360px\"><img")
p.write_text(s)
print('updated',p)
