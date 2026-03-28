const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

function makeSvg(size) {
  const r = size / 2
  const fontSize = Math.round(size * 0.32)
  const rx = Math.round(size * 0.18)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#ff5a36"/>
  <text x="${r}" y="${r + fontSize * 0.36}"
    font-family="Arial,sans-serif" font-weight="900" font-size="${fontSize}"
    fill="white" text-anchor="middle" letter-spacing="-2">CK</text>
</svg>`
}

async function gen(size) {
  const svg = Buffer.from(makeSvg(size))
  const out = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.png`)
  await sharp(svg).png().toFile(out)
  console.log(`Generated ${size}x${size} -> ${out}`)
}

Promise.all([gen(192), gen(512)])
  .then(() => console.log('Done'))
  .catch(e => { console.error(e); process.exit(1) })
