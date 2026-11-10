"""Generate the original Kilómetro 17 pines as deterministic GLB 2.0 assets."""
import json
from math import cos, sin, pi, sqrt
from pathlib import Path
import random
import struct

OUTPUT = Path(__file__).resolve().parents[1] / "public/assets/trees"


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def mul(a, k):
    return tuple(x * k for x in a)


def cross(a, b):
    x, y, z = a
    u, v, w = b
    return y * w - z * v, z * u - x * w, x * v - y * u


def unit(a):
    return mul(a, 1 / sqrt(sum(x * x for x in a)))


class Mesh:
    def __init__(self):
        self.positions = []
        self.normals = []
        self.colors = []
        self.uvs = []
        self.indices = []

    def tube(self, rings, axis, sides, color, rng, lobes=0.10, needle=False):
        side = unit(cross(axis, (0, 1, 0) if abs(axis[1]) < 0.95 else (1, 0, 0)))
        up = cross(axis, side)
        offset = len(self.positions)
        streaks = [rng.uniform(0.76, 1.15) for _ in range(sides)]
        for i, (center, radius) in enumerate(rings):
            t = i / (len(rings) - 1)
            for j in range(sides + 1):
                angle = 2 * pi * j / sides
                normal = add(mul(side, cos(angle)), mul(up, sin(angle)))
                scale = streaks[j % sides]
                profile = (1 + lobes * sin(angle * 3 + i * 1.4))
                self.positions.append(add(center, mul(normal, radius * profile * scale)))
                self.normals.append(unit(add(normal, mul(axis, 0.38 if needle else 0.08))))
                light = scale * (0.66 + 0.40 * t) if needle else scale * (0.91 + 0.16 * t)
                self.colors.append(tuple(round(min(1, c * light) * 255) for c in color) + (255,))
                self.uvs.append((j / sides, t))
                if i and j:
                    d = offset + i * (sides + 1) + j
                    a = d - sides - 2
                    self.indices.extend((a, a + 1, d, a, d, d - 1))


def pine(seed, wide):
    rng = random.Random(seed)
    bark = Mesh()
    foliage = Mesh()
    wood = (0.22, 0.135, 0.08)
    lean = rng.uniform(-0.022, 0.02)
    trunk = [
        ((lean * y * y, y, 0.012 * y * y), radius)
        for y, radius in [(0, 0.037), (0.035, 0.027), (0.13, 0.024),
                          (0.27, 0.020), (0.45, 0.015), (0.65, 0.010),
                          (0.81, 0.0064), (0.94, 0.003), (1, 0.00025)]
    ]
    bark.tube(trunk, (0, 1, 0), 11, wood, rng, 0.24)
    for i in range(6):
        az = i * pi / 3 + rng.uniform(-0.18, 0.18)
        direction = (cos(az), 0, sin(az))
        extent = rng.uniform(0.049, 0.094)
        rings = [((0, 0.024, 0), 0.017),
                 (add(mul(direction, extent * 0.55), (0, 0.015, 0)), 0.012),
                 (add(mul(direction, extent), (0, 0.004, 0)), 0.0005)]
        bark.tube(rings, direction, 6, wood, rng)

    def tuft(start, direction, length, radius, color):
        axis = unit(direction)
        rings = [(add(start, mul(axis, length * t)), radius * width)
                 for t, width in [(0, 0.22), (0.39, 1), (0.73, 0.71), (1, 0.01)]]
        foliage.tube(rings, axis, 4, color, rng, 0.28, True)

    levels = 10
    for level in range(levels):
        y = (0.26 if wide else 0.19) + level * (0.68 if wide else 0.74) / (levels - 1)
        breadth = (0.33 if wide else 0.25) * (1 - (level / levels) ** 1.35)
        count = 4 if level > 6 else 5
        azimuth = level * 1.77
        for arm in range(count):
            angle = azimuth + arm * 2 * pi / count + rng.uniform(-0.26, 0.26)
            radial = (cos(angle), 0, sin(angle))
            sideways = (-sin(angle), 0, cos(angle))
            radius = breadth * rng.uniform(0.72, 1.12)
            start = (lean * y * y, y + rng.uniform(-0.023, 0.023), 0.012 * y * y)
            sag = rng.uniform(0.034, 0.057) * (1 - level / levels)
            middle = add(start, add(mul(radial, radius * 0.54), (0, -sag, 0)))
            end = add(start, add(mul(radial, radius), (0, -sag * 0.4 + 0.013, 0)))
            base_width = (0.007 if wide else 0.0065) * (1 - level / 14)
            bark.tube([(start, base_width), (middle, base_width * 0.64), (end, 0.00035)], radial, 6, wood, rng)
            tint = rng.uniform(0.80, 1.18)
            green = tuple(c * tint for c in (0.105, 0.195, 0.105))
            tuft(add(start, mul(radial, radius * 0.46)), add(radial, (0, 0.14, 0)),
                 radius * 0.60, radius * 0.16, green)
            for i in range(3):
                for side in (-1, 1):
                    t = 0.28 + i * 0.20
                    origin = add(start, add(mul(radial, radius * t), (0, -sag * sin(pi * t), 0)))
                    heading = add(add(mul(radial, 0.46 + i * 0.12), mul(sideways, side)), (0, -0.15 + i * 0.11, 0))
                    twig = radius * (0.42 - i * 0.056) * rng.uniform(0.79, 1.16)
                    tuft(origin, heading, twig, twig * rng.uniform(0.24, 0.34), green)
    tuft((lean * 0.9, 0.886, 0.011), (0.03, 1, 0), 0.114, 0.039, (0.14, 0.23, 0.117))
    return bark, foliage


def glb(path, meshes):
    binary = bytearray()
    views, accessors = [], []

    def accessor(values, code, gl_type, target):
        if len(binary) % 4:
            binary.extend(bytes(4 - len(binary) % 4))
        offset = len(binary)
        for row in values:
            binary.extend(struct.pack("<" + code * len(row), *row))
        view = {"buffer": 0, "byteOffset": offset, "byteLength": len(binary) - offset, "target": target}
        views.append(view)
        data = {"bufferView": len(views) - 1, "componentType": {"f": 5126, "B": 5121, "H": 5123}[code],
                "count": len(values), "type": gl_type}
        if code == "B":
            data["normalized"] = True
        if target == 34962 and gl_type == "VEC3" and len(accessors) % 5 == 0:
            data["min"] = [min(col) for col in zip(*values)]
            data["max"] = [max(col) for col in zip(*values)]
        accessors.append(data)
        return len(accessors) - 1

    primitives = []
    for mat, mesh in enumerate(meshes):
        attrs = {key: accessor(vals, code, gl_type, 34962)
                 for key, vals, code, gl_type in [
                     ("POSITION", mesh.positions, "f", "VEC3"), ("NORMAL", mesh.normals, "f", "VEC3"),
                     ("COLOR_0", mesh.colors, "B", "VEC4"), ("TEXCOORD_0", mesh.uvs, "f", "VEC2")]}
        indices = accessor([(i,) for i in mesh.indices], "H", "SCALAR", 34963)
        primitives.append({"attributes": attrs, "indices": indices, "material": mat})

    while len(binary) % 4:
        binary.append(0)
    meta = {"asset": {"version": "2.0", "generator": "Kilómetro 17 procedural pine tool"},
            "scene": 0, "scenes": [{"nodes": [0]}], "nodes": [{"name": path.stem, "mesh": 0}],
            "meshes": [{"primitives": primitives}], "buffers": [{"byteLength": len(binary)}],
            "bufferViews": views, "accessors": accessors,
            "materials": [{"name": name, "pbrMetallicRoughness": {"metallicFactor": 0, "roughnessFactor": roughness}}
                          for name, roughness in [("Corteza", 0.98), ("Acículas", 0.89)]]}
    data = json.dumps(meta, ensure_ascii=False, separators=(",", ":")).encode()
    data += b" " * (-len(data) % 4)
    total = 28 + len(data) + len(binary)
    path.write_bytes(struct.pack("<4sII", b"glTF", 2, total) + struct.pack("<I4s", len(data), b"JSON") + data
                     + struct.pack("<I4s", len(binary), b"BIN\0") + binary)
    print(path.name, sum(len(mesh.indices) // 3 for mesh in meshes), "triángulos,", total, "bytes")


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, seed, wide in [("pino-alto", 1743, False), ("pino-abierto", 3197, True)]:
        glb(OUTPUT / (name + ".glb"), pine(seed, wide))
