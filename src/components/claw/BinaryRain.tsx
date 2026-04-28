'use client';

import { useEffect, useRef } from 'react';

interface BinaryRainProps {
  className?: string;
  density?: number;
  speed?: number;
}

export default function BinaryRain({
  className = '',
  density = 0.3,
  speed = 0.5
}: BinaryRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Binary rain characters
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const fontSize = 14;
    const columns = Math.floor(canvas.offsetWidth / fontSize);
    const drops: number[] = [];

    // Initialize drops
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * canvas.offsetHeight / fontSize;
    }

    let animationId: number;

    const draw = () => {
      // Semi-transparent black overlay for trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Set text style
      ctx.fillStyle = '#00ffff';
      ctx.font = `${fontSize}px 'Courier New', monospace`;

      // Draw characters
      for (let i = 0; i < drops.length; i++) {
        if (Math.random() > density) continue;

        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Add slight glow effect
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 2;

        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;

        // Reset drop to top randomly or move down
        if (y > canvas.offsetHeight && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i] += speed;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [density, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 opacity-20 pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
}