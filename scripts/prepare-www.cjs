// Copies the multi-file PWA into www/ for Capacitor (see capacitor.config.json).
// Mirrors the file layout piecework uses: a flat root with the same
// files, plus the css/, js/, i18n/, data/, and assets/ directories.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'www');
const version = require(path.join(root, 'package.json')).version;

const files = [
  'index.html',
  'manifest.webmanifest',
  'package.json',
  'sw.js',
];
const directories = ['css', 'js', 'i18n', 'data', 'icons'];

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}

for (const directory of directories) {
  fs.cpSync(path.join(root, directory), path.join(out, directory), { recursive: true });
}

// Bump the service worker cache name from package.json so each release
// gets a fresh offline cache. Mirrors the lyric-sync behaviour.
const swPath = path.join(out, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace(/const CACHE = .*/, `const CACHE = "insight-v${version}";`);
fs.writeFileSync(swPath, sw);

console.log(`Prepared Capacitor web assets in www/ (sw cache insight-v${version}).`);
