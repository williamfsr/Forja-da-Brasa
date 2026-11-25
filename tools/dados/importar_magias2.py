#!/usr/bin/env python3
"""Importa as magias restantes das listas de Mago/Clérigo/Paladino do SRD 5.1 (dnd5e 6.1.x, CC-BY-4.0) para js/dados/magias_srd2.js.
Classe, círculo, nome pt-BR e texto vêm do SRD/tradução comunitária; o efeito no jogo vem de magias_spec.py (tabela curada).
Uso: importar_magias2.py <packs/_source> <compendium pt-BR> <saida.js>"""
import sys, os, re, json, glob, yaml, importlib.util
SRC, PT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
here = os.path.dirname(os.path.abspath(__file__))
sp = importlib.util.spec_from_file_location('magias_spec', os.path.join(here, 'magias_spec.py')); M = importlib.util.module_from_spec(sp); sp.loader.exec_module(M)
tr = json.load(open(f'{PT}/dnd5e.spells.json'))['entries']
def limpa(h):
    h = re.sub(r'\[\[/[a-z]+ ([^\]]+)\]\]\{([^}]*)\}', r'\2', h or ''); h = re.sub(r'\[\[/[a-z]+ ([^\]]+)\]\]', r'\1', h); h = re.sub(r'@\w+\[[^\]]*\]\{([^}]*)\}', r'\1', h); h = re.sub(r'@\w+\[([^\]]*)\]', r'\1', h)
    h = re.sub(r'<[^>]+>', ' ', h); h = re.sub(r'&[a-z]+;', ' ', h); return re.sub(r'\s+', ' ', h).strip()
CL = {'Wizard Spells': 'mago', 'Sorcerer Spells': 'mago', 'Warlock Spells': 'mago', 'Cleric Spells': 'clerigo', 'Paladin Spells': 'paladino'}
rules = yaml.safe_load(open(f'{SRC}/rules/chapter-10-spellcasting.yml')); listas = {}
for p in rules['pages']:
    c = CL.get(p['name'])
    if not c: continue
    for ref in p['system'].get('spells', []): listas.setdefault(ref.split('.')[-1], set()).add(c)
def slug(en): return 'm_' + re.sub(r'[^a-z0-9]+', '_', en.lower()).strip('_')
out = []; feitas = set()
for f in sorted(glob.glob(f'{SRC}/spells/*/*.yml')):
    if os.path.basename(f).startswith('_'): continue
    y = yaml.safe_load(open(f)); en = y['name']; spec = M.SPEC.get(en)
    if not spec: continue
    cls = sorted(listas.get(y['_id'], []))
    if not cls: print('sem classe:', en); continue
    s = y['system']; pt = tr.get(en) or {}; ativ = s.get('activation') or {}
    o = {'id': slug(en), 'nome': pt.get('name') or en, 'en': en, 'nv': s.get('level', 0), 'cls': cls, 'desc': limpa(pt.get('description') or s.get('description', {}).get('value', ''))[:420]}
    if ativ.get('type') in ('bonus', 'reaction') or spec.get('bonus'): o['bonus'] = 1
    o.update({k: v for k, v in spec.items() if v is not None})
    if isinstance(o.get('ef'), dict) and o['ef'].pop('bonus', None): o['bonus'] = 1
    if o.get('ex') is not None and o.get('tipo') is None: o['tipo'] = 'util'
    if o.get('tipo') is None: o['tipo'] = 'util'
    if 'geo' not in o: o['geo'] = {'f': 'self'}
    if o['tipo'] == 'util': o['util'] = 1
    o['conc'] = 1 if (s.get('properties') and 'concentration' in s['properties']) else 0
    out.append(o); feitas.add(en)
falta = sorted(set(M.SPEC) - feitas)
if falta: print('SEM ARQUIVO NO SRD:', falta)
out.sort(key=lambda o: (o['nv'], o['nome']))
open(OUT, 'w', encoding='utf8').write('// gerado por tools/dados/importar_magias2.py — magias restantes do SRD 5.1 (CC-BY-4.0), nomes/textos da tradução comunitária dnd5e-pt-br; efeitos em jogo: tools/dados/magias_spec.py\nexport const MAGIAS_SRD2 = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
from collections import Counter
print(len(out), 'magias;', Counter(o['tipo'] for o in out)); print(Counter(o['nv'] for o in out))
