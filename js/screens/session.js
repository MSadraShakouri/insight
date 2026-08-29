// Session summary screen — show the round's results, pick the next subject.

import { h } from '../dom.js';
import { t } from '../i18n.js';
import {
  getSessionWinner,
  getAvailableSubjects,
  startSubjectSession,
} from '../state.js';
import { wordLists } from '../../data/words.js';
import { getPlayerColor } from '../colors.js';

export function renderSessionSummary({ game, onUpdate, onPickNext, onShowResults }) {
  const subject = game.players[game.currentSubjectIndex];
  const winner = getSessionWinner(game);
  const available = getAvailableSubjects(game);
  const allDone = available.length === 0;
  const playerColors = game.playerColors || {};

  // Co-winners: every player tied at the top score is highlighted.
  // If there's only one, the regular "bestPsychic" string is used;
  // if there are two or more, we use the "tiedPsychic" string and
  // join the names with " and " (or ", " for 3+).
  const winnerSet = new Set(winner?.names || []);
  const isTied = winner && winner.names.length > 1;
  const winnerNameStr = winner
    ? (winner.names.length === 2
        ? `${winner.names[0]} and ${winner.names[1]}`
        : winner.names.slice(0, -1).join(', ') + ' and ' + winner.names[winner.names.length - 1])
    : '';

  const pickNext = (name) => {
    const next = startSubjectSession(game, name, game.wordListId, wordLists);
    onUpdate(next);
    onPickNext();
  };

  return h('section.screen.session', {},
    h('span.eyebrow', {}, t('session.eyebrow')),
    h('h1', {}, t('session.heading')),
    h('p.lede', {}, t('session.subject', { name: subject })),

    h('div', {},
      h('div.section-label', { style: { marginTop: 0 } }, t('session.thisSession')),
      h('ul.score-list', {},
        ...game.psychicOrder.map((name) => {
          const isWinner = winnerSet.has(name);
          const color = getPlayerColor(playerColors, name);
          return h('li', {
            class: 'score-row' + (isWinner ? ' is-winner' : ''),
            style: { '--row-main': color.main },
          },
            h('span.who', {},
              h('span.color-dot', {
                style: { background: color.main },
                'aria-hidden': 'true',
              }),
              h('span', {}, name)
            ),
            h('span.pts', {}, t('common.points', { count: game.sessionScores[name] || 0 }))
          );
        })
      ),

      winner
        ? h('div.winner-banner', {},
            h('span.crown', {}, '👑 '),
            isTied
              ? t('session.tiedPsychic', {
                  names: winnerNameStr,
                  subject,
                  score: winner.score,
                })
              : t('session.bestPsychic', {
                  name: winner.names[0],
                  subject,
                  score: winner.score,
                })
          )
        : null
    ),

    allDone
      ? h('div', { style: { marginTop: '20px' } },
          h('p', { style: { textAlign: 'center', marginBottom: '12px' } },
            t('session.allDone')
          ),
          h('button.btn.btn-primary.btn-block.btn-lg', { type: 'button', onclick: onShowResults },
            '🏆 ' + t('session.showResults')
          )
        )
      : h('div', { style: { marginTop: '20px' } },
          h('div.section-label', {}, t('session.pickNext')),
          h('div.subject-grid', {},
            ...available.map((name) => {
              const color = getPlayerColor(playerColors, name);
              return h('button.subject-tile', {
                type: 'button',
                style: {
                  '--tile-main': color.main,
                  '--tile-tint': `var(--tint-${color.name})`,
                },
                onclick: () => pickNext(name),
              },
                h('span.name', {}, name)
              );
            })
          )
        )
  );
}
