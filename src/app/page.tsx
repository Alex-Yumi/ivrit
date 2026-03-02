'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProgress, getStreak, updateStreak } from '@/lib/storage';
import hebrewData from '@/data/hebrew.json';

export default function Dashboard() {
  const [streak, setStreak] = useState(0);
  const [learned, setLearned] = useState(0);
  const [nextLesson, setNextLesson] = useState(1);
  const [alphabetDone, setAlphabetDone] = useState(false);
  const [completedTopics, setCompletedTopics] = useState(0);

  useEffect(() => {
    const s = updateStreak();
    setStreak(s.currentStreak);
    const p = getProgress();
    setLearned(p.learnedLetters.length);
    const next = p.completedLessons.length > 0
      ? Math.min(Math.max(...p.completedLessons) + 1, hebrewData.lessons.length)
      : 1;
    setNextLesson(next);
    setAlphabetDone(p.completedLessons.length >= hebrewData.lessons.length);
    setCompletedTopics((p.completedTopics || []).length);
  }, []);

  return (
    <div className="flex flex-col h-dvh p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h1 className="text-3xl font-bold">
          <span className="text-[#5B8DB8]">Ivrit</span>{' '}
          <span className="hebrew text-[#5B8DB8]">עברית</span>
        </h1>
        <p className="text-sm text-[#F0DCC0]/60 mt-1">Hebräisch lernen</p>
      </div>

      {/* Streak */}
      <div className="bg-[#1A1A2E] rounded-2xl p-4 mt-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-[#F0DCC0]/60">Täglicher Streak</p>
          <p className="text-2xl font-bold text-[#5B8DB8]">{streak} {streak === 1 ? 'Tag' : 'Tage'} 🔥</p>
        </div>
        <div className="text-4xl">🕎</div>
      </div>

      {/* Progress */}
      <div className="bg-[#1A1A2E] rounded-2xl p-4 mt-3">
        <p className="text-sm text-[#F0DCC0]/60">Fortschritt</p>
        <p className="text-lg font-semibold mt-1">{learned} von 22 Buchstaben gelernt</p>
        <div className="w-full bg-[#0F0F1A] rounded-full h-3 mt-2">
          <div
            className="bg-[#5B8DB8] h-3 rounded-full transition-all duration-500"
            style={{ width: `${(learned / 22) * 100}%` }}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex-1 flex flex-col justify-center gap-3 mt-4">
        <Link href={`/lesson/${nextLesson}`} className="touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl p-4 flex items-center justify-center gap-3 font-bold text-lg active:scale-95 transition-transform">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          Lektion fortsetzen
        </Link>
        {alphabetDone ? (
          <Link href="/topics" className="touch-target bg-[#1A1A2E] border-2 border-[#5B8DB8] rounded-2xl p-4 flex items-center justify-center gap-3 font-bold text-lg active:scale-95 transition-transform text-[#5B8DB8]">
            📚 Themen-Lektionen
            {completedTopics > 0 && <span className="text-sm text-[#F0DCC0]/50">({completedTopics}/5)</span>}
          </Link>
        ) : (
          <div className="bg-[#1A1A2E]/50 border border-[#F0DCC0]/10 rounded-2xl p-4 flex items-center justify-center gap-3 text-lg opacity-50 cursor-not-allowed">
            🔒 Themen-Lektionen
            <span className="text-xs text-[#F0DCC0]/30">Erst das Alphabet abschließen</span>
          </div>
        )}
        <Link href="/practice" className="touch-target bg-[#1A1A2E] border border-[#5B8DB8]/30 rounded-2xl p-4 flex items-center justify-center gap-3 font-semibold text-lg active:scale-95 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B8DB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Üben
        </Link>
        <Link href="/vocabulary" className="touch-target bg-[#1A1A2E] border border-[#5B8DB8]/30 rounded-2xl p-4 flex items-center justify-center gap-3 font-semibold text-lg active:scale-95 transition-transform">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B8DB8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Vokabeln
        </Link>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-[#F0DCC0]/30 pb-2">
        Ivrit — עברית bedeutet Hebräisch 🕎
      </p>
    </div>
  );
}
