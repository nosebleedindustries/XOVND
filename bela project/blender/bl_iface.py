import bpy, math
from mathutils import Vector
sc = bpy.context.scene
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=r"C:\Users\stala\Downloads\display_carrier\display_carrier.glb")
roots=[o for o in sc.objects if o.parent is None]
bpy.ops.object.empty_add(location=(0,0,0)); root=bpy.context.active_object; root.name="CARRIER_ROOT"
for o in roots:
    if o is not root: o.parent=root
root.scale=(1000,1000,1000)
bpy.context.view_layer.update()
mn=Vector((1e9,1e9,1e9)); mx=Vector((-1e9,-1e9,-1e9))
for o in sc.objects:
    if o.type=='MESH':
        for c in o.bound_box:
            w=o.matrix_world@Vector(c)
            for i in range(3): mn[i]=min(mn[i],w[i]); mx[i]=max(mx[i],w[i])
ctr=(mn+mx)/2; size=(mx-mn)
print("bbox ctr",tuple(round(v,1) for v in ctr),"size",tuple(round(v,1) for v in size))
def sun(rx,ry,rz,e):
    d=bpy.data.lights.new("S",'SUN'); d.energy=e; d.angle=math.radians(3)
    o=bpy.data.objects.new("S",d); o.rotation_euler=(math.radians(rx),math.radians(ry),math.radians(rz)); sc.collection.objects.link(o)
sun(45,15,25,3.2); sun(60,-25,-70,1.6); sun(20,0,180,1.0)
sc.world.use_nodes=True
bg=sc.world.node_tree.nodes["Background"]; bg.inputs[0].default_value=(0.045,0.05,0.06,1); bg.inputs[1].default_value=0.5
cam_d=bpy.data.cameras.new("Cam"); cam=bpy.data.objects.new("Cam",cam_d); sc.collection.objects.link(cam)
cam.data.lens=50; sc.camera=cam
def shot(name, offx, offy, offz, fx):
    dist=max(size)*fx
    cam.location=ctr+Vector((offx*dist, offy*dist, offz*dist))
    cam.rotation_euler=(ctr-cam.location).normalized().to_track_quat('-Z','Y').to_euler()
    sc.render.resolution_x=1900; sc.render.resolution_y=1150; sc.render.film_transparent=False
    try: sc.render.engine='BLENDER_EEVEE_NEXT'
    except: sc.render.engine='BLENDER_EEVEE'
    sc.render.filepath=r"C:\Users\stala\Downloads\display_carrier\_bl_%s.png"%name
    bpy.ops.render.render(write_still=True); print("rendered",name)
shot("iface", 0.10, -0.62, 0.55, 2.9)   # 3/4 hero from above-front (whole board in frame)
shot("top",   0.0,  -0.05, 1.0,  2.6)   # near top-down
