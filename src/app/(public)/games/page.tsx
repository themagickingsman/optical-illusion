import React, { Suspense } from 'react';
import GamesCMS from '@/components/cms/views/GamesCMS';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Games | Optical Illusions',
  description: 'Explore our latest game development projects.',
};

export default function GamesPage() {
  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .games-animate-up {
          animation: slideUpFade 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="games-animate-up">
        <Suspense fallback={null}>
          <GamesCMS />
        </Suspense>
      </div>
    </>
  );
}
