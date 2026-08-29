// Persist player names across visits, the same way the language is remembered.
// Returns the saved names so the setup screen can pre-fill them.

const PLAYERS_KEY = 'insight.players';

export function loadSavedPlayers() {
  try {
    const raw = localStorage.getItem(PLAYERS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    // Filter to valid (non-empty) strings.
    return parsed.filter((n) => typeof n === 'string' && n.trim().length > 0);
  } catch {
    return null;
  }
}

export function savePlayers(names) {
  try {
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(names));
  } catch {
    // localStorage unavailable (private mode, quota) — ignore.
  }
}
