'use client';


const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const GLOSSARY = [
  {
    term: 'QM9 Dataset',
    icon: '📊',
    def: 'A benchmark dataset of ~134,000 small organic molecules with up to 9 heavy atoms (C, N, O, F). Provides ground-truth geometries and quantum-chemical properties including QED and logP.',
  },
  {
    term: 'Conditional MolGAN',
    icon: '🧠',
    def: 'A generative adversarial network conditioned on molecular property targets (QED, logP). The generator learns to produce molecules matching the user-specified property vector.',
  },
  {
    term: 'Condition Vector',
    icon: '🎯',
    def: 'A 2-dimensional vector [QED_norm, logP_norm] concatenated with latent noise z and fed to the generator. Steers generation toward target properties.',
  },
  {
    term: 'Generator',
    icon: '⚡',
    def: 'A 3-layer MLP (Z+2 → 128 → 128 → outputs) producing a node-feature matrix (atom types via softmax) and an adjacency matrix (edge probabilities via sigmoid), symmetrised for undirected graphs.',
  },
  {
    term: 'Discriminator (WGAN-GP Critic)',
    icon: '🔍',
    def: 'Critic network trained with Wasserstein loss + gradient penalty (λ=10). Scores molecule realness from flattened node + adjacency + condition inputs. No sigmoid — outputs raw scores.',
  },
  {
    term: 'Reinforcement Learning Reward',
    icon: '🏆',
    def: 'Combined reward = property_reward + 0.2 × diversity_reward − 0.3 × connectivity_penalty. Guides generator toward target properties while maintaining structural diversity and connectivity.',
  },
  {
    term: 'Diversity Reward',
    icon: '🌈',
    def: 'Ratio of unique SMILES to total batch SMILES. Encourages the model to generate varied molecular structures rather than repeating the same molecule.',
  },
  {
    term: 'Connectivity Penalty',
    icon: '🔗',
    def: 'Penalises molecules with disconnected fragments (multiple components). Returns −0.5 if fragments > 1, else 0. Ensures chemically sensible single-fragment structures.',
  },
  {
    term: 'QED',
    icon: '💊',
    def: 'Quantitative Estimate of Drug-likeness ∈ [0,1]. Composite score integrating MW, logP, HBD, HBA, PSA, ROTB, AROM, and ALERTS. Higher = more drug-like.',
  },
  {
    term: 'logP',
    icon: '📈',
    def: 'Wildman-Crippen octanol–water partition coefficient. Measures lipophilicity. Optimal range 2–3 for oral drug candidates (Lipinski Rule of 5: logP ≤ 5).',
  },
];

export default function ArchitecturePage() {

  const archUrl = `${API}/architecture/architecture.png`;

  return (
    <div id="architecture">
      <div style={{ marginBottom: 28 }}>
        <span className="section-label">🏗️ Architecture</span>
        <h2 style={{ fontFamily: 'var(--font-space, sans-serif)', fontWeight: 700, fontSize: '1.5rem', margin: '8px 0 6px' }}>
          Model Architecture
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Conditional WGAN-GP with Reinforcement Learning reward shaping
        </p>
      </div>

      {/* Image viewer */}
      <div className="glass" style={{ padding: '20px', marginBottom: 28 }}>
        <div style={{
          overflow: 'hidden', borderRadius: 10,
          background: 'rgba(255,255,255,0.97)',
          display: 'flex', justifyContent: 'center',
        }}>
          <img
            src={archUrl}
            alt="Conditional MolGAN Architecture Diagram"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            style={{
              display: 'block',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>
      </div>

      {/* Glossary */}
      <div style={{ marginBottom: 20 }}>
        <span className="section-label">📚 Glossary</span>
        <h3 style={{ fontFamily: 'var(--font-space, sans-serif)', fontWeight: 700, fontSize: '1.1rem', margin: '8px 0 16px' }}>
          Component Explanations
        </h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {GLOSSARY.map(g => (
          <div key={g.term} className="glass glass-hover" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>{g.icon}</span>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--cyan)' }}>{g.term}</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              {g.def}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const archBtn: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-secondary)',
  cursor: 'pointer', fontSize: '0.78rem',
  transition: 'all 0.2s',
};
