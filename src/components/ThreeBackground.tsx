'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Ambient 3D "architecture lattice".
 *
 * A wireframe icosahedron core wrapped in an orbiting node field. Scroll
 * progress disperses the shell outward and rotates the core; the pointer
 * parallaxes the whole rig. Colours are read from the active theme so the
 * scene re-tints on a dark/light switch instead of being rebuilt.
 */
export default function ThreeBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Bail out entirely on machines that can't run WebGL — the CSS gradient
    // underneath is a perfectly good fallback.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: window.devicePixelRatio < 2,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      host.clientWidth / host.clientHeight,
      0.1,
      120,
    );
    camera.position.set(0, 0, 20);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const isDark = () => document.documentElement.classList.contains('dark');

    const VIOLET = new THREE.Color('#6C4CF5');
    const MAGENTA = new THREE.Color('#E5468B');
    const rig = new THREE.Group();
    scene.add(rig);

    /* ---------------------------------------------------- wireframe core */
    const coreGeo = new THREE.IcosahedronGeometry(5.4, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: VIOLET,
      wireframe: true,
      transparent: true,
      opacity: 0.34,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    rig.add(core);

    const innerGeo = new THREE.IcosahedronGeometry(3.1, 0);
    const innerMat = new THREE.MeshBasicMaterial({
      color: MAGENTA,
      wireframe: true,
      transparent: true,
      opacity: 0.26,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    rig.add(inner);

    /* ---------------------------------------------------- orbiting nodes */
    const NODES = window.innerWidth < 768 ? 260 : 520;
    const nodeGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(NODES * 3);
    const home = new Float32Array(NODES * 3);
    const col = new Float32Array(NODES * 3);
    const sizes = new Float32Array(NODES);

    for (let i = 0; i < NODES; i++) {
      // Fibonacci-ish shell so nodes distribute evenly rather than clumping.
      const t = i / NODES;
      const phi = Math.acos(1 - 2 * t);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const r = 8 + Math.random() * 6;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi) * 0.7;

      home[i * 3] = x;
      home[i * 3 + 1] = y;
      home[i * 3 + 2] = z;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const c = VIOLET.clone().lerp(MAGENTA, Math.random());
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;

      sizes[i] = Math.random() * 0.09 + 0.035;
    }

    nodeGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    nodeGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

    const nodeMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uOpacity: { value: 0.85 }, uScale: { value: 1 } },
      vertexShader: `
        attribute float aSize;
        varying vec3 vColor;
        uniform float uScale;
        void main() {
          vColor = color;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * uScale * (300.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform float uOpacity;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.06, d);
          gl_FragColor = vec4(vColor, a * uOpacity);
        }
      `,
    });
    nodeMat.vertexColors = true;

    const nodes = new THREE.Points(nodeGeo, nodeMat);
    rig.add(nodes);

    /* ---------------------------------------------------- connective web */
    const linkGeo = new THREE.BufferGeometry();
    const MAX_LINKS = 240;
    const linkPos = new Float32Array(MAX_LINKS * 6);
    linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
    const linkMat = new THREE.LineBasicMaterial({
      color: VIOLET,
      transparent: true,
      opacity: 0.16,
    });
    const links = new THREE.LineSegments(linkGeo, linkMat);
    rig.add(links);

    // Precompute which node pairs are close enough to link — doing this per
    // frame for 520 nodes would be O(n²) every tick.
    const pairs: [number, number][] = [];
    for (let i = 0; i < NODES && pairs.length < MAX_LINKS; i++) {
      for (let j = i + 1; j < NODES && pairs.length < MAX_LINKS; j++) {
        const dx = home[i * 3] - home[j * 3];
        const dy = home[i * 3 + 1] - home[j * 3 + 1];
        const dz = home[i * 3 + 2] - home[j * 3 + 2];
        if (dx * dx + dy * dy + dz * dz < 6.2) pairs.push([i, j]);
      }
    }
    linkGeo.setDrawRange(0, pairs.length * 2);

    /* ---------------------------------------------------- theme tinting */
    function applyTheme() {
      const dark = isDark();
      coreMat.opacity = dark ? 0.34 : 0.24;
      innerMat.opacity = dark ? 0.26 : 0.2;
      linkMat.opacity = dark ? 0.16 : 0.13;
      nodeMat.uniforms.uOpacity.value = dark ? 0.85 : 0.62;
      nodeMat.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      nodeMat.needsUpdate = true;
    }
    applyTheme();

    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    /* ---------------------------------------------------- input state */
    let scrollN = 0; // 0 → 1 down the page
    let targetScroll = 0;
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      targetScroll = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    };

    const onPointer = (e: PointerEvent) => {
      pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerTarget.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const onResize = () => {
      if (!host.clientWidth) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('resize', onResize);
    onScroll();

    /* ---------------------------------------------------- pause offscreen */
    let visible = !document.hidden;
    const onVisibility = () => {
      visible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibility);

    /* ---------------------------------------------------- render loop */
    const clock = new THREE.Clock();
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;

      const t = clock.getElapsedTime();

      // Ease toward the live scroll/pointer values so motion stays buttery.
      scrollN += (targetScroll - scrollN) * 0.06;
      pointer.x += (pointerTarget.x - pointer.x) * 0.045;
      pointer.y += (pointerTarget.y - pointer.y) * 0.045;

      const speed = reduced ? 0 : 1;

      // Core counter-rotates against the inner shell.
      core.rotation.y = t * 0.06 * speed + scrollN * Math.PI * 1.15;
      core.rotation.x = t * 0.035 * speed + scrollN * 0.55;
      inner.rotation.y = -t * 0.11 * speed - scrollN * Math.PI;
      inner.rotation.z = t * 0.05 * speed;

      // Scroll breathes the core in and out.
      const pulse = 1 + Math.sin(t * 0.5) * 0.02 * speed + scrollN * 0.22;
      core.scale.setScalar(pulse);
      inner.scale.setScalar(1 + scrollN * 0.4);

      // Nodes disperse outward and drift as you travel down the page.
      const spread = 1 + scrollN * 0.85;
      const p = nodeGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < NODES; i++) {
        const i3 = i * 3;
        const wobble = reduced ? 0 : Math.sin(t * 0.55 + i * 0.35) * 0.22;
        p[i3] = home[i3] * spread + wobble;
        p[i3 + 1] = home[i3 + 1] * spread + Math.cos(t * 0.45 + i * 0.28) * 0.22 * speed;
        p[i3 + 2] = home[i3 + 2] * spread;
      }
      nodeGeo.attributes.position.needsUpdate = true;

      // Rebuild the link segments from the (now moved) node positions.
      const lp = linkGeo.attributes.position.array as Float32Array;
      for (let k = 0; k < pairs.length; k++) {
        const [a, b] = pairs[k];
        lp[k * 6] = p[a * 3];
        lp[k * 6 + 1] = p[a * 3 + 1];
        lp[k * 6 + 2] = p[a * 3 + 2];
        lp[k * 6 + 3] = p[b * 3];
        lp[k * 6 + 4] = p[b * 3 + 1];
        lp[k * 6 + 5] = p[b * 3 + 2];
      }
      linkGeo.attributes.position.needsUpdate = true;

      nodes.rotation.y = t * 0.02 * speed + scrollN * 0.6;
      nodeMat.uniforms.uScale.value = 1 + scrollN * 0.5;

      // Hue travels violet → magenta as the visitor descends.
      coreMat.color.copy(VIOLET).lerp(MAGENTA, scrollN);
      linkMat.color.copy(VIOLET).lerp(MAGENTA, scrollN * 0.8);

      // Pointer parallax + a slow dolly on scroll.
      rig.rotation.y += (pointer.x * 0.22 - rig.rotation.y) * 0.05;
      rig.rotation.x += (pointer.y * 0.16 - rig.rotation.x) * 0.05;
      camera.position.z = 20 + scrollN * 7;
      camera.position.y = -scrollN * 2.4;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    tick();

    /* ---------------------------------------------------- teardown */
    return () => {
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);

      coreGeo.dispose();
      innerGeo.dispose();
      nodeGeo.dispose();
      linkGeo.dispose();
      coreMat.dispose();
      innerMat.dispose();
      nodeMat.dispose();
      linkMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* CSS atmosphere sits under the canvas and is also the WebGL fallback */}
      <div className="absolute inset-0 bg-ink" />
      <div
        className="absolute -left-[15%] -top-[20%] h-[70vh] w-[70vw] rounded-full opacity-50 blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgba(108,76,245,0.42), transparent 68%)' }}
      />
      <div
        className="absolute -right-[10%] top-[38%] h-[60vh] w-[55vw] rounded-full opacity-40 blur-[110px]"
        style={{ background: 'radial-gradient(circle, rgba(229,70,139,0.34), transparent 68%)' }}
      />
      <div ref={hostRef} className="absolute inset-0 h-full w-full" />
      {/* Grid overlay keeps the "blueprint" read even where the lattice is sparse */}
      <div
        className="absolute inset-0 opacity-[0.16] dark:opacity-[0.22]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(128,110,220,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(128,110,220,0.35) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 100% 60% at 50% 0%, #000 20%, transparent 78%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 100% 60% at 50% 0%, #000 20%, transparent 78%)',
        }}
      />
    </div>
  );
}
