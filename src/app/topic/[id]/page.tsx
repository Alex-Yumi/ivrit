'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import hebrewData from '@/data/hebrew.json';
import { getProgress, saveProgress, updateStreak } from '@/lib/storage';
import PairMatching from '@/components/exercises/PairMatching';
import FillInBlank from '@/components/exercises/FillInBlank';
import TypeAnswer from '@/components/exercises/TypeAnswer';
import SentenceShuffle from '@/components/exercises/SentenceShuffle';

// ─── Types ───────────────────────────────────────────────────────────
interface TopicWord {
  hebrew: string;
  latin: string;
  german: string;
}

interface DialogueLine {
  speaker: string;
  hebrew: string;
  latin: string;
  german: string;
}

interface Dialogue {
  title: string;
  lines: DialogueLine[];
}

interface TopicLesson {
  id: number;
  title: string;
  icon: string;
  description: string;
  words: TopicWord[];
  dialogues: Dialogue[];
  grammar: string;
}

type Phase = 'intro' | 'vocab' | 'dialogue' | 'exercises' | 'result';

type Exercise =
  | { type: 'pair'; pairs: { hebrew: string; german: string }[] }
  | { type: 'mc'; question: { prompt: string; hebrew: string; options: string[]; correctIdx: number } }
  | { type: 'fillin'; data: { sentence: string; missingWord: string; blankSentence: string; german: string; options: string[] } }
  | { type: 'typing'; data: TopicWord }
  | { type: 'shuffle'; data: { hebrew: string; german: string; distractors: string[] } };

// ─── TTS Helper ──────────────────────────────────────────────────────
function speak(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    u.rate = 0.8;
    window.speechSynthesis.speak(u);
  }
}

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

// ─── Build exercises from topic data ─────────────────────────────────
function buildExercises(topic: TopicLesson): Exercise[] {
  const exercises: Exercise[] = [];
  const words = topic.words;
  const dialogue = topic.dialogues[0];

  // 2x PairMatching (3 pairs each)
  const shuffledWords = shuffle(words.filter(w => w.hebrew.length <= 15));
  if (shuffledWords.length >= 3) {
    exercises.push({ type: 'pair', pairs: shuffledWords.slice(0, 3).map(w => ({ hebrew: w.hebrew, german: w.german })) });
  }
  if (shuffledWords.length >= 6) {
    exercises.push({ type: 'pair', pairs: shuffledWords.slice(3, 6).map(w => ({ hebrew: w.hebrew, german: w.german })) });
  } else if (shuffledWords.length >= 3) {
    exercises.push({ type: 'pair', pairs: shuffle(shuffledWords).slice(0, 3).map(w => ({ hebrew: w.hebrew, german: w.german })) });
  }

  // 2x MC (Hebräisch→Deutsch)
  const mcWords = shuffle(words).slice(0, 2);
  for (const word of mcWords) {
    const wrongOptions = shuffle(words.filter(w => w.german !== word.german)).slice(0, 3).map(w => w.german);
    const options = shuffle([...wrongOptions, word.german]);
    exercises.push({
      type: 'mc',
      question: {
        prompt: `Was bedeutet „${word.hebrew}"?`,
        hebrew: word.hebrew,
        options,
        correctIdx: options.indexOf(word.german),
      },
    });
  }

  // 2x FillInBlank from dialogue
  if (dialogue) {
    const lines = shuffle([...dialogue.lines]).slice(0, 2);
    for (const line of lines) {
      const lineWords = line.hebrew.replace(/[!?.,"]/g, '').split(' ').filter(w => w.length >= 2);
      if (lineWords.length >= 2) {
        const missingWord = lineWords[Math.floor(Math.random() * lineWords.length)];
        const blankSentence = line.hebrew.replace(missingWord, '___');
        // Get wrong options from other dialogue words
        const allDialogueWords = dialogue.lines.flatMap(l => l.hebrew.replace(/[!?.,"]/g, '').split(' ').filter(w => w.length >= 2 && w !== missingWord));
        const wrongWords = shuffle([...new Set(allDialogueWords)]).slice(0, 3);
        if (wrongWords.length >= 3) {
          exercises.push({
            type: 'fillin',
            data: { sentence: line.hebrew, missingWord, blankSentence, german: line.german, options: shuffle([...wrongWords, missingWord]) },
          });
        }
      }
    }
  }

  // 1x TypeAnswer (short word only)
  const shortWords = words.filter(w => w.hebrew.length <= 6 && !w.hebrew.includes(' '));
  if (shortWords.length > 0) {
    exercises.push({ type: 'typing', data: shuffle(shortWords)[0] });
  }

  // 1x SentenceShuffle from dialogue
  if (dialogue && dialogue.lines.length > 0) {
    const line = dialogue.lines[Math.floor(Math.random() * dialogue.lines.length)];
    const sentenceWords = line.hebrew.split(' ').filter(w => w.length > 0);
    // Create distractors from other words in the topic
    const distractors = shuffle(words.filter(w => !sentenceWords.includes(w.hebrew) && w.hebrew.length <= 8 && !w.hebrew.includes(' ')))
      .slice(0, 2).map(w => w.hebrew);
    exercises.push({
      type: 'shuffle',
      data: { hebrew: line.hebrew, german: line.german, distractors },
    });
  }

  return shuffle(exercises);
}

// ─── Main Component ──────────────────────────────────────────────────
export default function TopicLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const topicId = parseInt(id);
  const topic = (hebrewData as { topicLessons?: TopicLesson[] }).topicLessons?.find(t => t.id === topicId);

  const [phase, setPhase] = useState<Phase>('intro');
  const [vocabIdx, setVocabIdx] = useState(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [mcSelected, setMcSelected] = useState<number | null>(null);
  const [mcShowResult, setMcShowResult] = useState(false);
  const [slideDir, setSlideDir] = useState<'in' | 'out'>('in');

  useEffect(() => { updateStreak(); }, []);

  useEffect(() => {
    if (topic) {
      setExercises(buildExercises(topic));
    }
  }, [topic]);

  if (!topic) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="text-center">
          <p className="text-xl">Thema nicht gefunden</p>
          <button onClick={() => router.push('/topics')} className="mt-4 text-[#5B8DB8] underline">Zurück</button>
        </div>
      </div>
    );
  }

  const transition = (cb: () => void) => {
    setSlideDir('out');
    setTimeout(() => {
      cb();
      setSlideDir('in');
    }, 200);
  };

  const goNextVocab = () => {
    if (vocabIdx < topic.words.length - 1) {
      transition(() => setVocabIdx(prev => prev + 1));
    } else {
      transition(() => setPhase('dialogue'));
    }
  };

  const goNextExercise = () => {
    if (exerciseIdx < exercises.length - 1) {
      transition(() => {
        setExerciseIdx(prev => prev + 1);
        setMcSelected(null);
        setMcShowResult(false);
      });
    } else {
      transition(() => setPhase('result'));
    }
  };

  const handleMCAnswer = (optIdx: number, correctIdx: number) => {
    if (mcShowResult) return;
    setMcSelected(optIdx);
    setMcShowResult(true);
    setTotalAnswered(prev => prev + 1);
    if (optIdx === correctIdx) setScore(prev => prev + 1);
    setTimeout(goNextExercise, 1200);
  };

  const saveAndFinish = () => {
    const progress = getProgress();
    if (!progress.completedTopics.includes(topicId)) {
      progress.completedTopics.push(topicId);
    }
    progress.quizScores[topicId] = score;
    saveProgress(progress);
    router.push('/topics');
  };

  // Progress calculation
  const totalPhases = topic.words.length + (topic.dialogues[0]?.lines.length || 0) + exercises.length + 2;
  let currentProgress = 0;
  if (phase === 'intro') currentProgress = 0;
  else if (phase === 'vocab') currentProgress = 1 + vocabIdx;
  else if (phase === 'dialogue') currentProgress = 1 + topic.words.length;
  else if (phase === 'exercises') currentProgress = 1 + topic.words.length + 1 + exerciseIdx;
  else currentProgress = totalPhases;
  const progressPercent = Math.min((currentProgress / totalPhases) * 100, 100);

  const animClass = slideDir === 'in' ? 'animate-slideIn' : 'animate-slideOut';

  return (
    <div className="flex flex-col h-dvh p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => router.push('/topics')} className="text-[#5B8DB8] touch-target">← Zurück</button>
        <span className="text-sm text-[#F0DCC0]/60">
          {topic.icon} {topic.title}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[#1A1A2E] rounded-full h-2 mb-4">
        <div className="bg-[#5B8DB8] h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Phase indicator */}
      {phase !== 'result' && (
        <div className="flex justify-center mb-3">
          <span className={`text-xs px-3 py-1 rounded-full ${
            phase === 'intro' ? 'bg-[#5B8DB8]/20 text-[#5B8DB8]' :
            phase === 'vocab' ? 'bg-purple-500/20 text-purple-400' :
            phase === 'dialogue' ? 'bg-blue-500/20 text-blue-400' :
            'bg-[#3D7A55]/20 text-[#3D7A55]'
          }`}>
            {phase === 'intro' ? '📖 Einführung' :
             phase === 'vocab' ? `📝 Vokabeln (${vocabIdx + 1}/${topic.words.length})` :
             phase === 'dialogue' ? '💬 Dialog' :
             `🧩 Übung (${exerciseIdx + 1}/${exercises.length})`}
          </span>
        </div>
      )}

      {/* ──── INTRO ──── */}
      {phase === 'intro' && (
        <div className={`flex-1 flex flex-col items-center justify-center ${animClass}`}>
          <div className="text-6xl mb-4">{topic.icon}</div>
          <h1 className="text-2xl font-bold mb-2 text-[#5B8DB8]">{topic.title}</h1>
          <p className="text-[#F0DCC0]/60 mb-6 text-center">{topic.description}</p>

          {/* Grammar tip */}
          <div className="bg-[#1A1A2E] border border-[#5B8DB8]/30 rounded-2xl p-4 w-full max-w-sm mb-6">
            <p className="text-xs text-[#5B8DB8] mb-1">💡 Grammatik-Tipp</p>
            <p className="text-sm text-[#F0DCC0]/80">{topic.grammar}</p>
          </div>

          <p className="text-sm text-[#F0DCC0]/40 mb-6">
            {topic.words.length} Vokabeln · {topic.dialogues.length} Dialog · Übungen
          </p>

          <button
            onClick={() => transition(() => setPhase('vocab'))}
            className="w-full max-w-sm touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl p-4 font-bold active:scale-95 transition-transform"
          >
            Los geht&apos;s! →
          </button>
        </div>
      )}

      {/* ──── VOCAB ──── */}
      {phase === 'vocab' && (
        <div className={`flex-1 flex flex-col items-center justify-center ${animClass}`} key={`vocab-${vocabIdx}`}>
          <div className="flex items-center gap-3 mb-4">
            <p className="hebrew text-6xl text-[#5B8DB8]" dir="rtl">{topic.words[vocabIdx].hebrew}</p>
            <SpeakerButton text={topic.words[vocabIdx].hebrew} size={28} />
          </div>
          <p className="text-lg text-[#F0DCC0]/80 mb-1">{topic.words[vocabIdx].latin}</p>
          <p className="text-[#F0DCC0]/60 mb-8">{topic.words[vocabIdx].german}</p>

          {/* Vocab counter dots */}
          <div className="flex gap-1.5 mb-6">
            {topic.words.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= vocabIdx ? 'bg-[#5B8DB8]' : 'bg-[#1A1A2E]'}`} />
            ))}
          </div>

          <button
            onClick={goNextVocab}
            className="w-full max-w-sm touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl p-4 font-bold active:scale-95 transition-transform"
          >
            {vocabIdx < topic.words.length - 1 ? 'Weiter →' : 'Zum Dialog →'}
          </button>
        </div>
      )}

      {/* ──── DIALOGUE ──── */}
      {phase === 'dialogue' && topic.dialogues[0] && (
        <div className={`flex-1 flex flex-col ${animClass}`}>
          <h2 className="text-center text-lg font-semibold mb-1 text-[#5B8DB8]">
            💬 {topic.dialogues[0].title}
          </h2>
          <p className="text-center text-xs text-[#F0DCC0]/40 mb-4">Tippe auf 🔊 um zuzuhören</p>

          <div className="flex-1 overflow-y-auto space-y-3 pb-4">
            {topic.dialogues[0].lines.map((line, i) => {
              const isA = line.speaker === 'A';
              return (
                <div key={i} className={`flex ${isA ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 ${
                    isA ? 'bg-[#5B8DB8]/10 border border-[#5B8DB8]/20 rounded-bl-sm' : 'bg-[#1A1A2E] border border-blue-500/20 rounded-br-sm'
                  }`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="hebrew text-lg leading-relaxed" dir="rtl">{line.hebrew}</p>
                        <p className="text-xs text-[#5B8DB8]/70 mt-0.5">{line.latin}</p>
                        <p className="text-xs text-[#F0DCC0]/40 mt-0.5">{line.german}</p>
                      </div>
                      <SpeakerButton text={line.hebrew} size={18} />
                    </div>
                    <p className={`text-[10px] mt-1 ${isA ? 'text-[#5B8DB8]/40' : 'text-blue-400/40'}`}>
                      {isA ? '🅰' : '🅱'} Sprecher {line.speaker}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => transition(() => setPhase('exercises'))}
            className="w-full touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl p-4 font-bold active:scale-95 transition-transform mt-2"
          >
            Jetzt üben! →
          </button>
        </div>
      )}

      {/* ──── EXERCISES ──── */}
      {phase === 'exercises' && exercises[exerciseIdx] && (() => {
        const ex = exercises[exerciseIdx];
        switch (ex.type) {
          case 'pair':
            return (
              <div className={`flex-1 flex flex-col items-center justify-center w-full ${animClass}`} key={`ex-${exerciseIdx}`}>
                <PairMatching
                  data={ex.pairs}
                  onCorrect={() => {
                    setScore(prev => prev + 1);
                    setTotalAnswered(prev => prev + 1);
                    setTimeout(goNextExercise, 1500);
                  }}
                  onWrong={() => {}}
                />
              </div>
            );
          case 'mc':
            return (
              <div className={`flex-1 flex flex-col items-center justify-center ${animClass}`} key={`ex-${exerciseIdx}`}>
                <p className="text-lg mb-2 text-[#F0DCC0]/60">{ex.question.prompt}</p>
                <div className="flex items-center gap-2 mb-8">
                  <p className="hebrew text-3xl text-[#5B8DB8]" dir="rtl">{ex.question.hebrew}</p>
                  <SpeakerButton text={ex.question.hebrew} size={24} />
                </div>
                <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                  {ex.question.options.map((opt, i) => {
                    let bg = 'bg-[#1A1A2E]';
                    if (mcShowResult) {
                      if (i === ex.question.correctIdx) bg = 'bg-[#3D7A55]';
                      else if (i === mcSelected) bg = 'bg-[#C0392B]';
                    }
                    return (
                      <button key={i} onClick={() => handleMCAnswer(i, ex.question.correctIdx)}
                        className={`${bg} text-base p-5 rounded-2xl touch-target transition-colors active:scale-95`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {mcShowResult && mcSelected !== null && (
                  <p className={`mt-4 font-bold pop-in ${mcSelected === ex.question.correctIdx ? 'text-[#3D7A55]' : 'text-[#C0392B]'}`}>
                    {mcSelected === ex.question.correctIdx ? '✓ Richtig!' : '✗ Falsch'}
                  </p>
                )}
              </div>
            );
          case 'fillin':
            return (
              <div className={`flex-1 flex flex-col items-center justify-center w-full ${animClass}`} key={`ex-${exerciseIdx}`}>
                <FillInBlank
                  data={ex.data}
                  onCorrect={() => {
                    setScore(prev => prev + 1);
                    setTotalAnswered(prev => prev + 1);
                    setTimeout(goNextExercise, 1500);
                  }}
                  onWrong={() => {
                    setTotalAnswered(prev => prev + 1);
                    setTimeout(goNextExercise, 2500);
                  }}
                />
              </div>
            );
          case 'typing':
            return (
              <div className={`flex-1 flex flex-col items-center justify-center w-full ${animClass}`} key={`ex-${exerciseIdx}`}>
                <TypeAnswer
                  data={ex.data}
                  onCorrect={() => {
                    setScore(prev => prev + 1);
                    setTotalAnswered(prev => prev + 1);
                    setTimeout(goNextExercise, 1500);
                  }}
                  onWrong={() => {
                    setTotalAnswered(prev => prev + 1);
                    setTimeout(goNextExercise, 2500);
                  }}
                />
              </div>
            );
          case 'shuffle':
            return (
              <div className={`flex-1 flex flex-col items-center justify-center w-full ${animClass}`} key={`ex-${exerciseIdx}`}>
                <SentenceShuffle
                  data={ex.data}
                  onCorrect={() => {
                    setScore(prev => prev + 1);
                    setTotalAnswered(prev => prev + 1);
                    setTimeout(goNextExercise, 1500);
                  }}
                  onWrong={() => {
                    setTotalAnswered(prev => prev + 1);
                    setTimeout(goNextExercise, 2500);
                  }}
                />
              </div>
            );
          default:
            return null;
        }
      })()}

      {/* ──── RESULT ──── */}
      {phase === 'result' && (
        <div className={`flex-1 flex flex-col items-center justify-center ${animClass}`}>
          {(() => {
            const percent = totalAnswered > 0 ? Math.round((score / totalAnswered) * 100) : 100;
            return (
              <>
                <div className="text-6xl mb-4">{percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '💪'}</div>
                <h1 className="text-2xl font-bold mb-2">{topic.icon} {topic.title}</h1>
                <p className="text-lg text-[#5B8DB8] mb-2">
                  {score} von {totalAnswered} richtig ({percent}%)
                </p>
                <p className="text-sm text-[#F0DCC0]/40 mb-6">
                  {topic.words.length} Vokabeln gelernt + Dialog geübt
                </p>

                <div className="w-full max-w-xs space-y-3">
                  <button onClick={saveAndFinish}
                    className="w-full touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl p-4 font-bold active:scale-95 transition-transform">
                    Fertig ✓
                  </button>
                  <button onClick={() => {
                    setPhase('intro');
                    setVocabIdx(0);
                    setExerciseIdx(0);
                    setScore(0);
                    setTotalAnswered(0);
                    setMcSelected(null);
                    setMcShowResult(false);
                    setExercises(buildExercises(topic));
                  }}
                    className="w-full touch-target bg-[#1A1A2E] border border-[#5B8DB8]/30 rounded-2xl p-4 font-semibold active:scale-95 transition-transform">
                    🔄 Nochmal
                  </button>
                  <button onClick={() => router.push('/topics')}
                    className="w-full touch-target bg-[#1A1A2E] rounded-2xl p-4 font-semibold active:scale-95 transition-transform">
                    ← Alle Themen
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
