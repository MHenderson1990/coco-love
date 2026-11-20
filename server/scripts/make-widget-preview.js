// Run from the server folder: node scripts/make-widget-preview.js
const sharp = require('sharp');
const path = require('path');

const W = 900;
const H = 600;
const R = 48;
const assets = path.join(__dirname, '../../mobile/assets');
const FONT = 'Helvetica, Arial, sans-serif';

function line(y, text, extra) {
  return `<text x="${W / 2}" y="${y}" text-anchor="middle" font-family="${FONT}" font-size="48" ${extra}>${text}</text>`;
}

const l1 = 'Your peace is a priority,';
const l2 = 'not a luxury.';

const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="blur"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <g filter="url(#blur)" opacity="0.6">
    ${line(H / 2 - 12, l1, 'fill="#000"')}
    ${line(H / 2 + 52, l2, 'fill="#000"')}
  </g>
  ${line(H / 2 - 14, l1, 'fill="#fff"')}
  ${line(H / 2 + 50, l2, 'fill="#fff"')}
</svg>`;

const mask = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${H}" rx="${R}" ry="${R}" fill="#fff"/></svg>`
);

sharp(path.join(assets, 'sage.png'))
  .resize(W, H, { fit: 'cover', position: 'centre' })
  .composite([{ input: Buffer.from(svg) }, { input: mask, blend: 'dest-in' }])
  .png()
  .toFile(path.join(assets, 'widget-preview.png'))
  .then(() => console.log('Wrote mobile/assets/widget-preview.png'))
  .catch((err) => { console.error(err); process.exit(1); });