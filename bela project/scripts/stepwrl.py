#!/usr/bin/env python3
"""Shared CAD emitter: a list of SOLIDS -> name.wrl (KiCad 3D viewer) + name.step
(AP214 faceted B-rep for MoI3D / STEP assembly). No CAD kernel needed.

A SOLID is (color_rgb, faces); a FACE is a list of (x,y,z) verts in mm, ordered
CCW seen from OUTSIDE (so the Newell normal points out). Cylinders/cones are
prism-faceted; bevels are just extra chamfer faces. Each solid -> its own
MANIFOLD_SOLID_BREP (= a sub-part), all gathered in one ADVANCED_BREP_SHAPE_REP.

WRL uses legacy 0.1-inch units (divide mm by 2.54). STEP is in mm.
Geometry helpers model the OUTWARD-pointing feature along +X by default."""
import math, os

# ---------- geometry helpers (return list of faces) ----------
def box(x0,x1,y0,y1,z0,z1):
    b=[(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0)]
    t=[(x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)]
    f=[t, b[::-1]]
    for i in range(4): f.append([b[i],b[(i+1)%4],t[(i+1)%4],t[i]])
    return f

def box_bevel(x0,x1,y0,y1,z0,z1,ch):
    """Box with chamfered top edges (along Z top), bevel size ch."""
    f=box(x0,x1,y0,y1,z0,z1-ch)            # main body up to z1-ch
    # remove old top cap (last of box() top is index0) -> rebuild: easier to just
    # add a chamfer frustum on top
    f=f[1:]                                  # drop the z1-ch top cap
    a=[(x0+ch,y0+ch,z1),(x1-ch,y0+ch,z1),(x1-ch,y1-ch,z1),(x0+ch,y1-ch,z1)]
    low=[(x0,y0,z1-ch),(x1,y0,z1-ch),(x1,y1,z1-ch),(x0,y1,z1-ch)]
    for i in range(4):
        f.append([low[i],low[(i+1)%4],a[(i+1)%4],a[i]])   # slanted chamfer
    f.append(a)                              # new flat top
    return f

def cyl_x(x0,x1,cy,cz,r,n=28):
    pts=[(cy+r*math.cos(2*math.pi*k/n), cz+r*math.sin(2*math.pi*k/n)) for k in range(n)]
    f=[[(x1,y,z) for (y,z) in pts],[(x0,y,z) for (y,z) in pts][::-1]]
    for i in range(n):
        (ya,za)=pts[i]; (yb,zb)=pts[(i+1)%n]
        f.append([(x0,ya,za),(x1,ya,za),(x1,yb,zb),(x0,yb,zb)])
    return f

def tube_x(x0,x1,cy,cz,ro,ri,n=28):
    """Annulus tube along X (open both ends) - outer + inner wall + 2 ring caps."""
    f=[]
    op=[(cy+ro*math.cos(2*math.pi*k/n), cz+ro*math.sin(2*math.pi*k/n)) for k in range(n)]
    ip=[(cy+ri*math.cos(2*math.pi*k/n), cz+ri*math.sin(2*math.pi*k/n)) for k in range(n)]
    for i in range(n):
        (ya,za)=op[i]; (yb,zb)=op[(i+1)%n]
        f.append([(x0,ya,za),(x1,ya,za),(x1,yb,zb),(x0,yb,zb)])      # outer
        (ya,za)=ip[i]; (yb,zb)=ip[(i+1)%n]
        f.append([(x1,ya,za),(x0,ya,za),(x0,yb,zb),(x1,yb,zb)])      # inner (flip)
    for (xx,flip) in ((x0,True),(x1,False)):
        for i in range(n):
            (yao,zao)=op[i]; (ybo,zbo)=op[(i+1)%n]
            (yai,zai)=ip[i]; (ybi,zbi)=ip[(i+1)%n]
            q=[(xx,yao,zao),(xx,ybo,zbo),(xx,ybi,zbi),(xx,yai,zai)]
            f.append(q if flip else q[::-1])
    return f

def cone_x(x0,x1,cy,cz,r0,r1,n=28):
    """Frustum along X (radius r0 at x0 -> r1 at x1) - a chamfer/taper ring face set."""
    p0=[(cy+r0*math.cos(2*math.pi*k/n), cz+r0*math.sin(2*math.pi*k/n)) for k in range(n)]
    p1=[(cy+r1*math.cos(2*math.pi*k/n), cz+r1*math.sin(2*math.pi*k/n)) for k in range(n)]
    f=[[(x1,y,z) for (y,z) in p1],[(x0,y,z) for (y,z) in p0][::-1]]
    for i in range(n):
        (ya,za)=p0[i]; (yb,zb)=p0[(i+1)%n]
        (yc,zc)=p1[i]; (yd,zd)=p1[(i+1)%n]
        f.append([(x0,ya,za),(x1,yc,zc),(x1,yd,zd),(x0,yb,zb)])
    return f

# --- Y-axis variants (top-edge parts protrude along +-Y) ---
def cyl_y(y0,y1,cx,cz,r,n=28):
    pts=[(cx+r*math.cos(2*math.pi*k/n), cz+r*math.sin(2*math.pi*k/n)) for k in range(n)]
    f=[[(x,y1,z) for (x,z) in pts],[(x,y0,z) for (x,z) in pts][::-1]]
    for i in range(n):
        (xa,za)=pts[i]; (xb,zb)=pts[(i+1)%n]
        f.append([(xa,y0,za),(xa,y1,za),(xb,y1,zb),(xb,y0,zb)])
    return f
def cone_y(y0,y1,cx,cz,r0,r1,n=28):
    p0=[(cx+r0*math.cos(2*math.pi*k/n), cz+r0*math.sin(2*math.pi*k/n)) for k in range(n)]
    p1=[(cx+r1*math.cos(2*math.pi*k/n), cz+r1*math.sin(2*math.pi*k/n)) for k in range(n)]
    f=[[(x,y1,z) for (x,z) in p1],[(x,y0,z) for (x,z) in p0][::-1]]
    for i in range(n):
        (xa,za)=p0[i]; (xb,zb)=p0[(i+1)%n]
        (xc,zc)=p1[i]; (xd,zd)=p1[(i+1)%n]
        f.append([(xa,y0,za),(xc,y1,zc),(xd,y1,zd),(xb,y0,zb)])
    return f
def tube_y(y0,y1,cx,cz,ro,ri,n=28):
    f=[]
    op=[(cx+ro*math.cos(2*math.pi*k/n), cz+ro*math.sin(2*math.pi*k/n)) for k in range(n)]
    ip=[(cx+ri*math.cos(2*math.pi*k/n), cz+ri*math.sin(2*math.pi*k/n)) for k in range(n)]
    for i in range(n):
        (xa,za)=op[i]; (xb,zb)=op[(i+1)%n]
        f.append([(xa,y0,za),(xa,y1,za),(xb,y1,zb),(xb,y0,zb)])      # outer
        (xa,za)=ip[i]; (xb,zb)=ip[(i+1)%n]
        f.append([(xa,y1,za),(xa,y0,za),(xb,y0,zb),(xb,y1,zb)])      # inner
    for (yy,flip) in ((y0,True),(y1,False)):
        for i in range(n):
            (xao,zao)=op[i]; (xbo,zbo)=op[(i+1)%n]
            (xai,zai)=ip[i]; (xbi,zbi)=ip[(i+1)%n]
            q=[(xao,yy,zao),(xbo,yy,zbo),(xbi,yy,zbi),(xai,yy,zai)]
            f.append(q if flip else q[::-1])
    return f

# ---------- WRL ----------
def _wrl(path,solids):
    S=1/2.54; out=["#VRML V2.0 utf8",""]
    for col,faces in solids:
        vmap={};vl=[];idx=[]
        for fc in faces:
            fi=[]
            for v in fc:
                k=tuple(round(c,4) for c in v)
                if k not in vmap: vmap[k]=len(vl); vl.append(v)
                fi.append(vmap[k])
            idx.append(fi)
        out+=["Shape {","  appearance Appearance { material Material { diffuseColor %s } }"%col,
              "  geometry IndexedFaceSet {","    coord Coordinate { point [",
              "      "+", ".join("%.5f %.5f %.5f"%(v[0]*S,v[1]*S,v[2]*S) for v in vl),"    ] }",
              "    coordIndex [","      "+", ".join(" ".join(map(str,fi))+" -1" for fi in idx),
              "    ]","    solid TRUE","  }","}"]
    open(path,"w").write("\n".join(out))

# ---------- STEP (AP214 faceted BREP) ----------
class _Step:
    def __init__(s): s.n=0; s.L=[]
    def add(s,txt): s.n+=1; s.L.append("#%d=%s;"%(s.n,txt)); return s.n
def _newell(face):
    nx=ny=nz=0.0; m=len(face)
    for i in range(m):
        x0,y0,z0=face[i]; x1,y1,z1=face[(i+1)%m]
        nx+=(y0-y1)*(z0+z1); ny+=(z0-z1)*(x0+x1); nz+=(x0-x1)*(y0+y1)
    L=math.sqrt(nx*nx+ny*ny+nz*nz) or 1.0
    return (nx/L,ny/L,nz/L)
def _unit(a,b):
    d=(b[0]-a[0],b[1]-a[1],b[2]-a[2]); L=math.sqrt(sum(c*c for c in d)) or 1.0
    return (d[0]/L,d[1]/L,d[2]/L),L
def _step(path,solids,name):
    s=_Step()
    def P(p): return s.add("CARTESIAN_POINT('',(%.6f,%.6f,%.6f))"%p)
    def D(d): return s.add("DIRECTION('',(%.6f,%.6f,%.6f))"%d)
    breps=[]
    for col,faces in solids:
        vids={}   # vertex coord -> VERTEX_POINT id
        eids={}   # (i,j) sorted -> (edge_curve id, a_coord, b_coord)
        def vid(v):
            k=tuple(round(c,5) for c in v)
            if k not in vids:
                vids[k]=s.add("VERTEX_POINT('',#%d)"%P(k))
            return k,vids[k]
        faceids=[]
        for fc in faces:
            ks=[vid(v) for v in fc]              # [(coord,vp_id),...]
            oes=[]
            m=len(ks)
            for i in range(m):
                ka,_=ks[i]; kb,_=ks[(i+1)%m]
                key=tuple(sorted((ka,kb)))
                if key not in eids:
                    a=key[0]; b=key[1]
                    dirv,ln=_unit(a,b)
                    ln=ln or 1.0
                    vec=s.add("VECTOR('',#%d,%.6f)"%(D(dirv),ln))
                    line=s.add("LINE('',#%d,#%d)"%(P(a),vec))
                    ec=s.add("EDGE_CURVE('',#%d,#%d,#%d,.T.)"%(vids[a],vids[b],line))
                    eids[key]=(ec,a,b)
                ec,a,b=eids[key]
                ori=".T." if (ka,kb)==(a,b) else ".F."
                oes.append(s.add("ORIENTED_EDGE('',*,*,#%d,%s)"%(ec,ori)))
            loop=s.add("EDGE_LOOP('',(%s))"%",".join("#%d"%o for o in oes))
            fob=s.add("FACE_OUTER_BOUND('',#%d,.T.)"%loop)
            nrm=_newell(fc)
            rdir,_=_unit(fc[0],fc[1])
            ax=s.add("AXIS2_PLACEMENT_3D('',#%d,#%d,#%d)"%(P(tuple(fc[0])),D(nrm),D(rdir)))
            pl=s.add("PLANE('',#%d)"%ax)
            faceids.append(s.add("ADVANCED_FACE('',(#%d),#%d,.T.)"%(fob,pl)))
        shell=s.add("CLOSED_SHELL('',(%s))"%",".join("#%d"%f for f in faceids))
        breps.append(s.add("MANIFOLD_SOLID_BREP('',#%d)"%shell))
    # units + context
    lu=s.add("( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) )")
    au=s.add("( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) )")
    su=s.add("( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() )")
    unc=s.add("UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-05),#%d,'distance_accuracy_value','')"%lu)
    ctx=s.add("( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#%d)) GLOBAL_UNIT_ASSIGNED_CONTEXT((#%d,#%d,#%d)) REPRESENTATION_CONTEXT('','') )"%(unc,lu,au,su))
    origin=s.add("AXIS2_PLACEMENT_3D('',#%d,#%d,#%d)"%(
        s.add("CARTESIAN_POINT('',(0.,0.,0.))"),
        s.add("DIRECTION('',(0.,0.,1.))"),
        s.add("DIRECTION('',(1.,0.,0.))")))
    items=",".join("#%d"%b for b in breps)+",#%d"%origin
    rep=s.add("ADVANCED_BREP_SHAPE_REPRESENTATION('%s',(%s),#%d)"%(name,items,ctx))
    ac=s.add("APPLICATION_CONTEXT('automotive design')")
    s.add("APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,#%d)"%ac)
    prodctx=s.add("PRODUCT_CONTEXT('',#%d,'mechanical')"%ac)
    prod=s.add("PRODUCT('%s','%s','',(#%d))"%(name,name,prodctx))
    pdf=s.add("PRODUCT_DEFINITION_FORMATION('','',#%d)"%prod)
    pdctx=s.add("PRODUCT_DEFINITION_CONTEXT('part definition',#%d,'design')"%ac)
    pd=s.add("PRODUCT_DEFINITION('design','',#%d,#%d)"%(pdf,pdctx))
    pds=s.add("PRODUCT_DEFINITION_SHAPE('','',#%d)"%pd)
    s.add("SHAPE_DEFINITION_REPRESENTATION(#%d,#%d)"%(pds,rep))
    hdr=("ISO-10303-21;\nHEADER;\nFILE_DESCRIPTION((''),'2;1');\n"
         "FILE_NAME('%s','',(''),(''),'claude','','');\n"
         "FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));\nENDSEC;\nDATA;\n"%name)
    open(path,"w").write(hdr+"\n".join(s.L)+"\nENDSEC;\nEND-ISO-10303-21;\n")

def emit(dirpath,name,solids):
    _wrl(os.path.join(dirpath,name+".wrl"),solids)
    _step(os.path.join(dirpath,name+".step"),solids,name)
    print("emit",name,"->",name+".wrl +",name+".step")

if __name__=="__main__":
    # self-test: a beveled box + a cylinder (validate STEP loads in OpenCASCADE)
    d=os.path.dirname(os.path.abspath(__file__))
    solids=[("0.2 0.5 0.9", box_bevel(-5,5,-3,3,0,4,0.8)),
            ("0.9 0.4 0.2", cyl_x(5,9,0,2,1.5))]
    emit(d,"_selftest",solids)
