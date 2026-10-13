"""Independent reference results for the lab's two-variable LP, computed with SciPy HiGHS.

Regenerate with:  python verify_lp2d.py   (Python 3 + scipy)
For each model: HiGHS status (optimal / infeasible / unbounded) and optimal value. Uniqueness is
checked with four more LPs over the optimal set {feasible, c·x >= z* - 1e-8·(1+|z*|)}: min/max of
x and y. If any is unbounded, or a range is wider than 1e-3, the optimum is not unique. In this
sample genuine ties are at least 10 wide and numerical widths stay below 3e-5 (see the printout).
The TypeScript test (lp2d.test.ts) only compares; it never computes its own expected values.
"""
import json
import random
from pathlib import Path

from scipy.optimize import linprog

STATUS = {0: "optimal", 2: "infeasible", 3: "unbounded"}


def model(c1=40, c2=50, cut=(2, 1, 100), assemble=(1, 2, 80), order=None):
    rows = [dict(id="cut", a=cut[0], b=cut[1], rhs=cut[2], sense="<="),
            dict(id="assemble", a=assemble[0], b=assemble[1], rhs=assemble[2], sense="<=")]
    if order is not None:
        rows.append(dict(id="order", a=1, b=1, rhs=order, sense=">="))
    return dict(c=[c1, c2], constraints=rows)


def as_ub(rows):
    a, b = [], []
    for r in rows:
        s = 1 if r["sense"] == "<=" else -1
        a.append([s * r["a"], s * r["b"]])
        b.append(s * r["rhs"])
    return a, b


def solve(m):
    a, b = as_ub(m["constraints"])
    c = m["c"]
    res = linprog([-c[0], -c[1]], A_ub=a, b_ub=b, bounds=[(0, None), (0, None)], method="highs")
    status = STATUS.get(res.status)
    assert status, res.message
    out = dict(status=status)
    if status != "optimal":
        return out
    z = -res.fun
    out["value"] = z
    # Optimal set: original constraints plus c·x >= z - tol.
    a2 = a + [[-c[0], -c[1]]]
    b2 = b + [-z + 1e-8 * (1 + abs(z))]
    spans = []
    for k in range(2):
        lo = linprog([1 if i == k else 0 for i in range(2)], A_ub=a2, b_ub=b2, bounds=[(0, None)] * 2, method="highs")
        hi = linprog([-1 if i == k else 0 for i in range(2)], A_ub=a2, b_ub=b2, bounds=[(0, None)] * 2, method="highs")
        if lo.status == 3 or hi.status == 3:
            spans.append(float("inf"))
        else:
            assert lo.status == 0 and hi.status == 0, (lo.message, hi.message)
            spans.append(-hi.fun - lo.fun)
    out["unique"] = all(s < 1e-3 for s in spans)
    out["span"] = max(spans) if max(spans) != float("inf") else None  # None: the optimal set is unbounded
    return out


rng = random.Random(20261013)
step = lambda lo, hi, d: lo + d * rng.randint(0, int((hi - lo) / d))
models = [
    model(),                                   # textbook case: (40, 20), 2600
    model(c1=25),                              # objective parallel to assembly: an optimal edge
    model(order=70),                           # order exceeds max output 60: infeasible
    model(cut=(2, 0, 100), assemble=(1, 0, 80)),  # B uses no resource: unbounded
    model(c2=0, cut=(2, 0, 100), assemble=(1, 0, 80)),  # unbounded region, bounded objective: a ray of optima
    model(c1=0, c2=0),                         # every feasible point is optimal
    model(cut=(2, 1, 0), assemble=(1, 2, 0)),  # only the origin
    model(order=60),                           # order exactly at the limit
    model(c1=80, c2=40),                       # tie along the cutting edge
]
for _ in range(400):
    order = step(0, 150, 5) if rng.random() < 0.35 else None
    models.append(model(
        c1=step(0, 80, 5), c2=step(0, 80, 5),
        cut=(step(0, 4, 0.5), step(0, 4, 0.5), step(0, 150, 5)),
        assemble=(step(0, 4, 0.5), step(0, 4, 0.5), step(0, 150, 5)),
        order=order,
    ))

samples = [dict(model=m, **solve(m)) for m in models]
Path(__file__).with_name("lp2d-verified.json").write_text(json.dumps(samples, indent=1) + "\n")
counts = {}
for s in samples:
    key = s["status"] + ("" if s["status"] != "optimal" else ("/unique" if s["unique"] else "/multiple"))
    counts[key] = counts.get(key, 0) + 1
print(len(samples), "models:", counts)
uniq = [s["span"] for s in samples if s["status"] == "optimal" and s["unique"]]
multi = [s["span"] for s in samples if s["status"] == "optimal" and not s["unique"] and s["span"] is not None]
print("largest numerical width among unique optima:", max(uniq), "| smallest width among ties:", min(multi))
print("textbook", samples[0], "| parallel", samples[1]["unique"], "| order70", samples[2]["status"], "| no-resource-B", samples[3]["status"])
