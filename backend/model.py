def normalize_inputs(qed: float, logp: float):
    """Normalize QED to [0,1] and logP to [0,1] via (logp+5)/10."""
    qed  = max(0.0, min(1.0, qed))
    logp = (logp + 5) / 10.0
    logp = max(0.0, min(1.0, logp))
    return qed, logp

def denormalize_logp(logp_norm: float) -> float:
    """Inverse of the logP normalization."""
    return logp_norm * 10.0 - 5.0

ATOM_TO_IDX = {atom: idx for idx, atom in enumerate(ATOM_TYPES)}
def smiles_to_graph(smiles):

    mol = Chem.MolFromSmiles(smiles)

    if mol is None:
        return None, None

    # -------- STRICT SIZE CHECK --------

    if mol.GetNumHeavyAtoms() > MAX_ATOMS:
        return None, None

    num_atoms = mol.GetNumAtoms()

    if num_atoms > MAX_ATOMS:
        return None, None

    # -------- NODE MATRIX --------

    nodes = np.zeros(
        (MAX_ATOMS, len(ATOM_TO_IDX)),
        dtype=np.float32
    )

    for i, atom in enumerate(mol.GetAtoms()):

        # CRITICAL SAFETY
        if i >= MAX_ATOMS:
            break

        symbol = atom.GetSymbol()

        if symbol in ATOM_TO_IDX:
            nodes[i, ATOM_TO_IDX[symbol]] = 1.0

    # -------- ADJACENCY MATRIX --------

    adj = np.zeros(
        (MAX_ATOMS, MAX_ATOMS),
        dtype=np.float32
    )

    for bond in mol.GetBonds():

        i = bond.GetBeginAtomIdx()
        j = bond.GetEndAtomIdx()

        # CRITICAL SAFETY
        if i >= MAX_ATOMS or j >= MAX_ATOMS:
            continue

        adj[i, j] = 1.0
        adj[j, i] = 1.0

    return adj, nodes
class MolDataset(Dataset):
    """
    PyTorch Dataset wrapping the filtered QM9 DataFrame.

    Each item returns:
        adj   (MAX_ATOMS, MAX_ATOMS)         — adjacency matrix tensor
        nodes (MAX_ATOMS, NUM_ATOM_FEATURES) — node features tensor
        cond  (COND_DIM,)                    — normalised [qed, logp]
    """

    def __init__(self, dataframe: pd.DataFrame):
        records = []
        for _, row in dataframe.iterrows():
            adj, nodes = smiles_to_graph(row['smiles'])
            if adj is None:
                continue
            qed_n, logp_n = normalize_inputs(row['qed'], row['logp'])
            records.append({
                'adj'   : adj,
                'nodes' : nodes,
                'cond'  : np.array([qed_n, logp_n], dtype=np.float32),
                'smiles': row['smiles'],
            })
        self.records = records
        print(f"MolDataset created with {len(self.records)} valid molecules.")

    def __len__(self):
        return len(self.records)

    def __getitem__(self, idx):
        r = self.records[idx]
        return (
            torch.tensor(r['adj'],   dtype=torch.float32),
            torch.tensor(r['nodes'], dtype=torch.float32),
            torch.tensor(r['cond'],  dtype=torch.float32),
        )


mol_dataset = MolDataset(df)
class Generator(nn.Module):
    """
    Conditional generator.

    Input  : z (B, Z_DIM)  + cond (B, COND_DIM)
    Output : nodes (B, MAX_ATOMS, NUM_ATOM_FEATURES)
             adj   (B, MAX_ATOMS, MAX_ATOMS)
    """

    def __init__(self):
        super().__init__()
        in_dim  = Z_DIM + COND_DIM
        out_nodes = MAX_ATOMS * NUM_ATOM_FEATURES
        out_adj   = MAX_ATOMS * MAX_ATOMS

        self.shared = nn.Sequential(
            nn.Linear(in_dim, HIDDEN_DIM),
            nn.ReLU(),
            nn.Linear(HIDDEN_DIM, HIDDEN_DIM),
            nn.ReLU(),
        )
        self.node_head = nn.Linear(HIDDEN_DIM, out_nodes)
        self.adj_head  = nn.Linear(HIDDEN_DIM, out_adj)

    def forward(self, z, cond):
        x     = torch.cat([z, cond], dim=-1)          # (B, Z+C)
        h     = self.shared(x)                         # (B, H)
        nodes = self.node_head(h).view(-1, MAX_ATOMS, NUM_ATOM_FEATURES)
        nodes = torch.softmax(nodes, dim=-1)           # one-hot-like probs
        adj   = self.adj_head(h).view(-1, MAX_ATOMS, MAX_ATOMS)
        adj   = torch.sigmoid(adj)                     # ∈ (0,1) edge probs
        # Symmetrise to ensure undirected graph
        adj   = (adj + adj.transpose(1, 2)) / 2.0
        return nodes, adj


generator = Generator().to(device)

class Discriminator(nn.Module):
    """
    Conditional WGAN discriminator (critic).

    No sigmoid output — raw score for Wasserstein distance.

    Input  : nodes (B, MAX_ATOMS, NUM_ATOM_FEATURES)
             adj   (B, MAX_ATOMS, MAX_ATOMS)
             cond  (B, COND_DIM)
    Output : score (B, 1)
    """

    def __init__(self):
        super().__init__()
        flat_nodes = MAX_ATOMS * NUM_ATOM_FEATURES
        flat_adj   = MAX_ATOMS * MAX_ATOMS
        in_dim     = flat_nodes + flat_adj + COND_DIM

        self.net = nn.Sequential(
            nn.Linear(in_dim, HIDDEN_DIM),
            nn.LeakyReLU(0.2),
            nn.Linear(HIDDEN_DIM, HIDDEN_DIM),
            nn.LeakyReLU(0.2),
            nn.Linear(HIDDEN_DIM, 1),
            # ── NO sigmoid — WGAN-GP requires raw scores ──
        )

    def forward(self, nodes, adj, cond):
        flat = torch.cat([
            nodes.view(nodes.size(0), -1),
            adj.view(adj.size(0),   -1),
            cond,
        ], dim=-1)
        return self.net(flat)


discriminator = Discriminator().to(device)

def compute_gradient_penalty(discriminator, real_nodes, real_adj,
                             fake_nodes, fake_adj, cond):
    """

    WGAN-GP gradient penalty.

    Interpolates between real and fake samples and penalises
    the gradient norm deviation from 1.
    """
    B = real_nodes.size(0)
    alpha = torch.rand(B, 1, 1, device=device)   # broadcast over (MAX_ATOMS, feat)

    # Interpolated nodes
    interp_nodes = (alpha * real_nodes +
                    (1 - alpha) * fake_nodes).requires_grad_(True)

    alpha_adj = alpha.view(B, 1, 1)
    interp_adj = (alpha_adj * real_adj +
                  (1 - alpha_adj) * fake_adj).requires_grad_(True)

    d_interp = discriminator(interp_nodes, interp_adj, cond)

    gradients = torch.autograd.grad(
        outputs    = d_interp,
        inputs     = [interp_nodes, interp_adj],
        grad_outputs = torch.ones_like(d_interp),
        create_graph = True,
        retain_graph = True,
    )

    grad_nodes = gradients[0].view(B, -1)
    grad_adj   = gradients[1].view(B, -1)
    grad_norm  = torch.cat([grad_nodes, grad_adj], dim=-1).norm(2, dim=1)
    penalty    = ((grad_norm - 1) ** 2).mean()
    return penalty
def diversity_reward(smiles_list: list) -> float:
    """
    Ratio of unique SMILES to total SMILES in the batch.

    Returns a value in [0, 1].  Higher = more diverse batch.
    """
    if not smiles_list:
        return 0.0
    unique = len(set(smiles_list))
    total  = len(smiles_list)
    return unique / total

try:
    from rdkit.Chem import RDConfig
    import sys
    sys.path.append(os.path.join(RDConfig.RDContribDir, 'SA_Score'))
    import sascorer
    SA_AVAILABLE = True
except Exception:
    SA_AVAILABLE = False
    print("SA Score module not available — will return 0.0 as placeholder.")


def calculate_qed(mol) -> float:
    """Drug-likeness score ∈ [0, 1]."""
    try:
        return float(QED.qed(mol))
    except Exception:
        return 0.0


def calculate_logp(mol) -> float:
    """Wildman-Crippen LogP."""
    try:
        return float(Descriptors.MolLogP(mol))
    except Exception:
        return 0.0


def calculate_sa_score(mol) -> float:
    """Synthetic accessibility score ∈ [1, 10] (lower = easier to synthesise)."""
    if not SA_AVAILABLE:
        return 0.0
    try:
        return float(sascorer.calculateScore(mol))
    except Exception:
        return 0.0


def calculate_molecular_weight(mol) -> float:
    """Exact molecular weight in Da."""
    try:
        return float(Descriptors.ExactMolWt(mol))
    except Exception:
        return 0.0

def connectivity_penalty(mol):

    fragments = Chem.GetMolFrags(mol)

    if len(fragments) > 1:
        return -0.5   # recommended value

    return 0.0
def compute_rl_reward(
        smiles_list: list,
        target_qed_batch,
        target_logp_batch
) -> float:

    if not smiles_list:
        return 0.0

    property_rewards = []
    connectivity_penalties = []
    valid_smiles = []

    for smi, target_qed, target_logp in zip(
        smiles_list,
        target_qed_batch,
        target_logp_batch):

        mol = Chem.MolFromSmiles(smi)

        if mol is None:
            continue

        valid_smiles.append(smi)

        pred_qed  = calculate_qed(mol)
        pred_logp = calculate_logp(mol)
        target_logp = denormalize_logp(target_logp)
        pr = (
            (1.0 - abs(pred_qed  - target_qed))
            +
            (1.0 - abs(pred_logp - target_logp))
        )

        property_rewards.append(pr)

        # NEW — connectivity penalty
        penalty = connectivity_penalty(mol)

        connectivity_penalties.append(penalty)

    if not property_rewards:
        return 0.0

    mean_prop_reward = np.mean(property_rewards)

    div_reward = diversity_reward(valid_smiles)

    mean_connectivity_penalty = np.mean(connectivity_penalties)

    return (
        mean_prop_reward
        + 0.2 * div_reward
        -0.3* mean_connectivity_penalty
    )
def save_checkpoint(epoch: int,
                    generator, discriminator,
                    opt_g, opt_d,
                    losses: dict):
    """Save model + optimiser states; keeps the last two checkpoints."""
    path = os.path.join("/content/checkpoints", f"ckpt_epoch_{epoch:04d}.pt")
    torch.save({
        'epoch'       : epoch,
        'generator'   : generator.state_dict(),
        'discriminator': discriminator.state_dict(),
        'opt_g'       : opt_g.state_dict(),
        'opt_d'       : opt_d.state_dict(),
        'losses'      : losses,
    }, path)
    print(f"  [CKPT] Saved -> {path}")

    # Keep only the two most recent checkpoints to save disk space
    all_ckpts = sorted([
        f for f in os.listdir("/content/checkpoints") if f.startswith("ckpt_epoch_")
    ])
    for old in all_ckpts[:-2]:
        os.remove(os.path.join("/content/checkpoints", old))


def load_latest_checkpoint(generator, discriminator, opt_g, opt_d):
    """Resume from the most recent checkpoint if one exists."""
    all_ckpts = sorted([
        f for f in os.listdir("/content/checkpoints") if f.startswith("ckpt_epoch_")
    ])
    if not all_ckpts:
        print("No checkpoint found — starting from scratch.")
        return 0, {}

    path  = os.path.join("/content/checkpoints", all_ckpts[-1])
    ckpt  = torch.load(path, map_location=device,weights_only=False)
    generator.load_state_dict(ckpt['generator'])
    discriminator.load_state_dict(ckpt['discriminator'])
    opt_g.load_state_dict(ckpt['opt_g'])
    opt_d.load_state_dict(ckpt['opt_d'])
    print(f"  [CKPT] Resumed from epoch {ckpt['epoch']} ({path})")
    return ckpt['epoch'], ckpt.get('losses', {})
# ── Generation parameters (edit these before running) ─────────────────────────
TEMPERATURE         = None    # set to float to override, or None for default

# ── Apply defaults ────────────────────────────────────────────────────────────
if TEMPERATURE is None:
    TEMPERATURE = 0.8
def graph_to_smiles(nodes_batch, adj_batch):
    """
    Convert generated graph (nodes + adjacency) into SMILES strings.

    Parameters:
    nodes_batch : tensor (B, MAX_ATOMS, NUM_ATOM_FEATURES)
    adj_batch   : tensor (B, MAX_ATOMS, MAX_ATOMS)

    Returns:
    list of SMILES strings
    """

    smiles_out = []

    nodes_np = nodes_batch.detach().cpu().numpy()
    adj_np   = adj_batch.detach().cpu().numpy()

    for b in range(nodes_np.shape[0]):

        try:

            atom_indices = np.argmax(
                nodes_np[b],
                axis=-1
            )

            adj_mat = (
                adj_np[b] > 0.5
            ).astype(int)

            rw_mol = Chem.RWMol()

            atom_map = {}

            for i in range(MAX_ATOMS):

                atom_symbol = ATOM_TYPES[
                    atom_indices[i]
                ]

                idx = rw_mol.AddAtom(
                    Chem.Atom(atom_symbol)
                )

                atom_map[i] = idx

            for i in range(MAX_ATOMS):

                for j in range(i + 1, MAX_ATOMS):

                    if adj_mat[i, j] == 1:

                        rw_mol.AddBond(
                            atom_map[i],
                            atom_map[j],
                            Chem.BondType.SINGLE
                        )

            Chem.SanitizeMol(rw_mol)

            smiles = Chem.MolToSmiles(rw_mol)

            smiles_out.append(smiles)

        except Exception:

            smiles_out.append("")

    return smiles_out
def generate_molecules(number_of_molecules: int,
                       target_qed : float,
                       target_logp: float,
                       temperature: float = DEFAULT_TEMPERATURE):
    """
    Generate `number_of_molecules` molecules conditioned on
    (target_qed, target_logp) with temperature-scaled noise.

    Returns
    -------
    valid_mols   : list of RDKit Mol objects
    valid_smiles : list of SMILES strings
    """
    was_training = generator.training
    generator.eval()

    qed_n, logp_n = normalize_inputs(target_qed, target_logp)
    cond_vec = torch.tensor(
        [[qed_n, logp_n]], dtype=torch.float32, device=device
    ).repeat(number_of_molecules, 1)   # (N, COND_DIM)

    with torch.no_grad():
        z         = torch.randn(number_of_molecules, Z_DIM, device=device) * temperature
        gen_nodes, gen_adj = generator(z, cond_vec)

    raw_smiles   = graph_to_smiles(gen_nodes, gen_adj)
    valid_mols   = []
    valid_smiles = []

    for smi in raw_smiles:
        if smi:
            mol = Chem.MolFromSmiles(smi)
            if mol is not None:
                valid_mols.append(mol)
                valid_smiles.append(smi)

    print(f"Generated {number_of_molecules} molecules -> "
          f"{len(valid_mols)} valid ({100*len(valid_mols)/number_of_molecules:.1f}%)")
    if was_training:
        generator.train()
    return valid_mols, valid_smiles
#same priority for qed and logp
def rank_by_combined(generated_smiles,
    generated_mols,
    target_qed,
    target_logp):
    results = []

    for smi, mol in zip(generated_smiles, generated_mols):

        qed = calculate_qed(mol)
        logp = calculate_logp(mol)

        qed_error = abs(qed - target_qed)      # already 0-1

        # normalize logP error by full range (~10)
        logp_error = abs(logp - target_logp) / 10.0

        score = qed_error + logp_error

        results.append(
            (score, smi, qed, logp)
        )

    results.sort(key=lambda x: x[0])
    return results
#qed priority excepting values of logp
def rank_by_qed(generated_smiles, generated_mols, target_qed):
    results_qed = []

    for smi, mol in zip(generated_smiles, generated_mols):

        qed = calculate_qed(mol)
        logp = calculate_logp(mol)

        qed_error = abs(qed - target_qed)

        results_qed.append(
            (qed_error, smi, qed, logp)
        )

    results_qed.sort(key=lambda x: x[0])
    return results_qed
#LOGP PRIORITY EXCEPTING THE VALUES OF QED
def rank_by_logp(generated_smiles, generated_mols, target_logp):
    results_logp = []

    for smi, mol in zip(generated_smiles, generated_mols):

        qed = calculate_qed(mol)
        logp = calculate_logp(mol)

        logp_error = abs(logp - target_logp)

        results_logp.append(
            (logp_error, smi, qed, logp)
        )

    results_logp.sort(key=lambda x: x[0])
    return results_logp
def compute_metrics(generated_smiles: list,
                    training_smiles: list,
                    total_requested: int) -> dict:
    """
    Compute molecular generation metrics.

    Validity     = valid / total_requested
    Uniqueness   = unique / valid
    Novelty      = new / valid
    Connectivity = connected / valid
    """

    n_valid = len(generated_smiles)

    if total_requested == 0:
        return {
            'validity': 0.0,
            'novelty': 0.0,
            'uniqueness': 0.0,
            'connectivity': 0.0,
            'n_valid': 0,
            'n_total': 0,
        }

    # ── Validity ─────────────────────────

    validity = n_valid / total_requested

    # ── Uniqueness ───────────────────────

    uniqueness = (
        len(set(generated_smiles)) / n_valid
        if n_valid else 0.0
    )

    # ── Novelty ──────────────────────────

    training_set = set(training_smiles)

    novel = [
        s for s in generated_smiles
        if s not in training_set
    ]

    novelty = (
        len(novel) / n_valid
        if n_valid else 0.0
    )

    # ── Connectivity ─────────────────────

    connected_count = 0

    for smi in generated_smiles:

        mol = Chem.MolFromSmiles(smi)

        if mol is None:
            continue

        fragments = Chem.GetMolFrags(mol)

        if len(fragments) == 1:
            connected_count += 1

    connectivity = (
        connected_count / n_valid
        if n_valid else 0.0
    )

    return {
        'validity': validity,
        'novelty': novelty,
        'uniqueness': uniqueness,
        'connectivity': connectivity,
        'n_valid': n_valid,
        'n_total': total_requested,
    }
    # Collect training SMILES for novelty check
training_smiles = df['smiles'].tolist()
def visualise_2d(mols: list,
                 smiles: list,
                 max_display: int = None):
    """Display all valid molecules in a grid using RDKit with SMILES."""

    if not mols:
        print("No valid molecules to display.")
        return

    valid_count = len(mols)

    print(f"Total valid molecules generated: {valid_count}")

    if max_display is None:
        max_display = valid_count

    display_mols = mols[:max_display]
    display_smiles = smiles[:max_display]

    legends = [
        f"{s}\nQED={calculate_qed(m):.2f}  logP={calculate_logp(m):.2f}"
        for m, s in zip(display_mols, display_smiles)
    ]

    grid_img = Draw.MolsToGridImage(
        display_mols,
        molsPerRow=4,
        subImgSize=(250, 250),
        legends=legends,
    )

    display(grid_img)

    return grid_img


def report_properties(mols: list, smiles_list: list):
    """Print a formatted table of molecular properties."""
    rows = []
    for smi, mol in zip(smiles_list, mols):
        rows.append({
            'SMILES'            : smi,
            'QED'               : round(calculate_qed(mol), 4),
            'logP'              : round(calculate_logp(mol), 4),
            'SA Score'          : round(calculate_sa_score(mol), 4),
            'Mol Weight (Da)'   : round(calculate_molecular_weight(mol), 3),
        })
    report_df = pd.DataFrame(rows)
    print(report_df.to_string(index=False))
    return report_df

