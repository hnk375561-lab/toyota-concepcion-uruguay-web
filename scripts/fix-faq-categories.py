from pathlib import Path
p = Path(__file__).resolve().parents[1] / "index.html"
s = p.read_text(encoding="utf-8")
old = "var keys=['postventa','postventa','postventa','usados','financiacion','financiacion','usados','postventa','usados'];"
new = "var keys=['0km','postventa','postventa','usados','financiacion','financiacion','usados','postventa','0km'];"
if old not in s:
    raise SystemExit("FAQ keys not found")
s = s.replace(old, new, 1)
p.write_text(s, encoding="utf-8")
print("FAQ categories updated")
