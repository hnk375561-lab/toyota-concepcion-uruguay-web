from pathlib import Path
import re
from PIL import Image

root = Path(__file__).resolve().parents[1]
html = (root / 'index.html').read_text(encoding='utf-8')
refs = sorted(set(re.findall(r'toyota-sharp-assets/[^"\' )>]+\.(?:avif|webp|png|jpg|jpeg)', html)))
for ref in refs:
    path = root / ref
    if not path.exists():
        continue
    try:
        im = Image.open(path)
        if path.stat().st_size > 150_000:
            print(f'{path.stat().st_size}\t{im.width}x{im.height}\t{ref}')
    except Exception:
        pass
