'use client';

import { useState, useEffect, useRef, Suspense, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float } from '@react-three/drei';
import { Fraunces, Manrope } from 'next/font/google';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Dashboard } from '@/components/Dashboard';
import type { Group, PointLight } from 'three';

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['400', '500', '600'] });
const sans = Manrope({ subsets: ['latin'], variable: '--font-sans' });

const steps = [
  {
    title: 'Connect & Initialize',
    body: "Your FUSION Passport evaluates your wallet's history to create a secure, immutable identity.",
  },
  {
    title: 'Claim Testnet Tokens',
    body: 'Interact with the smart contracts using fUSD (Mock USDC) to simulate borrowing.',
  },
  {
    title: 'Build Your Score',
    body: 'Successful repayments mathematically increase your score, unlocking better lending rates.',
  },
];

/* ---------- helpers ---------- */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

type Pointer = { x: number; y: number };

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${shown ? 'in' : ''} ${className}`} style={{ ['--d' as string]: `${delay}s` }}>
      {children}
    </div>
  );
}

/* ---------- 3D scene ---------- */

function Ring({
  radius,
  color,
  tilt,
  speed,
  motion,
  opacity = 0.85,
}: {
  radius: number;
  color: string;
  tilt: [number, number, number];
  speed: number;
  motion: number;
  opacity?: number;
}) {
  const spin = useRef<Group>(null);
  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * speed * motion;
  });
  return (
    <group ref={spin}>
      <mesh rotation={tilt}>
        <torusGeometry args={[radius, 0.014, 8, 220]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} transparent opacity={opacity} />
      </mesh>
    </group>
  );
}

function Scene({
  isDesktop,
  motion,
  pointer,
  scrollY,
}: {
  isDesktop: boolean;
  motion: number;
  pointer: React.MutableRefObject<Pointer>;
  scrollY: React.MutableRefObject<number>;
}) {
  const rig = useRef<Group>(null);
  const core = useRef<Group>(null);
  const nodes = useRef<Group>(null);
  const smooth = useRef<Pointer>({ x: 0, y: 0 });
  const light = useRef<PointLight>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = rig.current;
    if (!g) return;

    // Intro: camera dolly + object scale-in
    const intro = motion ? easeOutCubic(clamp(t / 2.6)) : 1;
    const baseZ = isDesktop ? 8 : 10.5;
    state.camera.position.z += (baseZ + (1 - intro) * 9 - state.camera.position.z) * 0.12;

    // Scroll progress: 0 at hero, 1 after one viewport
    const p = clamp(scrollY.current / (window.innerHeight || 1), 0, 2);
    const pe = Math.min(p, 1);

    // Move across the page as the visitor scrolls
    const tx = isDesktop ? 2.7 - pe * 5.4 : 0;
    const ty = isDesktop ? 0 : 1.7 + pe * 0.4;
    const tz = -pe * 2.5 - Math.max(0, p - 1) * 4;
    g.position.x += (tx - g.position.x) * 0.06;
    g.position.y += (ty - g.position.y) * 0.06;
    g.position.z += (tz - g.position.z) * 0.06;

    const s = intro * (isDesktop ? 1 : 0.72) * (1 - pe * 0.3);
    g.scale.setScalar(Math.max(0.0001, s));

    // Pointer parallax (smoothed)
    smooth.current.x += (pointer.current.x - smooth.current.x) * 0.05;
    smooth.current.y += (pointer.current.y - smooth.current.y) * 0.05;

    // A light that follows the cursor, so the mouse "touches" the 3D object
    if (light.current) {
      light.current.position.set(smooth.current.x * 9, -smooth.current.y * 5.5, 4.5);
    }
    g.rotation.y = smooth.current.x * 0.45 + p * 1.1 + (motion ? t * 0.12 : 0);
    g.rotation.x = -smooth.current.y * 0.3;

    if (core.current && motion) core.current.scale.setScalar(1 + Math.sin(t * 2) * 0.06);
    if (nodes.current) nodes.current.rotation.y += delta * 0.45 * motion;
  });

  return (
    <>
    <pointLight ref={light} intensity={16} distance={16} decay={1.6} color="#7dd3fc" />
    <group ref={rig}>
      <Float speed={motion ? 1.4 : 0} rotationIntensity={0.6} floatIntensity={1.4}>
        {/* Original wireframe torus */}
        <mesh rotation={[0.5, 0.5, 0]}>
          <torusGeometry args={[2, 0.5, 16, 100]} />
          <meshStandardMaterial color="#3b82f6" wireframe transparent opacity={0.28} />
        </mesh>

        {/* Orbit rings */}
        <Ring radius={2.9} color="#60a5fa" tilt={[1.25, 0.2, 0.4]} speed={0.22} motion={motion} />
        <Ring radius={3.35} color="#d4b07a" tilt={[0.35, 0.1, 1.1]} speed={-0.16} motion={motion} opacity={0.7} />
        <Ring radius={2.4} color="#67e8f9" tilt={[1.9, 0.5, 0.1]} speed={0.3} motion={motion} opacity={0.55} />

        {/* Core */}
        <group ref={core}>
          <mesh>
            <icosahedronGeometry args={[0.95, 1]} />
            <meshStandardMaterial color="#93c5fd" emissive="#2563eb" emissiveIntensity={0.7} wireframe transparent opacity={0.55} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.36, 32, 32]} />
            <meshStandardMaterial color="#bae6fd" emissive="#38bdf8" emissiveIntensity={1.6} />
          </mesh>
        </group>

        {/* Orbiting nodes */}
        <group ref={nodes} rotation={[0.4, 0, 0.3]}>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 2.9, Math.sin(a * 2) * 0.5, Math.sin(a) * 2.9]}>
                <sphereGeometry args={[i % 2 ? 0.08 : 0.11, 16, 16]} />
                <meshStandardMaterial
                  color={i % 2 ? '#a5f3fc' : '#f5deb3'}
                  emissive={i % 2 ? '#22d3ee' : '#d4b07a'}
                  emissiveIntensity={1.8}
                />
              </mesh>
            );
          })}
        </group>
      </Float>
    </group>
    </>
  );
}

/* ---------- Custom cursor ---------- */

function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only for devices with a real mouse
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.body.classList.add('has-cursor');

    const INTERACTIVE = 'a,button,[role="button"],input,select,textarea,label,summary,[data-cursor]';
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;
    let hover = false;
    let down = false;
    let seen = false;
    let raf = 0;

    const show = (v: boolean) => {
      const o = v ? '1' : '0';
      if (dot.current) dot.current.style.opacity = o;
      if (ring.current) ring.current.style.opacity = o;
    };

    const ripple = (px: number, py: number) => {
      const r = document.createElement('div');
      Object.assign(r.style, {
        position: 'fixed',
        left: `${px}px`,
        top: `${py}px`,
        width: '96px',
        height: '96px',
        border: '1px solid rgba(103,232,249,0.7)',
        borderRadius: '9999px',
        pointerEvents: 'none',
        zIndex: '2147483646',
      });
      document.body.appendChild(r);
      const anim = r.animate(
        [
          { transform: 'translate(-50%, -50%) scale(0.2)', opacity: 0.9 },
          { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
        ],
        { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' }
      );
      anim.onfinish = () => r.remove();
    };

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!seen) {
        seen = true;
        rx = x;
        ry = y;
        show(true);
      }
      const target = e.target as Element | null;
      const next = !!target?.closest?.(INTERACTIVE);
      if (next !== hover) {
        hover = next;
        if (ring.current) ring.current.dataset.h = next ? '1' : '0';
      }
    };
    const onDown = (e: MouseEvent) => {
      down = true;
      if (!reduce) ripple(e.clientX, e.clientY);
    };
    const onUp = () => {
      down = false;
    };
    const onLeave = () => show(false);
    const onEnter = () => seen && show(true);

    const tick = () => {
      const k = reduce ? 1 : 0.18;
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${hover ? 0.5 : down ? 1.6 : 1})`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) scale(${down ? 0.8 : hover ? 1.8 : 1})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);

    return () => {
      cancelAnimationFrame(raf);
      document.body.classList.remove('has-cursor');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
    };
  }, []);

  return (
    <>
      <div ref={ring} className="cur-ring" data-h="0" aria-hidden />
      <div ref={dot} className="cur-dot" aria-hidden />
    </>
  );
}

/* ---------- Page ---------- */

const css = `
.hl { display:block; overflow:hidden; padding-bottom:.1em; }
.hl > span { display:block; transform:translateY(110%); animation:hl-up 1.2s cubic-bezier(.16,1,.3,1) forwards; animation-delay:var(--d,0s); }
@keyframes hl-up { to { transform:translateY(0); } }
.fade-up { opacity:0; transform:translateY(18px); animation:fade-up 1s cubic-bezier(.16,1,.3,1) forwards; animation-delay:var(--d,0s); }
@keyframes fade-up { to { opacity:1; transform:none; } }
.fade-in { opacity:0; animation:fade-in 1.6s ease forwards; animation-delay:var(--d,0s); }
@keyframes fade-in { to { opacity:1; } }
.reveal { opacity:0; transform:translateY(32px); transition:opacity .9s cubic-bezier(.16,1,.3,1) var(--d,0s), transform .9s cubic-bezier(.16,1,.3,1) var(--d,0s); }
.reveal.in { opacity:1; transform:none; }
.cue { animation:cue 2.2s ease-in-out infinite; transform-origin:top; }
body.has-cursor, body.has-cursor * { cursor:none !important; }
.cur-ring, .cur-dot { position:fixed; left:0; top:0; pointer-events:none; z-index:2147483647; opacity:0; border-radius:9999px; will-change:transform; transition:opacity .3s ease, background-color .25s ease, border-color .25s ease; }
.cur-ring { width:38px; height:38px; border:1px solid rgba(255,255,255,.45); }
.cur-ring[data-h="1"] { background-color:rgba(96,165,250,.14); border-color:rgba(212,176,122,.85); }
.cur-dot { width:7px; height:7px; background:#fff; box-shadow:0 0 14px 2px rgba(103,232,249,.7); }
@keyframes cue { 0%,100% { transform:scaleY(.3); opacity:.4; } 50% { transform:scaleY(1); opacity:1; } }
@media (prefers-reduced-motion: reduce) {
  .hl > span, .fade-up, .fade-in { animation:none; transform:none; opacity:1; }
  .reveal { opacity:1; transform:none; transition:none; }
  .cue { animation:none; }
}
`;

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pointer = useRef<Pointer>({ x: 0, y: 0 });
  const scrollY = useRef(0);

  useEffect(() => {
    setIsMounted(true);

    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setIsDesktop(desktopQuery.matches);
      setReduceMotion(motionQuery.matches);
    };
    const onMove = (e: MouseEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onScroll = () => {
      scrollY.current = window.scrollY;
    };

    sync();
    onScroll();
    desktopQuery.addEventListener('change', sync);
    motionQuery.addEventListener('change', sync);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      desktopQuery.removeEventListener('change', sync);
      motionQuery.removeEventListener('change', sync);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  if (!isMounted) return null;

  const goToDashboard = () =>
    document.getElementById('dashboard')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

  return (
    <main
      className={`${display.variable} ${sans.variable} relative min-h-[100dvh] w-full overflow-x-hidden bg-[#070D1C] font-[family-name:var(--font-sans)] text-white antialiased`}
    >
      <style>{css}</style>
      <Cursor />

      {/* Ambient light */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(55% 55% at 78% 45%, rgba(37,99,235,0.22), transparent 70%), radial-gradient(35% 35% at 10% 90%, rgba(212,176,122,0.08), transparent 70%)',
        }}
      />

      {/* 3D background */}
      <div className="fade-in pointer-events-none fixed inset-0 z-0" style={{ ['--d' as string]: '0.1s' }}>
        <Canvas camera={{ position: [0, 0, 18], fov: 45 }} dpr={[1, 1.75]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={2} />
          <pointLight position={[-6, -2, 3]} intensity={6} color="#d4b07a" />
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={isDesktop ? 2200 : 1100} factor={4} fade speed={reduceMotion ? 0 : 1} />
            <Scene isDesktop={isDesktop} motion={reduceMotion ? 0 : 1} pointer={pointer} scrollY={scrollY} />
          </Suspense>
        </Canvas>
      </div>

      {/* Top Navbar */}
      <header className="fade-up fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#070D1C]/55 backdrop-blur-xl" style={{ ['--d' as string]: '0.2s' }}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 shadow-[0_0_24px_rgba(56,189,248,0.5)]">
              <div className="h-3 w-3 rounded-full border-2 border-white/90" />
            </div>
            <h1 className="truncate font-[family-name:var(--font-display)] text-xl font-semibold tracking-wide sm:text-2xl">FUSION</h1>
          </div>
          <div className="shrink-0">
            <ConnectButton />
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto flex min-h-[100dvh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 lg:justify-center lg:pb-0">
        <div className="flex max-w-2xl flex-col gap-6 lg:gap-7">
          <h2 className="font-[family-name:var(--font-display)] text-[2.7rem] font-medium leading-[1.02] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
            <span className="hl"><span style={{ ['--d' as string]: '0.7s' }}>Programmable</span></span>
            <span className="hl"><span style={{ ['--d' as string]: '0.85s' }}>Onchain Credit</span></span>
          </h2>

          <p className="fade-up max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg" style={{ ['--d' as string]: '1.2s' }}>
            Welcome to FUSION. This protocol brings deterministic risk scoring to decentralized finance, enabling
            continuous zero trust access control for your liquidity.
          </p>

          <div className="fade-up flex items-center gap-4" style={{ ['--d' as string]: '1.4s' }}>
            <button
              onClick={goToDashboard}
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0A1226] transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
            >
              Open dashboard
            </button>
          </div>
        </div>

        <div className="fade-in absolute bottom-6 left-1/2 hidden -translate-x-1/2 sm:block" style={{ ['--d' as string]: '2.2s' }} aria-hidden>
          <div className="cue h-10 w-px bg-gradient-to-b from-white/70 to-transparent" />
        </div>
      </section>

      {/* Steps */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-4 md:grid-cols-3 md:gap-6">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.12}>
              <div className="h-full rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md transition-colors duration-300 hover:border-[#d4b07a]/50">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-[#d4b07a]/70 text-sm font-semibold text-[#d4b07a]">
                  {i + 1}
                </span>
                <h4 className="mt-5 font-[family-name:var(--font-display)] text-2xl">{s.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Dashboard */}
      <section id="dashboard" className="relative z-10 scroll-mt-20 bg-gradient-to-b from-transparent via-[#070D1C]/80 to-[#070D1C] px-4 pb-24 pt-10 sm:px-6 sm:pb-32">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <h3 className="mb-6 font-[family-name:var(--font-display)] text-3xl sm:text-4xl">Try it on testnet</h3>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="rounded-3xl border border-white/10 bg-[#0C1730]/80 p-3 shadow-[0_40px_80px_-40px_rgba(37,99,235,0.45)] backdrop-blur-xl sm:p-6">
              <Dashboard />
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}