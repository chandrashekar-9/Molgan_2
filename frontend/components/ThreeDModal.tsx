'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { get3DStructure } from '@/lib/api';

interface Props { smiles: string; onClose: () => void; }

declare global {
  interface Window {
    $3Dmol?: {
      createViewer: (el: HTMLElement, opts: object) => Viewer3D;
    };
  }
}
interface Viewer3D {
  addModel: (data: string, fmt: string) => void;
  setStyle: (sel: object, style: object) => void;
  addSurface?: (type: unknown, opts: object) => void;
  zoomTo: () => void;
  render: () => void;
  rotate: (deg: number, axis: string) => void;
  zoom: (factor: number) => void;
  resetView: () => void;
}

function load3Dmol(): Promise<void> {
  return new Promise(resolve => {
    if (window.$3Dmol) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.1.0/3Dmol-min.js';
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export default function ThreeDModal({ smiles, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<Viewer3D | null>(null);
  const [status, setStatus]   = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [style3d, setStyle3d] = useState<'stick' | 'sphere' | 'line'>('stick');
  const [isFs, setIsFs] = useState(false);

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Load 3Dmol + fetch SDF + render
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load3Dmol();
        const data = await get3DStructure(smiles);
        if (cancelled) return;
        if (!containerRef.current || !window.$3Dmol) return;

        const viewer = window.$3Dmol.createViewer(containerRef.current, {
          backgroundColor: '#060d1f',
          antialias: true,
        });
        viewer.addModel(data.sdf, 'sdf');
        viewer.setStyle({}, {
          stick: { radius: 0.18, colorscheme: 'default' },
          sphere: { scale: 0.32 },
        });
        viewer.zoomTo();
        viewer.render();
        viewerRef.current = viewer;
        setStatus('ready');
      } catch (e: unknown) {
        if (!cancelled) {
          setErrorMsg(e instanceof Error ? e.message : 'Failed to load 3D structure');
          setStatus('error');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [smiles]);

  // Re-apply style on change
  useEffect(() => {
    if (!viewerRef.current || status !== 'ready') return;
    const v = viewerRef.current;
    const styleMap: Record<string, object> = {
      stick:  { stick: { radius: 0.18 }, sphere: { scale: 0.32 } },
      sphere: { sphere: { colorscheme: 'Jmol', scale: 0.55 } },
      line:   { line: { colorscheme: 'default' } },
    };
    v.setStyle({}, styleMap[style3d]);
    v.render();
  }, [style3d, status]);

  const resetView = useCallback(() => { viewerRef.current?.resetView(); viewerRef.current?.render(); }, []);

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#060d1f',
        border: '1px solid var(--border)',
        borderRadius: 18,
        width: isFs ? '100vw' : 'min(90vw, 860px)',
        height: isFs ? '100vh' : 'min(90vh, 620px)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', transition: 'width 0.3s, height 0.3s',
        boxShadow: '0 0 60px rgba(0,212,255,0.15)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--cyan)' }}>3D Structure Viewer</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 2, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {smiles}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <IconBtn title="Fullscreen" onClick={() => setIsFs(!isFs)}>
              {isFs
                ? <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>
                : <path d="M15 3h6m0 0v6m0-6l-7 7M9 21H3m0 0v-6m0 6l7-7"/>
              }
            </IconBtn>
            <IconBtn title="Reset view" onClick={resetView}>
              <path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </IconBtn>
            <IconBtn title="Close" onClick={onClose}>
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </IconBtn>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 6, padding: '10px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0, alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: 4 }}>Style:</span>
          {(['stick','sphere','line'] as const).map(s => (
            <button key={s} onClick={() => setStyle3d(s)}
              style={{
                padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)',
                background: style3d === s ? 'var(--cyan-dim)' : 'transparent',
                borderColor: style3d === s ? 'var(--border-hover)' : 'var(--border)',
                color: style3d === s ? 'var(--cyan)' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize',
              }}
            >{s}</button>
          ))}
          <div style={{ flex: 1 }}/>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Drag to rotate · Scroll to zoom</span>
        </div>

        {/* Viewer */}
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
          {status === 'loading' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, border: '3px solid var(--cyan-dim)', borderTopColor: 'var(--cyan)', borderRadius: '50%', animation: 'spin3d 0.8s linear infinite' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Generating 3D coordinates…</span>
            </div>
          )}
          {status === 'error' && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ fontSize: '2rem' }}>⚠️</span>
              <span style={{ color: '#ff4466', fontWeight: 600 }}>3D generation failed</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', maxWidth: 320, textAlign: 'center' }}>{errorMsg}</span>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin3d { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{
      background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
      borderRadius: 7, padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)',
      display: 'flex', alignItems: 'center',
      transition: 'background 0.2s, color 0.2s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--cyan-dim)'; (e.currentTarget as HTMLElement).style.color = 'var(--cyan)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{children}</svg>
    </button>
  );
}
