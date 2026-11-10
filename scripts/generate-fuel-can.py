"""Generate the original Kilómetro 17 fuel can as a deterministic GLB."""
import json
import math
import random
import struct
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / "public/assets/props/bidon-fuel.glb"
materials = [
    ("Esmalte rojo envejecido", (0.35, 0.033, 0.017), 0.32, 0.65),
    ("Relieve de chapa", (0.43, 0.051, 0.025), 0.38, 0.59),
    ("Acero oxidado", (0.16, 0.12, 0.085), 0.48, 0.7),
    ("Base oscura del rótulo", (0.044, 0.016, 0.01), 0.1, 0.83),
    ("Esmalte marfil FUEL", (0.82, 0.74, 0.54), 0.05, 0.7),
    ("Pintura saltada", (0.24, 0.135, 0.081), 0.43, 0.83),
]
parts = [[] for _ in materials]


def tri(material, a, b, c):
    u = [b[i] - a[i] for i in range(3)]
    v = [c[i] - a[i] for i in range(3)]
    n = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
    size = math.hypot(*n)
    if size > 1e-12:
        normal = tuple(value / size for value in n)
        parts[material].extend((point, normal) for point in (a, b, c))


def rounded(width, height, radius, steps=4):
    points = []
    for i, (x, y) in enumerate(((1, 1), (-1, 1), (-1, -1), (1, -1))):
        for step in range(steps + 1):
            angle = (i + step / steps) * math.pi / 2
            points.append((x * (width / 2 - radius) + radius * math.cos(angle),
                           y * (height / 2 - radius) + radius * math.sin(angle)))
    return points


def shell(material, contour, slices, place):
    rings = [[place(x * scale, y * scale, z) for x, y in contour] for z, scale in slices]
    for ring, following in zip(rings, rings[1:]):
        for i in range(len(ring)):
            j = (i + 1) % len(ring)
            tri(material, ring[i], ring[j], following[j])
            tri(material, ring[i], following[j], following[i])
    for i in range(1, len(contour) - 1):
        tri(material, rings[0][0], rings[0][i + 1], rings[0][i])
        tri(material, rings[-1][0], rings[-1][i], rings[-1][i + 1])


def stamp(material, center, width, height, radius, depth, angle=0, face=1):
    cx, cy, cz = center
    co, si = math.cos(angle), math.sin(angle)
    shell(material, rounded(width, height, radius), [(-depth / 2, .94), (0, 1), (depth / 2, .94)],
          lambda x, y, z: (face * (cx + x * co - y * si), cy + x * si + y * co, face * (cz + z)))


body = rounded(.396, .438, .038, 5)
shell(0, body, [(-.118, .87), (-.123, .96), (-.118, 1), (.118, 1), (.123, .96), (.118, .87)],
      lambda x, y, z: (x, y - .069, z))
# Closed welded seam, shaped like the body profile.
for i in range(len(body)):
    j = (i + 1) % len(body)
    x, y = body[i]
    u, v = body[j]
    a, b = (x * 1.012, y * 1.012 - .069, -.006), (u * 1.012, v * 1.012 - .069, -.006)
    c, d = (b[0], b[1], .006), (a[0], a[1], .006)
    tri(2, a, b, c)
    tri(2, a, c, d)

# Hollow three-bar carry handle with a clear opening, plus capped fill neck.
for z in (-.064, 0, .064):
    stamp(1, (-.049, .268, z), .235, .031, .014, .025)
    for x, angle in ((-.153, -.12), (.055, .12)):
        stamp(0, (x, .213, z), .03, .116, .012, .025, angle)
for y, radius, depth, material in ((.177, .039, .074, 2), (.231, .047, .038, 2), (.25, .038, .01, 1)):
    circle = [(radius * math.cos(i * math.tau / 24), radius * math.sin(i * math.tau / 24)) for i in range(24)]
    shell(material, circle, [(-depth / 2, .91), (-depth / 3, 1), (depth / 3, 1), (depth / 2, .91)],
          lambda x, z, dy: (.131 + x, y + dy, -z))
for i in range(16):
    angle = i * math.tau / 16
    stamp(5, (.131 + .043 * math.cos(angle), .229, .043 * math.sin(angle)), .011, .023, .003, .012)

glyphs = {
    "F": ("11111", "10000", "10000", "11110", "10000", "10000", "10000"),
    "U": ("10001", "10001", "10001", "10001", "10001", "10001", "01110"),
    "E": ("11111", "10000", "10000", "11110", "10000", "10000", "11111"),
    "L": ("10000", "10000", "10000", "10000", "10000", "10000", "11111"),
}

rng = random.Random(17)
for face in (1, -1):
    for x in (-.085, .085):
        for y in (-.183, .065):
            stamp(1, (x, y, .121), .147, .023, .01, .013, .62 if x * (y + .05) < 0 else -.62, face)
    stamp(3, (0, -.054, .123), .283, .099, .012, .006, face=face)
    unit = .0107
    for i, letter in enumerate("FUEL"):
        for row, pattern in enumerate(glyphs[letter]):
            for col, value in enumerate(pattern):
                if value == "1":
                    x = (i * 6 + col - 11) * unit
                    y = -.054 + (3 - row) * unit
                    points = [(face * (x + dx * unit / 2), y + dy * unit / 2, face * .127)
                              for dx, dy in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
                    tri(4, *points[:3])
                    tri(4, points[0], points[2], points[3])
    for _ in range(38):
        x, y = rng.uniform(-.17, .17), rng.uniform(-.245, .116)
        if abs(y + .054) < .06:
            continue
        w, h = rng.uniform(.002, .014), rng.uniform(.001, .004)
        a, b, c = [(face * px, py, face * .119) for px, py in ((x, y), (x + w, y + h), (x, y + h))]
        tri(5, a, b, c)


def export():
    payload = bytearray()
    views, accessors, primitives = [], [], []
    for material, vertices in enumerate(parts):
        if not vertices:
            continue
        primitive = {"material": material, "attributes": {}}
        unique = {}
        indices = [unique.setdefault(vertex, len(unique)) for vertex in vertices]
        vertices = list(unique)
        start = len(payload)
        payload.extend(struct.pack(f"<{len(indices)}H", *indices))
        views.append({"buffer": 0, "byteOffset": start, "byteLength": len(payload) - start, "target": 34963})
        accessors.append({"bufferView": len(views) - 1, "componentType": 5123, "count": len(indices), "type": "SCALAR"})
        primitive["indices"] = len(accessors) - 1
        payload.extend(b"\0" * (-len(payload) % 4))
        for component, label in enumerate(("POSITION", "NORMAL")):
            values = [vertex[component] for vertex in vertices]
            start = len(payload)
            payload.extend(struct.pack(f"<{len(values) * 3}f", *(v for triple in values for v in triple)))
            views.append({"buffer": 0, "byteOffset": start, "byteLength": len(payload) - start, "target": 34962})
            accessor = {"bufferView": len(views) - 1, "componentType": 5126, "count": len(values), "type": "VEC3"}
            if component == 0:
                accessor["min"] = [min(axis) for axis in zip(*values)]
                accessor["max"] = [max(axis) for axis in zip(*values)]
            accessors.append(accessor)
            primitive["attributes"][label] = len(accessors) - 1
        primitives.append(primitive)
    document = {
        "asset": {"version": "2.0", "generator": "Kilómetro 17 · Mr. Design"},
        "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"name": "Bidón FUEL", "mesh": 0}],
        "meshes": [{"primitives": primitives}],
        "materials": [{"name": name, "pbrMetallicRoughness": {
            "baseColorFactor": [*color, 1], "metallicFactor": metallic, "roughnessFactor": roughness
        }} for name, color, metallic, roughness in materials],
        "buffers": [{"byteLength": len(payload)}], "bufferViews": views, "accessors": accessors,
    }
    metadata = json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode()
    metadata += b" " * (-len(metadata) % 4)
    output = struct.pack("<4sII", b"glTF", 2, 28 + len(metadata) + len(payload))
    output += struct.pack("<I4s", len(metadata), b"JSON") + metadata
    output += struct.pack("<I4s", len(payload), b"BIN\0") + payload
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(output)
    print(f"{OUTPUT.name}: {len(output)} bytes, {sum(map(len, parts)) // 3} triángulos")


if __name__ == "__main__":
    export()
