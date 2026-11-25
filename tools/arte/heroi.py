"""Gera as camadas (webp) do token do herói: vista superior, voltado para cima (norte). Camadas cinzas são coloridas no jogo
(pele, cabelo, roupa, armadura...) por multiplicação, então a personalização muda o token de verdade.
Saída: assets/tokens/heroi/*.webp (128x128)."""
import os, sys, math
import numpy as np
from pintor import *
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out/heroi'
os.makedirs(OUT, exist_ok=True)
G = (238, 238, 238)           # cinza-base de camadas tingíveis
STEEL = (206, 212, 224); WOOD = (150, 104, 62); LEATHER = (112, 78, 52); GOLD = (224, 184, 70)
def save(t, nome): t.final(f'{OUT}/{nome}.webp')
def cap(t, a, b, w, cor, **kw): t.linha([a, b], cor, w, **kw)
# ---------- base / sombra / capa ----------
def base():
    t = Tela(); m = t.mask(lambda d, s: d.ellipse([5 * s, 5 * s, 123 * s, 123 * s], fill=255)); t.paint(m, G, domo=0.45, luz=0.2, ow=2.5)
    inner = t.mask(lambda d, s: d.ellipse([13 * s, 13 * s, 115 * s, 115 * s], fill=255)); t.paint(inner, lum(G, 0.78), domo=0.5, luz=0.1, ow=1.2, contorno=lum(G, 0.45)); save(t, 'base')
def sombra():
    t = Tela(); t.sombra(t.mask(lambda d, s: d.ellipse([22 * s, 40 * s, 106 * s, 104 * s], fill=255)), off=(0, 2), blur=4, op=0.75); t.final(f'{OUT}/sombra.webp')
def capas():
    for nome, fim in (('curta', 98), ('longa', 120)):
        t = Tela(); pts = [(36, 70), (92, 70), (100, fim - 6), (82, fim), (46, fim), (28, fim - 6)]
        t.paint(t.mask(lambda d, s: d.polygon([(x * s, y * s) for x, y in pts], fill=255)), G, domo=0.35, luz=0.15, sombra_baixo=0.25)
        t.linha([(64, 72), (64, fim - 4)], lum(G, 0.82), 1.2, ow=0); save(t, 'capa_' + nome)
# ---------- corpo ----------
BR_E = [(38, 76), (35, 62), (43, 48)]; BR_D = [(90, 76), (93, 62), (85, 48)]
def braco():
    t = Tela()
    for br in (BR_E, BR_D):
        t.linha(curva(*br), G, 10.5, ow=1.8); t.elipse(br[2][0], br[2][1] - 1, 6.2, 6.2, G, ow=1.6, domo=0.5)
    t.elipse(64, 70, 9, 8, G, ow=1.6); save(t, 'braco')
def torso(t, rx=33, ry=17, cy=76, cor=G, **kw):
    t.elipse(64, cy, rx, ry, cor, domo=0.5, **kw)
def roupa(g):
    t1 = Tela(); t2 = Tela()
    mangas = g != 2
    if mangas:
        for br in (BR_E, BR_D): t1.linha(curva(*br), G, 12.5, ow=1.8)
    torso(t1, 32 if g != 2 else 28, 17); 
    if g == 1:   # camisa e colete
        t2.poli([(40, 72), (60, 66), (60, 90), (42, 88)], G, ow=1.5); t2.poli([(88, 72), (68, 66), (68, 90), (86, 88)], G, ow=1.5)
    elif g == 3: # gibão com cintas
        t2.linha([(38, 70), (90, 88)], G, 5, ow=1.3); t2.linha([(90, 70), (38, 88)], G, 5, ow=1.3); t2.linha([(34, 84), (94, 84)], G, 5.5, ow=1.3)
    elif g == 4: # túnica longa: barra
        t2.paint(t2.mask(lambda d, s: (d.ellipse([30 * s, 66 * s, 98 * s, 100 * s], fill=255), d.ellipse([36 * s, 72 * s, 92 * s, 94 * s], fill=0))), G, ow=1.2, domo=0.3)
    elif g == 5: # roupão: lapela e faixa
        t2.poli([(52, 64), (64, 84), (76, 64), (72, 62), (64, 74), (56, 62)], G, ow=1.4); t2.linha([(36, 86), (92, 86)], G, 5, ow=1.3)
    elif g == 6: # casaco: gola grande
        t1.paint(t1.mask(lambda d, s: d.ellipse([40 * s, 56 * s, 88 * s, 84 * s], fill=255)), lum(G, 1.0), domo=0.6, ow=1.6)
        t2.elipse(64, 80, 3, 3, G, ow=1); t2.elipse(64, 88, 3, 3, G, ow=1)
    elif g == 7: # capuz atrás do pescoço
        t1.paint(t1.mask(lambda d, s: d.ellipse([40 * s, 60 * s, 88 * s, 94 * s], fill=255)), G, domo=0.6, ow=1.6); t2.paint(t2.mask(lambda d, s: (d.ellipse([40 * s, 60 * s, 88 * s, 94 * s], fill=255), d.ellipse([46 * s, 66 * s, 82 * s, 90 * s], fill=0))), G, ow=1.0, domo=0.2)
    elif g == 2: # regata: alças
        t2.linha([(46, 66), (46, 80)], G, 4, ow=1.2); t2.linha([(82, 66), (82, 80)], G, 4, ow=1.2)
    save(t1, f'roupa_{g}_1'); save(t2, f'roupa_{g}_2')
# ---------- armadura ----------
def tex_malha(xx, yy): return 0.9 + 0.1 * (((np.floor(xx / 9) + np.floor(yy / 9)) % 2) * 1.0)
def tex_escamas(xx, yy):
    u = (xx / 10.0); v = (yy / 8.0) + (np.floor(u) % 2) * 0.5; fx = u - np.floor(u); fy = v - np.floor(v); d = np.sqrt((fx - 0.5) ** 2 + (fy - 0.15) ** 2); return 0.82 + 0.2 * np.clip(1 - d * 1.4, 0, 1)
def tex_couro(xx, yy): return 0.93 + 0.07 * np.sin(yy / 9.0)
def tex_placa(xx, yy): return 0.88 + 0.12 * np.clip(np.sin(yy / 6.0), 0, 1)
TEX = {'couro': tex_couro, 'malha': tex_malha, 'escamas': tex_escamas, 'placa': tex_placa}
def peito(mat):
    t1 = Tela(); t2 = Tela(); tx = TEX[mat]
    t1.paint(t1.mask(lambda d, s: d.ellipse([34 * s, 60 * s, 94 * s, 94 * s], fill=255)), G, domo=0.5, ow=1.8, textura=lambda xx, yy: tx(xx / SS, yy / SS))
    if mat == 'placa': t2.linha([(64, 62), (64, 92)], G, 3.2, ow=1.2); t2.linha([(40, 78), (88, 78)], G, 2.6, ow=1.0)
    if mat == 'couro': t2.linha([(36, 76), (92, 76)], G, 3.4, ow=1.2)
    if mat in ('malha', 'escamas'): t2.linha([(38, 90), (90, 90)], G, 3.4, ow=1.2)
    save(t1, f'peito_{mat}_1'); save(t2, f'peito_{mat}_2')
def ombro(forma):
    t1 = Tela(); t2 = Tela()
    for sx in (-1, 1):
        cx = 64 + sx * 29
        if forma == 'redondo': t1.elipse(cx, 70, 12, 11, G, ow=1.8, brilho=0.25); t2.paint(t2.mask(lambda d, s: (d.ellipse([(cx - 12) * s, 59 * s, (cx + 12) * s, 81 * s], fill=255), d.ellipse([(cx - 8) * s, 63 * s, (cx + 8) * s, 77 * s], fill=0))), G, ow=1.0, domo=0.2)
        elif forma == 'pontudo':
            pts = [(cx - 12 * sx * -1 * 0, 0)]
            pts = [(cx + sx * 14, 74), (cx + sx * 6, 60), (cx + sx * 2, 52), (cx - sx * 8, 62), (cx - sx * 10, 78), (cx + sx * 2, 82)]
            t1.poli(pts, G, ow=1.8, brilho=0.25); t2.linha([(cx + sx * 8, 66), (cx - sx * 4, 76)], G, 2.2, ow=1.0)
        elif forma == 'chifre':
            t1.elipse(cx, 71, 11, 10, G, ow=1.8, brilho=0.2)
            t2.poli([(cx + sx * 2, 66), (cx + sx * 10, 52), (cx + sx * 15, 40), (cx + sx * 12, 58), (cx + sx * 8, 70)], (232, 224, 205), ow=1.4)
    if forma == 'capuz': t1.paint(t1.mask(lambda d, s: (d.ellipse([38 * s, 56 * s, 90 * s, 92 * s], fill=255), d.ellipse([49 * s, 56 * s, 79 * s, 80 * s], fill=0))), G, domo=0.7, ow=1.8)
    save(t1, f'ombro_{forma}_1'); save(t2, f'ombro_{forma}_2')
# ---------- cabeça ----------
CX, CY = 64, 60
def cabeca(i):
    t = Tela(); rx, ry = [(14, 16), (15.5, 15.5), (15, 15), (12.5, 18), (14, 16.5), (15, 16)][i]
    if i == 2: t.paint(t.mask(lambda d, s: d.rounded_rectangle([(CX - rx) * s, (CY - ry) * s, (CX + rx) * s, (CY + ry) * s], radius=7 * s, fill=255)), G, domo=0.6, ow=1.8, brilho=0.3)
    elif i == 4: t.poli([(CX, CY - 18), (CX + 13, CY - 9), (CX + 14, CY + 6), (CX + 6, CY + 16), (CX - 6, CY + 16), (CX - 14, CY + 6), (CX - 13, CY - 9)], G, domo=0.6, ow=1.8, brilho=0.3)
    elif i == 5: t.poli(curva((CX - 15, CY - 8), (CX, CY - 22), (CX + 15, CY - 8), 10) + curva((CX + 15, CY - 8), (CX + 8, CY + 14), (CX, CY + 17), 8) + curva((CX, CY + 17), (CX - 8, CY + 14), (CX - 15, CY - 8), 8), G, domo=0.6, ow=1.8, brilho=0.3)
    else: t.elipse(CX, CY, rx, ry, G, domo=0.6, ow=1.8, brilho=0.3)
    t.elipse(CX, CY - ry + 1.5, 3.2, 3.0, lum(G, 1.0), ow=1.2, domo=0.4)          # ponta do nariz
    save(t, f'cabeca_{i}')
def cabeca_dragao():
    t = Tela(); t.elipse(CX, CY + 2, 14.5, 16, G, domo=0.6, ow=1.8, brilho=0.3)
    t.poli([(CX - 8, CY - 8), (CX - 6, CY - 24), (CX + 6, CY - 24), (CX + 8, CY - 8)], G, domo=0.6, ow=1.8); t.elipse(CX - 3, CY - 22, 1.3, 1.3, lum(G, 0.4), ow=0); t.elipse(CX + 3, CY - 22, 1.3, 1.3, lum(G, 0.4), ow=0)
    t.linha([(CX, CY - 4), (CX, CY + 14)], lum(G, 0.75), 3, ow=0.9)
    for k in range(3): t.elipse(CX - 10 + k * 0, CY - 2 + k * 6, 2.2, 3, lum(G, 0.85), ow=0.9); t.elipse(CX + 10, CY - 2 + k * 6, 2.2, 3, lum(G, 0.85), ow=0.9)
    save(t, 'cabeca_dragao')
def orelhas():
    for nome in ('redonda', 'longa', 'pontuda', 'pequena'):
        t = Tela()
        for sx in (-1, 1):
            x0 = CX + sx * 14
            if nome == 'redonda': t.elipse(x0 + sx * 1.5, CY + 1, 3.6, 5, G, ow=1.5)
            elif nome == 'pequena': t.elipse(x0 + sx * 0.5, CY + 1, 2.6, 3.6, G, ow=1.4)
            elif nome == 'longa': t.poli([(x0 - sx, CY - 2), (x0 + sx * 20, CY + 8), (x0 + sx * 3, CY + 6)], G, ow=1.5, domo=0.3)
            else: t.poli([(x0 - sx, CY - 2), (x0 + sx * 11, CY + 3), (x0 + sx * 2, CY + 7)], G, ow=1.5, domo=0.3)
        save(t, 'orelha_' + nome)
def presas():
    t = Tela()
    for sx in (-1, 1): t.poli([(CX + sx * 5 - 2, CY - 17), (CX + sx * 5 + 2, CY - 17), (CX + sx * 5 + sx * 1, CY - 25)], (240, 234, 214), ow=1.2, domo=0.3)
    save(t, 'presas')
def chifres():
    for i in range(4):
        t = Tela(); cor = (228, 220, 200)
        for sx in (-1, 1):
            if i == 0: pts = curva((CX + sx * 8, CY - 10), (CX + sx * 24, CY - 30), (CX + sx * 22, CY - 6), 14)      # curvos
            elif i == 1: pts = [(CX + sx * 8, CY - 10), (CX + sx * 14, CY - 40)]
            elif i == 2: pts = curva((CX + sx * 10, CY - 8), (CX + sx * 30, CY - 24), (CX + sx * 20, CY + 4), 14)     # carneiro
            else: pts = [(CX + sx * 9, CY - 11), (CX + sx * 12, CY - 24)]
            t.linha(pts, cor, 5.2 if i != 3 else 4.2, ow=1.4)
        save(t, f'chifre_{i}')
# ---------- cabelo ----------
def calota(t, cor=G, r=16.2, dy=1.5, **kw): t.elipse(CX, CY + dy, r, r + 0.4, cor, domo=0.55, ow=1.6, **kw)
def tufos(t, n, r, cy, cor=G, tam=5, ang0=0, **kw):
    for k in range(n): a = ang0 + 2 * math.pi * k / n; t.elipse(CX + r * math.cos(a), cy + r * math.sin(a), tam, tam, cor, ow=1.3, domo=0.5)
def cabelo(i):
    t = Tela()
    if i == 0: return
    if i == 1: t.paint(t.mask(lambda d, s: d.ellipse([(CX - 15) * s, (CY - 14) * s, (CX + 15) * s, (CY + 17) * s], fill=255)), G, domo=0.3, ow=0, alpha=0.55)
    elif i in (2, 3, 4, 20, 22):
        calota(t)
        if i == 3: t.linha([(CX - 2, CY - 12), (CX + 2, CY + 14)], lum(G, 0.7), 1.2, ow=0)
        if i == 4: t.elipse(CX, CY - 12, 9, 6, G, ow=1.5, brilho=0.3)
        if i == 20: t.paint(t.mask(lambda d, s: d.ellipse([(CX - 7) * s, (CY - 9) * s, (CX + 7) * s, (CY + 11) * s], fill=255)), lum(G, 1.0), domo=0.8, ow=1.4)
        if i == 22: t.paint(t.mask(lambda d, s: d.ellipse([(CX - 7) * s, (CY - 5) * s, (CX + 7) * s, (CY + 9) * s], fill=255)), (240, 205, 175), domo=0.5, ow=1.2)
    elif i == 5:
        calota(t, r=14.5)
        for k in range(10): a = -math.pi / 2 + (k - 4.5) * 0.45; t.poli([(CX + 12 * math.cos(a - 0.12), CY + 12 * math.sin(a - 0.12)), (CX + 22 * math.cos(a), CY + 22 * math.sin(a)), (CX + 12 * math.cos(a + 0.12), CY + 12 * math.sin(a + 0.12))], G, ow=1.0, domo=0.3)
        calota(t, r=14)
    elif i == 6: t.paint(t.mask(lambda d, s: d.rounded_rectangle([(CX - 5) * s, (CY - 17) * s, (CX + 5) * s, (CY + 20) * s], radius=5 * s, fill=255)), G, domo=0.8, ow=1.6, brilho=0.3); t.paint(t.mask(lambda d, s: (d.ellipse([(CX - 14) * s, (CY - 14) * s, (CX + 14) * s, (CY + 16) * s], fill=255))), G, domo=0.2, ow=0, alpha=0.4)
    elif i in (7, 8, 9, 23):
        if i == 23: tufos(t, 12, 14, CY + 2, tam=6); calota(t, r=14)
        else:
            t.elipse(CX, CY + 4, 19, 21, G, domo=0.55, ow=1.6)
            if i == 9: t.elipse(CX, CY - 12, 14, 7, G, ow=1.4, brilho=0.3)
            if i == 7: t.linha([(CX - 8, CY - 6), (CX + 8, CY + 12)], lum(G, 0.8), 1.2, ow=0)
    elif i == 18: t.elipse(CX, CY + 1, 23, 23, G, domo=0.7, ow=1.8); tufos(t, 16, 21, CY + 1, tam=4)
    elif i in (10, 11, 19, 21):
        t.paint(t.mask(lambda d, s: d.polygon([(x * s, y * s) for x, y in [(CX - 17, CY), (CX + 17, CY), (CX + 24, CY + 40), (CX + 10, CY + 46), (CX - 10, CY + 46), (CX - 24, CY + 40)]], fill=255)), G, domo=0.45, ow=1.6, sombra_baixo=0.2)
        calota(t, r=17)
        if i == 11: [t.linha(curva((CX - 18 + k * 9, CY + 4), (CX - 20 + k * 9, CY + 22), (CX - 16 + k * 9, CY + 42), 10), lum(G, 0.82), 1.3, ow=0) for k in range(5)]
        if i == 19: [t.linha([(CX - 20 + k * 8, CY + 6), (CX - 22 + k * 8, CY + 40)], lum(G, 0.7), 2.4, ow=1.0) for k in range(6)]
        if i == 21: calota(t, r=16); [t.linha([(CX - 14, CY + 6), (CX - 14, CY + 38)], lum(G, 0.9), 3, ow=1.2), t.linha([(CX + 14, CY + 6), (CX + 14, CY + 38)], lum(G, 0.9), 3, ow=1.2)]
    elif i in (12, 13):
        t.linha(curva((CX, CY + 10), (CX, CY + 30), (CX + (3 if i == 12 else -2), CY + (44 if i == 12 else 34)), 14), G, 7, ow=1.5); calota(t); t.elipse(CX, CY + 14, 3.5, 3, lum(G, 0.7), ow=0)
    elif i == 14: calota(t); t.elipse(CX, CY + 21, 8, 8, G, ow=1.6, brilho=0.3); t.elipse(CX, CY + 21, 4, 4, lum(G, 0.82), ow=0)
    elif i in (15, 16, 17):
        calota(t)
        lados = [-1, 1] if i == 15 else ([1] if i == 16 else [0])
        for sx in lados:
            x = CX + sx * (13 if i != 17 else 0); y0 = CY + 8; y1 = CY + (30 if i != 17 else 46)
            t.linha([(x, y0), (x + sx * 2, y1)], G, 6.5, ow=1.4)
            for k in range(5): yy = y0 + (y1 - y0) * (k + 0.5) / 5; t.linha([(x - 3, yy), (x + sx * 2 + 3, yy + 2)], lum(G, 0.74), 1.1, ow=0)
    save(t, f'cabelo_{i}')
def barba(i):
    t = Tela()
    if i == 0: return
    fy = CY - 11   # frente do rosto (topo)
    if i == 1: t.paint(t.mask(lambda d, s: (d.ellipse([(CX - 14) * s, (CY - 16) * s, (CX + 14) * s, (CY + 16) * s], fill=255), d.ellipse([(CX - 11) * s, (CY - 9) * s, (CX + 11) * s, (CY + 14) * s], fill=0))), G, ow=0, alpha=0.5)
    elif i == 2: t.paint(t.mask(lambda d, s: d.ellipse([(CX - 9) * s, (fy - 5) * s, (CX + 9) * s, (fy + 1) * s], fill=255)), G, ow=1.3)
    elif i == 3: t.poli([(CX - 4, fy - 9), (CX + 4, fy - 9), (CX + 3, fy - 17), (CX, fy - 19), (CX - 3, fy - 17)], G, ow=1.3)
    elif i in (4, 5, 8, 9):
        w = 6 if i == 5 else 4
        t.paint(t.mask(lambda d, s: (d.ellipse([(CX - 15) * s, (CY - 17) * s, (CX + 15) * s, (CY + 15) * s], fill=255), d.ellipse([(CX - 15 + w) * s, (CY - 17 + w) * s, (CX + 15 - w) * s, (CY + 15) * s], fill=0))), G, ow=1.3, domo=0.4)
        if i == 8: t.paint(t.mask(lambda d, s: d.ellipse([(CX - 9) * s, (fy - 5) * s, (CX + 9) * s, (fy + 1) * s], fill=255)), G, ow=1.3); t.poli([(CX - 3, fy - 10), (CX + 3, fy - 10), (CX, fy - 17)], G, ow=1.2)
        if i == 9: t.paint(t.mask(lambda d, s: (d.rectangle([(CX - 17) * s, (CY - 6) * s, (CX - 12) * s, (CY + 8) * s], fill=255), d.rectangle([(CX + 12) * s, (CY - 6) * s, (CX + 17) * s, (CY + 8) * s], fill=255))), G, ow=1.2)
    elif i in (6, 7, 10, 11):
        L = 26 if i != 10 else 34
        if i == 11:
            for sx in (-1, 1): t.poli([(CX + sx * 2, fy - 4), (CX + sx * 11, fy - 24), (CX + sx * 6, fy - 2)], G, ow=1.3, domo=0.4)
            t.paint(t.mask(lambda d, s: d.ellipse([(CX - 12) * s, (fy - 6) * s, (CX + 12) * s, (fy + 1) * s], fill=255)), G, ow=1.3)
        else:
            t.paint(t.mask(lambda d, s: (d.ellipse([(CX - 14) * s, (CY - 17) * s, (CX + 14) * s, (CY + 4) * s], fill=255))), G, ow=1.3, domo=0.4)
            t.poli(curva((CX - 12, fy - 4), (CX - 11, fy - L), (CX, fy - L - 4), 8) + curva((CX, fy - L - 4), (CX + 11, fy - L), (CX + 12, fy - 4), 8), G, ow=1.4, domo=0.5)
            if i == 7: [t.linha([(CX - 6 + k * 6, fy - 6), (CX - 6 + k * 6, fy - L + 2)], lum(G, 0.7), 1.2, ow=0) for k in range(3)]
            if i == 10: t.linha([(CX - 8, fy - 12), (CX, fy - L - 2)], lum(G, 1.0), 1.0, ow=0, domo=0)
    save(t, f'barba_{i}')
# ---------- elmos / acessórios ----------
def elmo(nome):
    t1 = Tela(); t2 = Tela(); c = (CX, CY - 1)
    if nome == 'chapeu':
        t1.paint(t1.mask(lambda d, s: d.ellipse([(CX - 27) * s, (CY - 24) * s, (CX + 27) * s, (CY + 26) * s], fill=255)), G, domo=0.35, ow=1.8)
        t1.paint(t1.mask(lambda d, s: d.ellipse([(CX - 13) * s, (CY - 12) * s, (CX + 13) * s, (CY + 14) * s], fill=255)), G, domo=1.0, ow=1.6, brilho=0.4)
        t2.paint(t2.mask(lambda d, s: (d.ellipse([(CX - 14) * s, (CY - 13) * s, (CX + 14) * s, (CY + 15) * s], fill=255), d.ellipse([(CX - 11) * s, (CY - 10) * s, (CX + 11) * s, (CY + 12) * s], fill=0))), G, ow=0.8, domo=0.2)
    elif nome == 'coroa':
        t1.paint(t1.mask(lambda d, s: (d.ellipse([(CX - 17) * s, (CY - 17) * s, (CX + 17) * s, (CY + 17) * s], fill=255), d.ellipse([(CX - 12) * s, (CY - 12) * s, (CX + 12) * s, (CY + 12) * s], fill=0))), G, domo=0.5, ow=1.6)
        for k in range(8): a = k * math.pi / 4; t2.elipse(CX + 17 * math.cos(a), CY + 17 * math.sin(a), 2.6, 2.6, G, ow=1.0)
    else:
        r = 17 if nome != 'capuz' else 19
        t1.elipse(CX, CY + 1, r, r + 1, G, domo=0.75, ow=1.9, brilho=0.4)
        if nome == 'aberto': t2.linha([(CX, CY - 16), (CX, CY + 14)], G, 3, ow=1.2); t2.paint(t2.mask(lambda d, s: d.rectangle([(CX - 3) * s, (CY - 20) * s, (CX + 3) * s, (CY - 10) * s], fill=255)), G, ow=1.0)
        if nome == 'fechado': t2.linha([(CX - 9, CY - 11), (CX + 9, CY - 11)], (30, 30, 36), 2.6, ow=0); t2.linha([(CX, CY - 15), (CX, CY + 16)], G, 2.6, ow=1.0)
        if nome == 'crista':
            t2.paint(t2.mask(lambda d, s: d.rounded_rectangle([(CX - 3.5) * s, (CY - 18) * s, (CX + 3.5) * s, (CY + 22) * s], radius=3 * s, fill=255)), G, domo=0.7, ow=1.4)
        if nome == 'chifres':
            t1.linha([(CX, CY - 16), (CX, CY + 14)], G, 3, ow=1.0)
            for sx in (-1, 1): t2.linha(curva((CX + sx * 15, CY - 6), (CX + sx * 32, CY - 24), (CX + sx * 22, CY - 40), 12), (232, 224, 205), 5, ow=1.4)
        if nome == 'capuz': t2.paint(t2.mask(lambda d, s: (d.ellipse([(CX - 19) * s, (CY - 18) * s, (CX + 19) * s, (CY + 20) * s], fill=255), d.ellipse([(CX - 13) * s, (CY - 12) * s, (CX + 13) * s, (CY + 14) * s], fill=0))), G, ow=1.0, domo=0.2)
    save(t1, f'elmo_{nome}_1'); save(t2, f'elmo_{nome}_2')
def acessorio(i):
    t = Tela()
    if i == 1: t.paint(t.mask(lambda d, s: (d.ellipse([(CX - 15) * s, (CY - 16) * s, (CX + 15) * s, (CY + 16) * s], fill=255), d.ellipse([(CX - 15) * s, (CY - 11) * s, (CX + 15) * s, (CY + 21) * s], fill=0))), (190, 60, 50), domo=0.3, ow=1.2)
    elif i == 2: t.paint(t.mask(lambda d, s: d.ellipse([(CX - 16) * s, (CY - 14) * s, (CX + 16) * s, (CY + 17) * s], fill=255)), (200, 62, 52), domo=0.4, ow=1.5); t.poli([(CX, CY + 14), (CX - 7, CY + 26), (CX + 7, CY + 26)], (200, 62, 52), ow=1.3)
    elif i == 3:
        for sx in (-1, 1): t.elipse(CX + sx * 17, CY + 3, 2.3, 2.3, GOLD, ow=1.0, brilho=0.4)
    elif i == 4: t.linha([(CX - 13, CY - 8), (CX + 13, CY - 8)], (40, 40, 46), 1.6, ow=0); [t.elipse(CX + sx * 6, CY - 9, 5, 3.2, (130, 190, 220), ow=1.2, alpha=0.8) for sx in (-1, 1)]
    elif i == 5:
        for k in range(14): a = 2 * math.pi * k / 14; t.elipse(CX + 17 * math.cos(a), CY + 1 + 17 * math.sin(a), 3.4, 2.0, (70, 150, 70), rot=a + math.pi / 2, ow=1.0)
    elif i == 6: t.paint(t.mask(lambda d, s: (d.ellipse([(CX - 15) * s, (CY - 15) * s, (CX + 15) * s, (CY + 15) * s], fill=255), d.ellipse([(CX - 13) * s, (CY - 13) * s, (CX + 13) * s, (CY + 17) * s], fill=0))), GOLD, ow=1.0, brilho=0.4); t.elipse(CX, CY - 14, 2.8, 2.8, (90, 170, 230), ow=1.0, brilho=0.6)
    elif i == 7:
        t.paint(t.mask(lambda d, s: d.ellipse([(CX - 25) * s, (CY - 24) * s, (CX + 25) * s, (CY + 26) * s], fill=255)), (140, 98, 58), domo=0.35, ow=1.8)
        t.paint(t.mask(lambda d, s: d.ellipse([(CX - 13) * s, (CY - 12) * s, (CX + 13) * s, (CY + 14) * s], fill=255)), (164, 116, 70), domo=0.9, ow=1.5, brilho=0.3)
        t.paint(t.mask(lambda d, s: (d.ellipse([(CX - 14) * s, (CY - 13) * s, (CX + 14) * s, (CY + 15) * s], fill=255), d.ellipse([(CX - 11) * s, (CY - 10) * s, (CX + 11) * s, (CY + 12) * s], fill=0))), (88, 58, 36), ow=0.8)
    elif i == 8: t.poli([(CX - 12, CY + 14), (CX + 12, CY + 14), (CX, CY + 30)], (196, 64, 50), ow=1.4, domo=0.3)
    elif i == 9: t.paint(t.mask(lambda d, s: (d.ellipse([(CX + 3) * s, (CY - 14) * s, (CX + 11) * s, (CY - 6) * s], fill=255), d.ellipse([(CX + 5) * s, (CY - 12) * s, (CX + 9) * s, (CY - 8) * s], fill=0))), GOLD, ow=0.8); t.linha([(CX + 10, CY - 7), (CX + 20, CY + 8)], GOLD, 0.9, ow=0)
    save(t, f'acess_{i}')
# ---------- armas e escudo (empunhadas pela mão direita ≈ (85,50); escudo na esquerda ≈ (43,50)) ----------
HX, HY = 85, 49
def punho(t, x=HX, y=HY): t.elipse(x, y, 6.4, 6.0, LEATHER, ow=1.5, domo=0.6, brilho=0.25)
def lamina(t, x, y0, y1, w, cor=STEEL, ponta=True, cx=0):
    pts = [(x - w / 2, y1), (x - w / 2, y0 + (w * 1.2 if ponta else 0)), (x + cx, y0 - 0.5), (x + w / 2, y0 + (w * 1.2 if ponta else 0)), (x + w / 2, y1)]
    t.poli(pts, cor, domo=0.7, ow=1.5, brilho=0.4); t.linha([(x, y0 + 4), (x, y1 - 2)], lum(cor, 0.78), 0.9, ow=0)
def arma(nome):
    t = Tela(); x = HX
    if nome in ('espadaLonga', 'espadaCurta', 'rapieira', 'adaga', 'espadaGrande', 'cimitarra'):
        comp = {'espadaLonga': 40, 'espadaCurta': 28, 'rapieira': 44, 'adaga': 20, 'espadaGrande': 52, 'cimitarra': 36}[nome]; w = {'espadaLonga': 6, 'espadaCurta': 6.5, 'rapieira': 3.2, 'adaga': 5, 'espadaGrande': 9.5, 'cimitarra': 7}[nome]
        y1 = HY - 5; y0 = y1 - comp
        if nome == 'cimitarra':
            t.poli(curva((x - 3, y1), (x - 9, y0 + 16), (x + 4, y0), 14) + curva((x + 4, y0), (x + 5, y0 + 18), (x + 3, y1), 10), STEEL, domo=0.7, ow=1.5, brilho=0.4)
        else: lamina(t, x, y0, y1, w)
        gw = 15 if nome != 'adaga' else 10
        if nome == 'rapieira': t.elipse(x, HY - 5, 8, 4, GOLD, ow=1.3, brilho=0.4)
        else: t.paint(t.mask(lambda d, s: d.rounded_rectangle([(x - gw / 2) * s, (HY - 7) * s, (x + gw / 2) * s, (HY - 3.5) * s], radius=2 * s, fill=255)), GOLD, ow=1.4, brilho=0.4)
        t.linha([(x, HY - 3), (x, HY + 11)], LEATHER, 3.8, ow=1.2); t.elipse(x, HY + 13, 3, 3, GOLD, ow=1.0)
    elif nome in ('machadinha', 'machadoBatalha', 'machadoGrande'):
        L = {'machadinha': 36, 'machadoBatalha': 44, 'machadoGrande': 54}[nome]; big = nome == 'machadoGrande'
        t.linha([(x, HY + 12), (x, HY - L + 8)], WOOD, 4, ow=1.5)
        a = 11 if not big else 15; yb = HY - L + 6
        for sx in ((1,) if not big else (-1, 1)):
            t.poli(curva((x + sx * 2, yb - 2), (x + sx * (a + 7), yb + 7), (x + sx * 2, yb + a + 8), 10), STEEL, domo=0.7, ow=1.6, brilho=0.4)
    elif nome in ('martelo', 'maca'):
        L = 38 if nome == 'martelo' else 34; yb = HY - L + 4
        t.linha([(x, HY + 12), (x, yb + 2)], WOOD, 4, ow=1.5)
        if nome == 'martelo': t.paint(t.mask(lambda d, s: d.rounded_rectangle([(x - 8) * s, (yb - 6) * s, (x + 8) * s, (yb + 6) * s], radius=2 * s, fill=255)), STEEL, domo=0.7, ow=1.6, brilho=0.4)
        else:
            t.elipse(x, yb, 7.5, 8.5, STEEL, domo=0.8, ow=1.6, brilho=0.4)
            for k in range(6): a = k * math.pi / 3; t.elipse(x + 8 * math.cos(a), yb + 9 * math.sin(a), 2.2, 2.2, lum(STEEL, 0.85), ow=1.0)
    elif nome == 'cajado':
        t.linha([(x, HY + 26), (x, 8)], WOOD, 4.6, ow=1.6); t.elipse(x, 7, 6.2, 6.2, (120, 190, 235), ow=1.5, brilho=0.7)
        for sx in (-1, 1): t.poli([(x + sx * 1, 14), (x + sx * 7, 6), (x + sx * 3, 3)], GOLD, ow=1.0)
    elif nome in ('arcoCurto', 'arcoLongo'):
        h = 34 if nome == 'arcoCurto' else 44; xs = 92
        pts = curva((xs - 10, HY - h), (xs + 20, HY), (xs - 10, HY + h), 24)
        t.linha([(xs - 10, HY - h), (xs - 10, HY + h)], (232, 228, 210), 0.9, ow=0)
        t.linha(pts, WOOD, 4.2, ow=1.5); t.elipse(xs + 2, HY, 3.4, 5, LEATHER, ow=1.2)
    else: pass
    punho(t); save(t, 'arma_' + nome)
def escudo():
    t = Tela(); cx, cy = 40, 51
    t.paint(t.mask(lambda d, s: d.ellipse([(cx - 17) * s, (cy - 21) * s, (cx + 17) * s, (cy + 21) * s], fill=255)), G, domo=0.55, ow=2.0, brilho=0.3); save(t, 'escudo_1')
    t2 = Tela(); t2.paint(t2.mask(lambda d, s: (d.ellipse([(cx - 17) * s, (cy - 21) * s, (cx + 17) * s, (cy + 21) * s], fill=255), d.ellipse([(cx - 13) * s, (cy - 17) * s, (cx + 13) * s, (cy + 17) * s], fill=0))), G, ow=1.2, domo=0.3)
    t2.elipse(cx, cy, 5, 5, STEEL, ow=1.4, brilho=0.6); t2.punho = None; save(t2, 'escudo_2')
    t3 = Tela(); t3.elipse(43, 50, 6.4, 6.0, LEATHER, ow=1.5, domo=0.6); save(t3, 'escudo_3')
def tudo():
    base(); sombra(); capas(); braco(); [roupa(g) for g in range(8)]; [peito(m) for m in TEX]; [ombro(f) for f in ('redondo', 'pontudo', 'chifre', 'capuz')]
    [cabeca(i) for i in range(6)]; cabeca_dragao(); orelhas(); presas(); chifres(); [cabelo(i) for i in range(1, 24)]; [barba(i) for i in range(1, 12)]
    [elmo(n) for n in ('aberto', 'fechado', 'crista', 'chifres', 'capuz', 'chapeu', 'coroa')]; [acessorio(i) for i in range(1, 10)]
    [arma(n) for n in ('espadaLonga', 'espadaCurta', 'rapieira', 'adaga', 'espadaGrande', 'cimitarra', 'machadinha', 'machadoBatalha', 'machadoGrande', 'martelo', 'maca', 'cajado', 'arcoCurto', 'arcoLongo')]; escudo()
if __name__ == '__main__': tudo(); print(len(os.listdir(OUT)), 'camadas')
