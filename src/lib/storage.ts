'use client';

// --- Progress ---
export interface LessonProgress {
  completedLessons: number[];
  learnedLetters: number[];
  quizScores: Record<number, number>;
  completedTopics: number[];
}

export function getProgress(): LessonProgress {
  if (typeof window === 'undefined') return { completedLessons: [], learnedLetters: [], quizScores: {}, completedTopics: [] };
  const raw = localStorage.getItem('ivrit-progress');
  if (!raw) return { completedLessons: [], learnedLetters: [], quizScores: {}, completedTopics: [] };
  const parsed = JSON.parse(raw);
  if (!parsed.completedTopics) parsed.completedTopics = [];
  return parsed;
}

export function saveProgress(p: LessonProgress) {
  localStorage.setItem('ivrit-progress', JSON.stringify(p));
}

// --- Streak ---
export interface StreakData {
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export function getStreak(): StreakData {
  if (typeof window === 'undefined') return { currentStreak: 0, lastActiveDate: '' };
  const raw = localStorage.getItem('ivrit-streak');
  if (!raw) return { currentStreak: 0, lastActiveDate: '' };
  return JSON.parse(raw);
}

export function updateStreak(): StreakData {
  const today = new Date().toISOString().split('T')[0];
  const streak = getStreak();
  
  if (streak.lastActiveDate === today) return streak;
  
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (streak.lastActiveDate === yesterday) {
    streak.currentStreak += 1;
  } else {
    streak.currentStreak = 1;
  }
  
  streak.lastActiveDate = today;
  localStorage.setItem('ivrit-streak', JSON.stringify(streak));
  return streak;
}

// --- Leitner Flashcards ---
export interface FlashcardState {
  box: number; // 1-5
  nextReview: number; // timestamp
}

export type FlashcardStore = Record<string, FlashcardState>;

const BOX_INTERVALS = [0, 0, 86400000, 259200000, 604800000, 1209600000]; // ms: 0, 0, 1d, 3d, 7d, 14d

export function getFlashcards(): FlashcardStore {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem('ivrit-flashcards');
  if (!raw) return {};
  return JSON.parse(raw);
}

export function saveFlashcardResult(cardId: string, correct: boolean) {
  const cards = getFlashcards();
  const current = cards[cardId] || { box: 1, nextReview: 0 };
  
  if (correct) {
    current.box = Math.min(current.box + 1, 5);
  } else {
    current.box = 1;
  }
  
  current.nextReview = Date.now() + BOX_INTERVALS[current.box];
  cards[cardId] = current;
  localStorage.setItem('ivrit-flashcards', JSON.stringify(cards));
}

export function getDueCards(allCardIds: string[]): string[] {
  const cards = getFlashcards();
  const now = Date.now();
  return allCardIds.filter(id => {
    const card = cards[id];
    if (!card) return true; // new card
    return card.nextReview <= now;
  });
}
