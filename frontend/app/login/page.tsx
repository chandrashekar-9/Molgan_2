'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Add your actual authentication logic here
    setTimeout(() => {
      setLoading(false);
      window.location.href = '/generate';
    }, 1000);
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px', position: 'relative', overflow: 'hidden' }} className="hero-bg grid-pattern">
      {/* Background glowing effects */}
      <div style={{ position: 'absolute', top: '20%', left: '30%', width: '400px', height: '400px', background: 'rgba(0, 212, 255, 0.05)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '20%', width: '300px', height: '300px', background: 'rgba(0, 102, 255, 0.05)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div className="glass" style={{ width: '100%', maxWidth: '420px', padding: '40px', position: 'relative', zIndex: 10, borderTop: '2px solid rgba(0, 212, 255, 0.2)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/">
            <img src="/logo.png?v=3" alt="Logo" style={{ width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px', boxShadow: '0 0 16px var(--cyan-glow)' }} />
          </Link>
          <h1 style={{ fontFamily: 'var(--font-space, sans-serif)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px' }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
            Sign in to continue to Conditional <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>MolGAN</span>
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="molgan-input"
              placeholder="name@example.com"
              style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem' }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Password</label>
              <a href="#" style={{ fontSize: '0.75rem', color: 'var(--cyan)', textDecoration: 'none' }}>Forgot password?</a>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="molgan-input"
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 16px', fontSize: '0.95rem' }}
            />
          </div>

          <button type="submit" className="btn-neon" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 12 }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 28, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--cyan)', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
