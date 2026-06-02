import type { GenerateRequest, GenerateResponse, ThreeDResponse } from './types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Request failed');
  }
  return res.json();
}

export async function generateMolecules(req: GenerateRequest): Promise<GenerateResponse> {
  return post<GenerateResponse>('/generate', req);
}

export async function get3DStructure(smiles: string): Promise<ThreeDResponse> {
  return post<ThreeDResponse>('/molecule/3d', { smiles });
}

export function downloadCSV(molecules: GenerateResponse['combined_ranking'], filename = 'molecules.csv') {
  const header = 'SMILES,QED,logP,SA Score,Molecular Weight (Da)';
  const rows = molecules.map(m =>
    `"${m.smiles}",${m.qed},${m.logp},${m.sa_score},${m.molecular_weight}`
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
