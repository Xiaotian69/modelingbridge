"""ModelingBridge original example. Install: python -m pip install scipy
Run: python workshop.py. All quantities are weekly; output is in m^2 / yuan.
"""
import numpy as np
from scipy.optimize import linprog


def plan(cutting=100, assembly=80):
    # linprog minimizes: negate the profit coefficients to maximize profit.
    result = linprog(
        c=[-40, -50],
        A_ub=[[2, 1], [1, 2]],
        b_ub=[cutting, assembly],
        bounds=[(0, None), (0, None)],
        method="highs",
    )
    if not result.success:
        raise RuntimeError(result.message)
    x, y = result.x
    used = np.array([2*x+y, x+2*y])
    assert min(x, y) >= -1e-8
    assert np.all(used <= np.array([cutting, assembly])+1e-8)
    profit = 40*x+50*y
    assert abs(profit+result.fun) < 1e-7
    return x, y, profit, np.array([cutting, assembly])-used


if __name__ == "__main__":
    x, y, profit, slack = plan()
    print(f"A={x:.2f}, B={y:.2f}, profit={profit:.2f}, slack={slack}")
    assert np.allclose([x, y, profit], [40, 20, 2600])
    assert abs(plan(100, 100)[2]-3000) < 1e-7
    assert abs(plan(101, 80)[2]-2610) < 1e-7
    assert abs(plan(100, 81)[2]-2620) < 1e-7
    assert abs(plan(9, 8)[2]-250) < 1e-7
    integer = max((40*x+50*y, x, y) for x in range(5) for y in range(5)
                  if 2*x+y <= 9 and x+2*y <= 8)
    assert integer == (230, 2, 3)
    print("Verified: expansion=3000; marginal values=10,20; integer=(2,3),230")
