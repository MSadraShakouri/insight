// Generates Android launcher icons from icons/icon-512.png (colored) and
// icons/icon-monochrome.png (Android 13+ themed glyph) after Capacitor
// creates android/. Covers legacy icons and Android 8+ adaptive icons
// (including the Android 13+ monochrome layer).

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE = path.join(__dirname, '..', 'icons', 'icon-512.png');
// Single-color glyph used by Android themed icons. Optional; falls back
// to the colored source if absent.
const MONO_SOURCE = path.join(__dirname, '..', 'icons', 'icon-monochrome.png');
const RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const BACKGROUND_COLOR = '#1a1623';
const SAFE_ZONE_SCALE = 0.66;

const LEGACY = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const ADAPTIVE = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function renderContainedIcon(outputName, sizeMap, source) {
  for (const [folder, size] of Object.entries(sizeMap)) {
    const dir = path.join(RES, folder);
    fs.mkdirSync(dir, { recursive: true });
    const artSize = Math.round(size * SAFE_ZONE_SCALE);
    const art = await sharp(source).resize(artSize, artSize, { fit: 'contain' }).png().toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: art, left: Math.round((size - artSize) / 2), top: Math.round((size - artSize) / 2) }])
      .png()
      .toFile(path.join(dir, outputName));
  }
}

async function main() {
  if (!fs.existsSync(SOURCE)) throw new Error(`Icon source not found: ${SOURCE}`);

  for (const [folder, size] of Object.entries(LEGACY)) {
    const dir = path.join(RES, folder);
    fs.mkdirSync(dir, { recursive: true });
    const base = sharp(SOURCE).resize(size, size, { fit: 'cover' }).png();
    await base.clone().toFile(path.join(dir, 'ic_launcher.png'));
    await base.clone().toFile(path.join(dir, 'ic_launcher_round.png'));
  }

  await renderContainedIcon('ic_launcher_foreground.png', ADAPTIVE, SOURCE);

  // Monochrome (Android 13+ themed icons). Use the committed PNG if it
  // exists, otherwise fall back to the colored source.
  const monoSource = fs.existsSync(MONO_SOURCE) ? MONO_SOURCE : SOURCE;
  if (!fs.existsSync(MONO_SOURCE)) {
    console.warn('No monochrome source at icons/icon-monochrome.png; using the regular icon as a themed-icon fallback.');
  }
  await renderContainedIcon('ic_launcher_monochrome.png', ADAPTIVE, monoSource);

  const valuesDir = path.join(RES, 'values');
  fs.mkdirSync(valuesDir, { recursive: true });
  fs.writeFileSync(
    path.join(valuesDir, 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${BACKGROUND_COLOR}</color>
</resources>
`
  );

  const anydpiDir = path.join(RES, 'mipmap-anydpi-v26');
  fs.mkdirSync(anydpiDir, { recursive: true });
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
`;
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), xml);
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), xml);

  console.log('Generated Android launcher icons (legacy + adaptive + monochrome).');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
