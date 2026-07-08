import bpy, math
# reuse the already-positioned + lit ensemble; just move the camera to a low 3/4 angle
# that shows the whole stack edge-on: PB2 base + Bela sandwich, MIDI beside, carrier on
# TOP with its back-side connectors pointing DOWN into the sandwich and screens up.
sc=bpy.context.scene
tgt=bpy.data.objects.get("Tgt")
if tgt: tgt.location=(28,18,22)
cam=bpy.data.objects.get("Cam")
def shot(loc, lens, path):
    cam.location=loc; cam.data.lens=lens
    bpy.context.view_layer.update()
    sc.render.filepath=path
    bpy.ops.render.render(write_still=True)
    print("rendered", path)
# low front-left elevation: connectors-down + screens-up read clearly
shot((-120,-210,70), 40, r"C:\Users\stala\Downloads\pb2_midi\_ensemble_side.png")
# tighter front-right, lower, to catch the carrier-to-sandwich gap
shot((150,-170,55), 48, r"C:\Users\stala\Downloads\pb2_midi\_ensemble_front.png")
