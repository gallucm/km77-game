"""Build the two original Kilómetro 17 warded keys as deterministic GLBs."""
import json
import math
import struct
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / "public/assets/keys"


def model(open_bow, tint):
    vertices, normals = [], []

    def quad(a, b, c, d):
        u = [b[i] - a[i] for i in range(3)]
        v = [c[i] - a[i] for i in range(3)]
        n = (u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0])
        length = math.hypot(*n)
        if length == 0:
            return
        vertices.extend((a,b,c,a,c,d))
        normals.extend([tuple(x/length for x in n)] * 6)

    def tube(rings, sides, point):
        for j in range(len(rings)-1):
            for i in range(sides):
                t = math.tau*i/sides
                u = math.tau*(i+1)/sides
                quad(point(rings[j], t), point(rings[j], u),
                     point(rings[j+1], u), point(rings[j+1], t))

    def box(x0, x1, y0, y1, z):
        a,b,c,d = [(x0,y0,z),(x1,y0,z),(x1,y1,z),(x0,y1,z)]
        e,f,g,h = [(x,y,-z) for x,y,_ in (a,b,c,d)]
        for face in [(a,b,c,d),(f,e,h,g),(e,f,b,a),(d,c,g,h),(e,a,d,h),(b,f,g,c)]:
            quad(*face)

    def bow(ring, t):
        size, z = ring
        scallop = 1 + (0.15 * math.cos(t*4) if open_bow else 0)
        return (-0.086 + math.cos(t)*0.044*size*scallop,
                math.sin(t)*(0.043 if open_bow else 0.049)*size*scallop, z)

    tube([(1,-.006),(1,.006),(.9,.012),(.59,.012),(.51,.006),
          (.51,-.006),(.59,-.012),(.9,-.012),(1,-.006)], 28, bow)

    def shaft(ring, t):
        x, radius = ring
        return x, radius*math.cos(t), radius*math.sin(t)

    tube([(.137,0),(.137,.007),(.132,.011),(-.020,.011),(-.021,.016),(-.034,.016),
          (-.037,.011),(-.048,.011),(-.048,0)][::-1], 12, shaft)
    if open_bow:
        box(.077,.131,-.027,-.005,.009)
        box(.079,.092,-.049,-.027,.009)
        box(.113,.131,-.042,-.027,.009)
    else:
        box(.078,.131,-.032,-.005,.01)
        box(.079,.096,-.050,-.032,.01)
        box(.105,.131,-.058,-.032,.01)

    # Center the visual bounds on the existing pickup anchor.
    bounds = [(min(axis),max(axis)) for axis in zip(*vertices)]
    center = [(a+b)/2 for a,b in bounds]
    vertices = [tuple(x-center[i] for i,x in enumerate(v)) for v in vertices]
    binary = b"".join(struct.pack("<3f", *v) for v in vertices+normals)
    stride = len(vertices)*12
    meta = {
        "asset":{"version":"2.0","generator":"Kilómetro 17 original warded keys"},
        "scene":0,"scenes":[{"nodes":[0]}],"nodes":[{"mesh":0}],
        "meshes":[{"primitives":[{"attributes":{"POSITION":0,"NORMAL":1},"material":0}]}],
        "materials":[{"pbrMetallicRoughness":{"baseColorFactor":[*tint,1],"metallicFactor":0.58,"roughnessFactor":0.47}}],
        "buffers":[{"byteLength":len(binary)}],
        "bufferViews":[{"buffer":0,"byteOffset":i*stride,"byteLength":stride,"target":34962} for i in range(2)],
        "accessors":[{"bufferView":i,"componentType":5126,"count":len(vertices),"type":"VEC3"} for i in range(2)],
    }
    meta["accessors"][0].update(min=[min(axis) for axis in zip(*vertices)], max=[max(axis) for axis in zip(*vertices)])
    payload=json.dumps(meta,separators=(",",":")).encode()
    payload+=b" "*(-len(payload)%4)
    return (struct.pack("<4sII",b"glTF",2,28+len(payload)+len(binary))
            +struct.pack("<I4s",len(payload),b"JSON")+payload
            +struct.pack("<I4s",len(binary),b"BIN\0")+binary)


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, ornate, tint in [("cobertizo",False,(0.76,0.39,0.105)),("sotano",True,(0.25,0.48,0.70))]:
        (OUTPUT / (name+".glb")).write_bytes(model(ornate,tint))
