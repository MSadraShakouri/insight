// Tiny DOM helper. `h('div.foo#bar', { onclick: fn }, 'hello', child)`.
// h(tag#id.class1.class2, props, ...children) -> HTMLElement
//
// tag can be a bare tag name, or include id with '#' and classes with '.'.

export function h(spec, props = {}, ...children) {
  let tag = 'div';
  let id = null;
  const classes = [];

  if (spec.includes('#') || spec.includes('.')) {
    const [t, ...rest] = spec.split(/(?=[#.])/);
    tag = t;
    for (const piece of rest) {
      if (piece[0] === '#') id = piece.slice(1);
      else classes.push(...piece.slice(1).split('.').filter(Boolean));
    }
  } else {
    tag = spec;
  }

  const el = document.createElement(tag);
  if (id) el.id = id;
  if (classes.length) el.className = classes.join(' ');

  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class' || k === 'className') {
      el.className += (el.className ? ' ' : '') + String(v);
    } else if (k === 'style' && typeof v === 'object') {
      // Apply style properties. CSS custom properties (names starting
      // with `--`) must be set via setProperty; direct property access
      // silently drops them.
      for (const [sk, sv] of Object.entries(v)) {
        if (sk.startsWith('--')) {
          el.style.setProperty(sk, sv);
        } else {
          el.style[sk] = sv;
        }
      }
    } else if (k === 'dataset' && typeof v === 'object') {
      Object.assign(el.dataset, v);
    } else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'html') {
      el.innerHTML = v;
    } else if (k in el && typeof v !== 'string') {
      // Set native properties (value, checked, etc.)
      el[k] = v;
    } else {
      el.setAttribute(k, v === true ? '' : v);
    }
  }

  appendChildren(el, children);
  return el;
}

function appendChildren(parent, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    if (c instanceof Node) parent.appendChild(c);
    else parent.appendChild(document.createTextNode(String(c)));
  }
}

// Re-render: replace children of `mount` with a fresh tree.
export function renderInto(mount, node) {
  mount.replaceChildren(node);
  return node;
}

// Create a text node from a string.
export const txt = (s) => document.createTextNode(String(s));
