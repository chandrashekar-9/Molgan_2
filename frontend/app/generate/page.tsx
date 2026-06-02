'use client';
import { useState, useRef } from 'react';
import InputPanel from '@/components/InputPanel';
import MetricsSection from '@/components/MetricsSection';
import ResultsSection from '@/components/ResultsSection';
import type { GenerateRequest } from '@/lib/types';
import { generateMolecules } from '@/lib/api';
import { useAppStore } from '@/lib/store';

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { result, setResult } = useAppStore();
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async (req: GenerateRequest) => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateMolecules(req);
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .generate-layout {
          display: flex;
          min-height: 100vh;
          padding-top: 64px; /* navbar height */
        }

        /* ── Fixed left sidebar ───────────────────────── */
        .sidebar-panel {
          position: fixed;
          top: 64px;           /* below navbar */
          left: 0;
          width: 25%;
          height: calc(100vh - 64px);
          overflow-y: auto;
          background: rgba(5, 10, 20, 0.98);
          border-right: 1px solid var(--border);
          z-index: 10;
          padding: 28px 20px;
          box-sizing: border-box;
        }

        /* ── Scrollable main content ──────────────────── */
        .main-content {
          margin-left: 25%;
          width: 75%;
          min-height: calc(100vh - 64px);
          padding: 36px 32px 80px;
          box-sizing: border-box;
        }

        @media (max-width: 900px) {
          .sidebar-panel {
            position: static;
            width: 100%;
            height: auto;
            border-right: none;
            border-bottom: 1px solid var(--border);
          }
          .generate-layout { flex-direction: column; }
          .main-content { margin-left: 0; width: 100%; }
        }
      `}</style>

      <div className="generate-layout">
        {/* ── Fixed sidebar ───────────────────────────── */}
        <aside className="sidebar-panel">
          <InputPanel onGenerate={handleGenerate} loading={loading} />
        </aside>

        {/* ── Scrollable results area ──────────────────── */}
        <main className="main-content">

          {/* Error */}
          {error && (
            <div style={{
              padding: '16px 20px', background: 'rgba(255,68,102,0.08)',
              border: '1px solid rgba(255,68,102,0.35)', borderRadius: 12,
              color: '#ff4466', fontSize: '0.88rem',
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
            }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Generation Error</div>
                <div style={{ opacity: 0.85 }}>{error}</div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && !error && (
            <div className="glass" style={{
              padding: '80px 40px', textAlign: 'center',
              borderStyle: 'dashed', borderColor: 'var(--border)',
            }}>
              <div style={{ fontSize: '4rem', marginBottom: 20 }}>🧬</div>
              <h3 style={{
                fontFamily: 'var(--font-space, sans-serif)',
                fontWeight: 700, fontSize: '1.3rem', marginBottom: 10,
              }}>Ready to Generate</h3>
              <p style={{
                color: 'var(--text-muted)', fontSize: '0.9rem',
                maxWidth: 340, margin: '0 auto', lineHeight: 1.7,
              }}>
                Configure parameters in the left panel and click <strong style={{ color: 'var(--cyan)' }}>Generate Molecules</strong> to start.
              </p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="glass" style={{ padding: '80px 40px', textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, margin: '0 auto 24px',
                border: '4px solid var(--cyan-dim)', borderTopColor: 'var(--cyan)',
                borderRadius: '50%', animation: 'spinMain 0.8s linear infinite',
              }} />
              <h3 style={{
                fontFamily: 'var(--font-space, sans-serif)',
                fontWeight: 700, fontSize: '1.2rem', marginBottom: 8,
              }}>Generating Molecules…</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Running inference on the GAN model</p>
              <style>{`@keyframes spinMain { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Metrics */}
          {result && !loading && <MetricsSection metrics={result.metrics} />}

          {/* Results */}
          {result && !loading && result.combined_ranking.length > 0 && (
            <div ref={resultsRef} style={{ marginTop: 28 }}>
              <ResultsSection data={result} />
            </div>
          )}

          {/* No valid molecules */}
          {result && !loading && result.combined_ranking.length === 0 && (
            <div className="glass" style={{ padding: '48px', textAlign: 'center', marginTop: 28 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔬</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>No Valid Molecules</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                0 of {result.metrics.n_total} molecules were chemically valid. Try adjusting parameters.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
