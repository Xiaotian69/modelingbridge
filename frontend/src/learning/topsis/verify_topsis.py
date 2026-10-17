"""Independent TOPSIS / entropy-weight reference values (numpy + scipy, not the TypeScript code).

Regenerate with:  python verify_topsis.py   (Python 3 + numpy + scipy)
The TypeScript tests read topsis-verified.json; they never compute their own expected answers.
Inputs below must equal frontend/src/learning/topsis/data.ts (a test checks this).
Distances use scipy.spatial.distance.cdist, entropies scipy.stats.entropy (base m),
AHP weights numpy.linalg.eig, so none of the code paths match the TypeScript ones.
"""
import json
import random
from pathlib import Path

import numpy as np
from scipy.spatial.distance import cdist
from scipy.stats import entropy as shannon

DATA = [
    [1800, 45, 22, 6],
    [2400, 20, 18, 9],
    [1500, 60, 25, 4],
    [2100, 30, 30, 7],
    [2800, 15, 35, 10],
]
BENEFIT = [False, False, True, True]  # 月租, 通勤 cost; 面积, 配套 benefit
EXTRA_ROW = [2800, 10, 35, 1]
AHP_UPPER = [2, 3, 4, 2, 2, 1]
HAND_COLUMN = [3, 4, 12]
RI = {3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24}


def ahp(n, upper):
    a = np.ones((n, n))
    k = 0
    for i in range(n):
        for j in range(i + 1, n):
            a[i, j], a[j, i] = upper[k], 1 / upper[k]
            k += 1
    values, vectors = np.linalg.eig(a)
    k = int(np.argmax(values.real))
    w = np.abs(vectors[:, k].real)
    lam = float(values[k].real)
    ci = (lam - n) / (n - 1)
    return dict(weights=(w / w.sum()).tolist(), lambdaMax=lam, ci=ci, cr=ci / RI[n])


def topsis(x, w, benefit):
    x = np.asarray(x, float)
    w = np.asarray(w, float) / np.sum(w)
    benefit = np.asarray(benefit, bool)
    r = x / np.linalg.norm(x, axis=0)
    v = r * w
    best = np.where(benefit, v.max(axis=0), v.min(axis=0))
    worst = np.where(benefit, v.min(axis=0), v.max(axis=0))
    d_plus = cdist(v, best[None, :]).ravel()
    d_minus = cdist(v, worst[None, :]).ravel()
    c = d_minus / (d_plus + d_minus)
    order = sorted(range(len(c)), key=lambda i: (-c[i], i))
    return dict(normalised=r.tolist(), weighted=v.tolist(), best=best.tolist(), worst=worst.tolist(),
                dPlus=d_plus.tolist(), dMinus=d_minus.tolist(), closeness=c.tolist(), order=order)


def entropy_weights(x, benefit):
    x = np.asarray(x, float)
    m = x.shape[0]
    lo, hi = x.min(axis=0), x.max(axis=0)
    span = np.where(hi > lo, hi - lo, 1.0)
    y = np.where(benefit, (x - lo) / span, (hi - x) / span)
    y[:, hi == lo] = 0.0
    e = np.array([shannon(y[:, j], base=m) if y[:, j].sum() > 0 else 1.0 for j in range(x.shape[1])])
    d = 1 - e
    return dict(scaled=y.tolist(), entropy=e.tolist(), weights=(d / d.sum()).tolist())


ahp_result = ahp(4, AHP_UPPER)
w_ahp = ahp_result["weights"]
ent = entropy_weights(DATA, np.array(BENEFIT))

# The common "正向化" variant (cost x → max − x, then vector normalisation, every column benefit).
x = np.asarray(DATA, float)
shifted = x.copy()
for j, b in enumerate(BENEFIT):
    if not b:
        shifted[:, j] = x[:, j].max() - x[:, j]

out = {
    "inputs": {"data": DATA, "benefit": BENEFIT, "extraRow": EXTRA_ROW, "ahpUpper": AHP_UPPER, "handColumn": HAND_COLUMN},
    "ahp": ahp_result,
    "lesson": {
        "ahp": topsis(DATA, w_ahp, BENEFIT),
        "equal": topsis(DATA, [1, 1, 1, 1], BENEFIT),
        "entropy": topsis(DATA, ent["weights"], BENEFIT),
        "sixRooms": topsis(DATA + [EXTRA_ROW], w_ahp, BENEFIT),
        "rentAsBenefit": topsis(DATA, w_ahp, [True, False, True, True]),
        "shiftedVariant": topsis(shifted, w_ahp, [True] * 4),
    },
    "entropy": ent,
    "columnNorms": np.linalg.norm(x, axis=0).tolist(),
    "handNorm": float(np.linalg.norm(HAND_COLUMN)),
}

# Exercise reference answers (frontend/src/learning/topsis/questions.ts).
v3 = np.array([[0.30, 0.10], [0.20, 0.25], [0.10, 0.20]])
best3, worst3 = v3.max(axis=0), v3.min(axis=0)
dp3 = float(np.linalg.norm(v3[2] - best3))
dm3 = float(np.linalg.norm(v3[2] - worst3))
e3 = np.array([0.80, 0.90, 0.70])
out["exercises"] = {
    "topsis-practice-2": HAND_COLUMN[1] / float(np.linalg.norm(HAND_COLUMN)),   # 4 / 13
    "topsis-practice-3": 0.08 / (0.12 + 0.08),                                   # C from D+, D−
    "topsis-practice-5": DATA[4][0] / float(np.linalg.norm(x[:, 0])),            # 戊's normalised rent
    "topsis-practice-6": float((1 - e3[2]) / (1 - e3).sum()),                    # entropy weight
    "topsis-practice-7": dm3 / (dp3 + dm3),                                      # closeness of the third
    "practice7Distances": [dp3, dm3],
}

rng = random.Random(20261014)
samples = []
for _ in range(200):
    m, n = rng.randint(3, 8), rng.randint(2, 6)
    data = [[round(rng.uniform(0.5, 100), 2) for _ in range(n)] for _ in range(m)]
    weights = [rng.randint(1, 9) for _ in range(n)]
    benefit = [rng.random() < 0.5 for _ in range(n)]
    full, ent_full = topsis(data, weights, benefit), entropy_weights(data, np.array(benefit))
    keep = ("best", "worst", "dPlus", "dMinus", "closeness", "order")
    samples.append({"data": data, "weights": weights, "benefit": benefit,
                    "topsis": {k: full[k] for k in keep},
                    "entropy": {k: ent_full[k] for k in ("entropy", "weights")}})
out["random"] = samples

Path(__file__).with_name("topsis-verified.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
print("AHP weights", np.round(w_ahp, 4), "CR", round(ahp_result["cr"], 4))
for name, res in out["lesson"].items():
    print(f"{name:15s} C =", np.round(res["closeness"], 4), "order", res["order"])
print("entropy e", np.round(ent["entropy"], 4), "w", np.round(ent["weights"], 4))
print("exercises", {k: (round(v, 5) if isinstance(v, float) else v) for k, v in out["exercises"].items()})
print(f"wrote {len(samples)} random problems")
