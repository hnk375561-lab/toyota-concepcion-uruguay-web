#!/usr/bin/env bash
# Genera dist/ con SOLO lo que se publica en GitHub Pages.
#
#   bash scripts/build.sh              # dist/ + reporte de assets (crawl en 4 viewports)
#   SKIP_CRAWL=1 bash scripts/build.sh # dist/ + reporte solo estático (sin navegador)
#
# dist/ contiene: index.html, 404.html, toyota-sharp-assets/ (completo, sin
# borrar variantes) y .nojekyll. Además, si existen en la raíz (los crea
# golive/golive.sh), robots.txt y sitemap.xml. Nada de tests/, golive/, scripts/,
# README ni .github/ llega a dist/.
#
# El reporte de assets sin referencia queda en build-report/ (fuera de dist/).
# Este script no borra nada del repositorio; solo recrea dist/ y build-report/.
# Códigos de salida: 0 OK · 1 falta un archivo requerido o un asset referenciado.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST="$ROOT/dist"
REPORT="$ROOT/build-report"

fail() { echo "ERROR: $*" >&2; exit 1; }

for required in index.html 404.html toyota-sharp-assets; do
  [[ -e "$ROOT/$required" ]] || fail "falta $required en la raíz del repo"
done
command -v python3 >/dev/null 2>&1 || fail "falta python3"

# dist/ es siempre <repo>/dist; se recrea de cero (nunca fuera del repo).
[[ "$DIST" == "$ROOT/dist" && -n "$ROOT" ]] || fail "ruta de dist inesperada: $DIST"
rm -rf "$DIST" "$REPORT"
mkdir -p "$DIST"

cp "$ROOT/index.html" "$ROOT/404.html" "$DIST/"
cp -R "$ROOT/toyota-sharp-assets" "$DIST/toyota-sharp-assets"
: > "$DIST/.nojekyll"
for optional in robots.txt sitemap.xml; do
  [[ -f "$ROOT/$optional" ]] && cp "$ROOT/$optional" "$DIST/$optional"
done

# Verificación: dist/ solo puede tener estas entradas en su raíz.
unexpected="$(cd "$DIST" && find . -mindepth 1 -maxdepth 1 \
  ! -name index.html ! -name 404.html ! -name toyota-sharp-assets ! -name .nojekyll \
  ! -name robots.txt ! -name sitemap.xml -print)"
[[ -z "$unexpected" ]] || fail "entradas inesperadas en dist/: $unexpected"

echo "dist/ generado:"
( cd "$DIST" && ls -A | sed 's/^/  /' )
echo "  toyota-sharp-assets: $(find "$DIST/toyota-sharp-assets" -type f | wc -l | tr -d ' ') archivos"

echo "Reporte de assets sin referencia:"
report_args=(--dist "$DIST" --out "$REPORT")
[[ "${SKIP_CRAWL:-0}" == "1" ]] && report_args+=(--no-crawl)
python3 "$ROOT/scripts/asset-report.py" "${report_args[@]}" || fail "hay assets referenciados que no existen (ver arriba)"
echo "  detalle: build-report/unreferenced-assets.md"
echo "Build OK."
