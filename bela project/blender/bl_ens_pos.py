import bpy, math
from mathutils import Vector
def L(name,loc):
    o=bpy.data.objects.get(name)
    if o: o.location=loc
# --- ensemble layout (mm) ---
L("G_PB2",   (0,0,0))                 # compute, base   (world X 0..55.8 Y 0..35 -> centre 28,17.5)
L("G_BELA",  (-103.3,117.1,11.7))     # audio cape on top of PB2 (mated: Z 10..21.8)
# carrier on top: male U1 at GLB-local (100,-62); put it over the beagle centre (28,17.5)
# -> Gx=28-100=-72, Gy=17.5+62=79.5 ; Z so U1 male pins (down to local -8.6) insert into the sandwich top (~21.8)
L("G_CARRIER",(-137.0,79.5,22.85))   # U1 moved to carrier-right (KiCad 165) so the sandwich sits at the carrier's right edge -> Bela audio jacks clear it  # dropped: male pins fully inserted; PCB clears Bela jacks (21.8) by 1mm
L("G_MIDI",  (-61.0,-58.0,2.0))       # ribbon satellite, front-LEFT now (near the relocated J_MIDI); flipped 180deg so its TRS jacks face OUT
_m=bpy.data.objects.get("G_MIDI")
if _m: _m.rotation_euler=(0,0,3.141592653589793)   # jacks -> front panel (-Y), ribbon J3 -> toward the carrier
bpy.context.view_layer.update()
# PB2 material (colourless OBJ)
def mat(n,rgba,r=0.5,m=0.0):
    mm=bpy.data.materials.get(n) or bpy.data.materials.new(n); mm.use_nodes=True
    b=mm.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value=rgba; b.inputs["Roughness"].default_value=r; b.inputs["Metallic"].default_value=m
    return mm
def apply(root,m):
    r=bpy.data.objects.get(root)
    def w(o):
        if o.type=='MESH': o.data.materials.clear(); o.data.materials.append(m)
        for c in o.children: w(c)
    if r: w(r)
apply("G_PB2", mat("pb2body",(0.03,0.06,0.04,1),0.55))
# ground
bpy.ops.mesh.primitive_plane_add(size=900, location=(28,35,-0.3))
bpy.context.active_object.data.materials.append(mat("floor",(0.11,0.11,0.12,1),0.9))
# camera
cx,cy,cz=28,35,20
cam=bpy.data.cameras.new("Cam"); co=bpy.data.objects.new("Cam",cam); bpy.context.collection.objects.link(co)
co.location=(cx+150,cy-200,cz+170); cam.lens=42
tgt=bpy.data.objects.new("Tgt",None); bpy.context.collection.objects.link(tgt); tgt.location=(cx,cy,cz)
tc=co.constraints.new('TRACK_TO'); tc.target=tgt; tc.track_axis='TRACK_NEGATIVE_Z'; tc.up_axis='UP_Y'
bpy.context.scene.camera=co
# lights
def light(n,loc,e,col=(1,1,1),size=140):
    ld=bpy.data.lights.new(n,'AREA'); ld.energy=e; ld.color=col; ld.size=size
    o=bpy.data.objects.new(n,ld); bpy.context.collection.objects.link(o); o.location=loc
    t=o.constraints.new('TRACK_TO'); t.target=tgt; t.track_axis='TRACK_NEGATIVE_Z'; t.up_axis='UP_Y'
light("Key",(cx+120,cy-100,cz+220),260000,(1.0,0.98,0.95),180)
light("Fill",(cx-180,cy-40,cz+120),90000,(0.9,0.94,1.0),200)
light("RimO",(cx+200,cy+80,cz+70),120000,(1.0,0.45,0.12),150)   # warm orange rim
w=bpy.context.scene.world; w.use_nodes=True
w.node_tree.nodes["Background"].inputs[0].default_value=(0.04,0.045,0.05,1)
w.node_tree.nodes["Background"].inputs[1].default_value=0.5
sc=bpy.context.scene
try: sc.render.engine='BLENDER_EEVEE_NEXT'
except Exception: sc.render.engine='BLENDER_EEVEE'
sc.view_settings.view_transform='AgX'
sc.render.resolution_x=1700; sc.render.resolution_y=1150
sc.render.filepath=r"C:\Users\stala\Downloads\pb2_midi\_ensemble.png"
bpy.ops.render.render(write_still=True)
print("ensemble rendered")
