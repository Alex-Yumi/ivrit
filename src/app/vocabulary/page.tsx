'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import hebrewData from '@/data/hebrew.json';

export default function VocabularyPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState(0);
  const [showSentences, setShowSentences] = useState(false);

  const categories = hebrewData.vocabulary;

  if (showSentences) {
    return (
      <div className="flex flex-col h-dvh max-w-lg mx-auto">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setShowSentences(false)} className="text-[#5B8DB8] touch-target">← Zurück</button>
          <span className="text-sm text-[#F0DCC0]/60">Sätze</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {hebrewData.sentences.map((s, i) => (
            <div key={i} className="bg-[#1A1A2E] rounded-xl p-3">
              <p className="hebrew text-lg text-right" dir="rtl">{s.hebrew}</p>
              <p className="text-sm text-[#5B8DB8] mt-1">{s.latin}</p>
              <p className="text-xs text-[#F0DCC0]/60">{s.german}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh max-w-lg mx-auto">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => router.push('/')} className="text-[#5B8DB8] touch-target">← Zurück</button>
        <span className="font-semibold">📚 Vokabeln</span>
        <button onClick={() => setShowSentences(true)} className="text-[#5B8DB8] touch-target text-sm">Sätze →</button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat, i) => (
          <button
            key={cat.category}
            onClick={() => setActiveCategory(i)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap text-sm touch-target transition-colors ${
              i === activeCategory ? 'bg-[#5B8DB8] text-[#0F0F1A]' : 'bg-[#1A1A2E]'
            }`}
          >
            {cat.category}
          </button>
        ))}
      </div>

      {/* Words */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 mt-2 space-y-2">
        {categories[activeCategory].words.map((word, i) => (
          <div key={i} className="bg-[#1A1A2E] rounded-xl p-3 flex justify-between items-center slide-in" style={{ animationDelay: `${i * 30}ms` }}>
            <div>
              <p className="text-sm text-[#5B8DB8]">{word.latin}</p>
              <p className="text-xs text-[#F0DCC0]/60">{word.german}</p>
            </div>
            <p className="hebrew text-2xl" dir="rtl">{word.hebrew}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
