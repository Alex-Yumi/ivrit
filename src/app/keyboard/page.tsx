'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import hebrewData from '@/data/hebrew.json';
import { updateStreak } from '@/lib/storage';

const LONG_PRESS_MS = 500;

export default function KeyboardPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [popup, setPopup] = useState<{ char: string; sound: string; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => { updateStreak(); }, []);

  const exercises = hebrewData.typingExercises as Array<{latin: string; hebrew: string; german?: string}>;
  const currentEx = exercises[currentExercise];
  const keyboardSounds = hebrewData.keyboardSounds as Record<string, string>;

  const handleKeyPress = useCallback((char: string) => {
    if (char === '⌫') {
      setText(prev => prev.slice(0, -1));
    } else if (char === ' ') {
      setText(prev => prev + ' ');
    } else {
      setText(prev => prev + char);
    }
    setPopup(null);
  }, []);

  const handleLongPressStart = useCallback((char: string, e: React.TouchEvent | React.MouseEvent) => {
    if (char === '⌫' || char === ' ') return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    longPressTimer.current = setTimeout(() => {
      const sound = keyboardSounds[char] || char;
      setPopup({
        char,
        sound,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
    }, LONG_PRESS_MS);
  }, [keyboardSounds]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // Keep popup visible briefly
    setTimeout(() => setPopup(null), 800);
  }, []);

  const checkAnswer = useCallback(() => {
    const target = currentEx.hebrew;
    if (text.trim() === target) {
      setFeedback('correct');
      setTimeout(() => {
        setFeedback(null);
        setText('');
        setCurrentExercise(prev => (prev + 1) % exercises.length);
      }, 1000);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  }, [text, currentEx, exercises.length]);

  const layout = hebrewData.keyboardLayout;

  return (
    <div className="flex flex-col h-dvh max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 pb-1">
        <button onClick={() => router.push('/')} className="text-[#5B8DB8] touch-target text-sm">← Zurück</button>
        <span className="text-[#F0DCC0]/60 text-sm">✍️ Alphabet üben</span>
        <button
          onClick={() => { setPracticeMode(!practiceMode); setText(''); setFeedback(null); }}
          className={`text-sm px-3 py-1 rounded-full touch-target ${practiceMode ? 'bg-[#5B8DB8] text-[#0F0F1A]' : 'bg-[#1A1A2E] text-[#F0DCC0]'}`}
        >
          {practiceMode ? '✏️ Übung' : '🆓 Frei'}
        </button>
      </div>

      {/* Practice prompt */}
      {practiceMode && (
        <div className="px-4 py-2 text-center">
          <p className="text-sm text-[#F0DCC0]/40 mb-1">Tippe auf Hebräisch:</p>
          <p className="text-2xl font-bold text-[#5B8DB8]">{currentEx.latin}</p>
          {currentEx.german && (
            <p className="text-sm text-[#F0DCC0]/50 mt-0.5">{currentEx.german}</p>
          )}
          <p className="hebrew text-lg text-[#F0DCC0]/30 mt-1" dir="rtl">{currentEx.hebrew}</p>
        </div>
      )}

      {/* Text display */}
      <div
        ref={textRef}
        className={`mx-4 mt-2 bg-[#1A1A2E] rounded-2xl p-4 min-h-[80px] flex items-center transition-colors ${
          feedback === 'correct' ? 'border-2 border-[#3D7A55]' :
          feedback === 'wrong' ? 'border-2 border-[#C0392B]' :
          'border-2 border-transparent'
        }`}
      >
        <p className="hebrew text-2xl w-full text-right" dir="rtl">
          {text || <span className="text-[#F0DCC0]/20">...</span>}
          <span className="animate-pulse text-[#5B8DB8]">|</span>
        </p>
      </div>

      {/* Feedback text */}
      {feedback && (
        <p className={`text-center text-sm mt-1 pop-in ${feedback === 'correct' ? 'text-[#3D7A55]' : 'text-[#C0392B]'}`}>
          {feedback === 'correct' ? '✓ Richtig!' : '✗ Versuch es nochmal'}
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Long-press popup */}
      {popup && (
        <div
          className="fixed z-50 pop-in pointer-events-none"
          style={{ left: popup.x, top: popup.y, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-[#5B8DB8] text-[#0F0F1A] px-4 py-2 rounded-xl shadow-lg text-center">
            <span className="hebrew text-lg">{popup.char}</span>
            <span className="mx-2">=</span>
            <span className="font-bold text-lg">{popup.sound}</span>
          </div>
        </div>
      )}

      {/* Keyboard */}
      <div className="px-1 pb-2 select-none">
        {layout.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-[3px] mb-[3px]">
            {rowIdx === layout.length - 1 ? (
              // Space bar row
              <>
                <button
                  onClick={() => handleKeyPress('⌫')}
                  className="bg-[#1A1A2E] rounded-lg px-4 py-3 touch-target active:bg-[#252540] transition-colors text-sm"
                >
                  ⌫
                </button>
                <button
                  onClick={() => handleKeyPress(' ')}
                  className="bg-[#1A1A2E] rounded-lg flex-1 py-3 touch-target active:bg-[#252540] transition-colors text-sm hebrew"
                >
                  רווח
                </button>
                {practiceMode && (
                  <button
                    onClick={checkAnswer}
                    className="bg-[#3D7A55] rounded-lg px-4 py-3 touch-target active:bg-[#2d5a3f] transition-colors text-sm font-bold"
                  >
                    ✓
                  </button>
                )}
              </>
            ) : (
              row.map((char) => (
                <button
                  key={char}
                  onClick={() => handleKeyPress(char)}
                  onTouchStart={(e) => handleLongPressStart(char, e)}
                  onTouchEnd={handleLongPressEnd}
                  onMouseDown={(e) => handleLongPressStart(char, e)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  className="hebrew bg-[#1A1A2E] rounded-lg text-xl py-3 touch-target active:bg-[#252540] transition-colors select-none"
                  style={{
                    flex: rowIdx === 0 ? '1 1 0' : rowIdx === 1 ? '1 1 0' : '1.1 1 0',
                    minWidth: '28px',
                    maxWidth: rowIdx === 2 ? '48px' : '40px',
                  }}
                >
                  {char}
                </button>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
