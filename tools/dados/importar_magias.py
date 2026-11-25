#!/usr/bin/env python3
"""Importa magias de dano/cura do SRD 5.1 (dnd5e 6.1.x, CC-BY-4.0) para js/dados/magias_srd.js, em português (tradução da comunidade).
Uso: importar_magias.py <packs/_source> <compendium pt-BR> <saida.js>"""
import sys, os, re, json, glob, yaml, math
SRC, PT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
tr = json.load(open(f'{PT}/dnd5e.spells.json'))['entries']
def limpa(h):
    h = re.sub(r'\[\[/[a-z]+ ([^\]]+)\]\]\{([^}]*)\}', r'\2', h or ''); h = re.sub(r'\[\[/[a-z]+ ([^\]]+)\]\]', r'\1', h); h = re.sub(r'@\w+\[[^\]]*\]\{([^}]*)\}', r'\1', h); h = re.sub(r'@\w+\[([^\]]*)\]', r'\1', h)
    h = re.sub(r'<[^>]+>', ' ', h); h = re.sub(r'&[a-z]+;', ' ', h); return re.sub(r'\s+', ' ', h).strip()
JA = {'Fire Bolt', 'Ray of Frost', 'Sacred Flame', 'Magic Missile', 'Burning Hands', 'Sleep', 'Scorching Ray', 'Acid Arrow', "Melf's Acid Arrow", 'Fireball', 'Lightning Bolt', 'Ice Storm', 'Blight', 'Cone of Cold', 'Cloudkill', 'Chain Lightning', 'Disintegrate', 'Finger of Death', 'Sunburst', 'Meteor Swarm', 'Power Word Kill', 'Charm Person', 'Calm Emotions', 'Fear', 'Dominate Person', 'Cure Wounds', 'Healing Word', 'Guiding Bolt', 'Bless', 'Inflict Wounds', 'Divine Favor', 'Spiritual Weapon', 'Spirit Guardians', 'Flame Strike', 'Mass Cure Wounds', 'Heal', 'Sunbeam', 'Fire Storm', 'Mass Heal'}
DT = {'fire': 'fogo', 'cold': 'gelo', 'lightning': 'elétrico', 'thunder': 'trovão', 'acid': 'ácido', 'poison': 'veneno', 'necrotic': 'necrótico', 'radiant': 'radiante', 'force': 'força', 'psychic': 'psíquico', 'bludgeoning': 'fis', 'piercing': 'fis', 'slashing': 'fis'}
ATR = {'str': 'FOR', 'dex': 'DES', 'con': 'CON', 'int': 'INT', 'wis': 'SAB', 'cha': 'CAR'}
CL = {'Wizard Spells': 'mago', 'Sorcerer Spells': 'mago', 'Warlock Spells': 'mago', 'Cleric Spells': 'clerigo', 'Paladin Spells': 'paladino'}
rules = yaml.safe_load(open(f'{SRC}/rules/chapter-10-spellcasting.yml'))
listas = {}  # _id -> set(classes)
for p in rules['pages']:
    c = CL.get(p['name'])
    if not c: continue
    for ref in p['system'].get('spells', []): listas.setdefault(ref.split('.')[-1], set()).add(c)
NAO = {'Contact Other Plane', 'Dream', 'Geas', 'Control Water', 'Faithful Hound', 'Glyph of Warding', 'Symbol', "Heroes' Feast", 'Prismatic Wall', 'Insect Plague', 'Delayed Blast Fireball'}
def slug(en): return 'm_' + re.sub(r'[^a-z0-9]+', '_', en.lower()).strip('_')
def dados(parts):
    out = []
    for q in parts:
        n, d, b = q.get('number'), q.get('denomination'), q.get('bonus') or ''
        if n and d: out.append(f'{n}d{d}' + (f'+{b}' if str(b).strip().isdigit() else ''))
        elif q.get('custom', {}).get('enabled'): return None
    return '+'.join(out) if out else None
def tipo_dano(parts):
    for q in parts:
        for t in q.get('types') or []:
            if t in DT: return DT[t]
    return None
def up_de(parts):
    q = parts[0] if parts else None
    if not q: return None
    s = q.get('scaling') or {}
    if s.get('mode') == 'whole' and q.get('denomination'): return f"{s.get('number') or 1}d{q['denomination']}"
    if s.get('formula'):
        m = re.match(r'(\d+)d(\d+)', str(s['formula']));
        if m: return f'{m.group(1)}d{m.group(2)}'
    return None
def geo_de(y, tipo):
    s = y['system']; rg = s.get('range') or {}; v = str(rg.get('value') or '').strip(); un = rg.get('units')
    ft = int(v) if v.isdigit() else (1 if un == 'touch' else 0)
    if un == 'mi': ft = 5000
    alc = max(1, min(9, round(ft / 10))) if ft else 1
    t = (s.get('target') or {}).get('template') or {}; ty = t.get('type'); sz = int(t.get('size') or 0) if str(t.get('size') or '').isdigit() else 0
    if un == 'self' and ty in ('cone', 'line') : return {'f': 'cone' if ty == 'cone' else 'linha', 'len': max(2, min(8, round(sz / 10)))}
    if ty in ('sphere', 'cube', 'cylinder', 'radius', 'square'): return {'f': 'circulo', 'alc': alc if un != 'self' else 0, 'raio': max(1, min(4, round((sz if ty != 'cube' and ty != 'square' else sz / 2) / 10)))} if un != 'self' else {'f': 'circulo', 'alc': 1, 'raio': max(1, min(3, round(sz / 10)))}
    if ty == 'cone': return {'f': 'cone', 'len': max(2, min(6, round(sz / 10)))}
    if ty == 'line': return {'f': 'linha', 'len': max(3, min(8, round(sz / 10)))}
    return {'f': 'ponto', 'alc': alc}
out = []; ignor = []
for f in sorted(glob.glob(f'{SRC}/spells/*/*.yml')):
    if os.path.basename(f).startswith('_'): continue
    y = yaml.safe_load(open(f)); en = y['name']; s = y['system']
    if en in JA or en in NAO: continue
    cls = sorted(listas.get(y['_id'], []))
    if not cls: continue
    acts = list((s.get('activities') or {}).values()); lv = s.get('level', 0)
    sp = None
    for a in acts:
        t = a.get('type'); dm = a.get('damage') or {}; parts = dm.get('parts') or []
        if t == 'heal':
            h = a.get('healing') or {}; d = dados([h]) if h.get('number') else None
            if d: sp = {'tipo': 'cura', 'dado': d, 'up': up_de([h])}; break
        elif t == 'attack' and parts and dados(parts):
            sp = {'tipo': 'atq', 'dado': dados(parts), 'dano': tipo_dano(parts) or 'arcano', 'up': up_de(parts)}; break
        elif t == 'save' and parts and dados(parts):
            sv = a.get('save') or {}; ab = (sv.get('ability') or [''])[0] if isinstance(sv.get('ability'), list) else sv.get('ability')
            sp = {'tipo': 'salva', 'atr': ATR.get(ab, 'DES'), 'dado': dados(parts), 'dano': tipo_dano(parts) or 'arcano', 'metade': dm.get('onSave') == 'half', 'up': up_de(parts)}; break
    if not sp: ignor.append(en); continue
    if 'paladino' in cls and sp['tipo'] != 'cura' and lv > 0 and len(cls) == 1: pass
    pt = tr.get(en) or {}
    geo = geo_de(y, sp['tipo'])
    if sp['tipo'] == 'cura': geo = {'f': 'aliado', 'alc': 1 if (s.get('range') or {}).get('units') == 'touch' else geo.get('alc', 5)}
    o = {'id': slug(en), 'nome': pt.get('name') or en, 'en': en, 'nv': lv, **{k: v for k, v in sp.items() if v is not None}, 'cls': cls, 'desc': limpa(pt.get('description') or s.get('description', {}).get('value', ''))[:300], 'geo': geo}
    if lv == 0: o.pop('up', None)
    out.append(o)

# ---- controle e buffs curados: en -> especificação (o resto — classe, nível, nome, texto — vem do SRD) ----
CTRL = {
  'Hideous Laughter': dict(atr='SAB', cond='paralisado', dur=2, geo={'f': 'ponto', 'alc': 6}),
  'Blindness/Deafness': dict(atr='CON', cond='cego', dur=3, geo={'f': 'ponto', 'alc': 6}),
  'Hold Person': dict(atr='SAB', cond='paralisado', dur=3, so='humanoide', geo={'f': 'ponto', 'alc': 6}),
  'Entangle': dict(atr='FOR', cond='contido', dur=3, geo={'f': 'circulo', 'alc': 6, 'raio': 2}),
  'Web': dict(atr='DES', cond='contido', dur=3, geo={'f': 'circulo', 'alc': 6, 'raio': 2}),
  'Hypnotic Pattern': dict(atr='SAB', cond='paralisado', dur=2, geo={'f': 'circulo', 'alc': 6, 'raio': 2}),
  'Hold Monster': dict(atr='SAB', cond='paralisado', dur=3, geo={'f': 'ponto', 'alc': 6}),
  'Banishment': dict(atr='CAR', cond='paralisado', dur=4, geo={'f': 'ponto', 'alc': 6}),
  'Slow': dict(atr='SAB', cond='lento', dur=4, geo={'f': 'circulo', 'alc': 6, 'raio': 2}),
  'Power Word Stun': dict(atr=None, cond='atordoado', dur=2, limite=150, geo={'f': 'ponto', 'alc': 6}),
  'Command': dict(atr='SAB', cond='paralisado', dur=1, geo={'f': 'ponto', 'alc': 6}),
}
BUFF = {
  'Shield of Faith': dict(buff='escudo_fe', ca=2, geo={'f': 'aliado', 'alc': 6}),
  'Mage Armor': dict(buff='armadura_mago', geo={'f': 'self'}),
  'Haste': dict(buff='acelerado', ca=2, geo={'f': 'aliado', 'alc': 6}),
  'Aid': dict(buff='ajuda', pv=5, geo={'f': 'aliados', 'alc': 5, 'max': 3}),
  'Heroism': dict(buff='heroismo', pv=3, geo={'f': 'aliado', 'alc': 6}),
}
for f in sorted(glob.glob(f'{SRC}/spells/*/*.yml')):
    if os.path.basename(f).startswith('_'): continue
    y = yaml.safe_load(open(f)); en = y['name']
    spec = CTRL.get(en) or BUFF.get(en)
    if not spec: continue
    cls = sorted(listas.get(y['_id'], []))
    if not cls: continue
    pt = tr.get(en) or {}; s_ = y['system']
    o = {'id': slug(en), 'nome': pt.get('name') or en, 'en': en, 'nv': s_.get('level', 1), 'tipo': 'ctrl' if en in CTRL else 'buff', 'cls': cls, 'desc': limpa(pt.get('description') or s_.get('description', {}).get('value', ''))[:300]}
    o.update({k: v for k, v in spec.items() if v is not None}); out.append(o)

open(OUT, 'w', encoding='utf8').write('// gerado por tools/dados/importar_magias.py — magias de dano/cura do SRD 5.1 (CC-BY-4.0), nomes e textos da tradução comunitária dnd5e-pt-br\nexport const MAGIAS_SRD = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
from collections import Counter
print(len(out), 'magias;', Counter(o['tipo'] for o in out), Counter(o['nv'] for o in out)); print('ignoradas (sem dano/cura):', len(ignor))
