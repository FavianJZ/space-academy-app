import React, { useMemo } from 'react';

const symbols = ['0', '1', '{', '}', '</', '>', '/>', '*', '#', '==', '++', '&&', ';', '()', '[]', '=>', 'if', '01', '10', '//'];

interface Particle {
  id: number;
  symbol: string;
  left: string;
  duration: string;
  delay: string;
  fontSize: string;
  opacity: number;
}

export const FloatingParticles: React.FC = () => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      symbol: symbols[i % symbols.length],
      left: `${(i * 4.17) % 100}%`,
      duration: `${10 + (i * 3.7) % 15}s`,
      delay: `${(i * 1.3) % 12}s`,
      fontSize: `${10 + (i * 2.1) % 14}px`,
      opacity: 0.04 + (i * 0.007) % 0.08,
    }));
  }, []);

  return (
    <div className="floating-particles-overlay" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="floating-particle"
          style={{
            left: p.left,
            animationDuration: p.duration,
            animationDelay: p.delay,
            fontSize: p.fontSize,
            opacity: p.opacity,
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
};
