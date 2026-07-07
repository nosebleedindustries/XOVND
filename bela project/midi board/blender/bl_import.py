import bpy, os
# --- clear scene (keep nothing) ---
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    if c.name != "Collection":
        try: bpy.data.collections.remove(c)
        except Exception: pass
D = r"C:\Users\stala\Downloads\pb2_midi"
def imp_gltf(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]
midi = imp_gltf(os.path.join(D, "pb2_midi.glb"))
bela = imp_gltf(os.path.join(D, "bela_gem.glb"))
before = set(bpy.data.objects)
try: bpy.ops.wm.obj_import(filepath=os.path.join(D, "pocketbeagle2.obj"))
except Exception: bpy.ops.import_scene.obj(filepath=os.path.join(D, "pocketbeagle2.obj"))
pb2 = [o for o in bpy.data.objects if o not in before]
def group(objs, name):
    e = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(e)
    for o in objs:
        if o.parent is None:
            o.parent = e
    return e
group(midi, "GRP_MIDI"); group(bela, "GRP_BELA"); group(pb2, "GRP_PB2")
summary = "imported midi=%d bela=%d pb2=%d | total objs=%d" % (
    len(midi), len(bela), len(pb2), len(bpy.data.objects))
open(os.path.join(D, "_bl_summary.txt"), "w").write(summary)
print(summary)
