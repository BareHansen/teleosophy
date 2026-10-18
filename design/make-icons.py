# Generates the favicon and app icons. Run from the repository root: python3 design/make-icons.py
from PIL import Image, ImageDraw, ImageFilter
DEEP=(5,11,22,255); CREAM=(244,234,219,255); NAVY=(30,62,108,255); GOLD=(242,194,122,255)

def icon(N, rounded=True, glow=None):
    S=8; M=N*S
    im=Image.new('RGBA',(M,M),(0,0,0,0)); d=ImageDraw.Draw(im)
    if rounded: d.rounded_rectangle([0,0,M-1,M-1],radius=int(0.22*M),fill=DEEP)
    else: d.rectangle([0,0,M,M],fill=DEEP)
    c=M/2; R=0.235*M; L=1.5*R
    w=max(0.024*M, 1.25*S)                       # line width: never thinner than ~1.25 px
    box=[c-R,c-R,c+R,c+R]
    d.pieslice(box,90,270,fill=CREAM)            # left pole
    d.pieslice(box,270,450,fill=NAVY)            # right pole
    d.arc(box,270,450,fill=CREAM,width=int(w*0.6))
    d.ellipse([c-L,c-L,c+L,c+L],outline=CREAM,width=int(w))      # outer ring
    d.line([c,c-L,c,c+L],fill=CREAM,width=int(w))                # the stroke
    d.line([c-L,c,c+L,c],fill=CREAM,width=int(w*0.8))            # crosshair
    rd=max(0.032*M, 1.6*S)
    d.ellipse([c-rd,c-rd,c+rd,c+rd],fill=GOLD)                   # I am
    out=im.resize((N,N),Image.LANCZOS)
    if glow and N>=128:
        g=Image.new('RGBA',(N,N),(0,0,0,0)); gd=ImageDraw.Draw(g); r=N*0.07
        gd.ellipse([N/2-r,N/2-r,N/2+r,N/2+r],fill=(255,190,110,90))
        out=Image.alpha_composite(out,g.filter(ImageFilter.GaussianBlur(N*0.04)))
    return out

icons={n:icon(n) for n in (16,32,48)}
icons[48].save('public/favicon.ico',sizes=[(16,16),(32,32),(48,48)],append_images=[icons[16],icons[32]])
icons[32].save('public/images/favicon-32.png',optimize=True)
icon(192,glow=True).save('public/images/icon-192.png',optimize=True)
icon(512,glow=True).save('public/images/icon-512.png',optimize=True)
icon(180,rounded=False,glow=True).save('public/images/apple-touch-icon.png',optimize=True)
