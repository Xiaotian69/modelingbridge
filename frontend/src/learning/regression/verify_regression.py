"""Independent regression reference values (numpy / scipy / statsmodels, not the TypeScript code).

Regenerate with:  python verify_regression.py   (Python 3 + numpy + scipy + statsmodels)
The TypeScript tests read regression-verified.json; they never compute their own expected answers.
Inputs below must equal frontend/src/learning/regression/data.ts (a test checks this).
Simple fits use scipy.stats.linregress, multiple fits statsmodels OLS (QR / pinv internally) and
numpy.linalg.lstsq, so none of the code paths match the TypeScript normal equations.
"""
import json
import random
from pathlib import Path

import numpy as np
import statsmodels.api as sm
from scipy import stats

TEMPERATURE = [26, 28, 31, 33, 29, 25, 27, 30, 34, 35, 32, 28, 24, 30]
WEEKEND = [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 1, 1]
SALES = [174, 199, 208, 229, 195, 197, 224, 195, 227, 239, 218, 191, 191, 235]
TOMORROW = {"temperature": 32, "weekend": 1}
COLD_DAY = 12
EVENT_DAY = {"temperature": 25, "weekend": 0, "sales": 300}
HAND_X = [1, 2, 3, 4, 5]
HAND_Y = [2, 4, 5, 4, 5]


def simple(x, y):
    res = stats.linregress(x, y)
    x, y = np.asarray(x, float), np.asarray(y, float)
    fitted = res.intercept + res.slope * x
    sse = float(((y - fitted) ** 2).sum())
    sst = float(((y - y.mean()) ** 2).sum())
    return dict(intercept=res.intercept, slope=res.slope, r=res.rvalue, r2=res.rvalue ** 2,
                sse=sse, sst=sst, residuals=(y - fitted).tolist(), slopeStdErr=res.stderr, slopeP=res.pvalue)


def multiple(columns, y):
    X = sm.add_constant(np.column_stack(columns).astype(float), has_constant="add")
    fit = sm.OLS(np.asarray(y, float), X).fit()
    lstsq = np.linalg.lstsq(X, np.asarray(y, float), rcond=None)[0]
    assert np.allclose(lstsq, fit.params, atol=1e-8), "statsmodels and lstsq disagree"
    return dict(coefficients=fit.params.tolist(), standardErrors=fit.bse.tolist(), tStats=fit.tvalues.tolist(),
                pValues=fit.pvalues.tolist(), r2=fit.rsquared, adjustedR2=fit.rsquared_adj,
                sse=float(fit.ssr), sigma2=float(fit.scale), residuals=fit.resid.tolist())


temp_only = simple(TEMPERATURE, SALES)
both = multiple([TEMPERATURE, WEEKEND], SALES)
temp_only_ols = multiple([TEMPERATURE], SALES)
with_event = simple(TEMPERATURE + [EVENT_DAY["temperature"]], SALES + [EVENT_DAY["sales"]])
with_event_both = multiple([TEMPERATURE + [EVENT_DAY["temperature"]], WEEKEND + [EVENT_DAY["weekend"]]],
                           SALES + [EVENT_DAY["sales"]])
b = both["coefficients"]

out = {
    "inputs": {"temperature": TEMPERATURE, "weekend": WEEKEND, "sales": SALES, "tomorrow": TOMORROW,
               "coldDay": COLD_DAY, "eventDay": EVENT_DAY, "handX": HAND_X, "handY": HAND_Y},
    "means": {"temperature": float(np.mean(TEMPERATURE)), "sales": float(np.mean(SALES)),
              "weekendTemp": float(np.mean([t for t, w in zip(TEMPERATURE, WEEKEND) if w])),
              "weekdayTemp": float(np.mean([t for t, w in zip(TEMPERATURE, WEEKEND) if not w]))},
    "simple": temp_only,
    "simpleOls": temp_only_ols,
    "multiple": both,
    "corrTempWeekend": float(np.corrcoef(TEMPERATURE, WEEKEND)[0, 1]),
    "withEvent": with_event,
    "withEventMultiple": with_event_both,
    "predictions": {
        "tomorrowMultiple": b[0] + b[1] * TOMORROW["temperature"] + b[2] * TOMORROW["weekend"],
        "tomorrowSimple": temp_only["intercept"] + temp_only["slope"] * TOMORROW["temperature"],
        "coldWeekday": b[0] + b[1] * COLD_DAY,
        "zeroDegrees": b[0],
    },
    "hand": simple(HAND_X, HAND_Y),
}

# 95 % prediction interval for tomorrow (statsmodels get_prediction, obs_ci).
X2 = sm.add_constant(np.column_stack([TEMPERATURE, WEEKEND]).astype(float))
frame = sm.OLS(np.asarray(SALES, float), X2).fit().get_prediction(
    np.array([[1.0, TOMORROW["temperature"], TOMORROW["weekend"]]])).summary_frame(alpha=0.05)
out["tomorrowInterval"] = [float(frame["obs_ci_lower"].iloc[0]), float(frame["obs_ci_upper"].iloc[0])]

# Student t distribution spot checks (scipy.stats.t).
trng = random.Random(7)
out["tDistribution"] = [
    {"t": t, "df": df, "cdf": float(stats.t.cdf(t, df)), "q975": float(stats.t.ppf(0.975, df)),
     "q": float(stats.t.ppf(q, df)), "p": q}
    for t, df, q in [(round(trng.uniform(-6, 6), 3), trng.randint(1, 60), round(trng.uniform(0.01, 0.99), 3))
                     for _ in range(60)]
]

# Exercise reference answers (frontend/src/learning/regression/questions.ts).
out["exercises"] = {
    "regression-practice-2": out["hand"]["slope"],                       # 0.6
    "regression-practice-3": out["hand"]["intercept"],                   # 2.2
    "regression-practice-4": 1 - 2.4 / 6.0,                              # R² from SSE and SST
    "regression-practice-5": 12 + 3.5 * 20,                              # prediction 82
    "regression-practice-7": 0.8 ** 2,                                   # R² = r² in simple regression
    "regression-practice-11": 1 - (1 - 0.90) * (14 - 1) / (14 - 2 - 1),  # adjusted R²
}

rng = random.Random(20261015)
samples = []
for _ in range(150):
    n, p = rng.randint(6, 25), rng.randint(1, 4)
    cols = [[round(rng.uniform(-20, 60), 2) for _ in range(n)] for _ in range(p)]
    beta = [rng.uniform(-5, 5) for _ in range(p + 1)]
    y = [round(beta[0] + sum(beta[k + 1] * cols[k][i] for k in range(p)) + rng.gauss(0, 4), 2) for i in range(n)]
    m = multiple(cols, y)
    s = simple(cols[0], y)
    samples.append({"columns": cols, "y": y,
                    "multiple": {k: m[k] for k in ("coefficients", "standardErrors", "tStats", "r2", "adjustedR2", "sse")},
                    "simple": {k: s[k] for k in ("intercept", "slope", "r", "r2", "sse")}})
out["random"] = samples

Path(__file__).with_name("regression-verified.json").write_text(
    json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
print("simple  b0 %.4f b1 %.4f r %.4f R2 %.4f" % (temp_only["intercept"], temp_only["slope"], temp_only["r"], temp_only["r2"]))
print("multiple", np.round(both["coefficients"], 4), "R2 %.4f adj %.4f" % (both["r2"], both["adjustedR2"]))
print("  se", np.round(both["standardErrors"], 4), "t", np.round(both["tStats"], 3), "p", ["%.2e" % p for p in both["pValues"]])
print("corr(temp, weekend) %.4f" % out["corrTempWeekend"], out["means"])
print("with event: slope %.4f R2 %.4f" % (with_event["slope"], with_event["r2"]))
print("predictions", {k: round(v, 3) for k, v in out["predictions"].items()})
print("hand", {k: round(v, 4) for k, v in out["hand"].items() if not isinstance(v, list)})
print("simple residuals", np.round(temp_only["residuals"], 2))
print("tomorrow 95% PI", np.round(out["tomorrowInterval"], 3))
print(f"wrote {len(samples)} random problems")
