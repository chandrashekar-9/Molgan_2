'use client';
import { useState } from 'react';

interface Row { range: string; label: string; status: 'green' | 'yellow' | 'red'; note?: string }
interface Section { id: string; icon: string; title: string; rows: Row[] }

const SECTIONS: Section[] = [
  {
    id: 'n_mol', icon: '🔢', title: 'Number of Molecules',
    rows: [
      { range: '1 – 20',   label: 'Fast generation. Recommended for testing.',     status: 'green'  },
      { range: '20 – 50',  label: 'Standard generation. Optimal balance.',          status: 'green'  },
      { range: '50 – 100', label: 'Large batch. May take longer.',                  status: 'yellow' },
      { range: '> 100',    label: 'Very large batch. High computation time.',       status: 'red'    },
    ],
  },
  {
    id: 'qed', icon: '💊', title: 'QED (Drug-likeness)',
    rows: [
      { range: '0.0 – 0.3', label: 'Poor drug-likeness.',    status: 'red'    },
      { range: '0.3 – 0.6', label: 'Moderate drug-likeness.', status: 'yellow' },
      { range: '0.6 – 0.7', label: 'Recommended for this model.', status: 'green',
        note: 'This model is trained on QM9. Maximum dataset QED ≈ 0.67.' },
    ],
  },
  {
    id: 'logp', icon: '⚖️', title: 'logP (Lipophilicity)',
    rows: [
      { range: '< 0',   label: 'Very hydrophilic.',           status: 'red'    },
      { range: '0 – 2', label: 'Hydrophilic.',                status: 'yellow' },
      { range: '2 – 3', label: 'Balanced (optimal).',         status: 'green'  },
      { range: '3 – 5', label: 'Lipophilic.',                 status: 'yellow' },
      { range: '> 5',   label: 'Highly lipophilic.',          status: 'red'    },
    ],
  },
  {
    id: 'temp', icon: '🌡️', title: 'Temperature',
    rows: [
      { range: '0.3 – 0.6', label: 'Conservative generation. Similar structures.', status: 'yellow' },
      { range: '0.6 – 1.0', label: 'Balanced generation. Recommended.',            status: 'green'  },
      { range: '1.0 – 1.5', label: 'High diversity. More varied outputs.',          status: 'yellow' },
      { range: '> 1.5',     label: 'Very random structures. Lower validity.',       status: 'red'    },
    ],
  },
  {
    id: 'sa', icon: '🏭', title: 'SA Score (Synthetic Accessibility)',
    rows: [
      { range: '1 – 2', label: 'Very easy to synthesise.',   status: 'green'  },
      { range: '2 – 4', label: 'Preferred range.',           status: 'green'  },
      { range: '4 – 6', label: 'Moderate difficulty.',       status: 'yellow' },
      { range: '6 – 8', label: 'Difficult to synthesise.',   status: 'red'    },
      { range: '> 8',   label: 'Very difficult.',            status: 'red'    },
    ],
  },
  {
    id: 'mw', icon: '⚛️', title: 'Molecular Weight',
    rows: [
      { range: '< 200 Da',      label: 'Small molecules.',          status: 'yellow' },
      { range: '200 – 500 Da',  label: 'Drug-like molecules.',      status: 'green'  },
      { range: '> 500 Da',      label: 'Large molecules (Lipinski violation).', status: 'red' },
    ],
  },
];

const STATUS_COLOR: Record<string, string> = {
  green: '#00ff88', yellow: '#ffb800', red: '#ff4466',
};
const STATUS_ICON: Record<string, string> = {
  green: '🟢', yellow: '🟡', red: '🔴',
};

function AccordionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="glass" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.2rem' }}>{section.icon}</span>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-space, sans-serif)' }}>
            {section.title}
          </span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s', color: 'var(--cyan)', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Content */}
      <div style={{
        maxHeight: open ? '600px' : '0',
        opacity: open ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.35s ease, opacity 0.3s ease',
      }}>
        <div style={{ padding: '0 20px 16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={th}>Range</th>
                <th style={th}>Description</th>
                <th style={{ ...th, textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {section.rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ ...td, fontFamily: 'monospace', color: STATUS_COLOR[row.status], fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {row.range}
                  </td>
                  <td style={{ ...td, color: 'var(--text-secondary)' }}>
                    {row.label}
                    {row.note && (
                      <div style={{ marginTop: 4, fontSize: '0.68rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        ℹ️ {row.note}
                      </div>
                    )}
                  </td>
                  <td style={{ ...td, textAlign: 'center', fontSize: '1rem' }}>
                    <span title={row.status.charAt(0).toUpperCase() + row.status.slice(1)}>
                      {STATUS_ICON[row.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: '8px 10px', textAlign: 'left',
  fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.08em',
};
const td: React.CSSProperties = {
  padding: '10px 10px', fontSize: '0.82rem',
};

export default function InputGuide() {
  const [allOpen, setAllOpen] = useState(true);
  return (
    <div id="guide">
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <span className="section-label">📖 Reference</span>
          <h2 style={{ fontFamily: 'var(--font-space, sans-serif)', fontWeight: 700, fontSize: '1.5rem', margin: '8px 0 6px' }}>
            Input Guide
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Recommended parameter ranges for optimal molecule generation
          </p>
        </div>
        <button
          onClick={() => setAllOpen(!allOpen)}
          style={{
            padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: '0.8rem',
          }}
        >
          {allOpen ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 18, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_ICON).map(([k, icon]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <span>{icon}</span>
            <span style={{ color: STATUS_COLOR[k], fontWeight: 600, textTransform: 'capitalize' }}>{k}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SECTIONS.map(s => <AccordionCard key={s.id} section={s} />)}
      </div>
    </div>
  );
}
