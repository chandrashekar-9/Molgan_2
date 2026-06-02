'use client';
import { useState } from 'react';
import type { GenerateResponse, RankingTab } from '@/lib/types';
import MoleculeCard from './MoleculeCard';
import { downloadCSV } from '@/lib/api';

interface Props { data: GenerateResponse }

const TABS: { id: RankingTab; label: string; icon: string; scoreLabel: string }[] = [
  { id: 'combined', label: 'Combined Ranking', icon: '⚖️', scoreLabel: 'Score:' },
  { id: 'qed',      label: 'QED Ranking',      icon: '💊', scoreLabel: 'QED Δ:' },
  { id: 'logp',     label: 'logP Ranking',     icon: '📈', scoreLabel: 'logP Δ:' },
];

export default function ResultsSection({ data }: Props) {
  const [tab, setTab] = useState<RankingTab>('combined');

  const molecules =
    tab === 'combined' ? data.combined_ranking :
    tab === 'qed'      ? data.qed_ranking :
                         data.logp_ranking;

  const scoreLabel = TABS.find(t => t.id === tab)!.scoreLabel;

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <span className="section-label">🧪 Results</span>
          <h2 style={{ fontFamily: 'var(--font-space, sans-serif)', fontWeight: 700, fontSize: '1.2rem', margin: '6px 0 0' }}>
            Generated Molecules
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
            {molecules.length} molecules sorted by {tab} match
          </p>
        </div>

      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 6, padding: '6px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 12, marginBottom: 20,
        flexWrap: 'wrap',
      }}>
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
            style={{ flex: 1, minWidth: 120 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Best molecule highlight */}
      {molecules.length > 0 && (
        <div className="glass" style={{
          padding: '16px 20px', marginBottom: 18,
          borderColor: 'rgba(0,212,255,0.3)',
          background: 'linear-gradient(135deg, rgba(0,212,255,0.07), rgba(0,102,255,0.04))',
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <div style={{
            background: 'linear-gradient(135deg,var(--cyan),var(--blue))',
            borderRadius: 10, padding: '8px 14px',
            fontWeight: 800, fontSize: '0.8rem', color: '#fff',
            whiteSpace: 'nowrap', flexShrink: 0,
          }}>🏆 Top Match</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
              {molecules[0].smiles}
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 6, flexWrap: 'wrap' }}>
              {[
                ['QED', molecules[0].qed.toFixed(3)],
                ['logP', molecules[0].logp.toFixed(3)],
                ['SA', molecules[0].sa_score.toFixed(2)],
                ['MW', molecules[0].molecular_weight.toFixed(1) + ' Da'],
              ].map(([l, v]) => (
                <span key={l} style={{ fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{l}: </span>
                  <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>{v}</span>
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{scoreLabel}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--cyan)', fontFamily: 'var(--font-space, sans-serif)' }}>
              {molecules[0].score.toFixed(3)}
            </div>
          </div>
        </div>
      )}

      {/* Molecule grid */}
      {molecules.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🧬</div>
          <div>No valid molecules generated. Try adjusting the parameters.</div>
        </div>
      ) : (
        <div className="molecule-grid">
          {molecules.map((mol, i) => (
            <MoleculeCard
              key={`${tab}-${i}-${mol.smiles}`}
              molecule={mol}
              rank={i + 1}
              scoreLabel={scoreLabel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
