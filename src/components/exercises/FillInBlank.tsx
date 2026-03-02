'use client';

import { useState, useEffect } from 'react';

interface FillInBlankProps {
  data: {
    sentence: string;      // full Hebräisch sentence
    missingWord: string;    // the word to guess
    blankSentence: string;  // sentence with ___ replacing the word
    german: string;         // German translation
    options: string[];      // 4 options (1 correct + 3 wrong)
  };
  onCorrect: () => void;
  onWrong: () => void;
}

export default function FillInBlank({ data, onCorrect, onWrong }: FillInBlankProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    setSelected(null);
    setResult(null);
  }, [data]);

  const handleSelect = (option: string) => {
    if (result) return;
    setSelected(option);

    const isCorrect = option === data.missingWord;
    setResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      onCorrect();
    } else {
      onWrong();
    }
  };

  // Build display sentence — replace ___ with the answer when selected
  const displaySentence = result === 'correct' 
    ? data.sentence
    : data.blankSentence;

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-sm text-[#F0DCC0]/50 mb-3">Welches Wort fehlt?</p>

      {/* Hebräisch sentence with blank */}
      <div className="w-full max-w-sm bg-[#1A1A2E] rounded-2xl p-5 mb-2" dir="rtl">
        <p className="hebrew text-2xl text-center leading-relaxed">
          {result === 'correct' ? (
            // Show full sentence with the word highlighted green
            data.blankSentence.split('___').map((part, i) => (
              <span key={i}>
                <span className="text-[#F0DCC0]">{part}</span>
                {i === 0 && (
                  <span className="text-[#3D7A55] font-bold pop-in">{data.missingWord}</span>
                )}
              </span>
            ))
          ) : result === 'wrong' ? (
            // Show blank with correct answer
            data.blankSentence.split('___').map((part, i) => (
              <span key={i}>
                <span className="text-[#F0DCC0]">{part}</span>
                {i === 0 && (
                  <span className="text-[#C0392B] font-bold">{data.missingWord}</span>
                )}
              </span>
            ))
          ) : (
            // Show sentence with visible blank
            <span className="text-[#F0DCC0]">
              {displaySentence.replace('___', ' _______ ')}
            </span>
          )}
        </p>
      </div>

      {/* German hint */}
      <p className="text-xs text-[#F0DCC0]/30 mb-5">🇩🇪 {data.german}</p>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {data.options.map((opt, i) => {
          let bg = 'bg-[#1A1A2E]';
          if (result) {
            if (opt === data.missingWord) bg = 'bg-[#3D7A55]';
            else if (opt === selected) bg = 'bg-[#C0392B]';
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              className={`${bg} hebrew text-xl p-4 rounded-2xl touch-target transition-colors active:scale-95
                ${result && opt === data.missingWord ? 'pop-in' : ''}
                ${result && opt === selected && opt !== data.missingWord ? 'animate-shake' : ''}`}
              dir="rtl"
            >
              {opt}
            </button>
          );
        })}
      </div>

      {result === 'correct' && (
        <p className="text-[#3D7A55] font-bold mt-4 pop-in">✓ Richtig!</p>
      )}
      {result === 'wrong' && (
        <p className="text-[#C0392B] mt-4 pop-in">
          ✗ Falsch — <span className="hebrew">{data.missingWord}</span> war richtig
        </p>
      )}
    </div>
  );
}
