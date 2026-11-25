#!/usr/bin/env python3
"""Gera os ícones de item por categoria (webp 64px, arte própria procedural — sem licença externa).
uso: gerar_icones_itens.py <saida>   (ex.: assets/ic/items)  — também grava uma folha de contato em <saida>/_folha.png"""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pintor import Tela, hex2rgb, mix, lum, curva, rot

C = dict(aco='#c8d2de', aco2='#8c9aae', ouro='#e8b84a', ouro2='#b8862a', madeira='#8a5a34', madeira2='#5e3a20', couro='#a06a3a', couro2='#6e4424',
         verm='#c23a44', azul='#3f74d6', verde='#3fa862', roxo='#8a5acf', pergaminho='#e8d8a8', pano='#d8c9a0', vidro='#bfe3f0', preto='#2a2430',
         laranja='#f08a2a', amarelo='#ffe27a', branco='#f4f4ff', prata='#e2e8f2')
H = {k: hex2rgb(v) for k, v in C.items()}
OW = 1.3
R = lambda pts, a=45: rot(pts, math.radians(a), (32, 32))

def malha(xx, yy):  # textura de malha de aço
    return 0.80 + 0.20 * (0.5 + 0.5 * np.sin(xx * 0.34) * np.sin(yy * 0.34 + 0.8))
def couro_t(xx, yy): return 0.92 + 0.08 * np.sin(xx * 0.5 + yy * 0.3)

def T0(): return Tela(64)
def lin(T, pts, cor, w, **k): T.linha(pts, H[cor] if isinstance(cor, str) else cor, w, ow=k.pop('ow', OW), **k)
def pol(T, pts, cor, **k): T.poli(pts, H[cor] if isinstance(cor, str) else cor, **{'ow': OW, 'domo': 0.5, 'brilho': 0.25, **k})
def eli(T, cx, cy, rx, ry, cor, **k): T.elipse(cx, cy, rx, ry, H[cor] if isinstance(cor, str) else cor, **{'ow': OW, 'domo': 0.6, 'brilho': 0.3, **k})
def anel_forma(T, cx, cy, r1, r2, cor, **k):  # anel (círculo vazado)
    m = T.mask(lambda d, s: (d.ellipse([(cx - r1) * s, (cy - r1) * s, (cx + r1) * s, (cy + r1) * s], fill=255), d.ellipse([(cx - r2) * s, (cy - r2) * s, (cx + r2) * s, (cy + r2) * s], fill=0)))
    T.paint(m, H[cor], **{'ow': OW, 'domo': 0.5, 'brilho': 0.3, **k})

# ---------- armas ----------
def espada(T):
    pol(T, R([(29, 38), (29, 10), (32, 2), (35, 10), (35, 38)]), 'aco'); lin(T, R([(32, 12), (32, 36)]), (232, 240, 250), 1.2, ow=0, domo=0)
    lin(T, R([(21, 39), (43, 39)]), 'ouro', 4.2); lin(T, R([(32, 41), (32, 51)]), 'couro', 4); eli(T, *R([(32, 53)])[0], 3.4, 3.4, 'ouro')
def adaga(T):
    pol(T, R([(30, 30), (30, 14), (32, 7), (34, 14), (34, 30)]), 'aco'); lin(T, R([(25, 31), (39, 31)]), 'ouro', 3.4); lin(T, R([(32, 32), (32, 42)]), 'couro2', 3.6); eli(T, *R([(32, 44)])[0], 2.6, 2.6, 'ouro')
def machado(T):
    lin(T, R([(32, 8), (32, 58)], 25), 'madeira', 4.2)
    pol(T, R(curva((33, 6), (62, 12), (52, 34)) + curva((52, 34), (44, 22), (33, 28))[1:], 25), 'aco'); lin(T, R(curva((50, 11), (56, 16), (50, 28)), 25), (240, 246, 255), 1.4, ow=0, domo=0)
def martelo(T):
    lin(T, R([(32, 14), (32, 58)], 30), 'madeira', 4.2); pol(T, R([(17, 8), (47, 8), (47, 26), (17, 26)], 30), 'aco2', domo=0.65)
    lin(T, R([(17, 17), (47, 17)], 30), 'aco', 2.4, ow=0.6)
def maca(T):
    lin(T, R([(32, 18), (32, 58)], 30), 'madeira', 4.2)
    for a in range(0, 360, 45):
        c, s = math.cos(math.radians(a)), math.sin(math.radians(a)); pol(T, R([(32 + c * 8 - s * 3, 14 + s * 8 + c * 3), (32 + c * 15, 14 + s * 15), (32 + c * 8 + s * 3, 14 + s * 8 - c * 3)], 30), 'aco2', domo=0.3)
    eli(T, *R([(32, 14)], 30)[0], 9, 9, 'aco', domo=0.7)
def lanca(T):
    lin(T, R([(32, 12), (32, 62)], 40), 'madeira', 3.4); pol(T, R([(32, 0), (38, 15), (32, 12), (26, 15)], 40), 'aco')
def arco(T):
    arc = curva((20, 4), (50, 32), (20, 60)); lin(T, arc, 'madeira', 3.6); lin(T, [(20, 4), (20, 60)], (230, 230, 240), 1.0, ow=0.4, domo=0)
    lin(T, [(12, 32), (50, 32)], 'madeira2', 1.8, ow=0.7); pol(T, [(50, 29), (58, 32), (50, 35)], 'aco'); pol(T, [(10, 28), (17, 32), (10, 36), (13, 32)], 'verm', domo=0.2)
def funda(T):
    lin(T, [(26, 18), (24, 58)], 'couro2', 2.0, ow=0.7); lin(T, [(38, 18), (40, 58)], 'couro2', 2.0, ow=0.7); eli(T, 32, 54, 9, 4, 'couro', domo=0.4)
    eli(T, 32, 16, 10, 8, 'couro', textura=couro_t); eli(T, 32, 14, 4.6, 4.6, 'aco2', brilho=0.5)
def dardo(T):
    lin(T, R([(32, 12), (32, 52)]), 'madeira', 3); pol(T, R([(32, 2), (36, 14), (32, 12), (28, 14)]), 'aco'); pol(T, R([(26, 56), (32, 44), (38, 56), (32, 52)]), 'verm', domo=0.2)
def chicote(T):
    lin(T, [(14, 54), (22, 46)], 'couro2', 5.2); lin(T, curva((22, 46), (50, 40), (46, 14)), 'couro', 2.6); lin(T, curva((46, 14), (44, 8), (52, 8)), 'couro', 1.6)
def foice(T):
    lin(T, R([(32, 62), (32, 10)], 20), 'madeira', 3.8)
    pts = curva((32, 10), (62, 2), (54, 36)) + curva((54, 36), (48, 16), (32, 18))[1:]; pol(T, R(pts, 20), 'aco')
def cajado(T):
    lin(T, R([(32, 20), (32, 60)], 25), 'madeira', 4.4); a = R([(32, 14)], 25)[0]
    for sg in (-1, 1): lin(T, R([(32 + sg * 3, 20), (32 + sg * 9, 12), (32 + sg * 5, 4)], 25), 'ouro', 2.6, ow=0.9)
    eli(T, a[0], a[1], 6.5, 6.5, 'azul', domo=0.8, brilho=0.6)
def bastao(T):
    lin(T, [(14, 50), (48, 16)], 'aco2', 6); lin(T, [(14, 50), (48, 16)], 'aco', 3, ow=0, domo=0.3)
    for t in (0.15, 0.85): x, y = 14 + 34 * t, 50 - 34 * t; eli(T, x, y, 4.4, 4.4, 'ouro')
    eli(T, 52, 12, 4.5, 4.5, 'roxo', domo=0.8, brilho=0.6)
def varinha(T):
    lin(T, [(14, 52), (44, 22)], 'madeira', 3.6); lin(T, [(14, 52), (22, 44)], 'preto', 4.2, ow=0.6)
    st = [(48 + (11 if i % 2 == 0 else 4.5) * math.sin(i * math.pi / 5), 18 - (11 if i % 2 == 0 else 4.5) * math.cos(i * math.pi / 5)) for i in range(10)]
    pol(T, st, 'amarelo', brilho=0.5)
def flecha(T):
    lin(T, R([(32, 12), (32, 54)]), 'madeira', 2.4, ow=0.8); pol(T, R([(32, 2), (37, 14), (32, 12), (27, 14)]), 'aco'); pol(T, R([(25, 58), (32, 44), (39, 58), (32, 54)]), 'verm', domo=0.2)

# ---------- armaduras ----------
def _tronco(ombro=7):
    return [(14, 14), (23, 8), (32, 13), (41, 8), (50, 14), (58, 24 - ombro * 0), (50, 30), (46, 26), (46, 56), (18, 56), (18, 26), (14, 30), (6, 24)]
def armadura_leve(T):
    pol(T, _tronco(), 'couro', textura=couro_t); lin(T, [(18, 44), (46, 44)], 'couro2', 3.4, ow=0.6); eli(T, 32, 44, 3, 3, 'ouro'); lin(T, [(32, 14), (32, 38)], 'couro2', 1.2, ow=0, domo=0)
def armadura_media(T):
    pol(T, _tronco(), 'aco2', textura=malha); lin(T, [(18, 48), (46, 48)], 'couro2', 3.2, ow=0.6); lin(T, [(23, 9), (32, 14), (41, 9)], 'aco', 2.2, ow=0.5)
def armadura_pesada(T):
    pol(T, _tronco(), 'aco'); eli(T, 14, 20, 8, 6.4, 'aco', rot=-0.4); eli(T, 50, 20, 8, 6.4, 'aco', rot=0.4)
    lin(T, [(32, 14), (32, 54)], 'aco2', 2.2, ow=0.6); lin(T, [(20, 36), (44, 36)], 'ouro', 2.4, ow=0.6); lin(T, [(18, 56), (46, 56)], 'ouro', 2.4, ow=0.6)
def escudo(T):
    ext = [(10, 8), (54, 8), (54, 30)] + curva((54, 30), (50, 50), (32, 60)) + curva((32, 60), (14, 50), (10, 30))[1:] + [(10, 8)]
    pol(T, ext, 'ouro'); ext2 = [(15, 13), (49, 13), (49, 29)] + curva((49, 29), (46, 46), (32, 54)) + curva((32, 54), (18, 46), (15, 29))[1:] + [(15, 13)]
    pol(T, ext2, 'azul', ow=0.8); lin(T, [(32, 16), (32, 46)], 'ouro', 4.4, ow=0.6); lin(T, [(22, 26), (42, 26)], 'ouro', 4.4, ow=0.6)
def elmo(T):
    pol(T, [(14, 36), (14, 24), (21, 13), (32, 9), (43, 13), (50, 24), (50, 36), (46, 54), (38, 54), (38, 42), (26, 42), (26, 54), (18, 54)], 'aco')
    lin(T, [(18, 30), (46, 30)], 'preto', 3.2, ow=0, domo=0); lin(T, [(32, 9), (32, 28)], 'aco2', 2, ow=0.5)
def coroa(T):
    pol(T, [(10, 46), (8, 18), (22, 30), (32, 12), (42, 30), (56, 18), (54, 46)], 'ouro'); lin(T, [(10, 42), (54, 42)], 'ouro2', 3, ow=0.5)
    for x, c in ((20, 'verm'), (32, 'azul'), (44, 'verde')): eli(T, x, 36, 3.2, 3.2, c, brilho=0.5)
def luvas(T):
    for x, y in ((22, 17), (29, 11), (36, 11), (43, 15)): lin(T, [(x, 34), (x, y)], 'couro', 6.2, ow=1.1, domo=0.6)
    lin(T, [(19, 40), (10, 28)], 'couro', 6.4, ow=1.1, domo=0.6)
    pol(T, [(18, 30), (47, 30), (48, 46), (18, 46)], 'couro', textura=couro_t); lin(T, [(17, 52), (49, 52)], 'couro2', 11, ow=0.9); lin(T, [(19, 52), (47, 52)], 'ouro', 1.6, ow=0, domo=0)
def botas(T):
    pol(T, [(22, 6), (40, 6), (40, 34), (56, 42), (58, 56), (20, 56)], 'couro', textura=couro_t); lin(T, [(22, 12), (40, 12)], 'couro2', 5, ow=0.6); lin(T, [(20, 56), (58, 56)], 'preto', 3.4, ow=0, domo=0)
def capa(T):
    pol(T, [(20, 8), (44, 8), (56, 58), (8, 58)], 'verm'); lin(T, [(26, 14), (22, 56)], lum(H['verm'], .6), 1.4, ow=0, domo=0); lin(T, [(38, 14), (42, 56)], lum(H['verm'], .6), 1.4, ow=0, domo=0)
    eli(T, 32, 12, 4.4, 4.4, 'ouro')
def cinto(T):
    lin(T, curva((6, 24), (32, 50), (58, 24)), 'couro', 8); lin(T, curva((6, 24), (32, 50), (58, 24)), 'couro2', 1.2, ow=0, domo=0)
    pol(T, [(25, 34), (39, 34), (39, 46), (25, 46)], 'ouro'); pol(T, [(29, 38), (35, 38), (35, 42), (29, 42)], 'preto', ow=0, brilho=0)
def roupa(T):
    pol(T, _tronco(), 'azul'); lin(T, [(23, 9), (32, 20), (41, 9)], lum(H['azul'], .55), 2.4, ow=0, domo=0); lin(T, [(18, 46), (46, 46)], 'pano', 2.6, ow=0.6)
def mochila(T):
    pol(T, [(16, 18), (24, 8), (40, 8), (48, 18), (50, 56), (14, 56)], 'couro', textura=couro_t); pol(T, [(18, 22), (46, 22), (46, 34), (18, 34)], 'couro2', domo=0.3)
    pol(T, [(24, 44), (40, 44), (40, 54), (24, 54)], 'couro2', domo=0.3); eli(T, 32, 28, 2.6, 2.6, 'ouro'); lin(T, [(16, 24), (10, 50)], 'couro2', 3.2, ow=0.6); lin(T, [(48, 24), (54, 50)], 'couro2', 3.2, ow=0.6)
def bolsa(T):
    pol(T, [(18, 22)] + curva((18, 22), (6, 46), (20, 56)) + [(44, 56)] + curva((44, 56), (58, 46), (46, 22))[1:] + [(40, 22), (36, 18), (28, 18), (24, 22)], 'couro', textura=couro_t)
    lin(T, [(20, 24), (44, 24)], 'couro2', 3.4, ow=0.6); eli(T, 32, 40, 4, 4, 'ouro')
def saco(T):
    pol(T, [(26, 14), (22, 18)] + curva((22, 18), (4, 40), (16, 58)) + [(48, 58)] + curva((48, 58), (60, 40), (42, 18))[1:] + [(38, 14)], 'pano', textura=couro_t)
    lin(T, [(22, 19), (42, 19)], 'couro2', 3.4, ow=0.6); pol(T, [(22, 6), (28, 14), (24, 18)], 'pano'); pol(T, [(42, 6), (36, 14), (40, 18)], 'pano'); lin(T, [(32, 32), (32, 44)], lum(H['pano'], .6), 1.2, ow=0, domo=0)

# ---------- consumíveis, tesouros e utilitários ----------
def pocao(T):
    pol(T, [(26, 6), (38, 6), (38, 18), (46, 30), (50, 44), (44, 56), (20, 56), (14, 44), (18, 30), (26, 18)], 'vidro', domo=0.2, brilho=0.4)
    pol(T, [(18, 36), (46, 36), (50, 44), (44, 54), (20, 54), (14, 44)], 'verm', domo=0.6, brilho=0.5, ow=0); pol(T, [(25, 3), (39, 3), (39, 9), (25, 9)], 'couro')
def pergaminho(T):
    pol(T, [(14, 14), (50, 14), (50, 52), (14, 52)], 'pergaminho', domo=0.3); eli(T, 14, 33, 4, 19, 'pergaminho', domo=0.4); eli(T, 50, 33, 4, 19, 'ouro2', domo=0.5)
    for y in (24, 31, 38): lin(T, [(21, y), (43, y)], lum(H['pergaminho'], .45), 1.4, ow=0, domo=0)
    eli(T, 40, 46, 4.2, 4.2, 'verm', brilho=0.4)
def livro(T):
    pol(T, [(14, 8), (48, 8), (48, 56), (14, 56)], 'roxo', domo=0.4); pol(T, [(48, 10), (53, 10), (53, 54), (48, 54)], 'pergaminho', domo=0.1)
    lin(T, [(14, 14), (48, 14)], 'ouro', 2, ow=0, domo=0); lin(T, [(14, 50), (48, 50)], 'ouro', 2, ow=0, domo=0); eli(T, 31, 32, 7, 7, 'ouro', brilho=0.3); eli(T, 31, 32, 3, 3, 'preto', ow=0, brilho=0)
def chave(T):
    anel_forma(T, 20, 20, 11, 5, 'ouro'); lin(T, [(27, 27), (54, 54)], 'ouro', 5); lin(T, [(46, 46), (46, 56)], 'ouro', 4); lin(T, [(52, 52), (52, 59)], 'ouro', 3.4)
def corda(T):
    for i, r in enumerate((24, 19, 14, 9)): anel_forma(T, 32, 32 + i * 0.6, r, r - 4.2, 'couro' if i % 2 == 0 else 'pano', domo=0.6)
    lin(T, [(50, 40), (58, 56)], 'couro', 3.4)
def tocha(T):
    lin(T, [(32, 32), (32, 60)], 'madeira', 6); pol(T, [(32, 4), (42, 20), (40, 34), (24, 34), (22, 20)], 'laranja', brilho=0.6, domo=0.8); pol(T, [(32, 14), (37, 24), (36, 34), (28, 34), (27, 24)], 'amarelo', ow=0, brilho=0.5)
def lampiao(T):
    anel_forma(T, 32, 9, 7, 4, 'aco2'); pol(T, [(18, 14), (46, 14), (50, 20), (14, 20)], 'aco2'); pol(T, [(18, 22), (46, 22), (44, 50), (20, 50)], 'amarelo', domo=0.8, brilho=0.6)
    pol(T, [(16, 50), (48, 50), (50, 58), (14, 58)], 'aco2')
    for x in (23, 32, 41): lin(T, [(x, 22), (x, 50)], 'aco2', 1.4, ow=0, domo=0)
def tenda(T):
    pol(T, [(32, 6), (60, 54), (4, 54)], 'verm', domo=0.4); pol(T, [(32, 28), (44, 54), (20, 54)], 'preto', ow=0.8, brilho=0); lin(T, [(32, 6), (32, 28)], 'couro2', 1.6, ow=0, domo=0)
    lin(T, [(32, 6), (60, 54)], 'pano', 1.4, ow=0, domo=0); lin(T, [(32, 6), (4, 54)], 'pano', 1.4, ow=0, domo=0)
def ferramenta(T):
    lin(T, R([(32, 16), (32, 58)], 35), 'madeira', 4.2); pol(T, R([(20, 6), (44, 6), (44, 20), (20, 20)], 35), 'aco2')
    lin(T, R([(32, 16), (32, 58)], -35), 'aco2', 3.4); pol(T, R([(26, 6), (38, 6), (35, 16), (29, 16)], -35), 'aco')
def musica(T):
    eli(T, 28, 42, 15, 13, 'madeira', rot=-0.78); eli(T, 28, 42, 4.6, 4.6, 'preto', ow=0, brilho=0, rot=0)
    lin(T, [(38, 32), (54, 10)], 'madeira2', 4); pol(T, [(50, 4), (60, 10), (56, 16), (48, 10)], 'madeira2')
    for dx in (-1.2, 0, 1.2): lin(T, [(24 + dx, 46 + dx), (54 + dx * .3, 10 + dx * .3)], (235, 235, 245), 0.7, ow=0, domo=0)
def gema(T):
    pol(T, [(16, 22), (24, 10), (40, 10), (48, 22), (32, 56)], 'azul', domo=0.7, brilho=0.6)
    for pts in ([(16, 22), (48, 22)], [(24, 10), (28, 22), (32, 56)], [(40, 10), (36, 22), (32, 56)], [(28, 22), (32, 10)], [(36, 22), (32, 10)]): lin(T, pts, (200, 225, 255), 1.0, ow=0, domo=0)
def anel(T):
    anel_forma(T, 32, 38, 17, 11, 'ouro', domo=0.7); pol(T, [(26, 14), (38, 14), (42, 22), (32, 28), (22, 22)], 'verm', domo=0.7, brilho=0.7)
def amuleto(T):
    lin(T, curva((12, 6), (32, 34), (52, 6)), 'aco2', 1.8, ow=0.6); eli(T, 32, 40, 12, 12, 'ouro', brilho=0.4); eli(T, 32, 40, 6.4, 6.4, 'verde', brilho=0.6, domo=0.8)
def simbolo(T):
    for i in range(12):
        a = i * math.pi / 6; pol(T, [(32 + 15 * math.cos(a - .18), 32 + 15 * math.sin(a - .18)), (32 + 27 * math.cos(a), 32 + 27 * math.sin(a)), (32 + 15 * math.cos(a + .18), 32 + 15 * math.sin(a + .18))], 'ouro', domo=0.2)
    eli(T, 32, 32, 15, 15, 'ouro', brilho=0.4); eli(T, 32, 32, 8, 8, 'amarelo', brilho=0.5, ow=0.8)
def sino(T):
    pol(T, [(32, 6)] + curva((32, 6), (50, 8), (50, 34)) + [(56, 48), (8, 48), (14, 34)] + curva((14, 34), (14, 8), (32, 6))[1:], 'ouro', brilho=0.4); eli(T, 32, 52, 5, 5, 'ouro2')
    anel_forma(T, 32, 6, 4.4, 2.2, 'ouro2', ow=0.8)
def espelho(T):
    lin(T, [(40, 40), (54, 58)], 'ouro', 5); eli(T, 28, 28, 19, 19, 'ouro'); eli(T, 28, 28, 15, 15, 'prata', brilho=0.8, domo=0.2); lin(T, [(18, 22), (26, 16)], (255, 255, 255), 2, ow=0, domo=0)
def comida(T):
    eli(T, 32, 36, 25, 15, 'couro', rot=-0.15, domo=0.7, brilho=0.5)
    for x in (20, 32, 44): lin(T, [(x - 3, 28), (x + 3, 38)], lum(H['couro'], .62), 1.6, ow=0, domo=0)
def veneno(T):
    pocao(T); T.img = Image.new('RGBA', T.img.size, (0, 0, 0, 0))
    pol(T, [(26, 6), (38, 6), (38, 18), (46, 30), (50, 44), (44, 56), (20, 56), (14, 44), (18, 30), (26, 18)], 'vidro', domo=0.2, brilho=0.4)
    pol(T, [(18, 36), (46, 36), (50, 44), (44, 54), (20, 54), (14, 44)], 'verde', domo=0.6, brilho=0.5, ow=0); pol(T, [(25, 3), (39, 3), (39, 9), (25, 9)], 'couro')
    eli(T, 32, 46, 5, 5, 'branco', ow=0, brilho=0); eli(T, 29.6, 45, 1.3, 1.6, 'preto', ow=0, brilho=0); eli(T, 34.4, 45, 1.3, 1.6, 'preto', ow=0, brilho=0)
def padrao(T):  # item genérico: baú pequeno
    pol(T, [(8, 26), (56, 26), (56, 54), (8, 54)], 'madeira', textura=couro_t); pol(T, [(8, 16), (56, 16), (56, 28), (8, 28)], 'couro', domo=0.4); lin(T, [(8, 28), (56, 28)], 'ouro', 3, ow=0.6)
    pol(T, [(28, 26), (36, 26), (36, 36), (28, 36)], 'ouro')

ICONES = dict(espada=espada, adaga=adaga, machado=machado, martelo=martelo, maca=maca, lanca=lanca, arco=arco, funda=funda, dardo=dardo, chicote=chicote, foice=foice,
              cajado=cajado, bastao=bastao, varinha=varinha, flecha=flecha, escudo=escudo, armadura_leve=armadura_leve, armadura_media=armadura_media, armadura_pesada=armadura_pesada,
              elmo=elmo, coroa=coroa, luvas=luvas, botas=botas, capa=capa, cinto=cinto, roupa=roupa, mochila=mochila, bolsa=bolsa, saco=saco, pocao=pocao, pergaminho=pergaminho,
              livro=livro, chave=chave, corda=corda, tocha=tocha, lampiao=lampiao, tenda=tenda, ferramenta=ferramenta, musica=musica, gema=gema, anel=anel, amuleto=amuleto,
              simbolo=simbolo, sino=sino, espelho=espelho, comida=comida, veneno=veneno, padrao=padrao)

if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True); fol = []
    for nome, fn in ICONES.items():
        T = T0(); fn(T); im = T.final(os.path.join(out, nome + '.webp')); fol.append((nome, im))
    cols = 10; rows = (len(fol) + cols - 1) // cols; sh = Image.new('RGBA', (cols * 72, rows * 72), (38, 30, 58, 255))
    for i, (n, im) in enumerate(fol): sh.alpha_composite(im, ((i % cols) * 72 + 4, (i // cols) * 72 + 4))
    sh = sh.resize((sh.width * 2, sh.height * 2), Image.NEAREST); sh.save(os.path.join('/tmp', 'folha_icones_itens.png')); print(len(fol), 'ícones')
