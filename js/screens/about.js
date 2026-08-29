// About screen — detailed how-to-play, scoring explanation, privacy
// notes, and word-list customization info. Shown when the user
// clicks the "About" link on the home screen.

import { h } from '../dom.js';
import { t } from '../i18n.js';

const RULES = ['rule1', 'rule2', 'rule3', 'rule4', 'rule5', 'rule6'];
const SCORING = ['scoring1', 'scoring2', 'scoring3'];
const PRIVACY = ['privacy1', 'privacy2', 'privacy3'];
const CUSTOMIZE = ['customize1', 'customize2'];

function section(titleKey, items, itemKeyPrefix) {
  return h('div.about-section', {},
    h('h2', {}, t(`about.${titleKey}`)),
    h('ul', {},
      ...items.map((key) =>
        h('li', {}, t(`about.${itemKeyPrefix || key}`))
      )
    )
  );
}

export function renderAbout({ onBack }) {
  return h('section.screen.about', {},
    h('span.eyebrow', {}, t('about.eyebrow')),
    h('h1', {}, t('about.heading')),
    h('p.lede', {}, t('about.lede')),

    section('rulesHeading', RULES, 'rule'),
    section('scoringHeading', SCORING, 'scoring'),
    section('privacyHeading', PRIVACY, 'privacy'),
    section('customizeHeading', CUSTOMIZE, 'customize'),

    h('div.btn-row.about-actions', {},
      h('button.btn.btn-primary.btn-block', { type: 'button', onclick: onBack },
        '← ' + t('about.back')
      )
    )
  );
}
