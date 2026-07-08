from PIL import Image
import base64, io, os
D=r"C:\Users\stala\Downloads\pb2_midi"
def jpg(path,maxw,q):
    im=Image.open(path).convert("RGB")
    if im.width>maxw:
        im=im.resize((maxw,int(im.height*maxw/im.width)),Image.LANCZOS)
    b=io.BytesIO(); im.save(b,"JPEG",quality=q,optimize=True,progressive=True)
    return "data:image/jpeg;base64,"+base64.b64encode(b.getvalue()).decode()
def png(path,maxw,colors=160):
    im=Image.open(path).convert("RGB")
    if im.width>maxw:
        im=im.resize((maxw,int(im.height*maxw/im.width)),Image.LANCZOS)
    im=im.quantize(colors=colors,method=Image.FASTOCTREE)
    b=io.BytesIO(); im.save(b,"PNG",optimize=True)
    return "data:image/png;base64,"+base64.b64encode(b.getvalue()).decode()
imgs={
 "{{IMG_HERO}}":  jpg(D+r"\_hero.png",1600,86),
 "{{IMG_DETAIL}}":jpg(D+r"\_detail.png",1500,85),
 "{{IMG_TOP}}":   jpg(D+r"\_top.png",1500,85),
 "{{IMG_CONN}}":  png(D+r"\connection_headers.png",1400),
 "{{IMG_ROUTED}}":jpg(D+r"\routed_top.png",1400,87),
 "{{IMG_SCR_STACK}}": jpg(D+r"\_scr_stack.png",1600,86),
 "{{IMG_SCR_MATE}}":  jpg(D+r"\_scr_mate.png",1500,85),
 "{{IMG_SCR_TOP}}":   jpg(D+r"\_scr_top.png",1500,85),
 "{{IMG_SCR_ROUTED}}":jpg(D+r"\_scr_routed.png",1500,86),
}
t=open(D+r"\book\book_template.html",encoding="utf-8").read()
for k,v in imgs.items(): t=t.replace(k,v)
open(D+r"\book\book.html","w",encoding="utf-8").write(t)
print("book.html",round(os.path.getsize(D+r'\book\book.html')/1024),"KB total")
for k,v in imgs.items(): print(" ",k,round(len(v)/1024),"KB")
