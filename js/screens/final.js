// Final results screen — show the final ranking, offer to play again.

import { h } from '../dom.js';
import { t } from '../i18n.js';
import { getFinalRanking, startNewGame } from '../state.js';
import { getPlayerColor } from '../colors.js';

// Map a rank number to a CSS class. We use the rank itself (not position)
// so tied players get the same color.
const rankClass = (rank) => {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return '';
};

const rankSymbol = (rank) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

export function renderFinal({ game, onUpdate, onPlayAgain, onChangePlayers }) {
  const ranking = getFinalRanking(game);
  const playerColors = game.playerColors || {};

  const playAgain = () => {
    // Same players, same word list, fresh colors. First subject is
    // the next player in the rotation.
    const completed = game.subjectsCompleted || [];
    const remaining = game.players.filter((p) => !completed.includes(p));
    const firstSubject = remaining[0] || game.players[0];
    const fresh = startNewGame(game.players, firstSubject, game.wordListId);
    onUpdate(fresh);
    onPlayAgain();
  };

  return h('section.screen.final', {},
    h('span.eyebrow', {}, t('final.eyebrow')),
    h('h1', {}, t('final.heading')),
    h('p.lede', {}, '🏆'),

    h('ol.podium', {},
      ...ranking.map((entry) => {
        const color = getPlayerColor(playerColors, entry.name);
        return h('li', { class: rankClass(entry.rank) },
          h('span.rank', {}, rankSymbol(entry.rank)),
          h('span.color-dot', {
            style: { background: color.main },
            'aria-hidden': 'true',
          }),
          h('span.name', {}, entry.name),
          h('span.pts', {}, t('common.points', { count: entry.score }))
        );
      })
    ),

    h('div.btn-row', { style: { marginTop: '20px' } },
      h('button.btn.btn-secondary', { type: 'button', onclick: onChangePlayers },
        '← ' + t('final.changePlayers')
      ),
      h('button.btn.btn-primary', { type: 'button', onclick: playAgain },
        '↻ ' + t('final.playAgain')
      )
    )
  );
}
