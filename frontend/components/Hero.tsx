'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

/* Animated canvas background with floating nodes */
function ParticleCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const N = 40;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 1.5 + Math.random() * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.55)';
        ctx.fill();
      });
      nodes.forEach((a, i) => nodes.forEach((b, j) => {
        if (j <= i) return;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,212,255,${0.18 * (1 - d / 130)})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }));
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.65,
    }} />
  );
}

export default function Hero() {
  return (
    <section id="hero" style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '80px 24px 60px',
    }} className="hero-bg grid-pattern">
      <ParticleCanvas />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 780 }}>
        {/* Badge */}
        <div style={{ marginBottom: 24 }}>
          <span className="section-label">⚗️ AI Drug Discovery Platform</span>
        </div>

        {/* Logo and Title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{
            fontFamily: 'var(--font-space, sans-serif)',
            fontSize: 'clamp(2.8rem, 7vw, 4.8rem)',
            fontWeight: 800, lineHeight: 1.1,
            margin: '0 0 10px',
            letterSpacing: '-0.03em',
          }}>
            Conditional <span className="gradient-text">MolGAN</span>
          </h1>
          <div style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            for Molecular Generation
          </div>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          color: 'var(--text-secondary)', lineHeight: 1.7,
          maxWidth: 600, margin: '0 auto 40px',
        }}>
          AI-Powered Molecular Generation using{' '}
          <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Conditional GANs</span> and{' '}
          <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>Reinforcement Learning</span>.
          Design drug-like molecules conditioned on target QED and logP properties.
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 32, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44 }}>
          {[
            { v: 'QM9', l: 'Training Dataset' },
            { v: '131K+', l: 'Reference SMILES' },
            { v: 'WGAN-GP', l: 'Architecture' },
            { v: 'CUDA', l: 'GPU Accelerated' },
          ].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-space, sans-serif)' }}>{s.v}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/generate" className="btn-neon" style={{ textDecoration: 'none', fontSize: '1rem', padding: '14px 36px' }}>
            Start Generating →
          </Link>
        </div>
      </div>


    </section>
  );
}
