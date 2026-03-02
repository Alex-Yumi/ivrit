'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getProgress } from '@/lib/storage';
import hebrewData from '@/data/hebrew.json';

interface TopicLesson {
  id: number;
  title: string;
  icon: string;
  description: string;
  words: { hebrew: string; latin: string; german: string }[];
  dialogues: { title: string; lines: { speaker: string; hebrew: string; latin: string; german: string }[] }[];
  grammar: string;
}

export default function TopicsPage() {
  const router = useRouter();
  const [completedTopics, setCompletedTopics] = useState<number[]>([]);
  const [scores, setScores] = useState<Record<number, number>>({});

  const topicLessons = (hebrewData as { topicLessons?: TopicLesson[] }).topicLessons || [];

  useEffect(() => {
    const p = getProgress();
    setCompletedTopics(p.completedTopics || []);
    setScores(p.quizScores || {});
  }, []);

  return (
    <div className="flex flex-col min-h-dvh p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-2">
        <button onClick={() => router.push('/')} className="text-[#5B8DB8] touch-target">← Zurück</button>
        <h1 className="text-xl font-bold text-[#5B8DB8]">📚 Themen-Lektionen</h1>
        <div className="w-16" />
      </div>

      <p className="text-center text-sm text-[#F0DCC0]/40 mb-6">
        Nach dem Alphabet — lerne Vokabeln, Dialoge und Grammatik
      </p>

      {/* Progress */}
      <div className="bg-[#1A1A2E] rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-[#F0DCC0]/60">Themen abgeschlossen</p>
          <p className="text-[#5B8DB8] font-bold">{completedTopics.length} / {topicLessons.length}</p>
        </div>
        <div className="w-full bg-[#0F0F1A] rounded-full h-3">
          <div
            className="bg-[#5B8DB8] h-3 rounded-full transition-all duration-500"
            style={{ width: `${topicLessons.length > 0 ? (completedTopics.length / topicLessons.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Topic Cards */}
      <div className="space-y-3 pb-8">
        {topicLessons.map((topic) => {
          const isCompleted = completedTopics.includes(topic.id);
          const topicScore = scores[topic.id];
          return (
            <Link href={`/topic/${topic.id}`} key={topic.id}>
              <div className={`bg-[#1A1A2E] rounded-2xl p-4 border transition-all active:scale-[0.98] ${
                isCompleted ? 'border-[#3D7A55]/50' : 'border-[#5B8DB8]/20 hover:border-[#5B8DB8]/50'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="text-3xl">{topic.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{topic.title}</h3>
                      {isCompleted && <span className="text-[#3D7A55] text-lg">✓</span>}
                    </div>
                    <p className="text-sm text-[#F0DCC0]/50 mt-0.5">{topic.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#F0DCC0]/30">
                      <span>📝 {topic.words.length} Vokabeln</span>
                      <span>💬 {topic.dialogues.length} Dialog</span>
                      {topicScore !== undefined && (
                        <span className="text-[#5B8DB8]">⭐ {topicScore} Punkte</span>
                      )}
                    </div>
                  </div>
                  <div className="text-[#5B8DB8]/40 text-xl">→</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
