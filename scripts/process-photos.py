#!/usr/bin/env python3
"""Replacement-ready photo pipeline.
Usage:
  1. Put raw photos in incoming/.
  2. Run: python3 scripts/process-photos.py --incoming incoming --out toyota-sharp-assets
  3. The script applies a restrained grade and slot crop.
  4. It exports 480/800/1440 WebP plus AVIF when smaller.
  5. Review output and update the slot manifest before publishing.
"""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps
import argparse
SLOTS={"hero":{"ratio":16/9,"min":1800,"sizes":[480,1200,1800]},"hero-mobile":{"ratio":4/5,"min":1200,"sizes":[480,800,1200]},"featured":{"ratio":4/5,"min":800,"sizes":[480,800]},"model-card":{"ratio":4/5,"min":800,"sizes":[480,800]},"facilities":{"ratio":3/2,"min":1200,"sizes":[480,800,1200]},"gallery":{"ratio":3/2,"min":1200,"sizes":[480,800,1440]}}
def grade(im):
    im=ImageEnhance.Contrast(im).enhance(1.06)
    im=ImageEnhance.Color(im).enhance(0.97)
    return im
def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--incoming',default='incoming'); ap.add_argument('--out',default='toyota-sharp-assets'); ap.add_argument('--slot',default='model-card',choices=SLOTS); a=ap.parse_args()
    src=Path(a.incoming); out=Path(a.out); spec=SLOTS[a.slot]; out.mkdir(parents=True,exist_ok=True)
    for p in sorted(src.iterdir()):
        if p.suffix.lower() not in {'.jpg','.jpeg','.png','.webp'}: continue
        im=ImageOps.exif_transpose(Image.open(p).convert('RGB')); im=grade(im)
        for width in spec['sizes']:
            h=round(width/spec['ratio']); crop=ImageOps.fit(im,(width,h),method=Image.Resampling.LANCZOS,centering=(.5,.5))
            stem=f'{a.slot}-{p.stem}-{width}'
            webp=out/f'{stem}.webp'; crop.save(webp,'WEBP',quality=84,method=6)
            avif=out/f'{stem}.avif'; crop.save(avif,'AVIF',quality=55,speed=6)
            if avif.stat().st_size >= webp.stat().st_size: avif.unlink()
if __name__=='__main__': main()
