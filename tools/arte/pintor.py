"""Mini-ateliê procedural: pinta formas com sombreamento (cúpula + luz direcional + contorno) e salva em webp.
Tudo é supersampled 4x. Usado para gerar tokens de vista superior (estilo mesa virtual) do herói e das criaturas."""
import numpy as np, math, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops
SS = 4
def hex2rgb(h): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))
def mix(a,b,t): return tuple(int(a[i]*(1-t)+b[i]*t) for i in range(3))
def lum(c,k): return tuple(max(0,min(255,int(v*k))) for v in c)
class Tela:
    def __init__(self, px=128):
        self.px=px; self.N=px*SS; self.img=Image.new('RGBA',(self.N,self.N),(0,0,0,0))
    def S(self,v): return v*SS
    def mask(self, fn):
        m=Image.new('L',(self.N,self.N),0); d=ImageDraw.Draw(m); fn(d,SS); return m
    def paint(self, mask, cor, domo=0.55, luz=0.28, ow=2.0, contorno=None, brilho=0.0, textura=None, alpha=1.0, sombra_baixo=0.0):
        """cor: rgb. domo: quanto o centro clareia. luz: direcional (canto sup. esquerdo). ow: espessura do contorno (px finais)."""
        N=self.N; m=np.asarray(mask,dtype=np.float32)/255.0
        if m.max()<=0: return
        bb=mask.getbbox(); w=max(8,min(bb[2]-bb[0],bb[3]-bb[1])); r=max(2.0,w*0.20)
        inner=np.asarray(mask.filter(ImageFilter.GaussianBlur(r)),dtype=np.float32)/255.0
        inner=np.clip(inner/ max(inner.max(),1e-3),0,1)
        yy,xx=np.mgrid[0:N,0:N].astype(np.float32); cx=(bb[0]+bb[2])/2; cy=(bb[1]+bb[3])/2; sc=max(bb[2]-bb[0],bb[3]-bb[1])/2+1
        dirl=((-(xx-cx)*0.55-(yy-cy)*0.85)/sc)  # -1..1 (claro em cima à esquerda)
        k=(0.70+domo*inner)*(1+luz*dirl)
        if sombra_baixo: k=k*(1-sombra_baixo*np.clip((yy-cy)/sc,0,1))
        base=np.array(cor,dtype=np.float32)
        rgb=base[None,None,:]*k[:,:,None]
        if brilho>0:
            hl=np.asarray(mask.filter(ImageFilter.GaussianBlur(r*0.55)),dtype=np.float32)/255.0
            hl=np.clip((hl-0.78)*4.5,0,1)*np.clip(-dirl*0.9+0.2,0,1); rgb=rgb+255*brilho*hl[:,:,None]
        if textura is not None: rgb=rgb*textura(xx,yy)[:,:,None]
        rgb=np.clip(rgb,0,255)
        a=(m*alpha)
        layer=np.dstack([rgb,a*255]).astype(np.uint8)
        L=Image.fromarray(layer,'RGBA')
        if ow>0:
            co=contorno or lum(cor,0.28)
            grown=mask.filter(ImageFilter.MaxFilter(int(ow*SS)*2+1))
            ring=ImageChops.subtract(grown,mask)
            oi=Image.new('RGBA',(N,N),co+(255,)); oi.putalpha(ring)
            self.img=Image.alpha_composite(self.img,oi)
        self.img=Image.alpha_composite(self.img,L)
    def sombra(self, mask, off=(2,3), blur=3, op=0.45):
        sh=ImageChops.offset(mask,int(off[0]*SS),int(off[1]*SS)).filter(ImageFilter.GaussianBlur(blur*SS))
        sh=sh.point(lambda v:int(v*op)); l=Image.new('RGBA',(self.N,self.N),(0,0,0,255)); l.putalpha(sh); self.img=Image.alpha_composite(self.img,l)
    def linha(self, pts, cor, w, ow=1.5, contorno=None, domo=0.4):
        m=self.mask(lambda d,s: (d.line([(x*s,y*s) for x,y in pts],fill=255,width=int(w*s),joint='curve'), [d.ellipse([(x*s-w*s/2,y*s-w*s/2),(x*s+w*s/2,y*s+w*s/2)],fill=255) for x,y in (pts[0],pts[-1])]))
        self.paint(m,cor,domo=domo,ow=ow,contorno=contorno)
    def elipse(self, cx,cy,rx,ry,cor,rot=0,**kw):
        def f(d,s):
            if rot==0: d.ellipse([(cx-rx)*s,(cy-ry)*s,(cx+rx)*s,(cy+ry)*s],fill=255)
            else:
                pts=[(cx+rx*math.cos(t)*math.cos(rot)-ry*math.sin(t)*math.sin(rot), cy+rx*math.cos(t)*math.sin(rot)+ry*math.sin(t)*math.cos(rot)) for t in np.linspace(0,2*math.pi,64)]
                d.polygon([(x*s,y*s) for x,y in pts],fill=255)
        self.paint(self.mask(f),cor,**kw)
    def poli(self, pts, cor, **kw):
        self.paint(self.mask(lambda d,s:d.polygon([(x*s,y*s) for x,y in pts],fill=255)),cor,**kw)
    def suave(self, mask, r): return mask.filter(ImageFilter.GaussianBlur(r*SS))
    def final(self, path, q=82):
        out=self.img.resize((self.px,self.px),Image.LANCZOS); out.save(path,'WEBP',quality=q,method=6,alpha_quality=90); return out
def curva(p0,p1,p2,n=24): return [((1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0],(1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]) for t in np.linspace(0,1,n)]
def rot(pts,ang,c=(64,64)): ca,sa=math.cos(ang),math.sin(ang); return [(c[0]+(x-c[0])*ca-(y-c[1])*sa, c[1]+(x-c[0])*sa+(y-c[1])*ca) for x,y in pts]
