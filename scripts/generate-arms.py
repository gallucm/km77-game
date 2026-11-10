"""Generate the original Kilómetro 17 first-person viewmodel."""
import json
import math
import struct
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / "public/assets/player/brazos.glb"
MATERIALS = [
    ("Abrigo de lona carbón", (0.075, 0.102, 0.108), 0.94),
    ("Puño tejido oscuro", (0.038, 0.051, 0.054), 0.97),
    ("Piel", (0.39, 0.211, 0.143), 0.83),
    ("Costura de lona", (0.115, 0.14, 0.139), 0.97),
]


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def scale(v, amount):
    return tuple(x * amount for x in v)


def sub(a, b):
    return add(a, scale(b, -1))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(v):
    return scale(v, 1 / math.hypot(*v))


def tube(rings, sides=12, wrinkles=0):
    vertices, indices = [], []
    for i, (center, width, depth) in enumerate(rings):
        forward = unit(sub(rings[min(i + 1, len(rings) - 1)][0], rings[max(0, i - 1)][0]))
        side = unit(cross((0, 1, 0), forward))
        up = cross(forward, side)
        for j in range(sides):
            angle = j * math.tau / sides
            c, s = math.cos(angle), math.sin(angle)
            ripple = 1 + wrinkles * (0.65 * math.sin(3 * angle + i * 2) + 0.35 * math.cos(5 * angle - i))
            offset = add(scale(side, width * c * ripple), scale(up, depth * s * ripple))
            normal = unit(add(scale(side, c / width), scale(up, s / depth)))
            vertices.append((add(center, offset), normal))
    for i in range(len(rings) - 1):
        for j in range(sides):
            a = i * sides + j
            b = i * sides + (j + 1) % sides
            indices.extend((a, b, b + sides, a, b + sides, a + sides))
    for end in (0, len(rings) - 1):
        start = end * sides
        for j in range(1, sides - 1):
            cap = (start, start + j, start + j + 1)
            indices.extend(cap if end else reversed(cap))
    return vertices, indices


def arm(sign, pivot):
    def local(x, y, z):
        return sub((sign * x, y, z), pivot)

    def shape(points, sides=12, wrinkles=0):
        return tube([(local(*xyz), w, d) for xyz, w, d in points], sides, wrinkles)

    sleeve = [
        ((0.375, -0.53, -0.27), .106, .107),
        ((0.366, -0.494, -0.355), .101, .103),
        ((0.347, -0.447, -0.424), .090, .086),
        ((0.334, -0.417, -0.475), .083, .079),
        ((0.321, -0.389, -0.529), .073, .068),
        ((0.311, -0.367, -0.573), .065, .060),
        ((0.3, -0.348, -0.616), .059, .051),
        ((0.287, -0.325, -0.654), .052, .046),
        ((0.277, -0.309, -0.68), .048, .039),
    ]
    yield 0, shape(sleeve, 20, .095)
    cuff = [
        ((.285, -.322, -.651), .052, .047),
        ((.278, -.311, -.668), .052, .044),
        ((.268, -.294, -.695), .044, .034),
        ((.263, -.288, -.711), .043, .031),
    ]
    yield 1, shape(cuff, 20, .04)
    yield 3, shape([
        ((.286, -.321, -.654), .053, .048),
        ((.283, -.317, -.661), .053, .047),
    ], 20, .04)
    palm = [
        ((.266, -.292, -.698), .032, .024),
        ((.256, -.279, -.723), .036, .022),
        ((.247, -.272, -.746), .043, .022),
        ((.242, -.272, -.769), .044, .020),
        ((.241, -.277, -.789), .039, .015),
        ((.242, -.282, -.797), .031, .010),
    ]
    yield 2, shape(palm, 16)
    for j, (x, length, width) in enumerate(zip(
        (.211, .232, .253, .274), (.068, .077, .067, .051), (.011, .011, .010, .009)
    )):
        z = -.781 + (0.004 if j == 3 else 0)
        yield 2, shape([
            ((x, -.275, z), width, .013),
            ((x - .005, -.280, z - length * .27), width * .98, .011),
            ((x - .009, -.294, z - length * .60), width * .82, .009),
            ((x - .011, -.313, z - length * .83), width * .72, .008),
            ((x - .011, -.326, z - length * .88), width * .49, .006),
            ((x - .011, -.330, z - length * .90), width * .15, .003),
        ], 10)
    yield 2, shape([
        ((.227, -.282, -.73), .017, .016),
        ((.208, -.281, -.744), .016, .014),
        ((.194, -.29, -.767), .014, .013),
        ((.188, -.301, -.791), .011, .010),
        ((.190, -.313, -.802), .008, .007),
        ((.191, -.316, -.804), .003, .003),
    ], 12)


def export():
    data = bytearray()
    views, accessors, meshes, nodes = [], [], [], []

    def store(values, dimension, component_type, code, target):
        data.extend(b"\0" * (-len(data) % 4))
        payload = struct.pack(f"<{len(values)}{code}", *values)
        views.append(dict(buffer=0, byteOffset=len(data), byteLength=len(payload), target=target))
        data.extend(payload)
        accessors.append(dict(bufferView=len(views)-1, componentType=component_type,
                              count=len(values)//dimension, type="VEC3" if dimension == 3 else "SCALAR"))
        return len(accessors)-1

    triangles = 0
    for sign, name in [(-1, "brazo_izquierdo"), (1, "brazo_derecho")]:
        pivot = (sign * .32, -.38, -.36)
        parts = {}
        for material, (vertices, indices) in arm(sign, pivot):
            existing, faces = parts.setdefault(material, ([], []))
            faces.extend(len(existing) + index for index in indices)
            existing.extend(vertices)
        primitives = []
        for material, (vertices, indices) in sorted(parts.items()):
            positions, normals = zip(*vertices)
            p = store([a for v in positions for a in v], 3, 5126, "f", 34962)
            accessors[p].update(min=[min(v) for v in zip(*positions)], max=[max(v) for v in zip(*positions)])
            n = store([a for v in normals for a in v], 3, 5126, "f", 34962)
            idx = store(indices, 1, 5123, "H", 34963)
            primitives.append(dict(material=material, indices=idx, attributes=dict(POSITION=p, NORMAL=n)))
            triangles += len(indices) // 3
        nodes.append(dict(name=name, translation=pivot, mesh=len(meshes)))
        meshes.append(dict(primitives=primitives))
    data.extend(b"\0" * (-len(data) % 4))
    document = dict(asset=dict(version="2.0", generator="Kilómetro 17 · Mr. Design"),
                    scene=0, scenes=[dict(nodes=[0, 1])], nodes=nodes, meshes=meshes,
                    materials=[dict(name=name, pbrMetallicRoughness=dict(baseColorFactor=[*color, 1],
                                  metallicFactor=0, roughnessFactor=roughness))
                               for name, color, roughness in MATERIALS],
                    buffers=[dict(byteLength=len(data))], bufferViews=views, accessors=accessors)
    metadata = json.dumps(document, separators=(",", ":"), ensure_ascii=False).encode()
    metadata += b" " * (-len(metadata) % 4)
    header = struct.pack("<4sII", b"glTF", 2, 28 + len(metadata) + len(data))
    payload = header + struct.pack("<I4s", len(metadata), b"JSON") + metadata
    payload += struct.pack("<I4s", len(data), b"BIN\0") + data
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_bytes(payload)
    print(f"{OUTPUT.name}: {len(payload)} bytes, {triangles} triángulos")


if __name__ == "__main__":
    export()
