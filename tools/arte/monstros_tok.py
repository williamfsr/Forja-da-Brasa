"""Tokens de vista superior para as 340 criaturas do SRD (webp 128x128, originais — gerados proceduralmente).
Uso: python3 monstros_tok.py <monstros_srd.js> <saida_dir> [filtro]"""
import sys, os, re, json, math, random, hashlib
import numpy as np
from pintor import *
def H(h): return hex2rgb(h)
def rnd(id_): return random.Random(int(hashlib.md5(id_.encode()).hexdigest()[:8], 16))
PELE = {'verde': '#6a9a4a', 'oliva': '#7a8a4a', 'cinza': '#8a8f98', 'azul': '#5a7ab0', 'vermelho': '#b04a3a', 'marrom': '#8a5a3a', 'pele': '#d9a574', 'roxo': '#7a4a9a', 'amarelo': '#c8b04a', 'branco': '#dfe6ea', 'negro': '#3a3a44', 'laranja': '#c8742a'}
def C(n): return H(PELE.get(n, n)) if not n.startswith('#') else H(n)
# ---------- peças comuns ----------
def sombra(t, rx=40, ry=40, cy=66, op=0.55): t.sombra(t.mask(lambda d, s: d.ellipse([(64 - rx) * s, (cy - ry) * s, (64 + rx) * s, (cy + ry) * s], fill=255)), off=(0, 2), blur=4, op=op)
def olhos(t, x, y, sep, cor=(250, 230, 120), r=1.8):
    for sx in (-1, 1): t.elipse(x + sx * sep, y, r, r, cor, ow=0.6, domo=0.2)
def asa_morcego(t, sx, base, tam, cor, cor2, dedos=4):
    bx, by = base; pts = [(bx, by)]; tips = []
    for k in range(dedos): a = -math.pi * (0.55 - 0.9 * k / (dedos - 1)); tips.append((bx + sx * tam * (0.45 + 0.55 * math.sin(k / (dedos - 1) * 1.6 + 0.2)) * 1.0, by - tam * (0.95 - 0.55 * k / (dedos - 1)) + k * 3))
    poly = [(bx, by)] + [tips[0]]
    for k in range(dedos - 1): mid = ((tips[k][0] + tips[k + 1][0]) / 2 - sx * 4, (tips[k][1] + tips[k + 1][1]) / 2 + 6); poly += [mid, tips[k + 1]]
    poly += [(bx, by + 8)]
    t.poli(poly, cor2, ow=1.6, domo=0.4)
    for tp in tips: t.linha([(bx, by), tp], cor, 2.4, ow=1.0)
def asa_ave(t, sx, base, tam, cor, cor2):
    bx, by = base
    pts = [(bx, by), (bx + sx * tam * 0.5, by - tam * 0.35), (bx + sx * tam, by - tam * 0.25), (bx + sx * tam * 0.92, by + tam * 0.05), (bx + sx * tam * 0.6, by + tam * 0.18), (bx + sx * tam * 0.2, by + tam * 0.22)]
    t.poli(pts, cor, ow=1.6, domo=0.5)
    for k in range(5): f = k / 4; t.linha([(bx + sx * tam * (0.25 + 0.65 * f), by - tam * (0.15 + 0.1 * f)), (bx + sx * tam * (0.3 + 0.62 * f), by + tam * (0.12 + 0.0 * f))], cor2, 1.4, ow=0)
def arma_h(t, nome, x, y, c=(205, 210, 222)):
    if nome == 'espada': t.poli([(x - 2.5, y - 4), (x - 2.5, y - 26), (x, y - 31), (x + 2.5, y - 26), (x + 2.5, y - 4)], c, ow=1.3, brilho=0.4); t.linha([(x - 6, y - 4), (x + 6, y - 4)], (190, 160, 70), 2.4, ow=0.8)
    elif nome == 'machado': t.linha([(x, y + 6), (x, y - 28)], (140, 100, 60), 3.2, ow=1.2); t.poli(curva((x + 1, y - 30), (x + 14, y - 24), (x + 1, y - 14), 8), c, ow=1.4, brilho=0.3)
    elif nome == 'clava': t.linha([(x, y + 6), (x, y - 24)], (140, 100, 60), 3.6, ow=1.2); t.elipse(x, y - 25, 5.5, 7, (150, 108, 66), ow=1.4)
    elif nome == 'lanca': t.linha([(x, y + 10), (x, y - 36)], (140, 100, 60), 2.6, ow=1.0); t.poli([(x - 3, y - 34), (x, y - 44), (x + 3, y - 34)], c, ow=1.2)
    elif nome == 'adaga': t.poli([(x - 2, y - 3), (x - 2, y - 14), (x, y - 19), (x + 2, y - 14), (x + 2, y - 3)], c, ow=1.2, brilho=0.4)
    elif nome == 'arco': t.linha(curva((x, y - 26), (x + 16, y), (x, y + 24), 18), (140, 100, 60), 2.8, ow=1.0); t.linha([(x, y - 26), (x, y + 24)], (230, 226, 210), 0.8, ow=0)
    elif nome == 'cajado': t.linha([(x, y + 14), (x, y - 36)], (130, 92, 56), 2.8, ow=1.1); t.elipse(x, y - 37, 4.5, 4.5, (130, 200, 240), ow=1.2, brilho=0.6)
    elif nome == 'maca': t.linha([(x, y + 6), (x, y - 22)], (140, 100, 60), 3, ow=1.0); t.elipse(x, y - 24, 5, 5.5, c, ow=1.3, brilho=0.3)
# ---------- humanoide ----------
def humanoide(t, p, r):
    pele, roupa, cab, arm = C(p.get('pele', 'pele')), C(p.get('roupa', '#6a4a2a')), C(p.get('cabelo', '#3b2616')), p.get('arma', 'espada'); k = p.get('esc', 1.0)
    sombra(t, 36 * k, 30 * k, 70)
    sx = 1.0 * k
    if p.get('asas'): [asa_morcego(t, s_, (64 + s_ * 18, 74), 52 * k, C(p.get('asaC', '#5a2a3a')), C(p.get('asaM', '#8a3a4a'))) for s_ in (-1, 1)] if p['asas'] == 'morcego' else [asa_ave(t, s_, (64 + s_ * 16, 72), 54 * k, C('#f2f0ea'), C('#c8c6c0')) for s_ in (-1, 1)]
    if p.get('cauda'): t.linha(curva((64, 86), (78, 106), (92, 100), 12), pele, 4, ow=1.3); t.poli([(92, 100), (100, 94), (98, 106)], C(p.get('caudaC', '#8a2a1a')), ow=1.0)
    for sg in (-1, 1): t.linha(curva((64 + sg * 24 * k, 78), (64 + sg * 30 * k, 62), (64 + sg * 22 * k, 50), 10), roupa, 10 * k, ow=1.6); t.elipse(64 + sg * 22 * k, 48, 6 * k, 6 * k, pele, ow=1.4, brilho=0.2)
    t.elipse(64, 77, 27 * k, 16 * k, roupa, ow=1.8, brilho=0.25)
    if p.get('armadura'): t.elipse(64, 76, 22 * k, 12 * k, C(p['armadura']), ow=1.6, brilho=0.5); [t.elipse(64 + s_ * 27 * k, 72, 8 * k, 7 * k, C(p['armadura']), ow=1.5, brilho=0.4) for s_ in (-1, 1)]
    if p.get('osso'):
        for i in range(4): t.linha([(46, 70 + i * 5), (82, 70 + i * 5)], C('#c8c2aa'), 1.8, ow=0.6)
        t.linha([(64, 64), (64, 90)], C('#c8c2aa'), 2.2, ow=0.6)
    if p.get('orelha'): [t.poli([(64 + s_ * 12, 54), (64 + s_ * (12 + p['orelha']), 50), (64 + s_ * 13, 62)], pele, ow=1.4, domo=0.3) for s_ in (-1, 1)]
    t.elipse(64, 58, 13.5 * k, 14 * k, pele, ow=1.8, brilho=0.3)
    cabm = p.get('cab', 'cabelo')
    if cabm == 'cabelo': t.elipse(64, 59, 13.6 * k, 13.6 * k, cab, ow=1.4, brilho=0.2)
    elif cabm == 'elmo': t.elipse(64, 58, 14.5 * k, 15 * k, C(p.get('elmoC', '#8a909c')), ow=1.8, brilho=0.6); t.linha([(64, 45), (64, 72)], lum(C(p.get('elmoC', '#8a909c')), 0.7), 2.2, ow=0)
    elif cabm == 'capuz': t.elipse(64, 59, 16 * k, 17 * k, roupa, ow=1.8, brilho=0.3, domo=0.8)
    elif cabm == 'cranio': t.elipse(64, 58, 13 * k, 14 * k, C('#d8d2b8'), ow=1.6, brilho=0.4); [t.linha([(64 - 6 + i * 6, 47), (64 - 5 + i * 6, 52)], (60, 56, 48), 1.0, ow=0) for i in range(3)]
    if p.get('chifres'): [t.linha(curva((64 + s_ * 8, 50), (64 + s_ * 20, 36), (64 + s_ * 14, 28), 10), C(p['chifres']), 4, ow=1.3) for s_ in (-1, 1)]
    if p.get('presas'): [t.poli([(64 + s_ * 5 - 1.6, 45), (64 + s_ * 5 + 1.6, 45), (64 + s_ * 5, 39)], (240, 234, 214), ow=1.0) for s_ in (-1, 1)]
    if p.get('barba'): t.poli(curva((51, 56), (50, 40), (64, 36), 8) + curva((64, 36), (78, 40), (77, 56), 8), C(p['barba']), ow=1.3, domo=0.4)
    if p.get('olhos'): olhos(t, 64, 51, 5, C(p['olhos']), 1.6)
    if arm != 'nenhuma': arma_h(t, arm, 64 + 22 * k, 49)
    if p.get('escudo'): t.elipse(64 - 24 * k, 52, 12, 16, C(p['escudo']), ow=1.8, brilho=0.3); t.elipse(64 - 24 * k, 52, 4, 4, (200, 204, 214), ow=1.0, brilho=0.5)
# ---------- quadrúpede ----------
def quadrupede(t, p, r):
    c1, c2, c3 = C(p.get('c1', '#8a5a3a')), C(p.get('c2', '#c8a070')), C(p.get('c3', '#3a2a1a')); k = p.get('esc', 1.0); L = p.get('comp', 1.0); asas = p.get('asas'); focinho = p.get('focinho', 1.0)
    sombra(t, 30 * k, 44 * k * L, 68)
    if asas == 'ave': [asa_ave(t, s_, (64 + s_ * 12, 62), 58, c2, c3) for s_ in (-1, 1)]
    if asas == 'morcego': [asa_morcego(t, s_, (64 + s_ * 12, 64), 56, c3, c1) for s_ in (-1, 1)]
    for sx in (-1, 1):
        for yy in (50, 88):
            t.elipse(64 + sx * 15 * k, yy * (1 if L == 1 else 1) + (L - 1) * (yy - 64) * 20 / 20, 5.5 * k, 8 * k, c1, ow=1.5, domo=0.4)
    cauda = p.get('cauda', 'curva')
    if cauda == 'curva': t.linha(curva((64, 98 + (L - 1) * 12), (80, 112), (88, 98), 14), c1, 5 * k, ow=1.5)
    elif cauda == 'curta': t.elipse(64, 104 + (L - 1) * 8, 4, 5, c1, ow=1.3)
    elif cauda == 'felpuda': t.elipse(70, 104, 7, 13, c2, rot=0.4, ow=1.5, brilho=0.2)
    elif cauda == 'cobra': t.linha(curva((64, 98), (78, 114), (96, 108), 14), c1, 4, ow=1.4)
    elif cauda == 'dragao': t.poli(curva((58, 94), (62, 116), (64, 124), 8) + curva((64, 124), (66, 116), (70, 94), 8), c1, ow=1.5)
    t.elipse(64, 72, 17 * k, 28 * k * L, c1, ow=1.9, brilho=0.35)
    if p.get('manchas') == 'listras':
        for i in range(5): yy = 56 + i * 9 * L; t.linha([(50, yy), (60, yy + 3)], c3, 3.2, ow=0); t.linha([(78, yy), (68, yy + 3)], c3, 3.2, ow=0)
    elif p.get('manchas') == 'pintas':
        for i in range(9): t.elipse(54 + r.random() * 20, 56 + r.random() * 36 * L, 2.4, 2.4, c3, ow=0)
    elif p.get('manchas') == 'dorso': t.elipse(64, 72, 7 * k, 26 * k * L, c3, ow=0, domo=0.3, alpha=0.8)
    elif p.get('manchas') == 'barriga': t.elipse(64, 78, 11 * k, 20 * k * L, c2, ow=0, domo=0.3, alpha=0.85)
    if p.get('juba'): t.elipse(64, 44, 19 * k, 15 * k, c3, ow=1.6, brilho=0.2, domo=0.7)
    if p.get('casco'): t.elipse(64, 72, 19 * k, 26 * k * L, C(p['casco']), ow=2.0, brilho=0.5, domo=0.8); [t.linha([(50, 62 + i * 10), (78, 62 + i * 10)], lum(C(p['casco']), 0.7), 1.4, ow=0) for i in range(4)]
    hy = 44 - (L - 1) * 8 - (3 if focinho > 1.1 else 0)
    if p.get('tromba'): t.linha(curva((64, hy), (64, hy - 14), (60, hy - 22), 10), c1, 8 * k, ow=1.6); [t.poli([(64 + s_ * 8, hy + 2), (64 + s_ * 12, hy - 18), (64 + s_ * 6, hy - 4)], (238, 232, 214), ow=1.2) for s_ in (-1, 1)]
    t.elipse(64, hy, 11 * k, 10.5 * k, c1, ow=1.8, brilho=0.3)
    t.elipse(64, hy - 8 * focinho, 6.5 * k, 7 * focinho * k, c2, ow=1.5, brilho=0.2)
    t.elipse(64, hy - 13 * focinho, 2.4, 1.8, c3, ow=0.8)
    for sx in (-1, 1): t.elipse(64 + sx * 9 * k, hy + 3, 4, 5.5, c1 if p.get('orelha', 1) else c1, ow=1.4)
    olhos(t, 64, hy - 2, 5.2 * k, (250, 220, 110) if not p.get('olho') else C(p['olho']), 1.6)
    if p.get('chifres') == 'cervo':
        for sx in (-1, 1):
            t.linha([(64 + sx * 6, hy + 2), (64 + sx * 16, hy - 12), (64 + sx * 14, hy - 30)], (214, 196, 160), 2.6, ow=1.2)
            for j in range(3): t.linha([(64 + sx * (11 + j), hy - 6 - j * 6), (64 + sx * (20 + j), hy - 10 - j * 6)], (214, 196, 160), 2.0, ow=1.0)
    elif p.get('chifres') == 'reto': [t.linha([(64 + s_ * 6, hy + 1), (64 + s_ * 13, hy - 16)], (232, 226, 208), 3.4, ow=1.2) for s_ in (-1, 1)]
    elif p.get('chifres') == 'curvo': [t.linha(curva((64 + s_ * 7, hy), (64 + s_ * 20, hy - 6), (64 + s_ * 14, hy - 20), 10), (232, 226, 208), 3.6, ow=1.2) for s_ in (-1, 1)]
    elif p.get('chifres') == 'unico': t.poli([(61, hy - 8), (67, hy - 8), (64, hy - 34)], (250, 244, 230), ow=1.3, brilho=0.6)
    if p.get('presas'): [t.poli([(64 + s_ * 6 - 1.5, hy - 12), (64 + s_ * 6 + 1.5, hy - 12), (64 + s_ * 8, hy - 20)], (240, 234, 214), ow=1.0) for s_ in (-1, 1)]
    if p.get('bico'): t.poli([(58, hy - 8), (64, hy - 22), (70, hy - 8)], (218, 170, 60), ow=1.4, brilho=0.3)
# ---------- serpente ----------
def serpente(t, p, r):
    c1, c2 = C(p.get('c1', '#5a7a3a')), C(p.get('c2', '#c8c070')); k = p.get('esc', 1.0); n = p.get('seg', 18)
    sombra(t, 36, 44, 70, 0.4)
    pts = []
    for i in range(n): f = i / (n - 1); pts.append((64 + 26 * math.sin(f * 5.2 + 0.4), 112 - f * 78))
    if p.get('asas'): [asa_ave(t, s_, (64 + s_ * 4, 62), 56, C('#c8f0e0'), C('#3a9a8a')) for s_ in (-1, 1)]
    for i in range(n):
        f = i / (n - 1); w = (14 - 7 * f * 0.6) * k
        t.elipse(pts[i][0], pts[i][1], w * 0.78, w * 0.78, c1 if i % 3 else c2, ow=1.5, brilho=0.2)
    hx, hy = pts[-1]
    t.poli([(hx - 8 * k, hy + 4), (hx, hy - 13 * k), (hx + 8 * k, hy + 4), (hx + 4, hy + 10), (hx - 4, hy + 10)], c1, ow=1.7, brilho=0.4); olhos(t, hx, hy - 1, 4, (250, 220, 60), 1.5)
    t.linha([(hx, hy - 12), (hx, hy - 17)], (200, 40, 50), 1.2, ow=0); t.linha([(hx, hy - 17), (hx - 2, hy - 20)], (200, 40, 50), 1.0, ow=0); t.linha([(hx, hy - 17), (hx + 2, hy - 20)], (200, 40, 50), 1.0, ow=0)
# ---------- aranha / inseto ----------
def aranha(t, p, r):
    c1, c2 = C(p.get('c1', '#3a3a4a')), C(p.get('c2', '#8a2a2a')); k = p.get('esc', 1.0); sombra(t, 44, 40, 70, 0.4)
    for sx in (-1, 1):
        for j, (y0, ang) in enumerate([(52, -50), (58, -20), (64, 12), (70, 44)]):
            ex = 64 + sx * (40 + j * 1.5) * k; ey = y0 + ang * 0.7 - 4
            t.linha([(64 + sx * 9, y0 + 2), (64 + sx * 22 * k, y0 - 14 + j * 2), (ex, ey)], c1, 2.6, ow=1.0)
    t.elipse(64, 84, 16 * k, 21 * k, c1, ow=1.9, brilho=0.3); t.elipse(64, 86, 7 * k, 11 * k, c2, ow=0, domo=0.5, alpha=0.9)
    t.elipse(64, 58, 10 * k, 11 * k, lum(c1, 1.15), ow=1.8, brilho=0.3)
    for i in range(4): t.elipse(64 + (i - 1.5) * 3.2, 50, 1.4, 1.4, (230, 60, 60), ow=0)
    for sx in (-1, 1): t.poli([(64 + sx * 3 - 1.5, 47), (64 + sx * 3 + 1.5, 47), (64 + sx * 4, 39)], (230, 226, 200), ow=1.0)
def escorpiao(t, p, r):
    c1, c2 = C(p.get('c1', '#8a6a3a')), C(p.get('c2', '#5a3a1a')); k = p.get('esc', 1.0); sombra(t, 40, 44, 70, 0.4)
    for sx in (-1, 1):
        for j in range(4): t.linha([(64 + sx * 8, 62 + j * 7), (64 + sx * (22 + j), 66 + j * 8), (64 + sx * (26 + j), 60 + j * 9)], c2, 2.2, ow=0.9)
    t.linha(curva((64, 92), (64, 124), (80, 112), 14) + [(80, 100)], c1, 7 * k, ow=1.5); t.poli([(76, 98), (86, 96), (82, 106)], (200, 70, 50), ow=1.2)
    t.elipse(64, 76, 14 * k, 24 * k, c1, ow=1.9, brilho=0.3); [t.linha([(52, 62 + i * 8), (76, 62 + i * 8)], c2, 1.4, ow=0) for i in range(5)]
    for sx in (-1, 1):
        t.linha([(64 + sx * 9, 56), (64 + sx * 20, 44), (64 + sx * 14, 32)], c1, 5, ow=1.4); t.poli([(64 + sx * 14 - 4, 34), (64 + sx * 14, 20), (64 + sx * 14 + 4, 34)], c2, ow=1.3, brilho=0.3)
def inseto(t, p, r):
    c1, c2 = C(p.get('c1', '#3a4a2a')), C(p.get('c2', '#c8b040')); k = p.get('esc', 1.0); tipo = p.get('tipo', 'besouro'); sombra(t, 38, 44, 70, 0.4)
    if tipo == 'centopeia':
        for i in range(11):
            y = 112 - i * 8; x = 64 + 14 * math.sin(i * 0.8); [t.linha([(x, y), (x + s_ * 16, y + 4)], c2, 2.2, ow=0.8) for s_ in (-1, 1)]; t.elipse(x, y, 8 * k, 6 * k, c1 if i % 2 else lum(c1, 1.2), ow=1.5, brilho=0.2)
        t.elipse(64 + 14 * math.sin(10 * 0.8), 28, 9, 8, lum(c1, 1.3), ow=1.6)
        return
    for sx in (-1, 1):
        for j in range(3): t.linha([(64 + sx * 8, 58 + j * 10), (64 + sx * (24 + j * 2), 56 + j * 14), (64 + sx * (30), 62 + j * 14)], c1, 2.2, ow=0.9)
    if tipo == 'vespa' or tipo == 'mosca':
        [t.poli(curva((64 + s_ * 6, 66), (64 + s_ * 40, 38), (64 + s_ * 34, 70), 10), (225, 235, 245), ow=1.0, alpha=0.6) for s_ in (-1, 1)]
    t.elipse(64, 88, 11 * k, 20 * k, c1, ow=1.8, brilho=0.3)
    if tipo == 'vespa': [t.linha([(54, 76 + i * 8), (74, 76 + i * 8)], (30, 24, 20), 3, ow=0) for i in range(3)]
    if tipo == 'besouro':
        t.elipse(64, 72, 17 * k, 24 * k, c1, ow=1.9, brilho=0.7, domo=0.9); t.linha([(64, 50), (64, 94)], lum(c1, 0.6), 1.4, ow=0)
        if p.get('brilho'): t.elipse(64, 72, 8, 12, C(p['brilho']), ow=0, domo=0.9, alpha=0.7)
    t.elipse(64, 58, 9 * k, 9 * k, lum(c1, 1.15), ow=1.7); olhos(t, 64, 54, 5, (230, 60, 60), 2.0)
    for s_ in (-1, 1): t.linha([(64 + s_ * 3, 50), (64 + s_ * 9, 38), (64 + s_ * 6, 32)], c1, 1.6, ow=0.7)
# ---------- ave / morcego ----------
def ave(t, p, r):
    c1, c2, c3 = C(p.get('c1', '#6a5a4a')), C(p.get('c2', '#c8b898')), C(p.get('c3', '#2a2018')); k = p.get('esc', 1.0); sombra(t, 44 * k, 30, 72, 0.35)
    if p.get('morcego'):
        [asa_morcego(t, s_, (64 + s_ * 8, 72), 58 * k, c3, c1, 4) for s_ in (-1, 1)]
        t.elipse(64, 76, 10 * k, 15 * k, c1, ow=1.8, brilho=0.3); t.elipse(64, 58, 8 * k, 8 * k, c1, ow=1.7)
        [t.poli([(64 + s_ * 4, 54), (64 + s_ * 9, 44), (64 + s_ * 10, 55)], c1, ow=1.4) for s_ in (-1, 1)]; olhos(t, 64, 58, 3, (250, 60, 60), 1.4); return
    [asa_ave(t, s_, (64 + s_ * 8, 70), 56 * k, c1, c3) for s_ in (-1, 1)]
    t.poli([(56, 92), (64, 118), (72, 92)], c1, ow=1.6, domo=0.4); [t.linha([(64, 92), (64 + i * 4, 116)], c3, 1.0, ow=0) for i in (-1, 0, 1)]
    t.elipse(64, 76, 12 * k, 20 * k, c1, ow=1.9, brilho=0.3); t.elipse(64, 80, 6, 12, c2, ow=0, domo=0.4, alpha=0.9)
    t.elipse(64, 52, 8.5 * k, 8.5 * k, c1 if not p.get('cabeca') else C(p['cabeca']), ow=1.7, brilho=0.3); t.poli([(60, 46), (64, 34), (68, 46)], (230, 180, 60), ow=1.4, brilho=0.4); olhos(t, 64, 51, 4, (250, 220, 90), 1.5)
# ---------- dragão ----------
def dragao(t, p, r):
    c1, c2, c3 = C(p.get('c1', '#b03a2a')), C(p.get('c2', '#e0b070')), C(p.get('c3', '#6a1a10')); k = p.get('esc', 1.0); sombra(t, 52, 48, 68, 0.5)
    pts = curva((64, 100), (50, 118), (36, 106), 14)
    t.linha(curva((64, 92), (64, 112), (86, 120), 14), c1, 11 * k, ow=1.8); t.poli([(84, 114), (96, 112), (92, 124), (82, 122)], c3, ow=1.4)
    if p.get('asas', True): [asa_morcego(t, s_, (64 + s_ * 14, 70), 62 * k, c3, c1, 4) for s_ in (-1, 1)]
    for sx in (-1, 1): [t.elipse(64 + sx * 20 * k, y, 6.5 * k, 8 * k, c1, ow=1.5) for y in (56, 88)]; [t.poli([(64 + sx * 20 * k - 3, y - 7), (64 + sx * 20 * k, y - 13), (64 + sx * 20 * k + 3, y - 7)], (232, 226, 206), ow=1.0) for y in (56, 88)]
    t.elipse(64, 76, 18 * k, 27 * k, c1, ow=2.0, brilho=0.4); t.elipse(64, 78, 9 * k, 21 * k, c2, ow=0, domo=0.5, alpha=0.9)
    for i in range(7): y = 56 + i * 7; t.poli([(64 - 3, y), (64, y - 6), (64 + 3, y)], c3, ow=0.9)
    t.linha(curva((64, 58), (64, 46), (64, 36), 8), c1, 10 * k, ow=1.8)
    t.poli([(64 - 11 * k, 38), (64 - 7 * k, 20), (64 + 7 * k, 20), (64 + 11 * k, 38), (64 + 6, 46), (64 - 6, 46)], c1, ow=1.9, brilho=0.4)
    for sx in (-1, 1): t.linha(curva((64 + sx * 9, 36), (64 + sx * 18, 28), (64 + sx * 15, 14), 8), (232, 226, 206), 3.4, ow=1.2); olhos(t, 64, 30, 5, (255, 220, 60), 1.9)
    t.elipse(61, 21, 1.2, 1.2, (30, 20, 20), ow=0); t.elipse(67, 21, 1.2, 1.2, (30, 20, 20), ow=0)
# ---------- aquáticos ----------
def peixe(t, p, r):
    c1, c2 = C(p.get('c1', '#6a8aa0')), C(p.get('c2', '#dfe8ee')); k = p.get('esc', 1.0); sombra(t, 24, 50, 68, 0.3)
    t.poli([(64, 94), (50, 122), (64, 112), (78, 122)], c1, ow=1.6, domo=0.4)
    for s_ in (-1, 1): t.poli([(64 + s_ * 6, 58), (64 + s_ * 34 * k, 76), (64 + s_ * 8, 72)], c1, ow=1.6, domo=0.4)
    t.elipse(64, 70, 15 * k, 36 * k, c1, ow=1.9, brilho=0.3); t.elipse(64, 76, 9 * k, 28 * k, c2, ow=0, domo=0.3, alpha=0.8)
    t.poli([(64, 52), (60, 70), (68, 70)], lum(c1, 0.7), ow=1.4)
    olhos(t, 64, 40, 8, (20, 20, 24), 1.8); t.linha([(58, 34), (70, 34)], lum(c1, 0.5), 1.4, ow=0)
def polvo(t, p, r):
    c1, c2 = C(p.get('c1', '#b0603a')), C(p.get('c2', '#e0a080')); k = p.get('esc', 1.0); sombra(t, 44, 44, 68, 0.35)
    for i in range(8):
        a = i * math.pi / 4 + 0.2; pts = curva((64 + 10 * math.cos(a), 64 + 10 * math.sin(a)), (64 + 30 * math.cos(a + 0.5), 64 + 30 * math.sin(a + 0.5)), (64 + 52 * math.cos(a + 0.1), 64 + 52 * math.sin(a + 0.1)), 14); t.linha(pts, c1, 9 * k, ow=1.5)
        for j in range(5): q = pts[3 + j * 2]; t.elipse(q[0], q[1], 1.3, 1.3, c2, ow=0)
    t.elipse(64, 62, 21 * k, 24 * k, c1, ow=2.0, brilho=0.4); olhos(t, 64, 70, 9, (250, 230, 100), 3.0); [t.elipse(64 + s_ * 9, 70, 1.2, 3, (20, 20, 24), ow=0) for s_ in (-1, 1)]
def caranguejo(t, p, r):
    c1, c2 = C(p.get('c1', '#b04a3a')), C(p.get('c2', '#e08a6a')); k = p.get('esc', 1.0); sombra(t, 46, 34, 68, 0.35)
    for sx in (-1, 1): [t.linha([(64 + sx * 14, 66 + j * 8), (64 + sx * (34 + j * 2), 60 + j * 12), (64 + sx * 40, 72 + j * 12)], c1, 3.0, ow=1.1) for j in range(3)]
    for sx in (-1, 1): t.linha([(64 + sx * 18, 62), (64 + sx * 32, 46), (64 + sx * 26, 32)], c1, 8, ow=1.6); t.poli([(64 + sx * 26 - 8, 34), (64 + sx * 26, 14), (64 + sx * 26 + 8, 34), (64 + sx * 26, 28)], c2, ow=1.6, brilho=0.4)
    t.elipse(64, 74, 22 * k, 17 * k, c1, ow=2.0, brilho=0.5); olhos(t, 64, 60, 6, (20, 20, 24), 2.0)
# ---------- gosma / planta / elemental / etc ----------
def limo(t, p, r):
    c1 = C(p.get('c1', '#5ab05a')); k = p.get('esc', 1.0); sombra(t, 44, 40, 70, 0.35)
    pts = []
    for i in range(32): a = i / 32 * 2 * math.pi; rr = (30 + 5 * math.sin(a * 3 + 1) + 3 * math.sin(a * 5 + 2) + r.random() * 2) * k; pts.append((64 + rr * math.cos(a), 66 + rr * 0.9 * math.sin(a)))
    t.poli(pts, c1, ow=1.8, domo=0.9, brilho=0.8, alpha=p.get('alpha', 0.92))
    for i in range(7): t.elipse(48 + r.random() * 32, 52 + r.random() * 30, 2 + r.random() * 3.5, 2 + r.random() * 3.5, lum(c1, 1.35), ow=0.8, alpha=0.7)
    if p.get('cubo'): t.paint(t.mask(lambda d, s: d.rectangle([34 * s, 36 * s, 94 * s, 96 * s], fill=255)), c1, domo=0.5, ow=2.0, alpha=0.55, brilho=0.5); [t.elipse(50 + r.random() * 28, 50 + r.random() * 28, 3, 5, (210, 200, 160), ow=0.8, alpha=0.9) for _ in range(4)]
    if p.get('nucleo'): t.elipse(64, 66, 7, 7, C(p['nucleo']), ow=1.0, brilho=0.6)
    if p.get('olhos'): [t.elipse(48 + r.random() * 32, 50 + r.random() * 30, 3.4, 3.4, (250, 240, 200), ow=1.0) for _ in range(p['olhos'])]
def fantasma(t, p, r):
    c1 = C(p.get('c1', '#c8d4e8')); k = p.get('esc', 1.0)
    pts = curva((64 - 16 * k, 40), (64, 20), (64 + 16 * k, 40), 10) + [(64 + 18 * k, 70), (64 + 12 * k, 90), (64 + 20 * k, 110), (64 + 4 * k, 100), (64, 118), (64 - 6 * k, 100), (64 - 20 * k, 112), (64 - 12 * k, 90), (64 - 18 * k, 70)]
    t.poli(pts, c1, ow=1.4, domo=0.9, brilho=0.6, alpha=p.get('alpha', 0.78), contorno=lum(c1, 0.5))
    [t.elipse(64 + s_ * 6, 40, 3.2, 4.2, (20, 20, 40), ow=0, alpha=0.9) for s_ in (-1, 1)]; t.elipse(64, 52, 3.4, 4.2, (20, 20, 40), ow=0, alpha=0.8)
    for s_ in (-1, 1): t.linha(curva((64 + s_ * 16 * k, 62), (64 + s_ * 34 * k, 70), (64 + s_ * 30 * k, 96), 8), c1, 7, ow=1.2, domo=0.6)
def elemental(t, p, r):
    tipo = p.get('tipo', 'fogo'); k = p.get('esc', 1.0)
    if tipo == 'fogo':
        sombra(t, 32, 36, 70, 0.3)
        for i in range(9): a = i * 2 * math.pi / 9; t.poli([(64 + 14 * math.cos(a - 0.35), 66 + 14 * math.sin(a - 0.35)), (64 + 42 * k * math.cos(a), 66 + 42 * k * math.sin(a)), (64 + 14 * math.cos(a + 0.35), 66 + 14 * math.sin(a + 0.35))], (232, 96, 36), ow=1.2, brilho=0.4, domo=0.6)
        t.elipse(64, 66, 22 * k, 22 * k, (250, 150, 40), ow=1.4, brilho=0.7, domo=0.9); t.elipse(64, 66, 11, 11, (255, 236, 130), ow=0, brilho=0.9, domo=0.9); olhos(t, 64, 62, 6, (40, 10, 10), 2.4)
    elif tipo == 'agua':
        sombra(t, 36, 36, 70, 0.3)
        for i in range(6): a = i * math.pi / 3; t.linha(curva((64, 64), (64 + 22 * math.cos(a + 0.8), 64 + 22 * math.sin(a + 0.8)), (64 + 44 * k * math.cos(a + 1.5), 64 + 44 * k * math.sin(a + 1.5)), 14), (70, 150, 220), 12, ow=1.4, domo=0.8)
        t.elipse(64, 64, 24 * k, 24 * k, (80, 170, 235), ow=1.6, brilho=0.8, domo=0.9, alpha=0.92); olhos(t, 64, 60, 7, (230, 250, 255), 3.0)
    elif tipo == 'ar':
        for i in range(24): a = i * 0.45; rr = 4 + i * 2.1 * k; t.elipse(64 + rr * math.cos(a), 64 + rr * math.sin(a), 6 + i * 0.4, 6 + i * 0.4, (226, 238, 248), ow=0.9, alpha=0.55, domo=0.6)
        t.elipse(64, 64, 12, 12, (246, 250, 255), ow=0, alpha=0.8); olhos(t, 64, 62, 4, (60, 90, 140), 2.0)
    elif tipo == 'terra':
        sombra(t, 40, 40, 70, 0.5)
        for i in range(8): a = i * math.pi / 4; t.poli(rot([(64 + 22 * k, 56), (64 + 40 * k, 60), (64 + 38 * k, 72), (64 + 24 * k, 74)], a), (130, 106, 80), ow=1.7, brilho=0.3)
        t.poli([(40, 50), (64, 36), (88, 50), (92, 80), (64, 96), (36, 80)], (150, 124, 96), ow=2.0, brilho=0.4); olhos(t, 64, 58, 9, (255, 200, 60), 3.0)
    elif tipo == 'mephit':
        c = C(p.get('c1', '#b05a3a')); sombra(t, 26, 28, 70)
        [asa_morcego(t, s_, (64 + s_ * 8, 70), 40, lum(c, 0.6), c, 3) for s_ in (-1, 1)]; t.elipse(64, 74, 12, 16, c, ow=1.8, brilho=0.4); t.elipse(64, 54, 11, 11, c, ow=1.8, brilho=0.4); olhos(t, 64, 52, 5, (255, 240, 120), 2.0); [t.poli([(64 + s_ * 6, 47), (64 + s_ * 9, 38), (64 + s_ * 11, 48)], lum(c, 0.5), ow=1.0) for s_ in (-1, 1)]
def golem(t, p, r):
    c1, c2 = C(p.get('c1', '#8a8278')), C(p.get('c2', '#5a544c')); k = p.get('esc', 1.0); sombra(t, 42, 36, 70, 0.55)
    for sx in (-1, 1): t.paint(t.mask(lambda d, s, sx=sx: d.rounded_rectangle([(64 + sx * 34 * k - 9) * s, 46 * s, (64 + sx * 34 * k + 9) * s, 84 * s], radius=4 * s, fill=255)), c1, ow=2.0, brilho=0.4); t.elipse(64 + sx * 34 * k, 42, 9, 8, c2, ow=1.8, brilho=0.4)
    t.paint(t.mask(lambda d, s: d.rounded_rectangle([34 * s, 62 * s, 94 * s, 98 * s], radius=6 * s, fill=255)), c1, ow=2.2, brilho=0.45)
    t.paint(t.mask(lambda d, s: d.rounded_rectangle([50 * s, 36 * s, 78 * s, 62 * s], radius=5 * s, fill=255)), lum(c1, 1.1), ow=2.0, brilho=0.5)
    olhos(t, 64, 46, 6, C(p.get('olho', '#ffcf50')), 2.4)
    for i in range(3): t.linha([(40 + i * 24, 70), (40 + i * 24, 92)], c2, 1.4, ow=0)
    if p.get('rebites', True): [t.elipse(40 + i * 24, 66, 1.6, 1.6, (210, 200, 180), ow=0) for i in range(3)]
    if p.get('pena'): t.poli([(64, 36), (58, 14), (70, 14)], C(p['pena']), ow=1.3, brilho=0.4)
def planta(t, p, r):
    c1, c2 = C(p.get('c1', '#4a8a3a')), C(p.get('c2', '#7ab050')); k = p.get('esc', 1.0); sombra(t, 44, 40, 70, 0.4)
    if p.get('cogumelo'):
        t.elipse(64, 66, 30 * k, 30 * k, c1, ow=2.0, brilho=0.7, domo=0.9); [t.elipse(48 + r.random() * 32, 48 + r.random() * 32, 3.4, 3.4, c2, ow=0) for _ in range(9)]; return
    for i in range(14): a = i * 2 * math.pi / 14 + 0.2; rr = 30 * k; t.elipse(64 + rr * math.cos(a), 66 + rr * math.sin(a), 10 * k, 15 * k, c1 if i % 2 else c2, rot=a + math.pi / 2, ow=1.5, brilho=0.3)
    t.elipse(64, 66, 20 * k, 20 * k, lum(c1, 0.85), ow=1.9, brilho=0.5, domo=0.8)
    if p.get('rosto'): olhos(t, 64, 60, 7, (250, 220, 90), 2.4); t.linha(curva((57, 72), (64, 78), (71, 72), 6), (30, 20, 10), 1.8, ow=0)
    if p.get('galhos'): [t.linha(curva((64, 66), (64 + s_ * 30, 56), (64 + s_ * 52, 36), 10), (100, 70, 40), 7, ow=1.6) for s_ in (-1, 1)]
def olho(t, p, r):
    c1 = C(p.get('c1', '#7a4a9a')); k = p.get('esc', 1.0); sombra(t, 40, 40, 70, 0.4)
    for i in range(10): a = i * 2 * math.pi / 10; q = (64 + 34 * k * math.cos(a), 66 + 34 * k * math.sin(a)); t.linha([(64, 66), (64 + 22 * math.cos(a + 0.1), 66 + 22 * math.sin(a + 0.1)), q], lum(c1, 0.9), 4, ow=1.3); t.elipse(q[0], q[1], 4.2, 4.2, (240, 230, 180), ow=1.3); t.elipse(q[0], q[1], 1.8, 1.8, (180, 30, 30), ow=0)
    t.elipse(64, 66, 22 * k, 22 * k, c1, ow=2.0, brilho=0.5, domo=0.8); t.elipse(64, 64, 12, 12, (250, 240, 200), ow=1.6); t.elipse(64, 64, 6, 6, (170, 20, 40), ow=0); t.elipse(64, 64, 2.4, 6, (10, 10, 14), ow=0)
def tentaculos(t, p, r):
    c1 = C(p.get('c1', '#5a6a8a')); c2 = C(p.get('c2', '#9aa8c8')); k = p.get('esc', 1.0); sombra(t, 44, 44, 70, 0.4); n = p.get('n', 6)
    for i in range(n): a = i * 2 * math.pi / n + 0.3; t.linha(curva((64 + 10 * math.cos(a), 66 + 10 * math.sin(a)), (64 + 30 * math.cos(a + 0.6), 66 + 30 * math.sin(a + 0.6)), (64 + 50 * math.cos(a), 66 + 50 * math.sin(a)), 14), c2, 8, ow=1.5, domo=0.8)
    t.elipse(64, 66, 26 * k, 24 * k, c1, ow=2.0, brilho=0.5, domo=0.8); olhos(t, 64, 62, 8, (250, 240, 120), 3.0)
    if p.get('boca'): t.elipse(64, 76, 10, 6, (140, 30, 50), ow=1.4)
PLANOS = dict(humanoide=humanoide, quadrupede=quadrupede, serpente=serpente, aranha=aranha, escorpiao=escorpiao, inseto=inseto, ave=ave, dragao=dragao, peixe=peixe, polvo=polvo, caranguejo=caranguejo, limo=limo, fantasma=fantasma, elemental=elemental, golem=golem, planta=planta, olho=olho, tentaculos=tentaculos)
