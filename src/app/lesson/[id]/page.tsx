'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import hebrewData from '@/data/hebrew.json';
import { getProgress, saveProgress, updateStreak } from '@/lib/storage';
import TypeAnswer from '@/components/exercises/TypeAnswer';
import PairMatching from '@/components/exercises/PairMatching';
import FillInBlank from '@/components/exercises/FillInBlank';

// ─── Types ───────────────────────────────────────────────────────────
type FormKey = 'isolated' | 'initial' | 'medial' | 'final';

interface ExampleWord {
  hebrew: string;
  latin: string;
  german: string;
}

interface LetterData {
  char: string;
  name: string;
  sound: string;
  forms: Record<FormKey, string>;
  exampleWord: ExampleWord;
  examples?: {
    begin: ExampleWord;
    middle: ExampleWord;
    end: ExampleWord;
  };
}

type Step =
  | { type: 'recognize'; letterIdx: number }
  | { type: 'mc'; question: MCQuestion }
  | { type: 'typing'; word: ExampleWord; letterName: string }
  | { type: 'pair'; pairs: { hebrew: string; german: string }[] }
  | { type: 'fillin'; data: FillInData }
  | { type: 'retry'; question: MCQuestion }
  | { type: 'result' };

interface MCQuestion {
  kind: 'identify-letter' | 'identify-form' | 'word-meaning';
  prompt: string;
  options: string[];
  correctIdx: number;
  letterChar: string;
}

interface FillInData {
  sentence: string;
  missingWord: string;
  blankSentence: string;
  german: string;
  options: string[];
}

// ─── Constants ───────────────────────────────────────────────────────
// Hebrew letters with Sofit (final) forms: Kaf, Mem, Nun, Pe, Tsade
const HAS_SOFIT = new Set(['כ', 'מ', 'נ', 'פ', 'צ']);

const FORM_LABELS: Record<FormKey, string> = {
  isolated: 'Standard',
  initial: 'Anfang',
  medial: 'Mitte',
  final: 'Sofit (Ende)',
};

const FORM_HINTS: Record<FormKey, string> = {
  isolated: 'Normal',
  initial: 'Wortanfang',
  medial: 'Wortmitte',
  final: 'Wortende',
};

// ─── TTS Helper ──────────────────────────────────────────────────────
function speak(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'he-IL';
    utter.rate = 0.8;
    window.speechSynthesis.speak(utter);
  }
}

// Speaker icon component
function SpeakerButton({ text, size = 24 }: { text: string; size?: number }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); speak(text); }}
      className="inline-flex items-center justify-center touch-target active:scale-90 transition-transform"
      aria-label="Aussprechen"
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#5B8DB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  );
}

// ─── Shuffle helper ──────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Build steps for a lesson ────────────────────────────────────────
function buildLessonSteps(letters: LetterData[], allAlphabet: LetterData[]): Step[] {
  const steps: Step[] = [];

  // Phase 1 + 2: For each letter: Recognize then MC
  for (let li = 0; li < letters.length; li++) {
    const letter = letters[li];
    // Phase 1: Recognize
    steps.push({ type: 'recognize', letterIdx: li });

    // Phase 2: MC questions (2-3 per letter)
    const mcQuestions = buildMCQuestions(letter, allAlphabet, letters);
    for (const q of mcQuestions) {
      steps.push({ type: 'mc', question: q });
    }
  }

  // Phase 3: Typing for ALL letters (mixed)
  const typingSteps: Step[] = [];
  for (const letter of letters) {
    const examples = getExampleWords(letter);
    // Pick 1-2 words per letter
    const picked = examples.slice(0, Math.min(2, examples.length));
    for (const word of picked) {
      typingSteps.push({ type: 'typing', word, letterName: letter.name });
    }
  }
  steps.push(...shuffle(typingSteps));

  // Phase 4: Consolidation (pair matching + fill-in-blank)
  // Pair matching: use example words from all letters
  const allPairs: { hebrew: string; german: string }[] = [];
  for (const letter of letters) {
    const examples = getExampleWords(letter);
    for (const ex of examples) {
      allPairs.push({ hebrew: ex.hebrew, german: ex.german });
    }
  }
  // Create 1-2 pair matching exercises with 3 pairs each
  const shuffledPairs = shuffle(allPairs);
  if (shuffledPairs.length >= 3) {
    steps.push({ type: 'pair', pairs: shuffledPairs.slice(0, 3) });
  }
  if (shuffledPairs.length >= 6) {
    steps.push({ type: 'pair', pairs: shuffledPairs.slice(3, 6) });
  }

  // Fill-in-blank from sentences (if available)
  const fillIns = buildFillInBlanks(letters);
  for (const fi of fillIns.slice(0, 2)) {
    steps.push({ type: 'fillin', data: fi });
  }

  return steps;
}

function getExampleWords(letter: LetterData): ExampleWord[] {
  const words: ExampleWord[] = [];
  if (letter.examples) {
    words.push(letter.examples.begin, letter.examples.middle, letter.examples.end);
  } else {
    words.push(letter.exampleWord);
  }
  return words;
}

function buildMCQuestions(letter: LetterData, allAlphabet: LetterData[], lessonLetters: LetterData[]): MCQuestion[] {
  const questions: MCQuestion[] = [];
  const others = allAlphabet.filter(l => l.char !== letter.char);

  // Q1: "Welcher Buchstabe ist [Name]?" → 4 Hebräisch chars
  {
    const wrongs = shuffle(others).slice(0, 3).map(l => l.char);
    const options = shuffle([...wrongs, letter.char]);
    questions.push({
      kind: 'identify-letter',
      prompt: `Welcher Buchstabe ist „${letter.name}"?`,
      options,
      correctIdx: options.indexOf(letter.char),
      letterChar: letter.char,
    });
  }

  // Q2: "Welche Form ist [form]?" → 4 text options
  {
    const formKeys: FormKey[] = ['isolated', 'initial', 'medial', 'final'];
    const targetForm = formKeys[Math.floor(Math.random() * 4)];
    const options = shuffle(formKeys);
    questions.push({
      kind: 'identify-form',
      prompt: `Welche Position hat diese Form?`,
      options: options.map(f => FORM_LABELS[f]),
      correctIdx: options.indexOf(targetForm),
      letterChar: letter.forms[targetForm],
    });
  }

  // Q3: "Was bedeutet [Beispielwort]?" → 4 german options
  {
    const exWords = getExampleWords(letter);
    const target = exWords[0];
    // Get wrong german meanings from other letters
    const wrongGermans: string[] = [];
    for (const other of shuffle(others)) {
      const otherWords = getExampleWords(other);
      for (const w of otherWords) {
        if (w.german !== target.german && !wrongGermans.includes(w.german)) {
          wrongGermans.push(w.german);
          if (wrongGermans.length >= 3) break;
        }
      }
      if (wrongGermans.length >= 3) break;
    }
    const options = shuffle([...wrongGermans.slice(0, 3), target.german]);
    questions.push({
      kind: 'word-meaning',
      prompt: `Was bedeutet „${target.hebrew}"?`,
      options,
      correctIdx: options.indexOf(target.german),
      letterChar: target.hebrew,
    });
  }

  return questions;
}

function buildFillInBlanks(letters: LetterData[]): FillInData[] {
  const results: FillInData[] = [];
  const sentences = hebrewData.sentences || [];
  const letterChars = new Set(letters.map(l => l.char));

  for (const sent of shuffle([...sentences])) {
    // Find a word in the sentence that contains one of our letters
    const words = sent.hebrew.split(' ');
    for (const word of words) {
      if (word.length >= 2 && [...word].some(ch => letterChars.has(ch))) {
        const blankSentence = sent.hebrew.replace(word, '___');
        // Get wrong options from other words in sentences
        const wrongWords = shuffle(
          sentences
            .flatMap(s => s.hebrew.split(' '))
            .filter(w => w !== word && w.length >= 2)
        ).slice(0, 3);
        if (wrongWords.length >= 3) {
          results.push({
            sentence: sent.hebrew,
            missingWord: word,
            blankSentence,
            german: sent.german,
            options: shuffle([...wrongWords, word]),
          });
          break;
        }
      }
    }
    if (results.length >= 2) break;
  }

  return results;
}

// ─── Main Component ──────────────────────────────────────────────────
export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const lessonId = parseInt(id);
  const lesson = hebrewData.lessons.find(l => l.id === lessonId);

  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<MCQuestion[]>([]);
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [mcShowResult, setMcShowResult] = useState(false);
  const [exerciseDone, setExerciseDone] = useState(false);
  const [slideDir, setSlideDir] = useState<'in' | 'out'>('in');
  const [retryScore, setRetryScore] = useState(0);
  const stepRef = useRef(currentStep);

  useEffect(() => { updateStreak(); }, []);

  // Build steps once on mount
  useEffect(() => {
    if (!lesson) return;
    const letters = lesson.letterIndices.map(i => hebrewData.alphabet[i]) as LetterData[];
    const built = buildLessonSteps(letters, hebrewData.alphabet as LetterData[]);
    setSteps(built);
  }, [lesson]);

  const letters = lesson ? lesson.letterIndices.map(i => hebrewData.alphabet[i]) as LetterData[] : [];

  const goNext = useCallback(() => {
    setSlideDir('out');
    setTimeout(() => {
      setCurrentStep(prev => {
        const next = prev + 1;
        stepRef.current = next;
        return next;
      });
      setMcSelected(null);
      setMcShowResult(false);
      setExerciseDone(false);
      setSlideDir('in');
    }, 200);
  }, []);

  // After all normal steps: add retry steps for wrong answers, then result
  useEffect(() => {
    if (steps.length === 0) return;
    if (currentStep === steps.length && wrongQuestions.length > 0) {
      // Add retry steps + result
      const retrySteps: Step[] = wrongQuestions.map(q => ({ type: 'retry' as const, question: q }));
      retrySteps.push({ type: 'result' });
      setSteps(prev => [...prev, ...retrySteps]);
      setWrongQuestions([]);
    } else if (currentStep === steps.length && wrongQuestions.length === 0) {
      // No wrong answers — just add result
      setSteps(prev => [...prev, { type: 'result' }]);
    }
  }, [currentStep, steps.length, wrongQuestions]);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="text-center">
          <p className="text-xl">Lektion nicht gefunden</p>
          <button onClick={() => router.push('/')} className="mt-4 text-[#5B8DB8] underline">Zurück</button>
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="animate-pulse text-[#5B8DB8]">Lektion wird vorbereitet...</div>
      </div>
    );
  }

  const step = steps[currentStep];
  if (!step) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="animate-pulse text-[#5B8DB8]">Laden...</div>
      </div>
    );
  }

  const totalSteps = steps.length;
  const progress = Math.min(((currentStep + 1) / totalSteps) * 100, 100);

  // ─── MC Answer Handler ──────────────────────────────────────
  const handleMCAnswer = (optIdx: number, question: MCQuestion, isRetry: boolean) => {
    if (mcShowResult) return;
    setMcSelected(optIdx);
    setMcShowResult(true);
    const correct = optIdx === question.correctIdx;
    setTotalAnswered(prev => prev + 1);
    if (correct) {
      if (isRetry) {
        setRetryScore(prev => prev + 1);
      } else {
        setScore(prev => prev + 1);
      }
    } else if (!isRetry) {
      setWrongQuestions(prev => [...prev, question]);
    }
    // Auto-advance after delay
    setTimeout(() => goNext(), 1200);
  };

  // ─── Save progress on result ────────────────────────────────
  const saveAndFinish = () => {
    const progress = getProgress();
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
    }
    lesson.letterIndices.forEach(idx => {
      if (!progress.learnedLetters.includes(idx)) {
        progress.learnedLetters.push(idx);
      }
    });
    // Score: full points + half points for retries
    const finalScore = score + Math.floor(retryScore * 0.5);
    progress.quizScores[lessonId] = finalScore;
    saveProgress(progress);
    router.push(`/lesson/${lessonId}/complete?score=${finalScore}&total=${totalAnswered}`);
  };

  // ─── Render Steps ───────────────────────────────────────────
  const renderStep = () => {
    const animClass = slideDir === 'in' ? 'animate-slideIn' : 'animate-slideOut';

    switch (step.type) {
      // ──── PHASE 1: RECOGNIZE ────
      case 'recognize': {
        const letter = letters[step.letterIdx];
        return (
          <div className={`flex-1 flex flex-col items-center justify-center ${animClass}`} key={`rec-${currentStep}`}>
            {/* Big letter with speaker */}
            <div className="flex items-center gap-3 mb-3">
              <div className="hebrew text-8xl text-[#5B8DB8]">{letter.char}</div>
              <SpeakerButton text={letter.char} size={28} />
            </div>
            <p className="text-xl font-semibold mb-1">{letter.name}</p>
            <p className="text-[#F0DCC0]/60 mb-4">
              Laut: <span className="text-[#5B8DB8]">{letter.sound}</span>
            </p>

            {/* 4 Forms */}
            <div className="w-full max-w-sm mb-4">
              <div className="bg-[#1A1A2E]/50 rounded-xl px-3 py-2 mb-2">
                <p className="text-xs text-[#5B8DB8] text-center">
                  📝 Fünf Buchstaben (כ מ נ פ צ) haben eine besondere Sofit-Form am Wortende:
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(FORM_LABELS) as FormKey[]).map(form => (
                  <div key={form} className="bg-[#1A1A2E] rounded-xl p-3 text-center">
                    <p className="text-xs text-[#F0DCC0]/40 mb-1">{FORM_LABELS[form]}</p>
                    <p className="hebrew text-3xl text-[#F0DCC0]">{letter.forms[form]}</p>
                    <p className="text-[10px] text-[#F0DCC0]/25 mt-1">{FORM_HINTS[form]}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-connector warning */}
            {HAS_SOFIT.has(letter.char) && (
              <div className="bg-[#5B8DB8]/10 border border-[#5B8DB8]/30 rounded-xl px-3 py-2 w-full max-w-sm mb-3">
                <p className="text-xs text-[#5B8DB8]/80 text-center">
                  ✡ Sofit-Buchstabe! Hat eine besondere Form am Wortende (ך ם ן ף ץ).
                </p>
              </div>
            )}

            {/* Example words */}
            {letter.examples ? (
              <div className="w-full max-w-sm">
                <p className="text-xs text-[#F0DCC0]/40 mb-2 text-center">
                  Beispielwörter — wo steht <span className="hebrew text-sm text-[#5B8DB8]">{letter.char}</span>?
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(['begin', 'middle', 'end'] as const).map(pos => {
                    const ex = letter.examples![pos];
                    const posLabel = pos === 'begin' ? '▶ Anfang' : pos === 'middle' ? '◆ Mitte' : '◀ Ende';
                    return (
                      <div key={pos} className="bg-[#1A1A2E] rounded-xl p-3 text-center">
                        <p className="text-[10px] text-[#5B8DB8]/60 mb-1">{posLabel}</p>
                        <div className="flex items-center justify-center gap-1">
                          <p className="hebrew text-xl" dir="rtl">{ex.hebrew}</p>
                          <SpeakerButton text={ex.hebrew} size={18} />
                        </div>
                        <p className="text-[11px] text-[#5B8DB8]">{ex.latin}</p>
                        <p className="text-[10px] text-[#F0DCC0]/40">{ex.german}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-[#1A1A2E] rounded-xl p-4 w-full max-w-sm text-center">
                <p className="text-xs text-[#F0DCC0]/40 mb-2">Beispielwort</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="hebrew text-2xl">{letter.exampleWord.hebrew}</p>
                  <SpeakerButton text={letter.exampleWord.hebrew} size={20} />
                </div>
                <p className="text-sm text-[#5B8DB8]">{letter.exampleWord.latin}</p>
                <p className="text-xs text-[#F0DCC0]/60">{letter.exampleWord.german}</p>
              </div>
            )}

            {/* Next button */}
            <button
              onClick={goNext}
              className="mt-6 w-full max-w-sm touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl p-4 font-bold active:scale-95 transition-transform"
            >
              Weiter →
            </button>
          </div>
        );
      }

      // ──── PHASE 2: MULTIPLE CHOICE ────
      case 'mc':
      case 'retry': {
        const question = step.question;
        const isRetry = step.type === 'retry';
        const isHebräischOption = question.kind === 'identify-letter';
        return (
          <div className={`flex-1 flex flex-col items-center justify-center ${animClass}`} key={`mc-${currentStep}`}>
            {isRetry && (
              <div className="bg-[#5B8DB8]/10 border border-[#5B8DB8]/30 rounded-xl px-3 py-1.5 mb-4">
                <p className="text-xs text-[#5B8DB8]">🔄 Wiederholung</p>
              </div>
            )}

            <p className="text-lg mb-2 text-[#F0DCC0]/60">{question.prompt}</p>

            {/* Show the letter/form being asked about */}
            <div className="flex items-center gap-2 mb-8">
              <p className={`hebrew text-4xl font-bold text-[#5B8DB8] ${question.kind === 'identify-form' ? '' : ''}`}>
                {question.kind === 'word-meaning' ? '' : question.letterChar}
              </p>
              {question.kind !== 'word-meaning' && (
                <SpeakerButton text={question.letterChar} size={24} />
              )}
              {question.kind === 'word-meaning' && (
                <div className="flex items-center gap-2">
                  <p className="hebrew text-3xl text-[#5B8DB8]" dir="rtl">{question.letterChar}</p>
                  <SpeakerButton text={question.letterChar} size={24} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
              {question.options.map((opt, i) => {
                let bg = 'bg-[#1A1A2E]';
                if (mcShowResult) {
                  if (i === question.correctIdx) bg = 'bg-[#3D7A55]';
                  else if (i === mcSelected) bg = 'bg-[#C0392B]';
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleMCAnswer(i, question, isRetry)}
                    className={`${bg} ${isHebräischOption ? 'hebrew text-4xl' : 'text-base'} p-5 rounded-2xl touch-target transition-colors active:scale-95`}
                    dir={isHebräischOption ? 'rtl' : 'ltr'}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {mcShowResult && mcSelected !== null && (
              <p className={`mt-4 font-bold pop-in ${mcSelected === question.correctIdx ? 'text-[#3D7A55]' : 'text-[#C0392B]'}`}>
                {mcSelected === question.correctIdx ? '✓ Richtig!' : '✗ Falsch'}
              </p>
            )}
          </div>
        );
      }

      // ──── PHASE 3: TYPING ────
      case 'typing': {
        return (
          <div className={`flex-1 flex flex-col items-center justify-center w-full ${animClass}`} key={`type-${currentStep}`}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs text-[#F0DCC0]/40">Buchstabe: {step.letterName}</span>
              <SpeakerButton text={step.word.hebrew} size={20} />
            </div>
            <TypeAnswer
              data={step.word}
              onCorrect={() => {
                setScore(prev => prev + 1);
                setTotalAnswered(prev => prev + 1);
                setExerciseDone(true);
                setTimeout(goNext, 1500);
              }}
              onWrong={() => {
                setTotalAnswered(prev => prev + 1);
                setExerciseDone(true);
                setTimeout(goNext, 2500);
              }}
            />
          </div>
        );
      }

      // ──── PHASE 4: PAIR MATCHING ────
      case 'pair': {
        return (
          <div className={`flex-1 flex flex-col items-center justify-center w-full ${animClass}`} key={`pair-${currentStep}`}>
            <PairMatching
              data={step.pairs}
              onCorrect={() => {
                setScore(prev => prev + 1);
                setTotalAnswered(prev => prev + 1);
                setExerciseDone(true);
                setTimeout(goNext, 1500);
              }}
              onWrong={() => {
                // PairMatching calls onWrong per wrong pair tap, don't count each
              }}
            />
          </div>
        );
      }

      // ──── PHASE 4: FILL IN BLANK ────
      case 'fillin': {
        return (
          <div className={`flex-1 flex flex-col items-center justify-center w-full ${animClass}`} key={`fill-${currentStep}`}>
            <FillInBlank
              data={step.data}
              onCorrect={() => {
                setScore(prev => prev + 1);
                setTotalAnswered(prev => prev + 1);
                setExerciseDone(true);
                setTimeout(goNext, 1500);
              }}
              onWrong={() => {
                setTotalAnswered(prev => prev + 1);
                setExerciseDone(true);
                setTimeout(goNext, 2500);
              }}
            />
          </div>
        );
      }

      // ──── RESULT SCREEN ────
      case 'result': {
        const finalScore = score + Math.floor(retryScore * 0.5);
        const percent = totalAnswered > 0 ? Math.round((finalScore / totalAnswered) * 100) : 0;
        return (
          <div className={`flex-1 flex flex-col items-center justify-center ${animClass}`} key="result">
            <div className="text-6xl mb-4">{percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '💪'}</div>
            <h1 className="text-2xl font-bold mb-2">Lektion {lessonId} abgeschlossen!</h1>
            <p className="text-lg text-[#5B8DB8] mb-2">
              {finalScore} von {totalAnswered} richtig ({percent}%)
            </p>
            {retryScore > 0 && (
              <p className="text-sm text-[#F0DCC0]/40 mb-6">
                +{Math.floor(retryScore * 0.5)} Bonuspunkte aus Wiederholungen
              </p>
            )}

            <div className="w-full max-w-xs space-y-3 mt-4">
              <button
                onClick={saveAndFinish}
                className="w-full touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl p-4 font-bold active:scale-95 transition-transform"
              >
                Weiter →
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full touch-target bg-[#1A1A2E] rounded-2xl p-4 font-semibold active:scale-95 transition-transform"
              >
                🏠 Dashboard
              </button>
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="flex flex-col h-dvh p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => router.push('/')} className="text-[#5B8DB8] touch-target">← Zurück</button>
        <span className="text-sm text-[#F0DCC0]/60">
          {step.type === 'result' ? 'Ergebnis' : `${currentStep + 1}/${totalSteps}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#1A1A2E] rounded-full h-2 mb-4">
        <div
          className="bg-[#5B8DB8] h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Phase indicator */}
      {step.type !== 'result' && (
        <div className="flex justify-center mb-3">
          <span className={`text-xs px-3 py-1 rounded-full ${
            step.type === 'recognize' ? 'bg-[#5B8DB8]/20 text-[#5B8DB8]' :
            step.type === 'mc' ? 'bg-blue-500/20 text-blue-400' :
            step.type === 'retry' ? 'bg-[#C0392B]/20 text-[#C0392B]' :
            step.type === 'typing' ? 'bg-purple-500/20 text-purple-400' :
            'bg-[#3D7A55]/20 text-[#3D7A55]'
          }`}>
            {step.type === 'recognize' ? '👁 Erkennen' :
             step.type === 'mc' ? '🎯 Zuordnen' :
             step.type === 'retry' ? '🔄 Wiederholung' :
             step.type === 'typing' ? '⌨️ Produzieren' :
             '🧩 Festigen'}
          </span>
        </div>
      )}

      {/* Step content */}
      {renderStep()}
    </div>
  );
}
