# Gera os ícones pixel-art do app (chama de forja). Uso: python3 tools/gerar_icones.py
from PIL import Image
G = [
"................",
".......o........",
".......oo.......",
"......ooo.......",
"......oooo......",
".....ooyoo..o...",
"....oooyyoo.oo..",
"...ooooyyyoooo..",
"...oooyyyyyooo..",
"..ooooyyYYyoooo.",
"..oooyyYYYyyooo.",
"..oooyyYYYyyooo.",
"..ooooyyYYyoooo.",
"...oooooyyooooo.",
"....oooooooooo..",
"......oooooo....",
]
PAL = {'o': (232, 80, 28, 255), 'y': (255, 181, 46, 255), 'Y': (255, 242, 160, 255)}
BG = (20, 16, 28, 255); GOLD = (255, 210, 63, 255)
def flame():
    im = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); px = im.load()
    for y, row in enumerate(G):
        for x, c in enumerate(row):
            if c in PAL: px[x, y] = PAL[c]
    # contorno escuro
    out = im.copy(); po = out.load()
    for y in range(16):
        for x in range(16):
            if px[x, y][3] == 0:
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x+dx, y+dy
                    if 0 <= nx < 16 and 0 <= ny < 16 and px[nx, ny][3] and px[nx, ny] != (80,20,10,255): po[x, y] = (80, 20, 10, 255); break
    return out
def icone(tam, escala, arredondado=True, borda=True):
    base = Image.new('RGBA', (tam, tam), BG); px = base.load()
    if borda:
        b = max(2, tam // 32)
        for i in range(tam):
            for j in range(b):
                for (x, y) in ((i, j), (i, tam-1-j), (j, i), (tam-1-j, i)): px[x, y] = GOLD
    f = flame().resize((int(tam*escala)//16*16, int(tam*escala)//16*16), Image.NEAREST)
    base.alpha_composite(f, ((tam-f.width)//2, (tam-f.height)//2 + tam//30))
    return base
icone(192, 0.62).save('icons/icon-192.png'); icone(512, 0.62).save('icons/icon-512.png')
icone(512, 0.5, borda=False).save('icons/maskable-512.png'); icone(180, 0.66).save('icons/apple-touch-icon.png'); icone(32, 0.8, borda=False).save('icons/favicon.png')
print('ok')
