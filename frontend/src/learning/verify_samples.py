"""Independent HiGHS reference values; regenerate with Python + scipy.
The TS test consumes this fixture; it does not compute its own expected answers.
"""
import json
import random
from pathlib import Path
from scipy.optimize import linprog

rng = random.Random(20261011)
params = [dict(a=40, b=50, b1=100, b2=80), dict(a=80, b=40, b1=100, b2=80)]
for _ in range(100):
    params.append(dict(a=rng.randint(0, 80), b=rng.randint(0, 80),
                       b1=rng.randint(0, 120), b2=rng.randint(0, 120)))
params += [dict(a=a, b=b, b1=c, b2=d) for a,b in [(0,0),(0,50),(40,0)]
           for c,d in [(0,0),(0,80),(100,0),(1,1),(120,120)]]
samples = []
for p in params:
    result = linprog([-p['a'], -p['b']], A_ub=[[2,1],[1,2]],
                     b_ub=[p['b1'],p['b2']], bounds=[(0,None),(0,None)], method='highs')
    assert result.success, result.message
    integer = linprog([-p['a'], -p['b']], A_ub=[[2,1],[1,2]],
                      b_ub=[p['b1'],p['b2']], bounds=[(0,None),(0,None)],
                      integrality=[1,1], method='highs')
    assert integer.success, integer.message
    samples.append(dict(parameters=p, value=-result.fun, integerValue=-integer.fun))
Path(__file__).with_name('verified-samples.json').write_text(json.dumps(samples, indent=2)+'\n')
print(f'Generated {len(samples)} LP and integer independent HiGHS reference pairs')
