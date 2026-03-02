'use client';

import { useState, useEffect, useCallback } from 'react';

interface SentenceShuffleProps {
  data: {
    hebrew: string;
    german: string;
    distractors: string[];
  };
  onCorrect: () => void;
  onWrong: () => void;
}

export default function SentenceShuffle({ data, onCorrect, onWrong }: SentenceShuffleProps) {
  const [availableTiles, setAvailableTiles] = useState<string[]>([]);
  const [placedTiles, setPlacedTiles] = useState<string[]>([]);
  const [correctWords, setCorrectWords] = useState<string[]>([]);
  const [checked, setChecked] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    const words = data.hebrew.split(' ').filter(w => w.length > 0);
    setCorrectWords(words);

    // Combine with distractors and shuffle
    const all = [...words, ...data.distractors];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    setAvailableTiles(all);
    setPlacedTiles([]);
    setChecked(null);
  }, [data]);

  const handleTileTap = useCallback((word: string, fromPlaced: boolean) => {
    if (checked) return;
    if (fromPlaced) {
      setPlacedTiles(prev => {
        const idx = prev.indexOf(word);
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
      setAvailableTiles(prev => [...prev, word]);
    } else {
      setAvailableTiles(prev => {
        const idx = prev.indexOf(word);
        const next = [...prev];
        next.splice(idx, 1);
        return next;
      });
      setPlacedTiles(prev => [...prev, word]);
    }
  }, [checked]);

  const handleCheck = useCallback(() => {
    const isCorrect = placedTiles.join(' ') === correctWords.join(' ');
    setChecked(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      onCorrect();
    } else {
      onWrong();
      // Show correct answer for a moment then allow retry
      setTimeout(() => {
        setChecked(null);
      }, 2500);
    }
  }, [placedTiles, correctWords, onCorrect, onWrong]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* German sentence */}
      <p className="text-lg text-[#F0DCC0]/80 mb-4 text-center">{data.german}</p>

      {/* Placed tiles area (RTL) */}
      <div
        className={`w-full max-w-sm min-h-[56px] bg-[#1A1A2E] rounded-2xl p-3 mb-4 flex flex-wrap gap-2 justify-end border-2 transition-colors ${
          checked === 'correct' ? 'border-[#3D7A55]' :
          checked === 'wrong' ? 'border-[#C0392B]' :
          'border-[#5B8DB8]/20'
        }`}
        dir="rtl"
      >
        {placedTiles.length === 0 ? (
          <p className="text-[#F0DCC0]/20 hebrew text-sm w-full text-center">...</p>
        ) : (
          placedTiles.map((word, i) => (
            <button
              key={`placed-${i}`}
              onClick={() => handleTileTap(word, true)}
              className={`hebrew text-lg px-3 py-2 rounded-xl touch-target transition-all active:scale-95 ${
                checked === 'correct' ? 'bg-[#3D7A55]/30 text-[#3D7A55]' :
                checked === 'wrong' ? 'bg-[#C0392B]/30 text-[#C0392B]' :
                'bg-[#5B8DB8]/20 text-[#5B8DB8]'
              }`}
            >
              {word}
            </button>
          ))
        )}
      </div>

      {/* Show correct answer on wrong */}
      {checked === 'wrong' && (
        <div className="w-full max-w-sm mb-4 pop-in">
          <p className="text-xs text-[#F0DCC0]/40 mb-1 text-center">Richtige Antwort:</p>
          <p className="hebrew text-lg text-[#3D7A55] text-center" dir="rtl">{correctWords.join(' ')}</p>
        </div>
      )}

      {/* Available tiles */}
      <div className="w-full max-w-sm flex flex-wrap gap-2 justify-center mb-6" dir="rtl">
        {availableTiles.map((word, i) => (
          <button
            key={`avail-${i}`}
            onClick={() => handleTileTap(word, false)}
            className="hebrew text-lg bg-[#1A1A2E] border border-[#5B8DB8]/30 px-3 py-2 rounded-xl touch-target transition-all active:scale-95 hover:bg-[#252540]"
          >
            {word}
          </button>
        ))}
      </div>

      {/* Check button */}
      {placedTiles.length > 0 && !checked && (
        <button
          onClick={handleCheck}
          className="bg-[#5B8DB8] text-[#0F0F1A] font-bold px-8 py-3 rounded-2xl touch-target active:scale-95 transition-transform"
        >
          Prüfen ✓
        </button>
      )}

      {checked === 'correct' && (
        <p className="text-[#3D7A55] font-bold pop-in mt-2">✓ Richtig!</p>
      )}
    </div>
  );
}
