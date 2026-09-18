#!/usr/bin/env python3
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]; A=ROOT/'toyota-sharp-assets'
# Active model photos are dynamically referenced as enhanced-*.webp in index.html.
for src in sorted(A.glob('enhanced-*.webp')):
    try: im=Image.open(src).convert('RGB')
    except Exception: continue
    for width in (480,800):
        if im.width <= width: continue
        out=A/f'{src.stem}-{width}.webp'
        if not out.exists():
            ratio=im.height/im.width; dst=im.resize((width,round(width*ratio)),Image.Resampling.LANCZOS)
            dst.save(out,'WEBP',quality=84,method=6)
        avif=A/f'{src.stem}-{width}.avif'
        if not avif.exists():
            Image.open(out).save(avif,'AVIF',quality=55,speed=6)
            if avif.stat().st_size >= out.stat().st_size: avif.unlink()
print('Generated active model variants where source exceeded target width.')
