from pathlib import Path

path = Path(__file__).resolve().parents[1] / "index.html"
html = path.read_text(encoding="utf-8")
old = (
    '<picture><source srcset="toyota-sharp-assets/enhanced-bec83be10e47.webp" '
    'type="image/webp"/><img alt="Logo Piñeyro y Moscatelli, concesionario oficial Toyota" '
    'class="brand-logo" data-source="redes-toyota" decoding="async" height="800" '
    'src="toyota-sharp-assets/enhanced-bec83be10e47.webp" width="800"/></picture>'
)
new = (
    '<picture><source srcset="toyota-sharp-assets/asset-bec83be10e47-256.webp" '
    'type="image/webp"/><img alt="Logo Piñeyro y Moscatelli, concesionario oficial Toyota" '
    'class="brand-logo" data-source="redes-toyota" decoding="async" height="256" '
    'src="toyota-sharp-assets/asset-bec83be10e47-256.webp" width="256"/></picture>'
)
if html.count(old) != 1:
    raise SystemExit(f"expected exactly one header logo, found {html.count(old)}")
path.write_text(html.replace(old, new), encoding="utf-8")
print("optimized header logo reference")
