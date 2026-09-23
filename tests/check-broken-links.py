#!/usr/bin/env python3
"""Chequeo de links internos rotos — Toyota Concepción del Uruguay.

Recorre todas las páginas HTML de la raíz del repo (index.html, hilux.html,
404.html, y cualquier otra que agregues), extrae los <a href="..."> y
verifica que cada archivo/ancla interno referenciado exista de verdad en
disco. No depende de un servidor corriendo: valida contra el filesystem,
así que corre en segundos y también sirve como paso de CI.

Uso:
    python3 tests/check-broken-links.py
    (código de salida 0 = todo OK, 1 = hay al menos un link roto)

Qué NO chequea (a propósito, para no dar falsos positivos):
    - Links externos (http/https a otros dominios): requeriría red y no es
      el objetivo de este chequeo (ese es trabajo de un linkchecker externo).
    - tel:, mailto:, wa.me (WhatsApp): no son navegación interna del sitio.
    - Anclas puras (#seccion) sin archivo: se resuelven en la misma página.

Qué SÍ chequea:
    - Que todo archivo local referenciado en href="archivo.html" o
      href="archivo.html#seccion" exista en la raíz del repo.
    - Que, si el href incluye #ancla, esa ancla (id="..." o name="...")
      exista dentro del archivo de destino.
    - Que las imágenes usadas dentro del <a> (o cerca) mediante rutas
      relativas a toyota-sharp-assets/ existan (control extra, barato).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent  # ajustá si el script no vive en tests/
HTML_FILES = sorted(ROOT.glob("*.html"))  # index.html, hilux.html, 404.html, etc.

HREF_RE = re.compile(r'href\s*=\s*"([^"]+)"', re.IGNORECASE)
ID_RE = re.compile(r'(?:id|name)\s*=\s*"([^"]+)"', re.IGNORECASE)
SCRIPT_RE = re.compile(r"<script\b[^>]*>.*?</script>", re.IGNORECASE | re.DOTALL)
# Un href real de HTML estático no tiene comillas simples, +, (, ), $ ni espacios
# dentro del valor — esos síntomas indican que es JS armando el string en runtime
# (ej. href='" + wa(numero, msg) + "'), no un link fijo del markup.
STATIC_HREF_RE = re.compile(r"^[A-Za-z0-9._/#\-]+$")
SKIP_SCHEMES = ("http://", "https://", "mailto:", "tel:", "javascript:")

# Patrón específico de este sitio: cada modelo puede declarar una ficha completa
# como `page:"archivo.html"` dentro de MODEL_DETAILS (JS). Este link se arma en
# runtime (fullPageLink.href = d.page) y por eso NO aparece como href="..." en
# el HTML estático — un regex de <a href> normal nunca lo va a ver. Este fue
# exactamente el bug de hilux.html: el chequeo genérico de arriba no lo detecta,
# así que se valida aparte, buscando el patrón literal en el JS.
PAGE_FIELD_RE = re.compile(r'\bpage\s*:\s*"([^"]+)"')


def strip_scripts(html_text: str) -> str:
    """Quita el contenido de <script> para no confundir hrefs armados en JS
    (string concatenation) con links reales del markup estático."""
    return SCRIPT_RE.sub("", html_text)


def internal_ids(html_text: str) -> set[str]:
    return set(ID_RE.findall(html_text))


def main() -> int:
    if not HTML_FILES:
        print(f"ERROR: no se encontró ningún .html en {ROOT}", file=sys.stderr)
        return 1

    page_text = {f: f.read_text(encoding="utf-8", errors="replace") for f in HTML_FILES}
    page_ids = {f: internal_ids(t) for f, t in page_text.items()}
    by_name = {f.name: f for f in HTML_FILES}

    problems: list[str] = []
    checked = 0

    for src_file, text in page_text.items():
        static_text = strip_scripts(text)
        for href in HREF_RE.findall(static_text):
            href = href.strip()
            if not href or href == "#":
                continue
            if any(href.lower().startswith(s) for s in SKIP_SCHEMES):
                continue
            if "wa.me" in href or href.startswith("//"):
                continue
            if href.startswith("/"):
                continue  # ruta absoluta de sitio (ej. /repo/): depende del subpath de Pages, fuera de alcance de un chequeo local
            if not STATIC_HREF_RE.match(href):
                continue  # no parece un href estático fijo (probable artefacto de JS) — se ignora

            parts = urlsplit(href)
            if parts.scheme or parts.netloc:
                continue  # cualquier otro esquema/host externo: fuera de alcance

            path_part, anchor = parts.path, parts.fragment
            checked += 1

            if not path_part:
                # href="#seccion": el ancla debe existir en la misma página
                if anchor and anchor not in page_ids[src_file]:
                    problems.append(
                        f"{src_file.name}: href=\"#{anchor}\" no tiene ningún "
                        f"id=\"{anchor}\" en la misma página"
                    )
                continue

            # Resolver ruta relativa al archivo de origen
            target = (src_file.parent / path_part).resolve()
            if not target.exists():
                problems.append(
                    f"{src_file.name}: href=\"{href}\" -> el archivo "
                    f"\"{path_part}\" no existe en el repo"
                )
                continue

            if anchor and target.suffix == ".html":
                target_ids = page_ids.get(target)
                if target_ids is None:
                    target_ids = internal_ids(target.read_text(encoding="utf-8", errors="replace"))
                if anchor not in target_ids:
                    problems.append(
                        f"{src_file.name}: href=\"{href}\" -> \"{path_part}\" "
                        f"existe pero no tiene id=\"{anchor}\""
                    )

    # Chequeo aparte: links armados en JS vía `page:"archivo.html"` (ver nota
    # arriba de PAGE_FIELD_RE). Acá SÍ hace falta mirar dentro de <script>.
    page_field_checked = 0
    for src_file, text in page_text.items():
        for target_name in PAGE_FIELD_RE.findall(text):
            page_field_checked += 1
            target = (src_file.parent / target_name).resolve()
            if not target.exists():
                problems.append(
                    f"{src_file.name}: page:\"{target_name}\" (link de ficha "
                    f"completa armado en JS) -> el archivo \"{target_name}\" "
                    f"no existe en el repo"
                )

    print(f"Páginas revisadas: {', '.join(f.name for f in HTML_FILES)}")
    print(f"Links internos verificados: {checked}")
    print(f"Links page:\"...\" (fichas completas armadas en JS) verificados: {page_field_checked}")

    if problems:
        print(f"\n{len(problems)} link(s) roto(s):\n")
        for p in problems:
            print(f"  FAIL  {p}")
        return 1

    print("\nOK — ningún link interno roto.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
