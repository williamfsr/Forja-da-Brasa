import sys, os
from PIL import Image, ImageChops
D = sys.argv[1]
def L(n): return Image.open(f'{D}/{n}.webp').convert('RGBA')
def hx(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def tint(im, cor):
    r,g,b,a = im.split(); c = Image.new('RGBA', im.size, hx(cor)+(255,)); out = ImageChops.multiply(im.convert('RGB'), c.convert('RGB')); out = out.convert('RGBA'); out.putalpha(a); return out
def compor(ap, vis, kit, arma, sx=1.0):
    out = Image.new('RGBA',(128,128),(0,0,0,0))
    def cola(n, cor=None, larg=False):
        im = L(n); im = tint(im, cor) if cor else im
        if larg and sx != 1: w=int(128*sx); im=im.resize((w,128),Image.LANCZOS); t=Image.new('RGBA',(128,128),(0,0,0,0)); t.alpha_composite(im,((128-w)//2,0)); im=t
        out.alpha_composite(im)
    cola('sombra'); cola('base', ap['anel'])
    if ap['capa']: cola('capa_'+('curta' if ap['capa']==1 else 'longa'), vis['capaC'], True)
    cola('braco', ap['pele'], True); cola(f"roupa_{ap['roupa']}_1", ap['roupa1'], True); cola(f"roupa_{ap['roupa']}_2", ap['roupa2'], True)
    if kit:
        cola(f"peito_{kit['tipo']}_1", ap['arm1'], True); cola(f"peito_{kit['tipo']}_2", ap['arm2'], True)
        if kit['ombro']!='nenhum': cola(f"ombro_{kit['ombro']}_1", ap['arm1'], True); cola(f"ombro_{kit['ombro']}_2", ap['arm2'] if kit['ombro']!='chifre' else None, True)
    if vis['escudo']: cola('escudo_1', ap['arm2']); cola('escudo_2', ap['arm1']); cola('escudo_3')
    if arma: cola('arma_'+arma)
    if ap['orelha']!='nenhuma': cola('orelha_'+ap['orelha'], ap['pele'])
    cola('cabeca_dragao' if ap['raca']=='draconato' else f"cabeca_{ap['rosto']}", ap['pele'])
    if ap['raca']=='meioorc': cola('presas')
    helm = kit and kit['elmo']!='nenhum' and ap['elmo']
    fechado = helm and kit['elmo'] in ('fechado','crista','chifres','capuz')
    if ap['barba'] and not (helm and kit['elmo']=='fechado'): cola(f"barba_{ap['barba']}", ap['barbaCor'] or ap['cabeloCor'])
    if ap['cabelo'] and not fechado: cola(f"cabelo_{ap['cabelo']}", ap['cabeloCor'])
    if ap['chifre'] is not None: cola(f"chifre_{ap['chifre']}")
    if helm: cola(f"elmo_{kit['elmo']}_1", ap['arm1']); cola(f"elmo_{kit['elmo']}_2", ap['arm2'])
    elif ap['acess']: cola(f"acess_{ap['acess']}")
    return out
if __name__=='__main__':
    base=dict(raca='humano',pele='#e5b184',cabelo=2,cabeloCor='#3b2616',barba=0,barbaCor=None,roupa=0,roupa1='#b8352e',roupa2='#5a3a22',arm1='#9aa0b0',arm2='#b8352e',capa=1,acess=0,chifre=None,elmo=True,orelha='redonda',rosto=0,anel='#b8352e')
    vis=dict(capaC='#7a1f1a',escudo=False)
    casos=[
     (dict(base),vis,{'tipo':'placa','ombro':'redondo','elmo':'aberto'},'espadaLonga'),
     (dict(base,raca='elfo',pele='#f0d8c8',cabelo=10,cabeloCor='#efd58a',orelha='longa',roupa=1,roupa1='#3a5fb8',anel='#3a5fb8',capa=0),dict(capaC='#223a78',escudo=False),None,'cajado'),
     (dict(base,raca='anao',pele='#cf9867',cabelo=14,cabeloCor='#8a2a1a',barba=6,barbaCor='#8a2a1a',orelha='redonda',roupa=3,roupa1='#a8561f',anel='#a8561f',rosto=2,elmo=False),dict(capaC='#5a3a22',escudo=True),{'tipo':'malha','ombro':'pontudo','elmo':'crista'},'machadoGrande'),
     (dict(base,raca='tiefling',pele='#a83a62',cabelo=11,cabeloCor='#241812',chifre=2,roupa=5,roupa1='#3a3f4a',anel='#3a3f4a',capa=2,orelha='pontuda',rosto=4),dict(capaC='#1f5a30',escudo=False),{'tipo':'couro','ombro':'capuz','elmo':'nenhum'},'adaga'),
     (dict(base,raca='meioorc',pele='#6a8a4c',cabelo=6,cabeloCor='#0e0b10',barba=4,orelha='pontuda',roupa=2,roupa1='#a8561f',anel='#a8561f',rosto=2,capa=0),dict(capaC='#5a3a22',escudo=False),{'tipo':'escamas','ombro':'chifre','elmo':'chifres'},'machadoBatalha'),
     (dict(base,raca='draconato',pele='#c0392b',cabelo=0,orelha='nenhuma',roupa=4,roupa1='#d8b43a',anel='#d8b43a',capa=1),dict(capaC='#8a6d12',escudo=True),{'tipo':'placa','ombro':'redondo','elmo':'nenhum'},'espadaCurta'),
     (dict(base,raca='halfling',pele='#e5b184',cabelo=18,cabeloCor='#5a3a22',roupa=6,roupa1='#3a3f4a',anel='#1f5a30',acess=7,orelha='pequena',capa=0),dict(capaC='#1f5a30',escudo=False),None,'arcoCurto'),
     (dict(base,raca='gnomo',pele='#f7e6e0',cabelo=5,cabeloCor='#f4ead0',barba=10,roupa=7,roupa1='#3a5fb8',anel='#3a5fb8',acess=4,orelha='pontuda',capa=0),dict(capaC='#223a78',escudo=False),{'tipo':'couro','ombro':'nenhum','elmo':'chapeu'},'cajado'),
    ]
    W=Image.new('RGBA',(128*4,128*2),(86,74,62,255))
    for i,(ap,v,k,a) in enumerate(casos):
        im=compor(ap,v,k,a); W.alpha_composite(im,((i%4)*128,(i//4)*128))
    W=W.resize((W.width*2,W.height*2),Image.LANCZOS); W.save('/tmp/prever_heroi.png')
