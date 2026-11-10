"""Generate the original volumetric grass clump used by Kilómetro 17."""
import json
import math
from pathlib import Path
import random
import struct

OUTPUT = Path(__file__).resolve().parents[1] / "public/assets/grass/pasto-del-bosque.glb"


def make_blades():
    rng = random.Random(617)
    positions, normals, colors = [], [], []
    for blade in range(19):
        angle = blade * 2.39996 + rng.uniform(-0.22, 0.22)
        dx, dz = math.cos(angle), math.sin(angle)
        spread = rng.uniform(0.018, 0.115)
        height = rng.uniform(0.17, 0.44)
        bend = rng.uniform(0.065, 0.19)
        width = rng.uniform(0.009, 0.023)
        tint = (0.115, 0.082, 0.036) if blade % 5 == 0 else (0.047, 0.095, 0.051)
        brightness = rng.uniform(0.72, 1.30)

        def ring(t, taper):
            center_x = dx * (spread + bend * t * t)
            center_z = dz * (spread + bend * t * t)
            y = height * (t - 0.16 * t ** 3)
            half_width = width * taper / 2
            return [
                (center_x + dz * half_width, y, center_z - dx * half_width),
                (center_x + dx * half_width * 0.43, y, center_z + dz * half_width * 0.43),
                (center_x - dz * half_width, y, center_z + dx * half_width),
            ]

        rings = [ring(0, 0.5), ring(0.37, 1), ring(0.72, 0.53), ring(1, 0.02)]
        for segment, (lower, upper) in enumerate(zip(rings, rings[1:])):
            for face in range(3):
                other = (face + 1) % 3
                for triangle in ((lower[face], upper[face], upper[other]), (lower[face], upper[other], lower[other])):
                    a, b, c = triangle
                    u, v = [b[i]-a[i] for i in range(3)], [c[i]-a[i] for i in range(3)]
                    normal = (u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0])
                    length = math.hypot(*normal)
                    positions.extend(triangle)
                    normals.extend([tuple(axis / length for axis in normal)] * 3)
                    factor = brightness * (0.63 + 0.24 * segment) * (0.82 if face == 2 else 1)
                    colors.extend([tuple(round(channel * factor * 255) for channel in tint) + (255,)] * 3)
    return positions, normals, colors


def main():
    positions, normals, colors = make_blades()
    binary, views, accessors = bytearray(), [], []
    for rows, fmt, component, shape in (
        (positions, "<3f", 5126, "VEC3"),
        (normals, "<3f", 5126, "VEC3"),
        (colors, "<4B", 5121, "VEC4"),
    ):
        offset = len(binary)
        binary.extend(b"".join(struct.pack(fmt, *row) for row in rows))
        views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(binary) - offset, "target": 34962})
        accessor = {"bufferView": len(views) - 1, "componentType": component, "count": len(rows), "type": shape}
        if rows is positions:
            accessor.update(min=[min(axis) for axis in zip(*rows)], max=[max(axis) for axis in zip(*rows)])
        if rows is colors:
            accessor["normalized"] = True
        accessors.append(accessor)

    scene = {
        "asset": {"version": "2.0", "generator": "Kilómetro 17 · pasto volumétrico"},
        "scene": 0, "scenes": [{"nodes": [0]}],
        "nodes": [{"name": "Mata de pasto", "mesh": 0}],
        "meshes": [{"primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1, "COLOR_0": 2}, "material": 0}]}],
        "materials": [{"name": "Pasto de sombra", "doubleSided": True,
                       "pbrMetallicRoughness": {"metallicFactor": 0, "roughnessFactor": 1}}],
        "buffers": [{"byteLength": len(binary)}], "bufferViews": views, "accessors": accessors,
    }
    metadata = json.dumps(scene, ensure_ascii=False, separators=(",", ":")).encode()
    metadata += b" " * (-len(metadata) % 4)
    total = 28 + len(metadata) + len(binary)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(struct.pack("<4sII", b"glTF", 2, total)
                       + struct.pack("<I4s", len(metadata), b"JSON") + metadata
                       + struct.pack("<I4s", len(binary), b"BIN\0") + binary)
    print(f"{OUTPUT.name}: {len(positions) // 3} triángulos · {total} bytes")


if __name__ == "__main__":
    main()
