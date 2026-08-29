// Application entry point.
// Tiny router + state container. Re-renders on state or language change.

import { h } from './dom.js';
import { t, getLanguage, setLanguage, onLanguageChange, loadI18n } from './i18n.js';
import { wordLists } from '../data/words.js';
import { loadSavedPlayers } from './storage.js';
import { renderHome } from './screens/home.js';
import { renderAbout } from './screens/about.js';
import { renderSetup } from './screens/setup.js';
import { renderChooseSubject } from './screens/chooseSubject.js';
import { renderGameplay } from './screens/gameplay.js';
import { renderSessionSummary } from './screens/session.js';
import { renderFinal } from './screens/final.js';

const SCREENS = {
  HOME: 'home',
  ABOUT: 'about',
  SETUP: 'setup',
  CHOOSE_SUBJECT: 'chooseSubject',
  GAMEPLAY: 'gameplay',
  SESSION: 'session',
  FINAL: 'final',
};

// localStorage key for "I've seen the home screen before". First-time
// visitors get the home screen; returning visitors go straight to
// setup (so they don't have to click past a landing page every time).
const HOME_SEEN_KEY = 'insight.homeSeen';

const state = {
  screen: SCREENS.HOME,
  game: null,
  language: 'en',
  // Cached so going back to setup pre-fills with the last names.
  lastPlayerNames: null,
};

function renderTopBar() {
  return h('header.topbar', {},
    h('button.brand', {
      type: 'button',
      onclick: () => goHome(),
      'aria-label': t('app.title'),
    },
      h('div.brand-mark', { class: 'coral' }, '🧠'),
      h('span', {}, t('app.title'))
    ),
    h('div.lang-switch', { role: 'tablist' },
      h('button', {
        type: 'button',
        role: 'tab',
        class: state.language === 'en' ? 'is-active' : '',
        'aria-selected': state.language === 'en' ? 'true' : 'false',
        onclick: () => switchLanguage('en'),
      }, 'English'),
      h('button', {
        type: 'button',
        role: 'tab',
        class: state.language === 'fa' ? 'is-active' : '',
        'aria-selected': state.language === 'fa' ? 'true' : 'false',
        onclick: () => switchLanguage('fa'),
      }, 'فارسی'),
    )
  );
}

function markHomeSeen() {
  try { localStorage.setItem(HOME_SEEN_KEY, '1'); } catch {}
}

function goHome() {
  state.game = null;
  state.screen = SCREENS.HOME;
  rerender();
}

function renderScreen() {
  const { screen, game } = state;

  if (screen === SCREENS.HOME) {
    return renderHome({
      onStart: () => {
        markHomeSeen();
        state.screen = SCREENS.SETUP;
        rerender();
      },
      onAbout: () => {
        state.screen = SCREENS.ABOUT;
        rerender();
      },
    });
  }

  if (screen === SCREENS.ABOUT) {
    return renderAbout({
      onBack: () => {
        state.screen = SCREENS.HOME;
        rerender();
      },
    });
  }

  if (screen === SCREENS.SETUP || !game) {
    return renderSetup({
      suggestedListId: state.language,
      savedPlayers: state.lastPlayerNames,
      onStart: (newGame) => {
        state.lastPlayerNames = newGame.players;
        state.game = newGame;
        state.screen = SCREENS.CHOOSE_SUBJECT;
        rerender();
      },
    });
  }

  if (screen === SCREENS.CHOOSE_SUBJECT) {
    return renderChooseSubject({
      game,
      onSubjectPicked: (next) => {
        state.game = next;
        state.screen = SCREENS.GAMEPLAY;
        rerender();
      },
      onBack: () => {
        state.game = null;
        state.screen = SCREENS.SETUP;
        rerender();
      },
    });
  }

  if (screen === SCREENS.GAMEPLAY) {
    return renderGameplay({
      game,
      onUpdate: (next) => { state.game = next; },
      onEndSession: () => {
        state.screen = SCREENS.SESSION;
        rerender();
      },
    });
  }

  if (screen === SCREENS.SESSION) {
    return renderSessionSummary({
      game,
      onUpdate: (next) => { state.game = next; },
      onPickNext: () => {
        state.screen = SCREENS.GAMEPLAY;
        rerender();
      },
      onShowResults: () => {
        state.screen = SCREENS.FINAL;
        rerender();
      },
    });
  }

  if (screen === SCREENS.FINAL) {
    return renderFinal({
      game,
      onUpdate: (next) => { state.game = next; },
      onPlayAgain: () => {
        state.screen = SCREENS.CHOOSE_SUBJECT;
        rerender();
      },
      onChangePlayers: () => {
        // Keep the old names so setup pre-fills with them.
        state.lastPlayerNames = game.players;
        state.game = null;
        state.screen = SCREENS.SETUP;
        rerender();
      },
    });
  }

  return h('div', {}, '?');
}

function render() {
  const app = document.getElementById('app');
  const topbar = renderTopBar();
  const screen = renderScreen();
  const inner = h('div.stage-inner', {}, screen);
  const stage = h('main.stage', {}, inner);
  app.replaceChildren(
    h('div.app', {}, topbar, stage)
  );
}

function rerender() { render(); }

function switchLanguage(lng) {
  if (lng === state.language) return;
  setLanguage(lng);
  state.language = lng;
  if (state.game) {
    const newList = wordLists[lng] || [];
    state.game = {
      ...state.game,
      wordListId: lng,
      wordList: newList,
      usedWords: [],
    };
  }
  rerender();
}

onLanguageChange((lng) => {
  state.language = lng;
  if (state.game) {
    const newList = wordLists[lng] || [];
    state.game = {
      ...state.game,
      wordListId: lng,
      wordList: newList,
      usedWords: [],
    };
  }
  rerender();
});

// Boot — wait for translations to load, then route to the right
// initial screen. Returning visitors (insight.homeSeen) skip the
// landing page and go straight to setup.
loadI18n().then((lng) => {
  state.language = lng;
  state.lastPlayerNames = loadSavedPlayers();
  let seenHome = false;
  try { seenHome = localStorage.getItem(HOME_SEEN_KEY) === '1'; } catch {}
  // After a finished game we route to setup directly so the "Change
  // players" flow is one click shorter. There's no `state.game` yet
  // on a fresh boot, so we always start on HOME first.
  state.screen = seenHome ? SCREENS.SETUP : SCREENS.HOME;
  render();
});
