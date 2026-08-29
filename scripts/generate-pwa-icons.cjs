// Generates the PWA icons (icons/icon-192.png, icons/icon-512.png) from
// icons/icon.png. The output is committed to the repo (used by the
// manifest, GitHub Pages and the Capacitor build).
//
// Run after changing the icon art: node scripts/generate-pwa-icons.cjs
//
// icons/icon.png is the source of truth for the colored launcher icon. It
// should be a square PNG (at least 1024x1024 for best results). To swap
// the icon, drop a new icons/icon.png in place and re-run this script.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', 'icons', 'icon.png');
const OUT = path.join(__dirname, '..', 'icons');

async function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error('Icon source not found: ' + SOURCE + '. Drop a 1024x1024 PNG there first.');
  }
  fs.mkdirSync(OUT, { recursive: true });

  // PNG → PNG at 192 and 512, used by the manifest and the iOS apple-
  // touch-icon link in index.html.
  for (const size of [192, 512]) {
    await sharp(SOURCE)
      .resize(size, size)
      .png()
      .toFile(path.join(OUT, `icon-${size}.png`));
  }
  console.log('PWA icons generated in icons/ (icon-192.png, icon-512.png).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
