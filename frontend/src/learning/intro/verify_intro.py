"""Independent reference values for 第零课 (numpy + scipy, not the TypeScript code).

Regenerate with:  python verify_intro.py   (Python 3 + numpy + scipy)
The TypeScript tests read intro-verified.json; they never compute their own expected answers.
Inputs below must equal frontend/src/learning/intro/data.ts (a test checks this).

The umbrella case is solved as a linear program with scipy.optimize.linprog:
    variables  a (umbrellas at A after the transfer), uA, uB (people who get no umbrella)
    minimise   uA + uB
    subject to uA >= dA - a,  uB >= dB - (N - a),  0 <= a <= N,  uA, uB >= 0
The range of optimal transfers comes from two more LPs (min a / max a with uA + uB <= optimum).
"""
import json
from pathlib import Path

import numpy as np
from scipy.optimize import linprog

WALK = dict(metres=900, speed=1.5, slowSpeed=1.2, lightWait=1)
COMMUTE_DAYS = [11, 12, 10, 13, 11, 12, 15, 11, 12, 13]
RAIN_DAYS = [7]
CLASS_MINUTE = 60
DEPARTURES = list(range(40, 53))
STOCK = dict(a=20, b=40)
DEMAND = dict(a=40, b=20)
SCENARIOS = [(40, 20), (50, 20), (30, 15), (25, 35)]
# A grid of demands for the free sliders (0..70 in steps of 5) plus the edge cases.
GRID = [(da, db) for da in range(0, 71, 5) for db in range(0, 71, 5)]


def umbrella_lp(da, db, sa=STOCK["a"], sb=STOCK["b"]):
    n = sa + sb
    # x = [a, uA, uB]
    a_ub = [[-1, -1, 0], [1, 0, -1]]  # -a - uA <= -dA ;  a - uB <= N - dB
    b_ub = [-da, n - db]
    bounds = [(0, n), (0, None), (0, None)]
    best = linprog([0, 1, 1], A_ub=a_ub, b_ub=b_ub, bounds=bounds, method="highs")
    assert best.status == 0
    value = best.fun
    a_ub2 = a_ub + [[0, 1, 1]]
    b_ub2 = b_ub + [value + 1e-9]
    lo = linprog([1, 0, 0], A_ub=a_ub2, b_ub=b_ub2, bounds=bounds, method="highs")
    hi = linprog([-1, 0, 0], A_ub=a_ub2, b_ub=b_ub2, bounds=bounds, method="highs")
    assert lo.status == 0 and hi.status == 0
    # Transfers x = a - sa. Integer data give integer vertices; round only the float noise.
    return dict(
        demand=[da, db],
        minShortage=int(round(value)),
        low=int(round(lo.x[0])) - sa,
        high=int(round(hi.x[0])) - sa,
    )


def shortage(x, da, db, sa=STOCK["a"], sb=STOCK["b"]):
    return max(da - (sa + x), 0) + max(db - (sb - x), 0)


def main():
    days = np.array(COMMUTE_DAYS)
    walk = dict(
        normal=WALK["metres"] / WALK["speed"] / 60,
        light=WALK["metres"] / WALK["speed"] / 60 + WALK["lightWait"],
        slow=WALK["metres"] / WALK["slowSpeed"] / 60,
    )
    commute = dict(
        mean=float(days.mean()),
        sum=int(days.sum()),
        max=int(days.max()),
        sunnyMax=int(np.delete(days, [d - 1 for d in RAIN_DAYS]).max()),
        departures=[
            dict(depart=t, onTime=int((t + days <= CLASS_MINUTE).sum()), late=(np.nonzero(t + days > CLASS_MINUTE)[0] + 1).tolist())
            for t in DEPARTURES
        ],
    )
    xs = list(range(-STOCK["a"], STOCK["b"] + 1))
    out = dict(
        inputs=dict(walk=WALK, commuteDays=COMMUTE_DAYS, rainDays=RAIN_DAYS, classMinute=CLASS_MINUTE, stock=STOCK, demand=DEMAND, scenarios=SCENARIOS),
        walk=walk,
        commute=commute,
        umbrella=dict(
            curve=[dict(x=x, shortage=shortage(x, DEMAND["a"], DEMAND["b"])) for x in xs],
            scenarios=[umbrella_lp(da, db) for da, db in SCENARIOS],
            grid=[umbrella_lp(da, db) for da, db in GRID],
        ),
    )
    path = Path(__file__).with_name("intro-verified.json")
    path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8", newline="\n")
    print("wrote", path)
    for s in out["umbrella"]["scenarios"]:
        print(s)
    print(commute["mean"], commute["max"], commute["sunnyMax"])


if __name__ == "__main__":
    main()
