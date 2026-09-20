from pathlib import Path
import re
import urllib.request

root = Path(__file__).resolve().parents[1]
css_source = Path('/tmp/toyota-fonts-modern.css')
if not css_source.exists():
    raise SystemExit('missing /tmp/toyota-fonts-modern.css; fetch the Google Fonts CSS first')

text = css_source.read_text(encoding='utf-8')
blocks = re.findall(r'(@font-face\s*\{.*?\})', text, flags=re.S)
fonts = []
for block in blocks:
    if 'U+0000-00FF' not in block:
        continue
    family = re.search(r"font-family:\s*'([^']+)'", block).group(1)
    weight = re.search(r'font-weight:\s*(\d+)', block).group(1)
    url = re.search(r'url\((https://[^)]+\.woff2)\)', block).group(1)
    slug = 'ibm-plex-sans' if family == 'IBM Plex Sans' else 'manrope'
    filename = f'{slug}-{weight}-latin.woff2'
    destination = root / 'toyota-sharp-assets' / 'fonts' / filename
    destination.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(url, destination)
    fonts.append((family, weight, filename))

if len(fonts) != 8:
    raise SystemExit(f'expected 8 latin font files, found {len(fonts)}')

out = [
    '/* Self-hosted Google Fonts, Latin subset; font files are licensed under the SIL Open Font License. */',
]
for family, weight, filename in fonts:
    out.extend([
        '@font-face {',
        f'  font-family: "{family}";',
        '  font-style: normal;',
        f'  font-weight: {weight};',
        '  font-display: swap;',
        f'  src: url("fonts/{filename}") format("woff2");',
        '  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;',
        '}',
    ])
(root / 'toyota-sharp-assets' / 'fonts.css').write_text('\n'.join(out) + '\n', encoding='utf-8')
(root / 'toyota-sharp-assets' / 'fonts' / 'OFL.txt').write_text(
    'Font files are distributed under the SIL Open Font License, Version 1.1.\n'
    'See https://scripts.sil.org/OFL for the complete license text.\n', encoding='utf-8')
print(f'generated {len(fonts)} self-hosted font files')
