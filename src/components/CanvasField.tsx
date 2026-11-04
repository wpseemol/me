'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import {
  subscribeFieldAtmosphere,
  type FieldAtmosphere,
} from '@/lib/field-atmosphere';

/**
 * Ambient canvas: a field of code glyphs the cursor pushes away and, while the
 * pointer is held down, pulls back in.
 *
 * Pinned stages (skills / projects) publish FieldAtmosphere so glow + particle
 * tints shift with each scroll content change — readable scroll feedback.
 */

const GLYPHS = ['>', '_', '/', '{', '}', ';', '·', '<', '$'];
const SPRITE = 44;

type Particle = {
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  tint: number;
  scale: number;
  depth: number;
};

function mixHex(a: string, b: string, t: number) {
  const parse = (hex: string) => {
    const s = hex.replace('#', '').trim();
    const n =
      s.length === 3
        ? s
            .split('')
            .map((c) => c + c)
            .join('')
        : s.padStart(6, '0').slice(0, 6);
    return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
  };
  try {
    const A = parse(a);
    const B = parse(b);
    const m = A.map((v, i) => Math.round(v + ((B[i] ?? v) - v) * t));
    return `#${m.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')}`;
  } catch {
    return a;
  }
}

export default function CanvasField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowARef = useRef<HTMLDivElement>(null);
  const glowBRef = useRef<HTMLDivElement>(null);
  const stageGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    let particles: Particle[] = [];

    let atlas: HTMLCanvasElement | null = null;
    let tints: string[] = [];
    let isLight = false;
    let stageAccent = '';
    let stageIntensity = 0; // smoothed
    let stageProgress = 0;
    let lastPulse = 0;
    const target = { intensity: 0 };

    const readBaseTints = () => {
      const s = getComputedStyle(document.documentElement);
      const pick = (name: string, fallback: string) =>
        s.getPropertyValue(name).trim() || fallback;

      isLight = !document.documentElement.classList.contains('dark');

      return isLight
        ? [
            pick('--brand-500', '#1b63ff'),
            pick('--brand-600', '#0b4ae6'),
            pick('--accent-600', '#00a8cc'),
          ]
        : [
            pick('--brand-500', '#1b63ff'),
            pick('--brand-300', '#85a6ff'),
            pick('--accent-400', '#43e4ff'),
          ];
    };

    const buildAtlas = (accent?: string) => {
      const base = readBaseTints();
      if (accent) {
        tints = [
          accent,
          mixHex(accent, '#ffffff', isLight ? 0.15 : 0.35),
          mixHex(accent, base[2]!, 0.45),
        ];
      } else {
        tints = base;
      }

      const a = document.createElement('canvas');
      a.width = SPRITE * GLYPHS.length * dpr;
      a.height = SPRITE * tints.length * dpr;

      const actx = a.getContext('2d');
      if (!actx) return;
      actx.scale(dpr, dpr);
      actx.textAlign = 'center';
      actx.textBaseline = 'middle';
      actx.font = `600 ${SPRITE * 0.5}px ui-monospace, "JetBrains Mono", monospace`;

      tints.forEach((tint, row) => {
        actx.fillStyle = tint;
        GLYPHS.forEach((glyph, col) => {
          actx.fillText(glyph, col * SPRITE + SPRITE / 2, row * SPRITE + SPRITE / 2);
        });
      });

      atlas = a;
    };

    const seed = () => {
      const count = Math.min(Math.round((w * h) / 14000), 900);
      const cols = Math.ceil(Math.sqrt((count * w) / h));
      const rows = Math.ceil(count / cols);
      const cellW = w / cols;
      const cellH = h / rows;

      particles = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const hx = c * cellW + cellW * (0.2 + Math.random() * 0.6);
          const hy = r * cellH + cellH * (0.2 + Math.random() * 0.6);
          const depth = 0.35 + Math.random() * 0.65;

          particles.push({
            hx,
            hy,
            x: hx,
            y: hy,
            vx: 0,
            vy: 0,
            g: Math.floor(Math.random() * GLYPHS.length),
            tint: Math.random() < 0.62 ? 0 : Math.random() < 0.6 ? 1 : 2,
            scale: (0.42 + Math.random() * 0.62) * depth,
            depth,
          });
        }
      }
    };

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    buildAtlas();
    resize();

    const pointer = { x: -9999, y: -9999, mode: 1 };
    let scrollN = 0;
    let running = true;

    const moveTo = gsap.quickTo(pointer, 'x', { duration: 0.32, ease: 'power2.out' });
    const moveToY = gsap.quickTo(pointer, 'y', { duration: 0.32, ease: 'power2.out' });

    const onPointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      moveTo(e.clientX - r.left);
      moveToY(e.clientY - r.top);
    };

    const onDown = () => gsap.to(pointer, { mode: -1, duration: 0.25 });
    const onUp = () => gsap.to(pointer, { mode: 1, duration: 0.45 });

    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      scrollN = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };

    const onVisibility = () => {
      running = !document.hidden;
    };

    const onThemeChange = () => buildAtlas(stageAccent || undefined);

    const burstParticles = () => {
      if (!w || !h) return;
      const cx = w * (0.35 + stageProgress * 0.3);
      const cy = h * 0.45;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;
        const dx = p.x - cx;
        const dy = p.y - cy;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (5.5 + Math.random() * 7) * p.depth;
        p.vx += (dx / d) * force * 0.55;
        p.vy += (dy / d) * force * 0.55;
        if (Math.random() < 0.35) {
          p.tint = Math.floor(Math.random() * tints.length);
          p.g = Math.floor(Math.random() * GLYPHS.length);
        }
      }
    };

    const applyAtmosphere = (atm: FieldAtmosphere) => {
      target.intensity = atm.intensity;
      stageProgress = atm.progress;

      if (atm.accent && atm.accent !== stageAccent) {
        stageAccent = atm.accent;
        buildAtlas(stageAccent);
      } else if (!atm.accent && stageAccent) {
        stageAccent = '';
        buildAtlas();
      }

      if (atm.pulse && atm.pulse !== lastPulse) {
        lastPulse = atm.pulse;
        if (!reduced && atm.intensity > 0.2) burstParticles();
      }

      const sg = stageGlowRef.current;
      if (sg && atm.accent) {
        const x = 28 + atm.progress * 44;
        sg.style.background = `radial-gradient(circle at ${x}% 42%, ${atm.accent}, transparent 68%)`;
      }

      gsap.to(glowARef.current, {
        opacity: atm.intensity > 0.15 ? 0.22 : 0.5,
        duration: 0.55,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      gsap.to(glowBRef.current, {
        opacity: atm.intensity > 0.15 ? 0.16 : 0.4,
        duration: 0.55,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      gsap.to(stageGlowRef.current, {
        opacity: atm.intensity * (isLight ? 0.28 : 0.42),
        duration: 0.55,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    const unsubAtmosphere = subscribeFieldAtmosphere(applyAtmosphere);
    const themeObserver = new MutationObserver(onThemeChange);

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('pointercancel', onUp, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    onScroll();

    const RADIUS = 190;
    const R2 = RADIUS * RADIUS;

    const draw = (time: number) => {
      if (!atlas) return;
      ctx.clearRect(0, 0, w, h);

      // Smooth stage intensity for soft field response
      stageIntensity += (target.intensity - stageIntensity) * 0.08;
      const stageLift = stageProgress * 90 * stageIntensity;
      const stageBoost = 1 + stageIntensity * 0.22;

      const t = time;
      const linkAlpha = 0.5;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]!;

        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;

        let near = 0;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          near = 1 - d / RADIUS;
          const force = near * near * 26 * p.depth * pointer.mode;
          p.vx += (dx / d) * force * 0.06;
          p.vy += (dy / d) * force * 0.06;
        }

        p.vx += (p.hx - p.x) * 0.014;
        p.vy += (p.hy - p.y) * 0.014;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;

        const sway =
          reduced ? 0 : Math.sin(t * 0.6 + p.hx * 0.01 + stageProgress * 4) * 2.2 * p.depth;
        const lift = -scrollN * 130 * p.depth - stageLift * p.depth;
        const y = p.y + sway + lift;

        const wrapped = ((y % (h + 120)) + h + 120) % (h + 120);

        const size = SPRITE * p.scale * (1 + near * 0.5) * stageBoost;
        const alpha =
          (0.18 + p.depth * 0.34 + near * 0.42) *
          (reduced ? 0.6 : 1) *
          (isLight ? 0.5 : 1) *
          (1 + stageIntensity * 0.35);

        ctx.globalAlpha = Math.min(alpha, 0.95);
        ctx.drawImage(
          atlas,
          p.g * SPRITE * dpr,
          p.tint * SPRITE * dpr,
          SPRITE * dpr,
          SPRITE * dpr,
          p.x - size / 2,
          wrapped - size / 2,
          size,
          size,
        );

        if (near > 0.35) {
          ctx.globalAlpha = (near - 0.35) * linkAlpha * (isLight ? 0.6 : 1);
          ctx.strokeStyle = tints[2] ?? tints[0]!;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, wrapped);
          ctx.lineTo(pointer.x, pointer.y);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1;
    };

    if (reduced) {
      draw(0);
      return () => {
        unsubAtmosphere();
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        document.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', resize);
        document.removeEventListener('visibilitychange', onVisibility);
        themeObserver.disconnect();
      };
    }

    const tick = () => {
      if (!running) return;
      draw(gsap.ticker.time);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(500, 33);

    return () => {
      gsap.ticker.remove(tick);
      unsubAtmosphere();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-ink" />
      <div
        ref={glowARef}
        className="absolute -top-[20%] -left-[15%] h-[70vh] w-[70vw] rounded-full opacity-50 blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgb(var(--c-glow-a) / 0.4), transparent 68%)' }}
      />
      <div
        ref={glowBRef}
        className="absolute top-[38%] -right-[10%] h-[60vh] w-[55vw] rounded-full opacity-40 blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgb(var(--c-glow-b) / 0.28), transparent 68%)' }}
      />
      {/* Stage-driven wash — color shifts with skills / projects scroll */}
      <div
        ref={stageGlowRef}
        className="absolute inset-[-10%] opacity-0 blur-[100px] will-change-[opacity,background]"
        style={{ background: 'transparent' }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div
        className="absolute inset-0 opacity-[0.14] dark:opacity-[0.2]"
        style={{
          backgroundImage:
            'linear-gradient(rgb(var(--c-glow-a) / 0.32) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-glow-a) / 0.32) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 100% 60% at 50% 0%, #000 20%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 60% at 50% 0%, #000 20%, transparent 78%)',
        }}
      />
    </div>
  );
}
