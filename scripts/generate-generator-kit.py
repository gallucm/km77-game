"""Generate Kilómetro 17 original generator and spare fuse GLB models."""
import json
import math
import struct
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / "public/assets/props"
materials = [
    ("Acero con esmalte oliva", (0.22, 0.25, 0.115), 0.28, 0.71),
    ("Acero oscuro", (0.058, 0.073, 0.068), 0.52, 0.63),
    ("Goma negra", (0.035, 0.042, 0.035), 0.03, 0.91),
    ("Aluminio sucio", (0.38, 0.39, 0.34), 0.53, 0.65),
    ("Esmalte de señalización", (0.76, 0.48, 0.12), 0.15, 0.76),
    ("Cerámica marfil", (0.81, 0.74, 0.58), 0.02, 0.45),
    ("Cobre patinado", (0.48, 0.26, 0.11), 0.55, 0.61),
    ("Óxido superficial", (0.25, 0.11, 0.055), 0.19, 0.83),
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


def housing(material, center, width, height, depth, radius=.04):
    cx, cy, cz = center
    bevel = min(depth * .21, radius)
    shell(material, rounded(width, height, radius, 2),
          [(-depth / 2, .91), (-depth / 2 + bevel, 1), (depth / 2 - bevel, 1), (depth / 2, .91)],
          lambda x, y, z: (cx + x, cy + y, cz + z))


def cylinder(material, center, radius, length, axis="z", sides=12):
    cx, cy, cz = center
    contour = [(math.cos(i * math.tau / sides) * radius,
                math.sin(i * math.tau / sides) * radius) for i in range(sides)]
    def place(x, y, z):
        offset = {"x": (z, x, y), "y": (y, z, x), "z": (x, y, z)}[axis]
        return (cx + offset[0], cy + offset[1], cz + offset[2])
    shell(material, contour, [(-length / 2, .88), (-length * .35, 1),
                               (length * .35, 1), (length / 2, .88)], place)


def generator():
    # Guard rails form a portable open cage, with rubber feet and welded mounts.
    for x in (-.56, .56):
        for z in (-.42, .42):
            housing(2, (x, -.66, z), .13, .12, .16, .024)
            cylinder(1, (x, -.015, z), .029, 1.22, "y")
        for y in (-.56, .60):
            cylinder(1, (x, y, 0), .034, .87)
    for z in (-.42, .42):
        for y in (-.56, .60):
            cylinder(1, (0, y, z), .034, 1.15, "x")

    # Fuel reservoir, visible filler, motor block and cooling fins.
    housing(0, (0, .37, -.03), 1.02, .35, .75, .075)
    housing(7, (0, .265, .350), .95, .022, .014, .007)
    cylinder(3, (-.32, .563, -.16), .064, .052, "y", 18)
    cylinder(2, (-.32, .589, -.16), .052, .027, "y", 18)
    housing(3, (-.20, -.24, -.02), .68, .52, .57, .055)
    for y in (-.38, -.31, -.24, -.17, -.10):
        housing(1, (-.22, y, -.005), .71, .022, .59, .011)
    housing(1, (.36, -.25, -.01), .35, .54, .57, .065)
    cylinder(2, (.37, -.21, .323), .163, .079, sides=18)
    for x in (.28, .34, .40, .46):
        housing(3, (x, -.21, .368), .015, .19, .012, .006)
    # Recoil starter and front control panel.
    cylinder(1, (-.25, -.25, .337), .185, .09, sides=20)
    for radius in (.147, .101, .057):
        cylinder(3, (-.25, -.25, .389), radius, .015, sides=16)
        cylinder(1, (-.25, -.25, .400), radius * .78, .015, sides=16)
    housing(2, (-.42, -.02, .415), .15, .055, .095, .02)
    housing(1, (.12, .286, .439), .69, .34, .09, .035)
    # Raised safety strip, accessible switch, vent openings and fasteners.
    housing(4, (.23, .254, .489), .33, .022, .009, .005)
    housing(4, (.27, .329, .489), .056, .067, .014, .007)
    housing(2, (.27, .329, .502), .028, .04, .013, .006)
    for x in (-.15, -.06):
        cylinder(3, (x, .24, .49), .028, .018)
        cylinder(2, (x, .24, .501), .02, .013)
    for x in (-.185, .42):
        for y in (.151, .41):
            cylinder(3, (x, y, .489), .013, .013, sides=8)
    for x in (-.39, -.29, -.19, -.09, .01, .11, .21, .31, .41):
        housing(7, (x, .49, .349), .026, .014, .009, .004)
    export("generador.glb", "Generador portátil")


def fuse():
    # Cartridge ceramic, copper contact caps and ceramic banding.
    cylinder(5, (0, 0, 0), .034, .211, "x", 16)
    for sign in (-1, 1):
        cylinder(6, (sign * .113, 0, 0), .038, .048, "x", 16)
        cylinder(3, (sign * .136, 0, 0), .03, .012, "x", 16)
        cylinder(1, (sign * .085, 0, 0), .035, .008, "x", 16)
        cylinder(4, (sign * .051, 0, 0), .0345, .009, "x", 16)
    housing(2, (0, 0, .035), .076, .03, .008, .006)
    for x in (-.023, 0, .023):
        housing(5, (x, 0, .040), .009, .014, .003, .002)
    export("fusible.glb", "Fusible cerámico")


def export(filename, model_name):
    output_path = OUTPUT / filename
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
        "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"name": model_name, "mesh": 0}],
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
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(output)
    print(f"{output_path.name}: {len(output)} bytes, {sum(map(len, parts)) // 3} triángulos")


if __name__ == "__main__":
    generator()
    for material in parts:
        material.clear()
    fuse()
