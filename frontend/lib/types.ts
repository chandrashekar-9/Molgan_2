// ── API request / response types ─────────────────────────────────────────────

export interface GenerateRequest {
  n_molecules: number;
  target_qed: number;
  target_logp: number;
  temperature: number;
}

export interface MoleculeResult {
  smiles: string;
  qed: number;
  logp: number;
  sa_score: number;
  molecular_weight: number;
  image_b64: string;
  score: number;
}

export interface GenerationMetrics {
  validity: number;
  uniqueness: number;
  novelty: number;
  connectivity: number;
  n_valid: number;
  n_total: number;
}

export interface GenerateResponse {
  combined_ranking: MoleculeResult[];
  qed_ranking: MoleculeResult[];
  logp_ranking: MoleculeResult[];
  metrics: GenerationMetrics;
}

export interface ThreeDResponse {
  sdf: string;
  smiles: string;
}

export type RankingTab = 'combined' | 'qed' | 'logp';
