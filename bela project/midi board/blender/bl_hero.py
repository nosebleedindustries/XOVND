import bpy
C=bpy.context; sc=C.scene
tgt=bpy.data.objects.get("Tgt") or bpy.data.objects.new("Tgt",None)
if tgt.name not in C.collection.objects: C.collection.objects.link(tgt)
cam=bpy.data.objects.get("Cam")
if not cam:
    cd=bpy.data.cameras.new("Cam"); cam=bpy.data.objects.new("Cam",cd); C.collection.objects.link(cam)
    tc=cam.constraints.new('TRACK_TO'); tc.target=tgt; tc.track_axis='TRACK_NEGATIVE_Z'; tc.up_axis='UP_Y'
sc.camera=cam
sc.cycles.samples=72
cam.location=(128,-88,111); tgt.location=(28,44,9); cam.data.lens=48
C.view_layer.update()
sc.render.filepath=r"C:\Users\stala\Downloads\pb2_midi\_hero.png"
bpy.ops.render.render(write_still=True)
print("hero rendered")
