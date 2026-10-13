"""模桥 · 层次分析法（AHP）课程示例：三份暑期实习怎么选。
需要 Python 3 与 numpy：pip install numpy
"""
import numpy as np

RI = {1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45}


def ahp(a):
    """返回 (权重, λmax, CI, CR)。权重取最大特征值对应的特征向量并归一化。"""
    a = np.array(a, dtype=float)
    n = len(a)
    values, vectors = np.linalg.eig(a)
    k = np.argmax(values.real)
    w = np.abs(vectors[:, k].real)
    w = w / w.sum()
    lam = values[k].real
    ci = (lam - n) / (n - 1)
    cr = ci / RI[n]
    return w, lam, ci, cr


# 准则层：薪资待遇、成长空间、通勤生活（a_ij = 第 i 个比第 j 个重要几倍）
criteria = [[1, 1/3, 2],
            [3, 1, 5],
            [1/2, 1/5, 1]]

# 方案层：A 互联网公司、B 研究所、C 本地企业，分别在三个准则下两两比较
local = {
    "薪资待遇": [[1, 4, 3], [1/4, 1, 1/2], [1/3, 2, 1]],
    "成长空间": [[1, 1/2, 3], [2, 1, 4], [1/3, 1/4, 1]],
    "通勤生活": [[1, 1/2, 1/5], [2, 1, 1/3], [5, 3, 1]],
}

w, lam, ci, cr = ahp(criteria)
print("准则权重:", np.round(w, 3), " λmax =", round(lam, 4), " CR =", round(cr, 4))

columns, cis = [], []
for name, m in local.items():
    lw, llam, lci, lcr = ahp(m)
    columns.append(lw)
    cis.append(lci)
    print(f"{name}下的局部权重:", np.round(lw, 3), " CR =", round(lcr, 4))

scores = np.column_stack(columns) @ w
print("总得分 (A, B, C):", np.round(scores, 3))
print("层次总排序 CR =", round(float(w @ np.array(cis) / (w.sum() * RI[3])), 4))
