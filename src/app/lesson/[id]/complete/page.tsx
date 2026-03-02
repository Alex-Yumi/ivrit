'use client';

import { use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const score = parseInt(searchParams.get('score') || '0');
  const total = parseInt(searchParams.get('total') || '1');
  const percent = Math.round((score / total) * 100);
  const lessonId = parseInt(id);

  return (
    <div className="flex flex-col items-center justify-center h-dvh p-4 max-w-lg mx-auto fade-in">
      <div className="text-6xl mb-4">{percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '💪'}</div>
      <h1 className="text-2xl font-bold mb-2">Lektion {lessonId} abgeschlossen!</h1>
      <p className="text-lg text-[#5B8DB8] mb-8">{score} von {total} richtig ({percent}%)</p>

      <div className="w-full max-w-xs space-y-3">
        {lessonId < 4 && (
          <button
            onClick={() => router.push(`/lesson/${lessonId + 1}`)}
            className="w-full touch-target bg-[#5B8DB8] text-[#0F0F1A] rounded-2xl p-4 font-bold active:scale-95 transition-transform"
          >
            Nächste Lektion →
          </button>
        )}
        <button
          onClick={() => router.push(`/lesson/${lessonId}`)}
          className="w-full touch-target bg-[#1A1A2E] border border-[#5B8DB8]/30 rounded-2xl p-4 font-semibold active:scale-95 transition-transform"
        >
          🔄 Wiederholen
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full touch-target bg-[#1A1A2E] rounded-2xl p-4 font-semibold active:scale-95 transition-transform"
        >
          🏠 Dashboard
        </button>
      </div>
    </div>
  );
}

export default function CompleteWrapper({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-dvh"><p>Laden...</p></div>}>
      <CompletePage params={params} />
    </Suspense>
  );
}
