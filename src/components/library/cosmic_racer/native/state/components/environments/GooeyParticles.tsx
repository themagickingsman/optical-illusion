import React, { useMemo } from 'react';
import styles from './GooeyParticles.module.css';

const anims = ['anim_float', 'anim_floatReverse', 'anim_float2', 'anim_floatReverse2'];

export default function GooeyParticles({ count = 200 }: { count?: number }) {
  // Memoize the particle array so random values are fixed per mount
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const width = Math.floor(Math.random() * 15) + 10;
      const speed = Math.floor(Math.random() * 20) + 20;
      const delay = Math.floor(Math.random() * 10) * 0.1;
      const animClass = anims[Math.floor(Math.random() * anims.length)];
      
      const left = Math.random() * 100;
      const top = Math.random() * 100;

      return {
        id: i,
        className: `${styles.particle} ${styles[animClass]}`,
        style: {
          width: `${width}px`,
          height: `${width}px`,
          left: `${left}%`,
          top: `${top}%`,
          animationDuration: `${speed}s`,
          animationDelay: `${delay}s`,
        }
      };
    });
  }, [count]);

  return (
    <>
            {/* Filter removed as requested */}
      <div className={styles.container}>
        {particles.map((p) => (
          <span key={p.id} className={p.className} style={p.style} />
        ))}
      </div>
    </>
  );
}
