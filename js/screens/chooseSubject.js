// Choose-subject screen — pick the Subject for the next round.

import { h } from '../dom.js';
import { t } from '../i18n.js';
import { getAvailableSubjects, startSubjectSession } from '../state.js';
import { wordLists } from '../../data/words.js';
import { getPlayerColor } from '../colors.js';

export function renderChooseSubject({ game, onSubjectPicked, onBack }) {
  const available = getAvailableSubjects(game);
  const playerColors = game.playerColors || {};

  const pick = (name) => {
    const next = startSubjectSession(
      game,
      name,
      game.wordListId,
      wordLists
    );
    onSubjectPicked(next);
  };

  return h('section.screen.choose-subject', {},
    h('span.eyebrow', {}, t('chooseSubject.eyebrow')),
    h('h1', {}, t('chooseSubject.heading')),
    h('p.lede', {}, t('chooseSubject.lede')),

    available.length === 0
      ? h('p', {}, t('setup.allDone'))
      : h('div.subject-grid', {},
          ...available.map((name) => {
            const color = getPlayerColor(playerColors, name);
            return h('button.subject-tile', {
              type: 'button',
              style: {
                '--tile-main': color.main,
                '--tile-tint': `var(--tint-${color.name})`,
              },
              onclick: () => pick(name),
            },
              h('span.name', {}, name)
            );
          })
        ),

    h('div.btn-row.between', { style: { marginTop: '20px' } },
      h('button.btn.btn-secondary', { type: 'button', onclick: onBack },
        '← ' + t('chooseSubject.back')
      ),
      h('span', {})
    )
  );
}
