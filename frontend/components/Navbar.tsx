'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { downloadCSV } from '@/lib/api';

const links = [
  { label: 'Input Guide', href: '/guide' },
  { label: 'Architecture', href: '/architecture' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { result } = useAppStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (pathname === '/') {
    return null;
  }

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(5,10,20,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Logo + Title */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src="/logo.png?v=3"
          alt="MolGAN Logo"
          style={{
            width: 44, height: 44,
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 0 14px rgba(0,212,255,0.5)',
          }}
        />
        <span style={{
          fontFamily: 'var(--font-space, sans-serif)', fontWeight: 700,
          fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)', color: 'var(--text-primary)',
          letterSpacing: '-0.02em', lineHeight: 1.1,
        }}>
          Conditional <span className="gradient-text">MolGAN</span>{' '}
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>for Molecular Generation</span>
        </span>
      </Link>

      {/* Desktop Links */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }} className="hidden md:flex">
        {result && result.combined_ranking.length > 0 && (
          <button
            onClick={() => downloadCSV(result.combined_ranking)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'rgba(0,212,255,0.05)',
              color: 'var(--cyan)', fontWeight: 600, fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'var(--cyan-dim)';
              el.style.borderColor = 'var(--border-hover)';
              el.style.boxShadow = '0 0 14px var(--cyan-dim)';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = 'rgba(0,212,255,0.05)';
              el.style.borderColor = 'var(--border)';
              el.style.boxShadow = 'none';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download CSV
          </button>
        )}

        {links.map(l => (
          <Link key={l.href} href={l.href} style={{
            padding: '6px 16px', borderRadius: 8,
            color: pathname === l.href ? 'var(--cyan)' : 'var(--text-secondary)', 
            textDecoration: 'none',
            fontSize: '0.875rem', fontWeight: 500,
            transition: 'color 0.2s, background 0.2s',
            background: pathname === l.href ? 'var(--cyan-dim)' : 'transparent',
          }}
          onMouseEnter={e => {
            if (pathname !== l.href) {
              (e.target as HTMLElement).style.color = 'var(--cyan)';
              (e.target as HTMLElement).style.background = 'rgba(0,212,255,0.03)';
            }
          }}
          onMouseLeave={e => {
            if (pathname !== l.href) {
              (e.target as HTMLElement).style.color = 'var(--text-secondary)';
              (e.target as HTMLElement).style.background = 'transparent';
            }
          }}
          >{l.label}</Link>
        ))}

        {pathname !== '/generate' && (
          <Link href="/generate" className="btn-neon" style={{ padding: '8px 20px', fontSize: '0.82rem', marginLeft: 8, textDecoration: 'none' }}>
            Start Generating
          </Link>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 8 }}
        className="md:hidden"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {menuOpen
            ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
            : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
          }
        </svg>
      </button>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: '64px', left: 0, right: 0,
          background: 'rgba(5,10,20,0.97)', borderBottom: '1px solid var(--border)',
          padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          {links.map(l => (
            <Link key={l.href} href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{ padding: '10px 12px', color: 'var(--text-secondary)', textDecoration: 'none', borderRadius: 8 }}
            >{l.label}</Link>
          ))}
          {pathname !== '/generate' && (
             <Link href="/generate" onClick={() => setMenuOpen(false)} style={{ padding: '10px 12px', color: 'var(--cyan)', textDecoration: 'none', borderRadius: 8, fontWeight: 700 }}>
               Start Generating
             </Link>
          )}
        </div>
      )}
    </nav>
  );
}
