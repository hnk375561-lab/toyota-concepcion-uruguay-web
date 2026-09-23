#!/usr/bin/env bash
# Prepara el sitio para indexación en un dominio propio.
#
#   DOMAIN=www.ejemplo.com.ar ./golive/golive.sh [--dry-run] [--yes]
#   ./golive/golive.sh --domain www.ejemplo.com.ar --dry-run
#
# Requiere: python3, beautifulsoup4 y lxml  (pip install beautifulsoup4 lxml)
# Códigos de salida: 0 OK · 1 falló una verificación (no se escribe nada) ·
#                    2 uso/dependencias · 3 error de lectura/edición.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOMAIN="${DOMAIN:-}"
DRY=0
YES=0

usage() {
  cat >&2 <<'EOF'
Uso: DOMAIN=www.ejemplo.com.ar ./golive/golive.sh [--dry-run] [--yes]
     ./golive/golive.sh --domain www.ejemplo.com.ar [--dry-run] [--yes]

  --domain D    dominio final (alternativa a la variable DOMAIN)
  --dry-run     muestra los cambios y verifica el resultado sin escribir nada
  --yes, -y     no pide confirmación (para CI); con --dry-run nunca la pide
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run|-n) DRY=1 ;;
    --yes|-y)     YES=1 ;;
    --domain)     [[ $# -ge 2 ]] || { usage; exit 2; }; DOMAIN="$2"; shift ;;
    --domain=*)   DOMAIN="${1#--domain=}" ;;
    -h|--help)    usage; exit 0 ;;
    *)            echo "Argumento desconocido: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

if [[ -z "$DOMAIN" ]]; then usage; exit 2; fi
command -v python3 >/dev/null 2>&1 || { echo "Falta python3." >&2; exit 2; }
python3 -c 'import bs4, lxml.html' 2>/dev/null || {
  echo "Faltan dependencias: pip install beautifulsoup4 lxml" >&2; exit 2; }

if [[ $DRY -eq 0 && $YES -eq 0 ]]; then
  CLEAN="${DOMAIN#http://}"; CLEAN="${CLEAN#https://}"; CLEAN="${CLEAN%%/*}"
  read -r -p "Esto habilita indexación para https://${CLEAN}/. ¿Continuar? [y/N] " answer || answer=""
  [[ "$answer" == "y" || "$answer" == "Y" ]] || { echo "Cancelado."; exit 0; }
fi

export GOLIVE_ROOT="$ROOT" GOLIVE_DOMAIN="$DOMAIN" GOLIVE_DRY="$DRY"
python3 - <<'PY'
import difflib
import json
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import lxml.html
from bs4 import BeautifulSoup

ROOT = Path(os.environ["GOLIVE_ROOT"])
DRY = os.environ["GOLIVE_DRY"] == "1"
INDEX = ROOT / "index.html"
NOT_FOUND = ROOT / "404.html"
INDEXABLE = "index, follow"
JSONLD_KEYS = ("url", "@id", "image")


def die(code, msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(code)


# ---------------------------------------------------------------- dominio
def normalize_domain(raw):
    d = raw.strip().lower()
    for prefix in ("https://", "http://"):
        if d.startswith(prefix):
            d = d[len(prefix):]
    d = d.split("/", 1)[0]
    if not re.fullmatch(r"[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d{1,5})?", d):
        die(2, f"dominio inválido: {raw!r} (ej.: www.ejemplo.com.ar)")
    if d.split(":")[0].endswith("github.io"):
        die(2, "el dominio final no puede ser github.io: es el host de la demo con noindex")
    return d


DOMAIN = normalize_domain(os.environ["GOLIVE_DOMAIN"])
BASE = f"https://{DOMAIN}/"


# ------------------------------------------------- localización exacta en el fuente
# No se reserializa el documento con str(soup): BeautifulSoup reordena atributos,
# pone en minúsculas <linearGradient>/viewBox y "repara" estructura. Se usa para
# UBICAR etiquetas (sourceline/sourcepos) y solo se reemplazan esos bytes.
class _Stop(Exception):
    pass


class _FirstTag(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.raw = None

    def handle_starttag(self, tag, attrs):
        self.raw = self.get_starttag_text()
        raise _Stop

    handle_startendtag = handle_starttag


def raw_start_tag(src, pos, name):
    if src[pos:pos + 1 + len(name)].lower() != "<" + name:
        die(3, f"posición inconsistente para <{name}> (offset {pos}); no se modifica nada")
    parser = _FirstTag()
    try:
        parser.feed(src[pos:pos + 20000])
    except _Stop:
        pass
    if not parser.raw:
        die(3, f"no se pudo leer la etiqueta <{name}> en el offset {pos}")
    return parser.raw


def line_starts(src):
    offsets, i = [0], src.find("\n")
    while i != -1:
        offsets.append(i + 1)
        i = src.find("\n", i + 1)
    return offsets


def find_ci(src, needle, start=0):
    for variant in (needle, needle.upper()):
        i = src.find(variant, start)
        if i != -1:
            return i
    return -1


# ------------------------------------------------------------ reescritura de URLs
def make_rewriter(old_bases):
    bases = sorted({b for b in old_bases if b and b != BASE}, key=len, reverse=True)

    def rewrite(url):
        u = url.strip()
        if u.startswith(BASE):
            return url
        for old in bases:
            if u.startswith(old):
                return BASE + u[len(old):]
        parts = urlsplit(u)
        if not parts.scheme and not u.startswith("//") and u:  # relativa
            return urljoin(BASE, u)
        return url  # origen ajeno (instagram, toyota.com.ar, ...): no se toca

    return rewrite


def as_base(url):
    """Normaliza una URL del sitio (og:url / canonical) a su raíz terminada en '/'."""
    if not url or not urlsplit(url).scheme:
        return None
    p = urlsplit(url)
    path = p.path if p.path.endswith("/") else p.path.rsplit("/", 1)[0] + "/"
    return f"{p.scheme}://{p.netloc}{path}"


def walk_jsonld(node, rewrite, hits, key=None):
    """Aplica rewrite a url/@id/image (str, lista o ImageObject). Devuelve el nodo nuevo."""
    if isinstance(node, dict):
        return {k: walk_jsonld(v, rewrite, hits, k) for k, v in node.items()}
    if isinstance(node, list):
        return [walk_jsonld(v, rewrite, hits, key) for v in node]
    if isinstance(node, str) and key in JSONLD_KEYS:
        new = rewrite(node)
        if new != node:
            hits.append((node, new))
        return new
    return node


# --------------------------------------------------------------------- main
try:
    src = INDEX.read_text(encoding="utf-8")
except OSError as exc:
    die(3, f"no se pudo leer {INDEX}: {exc}")

soup = BeautifulSoup(src, "html.parser")
head = soup.head
if head is None:
    die(3, "index.html no tiene <head>")
offs = line_starts(src)
edits = []      # (start, end, reemplazo)
changes = []    # descripción legible
warnings = []


def pos_of(tag):
    return offs[tag.sourceline - 1] + tag.sourcepos


def span_of(tag):
    start = pos_of(tag)
    return start, start + len(raw_start_tag(src, start, tag.name))


def meta_by(attr, value):
    return [m for m in soup.find_all("meta") if (m.get(attr) or "").lower() == value]


def set_meta(tag, label, new_value):
    old = tag.get("content", "")
    if old == new_value:
        return
    start, end = span_of(tag)
    tag["content"] = new_value
    edits.append((start, end, str(tag)))
    changes.append(f'{label}: "{old}" -> "{new_value}"')


# 1) robots / googlebot
head_end = find_ci(src, "</head>")
if head_end == -1:
    die(3, "index.html no tiene </head>")
for name in ("robots", "googlebot"):
    found = [m for m in meta_by("name", name) if m.find_parent("head")]
    if found:
        for m in found:
            set_meta(m, f'meta {name}', INDEXABLE)
    else:
        edits.append((head_end, head_end, f'<meta content="{INDEXABLE}" name="{name}"/>\n'))
        changes.append(f'meta {name}: (faltaba) -> "{INDEXABLE}"')

# 2) bases previas del sitio (para reescribir solo URLs propias)
old_bases = []
for m in meta_by("property", "og:url"):
    old_bases.append(as_base(m.get("content", "")))
for l in soup.find_all("link"):
    if "canonical" in [r.lower() for r in (l.get("rel") or [])]:
        old_bases.append(as_base(l.get("href", "")))
rewrite = make_rewriter(old_bases)

# 3) og:url / og:image / twitter:image
og_url = [m for m in meta_by("property", "og:url")]
for m in og_url:
    set_meta(m, "og:url", BASE)
if not og_url:
    edits.append((head_end, head_end, f'<meta content="{BASE}" property="og:url"/>\n'))
    changes.append(f'og:url: (faltaba) -> "{BASE}"')
for m in meta_by("property", "og:image"):
    set_meta(m, "og:image", rewrite(m.get("content", "")))
for m in meta_by("name", "twitter:image"):
    set_meta(m, "twitter:image", rewrite(m.get("content", "")))

# 4) canonical: exactamente uno, dentro de <head>
canon = [l for l in soup.find_all("link")
         if "canonical" in [r.lower() for r in (l.get("rel") or [])]]
link_html = f'<link href="{BASE}" rel="canonical"/>'
if canon:
    keep, extras = canon[0], canon[1:]
    if not keep.find_parent("head"):
        die(3, "existe un canonical fuera de <head>; corregilo a mano antes de continuar")
    if keep.get("href") != BASE:
        start, end = span_of(keep)
        old = keep.get("href", "")
        keep["href"] = BASE
        edits.append((start, end, str(keep)))
        changes.append(f'canonical: "{old}" -> "{BASE}"')
    for extra in extras:
        start, end = span_of(extra)
        if src[end:end + 1] == "\n":
            end += 1
        edits.append((start, end, ""))
        changes.append("canonical duplicado: eliminado")
else:
    anchor = og_url[0] if og_url else None
    if anchor is not None:
        _, end = span_of(anchor)
        edits.append((end, end, "\n" + link_html))
    else:
        edits.append((head_end, head_end, link_html + "\n"))
    changes.append(f'canonical: (faltaba) -> "{BASE}"')

# 5) JSON-LD (url / @id / image)
for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
    start, tag_end = span_of(script)
    body_end = find_ci(src, "</script", tag_end)
    if body_end == -1:
        die(3, "JSON-LD sin </script>")
    text = src[tag_end:body_end]
    try:
        data = json.loads(text)
    except ValueError as exc:
        die(3, f"JSON-LD inválido (línea {script.sourceline}): {exc}")
    hits = []
    new_data = walk_jsonld(data, rewrite, hits)
    if not hits:
        continue
    new_text = text
    for old, new in dict.fromkeys(hits):  # reemplazo literal exacto si es inequívoco
        lit_old, lit_new = json.dumps(old, ensure_ascii=False), json.dumps(new, ensure_ascii=False)
        if text.count(lit_old) == hits.count((old, new)) and lit_old in new_text:
            new_text = new_text.replace(lit_old, lit_new)
        else:
            new_text = None
            break
    if new_text is None or json.loads(new_text) != new_data:
        new_text = "\n" + json.dumps(new_data, ensure_ascii=False, indent=2) + "\n"
    edits.append((tag_end, body_end, new_text))
    for old, new in hits:
        changes.append(f'JSON-LD: "{old}" -> "{new}"')

# 6) aplicar (de atrás hacia adelante; los tramos no deben superponerse)
edits.sort(key=lambda e: (e[0], e[1]))
for a, b in zip(edits, edits[1:]):
    if a[1] > b[0]:
        die(3, "ediciones superpuestas; no se modifica nada")
out = src
for start, end, repl in reversed(edits):
    out = out[:start] + repl + out[end:]

# El sitemap se mantiene alineado con las fichas publicables: index en la raíz
# y cualquier página HTML de modelo, excluyendo únicamente la página 404.
page_paths = [""] + sorted(
    p.name for p in ROOT.glob("*.html") if p.name not in {"index.html", "404.html"}
)
sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + ''.join(f"  <url>\n    <loc>{BASE}{path}</loc>\n  </url>\n" for path in page_paths)
           + "</urlset>\n")
robots = f"User-agent: *\nAllow: /\n\nSitemap: {BASE}sitemap.xml\n"


# ------------------------------------------------ verificación (parser independiente: lxml)
def verify(index_text, notfound_text):
    problems = []
    if re.search("noindex", index_text, re.I):
        problems.append('index.html todavía contiene "noindex"')
    try:
        doc = lxml.html.document_fromstring(index_text)
    except Exception as exc:  # pragma: no cover
        return [f"lxml no pudo parsear index.html: {exc}"]
    for name in ("robots", "googlebot"):
        vals = doc.xpath(f'//head/meta[@name="{name}"]/@content')
        if not vals or any(v.strip().lower() != INDEXABLE for v in vals):
            problems.append(f"meta {name} no es '{INDEXABLE}': {vals}")
    canon_all = doc.xpath('//link[contains(concat(" ", normalize-space(@rel), " "), " canonical ")]')
    canon_head = doc.xpath('//head/link[contains(concat(" ", normalize-space(@rel), " "), " canonical ")]')
    if len(canon_head) != 1 or len(canon_all) != 1:
        problems.append(f"canonical: {len(canon_head)} en <head>, {len(canon_all)} en total (debe ser 1 y 1)")
    elif canon_head[0].get("href") != BASE:
        problems.append(f"canonical apunta a {canon_head[0].get('href')!r}, no a {BASE!r}")
    social = doc.xpath('//meta[starts-with(@property,"og:") or starts-with(@name,"twitter:")]')
    for m in social:
        key = m.get("property") or m.get("name")
        val = m.get("content", "")
        if "github.io" in val:
            problems.append(f"{key} sigue apuntando a github.io: {val}")
    for key in ("og:url", "og:image", "twitter:image"):
        vals = [m.get("content", "") for m in social if (m.get("property") or m.get("name")) == key]
        if not vals:
            problems.append(f"falta {key}")
        elif key == "og:url" and any(v != BASE for v in vals):
            problems.append(f"og:url distinto de {BASE}: {vals}")
        elif any(not v.startswith(BASE) for v in vals):
            problems.append(f"{key} no es una URL absoluta de {DOMAIN}: {vals}")
    for s in doc.xpath('//script[@type="application/ld+json"]'):
        if "github.io" in (s.text or ""):
            problems.append("JSON-LD todavía contiene github.io")
    if notfound_text is None:
        problems.append("falta 404.html")
    else:
        nf = lxml.html.document_fromstring(notfound_text).xpath('//head/meta[@name="robots"]/@content')
        if not any("noindex" in v.lower() for v in nf):
            problems.append("404.html perdió su noindex")
    return problems


notfound_text = NOT_FOUND.read_text(encoding="utf-8") if NOT_FOUND.exists() else None
problems = verify(out, notfound_text)

# --------------------------------------------------------------- informe
print(f"Dominio: {DOMAIN}  ->  {BASE}")
print(f"Modo: {'DRY-RUN (no se escribe nada)' if DRY else 'escritura'}")
if changes:
    print(f"\nCambios en index.html ({len(changes)}):")
    for c in changes:
        print(f"  - {c}")
else:
    print("\nindex.html ya estaba listo: 0 cambios (idempotente).")
if DRY and out != src:
    print("\nDiff de index.html:")
    for line in difflib.unified_diff(src.splitlines(), out.splitlines(), "index.html", "index.html (go-live)", lineterm="", n=0):
        print("  " + line[:200])
for rel, content in (("sitemap.xml", sitemap), ("robots.txt", robots)):
    p = ROOT / rel
    state = "sin cambios" if p.exists() and p.read_text(encoding="utf-8") == content else ("se crearía/actualizaría" if DRY else "escrito")
    print(f"\n{rel}: {state}")
    if DRY:
        print("  " + content.replace("\n", "\n  ").rstrip())

print("\nVerificaciones (lxml sobre el resultado):")
if problems:
    for p in problems:
        print(f"  FAIL  {p}")
    print("\nNO se escribió ningún archivo." if not DRY else "\nDry-run: hay problemas que impedirían el go-live.")
    sys.exit(1)
print('  OK    index.html sin "noindex"; robots y googlebot = "index, follow"')
print("  OK    un solo <link rel=canonical> dentro de <head>")
print("  OK    og:* y twitter:* sin github.io; og:url/og:image/twitter:image absolutas del dominio")
print("  OK    JSON-LD sin github.io")
print("  OK    404.html conserva noindex")

if DRY:
    print("\nDry-run OK: nada escrito.")
    sys.exit(0)

for path, content in ((INDEX, out), (ROOT / "sitemap.xml", sitemap), (ROOT / "robots.txt", robots)):
    if not path.exists() or path.read_text(encoding="utf-8") != content:
        path.write_text(content, encoding="utf-8")

# relectura desde disco: lo que quedó escrito es lo que se verifica
after = verify(INDEX.read_text(encoding="utf-8"), notfound_text)
if after:
    for p in after:
        print(f"  FAIL (disco)  {p}")
    sys.exit(1)
print(f"\nGo-live preparado para {BASE}")
PY
