// Builds the shareable single-file version of Insight from the multi-file
// PWA: inlines every CSS file in css/, every JS module in js/, and the
// i18n JSON dictionaries into dist/insight.html. The result works from
// file:// with no server.
//
// Usage: node scripts/build-single.cjs

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const version = require(path.join(root, 'package.json')).version;

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// Inline CSS — replace the <link rel="stylesheet"> tags with <style>.
// Multiple files are concatenated in <link> order.
const cssLinks = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"\s*\/?>/g)];
for (const match of cssLinks) {
  const cssPath = path.join(root, match[1]);
  const css = fs.readFileSync(cssPath, 'utf8');
  html = html.replace(match[0], `<style>\n${css}\n</style>`);
}

// Inline JS — read the entry module and concatenate everything it
// imports. We walk the static import graph by parsing the source
// files. ES modules are inserted in dependency order, with the
// <script type="module"> wrapper replaced.
const inlineJs = (code) =>
  '<script type="module">\n' + code.replace(/<\/script/gi, '<\\/script') + '\n</script>';

const importRegex = /import\s+(?:[^'"]*from\s+)?['"]([^'"]+)['"]/g;
const loaded = new Map();

function loadModule(rel) {
  const abs = path.join(root, rel);
  if (loaded.has(abs)) return loaded.get(abs);
  loaded.set(abs, '');
  let src = fs.readFileSync(abs, 'utf8');
  const imports = [];
  let m;
  while ((m = importRegex.exec(src)) !== null) {
    const spec = m[1];
    if (!spec.startsWith('.')) continue;       // bare import — leave as-is
    const dir = path.dirname(abs);
    const resolved = path.relative(root, path.normalize(path.join(dir, spec)));
    imports.push({ from: m[0], to: resolved });
  }
  for (const { from, to } of imports) {
    const imported = loadModule(to);
    src = src.replace(from, imported);
  }
  loaded.set(abs, src);
  return src;
}

const scriptRegex = /<script\s+type="module"\s+src="([^"]+)"\s*><\/script>/;
const scriptMatch = html.match(scriptRegex);
if (scriptMatch) {
  const entry = loadModule(scriptMatch[1]);
  html = html.replace(scriptMatch[0], inlineJs(entry));
}

// Inline the i18n JSON files as a global object the loader can read
// synchronously (no fetch in file:// contexts). build-single injects
// `window.__INSIGHT_I18N__ = { en: {...}, fa: {...} }` before the
// module script runs; the loader checks for it as a fallback.
const enDict = JSON.parse(fs.readFileSync(path.join(root, 'i18n/en.json'), 'utf8'));
const faDict = JSON.parse(fs.readFileSync(path.join(root, 'i18n/fa.json'), 'utf8'));
const i18nBootstrap =
  '<script>\n' +
  'window.__INSIGHT_I18N__ = ' + JSON.stringify({ en: enDict, fa: faDict }) + ';\n' +
  '</script>';
html = html.replace('<script type="module">', i18nBootstrap + '\n<script type="module">');

// The PWA manifest, service worker, and any local-file icon links are
// not useful in the single-file build (no installable PWA, no offline
// cache, no local file:// resources to point to). Drop them so the
// file works from file:// without 404s in the dev console.
html = html.replace(/<link rel="manifest"[^>]*>\s*/g, '');
html = html.replace(/<link rel="icon"[^>]*>\s*/g, '');
html = html.replace(/<link rel="apple-touch-icon"[^>]*>\s*/g, '');
html = html.replace(
  /<title>([^<]*)<\/title>/,
  `<title>$1 (single-file build v${version})</title>`,
);

// Sanity: no un-replaced markers left.
for (const marker of [
  'href="css/',
  'src="js/',
  'href="i18n/',
]) {
  if (html.includes(marker)) {
    throw new Error(`build-single: un-replaced reference left in output: ${marker}`);
  }
}

const outDir = path.join(root, 'dist');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'insight.html'), html);
console.log(`Built dist/insight.html (single file, v${version}).`);
