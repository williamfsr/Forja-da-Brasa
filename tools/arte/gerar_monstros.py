import sys, re, json, os, math, random
from pintor import *
from monstros_tok import *
import regras_tok as RT
from PIL import Image
src, out = sys.argv[1], sys.argv[2]; filtro = sys.argv[3] if len(sys.argv) > 3 else None
t = open(src).read(); D = json.loads(t[t.index('= ') + 2:].rstrip(';\n'))
os.makedirs(out, exist_ok=True)
def plano_de(i, tp):
    if re.search(r'_dragon(_wyrmling)?$', i): return RT.dragao_de(i)
    if i in RT.FANT: return ('fantasma', RT.FANT[i])
    m = re.match(r'swarm_of_(\w+)$', i)
    if m: return ('ENXAME', RT.ENXAME[m.group(1)])
    for pat, val in RT.REGRAS:
        if re.search(pat, i):
            if val is None: continue
            return (val, {}) if isinstance(val, str) else val
    return RT.POR_TIPO.get(tp) or ('humanoide', {})
def desenhar(i, tp):
    pl, pr = plano_de(i, tp); r = rnd(i); T = Tela()
    if pl == 'ENXAME':
        base, par = pr; sub = Tela(); PLANOS[base](sub, dict(par, esc=par.get('esc', 1.0) * 0.8), r); mini = sub.img.resize((int(T.N * 0.46),) * 2, Image.LANCZOS)
        pos = [(0.27, 0.27), (0.62, 0.22), (0.36, 0.5), (0.7, 0.55), (0.2, 0.68), (0.5, 0.76), (0.46, 0.04)]
        for k, (fx, fy) in enumerate(pos):
            im = mini.rotate(r.uniform(-50, 50), resample=Image.BICUBIC); T.img.alpha_composite(im, (int(fx * T.N - im.width * 0.5), int(fy * T.N - im.height * 0.5)))
        return T
    if isinstance(pl, str) and pl.startswith('HIBRIDO:'):
        b, pb, tp2, pt2, dy = RT.HIB[pl.split(':')[1]]; PLANOS[b](T, pb, r); sub = Tela(); PLANOS[tp2](sub, pt2, r); mini = sub.img.resize((int(T.N * 0.72),) * 2, Image.LANCZOS)
        T.img.alpha_composite(mini, (int(T.N * 0.14), int(T.N * 0.02) + int(dy * SS)))
        return T
    PLANOS[pl](T, pr, r); return T
n = 0
for k, v in D.items():
    i = k[2:]
    if filtro and not re.search(filtro, i): continue
    if os.environ.get('PULAR') and os.path.exists(f'{out}/{i}.webp'): continue
    T = desenhar(i, v['tp']); T.final(f'{out}/{i}.webp', q=80); n += 1
print(n, 'tokens')
