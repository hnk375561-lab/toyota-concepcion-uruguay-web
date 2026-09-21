#!/usr/bin/env python3
"""Reporte de assets sin referencia de toyota-sharp-assets/ (NO borra nada).

Uso (lo invoca scripts/build.sh):
    python3 scripts/asset-report.py --dist dist --out build-report [--no-crawl]

Método
  1. Estático: extrae toda referencia a `toyota-sharp-assets/...` de index.html,
     404.html y de los .css del propio directorio (url() relativos).
  2. Crawl de red: sirve dist/ en localhost, abre la página en 4 viewports (los
     mismos casos de tests/click-audit.py), recorre el scroll completo, activa
     TODAS las pestañas ([role=tab]) y filtros, recorre los carruseles
     horizontales y registra cada respuesta a /toyota-sharp-assets/*.
  3. Clasifica cada archivo:
       cargado      -> lo pidió el navegador en algún viewport
       referenciado -> está en el código pero Chromium no lo pidió (fallback
                       webp cuando hay avif, otra densidad de pantalla, etc.)
       derivado     -> variante hermana (-800.avif, -480.avif, -480.webp) de un
                       `*-800.webp` referenciado. index.html arma esas URLs en
                       JavaScript (catálogo y destacados), así que se protegen
                       aunque el crawl no las haya pedido
       SIN REFERENCIA -> nada de lo anterior: candidato a revisar

Códigos de salida: 0 ok · 1 hay referencias a archivos que NO existen en dist.
Si el crawl falla (sin Playwright/Chromium) se avisa y el reporte queda solo
con el análisis estático; nunca bloquea el build por eso.
"""
from __future__ import annotations

import argparse
import functools
import http.server
import json
import os
import re
import sys
import threading
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import unquote, urlparse

ASSETS = "toyota-sharp-assets"
REF_RE = re.compile(re.escape(ASSETS) + r"/([^\"'\s)>,;\\`?#]+)")
CSS_URL_RE = re.compile(r"""url\(\s*["']?([^"')\s]+)""")

# (nombre, ancho, alto, reduced_motion, dpr). Anchos/alto/reduced = tests/click-audit.py.
CASES = [
    ("desktop-lenis", 1440, 900, False, 1),
    ("desktop-reduced", 1440, 900, True, 2),
    ("tablet-touch", 820, 1180, True, 2),
    ("mobile-touch", 390, 844, True, 3),
]


def human(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024 or unit == "GB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n:.1f} {unit}"
        n /= 1024
    return f"{n} B"


def list_assets(dist: Path) -> dict[str, int]:
    base = dist / ASSETS
    return {p.relative_to(base).as_posix(): p.stat().st_size for p in sorted(base.rglob("*")) if p.is_file()}


def static_refs(dist: Path) -> set[str]:
    """Rutas relativas a toyota-sharp-assets/ mencionadas en el código publicado."""
    refs: set[str] = set()
    for name in ("index.html", "404.html"):
        f = dist / name
        if f.exists():
            refs.update(unquote(m) for m in REF_RE.findall(f.read_text(encoding="utf-8", errors="replace")))
    base = dist / ASSETS
    for css in sorted(base.rglob("*.css")):
        for raw in CSS_URL_RE.findall(css.read_text(encoding="utf-8", errors="replace")):
            if re.match(r"^(?:[a-z]+:|//|/|#)", raw):
                continue
            target = (css.parent / unquote(raw.split("?")[0].split("#")[0])).resolve()
            try:
                refs.add(target.relative_to(base.resolve()).as_posix())
            except ValueError:
                pass
    return refs


def derived_variants(refs: set[str]) -> set[str]:
    """Variantes que el JS de index.html deriva de un `X-800.webp` (regla conservadora)."""
    out: set[str] = set()
    for r in refs:
        m = re.match(r"(.*)-800\.webp$", r)
        if m:
            out.update(m.group(1) + suffix for suffix in ("-800.avif", "-480.avif", "-480.webp"))
    return out


# ------------------------------------------------------------------ crawl
class _Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):  # sin ruido en consola
        pass


def _launch_kwargs() -> dict:
    kw = {"headless": True, "args": ["--no-sandbox"]}
    path = os.environ.get("CHROMIUM_PATH") or ("/usr/bin/chromium" if os.path.exists("/usr/bin/chromium") else "")
    if path:
        kw["executable_path"] = path
    return kw


_JS_SCROLL_PAGE = """async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const step = Math.max(200, Math.floor(innerHeight * 0.7));
  for (let y = 0; y <= document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await sleep(90); }
  scrollTo(0, 0);
}"""

# Activa el i-ésimo elemento de un selector y recorre su sección (vertical y carruseles).
_JS_ACTIVATE = """async ([sel, i]) => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const el = document.querySelectorAll(sel)[i];
  if (!el) return false;
  el.scrollIntoView({block: 'center'});
  el.click();
  await sleep(250);
  const sec = el.closest('section') || document.body;
  const r = sec.getBoundingClientRect();
  const top = r.top + scrollY, bottom = top + r.height;
  const step = Math.max(200, Math.floor(innerHeight * 0.7));
  for (let y = Math.max(0, top - 80); y < bottom; y += step) { scrollTo(0, y); await sleep(90); }
  for (const h of sec.querySelectorAll('*')) {
    const cs = getComputedStyle(h);
    if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && h.scrollWidth > h.clientWidth + 20 && h.clientWidth > 0) {
      for (let x = 0; x <= h.scrollWidth; x += Math.max(120, Math.floor(h.clientWidth * 0.8))) { h.scrollLeft = x; await sleep(70); }
      h.scrollLeft = 0;
    }
  }
  return true;
}"""

INTERACTIVE = ('[role="tab"]', ".filterbtn", ".access-filter")


def crawl(dist: Path) -> tuple[dict[str, dict[str, int]], dict[str, int], list[str]]:
    """Devuelve (por viewport: ruta->status, resumen de acciones, avisos)."""
    from playwright.sync_api import sync_playwright  # import diferido: es opcional

    handler = functools.partial(_Quiet, directory=str(dist))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_address[1]}"
    per_case: dict[str, dict[str, int]] = {}
    actions: dict[str, int] = {}
    warnings: list[str] = []
    prefix = "/" + ASSETS + "/"
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(**_launch_kwargs())
            for name, w, h, reduced, dpr in CASES:
                ctx = browser.new_context(
                    viewport={"width": w, "height": h},
                    device_scale_factor=dpr,
                    reduced_motion="reduce" if reduced else "no-preference",
                    is_mobile=w <= 820,
                    has_touch=w <= 820,
                )
                page = ctx.new_page()
                seen: dict[str, int] = {}

                def on_response(resp, seen=seen):
                    u = urlparse(resp.url)
                    if f"{u.scheme}://{u.netloc}" == origin and u.path.startswith(prefix):
                        seen[unquote(u.path[len(prefix):])] = resp.status

                page.on("response", on_response)
                page.goto(origin + "/", wait_until="domcontentloaded", timeout=30000)
                page.wait_for_timeout(1800)
                page.evaluate(_JS_SCROLL_PAGE)
                done = 0
                for sel in INTERACTIVE:
                    for i in range(page.locator(sel).count()):
                        try:
                            if page.evaluate(_JS_ACTIVATE, [sel, i]):
                                done += 1
                        except Exception as exc:  # un control roto no debe abortar el crawl
                            warnings.append(f"{name}: {sel}[{i}] {str(exc).splitlines()[0][:120]}")
                page.evaluate(_JS_SCROLL_PAGE)
                page.wait_for_timeout(700)
                actions[name] = done
                per_case[name] = seen
                ctx.close()
            browser.close()
    finally:
        server.shutdown()
    return per_case, actions, warnings


# ------------------------------------------------------------------ main
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dist", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--no-crawl", action="store_true")
    args = ap.parse_args()
    dist, out = Path(args.dist).resolve(), Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    files = list_assets(dist)
    refs = static_refs(dist)
    missing = sorted(r for r in refs if r not in files)

    per_case: dict[str, dict[str, int]] = {}
    actions: dict[str, int] = {}
    crawl_note = "Crawl omitido (--no-crawl): solo análisis estático."
    warnings: list[str] = []
    if not args.no_crawl:
        try:
            per_case, actions, warnings = crawl(dist)
            crawl_note = "Crawl de red ejecutado en 4 viewports."
        except Exception as exc:
            per_case, actions = {}, {}
            crawl_note = f"CRAWL NO EJECUTADO ({type(exc).__name__}: {str(exc).splitlines()[0][:160]}). Solo análisis estático."
            print("AVISO: " + crawl_note, file=sys.stderr)
    crawled = bool(per_case)

    loaded: dict[str, set[str]] = {}
    broken: dict[str, set[str]] = {}
    for case, seen in per_case.items():
        for path, status in seen.items():
            (loaded if status < 400 else broken).setdefault(path, set()).add(case)

    cat_loaded = sorted(f for f in files if f in loaded)
    derived = derived_variants(refs)
    cat_ref = sorted(f for f in files if f not in loaded and f in refs)
    cat_derived = sorted(f for f in files if f not in loaded and f not in refs and f in derived)
    cat_orphan = sorted(f for f in files if f not in loaded and f not in refs and f not in derived)
    dynamic = sorted(f for f in loaded if f in files and f not in refs)
    size = lambda names: sum(files[n] for n in names)  # noqa: E731

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    md = [
        "# Reporte de assets sin referencia",
        "",
        f"Generado: {now}. **Solo informativo: este proceso no borra ni mueve ningún archivo.**",
        "",
        f"- {crawl_note}",
        f"- Total en `{ASSETS}/`: **{len(files)} archivos ({human(size(files))})**",
        f"- Cargados por el navegador: **{len(cat_loaded)}** ({human(size(cat_loaded))})",
        f"- Referenciados en el código pero no pedidos en el crawl: **{len(cat_ref)}** ({human(size(cat_ref))}), no son candidatos",
        f"- Variantes derivadas por el JS de un `-800.webp` referenciado: **{len(cat_derived)}** ({human(size(cat_derived))}), protegidas",
        f"- **Sin referencia (ni en el código ni en la red): {len(cat_orphan)}** ({human(size(cat_orphan))})",
        "",
    ]
    if crawled:
        md += ["## Cobertura del crawl", "", "| Viewport | DPR | Assets pedidos | Controles activados |", "|---|---|---|---|"]
        for name, w, h, reduced, dpr in CASES:
            md.append(f"| {name} ({w}x{h}) | {dpr} | {len(per_case.get(name, {}))} | {actions.get(name, 0)} |")
        md.append("")
    if missing:
        md += ["## ERROR: referenciados en el código y ausentes en dist", ""] + [f"- `{ASSETS}/{m}`" for m in missing] + [""]
    if broken:
        md += ["## Pedidos con error HTTP durante el crawl", ""] + [f"- `{ASSETS}/{p}` ({', '.join(sorted(v))})" for p, v in sorted(broken.items())] + [""]
    md += [f"## Sin referencia: candidatos a revisar ({len(cat_orphan)})", ""]
    if cat_orphan:
        md += ["| Archivo | Tamaño |", "|---|---|"] + [f"| `{ASSETS}/{f}` | {human(files[f])} |" for f in cat_orphan]
    else:
        md.append("Ninguno.")
    md += [
        "",
        "Cómo leer esto: el crawl solo ve lo que el navegador pide en los 4 viewports y en las pestañas/filtros recorridos; "
        "un archivo que solo se pida en un estado no ejercitado (hover, otro navegador, una densidad de pantalla no probada) aparecería acá. "
        "Antes de eliminar cualquiera: confirmá que ningún otro origen lo usa (redes, emails, Google Business) y volvé a correr los tests.",
        "",
    ]
    if dynamic:
        md += ["## Cargados sin estar escritos literalmente en el código (referencia dinámica)", ""] + [f"- `{ASSETS}/{f}`" for f in dynamic] + [""]
    md += [f"<details><summary>Variantes derivadas por el JS, no pedidas en el crawl ({len(cat_derived)})</summary>", "",
           "Sale de aplicar a cada `X-800.webp` referenciado las reglas de `index.html` (`-800.avif`, `-480.avif`, `-480.webp`). "
           "La regla es conservadora: solo el catálogo/destacados (`foto:`) las usa de verdad; si un `<picture>` estático no las referencia, "
           "sus variantes hermanas son candidatas en una segunda pasada.", ""]
    md += [f"- `{ASSETS}/{f}`" for f in cat_derived] + ["", "</details>", ""]
    md += [f"<details><summary>Referenciados pero no pedidos en el crawl ({len(cat_ref)})</summary>", ""]
    md += [f"- `{ASSETS}/{f}`" for f in cat_ref] + ["", "</details>", ""]
    if warnings:
        md += ["## Avisos del crawl", ""] + [f"- {w}" for w in warnings[:40]] + [""]

    (out / "unreferenced-assets.md").write_text("\n".join(md), encoding="utf-8")
    (out / "unreferenced-assets.txt").write_text("".join(f"{ASSETS}/{f}\n" for f in cat_orphan), encoding="utf-8")
    (out / "unreferenced-assets.json").write_text(json.dumps({
        "generated": now, "crawled": crawled, "total": len(files), "loaded": len(cat_loaded),
        "referenced_not_loaded": len(cat_ref), "derived_not_loaded": cat_derived, "unreferenced": cat_orphan, "missing_in_dist": missing,
        "broken_requests": sorted(broken),
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"  assets: {len(files)} · cargados {len(cat_loaded)} · referenciados sin cargar {len(cat_ref)} · derivados {len(cat_derived)} · SIN REFERENCIA {len(cat_orphan)} ({human(size(cat_orphan))})")
    print(f"  {crawl_note}")
    if broken:
        print(f"  AVISO: {len(broken)} assets respondieron con error HTTP durante el crawl", file=sys.stderr)
    if missing:
        print(f"  ERROR: {len(missing)} assets referenciados no existen en dist:", file=sys.stderr)
        for m in missing[:20]:
            print(f"    - {ASSETS}/{m}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
