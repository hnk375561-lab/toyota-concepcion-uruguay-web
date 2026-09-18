from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
src = root / "toyota-sharp-assets" / "hero-sw4-1800.jpg"
out = root / "toyota-sharp-assets" / "hero-sw4-480.webp"
with Image.open(src) as image:
    image = image.convert("RGB")
    image.thumbnail((480, 480), Image.Resampling.LANCZOS)
    image.save(out, "WEBP", quality=78, method=6)
print(f"created {out} ({out.stat().st_size} bytes)")
