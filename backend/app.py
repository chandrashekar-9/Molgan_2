"""
Conditional MolGAN — FastAPI Backend
"""

import csv
import logging
from pathlib import Path
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("molgan")

# ── Dynamic Model Import ────────────────────────────────────────────────────────
import sys
import os
import torch
import torch.nn as nn
from torch.utils.data import Dataset
import pandas as pd
import numpy as np
from rdkit import Chem
from rdkit.Chem import Draw, Descriptors, QED, AllChem
import io
import base64
from rdkit.Chem.Draw import rdMolDraw2D

model_globals = {
    'torch': torch,
    'nn': nn,
    'Dataset': Dataset,
    'pd': pd,
    'np': np,
    'Chem': Chem,
    'Draw': Draw,
    'Descriptors': Descriptors,
    'QED': QED,
    'os': os,
    'device': torch.device("cuda" if torch.cuda.is_available() else "cpu"),
    'MAX_ATOMS': 9,
    'ATOM_TYPES': ['C', 'N', 'O', 'F'],
    'NUM_ATOM_FEATURES': 4,
    'Z_DIM': 32,
    'HIDDEN_DIM': 128,
    'COND_DIM': 2,
    'DEFAULT_TEMPERATURE': 0.8,
    'df': pd.DataFrame({'smiles': [], 'qed': [], 'logp': []})
}

try:
    with open(os.path.join(os.path.dirname(__file__), "model.py"), "r", encoding="utf-8") as f:
        exec(f.read(), model_globals)
except Exception as e:
    logger.error(f"Failed to execute model.py: {e}")
    raise e

device = model_globals['device']
DEFAULT_TEMPERATURE = model_globals['DEFAULT_TEMPERATURE']
generate_molecules = model_globals['generate_molecules']
rank_by_combined = model_globals['rank_by_combined']
rank_by_qed = model_globals['rank_by_qed']
rank_by_logp = model_globals['rank_by_logp']
compute_metrics = model_globals['compute_metrics']
calculate_qed = model_globals['calculate_qed']
calculate_logp = model_globals['calculate_logp']
calculate_sa_score = model_globals['calculate_sa_score']
calculate_molecular_weight = model_globals['calculate_molecular_weight']

WEIGHTS_PATH = os.path.join(os.path.dirname(__file__), "MOLGAN_WEIGHTS_50.pth")
if os.path.exists(WEIGHTS_PATH):
    state = torch.load(WEIGHTS_PATH, map_location=device, weights_only=False)
    if isinstance(state, dict) and 'generator' in state:
        model_globals['generator'].load_state_dict(state['generator'])
    else:
        model_globals['generator'].load_state_dict(state)
    logger.info(f"Loaded generator weights from {WEIGHTS_PATH}")
else:
    logger.warning(f"Weights not found at {WEIGHTS_PATH}")

model_globals['generator'].eval()

def mol_to_base64_image(mol, size: tuple = (280, 280)) -> str:
    try:
        drawer = rdMolDraw2D.MolDraw2DSVG(size[0], size[1])
        drawer.drawOptions().addStereoAnnotation = False
        drawer.drawOptions().padding = 0.15
        drawer.DrawMolecule(mol)
        drawer.FinishDrawing()
        svg = drawer.GetDrawingText()
        b64 = base64.b64encode(svg.encode()).decode()
        return f"data:image/svg+xml;base64,{b64}"
    except Exception:
        try:
            img = Draw.MolToImage(mol, size=size)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            b64 = base64.b64encode(buf.getvalue()).decode()
            return f"data:image/png;base64,{b64}"
        except Exception:
            return ""

def smiles_to_sdf(smiles: str) -> str:
    from rdkit.Chem import rdmolfiles
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        raise ValueError(f"Invalid SMILES: {smiles}")
    mol = Chem.AddHs(mol)
    params = AllChem.ETKDGv3()
    params.randomSeed = 42
    result = AllChem.EmbedMolecule(mol, params)
    if result == -1:
        AllChem.EmbedMolecule(mol, randomSeed=42)
    try:
        AllChem.MMFFOptimizeMolecule(mol)
    except Exception:
        pass
    sdf = rdmolfiles.MolToMolBlock(mol)
    return sdf

logger.info(f"Execution device: {device}")

# ── Load QM9 SMILES (novelty reference set) ──────────────────────────────────
QM9_PATH = Path(__file__).parent / "qm9_smiles.csv"
training_smiles_list: list = []

if QM9_PATH.exists():
    with open(QM9_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        seen: set = set()
        for row in reader:
            smi = row.get("smiles", "").strip()
            if smi:
                seen.add(smi)
    training_smiles_list = list(seen)
    logger.info(f"QM9 reference set: {len(training_smiles_list):,} SMILES loaded for novelty.")
else:
    logger.warning(f"qm9_smiles.csv not found at {QM9_PATH}. Novelty may be 100%.")

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Conditional MolGAN API",
    description="AI-Powered Molecular Generation using Conditional GANs and Reinforcement Learning",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve architecture image
ARCH_DIR = Path(__file__).parent.parent / "architecture"
if ARCH_DIR.exists():
    app.mount("/architecture", StaticFiles(directory=str(ARCH_DIR)), name="architecture")
    logger.info(f"Serving architecture images from {ARCH_DIR}")

# ── Pydantic schemas ──────────────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    n_molecules: int = Field(default=20, ge=1, le=500)
    target_qed: float = Field(default=0.5, ge=0.0, le=1.0)
    target_logp: float = Field(default=2.0)
    temperature: float = Field(default=DEFAULT_TEMPERATURE, gt=0.0)


class MoleculeResult(BaseModel):
    smiles: str
    qed: float
    logp: float
    sa_score: float
    molecular_weight: float
    image_b64: str
    score: float


class GenerateResponse(BaseModel):
    combined_ranking: List[MoleculeResult]
    qed_ranking: List[MoleculeResult]
    logp_ranking: List[MoleculeResult]
    metrics: dict


class ThreeDRequest(BaseModel):
    smiles: str


# ── Endpoints ─────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "device": str(device)}


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    logger.info(
        f"Generate | n={req.n_molecules} | QED={req.target_qed} "
        f"| logP={req.target_logp} | T={req.temperature}"
    )

    try:
        valid_mols, valid_smiles = generate_molecules(
            req.n_molecules, req.target_qed, req.target_logp, req.temperature
        )
    except Exception as exc:
        logger.error(f"Generation failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))

    # Compute metrics first (uses model.py logic with QM9 reference)
    metrics = compute_metrics(valid_smiles, training_smiles_list, req.n_molecules)

    if not valid_mols:
        return GenerateResponse(
            combined_ranking=[], qed_ranking=[], logp_ranking=[], metrics=metrics
        )

    # Build property cache to avoid re-computing per ranking view
    prop_cache: dict = {}
    for smi, mol in zip(valid_smiles, valid_mols):
        prop_cache[smi] = {
            "qed":    calculate_qed(mol),
            "logp":   calculate_logp(mol),
            "sa":     calculate_sa_score(mol),
            "mw":     calculate_molecular_weight(mol),
            "image":  mol_to_base64_image(mol),
        }

    def build_list(ranked: list) -> List[MoleculeResult]:
        out = []
        for entry in ranked:
            score, smi = entry[0], entry[1]
            p = prop_cache.get(smi, {})
            out.append(MoleculeResult(
                smiles=smi,
                qed=round(p.get("qed", 0.0), 4),
                logp=round(p.get("logp", 0.0), 4),
                sa_score=round(p.get("sa", 0.0), 4),
                molecular_weight=round(p.get("mw", 0.0), 3),
                image_b64=p.get("image", ""),
                score=round(score, 6),
            ))
        return out

    combined = rank_by_combined(valid_smiles, valid_mols, req.target_qed, req.target_logp)
    by_qed   = rank_by_qed(valid_smiles, valid_mols, req.target_qed)
    by_logp  = rank_by_logp(valid_smiles, valid_mols, req.target_logp)

    return GenerateResponse(
        combined_ranking=build_list(combined),
        qed_ranking=build_list(by_qed),
        logp_ranking=build_list(by_logp),
        metrics=metrics,
    )


@app.post("/molecule/3d")
def molecule_3d(req: ThreeDRequest):
    logger.info(f"3D request for: {req.smiles[:60]}")
    try:
        sdf = smiles_to_sdf(req.smiles)
        return {"sdf": sdf, "smiles": req.smiles}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error(f"3D generation failed: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/architecture")
def architecture_info():
    return {
        "image_url": "/architecture/architecture.png",
        "filename": "architecture.png",
    }
