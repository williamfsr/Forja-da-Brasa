#!/usr/bin/env python3
"""Tokens de personagens da campanha que não existem no SRD (chefe final etc.). uso: gerar_extras.py <outdir>"""
import sys, os, math
import numpy as np
from PIL import Image, ImageFilter
from pintor import *
from monstros_tok import *
out = sys.argv[1]; os.makedirs(out, exist_ok=True)

def aura(T, cor, raio=0.46, forca=150):
    """halo gélido atrás do token (desenhado por baixo)."""
    N = T.N; yy, xx = np.mgrid[0:N, 0:N]; d = np.hypot(xx - N / 2, yy - N / 2) / (N * raio)
    a = np.clip(1 - d, 0, 1) ** 1.6 * forca
    base = np.zeros((N, N, 4), np.uint8); base[..., 0], base[..., 1], base[..., 2] = cor; base[..., 3] = a.astype(np.uint8)
    im = Image.fromarray(base, 'RGBA'); im.alpha_composite(T.img); T.img = im

def rei_inercia():
    T = Tela(); r = rnd('rei_inercia')
    # anéis de gelo ao redor do trono ambulante
    for R_, op in [(58, 90), (50, 110)]:
        m = T.mask(lambda d, s, R_=R_: d.ellipse([s * (64 - R_), s * (64 - R_), s * (64 + R_), s * (64 + R_)], outline=255, width=int(s * 1.6)))
        T.paint(m, (150, 200, 240), domo=0, luz=0, ow=0, alpha=op / 255)
    humanoide(T, dict(pele='#9ea6bc', roupa='#1b1e33', cabelo='#d8e4f4', cab='elmo', elmoC='#3d4466', chifres='#cfe3ff', olhos='#8fe3ff',
                      arma='espada', esc=1.32), r)
    aura(T, (120, 190, 255), 0.5, 120)
    T.final(f'{out}/rei_inercia.webp', q=84)

rei_inercia(); print('ok')
