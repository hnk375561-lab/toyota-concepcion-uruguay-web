from pathlib import Path
import re
from PIL import Image

root = Path(__file__).resolve().parents[1]
html_path = root / 'index.html'
html = html_path.read_text(encoding='utf-8')
refs = sorted(set(re.findall(r'toyota-sharp-assets/[^"\' )>]+\.webp', html)))
created = []
for ref in refs:
    if not re.search(r'-(?:480|800|1200|1440|1800)\.webp$', ref):
        continue
    source = root / ref
    target = source.with_suffix('.avif')
    if not source.exists() or target.exists():
        continue
    with Image.open(source) as im:
        im.save(target, format='AVIF', quality=82, speed=6)
    if target.stat().st_size >= source.stat().st_size:
        target.unlink()
    else:
        created.append((ref, str(target.relative_to(root)), source.stat().st_size, target.stat().st_size))

# Add AVIF before the existing WebP source for responsive gallery pictures only.
def add_avif(match):
    attrs, srcset = match.group(1), match.group(2)
    avif = re.sub(r'\.webp(\s|$)', r'.avif\1', srcset)
    if avif == srcset or not all((root / p).exists() for p in re.findall(r'(toyota-sharp-assets/[^ ]+\.avif)', avif)):
        return match.group(0)
    return f'<picture class="responsive-picture"{attrs}><source sizes="{match.group(3)}" srcset="{avif}" type="image/avif"/><source sizes="{match.group(3)}" srcset="{srcset}" type="image/webp"/>'

pattern = re.compile(r'<picture class="responsive-picture"([^>]*)>\s*<source sizes="([^"]+)" srcset="([^"]+)" type="image/webp"/>')
# Groups are attrs, sizes, srcset in the source pattern.
def add_avif2(match):
    attrs, sizes, srcset = match.groups()
    avif = re.sub(r'\.webp\b', '.avif', srcset)
    paths = re.findall(r'(toyota-sharp-assets/[^ ]+\.avif)', avif)
    if not paths or not all((root / p).exists() for p in paths):
        return match.group(0)
    return f'<picture class="responsive-picture"{attrs}>\n<source sizes="{sizes}" srcset="{avif}" type="image/avif"/><source sizes="{sizes}" srcset="{srcset}" type="image/webp"/>'
html, picture_count = pattern.subn(add_avif2, html)
html_path.write_text(html, encoding='utf-8')
print(f'created={len(created)} responsive_pictures={picture_count}')
for ref, target, old, new in created:
    print(f'{old-new} bytes saved: {target}')
