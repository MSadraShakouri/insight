# 🧠 Insight

> A fun word-guessing party game where you find out how well your friends really know you.

Players take turns being the **Subject**. Everyone else becomes a **Guesser** who tries to figure out which of two random words the Subject prefers. Each correct guess scores a point. When everyone has had a turn, the highest score wins.

## How to play

1. **Setup** — pick how many players (2–8), name them, and choose a word list.
2. **Choose Subject** — the Subject is the player everyone else is reading this round.
3. **Gameplay** — two words appear. The active Guesser asks the Subject which they'd prefer (out loud). Mark ✓ if right, ✗ if wrong, 🔀 to swap in a different pair.
4. **Session summary** — see who read the Subject best. Pick the next Subject, or move to final results if everyone has had a turn.
5. **Final results** — see the final ranking. Play again with the same group, or start fresh.

## How to run

This is plain HTML + CSS + JS. No build step. No `node_modules`. No dependencies.

### Local development

```bash
python3 -m http.server 8000
# or
npx serve .
```

Then open <http://localhost:8000/>.

### GitHub Pages

Push to a repo, enable Pages in the repo settings (root branch, `/` root), and your game is live.

Any static file host works: Netlify, Cloudflare Pages, Vercel, even raw GitHub.

## Project structure

```
.
├── index.html             # entry, loads CSS + main.js
├── favicon.svg
├── .gitignore
├── README.md
├── LICENSE
├── css/
│   ├── base.css           # reset, design tokens, typography
│   ├── app.css            # shell, top bar, buttons, form controls
│   └── screens.css        # per-screen styles
├── js/
│   ├── main.js            # router + state container
│   ├── i18n.js            # translations (fetched at boot)
│   ├── dom.js             # tiny `h()` helper for creating elements
│   ├── state.js           # pure game state helpers
│   └── screens/
│       ├── setup.js
│       ├── chooseSubject.js
│       ├── gameplay.js
│       ├── session.js
│       └── final.js
├── i18n/
│   ├── en.json
│   └── fa.json
└── data/
    └── words.js           # EN + FA word lists
```

## Features

- **Bilingual** — full English and فارسی interface. The language switcher lives in the top bar.
- **Auto RTL** — when Persian is active, the whole layout flips to right-to-left.
- **Auto word-list switching** — the word list auto-switches to match the current language while a game is in progress.
- **Persistent language & player names** — your language choice and the last group of player names are remembered across visits.
- **Static player colors** — player 1 is always red, player 2 blue, player 3 green, player 4 yellow, player 5 purple, player 6 orange, player 7 pink, player 8 teal. Each player gets a colored stripe and tint on their tiles plus a colored name in the gameplay header so you can tell who's who at a glance.
- **Light & dark** — respects your system's color scheme. Light mode uses a soft lavender-white paper (deliberately not cream).
- **Mobile-first** — designed for one-handed use on a phone.

## Adding words

Edit `data/words.js`. Add to the `en` or `fa` array. Try to keep both lists roughly the same length.

## Adding a language

1. Create `i18n/<code>.json` with the same shape as `en.json`.
2. Add the code to the `lang` constants in `js/i18n.js` and `js/main.js`.
3. Add the matching word list to `data/words.js` (or pick an existing one as a fallback).

## License

MIT.
