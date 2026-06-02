'use client';
import { useState } from 'react';
import type { MoleculeResult } from '@/lib/types';
import ThreeDModal from './ThreeDModal';

interface Props {
  molecule: MoleculeResult;
  rank: number;
  scoreLabel: string;
}

export default function MoleculeCard({ molecule: m, rank, scoreLabel }: Props) {
  const [show3D, setShow3D] = useState(false);

  const qedColor = m.qed >= 0.6 ? '#00ff88' : m.qed >= 0.3 ? '#ffb800' : '#ff4466';
  const saColor  = m.sa_score <= 4 ? '#00ff88' : m.sa_score <= 6 ? '#ffb800' : '#ff4466';

  return (
    <>
      <div className="glass glass-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg,var(--cyan),var(--blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.72rem', fontWeight: 800, color: '#fff',
            flexShrink: 0,
          }}>#{rank}</span>
          <div style={{
            background: 'var(--cyan-dim)', border: '1px solid var(--border-hover)',
            borderRadius: 20, padding: '2px 10px',
            fontSize: '0.68rem', fontWeight: 700, color: 'var(--cyan)',
          }}>
            {scoreLabel} {m.score.toFixed(3)}
          </div>
        </div>

        {/* 2D image */}
        <div style={{
          background: 'rgba(255,255,255,0.97)', borderRadius: 10,
          overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 180,
        }}>
          {m.image_b64 ? (
            <img
              src={m.image_b64}
              alt={`Molecule ${m.smiles}`}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <span style={{ color: '#999', fontSize: '0.8rem' }}>No image</span>
          )}
        </div>

        {/* SMILES */}
        <div style={{
          background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '6px 10px',
          fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'monospace',
          wordBreak: 'break-all', lineHeight: 1.4,
          maxHeight: 48, overflow: 'hidden',
        }} title={m.smiles}>
          {m.smiles.length > 80 ? m.smiles.slice(0, 78) + '…' : m.smiles}
        </div>

        {/* Property badges */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div className="prop-badge">
            <span className="label">QED</span>
            <span className="value" style={{ color: qedColor }}>{m.qed.toFixed(3)}</span>
          </div>
          <div className="prop-badge">
            <span className="label">logP</span>
            <span className="value">{m.logp.toFixed(3)}</span>
          </div>
          <div className="prop-badge">
            <span className="label">SA Score</span>
            <span className="value" style={{ color: saColor }}>{m.sa_score.toFixed(2)}</span>
          </div>
          <div className="prop-badge">
            <span className="label">MW (Da)</span>
            <span className="value">{m.molecular_weight.toFixed(1)}</span>
          </div>
        </div>

        {/* 3D button */}
        <button
          onClick={() => setShow3D(true)}
          style={{
            width: '100%', padding: '9px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--cyan)',
            fontSize: '0.82rem', fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'var(--cyan-dim)';
            el.style.borderColor = 'var(--border-hover)';
            el.style.boxShadow = '0 0 12px var(--cyan-dim)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.background = 'transparent';
            el.style.borderColor = 'var(--border)';
            el.style.boxShadow = 'none';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
          View 3D Structure
        </button>
      </div>

      {show3D && <ThreeDModal smiles={m.smiles} onClose={() => setShow3D(false)} />}
    </>
  );
}
