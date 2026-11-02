"use client";

import { useEffect, useRef } from "react";
import { useEffectsOn } from "./preferences";

const COLORS = ["#e0503a", "#f2c14e", "#3fae7a", "#ffffff", "#f28b6b"];
const DURATION_MS = 4500;

type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };

/**
 * A short burst of fireworks the first time someone sees their match after a draw.
 * `id` identifies the draw, so a new draw celebrates again.
 */
export function Fireworks({ id }: { id: string }) {
  const on = useEffectsOn();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!on || !canvas) return;
    const seenKey = `fireworks-${id}`;
    try {
      if (localStorage.getItem(seenKey)) return;
      localStorage.setItem(seenKey, "1");
    } catch {
      // Storage blocked: celebrate anyway.
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sparks: Spark[] = [];
    const burst = () => {
      const x = width * (0.15 + Math.random() * 0.7);
      const y = height * (0.15 + Math.random() * 0.35);
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      for (let i = 0; i < 70; i++) {
        const angle = (Math.PI * 2 * i) / 70;
        const speed = 1.5 + Math.random() * 3;
        sparks.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, color });
      }
    };

    const start = performance.now();
    let nextBurst = 0;
    let frame = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < DURATION_MS - 1500 && elapsed >= nextBurst) {
        burst();
        nextBurst = elapsed + 350 + Math.random() * 400;
      }
      ctx.clearRect(0, 0, width, height);
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.05;
        s.vx *= 0.985;
        s.life -= 0.013;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = s.life;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (elapsed < DURATION_MS || sparks.length) frame = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, width, height);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [on, id]);

  return <canvas ref={ref} className="fireworks" aria-hidden="true" />;
}
