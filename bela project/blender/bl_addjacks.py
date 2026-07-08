import bpy, math
# The Lumberg 1503-03 TRS jack 3D model is NOT installed in this KiCad, so the MIDI board's
# J1/J2 minijacks don't render. Add approximation bodies (plastic box + metal barrel) at the
# flipped-MIDI jack positions, barrels facing OUT the front (-Y). World mm:
#  J1/J2 KiCad(14.65,8)/(25.35,8) -> GLB(.,-8) -> flipped(L=40.75,-70.5, rotZ180) -> (26.1,-62.5)/(15.4,-62.5)
def mat(n,rgba,r,m):
    mm=bpy.data.materials.get(n) or bpy.data.materials.new(n); mm.use_nodes=True
    b=mm.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value=rgba; b.inputs["Roughness"].default_value=r; b.inputs["Metallic"].default_value=m
    return mm
blk=mat("jackblk",(0.02,0.02,0.02,1),0.5,0.0); mtl=mat("jackmtl",(0.62,0.63,0.66,1),0.3,1.0)
for o in list(bpy.data.objects):
    if o.name.startswith("MJACK"): bpy.data.objects.remove(o,do_unlink=True)
def jack(name, body_c, barrel_c, axis):
    bpy.ops.mesh.primitive_cube_add(size=1, location=body_c)
    b=bpy.context.active_object; b.name=name+"_body"; b.scale=(7.5,7.0,6.0) if axis=='Y' else (6.0,7.5,7.0)
    b.data.materials.clear(); b.data.materials.append(blk)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=3.0, depth=9.0, location=barrel_c)
    c=bpy.context.active_object; c.name=name+"_barrel"
    c.rotation_euler=(math.radians(90),0,0) if axis=='Y' else (0,math.radians(90),0)
    c.data.materials.clear(); c.data.materials.append(mtl)
# MIDI board TRS jacks -> front (-Y)
for i,jx in enumerate([26.1,15.4]):
    jack("MJACK_%d"%i, (jx,-60.0,5.0), (jx,-66.5,5.0), 'Y')
# Bela audio jacks J7/J8 (LINE IN/OUT) -> right edge (+X); model not installed either
for i,jy in enumerate([23.0,12.3]):
    jack("MJACK_bela_%d"%i, (52.0,jy,16.0), (58.5,jy,16.0), 'X')
bpy.context.view_layer.update()
print("4 jacks added: 2 MIDI (front) + 2 Bela audio (right edge)")
