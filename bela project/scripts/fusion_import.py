import adsk.core, adsk.fusion, traceback
app = adsk.core.Application.get()
try:
    im = app.importManager
    fn = r"C:\Users\stala\Downloads\bela_gem_cad\bela_gem_stereo.step"
    opts = im.createSTEPImportOptions(fn)
    doc = im.importToNewDocument(opts)
    des = adsk.fusion.Design.cast(app.activeProduct)
    root = des.rootComponent
    app.activeViewport.fit()
    bb = root.boundingBox
    print("OK bodies=%d occ=%d comps=%d bbox=%.1fx%.1fx%.1f mm doc=%s" % (
        root.bRepBodies.count, root.occurrences.count, des.allComponents.count,
        (bb.maxPoint.x-bb.minPoint.x)*10,(bb.maxPoint.y-bb.minPoint.y)*10,(bb.maxPoint.z-bb.minPoint.z)*10,
        app.activeDocument.name))
except:
    print("ERR:", traceback.format_exc()[-1500:])
