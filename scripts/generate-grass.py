"""Generate the original indexed woodland-grass GLB for Kilómetro 17."""
import json
import math
import random
import struct
from pathlib import Path


OUTPUT = Path(__file__).resolve().parents[1] / "public/assets/grass/pasto-del-bosque.glb"

GREEN = ((0.083, 0.151, 0.050), (0.110, 0.174, 0.064), (0.159, 0.211, 0.079))
DRY = ((0.177, 0.124, 0.048), (0.212, 0.163, 0.072))


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def scale(a, amount):
    return tuple(x * amount for x in a)


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(a):
    return scale(a, 1 / max(math.hypot(*a), 1e-10))


def packed_color(color, shade):
    return tuple(max(0, min(255, round(channel * shade * 255))) for channel in color) + (255,)


class GrassMesh:
    def __init__(self):
        self.positions = []
        self.colors = []
        self.indices = []

    def vertex(self, point, color, shade):
        self.positions.append(point)
        self.colors.append(packed_color(color, shade))
        return len(self.positions) - 1

    def leaf(self, rng, root, heading, height, reach, width, arch, color):
        dx, dz = math.cos(heading), math.sin(heading)
        sway = rng.uniform(-0.4, 0.4) * reach
        twist = rng.uniform(-0.95, 0.95)
        brightness = rng.uniform(0.78, 1.23)

        def frame(t):
            horizontal = reach * (0.22 * t + 0.78 * t ** 2)
            sideways = sway * t * t * (2 * t - 1)
            y = height * ((1 + arch) * t - arch * t ** 3)
            center = add(root, (dx * horizontal - dz * sideways, y, dz * horizontal + dx * sideways))
            advance = reach * (0.22 + 1.56 * t)
            drift = sway * (6 * t ** 2 - 2 * t)
            tangent = unit((dx * advance - dz * drift, height * (1 + arch - 3 * arch * t ** 2),
                            dz * advance + dx * drift))
            side = unit(cross(tangent, (0, 1, 0)))
            flat_normal = cross(tangent, side)
            roll = twist * (0.2 + 0.8 * t) + 0.16 * math.sin(t * math.pi)
            across = add(scale(side, math.cos(roll)), scale(flat_normal, math.sin(roll)))
            return center, across, cross(tangent, across)

        rings = []
        for t, taper in ((0, .24), (.17, .82), (.37, 1), (.58, .80), (.77, .54), (.91, .23)):
            center, across, normal = frame(t)
            span = width * taper / 2
            tone = brightness * (.56 + .44 * math.sin(t * math.pi / 2))
            left = self.vertex(add(center, scale(across, -span)), color, tone * 0.97)
            midrib = self.vertex(add(center, scale(normal, span * (0.3 - .15 * t))), color, tone * 1.10)
            right = self.vertex(add(center, scale(across, span)), color, tone * 0.85)
            rings.append((left, midrib, right))
        for bottom, top in zip(rings, rings[1:]):
            for i in range(2):
                self.indices.extend((bottom[i], top[i], top[i + 1], bottom[i], top[i + 1], bottom[i + 1]))
        tip = self.vertex(frame(1)[0], color, brightness * .91)
        self.indices.extend((rings[-1][0], tip, rings[-1][1], rings[-1][1], tip, rings[-1][2]))

    def seed_head(self, rng, root, heading, height):
        dx, dz = math.cos(heading), math.sin(heading)
        color = rng.choice(DRY)
        lean = rng.uniform(.035, .075)

        def axis(t):
            return add(root, (dx * lean * t * t, height * t, dz * lean * t * t))

        for i in range(2):
            angle = heading + i * math.pi / 2
            offset = (math.cos(angle), 0, math.sin(angle))
            previous = None
            for t in (0, .32, .65, .86, 1):
                center = axis(t)
                half_width = .0015 * (1 - .48 * t)
                current = (self.vertex(add(center, scale(offset, -half_width)), color, .70 + .32 * t),
                           self.vertex(add(center, scale(offset, half_width)), color, .80 + .28 * t))
                if previous is not None:
                    self.indices.extend((previous[0], current[0], current[1], previous[0], current[1], previous[1]))
                previous = current

        for i in range(5):
            t = 0.87 + i * 0.03
            center = axis(t)
            angle = heading + i * 2.39996
            spread = (math.cos(angle), 0, math.sin(angle))
            length = .021 * (1 - .10 * i)
            middle = add(center, (spread[0] * length * .55, length * .38, spread[2] * length * .55))
            peak = self.vertex(add(middle, (spread[0] * length * .28, length * .62, spread[2] * length * .28)),
                               color, 1.17)
            base = self.vertex(center, color, .82)
            width = length * .16
            across = (-spread[2] * width, 0, spread[0] * width)
            first = self.vertex(add(middle, across), color, 1.12)
            crest = self.vertex(add(middle, (spread[0] * .002, .002, spread[2] * .002)), color, 1.21)
            last = self.vertex(sub(middle, across), color, .96)
            self.indices.extend((base, first, crest, first, peak, crest, crest, peak, last, crest, last, base))

    def normals(self):
        normals = [(0, 0, 0)] * len(self.positions)
        for start in range(0, len(self.indices), 3):
            a, b, c = self.indices[start:start + 3]
            normal = cross(sub(self.positions[b], self.positions[a]), sub(self.positions[c], self.positions[a]))
            for i in (a, b, c):
                normals[i] = add(normals[i], normal)
        return [unit(normal) for normal in normals]


def patch(seed, offsets, count, heights, reaches, widths, dry_chance, stems):
    rng = random.Random(seed)
    mesh = GrassMesh()
    for blade in range(count):
        sprout = offsets[blade % len(offsets)]
        heading = blade * 2.39996 + rng.uniform(-.24, .24)
        root = (sprout[0] + rng.uniform(-.048, .048), 0, sprout[1] + rng.uniform(-.048, .048))
        dried = rng.random() < dry_chance
        height = rng.uniform(*heights)
        reach = rng.uniform(*reaches)
        width = rng.uniform(*widths)
        arch = rng.uniform(.40, .95)
        if dried:
            height *= rng.uniform(.68, .96)
            reach *= 1.13
            width *= .78
            arch += .13
        mesh.leaf(rng, root, heading, height, reach, width, arch, rng.choice(DRY if dried else GREEN))
    for i in range(stems):
        x, z = offsets[i % len(offsets)]
        mesh.seed_head(rng, (x + rng.uniform(-.035, .035), 0, z + rng.uniform(-.035, .035)),
                       rng.uniform(0, math.tau), rng.uniform(.31, .43))
    return mesh


def main():
    variants = (
        ("pasto_rastrero", patch(617, ((-.092, -.03), (.079, .069), (.045, -.113)), 19,
                                (.07, .18), (.06, .19), (.005, .014), .28, 0)),
        ("pasto_mixto", patch(176, ((-.10, .056), (.114, .072), (.020, -.089)), 25,
                             (.13, .30), (.057, .24), (.007, .020), .19, 0)),
        ("pasto_espigado", patch(418, ((-.073, .071), (.094, .026), (-.041, -.074)), 22,
                                (.12, .33), (.062, .22), (.004, .013), .36, 4)),
    )
    binary, views, accessors, meshes, nodes = bytearray(), [], [], [], []

    def store(data, fmt, component, shape, target, normalized=False):
        binary.extend(b"\0" * (-len(binary) % 4))
        offset = len(binary)
        for row in data:
            binary.extend(struct.pack(fmt, *row))
        views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(binary) - offset, "target": target})
        accessor = {"bufferView": len(views) - 1, "componentType": component, "count": len(data), "type": shape}
        if normalized:
            accessor["normalized"] = True
        accessors.append(accessor)
        return len(accessors) - 1

    for name, mesh in variants:
        p = store(mesh.positions, "<3f", 5126, "VEC3", 34962)
        accessors[p].update(min=[min(axis) for axis in zip(*mesh.positions)],
                            max=[max(axis) for axis in zip(*mesh.positions)])
        n = store(mesh.normals(), "<3f", 5126, "VEC3", 34962)
        c = store(mesh.colors, "<4B", 5121, "VEC4", 34962, normalized=True)
        indices = store([(index,) for index in mesh.indices], "<H", 5123, "SCALAR", 34963)
        nodes.append({"name": name, "mesh": len(meshes)})
        meshes.append({"primitives": [{"attributes": {"POSITION": p, "NORMAL": n, "COLOR_0": c},
                                       "material": 0, "indices": indices}]})

    binary.extend(b"\0" * (-len(binary) % 4))
    scene = {
        "asset": {"version": "2.0", "generator": "Kilómetro 17 · pastos de bosque"},
        "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}], "nodes": nodes, "meshes": meshes,
        "materials": [{"name": "Hojas verdes y secas", "doubleSided": True,
                       "pbrMetallicRoughness": {"metallicFactor": 0, "roughnessFactor": .83}}],
        "buffers": [{"byteLength": len(binary)}], "bufferViews": views, "accessors": accessors,
    }
    metadata = json.dumps(scene, ensure_ascii=False, separators=(",", ":")).encode()
    metadata += b" " * (-len(metadata) % 4)
    total = 28 + len(metadata) + len(binary)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(struct.pack("<4sII", b"glTF", 2, total)
                       + struct.pack("<I4s", len(metadata), b"JSON") + metadata
                       + struct.pack("<I4s", len(binary), b"BIN\0") + binary)
    counts = ", ".join(f"{name}={len(mesh.indices) // 3}" for name, mesh in variants)
    print(f"{OUTPUT.name}: {total} bytes; triangulos: {counts}")


if __name__ == "__main__":
    main()
