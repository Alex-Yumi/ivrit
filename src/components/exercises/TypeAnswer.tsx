'use client';

import { useState, useEffect, useCallback } from 'react';
import HebrewKeyboard from '@/components/HebrewKeyboard';

interface TypeAnswerProps {
  data: {
    german: string;
    latin: string;
    hebrew: string;
  };
  onCorrect: () => void;
  onWrong: () => void;
}

export default function TypeAnswer({ data, onCorrect, onWrong }: TypeAnswerProps) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    setInput('');
    setResult(null);
  }, [data]);

  const handleInput = useCallback((char: string) => {
    if (result) return;
    setInput(prev => prev + char);
  }, [result]);

  const handleDelete = useCallback(() => {
    if (result) return;
    setInput(prev => prev.slice(0, -1));
  }, [result]);

  const handleSubmit = useCallback(() => {
    if (result || !input.trim()) return;

    // Normalize: remove zero-width non-joiner and trim
    const normalize = (s: string) => s.replace(/\u200C/g, '').replace(/\s+/g, ' ').trim();
    const isCorrect = normalize(input) === normalize(data.hebrew);

    setResult(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) {
      onCorrect();
    } else {
      onWrong();
    }
  }, [input, data.hebrew, result, onCorrect, onWrong]);

  // Character-by-character comparison for wrong answers
  const renderComparison = () => {
    if (result !== 'wrong') return null;
    const target = data.hebrew;
    const typed = input;
    const maxLen = Math.max(target.length, typed.length);

    return (
      <div className="mt-3 pop-in">
        <p className="text-xs text-[#F0DCC0]/40 mb-1 text-center">Vergleich:</p>
        <div className="flex justify-center gap-1" dir="rtl">
          {Array.from({ length: maxLen }).map((_, i) => {
            const targetChar = target[i] || '';
            const typedChar = typed[i] || '';
            const match = targetChar === typedChar;
            return (
              <span
                key={i}
                className={`hebrew text-xl inline-block min-w-[1ch] text-center ${
                  match ? 'text-[#3D7A55]' : 'text-[#C0392B] underline'
                }`}
              >
                {targetChar || '·'}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-[#F0DCC0]/30 mt-1 text-center">Deine Eingabe:</p>
        <div className="flex justify-center gap-1" dir="rtl">
          {Array.from({ length: maxLen }).map((_, i) => {
            const targetChar = data.hebrew[i] || '';
            const typedChar = input[i] || '';
            const match = targetChar === typedChar;
            return (
              <span
                key={i}
                className={`hebrew text-xl inline-block min-w-[1ch] text-center ${
                  match ? 'text-[#3D7A55]' : 'text-[#C0392B]'
                }`}
              >
                {typedChar || '·'}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-sm text-[#F0DCC0]/50 mb-1">Tippe das Wort auf Hebräisch:</p>

      {/* Prompt */}
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-[#5B8DB8]">{data.german}</p>
        <p className="text-sm text-[#F0DCC0]/40 mt-1">{data.latin}</p>
      </div>

      {/* Input display */}
      <div
        className={`w-full max-w-sm bg-[#1A1A2E] rounded-2xl p-4 min-h-[56px] flex items-center justify-center border-2 transition-colors mb-2 ${
          result === 'correct' ? 'border-[#3D7A55]' :
          result === 'wrong' ? 'border-[#C0392B]' :
          'border-transparent'
        }`}
      >
        <p className="hebrew text-2xl" dir="rtl">
          {input || <span className="text-[#F0DCC0]/20">...تایپ کنید</span>}
          {!result && <span className="animate-pulse text-[#5B8DB8]">|</span>}
        </p>
      </div>

      {/* Result */}
      {result === 'correct' && (
        <p className="text-[#3D7A55] font-bold pop-in">✓ Richtig!</p>
      )}
      {result === 'wrong' && (
        <div className="text-center">
          <p className="text-[#C0392B] pop-in">
            ✗ Richtig wäre: <span className="hebrew text-lg">{data.hebrew}</span>
          </p>
          {renderComparison()}
        </div>
      )}

      {/* Keyboard */}
      {!result && (
        <div className="w-full mt-auto">
          <HebrewKeyboard
            onInput={handleInput}
            onDelete={handleDelete}
            onSubmit={handleSubmit}
            showSubmit={true}
          />
        </div>
      )}
    </div>
  );
}
