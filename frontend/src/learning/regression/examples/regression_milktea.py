"""回归分析精讲配套程序：奶茶店两周销量（一元回归 + 多元回归 + 预测）。

运行：python regression_milktea.py   （需要 Python 3、NumPy 和 statsmodels）
"""
import numpy as np
import statsmodels.api as sm

temperature = np.array([26, 28, 31, 33, 29, 25, 27, 30, 34, 35, 32, 28, 24, 30], dtype=float)  # 最高气温 ℃
weekend = np.array([0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1], dtype=float)                  # 1 = 周末
sales = np.array([174, 199, 208, 229, 195, 197, 224, 195, 227, 239, 218, 191, 191, 235], dtype=float)  # 杯

# ---- 一元回归：按课程公式手算 ----
x_bar, y_bar = temperature.mean(), sales.mean()
sxx = ((temperature - x_bar) ** 2).sum()
sxy = ((temperature - x_bar) * (sales - y_bar)).sum()
b1 = sxy / sxx
b0 = y_bar - b1 * x_bar
residuals = sales - (b0 + b1 * temperature)
r2 = 1 - (residuals ** 2).sum() / ((sales - y_bar) ** 2).sum()
r = np.corrcoef(temperature, sales)[0, 1]
print(f"一元回归：销量 = {b0:.2f} + {b1:.2f} × 气温，r = {r:.3f}，R² = {r2:.3f}")
print("周末四天的残差：", np.round(residuals[weekend == 1], 1))

# ---- 多元回归：交给 statsmodels（最小二乘） ----
X = sm.add_constant(np.column_stack([temperature, weekend]))
model = sm.OLS(sales, X).fit()
b = model.params
print(f"\n多元回归：销量 = {b[0]:.2f} + {b[1]:.2f} × 气温 + {b[2]:.2f} × 周末")
print(f"R² = {model.rsquared:.3f}，调整 R² = {model.rsquared_adj:.3f}")
print(model.summary(xname=["常数项", "气温", "周末"]))

# ---- 预测：明天是周六，预报最高 32 ℃ ----
tomorrow = np.array([[1, 32, 1]])
print(f"\n明天预测：{model.predict(tomorrow)[0]:.1f} 杯")
frame = model.get_prediction(tomorrow).summary_frame(alpha=0.05)
# obs_ci：单日销量的 95% 预测区间（mean_ci 是“平均销量”的置信区间，更窄）
print(f"95% 预测区间：{frame['obs_ci_lower'][0]:.1f} ~ {frame['obs_ci_upper'][0]:.1f} 杯")
