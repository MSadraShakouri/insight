// Pure game state helpers. No DOM access.

import { wordLists } from '../data/words.js';
import { assignPlayerColors } from './colors.js';

export const createInitialState = () => ({
  players: [],
  playerColors: {},   // { [name]: { name, main, tintLight, tintDark } }
  totalRoundsPerSubject: 0,
  currentSubjectIndex: -1,
  currentRound: 0,
  scores: {},
  sessionScores: {},
  subjectsCompleted: [],
  psychicOrder: [],
  currentPsychicPosition: 0,
  wordListId: 'en',
  wordList: [],
  usedWords: [],
});

export const initPlayers = (names) => {
  const scores = {};
  names.forEach((n) => { scores[n] = 0; });
  return scores;
};

// Start a brand-new game: assign random colors, then set up the first
// subject session. `playerNames` is the cleaned list the user entered
// on the setup screen; `firstSubjectName` is who goes first.
export const startNewGame = (playerNames, firstSubjectName, wordListId) => {
  const base = createInitialState();
  const withPlayers = {
    ...base,
    players: playerNames,
    scores: initPlayers(playerNames),
    playerColors: assignPlayerColors(playerNames),
  };
  return startSubjectSession(withPlayers, firstSubjectName, wordListId, wordLists);
};

export const startSubjectSession = (state, subjectName, wordListId, wordLists) => {
  const subjectIndex = state.players.indexOf(subjectName);
  const totalRoundsPerSubject = (state.players.length - 1) * 3;

  // Psychic order: every other player, starting after the subject.
  const psychicOrder = [];
  for (let i = 1; i < state.players.length; i++) {
    const idx = (subjectIndex + i) % state.players.length;
    psychicOrder.push(state.players[idx]);
  }

  const sessionScores = {};
  psychicOrder.forEach((p) => { sessionScores[p] = 0; });

  return {
    ...state,
    currentSubjectIndex: subjectIndex,
    // currentRound is 1-indexed: it shows the round that's about to be
    // played. Starts at 1, ends at totalRoundsPerSubject inclusive.
    currentRound: 1,
    totalRoundsPerSubject,
    psychicOrder,
    currentPsychicPosition: 0,
    sessionScores,
    wordListId,
    wordList: wordLists[wordListId] || [],
    usedWords: [],
  };
};

export const advanceRound = (state) => {
  const nextRound = state.currentRound + 1;
  const nextPos = state.currentPsychicPosition + 1 >= state.psychicOrder.length
    ? 0
    : state.currentPsychicPosition + 1;
  return {
    ...state,
    currentRound: nextRound,
    currentPsychicPosition: nextPos,
  };
};

export const recordGuess = (state, isCorrect) => {
  if (!isCorrect) return state;
  const psychic = state.psychicOrder[state.currentPsychicPosition];
  return {
    ...state,
    scores: { ...state.scores, [psychic]: (state.scores[psychic] || 0) + 1 },
    sessionScores: { ...state.sessionScores, [psychic]: (state.sessionScores[psychic] || 0) + 1 },
  };
};

export const endSubjectSession = (state) => ({
  ...state,
  subjectsCompleted: [...state.subjectsCompleted, state.players[state.currentSubjectIndex]],
});

export const getCurrentPsychic = (state) =>
  state.psychicOrder[state.currentPsychicPosition] || null;

export const getAvailableSubjects = (state) =>
  state.players.filter((p) => !state.subjectsCompleted.includes(p));

export const getFinalRanking = (state) => {
  // Standard competition ranking: tied players share a rank, the next
  // player gets a rank that skips over the tie.
  // Example scores: 10, 8, 8, 5 → ranks: 1, 2, 2, 4
  const entries = [...state.players]
    .map((p) => ({ name: p, score: state.scores[p] || 0 }))
    .sort((a, b) => b.score - a.score);

  let rank = 0;
  let lastScore = null;
  let seenAtScore = 0;
  return entries.map((e, i) => {
    if (e.score !== lastScore) {
      rank = i + 1;
      seenAtScore = 1;
      lastScore = e.score;
    } else {
      seenAtScore++;
    }
    return { ...e, rank };
  });
};

export const getSessionWinner = (state) => {
  // Find every player tied at the top score. Returns
  // { names: [...], score: N } or null if nobody scored any points.
  // Co-winners are all highlighted in the UI and the banner uses
  // a "tied" message.
  let bestScore = 0;
  let topScorers = [];
  Object.entries(state.sessionScores).forEach(([name, score]) => {
    if (score > bestScore) {
      bestScore = score;
      topScorers = [name];
    } else if (score === bestScore && bestScore > 0) {
      topScorers.push(name);
    }
  });
  if (bestScore === 0) return null;
  return { names: topScorers, score: bestScore };
};

// True if the current round is the LAST round. After the user clicks on
// the final round, the session ends — no more rounds to play.
export const isSessionComplete = (state) =>
  state.currentRound >= state.totalRoundsPerSubject;

export const pickWordPair = (state) => {
  const pool = state.wordList || [];
  if (pool.length < 2) return [null, null];

  let used = state.usedWords;
  if (used.length > pool.length * 0.7) used = [];

  const pick = (exclude) => {
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = pool[Math.floor(Math.random() * pool.length)];
      if (candidate !== exclude && !used.includes(candidate)) return candidate;
    }
    return pool.find((w) => w !== exclude) || pool[0];
  };

  const w1 = pick(null);
  const w2 = pick(w1);
  return [w1, w2];
};

export const markWordsUsed = (state, w1, w2) => {
  const next = [...state.usedWords, w1, w2];
  return next.length > 200 ? next.slice(-200) : next;
};
