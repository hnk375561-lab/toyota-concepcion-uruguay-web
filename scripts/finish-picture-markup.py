from pathlib import Path
p=Path(__file__).resolve().parents[1]/'index.html'; s=p.read_text()
old='''<picture><source type="image/webp" srcset="toyota-sharp-assets/enhanced-4533c3b60b75-800.webp"><img src="toyota-sharp-assets/enhanced-4533c3b60b75-800.webp" alt="Estantería de repuestos originales Toyota" loading="lazy" decoding="async" width="797" height="800"></picture>'''
new='''<picture><source type="image/avif" srcset="toyota-sharp-assets/enhanced-4533c3b60b75-800.avif"><source type="image/webp" srcset="toyota-sharp-assets/enhanced-4533c3b60b75-800.webp"><img src="toyota-sharp-assets/enhanced-4533c3b60b75-800.webp" alt="Estantería de repuestos originales Toyota" loading="lazy" decoding="async" width="800" height="803"></picture>'''
if old not in s: raise SystemExit('static picture not found')
s=s.replace(old,new)
old2='''<picture><source type="image/webp" srcset="'+m.foto.replace(/\\.jpg$/,".webp")+'"><img src="'+m.foto+'" alt="Toyota '+m.nombre+'" loading="lazy" decoding="async" width="'+m.fotoW+'" height="'+m.fotoH+'"></picture>'''
new2='''<picture><source type="image/avif" srcset="'+m.foto.replace(/-800\\.webp$/,"-800.avif")+' 800w, '+m.foto.replace(/-800\\.webp$/,"-480.avif")+' 480w" sizes="(max-width: 600px) 92vw, 360px"><source type="image/webp" srcset="'+m.foto.replace(/-800\\.webp$/,"-480.webp")+' 480w, '+m.foto+' 800w" sizes="(max-width: 600px) 92vw, 360px"><img src="'+m.foto+'" alt="Toyota '+m.nombre+'" loading="lazy" decoding="async" width="'+m.fotoW+'" height="'+m.fotoH+'"></picture>'''
if old2 not in s: raise SystemExit('highlight picture not found')
s=s.replace(old2,new2)
p.write_text(s); print('completed picture markup')
