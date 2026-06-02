'use client';
import type { GenerationMetrics } from '@/lib/types';

interface Props { metrics: GenerationMetrics }

const colorFor = (v: number) =>
  v >= 0.7 ? '#00ff88' : v >= 0.4 ? '#ffb800' : '#ff4466';

function MetricCard({ label, value, icon, description }: {
  label: string; value: number; icon: string; description: string;
}) {
  const pct = Math.round(value * 100);
  const color = colorFor(value);
  const circ = 2 * Math.PI * 30; // r=30
  const dash = circ * value;

  return (
    <div className="glass glass-hover" style={{ padding: '22px 20px', textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 14px' }}>
        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="40" cy="40" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
          <circle
            cx="40" cy="40" r="30" fill="none"
            stroke={color} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: '0.65rem' }}>{icon}</span>
          <span style={{ fontSize: '1rem', fontWeight: 800, color, lineHeight: 1 }}>{pct}%</span>
        </div>
      </div>

      <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{description}</div>

      <div className="progress-track" style={{ marginTop: 12 }}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function MetricsSection({ metrics }: Props) {
  const cards = [
    {
      label: 'Validity',
      value: metrics.validity,
      icon: '✅',
      description: 'Valid / total generated',
    },
    {
      label: 'Uniqueness',
      value: metrics.uniqueness,
      icon: '🔑',
      description: 'Unique among valid',
    },
    {
      label: 'Novelty',
      value: metrics.novelty,
      icon: '🆕',
      description: 'Not in QM9 training set',
    },
    {
      label: 'Connectivity',
      value: metrics.connectivity,
      icon: '🔗',
      description: 'Single connected fragment',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <span className="section-label">📊 Metrics</span>
          <h2 style={{ fontFamily: 'var(--font-space, sans-serif)', fontWeight: 700, fontSize: '1.2rem', margin: '6px 0 0' }}>
            Generation Quality
          </h2>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {metrics.n_valid} valid / {metrics.n_total} requested
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {cards.map(c => <MetricCard key={c.label} {...c} />)}
      </div>

      {/* Color legend */}
      <div style={{ marginTop: 14, display: 'flex', gap: 18, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        {[['#00ff88','≥ 70% Excellent'],['#ffb800','40–70% Good'],['#ff4466','< 40% Low']].map(([c,l]) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: c as string, display: 'inline-block' }}/>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}
