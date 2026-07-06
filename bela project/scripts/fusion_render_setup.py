# -*- coding: utf-8 -*-
import adsk.core, adsk.fusion, traceback
app=adsk.core.Application.get()
try:
    ui=app.userInterface
    rw=None
    for i in range(ui.workspaces.count):
        w=ui.workspaces.item(i)
        if w.id=='FusionRenderEnvironment' or 'render' in (w.name or '').lower(): rw=w; break
    ws_name="?"
    if rw:
        try: rw.activate(); ws_name=rw.name
        except Exception as e: ws_name="activate-fail:"+str(e)[:60]
    adsk.doEvents()
    vp=app.activeViewport; cam=vp.camera; cam.isSmoothTransition=False
    cam.viewOrientation=adsk.core.ViewOrientations.IsoTopRightViewOrientation
    vp.camera=cam; vp.fit(); adsk.doEvents()
    out=r"C:\Users\stala\Downloads\bela_gem_cad\fusion_render.png"
    ok=vp.saveAsImageFile(out,2400,1500)
    print("workspace=%s saved=%s -> %s" % (ws_name, ok, out))
except:
    print("ERR:", traceback.format_exc()[-1000:])
