'use client';
import { useState } from 'react';
import type { GenerateRequest } from '@/lib/types';

interface Props {
  onGenerate: (req: GenerateRequest) => void;
  loading: boolean;
}

const DEFAULT: GenerateRequest = {
  n_molecules: 20,
  target_qed: 0.5,
  target_logp: 2.0,
  temperature: 0.8,
};

export default function InputPanel({ onGenerate, loading }: Props) {
  const [form, setForm] = useState<GenerateRequest>(DEFAULT);
  const [nMolStr, setNMolStr] = useState(String(DEFAULT.n_molecules));
  const [logpStr, setLogpStr] = useState(String(DEFAULT.target_logp));
  const [tempStr, setTempStr] = useState(String(DEFAULT.temperature));

  const set = <K extends keyof GenerateRequest>(k: K, v: GenerateRequest[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(form);
  };

  return (
    <div className="glass" style={{ padding: '28px 28px 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <span className="section-label">⚙️ Parameters</span>
        <h2 style={{
          fontFamily: 'var(--font-space, sans-serif)', fontWeight: 700,
          fontSize: '1.25rem', margin: '8px 0 4px',
        }}>Input Configuration</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
          Set generation parameters and targets
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Number of Molecules */}
        <Field label="Number of Molecules" hint="1 – 500">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={() => set('n_molecules', Math.max(1, form.n_molecules - 1))}
              style={stepBtn}>&minus;</button>
            <input
              id="n-molecules"
              type="text"
              inputMode="numeric"
              value={nMolStr}
              onChange={e => {
                const v = e.target.value;
                setNMolStr(v);
                const n = parseInt(v);
                if (!isNaN(n)) set('n_molecules', Math.max(1, Math.min(500, n)));
              }}
              onBlur={() => {
                const n = parseInt(nMolStr);
                const val = isNaN(n) || n < 1 ? 1 : Math.min(500, n);
                set('n_molecules', val);
                setNMolStr(String(val));
              }}
              className="molgan-input" style={{ textAlign: 'center', flex: 1 }}
            />
            <button type="button" onClick={() => set('n_molecules', Math.min(500, form.n_molecules + 1))}
              style={stepBtn}>+</button>
          </div>
        </Field>

        {/* Target QED */}
        <Field label={`Target QED: ${form.target_qed.toFixed(2)}`} hint="Slider: 0.0 – 0.7">
          <input
            id="target-qed"
            type="range" min={0} max={0.7} step={0.01}
            value={form.target_qed}
            onChange={e => set('target_qed', parseFloat(e.target.value))}
            style={{ background: `linear-gradient(to right, var(--cyan) ${(form.target_qed / 0.7) * 100}%, rgba(255,255,255,0.1) 0%)` }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <span>0.0 Poor</span><span>0.35 Moderate</span><span>0.7 ★ Best</span>
          </div>
        </Field>

        {/* Target logP */}
        <Field label="Target logP" hint="e.g. 2.0 or -1.5">
          <input
            id="target-logp"
            type="text"
            inputMode="decimal"
            value={logpStr}
            onChange={e => {
              const v = e.target.value;
              setLogpStr(v);
              if (v === '-' || v === '' || v === '.') return;
              const n = parseFloat(v);
              if (!isNaN(n)) set('target_logp', n);
            }}
            onBlur={() => {
              const n = parseFloat(logpStr);
              const val = isNaN(n) ? 0 : n;
              set('target_logp', val);
              setLogpStr(String(val));
            }}
            className="molgan-input"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <span>{'<0 Hydrophilic'}</span><span>2-3 Optimal</span><span>{'>5 Lipophilic'}</span>
          </div>
        </Field>

        {/* Temperature */}
        <Field label="Temperature" hint="optional · default 0.8">
          <input
            id="temperature"
            type="text"
            inputMode="decimal"
            value={tempStr}
            onChange={e => {
              const v = e.target.value;
              setTempStr(v);
              if (v === '' || v === '.') return;
              const n = parseFloat(v);
              if (!isNaN(n)) set('temperature', n);
            }}
            onBlur={() => {
              const n = parseFloat(tempStr);
              const val = isNaN(n) || n <= 0 ? 0.8 : n;
              set('temperature', val);
              setTempStr(String(val));
            }}
            className="molgan-input"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
            <span>0.3 Conservative</span><span>0.8 Balanced</span><span>1.5+ Diverse</span>
          </div>
        </Field>

        {/* Submit */}
        <button type="submit" className="btn-neon" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '0.95rem', marginTop: 4 }}>
          {loading ? (
            <>
              <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Generating…
            </>
          ) : (
            <>⚗️ Generate Molecules</>
          )}
        </button>

        {/* Reset */}
        <button type="button" onClick={() => setForm(DEFAULT)}
          style={{
            background: 'none', border: '1px solid var(--border)', borderRadius: 8,
            color: 'var(--text-muted)', padding: '8px', fontSize: '0.8rem', cursor: 'pointer',
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
        >
          Reset Defaults
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const stepBtn: React.CSSProperties = {
  width: 36, height: 36,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '1.1rem',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
};

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</label>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{hint}</span>
      </div>
      {children}
    </div>
  );
}
