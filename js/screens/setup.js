// Setup screen — pick player count, names, word list.

import { h } from '../dom.js';
import { t, getLanguage } from '../i18n.js';
import { wordLists } from '../../data/words.js';
import { startNewGame } from '../state.js';
import { loadSavedPlayers, savePlayers } from '../storage.js';

const MIN = 2;
const MAX = 8;

const defaultNames = (count) =>
  Array.from({ length: count }, (_, i) => `Player ${i + 1}`);

export function renderSetup({ onStart, suggestedListId, savedPlayers }) {
  // Initial player count = 5, or the number we saved last time.
  const initialNames = savedPlayers && savedPlayers.length >= MIN
    ? savedPlayers.slice(0, MAX)
    : defaultNames(MIN + 3);

  const local = {
    count: Math.max(MIN, Math.min(MAX, initialNames.length)),
    names: initialNames,
    listId: suggestedListId || (getLanguage() === 'fa' ? 'fa' : 'en'),
  };

  // Live reference to the player-grid section so we can rebuild only
  // that part on count change. Keeps the rest of the screen stable.
  let namesContainer;
  let root;

  const rebuildNames = () => {
    const fresh = h('div.player-grid', {},
      ...local.names.map((name, i) =>
        h('div.field', {},
          h('label.field-label', { for: `p-${i}` }, t('setup.nameLabel', { n: i + 1 })),
          h('input.input', {
            type: 'text',
            id: `p-${i}`,
            value: name,
            maxlength: 24,
            placeholder: t('setup.namePlaceholder', { n: i + 1 }),
            oninput: (e) => updateName(i, e.target.value),
          })
        )
      )
    );
    if (namesContainer) {
      namesContainer.replaceWith(fresh);
    }
    namesContainer = fresh;
    return fresh;
  };

  const updateCount = (n) => {
    local.count = n;
    if (n > local.names.length) {
      for (let i = local.names.length; i < n; i++) local.names.push(`Player ${i + 1}`);
    } else {
      local.names.length = n;
    }
    rebuildNames();
  };

  const updateName = (i, v) => {
    local.names[i] = v;
  };

  const updateList = (id) => {
    local.listId = id;
  };

  const start = () => {
    const cleaned = local.names.map((n, i) => n.trim() || `Player ${i + 1}`);
    if (cleaned.length < MIN || cleaned.length > MAX) return;

    // Persist the names so the next time we open the setup screen
    // (or come back from final results) the same names pre-fill.
    savePlayers(cleaned);

    const fullGame = startNewGame(cleaned, cleaned[0], local.listId);
    onStart(fullGame);
  };

  const wordCount = wordLists[local.listId]?.length || 0;
  const lowOnWords = wordCount < 50;

  // Build the static structure once.
  const namesSection = h('div', {},
    h('div.section-label', {}, t('setup.namesHeading')),
    rebuildNames()
  );

  root = h('section.screen.setup', {},
    h('span.eyebrow', {}, t('app.title')),
    h('h1', {}, t('setup.heading')),
    h('p.lede', {}, t('setup.lede')),

    h('div.field', {},
      h('label.field-label', { for: 'player-count' }, t('setup.playerCount')),
      h('select.select', {
        id: 'player-count',
        onchange: (e) => updateCount(parseInt(e.target.value, 10)),
      },
        ...Array.from({ length: MAX - MIN + 1 }, (_, i) => {
          const n = MIN + i;
          return h('option', { value: n, selected: n === local.count ? '' : null },
            t('setup.players', { count: n }));
        })
      )
    ),

    namesSection,

    h('div.section-label', {}, t('setup.wordList')),
    h('div.list-pick', {},
      h('label', {},
        h('input', {
          type: 'radio',
          name: 'wordlist',
          value: 'en',
          checked: local.listId === 'en' ? '' : null,
          onchange: () => updateList('en'),
        }),
        h('span.list-emoji', {}, '🇬🇧'),
        h('span', {}, t('setup.wordListEnglish')),
        h('span.list-meta', {}, t('setup.wordCount', { count: wordLists.en.length })),
      ),
      h('label', {},
        h('input', {
          type: 'radio',
          name: 'wordlist',
          value: 'fa',
          checked: local.listId === 'fa' ? '' : null,
          onchange: () => updateList('fa'),
        }),
        h('span.list-emoji', {}, '🌙'),
        h('span', {}, t('setup.wordListPersian')),
        h('span.list-meta', {}, t('setup.wordCount', { count: wordLists.fa.length })),
      ),
    ),

    lowOnWords
      ? h('p.hint.warn', {}, t('setup.lowWordsWarning', { count: wordCount }))
      : null,

    h('div.btn-row', { style: { marginTop: '20px' } },
      h('button.btn.btn-primary.btn-block.btn-lg', { onclick: start },
        t('setup.start')
      )
    )
  );

  return root;
}
