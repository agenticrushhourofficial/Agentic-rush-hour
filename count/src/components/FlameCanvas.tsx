import React, { useEffect, useRef } from 'react';

interface FlameCanvasProps {
  intensity?: number; // 0.1 to 2.0
  isRedAlert?: boolean;
}

export const FlameCanvas: React.FC<FlameCanvasProps> = ({ intensity = 1.0, isRedAlert = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const particles: Array<{
      x: number;
      y: number;
      vy: number;
      vx: number;
      size: number;
      life: number;
      maxLife: number;
    }> = [];

    const render = () => {
      time += 0.05 * intensity;
      const w = (canvas.width = canvas.clientWidth || 256);
      const h = (canvas.height = canvas.clientHeight || 128);

      ctx.clearRect(0, 0, w, h);

      const centerX = w / 2;
      const baseY = h - 10;

      // Draw glowing procedural cyber flame waves
      const waveCount = 3;
      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX - 90, baseY);

        for (let x = -90; x <= 90; x += 5) {
          const normX = x / 90; // -1 to 1
          const factor = Math.cos(normX * (Math.PI / 2)); // peak at center
          const sine = Math.sin(time * 3 + normX * 8 + i * 2) * 15 * intensity * factor;
          const py = baseY - (70 * intensity * factor) + sine;

          ctx.lineTo(centerX + x, py);
        }

        ctx.lineTo(centerX + 90, baseY);
        ctx.closePath();

        const grad = ctx.createLinearGradient(centerX, baseY - 80 * intensity, centerX, baseY);
        if (isRedAlert) {
          grad.addColorStop(0, `rgba(255, 30, 30, ${0.8 - i * 0.2})`);
          grad.addColorStop(0.5, `rgba(255, 120, 0, ${0.6 - i * 0.15})`);
          grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
        } else {
          grad.addColorStop(0, `rgba(221, 183, 255, ${0.85 - i * 0.2})`);
          grad.addColorStop(0.5, `rgba(183, 109, 255, ${0.6 - i * 0.15})`);
          grad.addColorStop(1, 'rgba(73, 0, 128, 0)');
        }

        ctx.fillStyle = grad;
        ctx.shadowBlur = 20 * intensity;
        ctx.shadowColor = isRedAlert ? '#ff0033' : '#b76dff';
        ctx.fill();
      }

      // Add ember particles
      if (Math.random() < 0.6 * intensity) {
        particles.push({
          x: centerX + (Math.random() - 0.5) * 80,
          y: baseY - 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -(Math.random() * 2 + 1) * intensity,
          size: Math.random() * 3 + 1,
          life: 0,
          maxLife: Math.random() * 30 + 20,
        });
      }

      for (let j = particles.length - 1; j >= 0; j--) {
        const p = particles[j];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const alpha = 1 - p.life / p.maxLife;
        if (alpha <= 0) {
          particles.splice(j, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isRedAlert
          ? `rgba(255, 100, 50, ${alpha})`
          : `rgba(240, 219, 255, ${alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [intensity, isRedAlert]);

  return <canvas ref={canvasRef} className="w-64 h-full block mx-auto" />;
};
