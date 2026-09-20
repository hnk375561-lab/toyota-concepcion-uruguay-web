#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="${DOMAIN:-}"
if [[ -z "$DOMAIN" ]]; then echo "Uso: DOMAIN=www.ejemplo.com ./golive/golive.sh" >&2; exit 2; fi
DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN%/}"
read -r -p "Esto habilita indexación para https://$DOMAIN. ¿Continuar? [y/N] " answer
[[ "$answer" == "y" || "$answer" == "Y" ]] || { echo "Cancelado."; exit 0; }
export DOMAIN
python3 - "$ROOT" <<'PY'
from pathlib import Path
import re, sys
root=Path(sys.argv[1]); domain=__import__('os').environ['DOMAIN']; base=f'https://{domain}/'
p=root/'index.html'; s=p.read_text()
s=re.sub(r'(<meta[^>]+name="robots"[^>]+content=")[^"]+', r'\1index, follow', s, count=1, flags=re.I)
s=re.sub(r'(<meta[^>]+name="googlebot"[^>]+content=")[^"]+', r'\1index, follow', s, count=1, flags=re.I)
s=re.sub(r'(<meta[^>]+property="og:url"[^>]+content=")[^"]+', r'\1'+base, s, count=1, flags=re.I)
s=s.replace('</head>', f'<link rel="canonical" href="{base}">\n</head>', 1)
p.write_text(s)
(root/'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{base}</loc></url></urlset>\n')
(root/'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {base}sitemap.xml\n')
PY
echo "Go-live preparado para https://$DOMAIN/"
