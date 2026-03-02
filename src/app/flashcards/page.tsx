'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import hebrewData from '@/data/hebrew.json';
import { getDueCards, getFlashcards, saveFlashcardResult, updateStreak } from '@/lib/storage';

type CardType = {
  id: string;
  front: string;
  back: string;
  hint: string;
};

export default function FlashcardsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });

  useEffect(() => {
    updateStreak();
    // Build card IDs from all alphabet letters
    const allIds = hebrewData.alphabet.map((_, i) => `letter-${i}`);
    const dueIds = getDueCards(allIds);

    const dueCards: CardType[] = dueIds.map(id => {
      const idx = parseInt(id.split('-')[1]);
      const letter = hebrewData.alphabet[idx];
      return {
        id,
        front: letter.char,
        back: `${letter.name} — ${letter.sound}`,
        hint: `${letter.exampleWord.hebrew} (${letter.exampleWord.german})`,
      };
    }).sort(() => Math.random() - 0.5);

    setCards(dueCards);
    if (dueCards.length === 0) setDone(true);
  }, []);

  const handleAnswer = (correct: boolean) => {
    const card = cards[currentIndex];
    saveFlashcardResult(card.id, correct);
    setStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      wrong: prev.wrong + (correct ? 0 : 1),
    }));

    setTimeout(() => {
      setFlipped(false);
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setDone(true);
      }
    }, 200);
  };

  if (done) {
    const fcStore = getFlashcards();
    const boxCounts = [0, 0, 0, 0, 0, 0];
    Object.values(fcStore).forEach(c => { boxCounts[c.box]++; });

    return (
      <div className="flex flex-col items-center justify-center h-dvh p-4 max-w-lg mx-auto fade-in">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">
          {cards.length === 0 ? 'Keine Karten fällig!' : 'Geschafft!'}
        </h1>
        {cards.length > 0 && (
          <p className="text-[#5B8DB8] mb-4">
            {stats.correct} richtig, {stats.wrong} falsch
          </p>
        )}
        
        <div className="bg-[#1A1A2E] rounded-2xl p-4 w-full max-w-xs mb-6">
          <p className="text-sm text-[#F0DCC0]/60 mb-2">Leitner-Boxen</p>
          {[1,2,3,4,5].map(box => (
            <div key={box} className="flex justify-between items-center py-1">
              <span className="text-sm">Box {box}</span>
              <span className="text-[#5B8DB8] font-semibold">{boxCounts[box]} Karten</span>
            </div>
          ))}
        </div>

        <button onClick={() => router.push('/')} className="touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl px-8 py-4 font-bold active:scale-95 transition-transform">
          🏠 Dashboard
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <p className="text-[#F0DCC0]/60">Karten werden geladen...</p>
      </div>
    );
  }

  const card = cards[currentIndex];

  return (
    <div className="flex flex-col h-dvh p-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.push('/')} className="text-[#5B8DB8] touch-target">← Zurück</button>
        <span className="text-sm text-[#F0DCC0]/60">{currentIndex + 1} / {cards.length}</span>
      </div>

      {/* Progress */}
      <div className="w-full bg-[#1A1A2E] rounded-full h-2 mb-4">
        <div className="bg-[#5B8DB8] h-2 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center" onClick={() => setFlipped(!flipped)}>
        <div className="card-flip w-full max-w-sm">
          <div className={`card-flip-inner ${flipped ? 'flipped' : ''} relative w-full`} style={{ minHeight: '280px' }}>
            <div className="card-front absolute inset-0 bg-[#1A1A2E] rounded-3xl flex flex-col items-center justify-center p-6 cursor-pointer">
              <p className="hebrew text-7xl mb-4 text-[#5B8DB8]">{card.front}</p>
              <p className="text-sm text-[#F0DCC0]/40">Tippen zum Umdrehen</p>
            </div>
            <div className="card-back absolute inset-0 bg-[#1A1A2E] rounded-3xl flex flex-col items-center justify-center p-6">
              <p className="hebrew text-5xl mb-3">{card.front}</p>
              <p className="text-xl font-semibold text-[#5B8DB8] mb-2">{card.back}</p>
              <p className="text-sm text-[#F0DCC0]/60 hebrew">{card.hint}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Buttons (only when flipped) */}
      {flipped && (
        <div className="flex gap-3 pb-4 pop-in">
          <button
            onClick={(e) => { e.stopPropagation(); handleAnswer(false); }}
            className="flex-1 touch-target bg-[#C0392B] rounded-2xl p-4 font-bold text-white active:scale-95 transition-transform"
          >
            ✗ Nicht gewusst
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleAnswer(true); }}
            className="flex-1 touch-target bg-[#3D7A55] rounded-2xl p-4 font-bold text-white active:scale-95 transition-transform"
          >
            ✓ Gewusst
          </button>
        </div>
      )}

      {!flipped && <div className="pb-4 h-[72px]" />}
    </div>
  );
}
