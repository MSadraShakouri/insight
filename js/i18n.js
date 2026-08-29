// Tiny i18n — no library, just a JSON lookup + subscribe.
// Loads translations via fetch() so it works on any static host.

const RTL = ['fa', 'ar', 'he', 'ur'];
const STORAGE_KEY = 'insight.lang';
const listeners = new Set();

let dicts = null;        // { en: {...}, fa: {...} }
let current = 'en';
let ready = false;
let readyPromise = null;

function detectInitial() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'fa') return stored;
  } catch {}
  const nav = (navigator.language || 'en').split('-')[0];
  return nav === 'fa' ? 'fa' : 'en';
}

function applyDir() {
  const base = current;
  document.documentElement.lang = base;
  document.documentElement.dir = RTL.includes(base) ? 'rtl' : 'ltr';
}

export function loadI18n() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    // Fallback for the single-file build: scripts/build-single.cjs
    // inlines the dicts on `window.__INSIGHT_I18N__` so the file can
    // run from file:// without a server.
    if (typeof window !== 'undefined' && window.__INSIGHT_I18N__) {
      dicts = window.__INSIGHT_I18N__;
      current = detectInitial();
      applyDir();
      ready = true;
      return current;
    }

    const baseUrl = import.meta.url.replace(/[^/]*$/, '');
    const [en, fa] = await Promise.all([
      fetch(new URL('../i18n/en.json', baseUrl)).then((r) => r.json()),
      fetch(new URL('../i18n/fa.json', baseUrl)).then((r) => r.json()),
    ]);
    dicts = { en, fa };
    current = detectInitial();
    applyDir();
    ready = true;
    return current;
  })();
  return readyPromise;
}

export function isReady() { return ready; }

export function getLanguage() { return current; }

export function getAvailableLanguages() {
  return [
    { id: 'en', label: 'English' },
    { id: 'fa', label: 'فارسی' },
  ];
}

export function t(key, vars = {}) {
  if (!ready || !dicts) return key;

  // Walk the dotted path. At the final step, if a direct child doesn't
  // exist, fall back to a plural form (`<segment>_one` / `<segment>_other`)
  // and let the count variable pick which.
  const dict = dicts[current];
  const parts = key.split('.');
  let cur = dict;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const isLast = i === parts.length - 1;
    if (cur && typeof cur === 'object' && p in cur) {
      cur = cur[p];
    } else if (
      isLast &&
      cur &&
      typeof cur === 'object' &&
      (p + '_one' in cur || p + '_other' in cur)
    ) {
      // Plural form: pick _one or _other based on vars.count.
      const count = Number(vars.count);
      const form = (count === 1 && (p + '_one') in cur) ? '_one' : '_other';
      cur = cur[p + form];
    } else {
      return key;
    }
  }

  if (typeof cur !== 'string') return key;
  return cur.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? String(vars[k]) : ''));
}

export function setLanguage(lng) {
  if (lng !== 'en' && lng !== 'fa') return;
  if (lng === current) return;
  current = lng;
  try { localStorage.setItem(STORAGE_KEY, lng); } catch {}
  applyDir();
  listeners.forEach((fn) => fn(lng));
}

export function onLanguageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
