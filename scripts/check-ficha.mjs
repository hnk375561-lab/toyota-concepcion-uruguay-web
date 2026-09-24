// scripts/check-ficha.mjs
//
// Linter de fichas de modelo (hilux.html y sus clones). Uso:
//   node scripts/check-ficha.mjs                 -> revisa el slug.html de cada modelo de data/models.json
//   node scripts/check-ficha.mjs hilux.html      -> revisa archivos concretos
// Sale con código 1 si encuentra errores. Los avisos (⚠) no rompen.
//
// Qué atrapa (todo esto ya pasó en hilux.html):
//   · placeholders de la plantilla ([Completar …], {{…}}) sin resolver
//   · clases usadas en el HTML que no tienen ninguna regla en model-ficha.css
//   · aria-label en <div>/<span> sin role, y <figure role> con <figcaption> (errores del validador Nu)
//   · anclas de la nav de la ficha que apuntan a un id inexistente
//   · JSON-LD inválido, FAQPage desincronizado del FAQ visible, availability InStock sin verificar
//   · "Consulta: <fecha>" distinta de dataPolicy.consultedAt de data/models.json
//   · afirmaciones que ya se sabe que contradicen la ficha oficial (lista CLAIMS_PROHIBIDAS)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const models = JSON.parse(fs.readFileSync(path.join(root, 'data', 'models.json'), 'utf8'));
const css = fs.readFileSync(path.join(root, 'toyota-sharp-assets', 'model-ficha.css'), 'utf8');

// Clases que usa el JS o el sitio como "ganchos" sin estilo propio en model-ficha.css.
const CLASES_SIN_CSS_OK = new Set(['open', 'is-active', 'yes', 'no', 'alt']);

// Datos ya corregidos: si vuelven a aparecer en una ficha de Hilux, algo se rompió.
const CLAIMS_PROHIBIDAS = {
  hilux: [
    [/12,8 m|13,4 m entre paredes/, 'Radio de giro: 12,8/13,4 m son diámetros; el radio oficial es 6,7 m.'],
    [/\+140\/\+150/, 'Trocha GR-Sport: Toyota publica +140/+155 mm.'],
    [/\bAHB\b/, 'Toyota Safety Sense: la ficha oficial lista ACC, PCS y LDA (sin AHB).'],
    [/2\.910 kg/, 'PBT Doble Cabina: 2.810 kg (4x2) y 3.090 kg (4x4).'],
    [/1\.835 mm/, 'Alto 4x4 de 1.835 mm: no figura en la ficha oficial (1.815 mm).'],
    [/ópticas halógenas en DX, SR y SRV/i, 'La SRV ya trae Bi-LED.'],
    [/\+20 mm sobre/, 'El "+20 mm de despeje" es dudoso: la SRX renovada publica 247 mm en medios especializados.'],
    [/availability"\s*:\s*"https:\/\/schema\.org\/InStock/, 'availability InStock sin poder verificarlo.'],
  ],
};

const errores = [];
const avisos = [];
const err = (f, m) => errores.push(`${f}: ${m}`);
const warn = (f, m) => avisos.push(`${f}: ${m}`);

function claseEnCss(nombre) {
  const esc = nombre.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(`\\.${esc}(?![\\w-])`).test(css);
}

function revisar(archivo) {
  const ruta = path.isAbsolute(archivo) ? archivo : path.join(root, archivo);
  const f = path.basename(ruta);
  if (!fs.existsSync(ruta)) return err(f, 'no existe');
  const html = fs.readFileSync(ruta, 'utf8');
  const slug = f.replace(/\.html$/, '');
  const model = models.find((m) => m.slug === slug);

  // 1) placeholders
  for (const m of new Set(html.match(/\[Completar[^\]]*\]|\{\{[A-Z0-9_]+\}\}|\bTODO\b|lorem ipsum/g) || [])) err(f, `placeholder sin resolver: ${m}`);

  // 2) clases sin CSS
  const usadas = new Set();
  for (const [, v] of html.matchAll(/\sclass="([^"]+)"/g)) v.split(/\s+/).filter(Boolean).forEach((c) => usadas.add(c));
  const sinCss = [...usadas].filter((c) => !CLASES_SIN_CSS_OK.has(c) && !claseEnCss(c) && !new RegExp(`\\.${c}\\b`).test(html));
  if (sinCss.length) err(f, `clases sin regla en model-ficha.css: ${sinCss.sort().join(', ')}`);

  // 3) errores típicos del validador Nu
  for (const [, nombre, attrs] of html.matchAll(/<(div|span)\b([^>]*\saria-label=[^>]*)>/g)) {
    if (!/\srole=/.test(attrs)) err(f, `<${nombre}> con aria-label sin role: ${attrs.trim().slice(0, 70)}`);
  }
  for (const [bloque] of html.matchAll(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)) {
    if (/^<figure\b[^>]*\srole=/.test(bloque) && /<figcaption/.test(bloque)) err(f, '<figure role> con <figcaption> (usá un <div role="region"> alrededor)');
  }

  // 4) anclas de la nav de la ficha
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
  const nav = html.match(/<nav class="ficha-jumpnav"[\s\S]*?<\/nav>/);
  if (nav) for (const [, id] of nav[0].matchAll(/href="#([^"]+)"/g)) if (!ids.has(id)) err(f, `la nav de la ficha apunta a #${id}, que no existe`);
  for (const id of ['ficha-tecnica', 'preguntas-frecuentes', 'datos-verificados', 'fuentes']) if (!ids.has(id)) err(f, `falta la sección #${id}`);

  // 5) JSON-LD
  const bloques = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const ld = [];
  bloques.forEach((b, i) => { try { ld.push(JSON.parse(b)); } catch (e) { err(f, `JSON-LD #${i + 1} inválido: ${e.message}`); } });
  const faq = ld.find((x) => x['@type'] === 'FAQPage');
  const visibles = [...html.matchAll(/<button class="faq-q"[^>]*>([\s\S]*?)<span class="faq-logo-tile"/g)].map((m) => m[1].replace(/&ldquo;|&rdquo;/g, '').replace(/<[^>]+>/g, '').trim());
  if (!faq) err(f, 'falta el FAQPage (corré npm run sync-schema)');
  else if (faq.mainEntity.length !== visibles.length) err(f, `FAQPage tiene ${faq.mainEntity.length} preguntas y la página muestra ${visibles.length}: corré npm run sync-schema`);
  if (!ld.some((x) => x['@type'] === 'BreadcrumbList')) err(f, 'falta el BreadcrumbList');
  const veh = ld.find((x) => x['@type'] === 'Vehicle');
  if (!veh) warn(f, 'sin JSON-LD Vehicle');
  else for (const k of ['vehicleEngine', 'wheelbase', 'fuelCapacity']) if (!veh[k]) warn(f, `Vehicle sin ${k}`);

  // 6) fecha de consulta
  if (model) {
    const iso = model.dataPolicy?.consultedAt;
    const m = html.match(/Consulta:<\/strong>\s*(\d{1,2}) de (\w+) de (\d{4})/);
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    if (m && iso) {
      const esperado = `${m[3]}-${String(meses.indexOf(m[2]) + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      if (esperado !== iso) err(f, `"Consulta: ${m[0].split('</strong>')[1].trim()}" no coincide con dataPolicy.consultedAt (${iso})`);
    }
    const fuentes = (model.sources || []).filter((s) => s.consultedAt && s.consultedAt !== iso);
    if (fuentes.length) warn(f, `fuentes de models.json con consultedAt distinto de ${iso}: ${fuentes.map((s) => s.id).join(', ')}`);
    if (model.handAuthored !== true && /id="datos-verificados"/.test(html) && !/\[Completar/.test(html)) {
      warn(f, 'la ficha parece armada a mano pero models.json no tiene handAuthored:true: el build la puede pisar con la plantilla');
    }
  } else warn(f, `no hay entrada "${slug}" en data/models.json`);

  // 7) afirmaciones prohibidas
  const texto = html.replace(/<script[\s\S]*?<\/script>/g, (s) => (s.includes('ld+json') ? s : '')).replace(/<(?!\/?script)[^>]+>/g, ' ');
  for (const [re, msg] of CLAIMS_PROHIBIDAS[slug] || []) if (re.test(texto)) err(f, `afirmación conocida como incorrecta → ${msg}`);
}

const args = process.argv.slice(2);
const objetivos = args.length ? args : models.map((m) => `${m.slug}.html`).filter((f) => fs.existsSync(path.join(root, f)));
if (!objetivos.length) { console.log('No hay fichas para revisar.'); process.exit(0); }
objetivos.forEach(revisar);

for (const a of avisos) console.warn(`  ⚠ ${a}`);
for (const e of errores) console.error(`  ✘ ${e}`);
console.log(errores.length ? `\ncheck-ficha: ${errores.length} error(es).` : `check-ficha: OK (${objetivos.join(', ')}).`);
process.exit(errores.length ? 1 : 0);
