"""
第 3 题的独立复核夹具：python -I verify_q3.py > q3-verified.json

刻意不复用前端代码：原始数据、打分规则、Saaty 标度在这里各写一遍，
权重用 numpy 的特征分解（前端用几何平均），一致性用 λmax 的特征值（前端用 A·w/w 的均值），
综合分用矩阵乘法。courses.test.ts / ahp.test.ts 拿前端结果逐项对照这份 JSON。
"""
import itertools
import json

import numpy as np

SAATY = {-2: 5.0, -1: 3.0, 0: 1.0, 1: 1 / 3, 2: 1 / 5}
PAIRS = [(0, 1), (0, 2), (1, 2)]
RI3 = 0.58

# 原始数据（与 config.ts 的 q3.courses 一致，独立抄写）
COURSES = [
    ("心理学与生活", 91, 12, 10),
    ("电影鉴赏", 85, 4, 14),
    ("传统文化概论", 82, 0, 8),
]


def grade_score(avg):
    for lo, s in ((90, 5), (85, 4), (80, 3), (75, 2)):
        if avg >= lo:
            return s
    return 1


def homework_score(n):
    for hi, s in ((0, 5), (4, 4), (8, 3), (12, 2)):
        if n <= hi:
            return s
    return 1


def time_score(hour):
    return 1 if hour < 9 else 5


SCORES = np.array([[grade_score(a), homework_score(h), time_score(t)] for _, a, h, t in COURSES], dtype=float)


def case(choices):
    m = np.ones((3, 3))
    for k, (i, j) in enumerate(PAIRS):
        m[i, j] = SAATY[choices[k]]
        m[j, i] = 1 / m[i, j]
    values, vectors = np.linalg.eig(m)
    top = int(np.argmax(values.real))
    w = np.abs(vectors[:, top].real)
    w = w / w.sum()
    lam = float(values[top].real)
    ci = max(0.0, (lam - 3) / 2)
    totals = SCORES @ w
    order = sorted(range(3), key=lambda i: (-round(totals[i], 12), i))
    return {
        "choices": list(choices),
        "weights": [round(float(x), 10) for x in w],
        "lambdaMax": round(lam, 10),
        "cr": round(ci / RI3, 10),
        "totals": [round(float(x), 10) for x in totals],
        "order": order,
    }


print(
    json.dumps(
        {
            "scores": SCORES.astype(int).tolist(),
            "cases": [case(c) for c in itertools.product([-2, -1, 0, 1, 2], repeat=3)],
        },
        ensure_ascii=False,
        indent=1,
    )
)
