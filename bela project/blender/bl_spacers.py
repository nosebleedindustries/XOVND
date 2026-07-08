import bpy, math
# 4x M2.5 brass hex standoffs holding the wide carrier at its 4 corner mounting holes,
# from the enclosure floor (Z=0) up to the carrier PCB bottom (Z=22.8). + a screw head on top.
def mat(n,rgba,r,m):
    mm=bpy.data.materials.get(n) or bpy.data.materials.new(n); mm.use_nodes=True
    b=mm.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value=rgba; b.inputs["Roughness"].default_value=r; b.inputs["Metallic"].default_value=m
    return mm
brass=mat("brass",(0.72,0.55,0.20,1),0.34,1.0)
steel=mat("steel",(0.62,0.63,0.66,1),0.28,1.0)
# carrier corner holes: KiCad (3.7,6.1),(192.8,6.1),(3.7,81.9),(192.8,81.9);
# GLB Y=-KiCadY; G_CARRIER at (-72,79.5) -> world = (kx-72, -ky+79.5)
corners=[(3.7,6.1),(192.8,6.1),(3.7,81.9),(192.8,81.9)]
world=[(kx-137.0, -ky+79.5) for (kx,ky) in corners]
AF=5.0; R=AF/(2*math.cos(math.radians(30)))   # M2.5 hex, 5mm across flats
Zbot=0.0; Ztop=22.8; H=Ztop-Zbot
CTOP=24.4   # carrier PCB top (bottom 22.8 + 1.6)
for name in list(bpy.data.objects):
    if name.name.startswith(("SPACER_","SCREW_")): bpy.data.objects.remove(name,do_unlink=True)
for i,(x,y) in enumerate(world):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=R, depth=H, location=(x,y,Zbot+H/2))
    o=bpy.context.active_object; o.name="SPACER_%d"%i; o.rotation_euler=(0,0,math.radians(30))
    o.data.materials.clear(); o.data.materials.append(brass)
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=2.3, depth=1.6, location=(x,y,CTOP+0.8))
    s=bpy.context.active_object; s.name="SCREW_%d"%i
    s.data.materials.clear(); s.data.materials.append(steel)
bpy.context.view_layer.update()
print("4 hex standoffs at:", [(round(x,1),round(y,1)) for x,y in world])
