#!/usr/bin/env python3
"""Build a conservative image reference map for the static site."""
from pathlib import Path
import json, re
ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "toyota-sharp-assets"
TEXT_EXT = {".html", ".css", ".js", ".json", ".md", ".xml", ".txt"}
files = [p for p in ROOT.rglob("*") if p.is_file() and ".git" not in p.parts and p.suffix.lower() in TEXT_EXT]
text = "\n".join(p.read_text(errors="ignore") for p in files)
rows=[]
for image in sorted(ASSET_DIR.iterdir()):
    if image.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp", ".avif"}: continue
    name=image.name
    hits=[str(p.relative_to(ROOT)) for p in files if name in p.read_text(errors="ignore")]
    # Manifests describe generated inventory, not runtime references.
    runtime=[h for h in hits if not h.endswith("manifest.json") and not h.endswith("manifest-new-images.json")]
    if runtime: status="USED"
    elif image.suffix.lower() in {".jpg", ".jpeg"} and (ASSET_DIR/(image.stem+".webp")).exists(): status="UNUSED"
    else: status="UNCERTAIN"
    rows.append({"file":str(image.relative_to(ROOT)),"status":status,"referenced_in":runtime,"bytes":image.stat().st_size})
out=ROOT/"docs"/"reference-map.json"; out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps({"scanned_extensions":sorted(TEXT_EXT),"assets":rows},indent=2,ensure_ascii=False)+"\n")
from collections import Counter
print(json.dumps(Counter(r['status'] for r in rows),ensure_ascii=False))
print("UNCERTAIN:")
for r in rows:
    if r['status']=="UNCERTAIN": print(r['file'])
print(f"Wrote {out}")
