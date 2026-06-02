import sys
import torch
import torch.nn as nn
from torch.utils.data import Dataset
import pandas as pd
import numpy as np
from rdkit import Chem
from rdkit.Chem import Draw, Descriptors, QED
import os

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
    'df': pd.DataFrame({'smiles': [], 'qed': [], 'logp': []})
}

try:
    with open("model.py", "r", encoding="utf-8") as f:
        exec(f.read(), model_globals)
    print("SUCCESS: model.py executed perfectly!")
except Exception as e:
    import traceback
    traceback.print_exc()
