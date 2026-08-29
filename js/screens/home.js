// Home screen — the first thing a new visitor sees. Brief explanation
// of the game, a "Start" button to jump into setup, and an "About"
// link to the detailed rules page.

import { h } from '../dom.js';
import { t } from '../i18n.js';

const STEPS = ['howto1', 'howto2', 'howto3', 'howto4', 'howto5'];

export function renderHome({ onStart, onAbout }) {
  return h('section.screen.home', {},
    h('span.eyebrow', {}, t('home.eyebrow')),
    h('h1', {}, t('home.heading')),
    h('p.lede', {}, t('home.lede')),

    h('div.home-howto', {},
      h('h2', {}, t('home.howto')),
      h('ol.home-steps', {},
        ...STEPS.map((key) =>
          h('li', {}, t(`home.${key}`))
        )
      )
    ),

    h('p.home-note', {}, t('home.languageNote')),

    h('div.btn-row.home-actions', {},
      h('button.btn.btn-secondary', { type: 'button', onclick: onAbout },
        t('home.about')
      ),
      h('button.btn.btn-primary.btn-lg', { type: 'button', onclick: onStart },
        t('home.start') + ' →'
      )
    )
  );
}
