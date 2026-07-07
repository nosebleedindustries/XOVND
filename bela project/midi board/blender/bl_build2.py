import bpy, math
from mathutils import Vector
C = bpy.context
# ---------- clean previous helper objects (keep the 3 board groups) ----------
KEEP_ROOTS = {"GRP_PB2", "GRP_BELA", "GRP_MIDI"}
def under(o, roots):
    p = o
    while p:
        if p.name in roots: return True
        p = p.parent
    return False
for o in list(bpy.data.objects):
    if o.name.startswith(("HX_", "PANEL", "RIBBON_M", "JACK_", "BTN_", "Cam", "Tgt", "Key", "Fill", "Rim", "RimO", "floor")):
        bpy.data.objects.remove(o, do_unlink=True)
# ---------- materials ----------
def mat(name, rgba, rough=0.5, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m
M_BRASS = mat("brass", (0.72, 0.52, 0.18, 1), 0.28, 1.0)
M_ALU   = mat("alu",   (0.62, 0.63, 0.66, 1), 0.35, 1.0)
M_RIB   = mat("ribbon",(0.10, 0.11, 0.13, 1), 0.55, 0.0)
M_BLK   = mat("blackplastic", (0.02, 0.02, 0.02, 1), 0.45, 0.0)
M_METN  = mat("nickel", (0.7, 0.7, 0.72, 1), 0.3, 1.0)
def add_box(name, sx, sy, sz, loc, m):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = C.active_object; o.name = name; o.scale = (sx, sy, sz)
    o.data.materials.append(m); return o
def add_cyl(name, r, h, loc, m, axis='Z', verts=32):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=verts)
    o = C.active_object; o.name = name
    if axis == 'Y': o.rotation_euler = (math.pi/2, 0, 0)
    o.data.materials.append(m); return o
# ---------- hex spacers under the MIDI board (Z 0..13.2) ----------
SPZ = 13.2
for i, (x, y) in enumerate([(7, 83), (52, 83), (7, 48), (52, 48)]):
    add_cyl("HX_%d" % i, 2.6, SPZ, (x, y, SPZ/2), M_BRASS, verts=6)
# ---------- MIDI jacks (c_jack) + button, facing +Y through the panel ----------
JY = 85.5      # board jack edge
JZ = 15.8      # jack axis height
def c_jack(name, cx):
    add_box(name+"_body", 8, 11, 6, (cx, JY-5.5, JZ), M_BLK)
    add_cyl(name+"_bar", 3.0, 3.6, (cx, JY+1.4, JZ), M_METN, axis='Y')
c_jack("JACK_IN", 17.6); c_jack("JACK_OUT", 28.4)
add_box("BTN_body", 5, 5, 4, (39.0, JY-2.5, JZ), M_BLK)
add_cyl("BTN_plg", 1.4, 3.0, (39.0, JY+1.0, JZ-0.6), M_METN, axis='Y')
# ---------- case panel (1mm) with jack + button holes ----------
panel = add_box("PANEL", 62, 1.0, 12, (26, JY+1.0, JZ), M_ALU)
for hx, r in [(17.6, 3.7), (28.4, 3.7), (39.0, 2.1)]:
    cut = add_cyl("PANEL_cut", r, 4, (hx, JY+1.0, JZ), M_ALU, axis='Y')
    cut.hide_render = True; cut.hide_viewport = True
    mo = panel.modifiers.new("cut", 'BOOLEAN'); mo.operation = 'DIFFERENCE'; mo.object = cut
# ---------- ribbon: MIDI J3 -> sandwich ----------
add_box("RIBBON_M", 8, 22, 0.5, (18, 40, 13.6), M_RIB)
# ---------- lighting (3-point + soft ORANGE rim on one side) ----------
cx, cy, cz = 28, 40, 12
tgt = bpy.data.objects.new("Tgt", None); C.collection.objects.link(tgt); tgt.location = (cx, cy, cz)
def light(name, kind, loc, energy, color=(1,1,1), size=90):
    ld = bpy.data.lights.new(name, kind); ld.energy = energy; ld.color = color
    if kind == 'AREA': ld.size = size
    o = bpy.data.objects.new(name, ld); C.collection.objects.link(o); o.location = loc
    t = o.constraints.new('TRACK_TO'); t.target = tgt; t.track_axis = 'TRACK_NEGATIVE_Z'; t.up_axis = 'UP_Y'
    return o
light("Key",  'AREA', (cx+90, cy-70, cz+150), 120000, (1.0, 0.98, 0.95), 130)
light("Fill", 'AREA', (cx-130, cy-10, cz+80),  40000, (0.9, 0.94, 1.0), 160)
light("Rim",  'AREA', (cx-10, cy+150, cz+70),  55000, (0.85, 0.9, 1.0), 110)
light("RimO", 'AREA', (cx+150, cy+40, cz+40),  70000, (1.0, 0.45, 0.12), 120)   # soft orange rim (one side)
# world
w = C.scene.world; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.04, 0.045, 0.05, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.4
# ---------- Cycles ----------
sc = C.scene
sc.render.engine = 'CYCLES'
try: sc.cycles.device = 'GPU'
except Exception: pass
sc.cycles.samples = 128; sc.cycles.use_denoising = True
sc.view_settings.view_transform = 'AgX'
sc.render.resolution_x = 1700; sc.render.resolution_y = 1150
print("scene built (spacers/panel/jacks/button/ribbon + orange rim + Cycles)")
