// Player color assignment.
//
// Colors are assigned by player POSITION (1-based, in the order the names
// were entered on the setup screen) and stay stable for the whole game.
// So if Alice is at position 1, she's always red; if Bob is at position 2,
// he's always blue. The order is the same as the input order on setup.
//
// Why by position and not by name? Two reasons:
//   1. The same person might be in different games under different
//      positions; tying the color to position keeps the visual cue
//      consistent with who's first to play.
//   2. Players can edit their name mid-game; the color should follow
//      the slot, not the string.
//
// 8 distinct colors, hue-spread so no two are easily confused. Each
// entry has main (used for borders/text), tintLight (pastel background
// for light mode), and tintDark (deep background for dark mode).

export const PALETTE = [
  // 1. Red
  { name: 'red',      main: '#ef4444', tintLight: '#ffd4d2', tintDark: '#3d1414' },
  // 2. Blue
  { name: 'blue',     main: '#3b82f6', tintLight: '#cee0fb', tintDark: '#102a4f' },
  // 3. Green
  { name: 'green',    main: '#22c55e', tintLight: '#cdeecc', tintDark: '#0f2a1a' },
  // 4. Yellow
  { name: 'yellow',   main: '#fbbf24', tintLight: '#fef0c7', tintDark: '#3a2c0e' },
  // 5. Purple
  { name: 'purple',   main: '#8b5cf6', tintLight: '#e0d4fb', tintDark: '#221a3e' },
  // 6. Orange
  { name: 'orange',   main: '#f97316', tintLight: '#fcd9b8', tintDark: '#3a1f0c' },
  // 7. Pink
  { name: 'pink',     main: '#ec4899', tintLight: '#fbcfdf', tintDark: '#3d1a2c' },
  // 8. Teal
  { name: 'teal',     main: '#14b8a6', tintLight: '#c8efe2', tintDark: '#0e2c24' },
];

// Neutral gray for any fallback (e.g. names that aren't in playerColors).
const NEUTRAL = { name: 'neutral', main: '#888888', tintLight: '#e5e5e5', tintDark: '#333333' };

// Assign a color to each player. Returns { [name]: { name, main, tintLight, tintDark } }.
// Position-based: index 0 in playerNames → PALETTE[0], index 1 → PALETTE[1], etc.
// If there are more than 8 players, additional players wrap around and
// share a color with an earlier player (this shouldn't happen — the
// setup screen caps at 8 — but we don't crash if it does).
export const assignPlayerColors = (playerNames) => {
  const result = {};
  playerNames.forEach((name, i) => {
    result[name] = PALETTE[i % PALETTE.length];
  });
  return result;
};

// Get a single player's color, falling back to a neutral gray if not assigned.
export const getPlayerColor = (playerColors, name) =>
  playerColors?.[name] || NEUTRAL;
