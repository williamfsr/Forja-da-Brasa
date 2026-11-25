#!/usr/bin/env python3
"""Importa os itens do SRD 5.1 (dnd5e 6.1.x, CC-BY-4.0) para js/dados/itens_srd.js, com nomes/descrições em português (tradução da comunidade).
Uso: importar_itens.py <packs/_source> <compendium pt-BR> <saida.js>"""
import sys, os, re, json, glob, yaml
SRC, PT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
tr = json.load(open(f'{PT}/dnd5e.items.json'))['entries']
tg = json.load(open(f'{PT}/dnd5e.tradegoods.json'))['entries']
def limpa(h):
    h = re.sub(r'\[\[/[a-z]+ ([^\]]+)\]\]\{([^}]*)\}', r'\2', h or ''); h = re.sub(r'\[\[/[a-z]+ ([^\]]+)\]\]', r'\1', h); h = re.sub(r'@\w+\[[^\]]*\]\{([^}]*)\}', r'\1', h); h = re.sub(r'@\w+\[([^\]]*)\]', r'\1', h)
    h = re.sub(r'<[^>]+>', ' ', h); h = re.sub(r'&[a-z]+;', ' ', h); return re.sub(r'\s+', ' ', h).strip()
COIN = {'cp': 0.01, 'sp': 0.1, 'ep': 0.5, 'gp': 1, 'pp': 10}
RAR = {'': 'comum', 'common': 'comum', 'uncommon': 'incomum', 'rare': 'raro', 'veryRare': 'épico', 'legendary': 'lendário', 'artifact': 'lendário'}
DT = {'slashing': 'cortante', 'piercing': 'perfurante', 'bludgeoning': 'contundente', 'fire': 'fogo', 'cold': 'gelo', 'lightning': 'elétrico', 'acid': 'ácido', 'poison': 'veneno', 'necrotic': 'necrótico', 'radiant': 'radiante', 'force': 'energia', 'thunder': 'trovão', 'psychic': 'psíquico'}
# base do jogo (já existem como espadaLonga etc. e suas versões _1.._3)
BASE_ARMA = {'quarterstaff': 'cajado', 'dagger': 'adaga', 'mace': 'maca', 'scimitar': 'cimitarra', 'shortsword': 'espadaCurta', 'handaxe': 'machadinha', 'rapier': 'rapieira', 'battleaxe': 'machadoBatalha', 'warhammer': 'martelo', 'longsword': 'espadaLonga', 'shortbow': 'arcoCurto', 'longbow': 'arcoLongo', 'greatsword': 'espadaGrande', 'greataxe': 'machadoGrande'}
BASE_ARM = {'padded': None, 'leather': 'couro', 'studded': 'couroBatido', 'chainshirt': 'camisaoMalha', 'scale': 'escamas', 'halfplate': 'meiaPlaca', 'chainmail': 'cotaMalha', 'splint': 'talas', 'plate': 'placas', 'shield': 'escudo'}
SLAY = {'dragon': ('dragao', 'dragões'), 'giant': ('gigante', 'gigantes')}
def slug(f): return 'i_' + re.sub(r'[^a-z0-9]+', '_', os.path.basename(f)[:-4]).strip('_')
def nome_pt(en): e = tr.get(en) or tg.get(en); return (e or {}).get('name') or en
def desc_pt(en, y): e = tr.get(en) or tg.get(en); return limpa((e or {}).get('description') or y['system'].get('description', {}).get('value', ''))[:360]
def preco(s): p = s.get('price') or {}; return round((p.get('value') or 0) * COIN.get(p.get('denomination') or 'gp', 1), 2)
def nv_loja(p, rar, mag):
    if rar == 'lendário': return 99
    if rar == 'épico': return 16
    if rar == 'raro': return 11
    if rar == 'incomum': return 5
    return 1 if p <= 20 else 2 if p <= 100 else 4 if p <= 500 else 7 if p <= 2000 else 10
def ic_de(tp, s, en):
    t = (s.get('type') or {}); b = t.get('baseItem') or ''; v = t.get('value') or ''; e = en.lower()
    if tp == 'arma':
        for k, i in [('bow', 'arco'), ('crossbow', 'besta'), ('sling', 'funda'), ('blowgun', 'zarabatana'), ('dagger', 'adaga'), ('sword', 'espada'), ('rapier', 'espada'), ('scimitar', 'espada'), ('axe', 'machado'), ('hammer', 'martelo'), ('maul', 'martelo'), ('mace', 'maca'), ('club', 'maca'), ('flail', 'maca'), ('morningstar', 'maca'), ('staff', 'cajado'), ('spear', 'lanca'), ('pike', 'lanca'), ('halberd', 'lanca'), ('glaive', 'lanca'), ('lance', 'lanca'), ('trident', 'lanca'), ('javelin', 'lanca'), ('whip', 'chicote'), ('dart', 'dardo'), ('net', 'rede'), ('pick', 'martelo'), ('sickle', 'foice')]:
            if k in (b or e): return i
        return 'espada'
    if tp == 'escudo': return 'escudo'
    if tp == 'armadura': return 'armadura_' + ('leve' if v == 'light' else 'media' if v == 'medium' else 'pesada')
    if tp == 'consumivel':
        if v == 'scroll': return 'pergaminho'
        if v == 'potion' or 'potion' in e or 'oil' in e or 'philter' in e or 'vial' in e or 'flask' in e or 'fire' in e: return 'pocao'
        if v == 'poison' : return 'veneno'
        if v == 'food' or 'ration' in e: return 'comida'
        if v == 'ammo': return 'flecha'
        return 'pocao'
    for k, i in [('ring', 'anel'), ('wand', 'varinha'), ('rod', 'bastao'), ('staff', 'cajado'), ('amulet', 'amuleto'), ('periapt', 'amuleto'), ('necklace', 'amuleto'), ('brooch', 'amuleto'), ('boots', 'botas'), ('cloak', 'capa'), ('cape', 'capa'), ('mantle', 'capa'), ('gloves', 'luvas'), ('gauntlet', 'luvas'), ('bracers', 'luvas'), ('helm', 'elmo'), ('circlet', 'elmo'), ('hat', 'elmo'), ('headband', 'elmo'), ('belt', 'cinto'), ('ioun', 'gema'), ('gem', 'gema'), ('crystal', 'gema'), ('orb', 'gema'), ('bag', 'bolsa'), ('book', 'livro'), ('tome', 'livro'), ('key', 'chave'), ('rope', 'corda'), ('torch', 'tocha'), ('lantern', 'lampiao'), ('lamp', 'lampiao'), ('tent', 'tenda'), ('pack', 'mochila'), ('kit', 'mochila'), ('tools', 'ferramenta'), ('supplies', 'ferramenta'), ('lute', 'musica'), ('lyre', 'musica'), ('flute', 'musica'), ('drum', 'musica'), ('horn', 'musica'), ('pipes', 'musica'), ('viol', 'musica'), ('dulcimer', 'musica'), ('shawm', 'musica'), ('clothes', 'roupa'), ('robe', 'roupa'), ('mirror', 'espelho'), ('lock', 'chave'), ('holy', 'simbolo'), ('symbol', 'simbolo'), ('amulet', 'amuleto'), ('bell', 'sino'), ('whistle', 'sino'), ('bottle', 'pocao'), ('vial', 'pocao'), ('flask', 'pocao'), ('arrow', 'flecha'), ('bolt', 'flecha')]:
        if k in e: return i
    return 'saco' if tp == 'tesouro' else 'gema'
def efeito_extra(y, en):
    d = (y['system'].get('description') or {}).get('value', ''); d = limpa(d)
    m = re.search(r'extra (\d+d\d+) (\w+) damage', d, re.I)
    if m and m.group(2).lower() in DT: return {'dado': m.group(1), 'dano': DT[m.group(2).lower()]}
    m = re.search(r'additional (\d+d\d+) (\w+) damage', d, re.I)
    if m and m.group(2).lower() in DT: return {'dado': m.group(1), 'dano': DT[m.group(2).lower()]}
    return None
# acessórios com efeito mecânico no jogo (nome inglês → campos). Os demais viram tesouro (valem ouro, sem efeito).
GIGANTE = {'Hill': 21, 'Stone': 23, 'Frost': 23, 'Fire': 25, 'Cloud': 27, 'Storm': 29}
ACESS = {'Cloak of Protection': {'ca': 1}, 'Ring of Protection': {'ca': 1}, 'Ring of Evasion': {'ini': 2}, 'Ring of Free Action': {'ini': 1}, 'Brooch of Shielding': {'ca': 1}, 'Ioun Stone of Protection': {'ca': 1}, 'Ioun Stone of Regeneration': {'regen': 1}, 'Ioun Stone of Agility': {'minAtr': {'DES': 20}},
  'Ioun Stone of Fortitude': {'minAtr': {'CON': 20}}, 'Ioun Stone of Insight': {'minAtr': {'SAB': 20}}, 'Ioun Stone of Intellect': {'minAtr': {'INT': 20}}, 'Ioun Stone of Leadership': {'minAtr': {'CAR': 20}}, 'Ioun Stone of Strength': {'minAtr': {'FOR': 20}},
  'Helm of Brilliance': {'ca': 1}, 'Boots of Striding and Springing': {'ini': 1}, 'Cloak of Displacement': {'ca': 1}, 'Mantle of Spell Resistance': {'ca': 1}, 'Belt of Dwarvenkind': {'minAtr': {'CON': 19}}, 'Ring of Warmth': {'ca': 0}}
for k, v in GIGANTE.items(): ACESS[f'Belt of {k} Giant Strength'] = {'minAtr': {'FOR': v}}
SKIP_JA_NO_JOGO = {'Amulet of Health', 'Gauntlets of Ogre Power', 'Headband of Intellect', 'Boots of Speed', 'Cloak of Elvenkind', 'Bracers of Defense', 'Ring of Regeneration', 'Potion of Healing', 'Potion of Greater Healing', 'Potion of Superior Healing', 'Potion of Supreme Healing', "Alchemist's Fire", 'Spell Scroll 3rd Level'}
out = []; vistos = set()
def add(r):
    if r['id'] in vistos: return
    vistos.add(r['id']); out.append(r)
for pasta in ['weapon', 'armor', 'equipment', 'ring', 'wand', 'rod', 'potion', 'scroll', 'ammunition', 'poison', 'food', 'tool', 'spellcasting-focus', 'loot', 'trinket', 'container', 'equipment-packs']:
    for f in sorted(glob.glob(f'{SRC}/items/{pasta}/*.yml')):
        y = yaml.safe_load(open(f)); 
        if not y or 'system' not in y or y.get('type') in (None, 'container') and pasta == 'container': continue
        s = y['system']; en = y['name']
        if en in ('Weapon', 'Armor', 'Equipment', 'Ring', 'Wand', 'Rod', 'Potion', 'Scroll', 'Ammunition', 'Poison', 'Food', 'Tool', 'Container', 'Equipment Packs', 'Spellcasting Focus', 'Loot', 'Trinket'): continue
        t = s.get('type') or {}; v = t.get('value') or ''; b = t.get('baseItem') or ''; rar = RAR.get(s.get('rarity') or '', 'comum'); p = preco(s); props = s.get('properties') or []
        r = {'id': slug(f), 'n': nome_pt(en), 'en': en, 'p': p, 'r': rar, 'w': (s.get('weight') or {}).get('value') or 0, 'd': desc_pt(en, y)}
        mag = 'mgc' in props or bool(s.get('magicalBonus'))
        bonus = int(s.get('magicalBonus') or 0) if str(s.get('magicalBonus') or '').lstrip('-').isdigit() else 0
        m = re.search(r'\+(\d)$', en)
        if m and not bonus: bonus = int(m.group(1))
        if pasta == 'weapon':
            dm = (s.get('damage') or {}).get('base') or {}; num = dm.get('number'); den = dm.get('denomination'); tipos = dm.get('types') or []
            if not den: continue
            if b in BASE_ARMA and bonus and en == f'{(tr.get(en) or {}).get("name", "")}': pass
            if b in BASE_ARMA and (bonus or not mag): continue  # +1/+2/+3 genéricos e a base já existem no jogo
            if re.search(r' \+\d$', en) and b in BASE_ARMA: continue
            r.update(tp='arma', dado=f'{num or 1}d{den}', dt=DT.get(tipos[0], 'cortante') if tipos else 'cortante', acu='fin' in props, dist=v.endswith('R'), duas='two' in props, mag=bonus, ic=ic_de('arma', s, en))
            vers = (s.get('damage') or {}).get('versatile') or {}
            if vers.get('denomination'): r['vers'] = f"{vers.get('number') or 1}d{vers['denomination']}"
            if 'rch' in props: r['alc'] = 2
            if 'thr' in props: r['thr'] = 1
            if 'hvy' in props: r['pesada'] = 1
            ex = efeito_extra(y, en)
            if ex and not re.search(r'sharpness|wounding|life stealing|vicious|venom', en, re.I): r['extra'] = ex
            for k, (tg_, nm) in SLAY.items():
                if f'{k.capitalize()} Slayer' in en or (en.startswith('Giant Slayer') and k == 'giant'): r['contra'] = {'tp': tg_, 'dado': '3d6'}; r['extra'] = None
            if 'Dwarven Thrower' in en: r['contra'] = {'tp': 'gigante', 'dado': '1d8'}
            if 'Vicious' in en: r['vicioso'] = 1
            if en.startswith('Sun Blade') or 'Sunblade' in en: r['extra'] = {'dado': '1d8', 'dano': 'radiante'}
            r = {k: v2 for k, v2 in r.items() if v2 is not None}
        elif pasta == 'armor' or (pasta == 'equipment' and v in ('light', 'medium', 'heavy', 'shield')):
            ar = s.get('armor') or {}; base = ar.get('value') or 0
            if v == 'shield': 
                if b == 'shield' and (bonus or not mag): continue
                r.update(tp='escudo', ca=2 + bonus if not mag or bonus else 2, mag=bonus, ic='escudo')
            else:
                if re.search(r' \+\d$', en) and b in BASE_ARM: continue
                if b in BASE_ARM and not mag and en in ('Leather Armor', 'Studded Leather Armor', 'Chain Shirt', 'Scale Mail', 'Half Plate Armor', 'Chain Mail', 'Splint Armor', 'Plate Armor'): continue
                cat = {'light': 'leve', 'medium': 'media', 'heavy': 'pesada'}[v]
                if not base: continue
                r.update(tp='armadura', cat=cat, base=base + (0 if not bonus else 0), dexMax=99 if v == 'light' else 2 if v == 'medium' else 0, arm={'light': 1, 'medium': 2, 'heavy': 3}[v], mag=bonus, forca=ar.get('value') and (s.get('strength') or 0) or 0, furtivo='stealthDisadvantage' in props, ic=ic_de('armadura', s, en))
                if v == 'heavy' and b == 'plate' and False: pass
        elif pasta == 'potion' or (pasta == 'poison'):
            heal = None
            for a in (s.get('activities') or {}).values():
                if a.get('type') == 'heal' and a.get('healing'): h = a['healing']; heal = f"{h.get('number') or 1}d{h.get('denomination') or 4}" + (f"+{h['bonus']}" if h.get('bonus') else '')
            dmg = None
            for a in (s.get('activities') or {}).values():
                if a.get('type') in ('attack', 'save') and a.get('damage') and a['damage'].get('parts'):
                    pp = a['damage']['parts'][0]
                    if pp.get('denomination'): dmg = (f"{pp.get('number') or 1}d{pp['denomination']}", DT.get((pp.get('types') or ['fire'])[0], 'fogo'))
            if en in SKIP_JA_NO_JOGO: continue
            MAN = {'Acid (vial)': dict(dano='2d6', danoTipo='ácido'), 'Flask of Holy Water': dict(dano='2d6', danoTipo='radiante', alvoTp=['morto', 'infero']), 'Restorative Ointment': dict(cura='2d8+2'), 'Antitoxin': {}}
            if en in MAN and MAN[en]: r.update(tp='consumivel', ic='pocao', **MAN[en])
            elif heal: r.update(tp='consumivel', cura=heal, ic='pocao')
            elif dmg and pasta == 'potion': r.update(tp='consumivel', dano=dmg[0], danoTipo=dmg[1], ic='pocao')
            else: r.update(tp='tesouro', ic=ic_de('tesouro', s, en))
        elif pasta == 'scroll':
            if en in SKIP_JA_NO_JOGO: continue
            nv = re.search(r'(\d)(st|nd|rd|th) Level', en); r.update(tp='tesouro', ic='pergaminho', nvMagia=int(nv.group(1)) if nv else 0)
        elif pasta in ('equipment', 'ring', 'wand', 'rod'):
            if en in SKIP_JA_NO_JOGO: continue
            ef = ACESS.get(en); m2 = re.match(r'Wand of the War Mage \+(\d)', en)
            if m2: ef = {'bonusMagia': int(m2.group(1))}
            if ef is not None and pasta != 'wand' or m2: r.update(tp='acessorio', ic=ic_de('acessorio', s, en), **ef)
            elif 'Clothes' in en or v in ('clothing',) and not mag or 'Saddle' in en or 'Bridle' in en: r.update(tp='tesouro', ic=ic_de('tesouro', s, en))
            else: r.update(tp='tesouro', ic=ic_de('tesouro', s, en), magico=1)
        else:
            r.update(tp='tesouro', ic=ic_de('tesouro', s, en))
        if 'tp' not in r: continue
        r['nv'] = nv_loja(p, rar, mag) if r['tp'] not in ('tesouro',) else 1
        add(r)
open(OUT, 'w').write('// Gerado por tools/dados/importar_itens.py a partir do SRD 5.1 (CC-BY-4.0) via dnd5e 6.1.x e tradução pt-BR da comunidade. Não edite à mão.\nexport const ITENS_SRD = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
import collections; print(len(out), collections.Counter(r['tp'] for r in out))
