#!/usr/bin/env python3
"""Converte os monstros do SRD 5.1 (dnd5e 6.1.x, packs/_source/monsters) + tradução pt-BR para js/dados/monstros_srd.js.
Uso: python3 importar_monstros.py <dnd5e-6.1.x/packs/_source> <dnd5e-pt-br-main/compendium> <saida.js>
Conteúdo SRD 5.1 © Wizards of the Coast, CC-BY-4.0."""
import sys, json, glob, re, os, math, yaml, unicodedata
SRC, TR, OUT = sys.argv[1:4]
tr_m = json.load(open(f'{TR}/dnd5e.monsters.json'))['entries']
tr_f = json.load(open(f'{TR}/dnd5e.monsterfeatures.json'))['entries']
tr_i = json.load(open(f'{TR}/dnd5e.items.json'))['entries']
tr_s = json.load(open(f'{TR}/dnd5e.spells.json'))['entries']
TIPO = {'bludgeoning':'fis','piercing':'fis','slashing':'fis','fire':'fogo','cold':'gelo','lightning':'raio','thunder':'trovão','acid':'ácido','poison':'veneno','necrotic':'necrótico','radiant':'radiante','force':'energia','psychic':'psíquico'}
ATR = {'str':'FOR','dex':'DES','con':'CON','int':'INT','wis':'SAB','cha':'CAR'}
TIPO_MON = {'aberration':'aberracao','beast':'fera','celestial':'celestial','construct':'constructo','dragon':'dragao','elemental':'elemental','fey':'feerico','fiend':'infero','giant':'gigante','humanoid':'humanoide','monstrosity':'monstro','ooze':'limo','plant':'planta','undead':'morto'}
HAB = {'aberration':['abismo','caverna','torre'],'beast':['floresta','caverna','pantano','estrada','mina'],'celestial':['torre','trono'],'construct':['torre','forja','mina','cripta'],'dragon':['abismo','forja','trono','torre'],'elemental':['forja','abismo','mina','afundada'],'fey':['floresta','pantano'],'fiend':['abismo','torre','forja','trono'],'giant':['caverna','mina','abismo','forja'],'humanoid':['estrada','torre','porao','caverna','trono'],'monstrosity':['caverna','pantano','abismo','afundada','mina'],'ooze':['porao','caverna','pantano','mina','cripta'],'plant':['floresta','pantano'],'undead':['cripta','cemiterio','porao','abismo','trono']}
TAM = {'tiny':'min','sm':'peq','med':'med','lg':'grd','huge':'enorme','grg':'colossal'}
def slug(s): return re.sub(r'[^a-z0-9]+','_',unicodedata.normalize('NFKD',s.lower()).encode('ascii','ignore').decode()).strip('_')
def num(x,d=0):
    try: return float(x) if x not in (None,'') else d
    except Exception: return d
def mod(v): return (int(num(v,10))-10)//2
def prof(cr): return 2 + max(0,math.ceil(cr)-1)//4 if cr>=1 else 2
def pt(d,k,fallback=None):
    e=d.get(k); return (e or {}).get('name') or fallback or k
def dieform(n,den,bonus=0):
    s=f'{n}d{den}' if n else '0'
    return s + (f'{bonus:+d}' if bonus else '')
def parse_bonus(b,m):
    if not b: return 0
    b=str(b).replace('@mod',str(m)).replace(' ','')
    try: return int(eval(b,{},{}))
    except Exception: return 0
def ac_de(d, ab):
    a=d['system']['attributes']['ac']; calc=a.get('calc','default'); flat=a.get('flat')
    dex=mod(ab['dex']['value'])
    if calc in ('natural','flat') and flat: return int(flat)
    base=None; escudo=0; armor=None
    for it in d['items']:
        if it['type']=='equipment' and it['system'].get('equipped'):
            t=(it['system'].get('type') or {}).get('value'); av=(it['system'].get('armor') or {})
            if t=='shield': escudo+= int(av.get('value') or 2)
            elif t in ('light','medium','heavy'):
                v=int(av.get('value') or 10); dx=av.get('dex')
                lim = dex if t=='light' else (min(dex,2) if t=='medium' else 0)
                if dx is not None and t=='medium': lim=min(dex,int(dx))
                armor=v+lim
    if armor is not None: return armor+escudo
    if flat: return int(flat)+escudo
    return 10+dex+escudo
def dc_de(sav,pb,M,spab):
    c=(sav['dc'].get('calculation') or '')
    if c=='spellcasting' and spab in M: return 8+pb+M[spab]
    if c in M: return 8+pb+M[c]
    try: return int(sav['dc'].get('formula'))
    except Exception: return 8+pb+max(M['con'],M['wis'])
NAT={'Bite':'Mordida','Claw':'Garra','Claws':'Garras','Tail':'Cauda','Tail Slap':'Caudada','Beak':'Bico','Slam':'Pancada','Horns':'Chifres','Horn':'Chifre','Gore':'Chifrada','Hooves':'Cascos','Hoof':'Casco','Sting':'Ferrão','Tentacle':'Tentáculo','Tentacles':'Tentáculos','Fist':'Punho','Fists':'Punhos','Touch':'Toque','Rock':'Pedra','Tusk':'Presa','Tusks':'Presas','Talons':'Garras de Rapina','Constrict':'Constrição','Wing':'Asa','Wings':'Asas','Pseudopod':'Pseudópode','Unarmed Strike':'Golpe Desarmado','Rend':'Dilacerar','Spit':'Cuspe','Spines':'Espinhos','Stinger':'Ferrão','Life Drain':'Dreno de Vida','Withering Touch':'Toque Mirrante','Frost Breath':'Sopro Gélido'}
def nome_atq(nm,tr_i,tr_f):
    base=re.sub(r'\s*\(.*?\)','',nm).strip()
    if base in NAT: return NAT[base]
    return (tr_i.get(base) or {}).get('name') or (tr_f.get(base) or {}).get('name') or base
NUM={'one':1,'two':2,'three':3,'four':4,'five':5}
def tlist(x): return [TIPO[t] for t in x if t in TIPO] if x else []
out={}
for f in sorted(glob.glob(f'{SRC}/monsters/*/*.yml')):
    if f.endswith('_folder.yml'): continue
    d=yaml.safe_load(open(f)); s=d['system']; ab=s['abilities']; det=s['details']
    ing=d['name']; cr=det['cr'] or 0; pb=prof(cr)
    ty=det['type'].get('value') or 'monstrosity'; tam=s['traits'].get('size','med')
    hp=num(s['attributes']['hp'].get('max')) or num(s['attributes']['hp'].get('value')) or 1
    mv={k:(num(v) if k!='units' and k!='hover' else v) for k,v in s['attributes']['movement'].items()}; vel=mv.get('walk') or 0
    M={k:mod(v['value']) for k,v in ab.items()}
    atq=[]; esp={}; traits=[]; mult=None; spells=[]; mult_txt=''
    spab=s['attributes'].get('spellcasting') or 'int'; spm=M.get(spab,0)
    # multiataque
    for it in d['items']:
        if it['name']=='Multiattack':
            txt=re.sub('<[^>]+>',' ',it['system']['description']['value']).lower()
            ms=re.findall(r'(one|two|three|four|five)\s+(?:\w+\s+){0,3}?attacks?',txt)
            mult=sum(NUM[x] for x in ms[:1]) or None
            # "makes two attacks: one with bite and one with claws"
            mult_txt=txt
    for it in d['items']:
        sy=it['system']; nm=it['name']
        if it['type']=='weapon':
            acts=[a for a in sy['activities'].values() if a['type']=='attack']
            if not acts: continue
            a=acts[0]; props=sy.get('properties') or []
            rng=sy.get('range') or {}
            melee = (sy['type']['value'] in ('simpleM','martialM','natural')) and not (sy['type']['value']=='natural' and a['range'].get('units')=='ft' and int(a['range'].get('value') or 0)>10)
            ranged = sy['type']['value'] in ('simpleR','martialR') or (rng.get('long') or 0)>0
            ab_over=a['attack'].get('ability')
            if ab_over in M: ak=ab_over
            elif ranged and 'thr' not in props: ak='dex'
            elif sy['type']['value']=='natural' or 'fin' in props: ak='dex' if M['dex']>M['str'] else 'str'
            else: ak='str'
            if 'thr' in props and not ranged and M['dex']>M['str'] and 'fin' in props: ak='dex'
            m=M[ak]
            b=int(pb+m+parse_bonus(a['attack'].get('bonus'),m))
            base=sy['damage']['base']; parts=[]
            n,den=base.get('number'),base.get('denomination')
            tp=TIPO.get((base.get('types') or ['bludgeoning'])[0],'fis')
            bonus=m+parse_bonus(base.get('bonus'),m)
            dm=dieform(n,den,bonus) if n else str(max(1,bonus))
            extra=[]
            for p in a['damage'].get('parts',[]):
                if p.get('number'): extra.append((dieform(p['number'],p['denomination'],parse_bonus(p.get('bonus'),m)),TIPO.get((p.get('types') or ['bludgeoning'])[0],'fis')))
            name=nome_atq(nm,tr_i,tr_f)
            alc = 1
            rr=int(a['range'].get('value') or 5) if a['range'].get('value') else 5
            if ranged and not melee: alc=max(2,int((rng.get('value') or rr)//5)); alc=min(alc,8)
            elif rr>5 and melee: alc=rr//5
            at={'n':name,'b':b,'d':dm,'t':tp}
            if extra: at['x']=[{'d':e[0],'t':e[1]} for e in extra]
            if ranged and not melee: at['r']=alc
            elif alc>1: at['alc']=alc
            atq.append(at)
        elif it['type']=='feat':
            sv=[a for a in sy['activities'].values() if a['type']=='save']
            nmpt=pt(tr_f,nm,nm); nl=nm.lower()
            rec=[r for r in (sy.get('uses') or {}).get('recovery',[]) if r.get('period')=='recharge']
            if sv and not [a for a in sy['activities'].values() if a['type']=='attack']:
                a=sv[0]; sav=a['save']; dmg=a['damage']['parts'] if a.get('damage') else []
                dcv=dc_de(sav,pb,M,spab)
                atr=ATR.get((sav['ability'] or ['con'])[0],'CON')
                tpl=a['target']['template']
                if dmg and dmg[0].get('number'):
                    p=dmg[0]; tt=TIPO.get((p.get('types') or ['fire'])[0],'fogo')
                    forma={'cone':'cone','line':'linha','sphere':'bola','cylinder':'bola','radius':'bola','cube':'bola','square':'bola'}.get(tpl.get('type'),'cone')
                    tamt=int(float(tpl.get('size') or 15)//5) if tpl.get('type') else 3
                    if tpl.get('type') or rec:
                        esp.setdefault('sopro',{'n':nmpt,'dc':dcv,'atr':atr,'d':dieform(p['number'],p['denomination'],parse_bonus(p.get('bonus'),0)),'t':tt,'forma':forma,'tam':max(2,min(tamt,8)),'meio':a['damage'].get('onSave','half')!='none'})
        elif it['type']=='spell':
            spells.append(it['name']); lvl=int(sy.get('level') or 0)
            for a in sy['activities'].values():
                dm_=(a.get('damage') or {}).get('parts') or []
                dm_=[p for p in dm_ if p.get('number')]
                if not dm_: continue
                p=dm_[0]; tt=TIPO.get((p.get('types') or ['force'])[0],'energia'); dform=dieform(p['number'],p['denomination'],parse_bonus(p.get('bonus'),spm))
                if a['type']=='attack':
                    atq.append({'n':pt(tr_s,it['name'],it['name']),'b':pb+spm,'d':dform,'t':tt,'r':6,'m':1})
                elif a['type']=='save':
                    tpl=a['target']['template'] if a['target']['template'].get('type') else (sy.get('target') or {}).get('template',{}); sav=a['save']
                    forma={'cone':'cone','line':'linha','sphere':'bola','cylinder':'bola','radius':'bola','cube':'bola','square':'bola'}.get(tpl.get('type'),None)
                    if not forma: continue
                    avg=p['number']*(p['denomination']+1)/2
                    cur=esp.get('sopro'); 
                    if (not cur) or avg>cur.get('_avg',0):
                        tamt=int(float(tpl.get('size') or 15)//5)
                        esp['sopro']={'n':pt(tr_s,it['name'],it['name']),'dc':8+pb+spm,'atr':ATR.get((sav['ability'] if isinstance(sav['ability'],str) else (sav['ability'] or ['dex'])[0]),'DES'),'d':dform,'t':tt,'forma':forma,'tam':max(2,min(tamt,8)),'meio':True,'_avg':avg}
    # efeitos nos golpes (veneno/paralisia/drenar)
    for it in d['items']:
        sy=it['system']; txt=re.sub('<[^>]+>',' ',sy['description']['value']).lower() if sy.get('description') else ''
        sv=[a for a in sy.get('activities',{}).values() if a['type']=='save']
        if it['type']=='weapon' and sv:
            sav=sv[0]['save']; dc=sav['dc'].get('formula')
            try: dcv=int(dc)
            except Exception: dcv=8+pb+M.get((sav['ability'] or ['con'])[0],0)
            atr=ATR.get((sav['ability'] or ['con'])[0],'CON')
            dmgp=[p for p in sv[0].get('damage',{}).get('parts',[]) if p.get('number')]
            if 'paralyz' in txt: esp['paralisa']={'dc':dcv}
            elif dmgp and (dmgp[0].get('types') or [''])[0]=='poison': esp['veneno']={'dc':dcv,'d':dieform(dmgp[0]['number'],dmgp[0]['denomination'])}
            elif 'poison' in txt and 'poisoned' in txt: esp.setdefault('envenena',{'dc':dcv})
            elif 'restrain' in txt or 'grappl' in txt: esp.setdefault('agarra',{'dc':dcv})
            elif 'prone' in txt: esp.setdefault('derruba',{'dc':dcv})
        nl=it['name'].lower()
        if nl.startswith('regeneration'):
            hv=10
            for a in sy.get('activities',{}).values():
                if a['type']=='heal':
                    h=a.get('healing') or {}; cf=(h.get('custom') or {}); hv=(int(cf['formula']) if cf.get('enabled') and str(cf.get('formula','')).isdigit() else 0) or int(h.get('bonus') or 0) or int((h.get('number') or 0)*((h.get('denomination') or 0)+1)/2) or 10
            esp['regen']=hv
        elif 'life drain' in nl or 'drain' in nl and it['type']=='weapon': esp['drena']=True
        elif nl=='pack tactics': esp['bando']=True
        elif nl=='magic resistance': esp['resMag']=True
        elif nl=='nimble escape': esp['esquiva']=True
        elif nl in ('flyby','flyby'): esp['sobrevoo']=True
        elif nl=='charge' or nl=='pounce': esp['investida']=True
        elif nl=='undead fortitude': esp['fortitude']=True
        elif nl=='rampage': esp['fúria']=True
        elif nl=='sunlight sensitivity': esp['luzSolar']=True
        elif nl.startswith('legendary resistance'): esp['resLend']=3
        elif nl=='frightful presence': esp['presenca']={'dc':8+pb+M['cha']}
        elif nl in ('gaze','petrifying gaze','death gaze','hypnotic gaze'): esp['olhar']={'dc':8+pb+M['con']}
        elif nl=='amorphous' or nl=='false appearance' or nl=='keen smell' or nl=='keen senses' or nl=='keen sight' or nl=='keen hearing': pass
        if it['type']=='feat' and (it['system'].get('type') or {}).get('value')=='monster' and nl not in ('multiattack',):
            traits.append(pt(tr_f,it['name'],it['name']))
    tr=s['traits']
    res=tlist(tr['dr']['value']); imu=tlist(tr['di']['value']); vul=tlist(tr['dv']['value'])
    ci=[c for c in tr['ci']['value']]
    # nº de ataques por rodada (multiataque) -> repete lista de ataques
    atq_f=atq
    if mult and atq:
        # distribui: se há 2+ tipos de golpe e texto cita tipos diferentes, usa um de cada até mult
        uniq=[]; [uniq.append(a) for a in atq if a['n'] not in [u['n'] for u in uniq] and 'r' not in a] or None
        base=uniq or atq
        txt=mult_txt
        lista=[]
        if len(base)>=2 and re.search(r'\b(bite|claw|claws|tail|horn|gore|hooves|slam|sting|beak|talon|tentacle)',txt) and mult>=2:
            # um de cada tipo, repetindo o primeiro até completar
            lista=list(base[:mult]); i=0
            while len(lista)<mult: lista.append(base[i%len(base)]); i+=1
        else:
            lista=[base[0]]*mult if len(base)==1 else (list(base[:mult])+[base[0]]*(mult-len(base[:mult])))
        atq_f=lista
    if not atq_f and esp.get('sopro'): atq_f=[{'n':'Golpe','b':pb+max(M['str'],M['dex']),'d':str(max(1,M['str'])+1),'t':'fis'}]
    if not atq_f: atq_f=[{'n':'Golpe','b':pb+M['str'],'d':'1d4'+(f'{M["str"]:+d}' if M['str'] else ''),'t':'fis'}]
    # magias de monstro
    mg=[slug(x) for x in spells]
    r={'n':pt(tr_m,ing,ing),'en':ing,'cr':cr,'hp':int(hp),'ca':ac_de(d,ab),'tam':TAM.get(tam,'med'),'tp':TIPO_MON.get(ty,ty),
       'vel':max(2,min(10,round((vel or 30)/5))) ,'f':[ab[k]['value'] for k in ('str','dex','con','int','wis','cha')],
       'atq':atq_f,'esp':esp,'tags':[TIPO_MON.get(ty,ty)]+HAB.get(ty,[])}
    if os.path.basename(os.path.dirname(f))=='summons' or hp<=1: r['inv']=1
    if mv.get('fly'): r['voa']=1
    if mv.get('swim'): r['nada']=1
    if res: r['res']=res
    if imu: r['imu']=imu
    if vul: r['vul']=vul
    if ci: r['ci']=ci
    if mg: r['mag']=mg
    if traits: r['tr']=traits[:8]
    if det.get('alignment'): r['al']=det['alignment']
    if 'sopro' in r['esp']: r['esp']['sopro'].pop('_avg',None)
    out['s_'+slug(ing)]=r
os.makedirs(os.path.dirname(OUT),exist_ok=True)
js='// Gerado por tools/dados/importar_monstros.py — SRD 5.1 © Wizards of the Coast, CC-BY-4.0 (nomes: tradução pt-BR da comunidade).\nexport const MONSTROS_SRD = '+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n'
open(OUT,'w').write(js); print(len(out),'monstros',len(js)//1024,'KB')
