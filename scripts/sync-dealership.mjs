import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'dealership.json'), 'utf8'));
const pages = ['index.html', 'hilux.html', 'templates/model.html'];
const required = [
  data.contact.salesWhatsApp,
  data.contact.servicePhone.replace('+', ''),
  data.contact.partsPhone.replace('+', ''),
  data.contact.tiresPhone.replace('+', ''),
  data.contact.centralPhone.replace('+', ''),
  data.contact.email,
  data.location.address,
  data.location.city
];

function replaceAll(text, pairs) {
  for (const [from, to] of pairs) text = text.split(from).join(to);
  return text;
}

const phonePairs = [
  ['5493442473453', data.contact.salesWhatsApp],
  ['+543442473453', data.contact.servicePhone],
  ['+543442677433', data.contact.partsPhone],
  ['+543442502390', data.contact.tiresPhone],
  ['+543442425212', data.contact.centralPhone],
  ['03442 47-3453', data.contact.servicePhone.replace('+54', '')],
  ['03442 67-7433', data.contact.partsPhone.replace('+54', '')],
  ['03442 50-2390', data.contact.tiresPhone.replace('+54', '')],
  ['03442 42-5212', data.contact.centralPhone.replace('+54', '')],
  ['toyotacdelu@gmail.com', data.contact.email],
  ['9 de Julio 1624', data.location.address]
];

for (const page of pages) {
  const file = path.join(root, page);
  let html = fs.readFileSync(file, 'utf8');
  html = replaceAll(html, phonePairs);
  fs.writeFileSync(file, html);
}

const allText = pages.map((page) => fs.readFileSync(path.join(root, page), 'utf8')).join('\n');
for (const value of required) {
  if (!allText.includes(value)) throw new Error(`Dato centralizado no encontrado en las páginas: ${value}`);
}
console.log(`Datos de dealership sincronizados en ${pages.length} archivos desde data/dealership.json`);
