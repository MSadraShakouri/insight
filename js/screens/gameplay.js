// Gameplay screen — show the two words, score correct/incorrect.
//
// Design: build the screen ONCE, then update only the parts that change
// (round counter, prompt, progress bar, word pair). No full re-render on
// each action, so there's no flash.

import { h } from '../dom.js';
import { t } from '../i18n.js';
import { getPlayerColor } from '../colors.js';
import {
  recordGuess,
  advanceRound,
  isSessionComplete,
  getCurrentPsychic,
  pickWordPair,
  markWordsUsed,
  endSubjectSession,
} from '../state.js';

// Returns a { '--tile-main': ..., '--tile-tint': ... } style object
// from a color record. Used to color the Subject/Guesser info-tiles
// and the subject-picker tiles so each player has a consistent visual
// identity across screens.
const tileStyle = (color) => ({
  '--tile-main': color.main,
  '--tile-tint': `var(--tint-${color.name})`,
});

export function renderGameplay({ game, onUpdate, onEndSession }) {
  // Live reference to the current game state.
  let g = game;

  // Initial word pair.
  let [w1, w2] = pickWordPair(g);

  // Build the screen once. References to dynamic parts.
  const root = h('section.screen.gameplay');
  let subjectEl, psychicEl, roundEl, progressEl, promptEl, cardL, cardR;
  let subjectTile, psychicTile;

  const swapWords = (newW1, newW2) => {
    w1 = newW1;
    w2 = newW2;
    [cardL, cardR].forEach((c, i) => {
      c.classList.remove('flip');
      void c.offsetWidth;  // force reflow so the animation restarts
      c.classList.add('flip');
      c.textContent = i === 0 ? w1 : w2;
    });
  };

  const applyTileStyle = (tile, color) => {
    tile.style.setProperty('--tile-main', color.main);
    tile.style.setProperty('--tile-tint', `var(--tint-${color.name})`);
  };

  const refreshInfo = () => {
    const subject = g.players[g.currentSubjectIndex];
    const psychic = getCurrentPsychic(g);
    const roundsDone = g.currentRound - 1;
    const progressPct = (roundsDone / g.totalRoundsPerSubject) * 100;

    subjectEl.textContent = subject;
    psychicEl.textContent = psychic;
    roundEl.textContent = `${g.currentRound}/${g.totalRoundsPerSubject}`;
    progressEl.style.width = `${progressPct}%`;

    // Color the Subject and Guesser tiles (and the player names within
    // them) with each player's assigned color so the header tells you
    // who's who at a glance.
    const subjectColor = getPlayerColor(g.playerColors, subject);
    const psychicColor = getPlayerColor(g.playerColors, psychic);
    applyTileStyle(subjectTile, subjectColor);
    applyTileStyle(psychicTile, psychicColor);
    subjectEl.style.color = subjectColor.main;
    psychicEl.style.color = psychicColor.main;

    // The main question uses the Subject's actual name, not the
    // abstract "Subject" label.
    promptEl.textContent = t('gameplay.promptFor', { name: subject });
  };

  const guess = (isCorrect) => {
    let next = recordGuess(g, isCorrect);
    next = { ...next, usedWords: markWordsUsed(next, w1, w2) };

    if (isSessionComplete(next)) {
      next = endSubjectSession(next);
      g = next;
      onUpdate(next);
      onEndSession();
      return;
    }

    next = advanceRound(next);
    g = next;
    onUpdate(next);

    const [nw1, nw2] = pickWordPair(next);
    refreshInfo();
    swapWords(nw1, nw2);
  };

  const shuffle = () => {
    const [nw1, nw2] = pickWordPair(g);
    swapWords(nw1, nw2);
  };

  // Initial values.
  const subject = g.players[g.currentSubjectIndex];
  const psychic = getCurrentPsychic(g);
  const roundsDone = g.currentRound - 1;
  const progressPct = (roundsDone / g.totalRoundsPerSubject) * 100;

  // Pull each player's assigned color, so the header tells you who's
  // who at a glance.
  const subjectColor = getPlayerColor(g.playerColors, subject);
  const psychicColor = getPlayerColor(g.playerColors, psychic);

  subjectEl = h('div.value', { style: { color: subjectColor.main } }, subject);
  psychicEl = h('div.value', { style: { color: psychicColor.main } }, psychic);
  roundEl = h('div.value', {}, `${g.currentRound}/${g.totalRoundsPerSubject}`);
  progressEl = h('div.progress-bar', { style: { width: `${progressPct}%` } });
  promptEl = h('p.word-prompt', {}, t('gameplay.promptFor', { name: subject }));

  cardL = h('div.word-card.left.flip', {}, w1);
  cardR = h('div.word-card.right.flip', {}, w2);

  // Subject and Guesser tiles are built with their player-color CSS
  // variables set inline. The .subject-tile CSS uses these to color
  // the border stripe, the tint overlay, and the name text.
  subjectTile = h('div.info-tile.subject', { style: tileStyle(subjectColor) },
    h('div.label', {}, t('gameplay.subject')),
    subjectEl
  );
  psychicTile = h('div.info-tile.psychic', { style: tileStyle(psychicColor) },
    h('div.label', {}, t('gameplay.psychic')),
    psychicEl
  );

  root.append(
    h('div.game-info', {},
      subjectTile,
      psychicTile,
      h('div.info-tile.round', {},
        h('div.label', {}, t('gameplay.round')),
        roundEl
      )
    ),

    h('div.progress', {}, progressEl),

    promptEl,

    h('div.word-pair', {}, cardL, cardR),

    h('div.btn-row.gameplay-actions', { style: { marginBottom: '8px' } },
      h('button.btn.btn-secondary.btn-block', { type: 'button', onclick: shuffle },
        '🔀 ' + t('gameplay.shuffle')
      )
    ),

    h('div.btn-row', {},
      h('button.btn.btn-bad.btn-lg', { type: 'button', onclick: () => guess(false) },
        '✗ ' + t('gameplay.incorrect')
      ),
      h('button.btn.btn-good.btn-lg', { type: 'button', onclick: () => guess(true) },
        '✓ ' + t('gameplay.correct')
      )
    )
  );

  return root;
}
