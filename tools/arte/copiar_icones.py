#!/usr/bin/env python3
"""Copia (renderiza em webp 64px, branco sobre transparente) os ícones do dnd5e liberados para redistribuição:
CC BY 3.0 / CC0 (game-icons.net, Noun Project). Ignora mikiko.art (CC BY-NC-SA), spell-tiers (Rexard) e ui/official (WotC).
uso: copiar_icones.py <dnd5e>/icons <saida> """
import re, sys, subprocess, io, os, json, fnmatch
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
lic = open(os.path.join(src, 'LICENSE'), encoding='utf8').read()
secoes = re.split(r'\n={10,}\n', lic)
ok = []   # (padrão, texto de crédito)
atual = None
for ln in lic.splitlines():
    if ln.startswith('Icons from mikiko'): atual = 'skip'
    elif ln.startswith('SVG Icons from Game-Icons'): atual = 'gi'
    elif ln.startswith('SVG Icons from Noun'): atual = 'noun'
    m = re.match(r'^(/svg/\S+)\s+-\s+(.*)$', ln)
    if m and atual in ('gi', 'noun'): ok.append((m.group(1), m.group(2)))
    m2 = re.match(r'^(/svg/\S+)\s*$', ln)
os.makedirs(out, exist_ok=True)
cred = []; n = 0
for pad, txt in ok:
    pat = os.path.join(src, pad.lstrip('/'))
    import glob
    for f in glob.glob(pat):
        rel = os.path.relpath(f, os.path.join(src, 'svg'))[:-4]
        s = open(f, encoding='utf8').read().replace('var(--icon-fill, #fff)', '#ffffff')
        s = s.replace('var(--icon-fill,#fff)', '#ffffff')
        png = subprocess.run(['rsvg-convert', '-w', '64', '-h', '64', '-f', 'png'], input=s.encode(), capture_output=True).stdout
        if not png: print('falhou', rel); continue
        im = Image.open(io.BytesIO(png)).convert('RGBA')
        d = os.path.join(out, os.path.dirname(rel)); os.makedirs(d, exist_ok=True)
        im.save(os.path.join(out, rel + '.webp'), 'WEBP', quality=88, method=6)
        cred.append(f'{rel}: {txt}'); n += 1
open(os.path.join(out, 'CREDITOS.txt'), 'w', encoding='utf8').write('Ícones © seus autores, copiados do sistema dnd5e para Foundry VTT (MIT; ícones sob as licenças abaixo).\nCC BY 3.0: https://creativecommons.org/licenses/by/3.0/ — game-icons.net e The Noun Project.\n\n' + '\n'.join(sorted(set(cred))) + '\n')
print(n, 'ícones')
