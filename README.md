# Insight

> A word-guessing party game. Find out how well your friends really know you.

Players take turns being the **Subject**. Everyone else is a **Guesser** who tries to figure out which of two random words the Subject prefers. Each correct guess scores a point. When everyone has had a turn, the highest score wins.

**[فارسی — خواندن راهنما به فارسی](README.fa.md)**

## Play

1. **Setup** — add 2-8 players, name them, and pick a word list (English or فارسی).
2. **Choose Subject** — pick who the rest of the group is reading this round.
3. **Gameplay** — the Subject looks away. Two words appear. The active Guesser reads both out loud and asks the Subject which they'd prefer. Mark ✓ if right, ✗ if wrong. Press 🔀 to swap in a different pair.
4. **Session summary** — see who read the Subject best. Pick the next Subject, or jump to final results once everyone has had a turn.
5. **Final results** — see the final ranking. Play again with the same group, or change players.

Each player gets a fixed color (P1 red, P2 blue, P3 green, P4 yellow, P5 purple, P6 orange, P7 pink, P8 teal) so the Subject and Guesser tiles in the gameplay header show who's who at a glance. Subject-picker tiles get a colored stripe + tint in the same color.

## How to run

Insight is plain HTML + CSS + JS. No build step, no dependencies for the app itself.

### Web

Serve the directory with any static host:

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open <http://localhost:8000/>. GitHub Pages, Netlify, Cloudflare Pages, and Vercel all work the same way.

### Android (debug APK)

The Android app is built with Capacitor. To build locally you need Node.js 20 and the Java 21 JDK (for Gradle).

```bash
npm install
npm run prepare:www        # copy assets into www/, bump the sw cache name
npx cap add android
npm run android:icons      # generate launcher icons from icons/
npx cap sync android
cd android && ./gradlew assembleDebug
```

The APK lands in `android/app/build/outputs/apk/debug/app-debug.apk`. To make it installable as an update over a previous build, sign it with a fixed keystore — see [`docs/APK_SIGNING.md`](docs/APK_SIGNING.md) for the workflow.

Releases are built automatically by the GitHub Actions workflow at `.github/workflows/build.yml` and uploaded to the GitHub Releases page. The same workflow also builds the single-file HTML release and attaches it to the release alongside the APK.

### Single-file build

To produce a single self-contained HTML file (works from `file://`, no server needed):

```bash
npm install
npm run build:single
```

The output is `dist/insight.html`. It's inlined with all CSS, JS, and translation data, and is the same file that ships with each GitHub release.

## Project structure

```
.
├── index.html              # application shell
├── manifest.webmanifest    # PWA manifest (icons, theme, etc.)
├── sw.js                   # service worker (offline cache)
├── package.json            # canonical version + Capacitor metadata
├── capacitor.config.json   # Android app id, webDir, etc.
├── icons/                  # launcher icon source + generated PWA + Android icons
├── css/                    # base, app shell, per-screen styles
├── js/
│   ├── main.js             # router + state container
│   ├── dom.js              # tiny h() helper
│   ├── i18n.js             # translation loader + t()
│   ├── state.js            # pure game state helpers
│   ├── colors.js           # 8-color player palette
│   ├── storage.js          # localStorage helpers
│   └── screens/            # one module per screen
│       ├── home.js
│       ├── about.js
│       ├── setup.js
│       ├── chooseSubject.js
│       ├── gameplay.js
│       ├── session.js
│       └── final.js
├── i18n/                   # EN + FA translation dictionaries
├── data/words.js           # EN + FA word lists
├── scripts/                # Capacitor + icon + single-file build scripts
└── .github/workflows/      # GitHub Pages deploy + Android APK build
```

## Languages

- English (default)
- فارسی (Persian) — auto-RTL

The language switcher lives in the top bar. The word list auto-switches to match the current language while a game is in progress. Both your language and the last group of player names are remembered across visits.

## Adding words

Edit `data/words.js` and add to the `en` or `fa` array. Keep both lists roughly the same length so neither language feels stretched.

## Adding a language

1. Create `i18n/<code>.json` with the same shape as `en.json`.
2. Add the code to the language list in `js/main.js` and `js/i18n.js`.
3. Add a matching word list to `data/words.js` (or pick an existing one as a fallback).

## Versioning

The canonical version lives in `package.json`. The GitHub Actions workflow reads it, embeds it in the Android build, and uses it to bump the service worker cache name. Release tags should match it.

## License

MIT.
