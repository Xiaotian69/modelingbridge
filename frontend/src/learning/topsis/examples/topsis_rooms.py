"""TOPSIS 精讲配套程序：小林的五套房（AHP 权重 + 熵权法 + TOPSIS）。

运行：python topsis_rooms.py   （需要 Python 3 和 NumPy）
"""
import numpy as np

rooms = ["甲", "乙", "丙", "丁", "戊"]
criteria = ["月租", "通勤", "面积", "配套"]
# 每行一套房：月租(元/月)、通勤(分钟)、面积(m²)、配套(处)
X = np.array([
    [1800, 45, 22, 6],
    [2400, 20, 18, 9],
    [1500, 60, 25, 4],
    [2100, 30, 30, 7],
    [2800, 15, 35, 10],
], dtype=float)
benefit = np.array([False, False, True, True])  # 月租、通勤越小越好；面积、配套越大越好


def ahp_weights(A):
    """AHP：最大特征值对应的特征向量，归一化后作为权重。"""
    values, vectors = np.linalg.eig(A)
    k = np.argmax(values.real)
    w = np.abs(vectors[:, k].real)
    lam = values[k].real
    n = len(A)
    cr = (lam - n) / (n - 1) / 0.90  # RI(4) = 0.90
    return w / w.sum(), cr


def entropy_weights(X, benefit):
    """熵权法：按方向做 min-max 缩放 → 比重 p → 熵 e → 差异系数 d = 1 - e → 归一化。"""
    lo, hi = X.min(axis=0), X.max(axis=0)
    Y = np.where(benefit, (X - lo) / (hi - lo), (hi - X) / (hi - lo))
    P = Y / Y.sum(axis=0)
    with np.errstate(divide="ignore", invalid="ignore"):
        plogp = np.where(P > 0, P * np.log(P), 0.0)  # 约定 0·ln0 = 0
    e = -plogp.sum(axis=0) / np.log(len(X))
    d = 1 - e
    return d / d.sum(), e


def topsis(X, w, benefit):
    R = X / np.sqrt((X ** 2).sum(axis=0))         # 向量标准化
    V = R * w                                      # 加权
    best = np.where(benefit, V.max(axis=0), V.min(axis=0))   # 正理想解
    worst = np.where(benefit, V.min(axis=0), V.max(axis=0))  # 负理想解
    d_plus = np.sqrt(((V - best) ** 2).sum(axis=1))
    d_minus = np.sqrt(((V - worst) ** 2).sum(axis=1))
    return d_plus, d_minus, d_minus / (d_plus + d_minus)


# 小林对四个准则的两两判断（行比列重要几倍）
A = np.array([
    [1,   2,   3,   4],
    [1/2, 1,   2,   2],
    [1/3, 1/2, 1,   1],
    [1/4, 1/2, 1,   1],
])
w_ahp, cr = ahp_weights(A)
w_ent, e = entropy_weights(X, benefit)
print("AHP 权重:", np.round(w_ahp, 3), " CR =", round(cr, 4))
print("熵    e :", np.round(e, 4))
print("熵权    :", np.round(w_ent, 3))

for name, w in [("AHP 权重", w_ahp), ("等权重", np.full(4, 0.25)), ("熵权", w_ent)]:
    d_plus, d_minus, C = topsis(X, w, benefit)
    order = np.argsort(-C)
    print(f"\n{name}：贴近度 C =", "  ".join(f"{r} {c:.3f}" for r, c in zip(rooms, C)))
    print("  排名:", " > ".join(rooms[i] for i in order))
