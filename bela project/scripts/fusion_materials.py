# -*- coding: utf-8 -*-
import adsk.core, adsk.fusion, traceback
app=adsk.core.Application.get()
des=adsk.fusion.Design.cast(app.activeProduct); root=des.rootComponent
lib=app.materialLibraries.itemByName(u'Biblioteca de aspectos de Fusion')
def A(n): return lib.appearances.itemByName(n)
mat={
 'gem_pcb':A(u'Plástico - Mate (verde)'),
 'baseplate':A(u'Plástico - Mate (negro)'),
 'spacer':A(u'Latón - Pulido'),
 'screw':A(u'Acero inoxidable - Satinado'),
 'USB_A':A(u'Acero inoxidable - Satinado'),
 'Jack':A(u'Plástico - Mate (negro)'),
 'Hdr':A(u'Plástico - Mate (negro)'),
 'stack_sock':A(u'Plástico - Mate (negro)'),
 'Pins':A(u'Oro - Pulido'),
 'Qwiic':A(u'Plástico - Brillante (blanco)'),
 'Button':A(u'Acero inoxidable - Satinado'),
}
miss=[k for k,v in mat.items() if v is None]
def pick(nm):
    for k,v in mat.items():
        if v and nm.startswith(k): return v
    return None
cnt=0; err=""
for i in range(root.occurrences.count):
    o=root.occurrences.item(i); a=pick(o.name)
    if a:
        try: o.appearance=a; cnt+=1
        except Exception as e: err=str(e)[:120]
print("assigned=%d missing_mats=%s err=%s" % (cnt, miss, err))
