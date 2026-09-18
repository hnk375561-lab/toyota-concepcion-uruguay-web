const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const sharp = require('/tmp/toyota-sharp-pipeline/node_modules/sharp');
(async function(){

const input = process.argv[2];
const outputHtml = process.argv[3];
const outputDir = process.argv[4];
if (!input || !outputHtml || !outputDir) {
  console.error('Usage: node optimize-images-sharp.js input.html output.html assets-dir');
  process.exit(2);
}

const html = await fs.readFile(input, 'utf8');
const dataPattern = /data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\r\n]+)/g;
const unique = new Map();
const occurrences = [];
let match;
while ((match = dataPattern.exec(html))) {
  const mime = match[1].toLowerCase();
  const payload = match[2].replace(/\s+/g, '');
  const raw = Buffer.from(payload, 'base64');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  if (!unique.has(hash)) unique.set(hash, { hash, mime, raw, firstIndex: occurrences.length + 1 });
  occurrences.push({ start: match.index, end: dataPattern.lastIndex, hash });
}
await fs.mkdir(outputDir, { recursive: true });
const manifest = { input: path.basename(input), generatedAt: new Date().toISOString(), sourceOccurrences: occurrences.length, uniqueAssets: [], totalSourceBytes: 0, totalOutputBytes: 0 };
const baseByHash = new Map();

for (const asset of unique.values()) {
  const image = sharp(asset.raw, { failOn: 'none' });
  const metadata = await image.metadata();
  const base = `toyota-sharp-assets/asset-${asset.hash.slice(0, 12)}`;
  baseByHash.set(asset.hash, base);
  const isLogo = asset.firstIndex === 1;
  const widths = (isLogo ? [256, 512] : [320, 640, 800]).filter((width) => width <= (metadata.width || width));
  if (!widths.length) widths.push(metadata.width || 320);
  const files = [];
  const quality = isLogo ? { avif: 60, webp: 86, jpeg: 88 } : { avif: 55, webp: 80, jpeg: 84 };
  for (const width of widths) {
    const stem = path.join(outputDir, `asset-${asset.hash.slice(0, 12)}-${width}`);
    const basePipeline = () => sharp(asset.raw, { failOn: 'none' }).rotate().resize({ width, withoutEnlargement: true, fit: 'inside' });
    const avifPath = `${stem}.avif`;
    const webpPath = `${stem}.webp`;
    const jpegPath = `${stem}.jpg`;
    await basePipeline().avif({ quality: quality.avif, effort: 6, chromaSubsampling: '4:4:4' }).toFile(avifPath);
    await basePipeline().webp({ quality: quality.webp, effort: 6 }).toFile(webpPath);
    await basePipeline().jpeg({ quality: quality.jpeg, mozjpeg: true, progressive: true }).toFile(jpegPath);
    for (const file of [avifPath, webpPath, jpegPath]) {
      const stat = await fs.stat(file);
      files.push({ file: path.basename(file), bytes: stat.size });
      manifest.totalOutputBytes += stat.size;
    }
  }
  manifest.totalSourceBytes += asset.raw.length;
  manifest.uniqueAssets.push({
    hash: asset.hash,
    base,
    sourceBytes: asset.raw.length,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    firstOccurrence: asset.firstIndex,
    widths,
    files,
  });
}

const byHash = new Map(manifest.uniqueAssets.map((asset) => [asset.hash, asset]));
function derivative(base, ext, width) { return `${base}-${width}.${ext}`; }
function srcset(base, ext, widths) { return widths.map((width) => `${derivative(base, ext, width)} ${width}w`).join(', '); }
function picture(base, alt, className, loading, width, height, eager = false) {
  const asset = manifest.uniqueAssets.find((item) => item.base === base);
  const widths = asset.widths;
  const cls = className ? ` class="${className}"` : '';
  const safeAlt = String(alt || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const loadingAttr = eager ? ' loading="eager" fetchpriority="high"' : ` loading="${loading || 'lazy'}"`;
  const sizes = className === 'model-photo' ? '(max-width: 700px) 92vw, 360px' : '(max-width: 700px) 92vw, 320px';
  return `<picture class="responsive-picture"><source type="image/avif" srcset="${srcset(base, 'avif', widths)}" sizes="${sizes}"><source type="image/webp" srcset="${srcset(base, 'webp', widths)}" sizes="${sizes}"><img${cls} src="${derivative(base, 'jpg', widths[Math.min(2, widths.length - 1)])}" srcset="${srcset(base, 'jpg', widths)}" sizes="${sizes}" width="${width}" height="${height}" alt="${safeAlt}"${loadingAttr} decoding="async"></picture>`;
}

// Replace embedded payloads with stable, deduplicated base paths.
let transformed = '';
let cursor = 0;
for (const occurrence of occurrences) {
  transformed += html.slice(cursor, occurrence.start);
  transformed += baseByHash.get(occurrence.hash);
  cursor = occurrence.end;
}
transformed += html.slice(cursor);

// Make static images responsive while preserving existing attributes and accessibility text.
const staticImagePattern = /<img\b([^>]*?)\bsrc="(toyota-sharp-assets\/asset-[a-f0-9]{12})"([^>]*)>/g;
transformed = transformed.replace(staticImagePattern, (full, before, base, after) => {
  const asset = manifest.uniqueAssets.find((item) => item.base === base);
  if (!asset) return full;
  const attrs = `${before} ${after}`;
  const altMatch = attrs.match(/\balt="([^"]*)"/);
  const alt = altMatch ? altMatch[1] : '';
  const classMatch = attrs.match(/\bclass="([^"]*)"/);
  const className = classMatch ? classMatch[1] : '';
  const loadMatch = attrs.match(/\bloading="([^"]*)"/);
  const isHero = asset.firstOccurrence === 2;
  const loading = isHero ? 'eager' : (loadMatch ? loadMatch[1] : 'lazy');
  const eager = isHero;
  const extraAttrs = attrs.replace(/\bsrc="[^"]*"/g, '').replace(/\bloading="[^"]*"/g, '').replace(/\bdecoding="[^"]*"/g, '').replace(/\bwidth="[^"]*"/g, '').replace(/\bheight="[^"]*"/g, '').replace(/\bfetchpriority="[^"]*"/g, '').trim();
  const inner = picture(base, alt, className, loading, asset.width, asset.height, eager);
  return inner.replace(`decoding="async"`, `decoding="async"${extraAttrs ? ` ${extraAttrs}` : ''}`);
});

// Dynamic vehicle cards use the same responsive picture primitive as static images.
const assetWidths = Object.fromEntries(manifest.uniqueAssets.map((asset) => [asset.base, asset.widths]));
const helper = `\n(function(){\n  var assetWidths=${JSON.stringify(assetWidths)};\n  window.optimizedPictureMarkup=function(base,alt,className,loading){\n    var root=String(base||'').replace(/\\.[^.]+$/, '');\n    var widths=assetWidths[root]||[320,480,640];\n    var cls=className?' class="'+className+'"':'';\n    var safe=String(alt||'').replace(/&/g,'&amp;').replace(/\\"/g,'&quot;');\n    var sizes=className==='model-photo'?'(max-width: 700px) 92vw, 360px':'(max-width: 700px) 92vw, 320px';\n    var make=function(ext){return widths.map(function(width){return root+'-'+width+'.'+ext+' '+width+'w';}).join(', ');};\n    var fallback=widths[Math.min(2,widths.length-1)];\n    return '<picture class="responsive-picture"><source type="image/avif" srcset="'+make('avif')+'" sizes="'+sizes+'"><source type="image/webp" srcset="'+make('webp')+'" sizes="'+sizes+'"><img'+cls+' src="'+root+'-'+fallback+'.jpg" srcset="'+make('jpg')+'" sizes="'+sizes+'" alt="'+safe+'" loading="'+(loading||'lazy')+'" decoding="async"></picture>';\n  };\n})();\n`;
transformed = transformed.replace('var MODELOS_TOYOTA = [', helper + '\n  var MODELOS_TOYOTA = [');
transformed = transformed.replace("(m.foto ? '<img class=\"model-photo\" src=\"' + m.foto + '\" alt=\"Toyota ' + m.nombre + '\" loading=\"lazy\" decoding=\"async\">' :", "(m.foto ? optimizedPictureMarkup(m.foto, 'Toyota '+m.nombre, 'model-photo', 'lazy') :");
transformed = transformed.replace("'<div class=\"highlight-visual\"><img src=\"'+m.foto+'\" alt=\"Toyota '+m.nombre+'\" loading=\"lazy\" decoding=\"async\"></div>'", "'<div class=\"highlight-visual\">'+optimizedPictureMarkup(m.foto, 'Toyota '+m.nombre, '', 'lazy')+'</div>'");
transformed = transformed.replace('img[src^="data:image/jpeg"]', 'img[src*="toyota-sharp-assets/"]');
transformed = transformed.replace("img[src^=\"data:image/\"]", "img[src*=\"toyota-sharp-assets/\"]");

// Convert every CSS background already normalized to an asset base (including former data URI cta/social backgrounds) to an image-set with modern formats and JPEG fallback.
const backgroundPattern = /url\(['"](toyota-sharp-assets\/asset-[a-f0-9]{12})['"]\)/g;
transformed = transformed.replace(backgroundPattern, (full, base) => { const asset = manifest.uniqueAssets.find((item) => item.base === base); const width = asset ? asset.widths[Math.min(2, asset.widths.length - 1)] : 640; return `image-set(url('${derivative(base, 'avif', width)}') type('image/avif'), url('${derivative(base, 'webp', width)}') type('image/webp'), url('${derivative(base, 'jpg', width)}') type('image/jpeg'))`; });

const hero = manifest.uniqueAssets.find((asset) => asset.firstOccurrence === 2);
if (hero) {
  transformed = transformed.replace('</head>', `<link rel="preload" as="image" type="image/avif" href="${derivative(hero.base, 'avif', hero.widths[hero.widths.length - 1])}" fetchpriority="high">\n</head>`);
}

await fs.writeFile(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
await fs.writeFile(outputHtml, transformed);
console.log(JSON.stringify({ outputHtml, outputDir, sourceOccurrences: occurrences.length, uniqueAssets: unique.size, sourceBytes: manifest.totalSourceBytes, outputBytes: manifest.totalOutputBytes }, null, 2));

})();
