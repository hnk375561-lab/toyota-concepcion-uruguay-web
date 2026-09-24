// scripts/lib/schema.mjs
//
// Fuente única de verdad para el FAQPage y el BreadcrumbList JSON-LD de cada
// ficha de modelo. En vez de mantener el texto de las preguntas duplicado a
// mano en un <script type="application/ld+json"> (que se desincroniza apenas
// alguien edita el acordeón de FAQ en el body), este módulo LEE el FAQ real
// del HTML ya renderizado y genera el schema a partir de ahí.
//
// Se usa desde dos lugares:
//   - scripts/generate-model-pages.mjs: al crear una ficha nueva desde la plantilla.
//   - scripts/sync-schema.mjs: para volver a sincronizar una ficha ya existente
//     (por ejemplo hilux.html) después de editar su FAQ a mano.

const FAQ_ITEM_RE =
  /<div class="faq-item">\s*<button class="faq-q"[^>]*>([\s\S]*?)<span class="faq-logo-tile"[\s\S]*?<\/button>\s*<div class="faq-a"[^>]*>\s*<p>([\s\S]*?)<\/p>\s*<\/div>\s*<\/div>/g;

const CANONICAL_RE = /<link href="([^"]+)" rel="canonical"\/?>/;
const BREADCRUMB_NAME_RE = /<span aria-current="page">([\s\S]*?)<\/span>/;

const ENTITY_MAP = {
  '&ldquo;': '\u201c',
  '&rdquo;': '\u201d',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&mdash;': '\u2014',
  '&ndash;': '\u2013',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&Prime;': '\u2033',
  '&nbsp;': ' '
};

function decodeEntities(text) {
  let out = text;
  for (const [entity, char] of Object.entries(ENTITY_MAP)) {
    out = out.split(entity).join(char);
  }
  return out.replace(/<[^>]+>/g, '').trim();
}

/** Extrae [{question, answer}] leyendo los .faq-item tal como están en el HTML. */
export function extractFaqItems(html) {
  const items = [];
  for (const match of html.matchAll(FAQ_ITEM_RE)) {
    const question = decodeEntities(match[1]);
    const answer = decodeEntities(match[2]);
    if (question && answer) items.push({ question, answer });
  }
  return items;
}

/** Arma el objeto FAQPage (o null si la ficha no tiene FAQ todavía). */
export function buildFaqPageSchema(html) {
  const items = extractFaqItems(html);
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  };
}

/** Arma el BreadcrumbList a partir del canonical y el nombre visible en el breadcrumb. */
export function buildBreadcrumbSchema(html, { siteRoot = 'https://hnk375561-lab.github.io/toyota-concepcion-uruguay-web/' } = {}) {
  const canonicalMatch = html.match(CANONICAL_RE);
  const nameMatch = html.match(BREADCRUMB_NAME_RE);
  if (!canonicalMatch || !nameMatch) return null;
  const pageUrl = canonicalMatch[1];
  const modelName = decodeEntities(nameMatch[1]);
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${siteRoot}index.html` },
      { '@type': 'ListItem', position: 2, name: 'Vehículos', item: `${siteRoot}index.html#gama` },
      { '@type': 'ListItem', position: 3, name: modelName, item: pageUrl }
    ]
  };
}

function scriptBlock(obj) {
  // </script> dentro de un string de JSON rompería el HTML; se escapa por las dudas.
  const json = JSON.stringify(obj, null, 2).replace(/<\/script/g, '<\\/script');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

function replaceMarkerBlock(html, markerName, innerHtml) {
  const start = `<!-- AUTO:${markerName}:START (generado por scripts/sync-schema.mjs — no editar a mano, correr \`npm run sync-schema\`) -->`;
  const end = `<!-- AUTO:${markerName}:END -->`;
  const re = new RegExp(
    `${start.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${end.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`
  );
  if (!re.test(html)) {
    throw new Error(`No se encontraron los markers AUTO:${markerName}:START/END en el HTML. Agregalos antes de correr el sync.`);
  }
  const replacement = innerHtml ? `${start}\n${innerHtml}\n${end}` : `${start}\n${end}`;
  return html.replace(re, replacement);
}

/**
 * Reemplaza el contenido entre los markers AUTO:FAQPAGE y AUTO:BREADCRUMB
 * de un HTML ya generado, a partir de su propio contenido (FAQ visible,
 * canonical, nombre del breadcrumb). Devuelve { html, faqCount, hasBreadcrumb }.
 */
export function syncSchemaInHtml(html) {
  const faqSchema = buildFaqPageSchema(html);
  const breadcrumbSchema = buildBreadcrumbSchema(html);

  let out = html;
  out = replaceMarkerBlock(out, 'FAQPAGE', faqSchema ? scriptBlock(faqSchema) : '');
  out = replaceMarkerBlock(out, 'BREADCRUMB', breadcrumbSchema ? scriptBlock(breadcrumbSchema) : '');

  return {
    html: out,
    faqCount: faqSchema ? faqSchema.mainEntity.length : 0,
    hasBreadcrumb: Boolean(breadcrumbSchema)
  };
}
