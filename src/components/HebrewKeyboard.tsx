'use client';

import { useState, useRef, useCallback } from 'react';
import hebrewData from '@/data/hebrew.json';

const LONG_PRESS_MS = 500;

interface HebrewKeyboardProps {
  onInput: (text: string) => void;
  onDelete: () => void;
  onSubmit?: () => void;
  showSubmit?: boolean;
}

export default function HebrewKeyboard({ onInput, onDelete, onSubmit, showSubmit = false }: HebrewKeyboardProps) {
  const [popup, setPopup] = useState<{ char: string; sound: string; x: number; y: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const keyboardSounds = hebrewData.keyboardSounds as Record<string, string>;
  const layout = hebrewData.keyboardLayout;

  const handleKeyPress = useCallback((char: string) => {
    if (char === '⌫') {
      onDelete();
    } else if (char === ' ') {
      onInput(' ');
    } else {
      onInput(char);
    }
    setPopup(null);
  }, [onInput, onDelete]);

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
    setTimeout(() => setPopup(null), 800);
  }, []);

  return (
    <div className="select-none">
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

      <div className="px-1 pb-2">
        {layout.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-[3px] mb-[3px]">
            {rowIdx === layout.length - 1 ? (
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
                {showSubmit && onSubmit && (
                  <button
                    onClick={onSubmit}
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
