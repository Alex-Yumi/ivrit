'use client';

import { useState, useEffect, useCallback } from 'react';

interface PairItem {
  hebrew: string;
  german: string;
}

interface PairMatchingProps {
  data: PairItem[];
  onCorrect: () => void;
  onWrong: () => void;
}

interface Card {
  id: string;
  text: string;
  pairId: number;
  type: 'hebrew' | 'german';
  matched: boolean;
}

export default function PairMatching({ data, onCorrect, onWrong }: PairMatchingProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Card | null>(null);
  const [wrongPair, setWrongPair] = useState<[string, string] | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    const pairs = data.slice(0, 3);
    const allCards: Card[] = [];
    pairs.forEach((pair, i) => {
      allCards.push({ id: `f-${i}`, text: pair.hebrew, pairId: i, type: 'hebrew', matched: false });
      allCards.push({ id: `g-${i}`, text: pair.german, pairId: i, type: 'german', matched: false });
    });
    // Shuffle
    for (let i = allCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
    }
    setCards(allCards);
    setSelected(null);
    setMatchedCount(0);
    setAllDone(false);
  }, [data]);

  // Timer
  useEffect(() => {
    if (allDone) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, allDone]);

  const handleCardTap = useCallback((card: Card) => {
    if (card.matched || allDone) return;
    if (wrongPair) return;

    if (!selected) {
      setSelected(card);
      return;
    }

    // Same card tapped again — deselect
    if (selected.id === card.id) {
      setSelected(null);
      return;
    }

    // Same type — switch selection
    if (selected.type === card.type) {
      setSelected(card);
      return;
    }

    // Different types — check match
    if (selected.pairId === card.pairId) {
      // Correct match!
      setCards(prev => prev.map(c =>
        c.pairId === card.pairId ? { ...c, matched: true } : c
      ));
      setSelected(null);
      const newCount = matchedCount + 1;
      setMatchedCount(newCount);
      if (newCount >= 3) {
        setAllDone(true);
        onCorrect();
      }
    } else {
      // Wrong match
      setWrongPair([selected.id, card.id]);
      onWrong();
      setTimeout(() => {
        setWrongPair(null);
        setSelected(null);
      }, 600);
    }
  }, [selected, matchedCount, allDone, wrongPair, onCorrect, onWrong]);

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-sm text-[#F0DCC0]/50 mb-1">Finde die Paare!</p>
      <p className="text-xs text-[#5B8DB8]/60 mb-4">⏱ {elapsed}s</p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {cards.map(card => {
          const isSelected = selected?.id === card.id;
          const isWrong = wrongPair?.includes(card.id);
          const isHebräisch = card.type === 'hebrew';

          let bg = 'bg-[#1A1A2E]';
          let border = 'border-transparent';
          let opacity = '';

          if (card.matched) {
            opacity = 'opacity-0 scale-95';
          } else if (isWrong) {
            bg = 'bg-[#C0392B]/20';
            border = 'border-[#C0392B]';
          } else if (isSelected) {
            border = 'border-[#5B8DB8]';
            bg = 'bg-[#5B8DB8]/10';
          }

          return (
            <button
              key={card.id}
              onClick={() => handleCardTap(card)}
              disabled={card.matched}
              className={`${bg} ${opacity} border-2 ${border} rounded-2xl p-4 touch-target 
                transition-all duration-300 active:scale-95
                ${isHebräisch ? 'hebrew text-2xl' : 'text-base'}
                ${isWrong ? 'animate-shake' : ''}`}
              dir={isHebräisch ? 'rtl' : 'ltr'}
            >
              {card.text}
            </button>
          );
        })}
      </div>

      {allDone && (
        <div className="mt-4 pop-in text-center">
          <p className="text-[#3D7A55] font-bold">✓ Alle Paare gefunden!</p>
          <p className="text-xs text-[#F0DCC0]/40">in {elapsed} Sekunden</p>
        </div>
      )}
    </div>
  );
}
