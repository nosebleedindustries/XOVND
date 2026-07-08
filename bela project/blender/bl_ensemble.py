import bpy, math, os
from mathutils import Vector
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
for c in list(bpy.data.collections):
    if c.name != "Collection":
        try: bpy.data.collections.remove(c)
        except Exception: pass
def imp_gltf(path):
    before=set(bpy.data.objects); bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]
def imp_obj(path):
    before=set(bpy.data.objects)
    try: bpy.ops.wm.obj_import(filepath=path)
    except Exception: bpy.ops.import_scene.obj(filepath=path)
    return [o for o in bpy.data.objects if o not in before]
def group(objs,name,scale=1.0,rotx=0.0):
    e=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(e)
    if scale!=1.0: e.scale=(scale,scale,scale)
    if rotx: e.rotation_euler=(rotx,0,0)
    for o in objs:
        if o.parent is None: o.parent=e
    return e
PBM=r"C:\Users\stala\Downloads\pb2_midi"; DC=r"C:\Users\stala\Downloads\display_carrier"
pb2 = imp_obj(os.path.join(PBM,"pocketbeagle2.obj"))          # mm, needs -90 X
bela= imp_gltf(os.path.join(PBM,"bela_gem.glb"))              # metres -> x1000
midi= imp_gltf(os.path.join(PBM,"pb2_midi.glb"))              # metres -> x1000
carr= imp_gltf(os.path.join(DC,"display_carrier.glb"))        # metres -> x1000
group(pb2,"G_PB2",1.0,-math.pi/2)
group(bela,"G_BELA",1000.0)
group(midi,"G_MIDI",1000.0)
group(carr,"G_CARRIER",1000.0)
bpy.context.view_layer.update()
def gb(g):
    xs=[];ys=[];zs=[]
    def w(o):
        if o.type=='MESH':
            for v in o.bound_box:
                p=o.matrix_world @ Vector((v[0],v[1],v[2])); xs.append(p.x);ys.append(p.y);zs.append(p.z)
        for c in o.children: w(c)
    r=bpy.data.objects.get(g)
    if r: w(r)
    return "%s: X %.1f..%.1f Y %.1f..%.1f Z %.1f..%.1f"%(g,min(xs),max(xs),min(ys),max(ys),min(zs),max(zs)) if xs else g+":empty"
out="\n".join(gb(g) for g in ["G_PB2","G_BELA","G_MIDI","G_CARRIER"])
open(os.path.join(PBM,"_ens_bounds.txt"),"w").write(out); print(out)
