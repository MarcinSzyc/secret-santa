"use client";

import { useEffect, useRef } from "react";
import { useEffectsOn } from "./preferences";

type Flake = { x: number; y: number; r: number; speed: number; drift: number; phase: number };

/** Gentle falling snow behind the page content. Off when the person turned effects off. */
export function Snow() {
  const on = useEffectsOn();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!on || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let flakes: Flake[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (width * height) / 16000));
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1 + Math.random() * 2.5,
        speed: 0.3 + Math.random() * 0.8,
        drift: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    let t = 0;
    const tick = () => {
      t += 0.01;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--snow") || "#fff";
      for (const f of flakes) {
        f.y += f.speed;
        f.x += Math.sin(t + f.phase) * f.drift * 0.4;
        if (f.y > height + 5) {
          f.y = -5;
          f.x = Math.random() * width;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, width, height);
    };
  }, [on]);

  return <canvas ref={ref} className="snow" aria-hidden="true" />;
}
