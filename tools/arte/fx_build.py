#!/usr/bin/env python3
"""Extrai efeitos escolhidos do JB2A (CC BY-NC-SA 4.0), converte em folhas de sprites webp e gera js/dados/fx_dados.js.
uso: fx_build.py <jb2a_inner.zip> <jb2a_index.json> <outdir_assets_fx> <saida_js>"""
import sys, json, zlib, mmap, os, subprocess, glob, math, shutil
from PIL import Image
zp, ip, out, js = sys.argv[1:5]
idx = {e['name'].split('Library/', 1)[1]: e for e in json.load(open(ip)) if 'Library/' in e['name'] and e.get('usize')}
_f = open(zp, 'rb'); mm = mmap.mmap(_f.fileno(), 0, access=mmap.ACCESS_READ)
def ler(rel):
    e = idx[rel]; raw = mm[e['start']:e['start'] + e['csize']]
    return zlib.decompress(raw, -15) if e['meth'] == 8 else bytes(raw)
G = 'Generic/'; M = G + 'Weapon_Attacks/Melee/'
# id: (arquivo, tipo, largura, altura, quadros)
PONTO, FEIXE, GOLPE = 'ponto', 'feixe', 'golpe'
LISTA = {
 'fogo': (G + 'Explosion/Explosion_01_Orange_400x400.webm', PONTO, 128, 128, 14),
 'bola_fogo': ('3rd_Level/Fireball/FireballExplosion_01_Orange_800x800.webm', PONTO, 192, 192, 16),
 'gelo': (G + 'Impact/FrostImpact_01_Regular_White_600x600.webm', PONTO, 160, 160, 16),
 'trovao': ('1st_Level/Thunderwave/Thunderwave_01_Bright_Blue_Center_600x600.webm', PONTO, 192, 192, 16),
 'cura': (G + 'Healing/HealingAbility_01_Green_400x400.webm', PONTO, 128, 128, 16),
 'cura_azul': ('1st_Level/Cure_Wounds/CureWounds_01_Blue_400x400.webm', PONTO, 128, 128, 16),
 'radiante': ('Cantrip/Sacred_Flame/SacredFlameTarget_01_Regular_Yellow_400x400.webm', PONTO, 128, 128, 16),
 'necrotico': ('Cantrip/Toll_The_Dead/TollTheDeadShockwave_01_Regular_Green_400x400.webm', PONTO, 128, 128, 14),
 'forca': (G + 'Explosion/Explosion_02_Blue_400x400.webm', PONTO, 128, 128, 14),
 'escudo': ('1st_Level/Shield/Shield_01_Regular_Blue_Complete_400x400.webm', PONTO, 128, 128, 16),
 'castigo': ('2nd_Level/Divine_Smite/DivineSmite_01_Regular_BlueYellow_Target_400x400.webm', PONTO, 128, 128, 14),
 'veneno': (G + 'Marker/MarkerPoison_01_Dark_Green_400x400.webm', PONTO, 128, 128, 14),
 'raio': (G + 'Lightning/LightningBall_01_Regular_Blue_400x400.webm', PONTO, 128, 128, 14),
 'corte': (M + 'Slash02/GenericSlash02_001_001_Blue_800x600.webm', GOLPE, 160, 120, 12),
 'pancada': (G + 'Impact/Impact013/Impact013_001_OrangeYellow_400x400.webm', PONTO, 128, 128, 10),
 'estocada': (G + 'Impact/Impact013/Impact013_003_OrangeYellow_400x400.webm', PONTO, 128, 128, 10),
 'garra': (M + 'GenericSlash01_01_Regular_Orange_800x600.webm', GOLPE, 160, 120, 12),
 'feixe_fogo': ('Cantrip/Fire_Bolt/FireBolt_01_Regular_Orange_30ft_1600x400.webm', FEIXE, 400, 100, 12),
 'feixe_gelo': ('Cantrip/Ray_Of_Frost/RayOfFrost_01_Regular_Blue_30ft_1600x400.webm', FEIXE, 400, 100, 12),
 'feixe_missil': ('1st_Level/Magic_Missile/MagicMissile_01_Regular_Purple_30ft_01_1600x400.webm', FEIXE, 400, 100, 12),
 'feixe_arcano': ('Cantrip/Eldritch_Blast/EldritchBlast_01_Regular_Purple_30ft_1600x400.webm', FEIXE, 400, 100, 12),
 'feixe_sagrado': ('1st_Level/Guiding_Bolt/GuidingBolt_01_Regular_BlueYellow_30ft_1600x400.webm', FEIXE, 400, 100, 12),
 'feixe_calor': ('2nd_Level/Scorching_Ray/ScorchingRay_01_Regular_Orange_30ft_1600x400.webm', FEIXE, 400, 100, 12),
 'feixe_raio': ('3rd_Level/Lightning_Bolt/LightningBolt_01_Regular_Blue_4000x200.webm', FEIXE, 1000, 50, 12),
 'feixe_flecha': (G + 'Weapon_Attacks/Ranged/Arrow01_01_Regular_Green_30ft_1600x400.webm', FEIXE, 400, 100, 12),
}
os.makedirs(out, exist_ok=True); W = '/tmp/fxw'; shutil.rmtree(W, ignore_errors=True); os.makedirs(W)
meta = {}
for fid, (rel, tipo, w, h, nq) in LISTA.items():
    if rel not in idx: print('FALTA', fid, rel); continue
    f = f'{W}/{fid}.webm'; open(f, 'wb').write(ler(rel))
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.strip() or 1)
    fps = nq / max(dur, 0.2); d = f'{W}/{fid}'; os.makedirs(d)
    for dec in ('libvpx', 'libvpx-vp9'):
        r = subprocess.run(['ffmpeg', '-v', 'error', '-c:v', dec, '-i', f, '-vf', f'fps={fps:.4f},scale={w}:{h}:flags=lanczos,format=rgba', f'{d}/%03d.png'], capture_output=True)
        if r.returncode == 0 and glob.glob(d + '/*.png'): break
    if r.returncode or not glob.glob(d + '/*.png'): print('FALHOU', fid, rel, flush=True); continue
    fr = sorted(glob.glob(d + '/*.png'))[:nq]; n = len(fr); cols = 4 if tipo != FEIXE or w < 600 and False else 2
    if tipo == FEIXE: cols = 2 if w <= 400 else 1
    elif tipo == GOLPE: cols = 4
    else: cols = 4
    rows = math.ceil(n / cols); sheet = Image.new('RGBA', (cols * w, rows * h), (0, 0, 0, 0))
    for i, p in enumerate(fr): sheet.paste(Image.open(p).convert('RGBA'), ((i % cols) * w, (i // cols) * h))
    sheet.save(f'{out}/{fid}.webp', 'WEBP', quality=78, method=5, alpha_quality=85)
    meta[fid] = {'w': w, 'h': h, 'n': n, 'cols': cols, 'ms': int(dur * 1000 * min(1, 1)), 't': tipo}
    print(fid, n, 'quadros', round(dur, 2), 's', os.path.getsize(f'{out}/{fid}.webp') // 1024, 'KB', flush=True)
open(js, 'w', encoding='utf8').write('// gerado por tools/arte/fx_build.py — folhas de sprite de animações JB2A (CC BY-NC-SA 4.0, https://www.jb2a.com)\nexport const FX = ' + json.dumps(meta, ensure_ascii=False) + ';\n')
print('total', sum(os.path.getsize(p) for p in glob.glob(out + '/*.webp')) // 1024, 'KB')
