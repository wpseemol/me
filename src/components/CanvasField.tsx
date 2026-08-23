'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

/**
 * Ambient canvas: a field of code glyphs the cursor pushes away and, while the
 * pointer is held down, pulls back in.
 *
 * Two decisions worth knowing about:
 *
 * 1. Glyphs are pre-rendered once into a small sprite atlas and blitted with
 *    drawImage. Calling fillText ~900 times a frame is what makes canvas text
 *    fields drop frames; blitting cached bitmaps does not.
 * 2. The loop runs on gsap.ticker rather than its own requestAnimationFrame, so
 *    the field, the scroll reveals and Lenis all advance on the same tick and
 *    can never tear against each other.
 */

const GLYPHS = ['>', '_', '/', '{', '}', ';', '·', '<', '$'];
const SPRITE = 44; // atlas cell size in CSS px before DPR scaling

type Particle = {
  hx: number; // home x
  hy: number; // home y
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number; // glyph index
  tint: number; // atlas tint row
  scale: number;
  depth: number; // 0.35 – 1, drives parallax and how hard it reacts
};

export default function CanvasField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    /* ------------------------------------------------------- sprite atlas */
    // One row per tint, one column per glyph. Rebuilt only on theme change.
    let atlas: HTMLCanvasElement | null = null;
    let tints: string[] = [];
    let isLight = false;

    const readTints = () => {
      const s = getComputedStyle(document.documentElement);
      const pick = (name: string, fallback: string) =>
        s.getPropertyValue(name).trim() || fallback;

      isLight = !document.documentElement.classList.contains('dark');

      // On a pale background the light tints vanish and the mid tints turn
      // into speckle, so the light theme gets the darker half of the ramp and
      // roughly half the opacity. Same field, half the shouting.
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

    const buildAtlas = () => {
      tints = readTints();
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

    /* ------------------------------------------------------------- layout */
    const seed = () => {
      // Density scales with area but is capped, so a 4K monitor doesn't get
      // three times the work of a laptop for the same visual result.
      const target = Math.min(Math.round((w * h) / 14000), 900);
      const cols = Math.ceil(Math.sqrt((target * w) / h));
      const rows = Math.ceil(target / cols);
      const cellW = w / cols;
      const cellH = h / rows;

      particles = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Jitter inside each cell: an even grid reads as wallpaper, a
          // jittered one reads as a field.
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

    /* -------------------------------------------------------- input state */
    // Off-screen until the pointer actually arrives, so nothing is disturbed
    // on load and the first frame matches the server render.
    const pointer = { x: -9999, y: -9999, mode: 1 }; // mode: 1 push, -1 pull
    let scrollN = 0;
    let running = true;

    const moveTo = gsap.quickTo(pointer, 'x', { duration: 0.32, ease: 'power2.out' });
    const moveToY = gsap.quickTo(pointer, 'y', { duration: 0.32, ease: 'power2.out' });

    const onPointerMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      moveTo(e.clientX - r.left);
      moveToY(e.clientY - r.top);
    };

    // Hold to pull the field back in. This is the whole interaction: the
    // cursor has two states and the field answers differently to each.
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

    const onThemeChange = () => buildAtlas();
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

    /* ----------------------------------------------------------- the loop */
    const RADIUS = 190;
    const R2 = RADIUS * RADIUS;

    const draw = (time: number) => {
      if (!atlas) return;
      ctx.clearRect(0, 0, w, h);

      const t = time;
      const linkAlpha = 0.5;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;

        let near = 0;
        if (d2 < R2) {
          const d = Math.sqrt(d2) || 1;
          near = 1 - d / RADIUS;
          // Deeper glyphs shove harder, which reads as depth without any 3D.
          const force = near * near * 26 * p.depth * pointer.mode;
          p.vx += (dx / d) * force * 0.06;
          p.vy += (dy / d) * force * 0.06;
        }

        // Spring home, with drag. Tuned so a fast swipe leaves a wake that
        // settles in roughly a second rather than snapping back.
        p.vx += (p.hx - p.x) * 0.014;
        p.vy += (p.hy - p.y) * 0.014;
        p.vx *= 0.9;
        p.vy *= 0.9;
        p.x += p.vx;
        p.y += p.vy;

        // Idle breathing plus a parallax lift as the page scrolls.
        const sway = reduced ? 0 : Math.sin(t * 0.6 + p.hx * 0.01) * 2.2 * p.depth;
        const lift = -scrollN * 130 * p.depth;
        const y = p.y + sway + lift;

        // Wrap vertically so the field never runs out from under the page.
        const wrapped = ((y % (h + 120)) + h + 120) % (h + 120);

        const size = SPRITE * p.scale * (1 + near * 0.5);
        const alpha =
          (0.18 + p.depth * 0.34 + near * 0.42) * (reduced ? 0.6 : 1) * (isLight ? 0.5 : 1);

        ctx.globalAlpha = Math.min(alpha, 0.9);
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

        // A hairline to the cursor for whatever is inside the radius: the
        // field acknowledges the pointer instead of only fleeing it.
        if (near > 0.35) {
          ctx.globalAlpha = (near - 0.35) * linkAlpha * (isLight ? 0.6 : 1);
          ctx.strokeStyle = tints[2];
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
      // One static frame: the texture is still there, nothing moves.
      draw(0);
      return () => {
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
      {/* Atmosphere sits under the canvas and is also the no-JS fallback. */}
      <div className="absolute inset-0 bg-ink" />
      <div
        className="absolute -top-[20%] -left-[15%] h-[70vh] w-[70vw] rounded-full opacity-50 blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgb(var(--c-glow-a) / 0.4), transparent 68%)' }}
      />
      <div
        className="absolute top-[38%] -right-[10%] h-[60vh] w-[55vw] rounded-full opacity-40 blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgb(var(--c-glow-b) / 0.28), transparent 68%)' }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Blueprint grid keeps structure where the field is sparse. */}
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
