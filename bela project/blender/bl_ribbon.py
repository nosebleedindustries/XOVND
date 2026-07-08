import bpy, math
from mathutils import Vector
# 6-way IDC ribbon: MIDI board J3 -> carrier J_MIDI (underside). Endpoints in world mm:
#  J3   KiCad(16,38) -> GLB(16,-38) + G_MIDI(-12,-24)  = (4,-62), on top of the MIDI board (~z8.5)
#  JMID KiCad(60,79) -> GLB(60,-79) + G_CARRIER(-72,79.5)= (-12,0.5), carrier B.Cu underside (~z16)
A=Vector((-77.0,-20.0,8.6)); B=Vector((-77.0,0.5,16.0))   # J3 (relocated MIDI) -> J_MIDI (relocated on the carrier underside)
for n in ("RIBBON",):
    o=bpy.data.objects.get(n)
    if o: bpy.data.objects.remove(o,do_unlink=True)
mid=(A+B)/2; d=(B-A); L=d.length
# flat ribbon strip: box L x 8mm x 0.7mm, oriented along d
bpy.ops.mesh.primitive_cube_add(size=1, location=mid)
o=bpy.context.active_object; o.name="RIBBON"; o.scale=(L/2, 4.0, 0.35)
# aim local +X along d
q=Vector((1,0,0)).rotation_difference(d.normalized())
o.rotation_mode='QUATERNION'; o.rotation_quaternion=q
m=bpy.data.materials.get("ribbon") or bpy.data.materials.new("ribbon"); m.use_nodes=True
bd=m.node_tree.nodes.get("Principled BSDF"); bd.inputs["Base Color"].default_value=(0.10,0.10,0.11,1); bd.inputs["Roughness"].default_value=0.7
o.data.materials.clear(); o.data.materials.append(m)
bpy.context.view_layer.update()
print("ribbon %.0f mm  A%s -> B%s"%(L, tuple(round(v,1) for v in A), tuple(round(v,1) for v in B)))
