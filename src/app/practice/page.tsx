'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import hebrewData from '@/data/hebrew.json';
import { getProgress, updateStreak } from '@/lib/storage';

type PracticeMode = 'letters' | 'words' | 'listening';
type FormKey = 'isolated' | 'initial' | 'medial' | 'final';

const FORM_LABELS: Record<FormKey, string> = {
  isolated: 'Einzeln',
  initial: 'Anfang',
  medial: 'Mitte',
  final: 'Ende',
};

interface QuizQuestion {
  type: 'name-to-char' | 'char-to-name' | 'form-quiz' | 'word-to-german' | 'german-to-word';
  question: string;
  questionHebräisch?: string;
  answer: string;
  options: string[];
}

export default function PracticePage() {
  const router = useRouter();
  const [mode, setMode] = useState<PracticeMode | null>(null);
  const [learnedLetterIndices, setLearnedLetterIndices] = useState<number[]>([]);
  const [learnedWords, setLearnedWords] = useState<Array<{ hebrew: string; latin: string; german: string }>>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    updateStreak();
    const progress = getProgress();
    setLearnedLetterIndices(progress.learnedLetters);

    // Collect all words from learned letters' examples
    const words: Array<{ hebrew: string; latin: string; german: string }> = [];
    const seen = new Set<string>();
    for (const idx of progress.learnedLetters) {
      const letter = hebrewData.alphabet[idx] as typeof hebrewData.alphabet[0] & { examples?: Record<string, { hebrew: string; latin: string; german: string }> };
      if (letter.examples) {
        for (const pos of ['begin', 'middle', 'end']) {
          const ex = letter.examples[pos];
          if (ex && !seen.has(ex.hebrew)) {
            words.push(ex);
            seen.add(ex.hebrew);
          }
        }
      }
      if (letter.exampleWord && !seen.has(letter.exampleWord.hebrew)) {
        words.push(letter.exampleWord);
        seen.add(letter.exampleWord.hebrew);
      }
    }
    setLearnedWords(words);
  }, []);

  const generateLetterQuiz = useCallback(() => {
    // Use learned letters, or first 6 (lesson 1) as fallback
    const indices = learnedLetterIndices.length > 0
      ? learnedLetterIndices
      : hebrewData.lessons[0].letterIndices;
    const learned = indices.map(i => hebrewData.alphabet[i]);
    const qs: QuizQuestion[] = [];

    // Mix question types
    for (const letter of learned) {
      // Type 1: Name → Which character?
      const wrongChars = hebrewData.alphabet
        .filter(l => l.char !== letter.char)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(l => l.char);
      qs.push({
        type: 'name-to-char',
        question: `Welcher Buchstabe ist "${letter.name}"? (Laut: ${letter.sound})`,
        answer: letter.char,
        options: [...wrongChars, letter.char].sort(() => Math.random() - 0.5),
      });

      // Type 2: Character → What's the name?
      const wrongNames = hebrewData.alphabet
        .filter(l => l.char !== letter.char)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(l => l.name);
      qs.push({
        type: 'char-to-name',
        question: letter.char,
        questionHebräisch: letter.char,
        answer: letter.name,
        options: [...wrongNames, letter.name].sort(() => Math.random() - 0.5),
      });

      // Type 3: Form quiz — which form is this?
      const forms = Object.keys(FORM_LABELS) as FormKey[];
      const randomForm = forms[Math.floor(Math.random() * forms.length)];
      qs.push({
        type: 'form-quiz',
        question: `Welche Form von "${letter.name}" ist das?`,
        questionHebräisch: letter.forms[randomForm],
        answer: FORM_LABELS[randomForm],
        options: Object.values(FORM_LABELS).sort(() => Math.random() - 0.5),
      });
    }

    // Shuffle and limit to 15 questions
    const shuffled = qs.sort(() => Math.random() - 0.5).slice(0, 15);
    setQuestions(shuffled);
    setCurrentQ(0);
    setScore(0);
    setTotal(shuffled.length);
    setFinished(false);
    setSelected(null);
    setShowResult(false);
  }, [learnedLetterIndices]);

  const generateWordQuiz = useCallback(() => {
    // Use learned words, or grab words from first lesson as fallback
    let words = learnedWords;
    if (words.length < 4) {
      const fallbackWords: Array<{ hebrew: string; latin: string; german: string }> = [];
      const seen = new Set<string>();
      for (const idx of hebrewData.lessons[0].letterIndices) {
        const letter = hebrewData.alphabet[idx] as typeof hebrewData.alphabet[0] & { examples?: Record<string, { hebrew: string; latin: string; german: string }> };
        if (letter.examples) {
          for (const pos of ['begin', 'middle', 'end']) {
            const ex = letter.examples[pos];
            if (ex && !seen.has(ex.hebrew)) { fallbackWords.push(ex); seen.add(ex.hebrew); }
          }
        }
        if (letter.exampleWord && !seen.has(letter.exampleWord.hebrew)) {
          fallbackWords.push(letter.exampleWord); seen.add(letter.exampleWord.hebrew);
        }
      }
      words = fallbackWords;
    }
    if (words.length < 4) return;
    const qs: QuizQuestion[] = [];

    for (const word of words) {
      // Hebräisch → German
      const wrongGerman = learnedWords
        .filter(w => w.hebrew !== word.hebrew)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.german);
      qs.push({
        type: 'word-to-german',
        question: `Was bedeutet dieses Wort?`,
        questionHebräisch: word.hebrew,
        answer: word.german,
        options: [...wrongGerman, word.german].sort(() => Math.random() - 0.5),
      });

      // German → Hebräisch
      const wrongHebräisch = learnedWords
        .filter(w => w.hebrew !== word.hebrew)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.hebrew);
      qs.push({
        type: 'german-to-word',
        question: `Wie heißt "${word.german}" auf Hebräisch? (${word.latin})`,
        answer: word.hebrew,
        options: [...wrongHebräisch, word.hebrew].sort(() => Math.random() - 0.5),
      });
    }

    const shuffled = qs.sort(() => Math.random() - 0.5).slice(0, 15);
    setQuestions(shuffled);
    setCurrentQ(0);
    setScore(0);
    setTotal(shuffled.length);
    setFinished(false);
    setSelected(null);
    setShowResult(false);
  }, [learnedWords]);

  const handleAnswer = (answer: string) => {
    if (showResult) return;
    setSelected(answer);
    setShowResult(true);
    const correct = answer === questions[currentQ].answer;
    if (correct) setScore(prev => prev + 1);

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1);
        setSelected(null);
        setShowResult(false);
      } else {
        setFinished(true);
      }
    }, 1000);
  };

  // Mode selection screen
  if (!mode) {
    return (
      <div className="flex flex-col h-dvh p-4 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.push('/')} className="text-[#5B8DB8] touch-target">← Zurück</button>
          <span className="text-sm text-[#F0DCC0]/60">🔄 Üben</span>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#5B8DB8]">Was möchtest du üben?</h1>
          <p className="text-sm text-[#F0DCC0]/50 mt-1">
            {learnedLetterIndices.length} Buchstaben gelernt · {learnedWords.length} Wörter
          </p>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-4">
          <button
            onClick={() => router.push('/mixed')}
            className="touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl p-5 text-left active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F0F1A]/20 flex items-center justify-center flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
              </div>
              <div>
                <p className="font-bold text-lg">Gemischtes Training</p>
                <p className="text-sm opacity-70">Paare, Lücken, Tippen, Hören — alles!</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setMode('letters'); setTimeout(generateLetterQuiz, 0); }}
            className="touch-target bg-[#1A1A2E] border border-[#5B8DB8]/30 rounded-2xl p-5 text-left active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5B8DB8]/10 flex items-center justify-center flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B8DB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
              </div>
              <div>
                <p className="font-bold text-lg">Buchstaben-Quiz</p>
                <p className="text-sm text-[#F0DCC0]/50">Name ↔ Zeichen, Formen erkennen</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => { setMode('words'); setTimeout(generateWordQuiz, 0); }}
            className="touch-target bg-[#1A1A2E] border border-[#5B8DB8]/30 rounded-2xl p-5 text-left active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5B8DB8]/10 flex items-center justify-center flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B8DB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div>
                <p className="font-bold text-lg">Wörter-Quiz</p>
                <p className="text-sm text-[#F0DCC0]/50">Hebräisch ↔ Deutsch übersetzen</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/keyboard')}
            className="touch-target bg-[#1A1A2E] border border-[#5B8DB8]/30 rounded-2xl p-5 text-left active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5B8DB8]/10 flex items-center justify-center flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B8DB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M8 16h8"/></svg>
              </div>
              <div>
                <p className="font-bold text-lg">Tippen üben</p>
                <p className="text-sm text-[#F0DCC0]/50">Wörter auf der Hebräisch-Tastatur tippen</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/flashcards')}
            className="touch-target bg-[#1A1A2E] border border-[#5B8DB8]/30 rounded-2xl p-5 text-left active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5B8DB8]/10 flex items-center justify-center flex-shrink-0">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5B8DB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 8h10M7 12h6"/></svg>
              </div>
              <div>
                <p className="font-bold text-lg">Karteikarten</p>
                <p className="text-sm text-[#F0DCC0]/50">Spaced Repetition (Leitner-System)</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Finished screen
  if (finished) {
    const pct = Math.round((score / total) * 100);
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '⭐' : pct >= 50 ? '👍' : '💪';
    return (
      <div className="flex flex-col h-dvh p-4 max-w-lg mx-auto items-center justify-center">
        <div className="text-6xl mb-4 pop-in">{emoji}</div>
        <h2 className="text-2xl font-bold text-[#5B8DB8]">{score} / {total} richtig!</h2>
        <p className="text-[#F0DCC0]/60 mt-2">
          {pct >= 90 ? 'Metsuyán! Perfekt!' : pct >= 70 ? 'Tov meod! Gut gemacht!' : pct >= 50 ? 'Nicht schlecht! Weiter üben.' : 'Übung macht den Meister!'}
        </p>
        <div className="flex gap-3 mt-8 w-full max-w-xs">
          <button
            onClick={() => {
              setMode(null);
              setFinished(false);
            }}
            className="flex-1 touch-target bg-[#1A1A2E] rounded-2xl p-4 font-semibold active:scale-95 transition-transform"
          >
            ← Zurück
          </button>
          <button
            onClick={() => {
              if (mode === 'letters') generateLetterQuiz();
              else generateWordQuiz();
              setFinished(false);
            }}
            className="flex-1 touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl p-4 font-bold active:scale-95 transition-transform"
          >
            Nochmal 🔄
          </button>
        </div>
      </div>
    );
  }

  // Quiz screen
  if (questions.length === 0) {
    return (
      <div className="flex flex-col h-dvh items-center justify-center p-4">
        <p className="text-[#F0DCC0]/60">Lade Fragen...</p>
      </div>
    );
  }

  const q = questions[currentQ];
  const isHebräischOptions = q.type === 'name-to-char' || q.type === 'german-to-word';

  return (
    <div className="flex flex-col h-dvh p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setMode(null)} className="text-[#5B8DB8] touch-target text-sm">← Zurück</button>
        <span className="text-sm text-[#F0DCC0]/60">
          {mode === 'letters' ? '🔤 Buchstaben' : '📖 Wörter'} · {currentQ + 1}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#1A1A2E] rounded-full h-2 mb-4">
        <div className="bg-[#5B8DB8] h-2 rounded-full transition-all" style={{ width: `${((currentQ + 1) / total) * 100}%` }} />
      </div>

      {/* Score */}
      <div className="text-center mb-2">
        <span className="text-sm text-[#3D7A55]">✓ {score}</span>
        <span className="text-sm text-[#F0DCC0]/30 mx-2">·</span>
        <span className="text-sm text-[#C0392B]">✗ {currentQ - score}</span>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {q.questionHebräisch && (
          <p className="hebrew text-6xl mb-4 text-[#5B8DB8] pop-in" dir="rtl" key={currentQ}>{q.questionHebräisch}</p>
        )}
        <p className="text-lg text-center mb-8 text-[#F0DCC0]/80">{q.question}</p>

        <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {q.options.map((opt, i) => {
            let bg = 'bg-[#1A1A2E]';
            if (showResult) {
              if (opt === q.answer) bg = 'bg-[#3D7A55]';
              else if (opt === selected) bg = 'bg-[#C0392B]';
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                className={`${bg} ${isHebräischOptions ? 'hebrew text-2xl' : 'text-base'} p-4 rounded-2xl touch-target transition-colors active:scale-95`}
                dir={isHebräischOptions ? 'rtl' : 'ltr'}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
