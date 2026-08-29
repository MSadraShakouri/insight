// Application entry point.
// Tiny router + state container. Re-renders on state or language change.

import { h } from './dom.js';
import { t, getLanguage, setLanguage, onLanguageChange, loadI18n } from './i18n.js';
import { wordLists } from '../data/words.js';
import { loadSavedPlayers } from './storage.js';
import { renderSetup } from './screens/setup.js';
import { renderChooseSubject } from './screens/chooseSubject.js';
import { renderGameplay } from './screens/gameplay.js';
import { renderSessionSummary } from './screens/session.js';
import { renderFinal } from './screens/final.js';

const SCREENS = {
  SETUP: 'setup',
  CHOOSE_SUBJECT: 'chooseSubject',
  GAMEPLAY: 'gameplay',
  SESSION: 'session',
  FINAL: 'final',
};

const state = {
  screen: SCREENS.SETUP,
  game: null,
  language: 'en',
  // Cached so going back to setup pre-fills with the last names.
  lastPlayerNames: null,
};

function renderTopBar() {
  return h('header.topbar', {},
    h('div.brand', {},
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

function renderScreen() {
  const { screen, game } = state;

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

// Boot — wait for translations to load, then render.
loadI18n().then((lng) => {
  state.language = lng;
  // Pre-load saved players so the setup screen can use them.
  state.lastPlayerNames = loadSavedPlayers();
  render();
});
