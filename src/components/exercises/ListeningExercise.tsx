'use client';

import { useState, useEffect, useCallback } from 'react';

interface ListeningExerciseProps {
  data: {
    hebrew: string;
    latin: string;
    german: string;
    options: string[];  // 4 Hebräisch options
  };
  onCorrect: () => void;
  onWrong: () => void;
}

export default function ListeningExercise({ data, onCorrect, onWrong }: ListeningExerciseProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null);
  const [ttsAvailable, setTtsAvailable] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setSelected(null);
    setResult(null);
    setIsPlaying(false);

    // Check if Hebräisch TTS is available
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Wait for voices to load
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const hebrewVoice = voices.find(v => v.lang.startsWith('he'));
        setTtsAvailable(!!hebrewVoice || voices.length === 0); // optimistic if voices not loaded yet
      };
      checkVoices();
      window.speechSynthesis.onvoiceschanged = checkVoices;
    } else {
      setTtsAvailable(false);
    }
  }, [data]);

  const playAudio = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(data.hebrew);
    utterance.lang = 'he-IL';
    utterance.rate = 0.8;

    const voices = window.speechSynthesis.getVoices();
    const hebrewVoice = voices.find(v => v.lang.startsWith('he'));
    if (hebrewVoice) {
      utterance.voice = hebrewVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => {
      setIsPlaying(false);
      setTtsAvailable(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [data.hebrew]);

  // Auto-play on mount
  useEffect(() => {
    const timer = setTimeout(() => playAudio(), 300);
    return () => clearTimeout(timer);
  }, [playAudio]);

  const handleSelect = (option: string) => {
    if (result) return;
    setSelected(option);

    const isCorrect = option === data.hebrew;
    setResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      onCorrect();
    } else {
      onWrong();
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-sm text-[#F0DCC0]/50 mb-4">Was hast du gehört?</p>

      {/* Speaker button */}
      <button
        onClick={playAudio}
        className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 touch-target transition-all active:scale-95 ${
          isPlaying ? 'bg-[#5B8DB8] scale-110' : 'bg-[#1A1A2E] border-2 border-[#5B8DB8]/50'
        }`}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={isPlaying ? '#0F0F1A' : '#5B8DB8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      </button>

      {/* Fallback: show transliteration if no TTS */}
      {!ttsAvailable && (
        <div className="mb-4 pop-in text-center">
          <p className="text-xs text-[#F0DCC0]/30 mb-1">⚠️ Kein Hebräisch-TTS verfügbar</p>
          <p className="text-lg text-[#5B8DB8] font-mono">{data.latin}</p>
        </div>
      )}

      <p className="text-xs text-[#F0DCC0]/30 mb-5">Tippe auf die richtige Antwort</p>

      {/* Options */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
        {data.options.map((opt, i) => {
          let bg = 'bg-[#1A1A2E]';
          if (result) {
            if (opt === data.hebrew) bg = 'bg-[#3D7A55]';
            else if (opt === selected) bg = 'bg-[#C0392B]';
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              className={`${bg} hebrew text-xl p-4 rounded-2xl touch-target transition-colors active:scale-95
                ${result && opt === data.hebrew ? 'pop-in' : ''}
                ${result && opt === selected && opt !== data.hebrew ? 'animate-shake' : ''}`}
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
          ✗ Es war: <span className="hebrew text-lg">{data.hebrew}</span> ({data.german})
        </p>
      )}
    </div>
  );
}
