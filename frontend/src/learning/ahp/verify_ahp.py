"""Independent AHP reference values computed with numpy.linalg.eig (not power iteration).

Regenerate with:  python verify_ahp.py   (Python 3 + numpy)
The TypeScript tests read ahp-verified.json; they never compute their own expected answers.
Inputs below must equal frontend/src/learning/ahp/data.ts (a test checks this).
"""
import json
import random
from pathlib import Path

import numpy as np

RI = {1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45}
SCALE = [1 / 9, 1 / 8, 1 / 7, 1 / 6, 1 / 5, 1 / 4, 1 / 3, 1 / 2, 1, 2, 3, 4, 5, 6, 7, 8, 9]


def matrix(n, upper):
    a = np.ones((n, n))
    k = 0
    for i in range(n):
        for j in range(i + 1, n):
            a[i, j] = upper[k]
            a[j, i] = 1 / upper[k]
            k += 1
    return a


def analyse(n, upper):
    a = matrix(n, upper)
    values, vectors = np.linalg.eig(a)
    k = int(np.argmax(values.real))
    w = np.abs(vectors[:, k].real)
    w = w / w.sum()
    lam = float(values[k].real)
    ci = max(0.0, (lam - n) / (n - 1)) if n > 1 else 0.0
    cr = ci / RI[n] if RI[n] else None
    gm = np.prod(a, axis=1) ** (1 / n)
    gm = gm / gm.sum()
    cn = (a / a.sum(axis=0)).mean(axis=1)
    return dict(n=n, upper=list(upper), weights=w.tolist(), lambdaMax=lam, ci=ci, cr=cr,
                geometric=gm.tolist(), columnNormalised=cn.tolist())


lesson = {
    "criteria": (3, [1 / 3, 2, 5]),
    "criteria4": (4, [1 / 3, 2, 1, 5, 3, 1 / 2]),
    "C1": (3, [4, 3, 1 / 2]),
    "C2": (3, [1 / 2, 3, 4]),
    "C3": (3, [1 / 2, 1 / 5, 1 / 3]),
    "C4": (3, [1 / 2, 1 / 3, 1 / 2]),
    "consistent": (3, [2, 4, 2]),
    "circular": (3, [3, 1 / 3, 3]),
}
out = {"lesson": {name: analyse(n, u) for name, (n, u) in lesson.items()}}

crit3 = np.array(out["lesson"]["criteria"]["weights"])
crit4 = np.array(out["lesson"]["criteria4"]["weights"])
local = {c: np.array(out["lesson"][c]["weights"]) for c in ["C1", "C2", "C3", "C4"]}
out["global3"] = (np.column_stack([local["C1"], local["C2"], local["C3"]]) @ crit3).tolist()
out["global4"] = (np.column_stack([local[c] for c in ["C1", "C2", "C3", "C4"]]) @ crit4).tolist()
layer = [out["lesson"][c] for c in ["C1", "C2", "C3"]]
out["overallCR3"] = float(sum(w * l["ci"] for w, l in zip(crit3, layer)) / sum(w * RI[3] for w in crit3))

# Exercise reference answers (frontend/src/learning/ahp/questions.ts).
out["exercises"] = {
    "ahp-practice-1": out["lesson"]["consistent"]["weights"][0],          # 4/7
    "ahp-practice-2": ((4.21 - 4) / 3) / RI[4],                             # CR for λmax = 4.21, n = 4
    "ahp-practice-3": 0.23 * 0.14 + 0.65 * 0.56 + 0.12 * 0.23,              # B's global score (rounded weights)
}

rng = random.Random(20261013)
samples = []
for _ in range(200):
    n = rng.randint(3, 7)
    samples.append(analyse(n, [rng.choice(SCALE) for _ in range(n * (n - 1) // 2)]))
out["random"] = samples

Path(__file__).with_name("ahp-verified.json").write_text(json.dumps(out, indent=1) + "\n")
print("criteria", np.round(crit3, 4), "global3", np.round(out["global3"], 4), "global4", np.round(out["global4"], 4))
print("criteria4", out["lesson"]["criteria4"])
print("exercises", out["exercises"], "overallCR3", round(out["overallCR3"], 5))
print(f"wrote {len(samples)} random reciprocal matrices")
