from pathlib import Path
import re

html = Path(__file__).resolve().parents[1] / "index.html"
out = Path("/tmp/toyota-inline-js.js")
s = html.read_text(encoding="utf-8")
blocks = []
for match in re.finditer(r"<script([^>]*)>(.*?)</script>", s, re.S | re.I):
    attrs, body = match.groups()
    if re.search(r"type=[\"']application/ld\+json[\"']", attrs, re.I):
        continue
    if "src=" in attrs:
        continue
    blocks.append(body)
out.write_text("\n\n".join(blocks), encoding="utf-8")
print(f"extracted {len(blocks)} JavaScript blocks to {out}")
