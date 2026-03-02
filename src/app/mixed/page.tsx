'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import hebrewData from '@/data/hebrew.json';
import { getProgress, updateStreak } from '@/lib/storage';
import PairMatching from '@/components/exercises/PairMatching';
import SentenceShuffle from '@/components/exercises/SentenceShuffle';
import FillInBlank from '@/components/exercises/FillInBlank';
import TypeAnswer from '@/components/exercises/TypeAnswer';
import ListeningExercise from '@/components/exercises/ListeningExercise';

type ExerciseType = 'pairs' | 'shuffle' | 'fill' | 'type' | 'listen' | 'mc';

interface Exercise {
  type: ExerciseType;
  data: unknown;
}

function getAllWords(): Array<{ hebrew: string; latin: string; german: string }> {
  const words: Array<{ hebrew: string; latin: string; german: string }> = [];
  const seen = new Set<string>();

  // From vocabulary
  for (const cat of hebrewData.vocabulary) {
    for (const w of cat.words) {
      if (!seen.has(w.hebrew)) {
        words.push(w);
        seen.add(w.hebrew);
      }
    }
  }

  // From alphabet examples
  for (const letter of hebrewData.alphabet) {
    const l = letter as typeof letter & { examples?: Record<string, { hebrew: string; latin: string; german: string }> };
    if (l.examples) {
      for (const pos of ['begin', 'middle', 'end']) {
        const ex = l.examples[pos];
        if (ex && !seen.has(ex.hebrew)) {
          words.push(ex);
          seen.add(ex.hebrew);
        }
      }
    }
  }

  return words;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MixedTrainingPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [finished, setFinished] = useState(false);
  const [waitingNext, setWaitingNext] = useState(false);

  useEffect(() => {
    updateStreak();
    generateExercises();
  }, []);

  const generateExercises = useCallback(() => {
    const allWords = getAllWords();
    const words = shuffle(allWords);
    const sentences = hebrewData.sentences as Array<{ hebrew: string; latin: string; german: string }>;
    const exs: Exercise[] = [];

    // 1. Pair matching (x2)
    for (let i = 0; i < 2; i++) {
      const slice = words.slice(i * 3, i * 3 + 3);
      if (slice.length >= 3) {
        exs.push({ type: 'pairs', data: slice });
      }
    }

    // 2. Fill in blank (x3) — uses sentences
    const fillSentences = shuffle(sentences).slice(0, 3);
    for (const s of fillSentences) {
      const sWords = s.hebrew.split(' ').filter((w: string) => w.length > 1);
      if (sWords.length >= 2) {
        const missingIdx = Math.floor(Math.random() * sWords.length);
        const missingWord = sWords[missingIdx];
        const blankSentence = sWords.map((w: string, i: number) => i === missingIdx ? '___' : w).join(' ');
        const wrongOptions = words
          .filter(x => x.hebrew !== missingWord)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map(x => x.hebrew);
        exs.push({
          type: 'fill',
          data: {
            sentence: s.hebrew,
            missingWord,
            blankSentence,
            german: s.german,
            options: shuffle([...wrongOptions, missingWord]),
          },
        });
      }
    }

    // 3. Sentence shuffle (x2)
    const shuffleSentences = shuffle(sentences).slice(0, 2);
    for (const s of shuffleSentences) {
      const sentenceWords = s.hebrew.split(' ');
      if (sentenceWords.length >= 2) {
        const distractors = words
          .filter(w => !sentenceWords.includes(w.hebrew))
          .sort(() => Math.random() - 0.5)
          .slice(0, 2)
          .map(w => w.hebrew);
        exs.push({
          type: 'shuffle',
          data: {
            hebrew: s.hebrew,
            german: s.german,
            distractors,
          },
        });
      }
    }

    // 4. Type answer (x3)
    const typeWords = shuffle(words.filter(w => w.hebrew.length <= 6)).slice(0, 3);
    for (const w of typeWords) {
      exs.push({
        type: 'type',
        data: { hebrew: w.hebrew, latin: w.latin, german: w.german },
      });
    }

    // 5. Listening (x2)
    const listenWords = shuffle(words).slice(0, 2);
    for (const w of listenWords) {
      const wrongOptions = words
        .filter(x => x.hebrew !== w.hebrew)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(x => x.hebrew);
      exs.push({
        type: 'listen',
        data: {
          hebrew: w.hebrew,
          latin: w.latin,
          german: w.german,
          options: shuffle([w.hebrew, ...wrongOptions]),
        },
      });
    }

    // 6. Multiple choice (x3)
    const mcWords = shuffle(words).slice(0, 3);
    for (const w of mcWords) {
      const wrongOptions = words
        .filter(x => x.hebrew !== w.hebrew)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(x => x.german);
      exs.push({
        type: 'mc',
        data: {
          question: w.hebrew,
          latin: w.latin,
          answer: w.german,
          options: shuffle([...wrongOptions, w.german]),
        },
      });
    }

    setExercises(shuffle(exs).slice(0, 12));
    setCurrentIdx(0);
    setScore(0);
    setErrors(0);
    setFinished(false);
  }, []);

  const goNext = useCallback(() => {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setWaitingNext(false);
    } else {
      setFinished(true);
    }
  }, [currentIdx, exercises.length]);

  const handleCorrect = useCallback(() => {
    setScore(prev => prev + 1);
    setWaitingNext(true);
    setTimeout(goNext, 1200);
  }, [goNext]);

  const handleWrong = useCallback(() => {
    setErrors(prev => prev + 1);
  }, []);

  if (exercises.length === 0) {
    return <div className="flex items-center justify-center h-dvh"><p className="text-[#F0DCC0]/50">Lade...</p></div>;
  }

  if (finished) {
    const total = exercises.length;
    const pct = Math.round((score / total) * 100);
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '⭐' : pct >= 50 ? '👍' : '💪';
    return (
      <div className="flex flex-col h-dvh p-4 max-w-lg mx-auto items-center justify-center">
        <div className="text-6xl mb-4 pop-in">{emoji}</div>
        <h2 className="text-2xl font-bold text-[#5B8DB8]">{score} / {total} richtig!</h2>
        <p className="text-sm text-[#F0DCC0]/50 mt-1">{errors} Fehler</p>
        <p className="text-[#F0DCC0]/60 mt-2">
          {pct >= 90 ? 'Metsuyán! Perfekt!' : pct >= 70 ? 'Tov meod! Gut gemacht!' : pct >= 50 ? 'Nicht schlecht!' : 'Übung macht den Meister!'}
        </p>
        <div className="flex gap-3 mt-8 w-full max-w-xs">
          <button onClick={() => router.push('/practice')} className="flex-1 touch-target bg-[#1A1A2E] rounded-2xl p-4 font-semibold active:scale-95 transition-transform">
            ← Zurück
          </button>
          <button onClick={() => { generateExercises(); }} className="flex-1 touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl p-4 font-bold active:scale-95 transition-transform">
            Nochmal 🔄
          </button>
        </div>
      </div>
    );
  }

  const ex = exercises[currentIdx];
  const typeLabel: Record<ExerciseType, string> = {
    pairs: '🔗 Paare zuordnen',
    shuffle: '🧩 Satz bauen',
    fill: '📝 Lückentext',
    type: '⌨️ Tippen',
    listen: '🎧 Hören',
    mc: '❓ Quiz',
  };

  return (
    <div className="flex flex-col h-dvh p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => router.push('/practice')} className="text-[#5B8DB8] touch-target text-sm">← Zurück</button>
        <span className="text-sm text-[#F0DCC0]/60">{typeLabel[ex.type]} · {currentIdx + 1}/{exercises.length}</span>
      </div>

      {/* Progress */}
      <div className="w-full bg-[#1A1A2E] rounded-full h-2 mb-2">
        <div className="bg-[#5B8DB8] h-2 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / exercises.length) * 100}%` }} />
      </div>

      {/* Score */}
      <div className="text-center mb-3">
        <span className="text-sm text-[#3D7A55]">✓ {score}</span>
        <span className="text-sm text-[#F0DCC0]/30 mx-2">·</span>
        <span className="text-sm text-[#C0392B]">✗ {errors}</span>
      </div>

      {/* Exercise */}
      <div className="flex-1 flex flex-col items-center justify-center" key={currentIdx}>
        {ex.type === 'pairs' && (
          <PairMatching
            data={ex.data as Array<{ hebrew: string; german: string }>}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )}

        {ex.type === 'shuffle' && (
          <SentenceShuffle
            data={ex.data as { hebrew: string; german: string; distractors: string[] }}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )}

        {ex.type === 'fill' && (
          <FillInBlank
            data={ex.data as { sentence: string; missingWord: string; blankSentence: string; german: string; options: string[] }}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )}

        {ex.type === 'type' && (
          <TypeAnswer
            data={ex.data as { hebrew: string; latin: string; german: string }}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )}

        {ex.type === 'listen' && (
          <ListeningExercise
            data={ex.data as { hebrew: string; latin: string; german: string; options: string[] }}
            onCorrect={handleCorrect}
            onWrong={handleWrong}
          />
        )}

        {ex.type === 'mc' && (() => {
          const d = ex.data as { question: string; latin: string; answer: string; options: string[] };
          return (
            <div className="flex flex-col items-center w-full">
              <p className="text-sm text-[#F0DCC0]/50 mb-2">Was bedeutet dieses Wort?</p>
              <p className="hebrew text-4xl text-[#5B8DB8] mb-1" dir="rtl">{d.question}</p>
              <p className="text-sm text-[#F0DCC0]/40 mb-6">{d.latin}</p>
              <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
                {d.options.map((opt, i) => (
                  <MCButton key={i} option={opt} answer={d.answer} onCorrect={handleCorrect} onWrong={handleWrong} />
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function MCButton({ option, answer, onCorrect, onWrong }: { option: string; answer: string; onCorrect: () => void; onWrong: () => void }) {
  const [state, setState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [disabled, setDisabled] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    setDisabled(true);
    if (option === answer) {
      setState('correct');
      onCorrect();
    } else {
      setState('wrong');
      onWrong();
      setTimeout(() => { setState('idle'); setDisabled(false); }, 800);
    }
  };

  const bg = state === 'correct' ? 'bg-[#3D7A55]' : state === 'wrong' ? 'bg-[#C0392B]' : 'bg-[#1A1A2E]';

  return (
    <button onClick={handleClick} className={`${bg} p-4 rounded-2xl touch-target transition-colors active:scale-95`}>
      {option}
    </button>
  );
}
