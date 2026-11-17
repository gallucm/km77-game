"""Generate the original Kilómetro 17 first-person hands and work jacket."""
import json
import math
import struct
import zlib
from pathlib import Path


OUTPUT = Path(__file__).resolve().parents[1] / "public/assets/player/brazos.glb"
MATERIALS = (
    ("Lona encerada gastada", 0.87, True),
    ("Puño de punto y pespuntes", 0.96, True),
    ("Piel · palma y falanges", 0.69, False),
    ("Uñas", 0.56, False),
)


def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def scale(a, factor):
    return tuple(x * factor for x in a)


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(a):
    return scale(a, 1 / max(1e-10, math.hypot(*a)))


def mix(a, b, t):
    return add(a, scale(sub(b, a), t))


def cloth_tube(rings, shade, ridges=0.0, ribs=0, sides=56):
    positions, colors, uvs, indices = [], [], [], []
    for i, (center, width, depth) in enumerate(rings):
        along = unit(sub(rings[min(i + 1, len(rings) - 1)][0], rings[max(0, i - 1)][0]))
        side = unit(cross((0, 1, 0), along))
        up = cross(along, side)
        t = i / (len(rings) - 1)
        for j in range(sides + 1):
            a = j * math.tau / sides
            c, s = math.cos(a), math.sin(a)
            fold = 0.56 * math.sin(4 * a + 7 * t) + 0.3 * math.cos(7 * a - 14 * t)
            fold += 0.45 * math.sin(18 * t + 1.8 * math.sin(2 * a)) * (0.15 + 0.85 * t)
            rib = math.cos(ribs * a) if ribs else 0
            ripple = 1 + ridges * fold + 0.06 * rib
            offset = add(scale(side, width * c * ripple), scale(up, depth * s * ripple))
            positions.append(add(center, offset))
            seam = math.exp(-((math.remainder(a - 0.58, math.tau)) / 0.075) ** 2)
            factor = 1 + fold * 0.12 + 0.22 * seam + rib * 0.075 + 0.07 * s
            colors.append(scale(shade, factor))
            uvs.append((j / sides * 3.0, t * 3.5))
    stride = sides + 1
    for i in range(len(rings) - 1):
        for j in range(sides):
            a = i * stride + j
            b = a + 1
            indices.extend((a, b, b + stride, a, b + stride, a + stride))
    for i in (0, len(rings) - 1):
        end = i * stride
        cap = len(positions)
        positions.append(rings[i][0])
        colors.append(shade)
        uvs.append((0.5, 0.5))
        for j in range(sides):
            a, b = end + j, end + j + 1
            indices.extend((cap, a, b) if i else (cap, b, a))
    normals = smooth_normals(positions, indices)
    for i in range(len(rings)):
        start = i * stride
        end = start + sides
        normals[start] = normals[end] = unit(add(normals[start], normals[end]))
    return positions, normals, colors, uvs, indices


def smooth_normals(points, indices):
    normals = [(0.0, 0.0, 0.0)] * len(points)
    for i in range(0, len(indices), 3):
        a, b, c = indices[i:i + 3]
        face = cross(sub(points[b], points[a]), sub(points[c], points[a]))
        for index in (a, b, c):
            normals[index] = add(normals[index], face)
    return [unit(normal) for normal in normals]


def volume_section(start, end, w0, h0, w1, h1):
    """Tapered bone or palm section with elliptical cross-section and round ends."""
    dx, dy, dz = sub(end, start)
    length = math.hypot(dx, dy, dz)
    fx, fy, fz = dx / length, dy / length, dz / length
    sx, sy, sz = unit(cross((0, 1, 0), (fx, fy, fz)))
    ux, uy, uz = cross((fx, fy, fz), (sx, sy, sz))
    x0, y0, z0 = start
    margin = max(w0, h0, w1, h1) + 0.009
    bounds = tuple(
        (min(a, b) - margin, max(a, b) + margin) for a, b in zip(start, end)
    )
    return (bounds, x0, y0, z0, fx, fy, fz, sx, sy, sz, ux, uy, uz, length, w0, h0, w1, h1)


def section_distance(section, x, y, z):
    _, x0, y0, z0, fx, fy, fz, sx, sy, sz, ux, uy, uz, length, w0, h0, w1, h1 = section
    dx, dy, dz = x - x0, y - y0, z - z0
    lengthwise = dx * fx + dy * fy + dz * fz
    clamped = min(length, max(0.0, lengthwise))
    t = clamped / length
    width = w0 + (w1 - w0) * t
    height = h0 + (h1 - h0) * t
    across = (dx * sx + dy * sy + dz * sz) / width
    dorsal = (dx * ux + dy * uy + dz * uz) / height
    tip = (lengthwise - clamped) / min(width, height)
    return (math.sqrt(across * across + dorsal * dorsal + tip * tip) - 1) * min(width, height)


def skin_field(sections):
    def distance(x, y, z):
        result = 0.025
        for section in sections:
            (lx, hx), (ly, hy), (lz, hz) = section[0]
            if lx <= x <= hx and ly <= y <= hy and lz <= z <= hz:
                part = section_distance(section, x, y, z)
                blend = max(0.0, 0.0058 - abs(result - part))
                result = min(result, part) - blend * blend / 0.0232
        return result
    return distance


def surface(field, sections, step=0.00365):
    bounds = [section[0] for section in sections]
    limits = list(zip(*bounds))
    lo = [min(pair[0] for pair in axis) for axis in limits]
    count = [math.ceil((max(pair[1] for pair in axis) - lo[i]) / step) + 1 for i, axis in enumerate(limits)]
    nx, ny, nz = count
    grid = [[base + step * i for i in range(n)] for base, n in zip(lo, count)]
    gx, gy, gz = grid
    values = [field(x, y, z) for z in gz for y in gy for x in gx]
    slice_size = nx * ny
    shifts = (0, 1, nx, nx + 1, slice_size, slice_size + 1, slice_size + nx, slice_size + nx + 1)
    edges = ((0, 1), (2, 3), (4, 5), (6, 7), (0, 2), (1, 3),
             (4, 6), (5, 7), (0, 4), (1, 5), (2, 6), (3, 7))
    vertices, triangles, cells = [], [], {}

    def point(i):
        zi, remainder = divmod(i, slice_size)
        yi, xi = divmod(remainder, nx)
        return gx[xi], gy[yi], gz[zi]

    # Average the zero crossings in each cell, then join the four cells around each surface edge.
    for iz in range(nz - 1):
        for iy in range(ny - 1):
            for ix in range(nx - 1):
                start = iz * slice_size + iy * nx + ix
                ids = tuple(start + shift for shift in shifts)
                mask = tuple(values[i] < 0 for i in ids)
                if all(mask) or not any(mask):
                    continue
                crossings = [
                    mix(point(ids[a]), point(ids[b]), values[ids[a]] / (values[ids[a]] - values[ids[b]]))
                    for a, b in edges if mask[a] != mask[b]
                ]
                cells[start] = len(vertices)
                vertices.append(tuple(sum(axis) / len(crossings) for axis in zip(*crossings)))

    for start, a in cells.items():
        inside = values[start] < 0
        for direction, side, depth in ((1, nx, slice_size), (nx, slice_size, 1), (slice_size, 1, nx)):
            if inside == (values[start + direction] < 0):
                continue
            b = cells.get(start - side)
            c = cells.get(start - side - depth)
            d = cells.get(start - depth)
            if b is not None and c is not None and d is not None:
                triangles.extend((a, b, c, a, c, d) if inside else (a, c, b, a, d, c))
    return vertices, smooth_normals(vertices, triangles), triangles


def hand_pose(side):
    # The dominant hand leads a little. The wrists continue along the forearms.
    wrist = (side * (0.222 if side > 0 else 0.251), -0.215 if side > 0 else -0.237,
             -0.700 if side > 0 else -0.655)
    forward = unit((-side * 0.18, 0.109 if side > 0 else 0.077, -1.0))
    across = unit(cross(forward, (0, 1, 0)))
    up = cross(across, forward)
    roll = side * (0.16 if side > 0 else 0.31)
    right = add(scale(across, math.cos(roll)), scale(up, math.sin(roll)))
    dorsal = add(scale(up, math.cos(roll)), scale(across, -math.sin(roll)))
    outward = scale(right, side)

    def vector(x, y, z):
        return add(add(scale(outward, x), scale(dorsal, y)), scale(forward, z))

    def point(x, y, z):
        return add(wrist, vector(x, y, z))

    return point, vector


def hand(side):
    lead = side > 0
    sections = [
        volume_section((0, -0.001, -0.034), (0, 0.0, 0.019), .026, .020, .031, .020),
        volume_section((-.007, -.004, .014), (-.008, -.005, .054), .031, .023, .037, .022),
        volume_section((-.003, .001, .044), (.002, .006, .082), .038, .022, .039, .017),
        volume_section((-.018, -.010, .016), (-.030, -.014, .056), .018, .017, .017, .015),
        volume_section((.024, -.011, .028), (.031, -.010, .071), .013, .013, .012, .013),
    ]
    digits = []
    for i, (x, z, long, width) in enumerate((
        (-.026, .080, .077, .0121), (-.003, .085, .085, .0127),
        (.021, .081, .078, .0115), (.042, .072, .065, .0093),
    )):
        curl = (0.96 if lead else 0.80) + i * 0.035
        spread = (i - 1.2) * (0.003 if lead else 0.005)
        points = (
            (x - spread * .1, .008, z - .012),
            (x, .011, z + long * .20),
            (x + spread * .43, -.005 * curl, z + long * .51),
            (x + spread * .78, -.026 * curl, z + long * .63),
            (x + spread, -.044 * curl, z + long * .59),
        )
        sizes = (width * 1.05, width * .94, width * .83, width * .70, width * .63)
        for j, (start, end) in enumerate(zip(points, points[1:])):
            r0, r1 = sizes[j:j + 2]
            sections.append(volume_section(start, end, r0, r0 * .90, r1, r1 * .88))
        digits.append((points, sizes))
    thumb = ((-.030, -.005, .024), (-.048, -.008, .047),
             (-.058, -.016 if lead else -.011, .070), (-.056 if lead else -.063, -.031, .088),
             (-.044 if lead else -.060, -.040 if lead else -.037, .104))
    thumb_sizes = (.0180, .0153, .0124, .0101, .0083)
    for i, (start, end) in enumerate(zip(thumb, thumb[1:])):
        r0, r1 = thumb_sizes[i:i + 2]
        sections.append(volume_section(start, end, r0, r0 * .94, r1, r1 * .93))
    digits.append((thumb, thumb_sizes))
    return sections, digits


def skin_color(x, y, z, digits):
    base = (0.45, 0.252, 0.169)
    pigment = 0.99 + 0.032 * math.sin(106 * x + math.sin(72 * z)) * math.cos(z * 131)
    pigment += 0.012 * math.sin(483 * x + 361 * y) * math.sin(388 * z - 103 * x)
    warm = 0
    for positions, sizes in digits:
        for j in (1, 2, 3):
            a, b, c = positions[j]
            width = sizes[j]
            warm += math.exp(-((x - a) / (width * 1.2)) ** 2 - ((z - c) / .013) ** 2) * max(0, min(1, (y - b) / width))
    tendon = 0
    if y > .009:
        for x0 in (-.023, -.003, .018, .033):
            tendon += math.exp(-((x - x0 * (.52 + 5.3 * z)) / .0043) ** 2 - ((z - .051) / .026) ** 2)
    return (base[0] * pigment + warm * .038 + tendon * .020,
            base[1] * pigment - warm * .010 + tendon * .017,
            base[2] * pigment - warm * .009 + tendon * .014)


def nails(field, digits):
    points, colors, faces = [], [], []
    for positions, sizes in digits:
        joint, tip = positions[-2:]
        forward = unit(sub(tip, joint))
        across = unit(cross((0, 1, 0), forward))
        dorsal = cross(forward, across)
        center = mix(joint, tip, .70)
        radius = sizes[-1]

        def surface_point(u, v):
            origin = add(center, add(scale(across, u * radius * .66), scale(forward, v * radius * .85)))
            low, high = 0.0, radius * 2.2
            for _ in range(11):
                height = (low + high) * .5
                if field(*add(origin, scale(dorsal, height))) < 0:
                    low = height
                else:
                    high = height
            return add(origin, scale(dorsal, high + .00045))

        start = len(points)
        points.append(surface_point(0, 0))
        colors.append((.45, .278, .209))
        for j in range(16):
            angle = j * math.tau / 16
            u, v = math.cos(angle), math.sin(angle)
            points.append(surface_point(u, v))
            tint = max(0, v - .26) * .29
            colors.append((.425 + tint, .265 + tint, .202 + tint))
        for j in range(16):
            faces.extend((start, start + 1 + (j + 1) % 16, start + 1 + j))
    return points, smooth_normals(points, faces), colors, faces


def sleeves(point):
    def put(spec):
        return [(point(x, y, z), w, d) for x, y, z, w, d in spec]

    sleeve = put((
        (.115, -.21, -.424, .096, .100), (.092, -.184, -.369, .091, .093),
        (.073, -.155, -.318, .088, .088), (.056, -.130, -.278, .084, .081),
        (.043, -.107, -.230, .077, .072), (.031, -.081, -.182, .069, .063),
        (.022, -.061, -.147, .063, .057), (.015, -.043, -.121, .059, .053),
        (.009, -.025, -.095, .054, .050), (.003, -.008, -.073, .052, .045),
        (.001, -.003, -.055, .050, .042), (0, -.002, -.044, .043, .036),
    ))
    yield 0, cloth_tube(sleeve, (.105, .138, .123), ridges=.10)
    cuff = put((
        (.001, -.003, -.061, .045, .038), (0, -.002, -.047, .044, .036),
        (0, -.001, -.035, .039, .031), (0, 0, -.023, .035, .028),
        (0, 0, -.013, .034, .027), (0, 0, -.011, .031, .025),
    ))
    yield 1, cloth_tube(cuff, (.040, .054, .049), ridges=.035, ribs=22, sides=88)
    binding = put((
        (.001, -.004, -.067, .050, .043), (.001, -.003, -.063, .051, .043),
        (.001, -.002, -.059, .050, .042),
    ))
    yield 1, cloth_tube(binding, (.091, .116, .102), ridges=.055)


def arm(side):
    point, vector = hand_pose(side)
    pivot = point(.028, -.073, -.192)
    for material, (p, n, c, uv, i) in sleeves(point):
        yield pivot, material, ([sub(pos, pivot) for pos in p], n, c, uv, i)
    sections, digits = hand(side)
    field = skin_field(sections)
    positions, normals, indices = surface(field, sections)
    nail_positions, nail_normals, nail_colors, nail_indices = nails(field, digits)
    for material, p, n, c, i in (
        (2, positions, normals, [skin_color(*pos, digits) for pos in positions], indices),
        (3, nail_positions, nail_normals, nail_colors, nail_indices),
    ):
        # The authored hand points down local -Z in the camera. Mirror the right winding.
        if side > 0:
            for index in range(0, len(i), 3):
                i[index + 1], i[index + 2] = i[index + 2], i[index + 1]
        yield pivot, material, ([sub(point(*pos), pivot) for pos in p], [vector(*normal) for normal in n], c, [], i)


def fabric_png():
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    size = 128
    scanlines = bytearray()
    for y in range(size):
        scanlines.append(0)
        for x in range(size):
            warp = (math.cos(x * math.tau / 4 + .3 * math.sin(y * math.tau / 8)) + 1) * .5
            weft = (math.cos(y * math.tau / 4) + 1) * .5
            weave = warp if (x // 4 + y // 4) % 2 else weft
            abrasion = math.sin(x * math.tau / size + y * math.tau / size) * 9
            abrasion += math.cos(x * math.tau / 32 - y * math.tau / 64) * 5
            fiber = (((x * 37) ^ (y * 127) ^ (x * y * 11)) & 15) - 7
            shade = int(198 + 43 * weave + abrasion + fiber)
            scanlines.append(max(0, min(255, shade)))
    header = struct.pack(">IIBBBBB", size, size, 8, 0, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(scanlines, 9)) + chunk(b"IEND", b"")


def export():
    data = bytearray()
    views, accessors, meshes, nodes = [], [], [], []

    def buffer_view(payload, target=None):
        data.extend(b"\0" * (-len(data) % 4))
        record = dict(buffer=0, byteOffset=len(data), byteLength=len(payload))
        if target:
            record["target"] = target
        views.append(record)
        data.extend(payload)
        return len(views) - 1

    def store(values, dimension, component_type, code, target, normalized=False):
        payload = struct.pack(f"<{len(values)}{code}", *values)
        record = dict(bufferView=buffer_view(payload, target), componentType=component_type,
                      count=len(values) // dimension, type={1: "SCALAR", 2: "VEC2", 3: "VEC3", 4: "VEC4"}[dimension])
        if normalized:
            record["normalized"] = True
        accessors.append(record)
        return len(accessors) - 1

    def packed_color(colors):
        return [value for color in colors for value in (
            *(max(0, min(255, round(channel * 255))) for channel in color), 255
        )]

    triangles = 0
    for side, name in ((-1, "brazo_izquierdo"), (1, "brazo_derecho")):
        parts = {}
        for pivot, material, (positions, normals, colors, uv, indices) in arm(side):
            p, n, c, t, f = parts.setdefault(material, ([], [], [], [], []))
            f.extend(len(p) + index for index in indices)
            p.extend(positions)
            n.extend(normals)
            c.extend(colors)
            t.extend(uv)
        primitives = []
        for material, (positions, normals, colors, uvs, indices) in sorted(parts.items()):
            p = store([n for v in positions for n in v], 3, 5126, "f", 34962)
            accessors[p].update(min=[min(v) for v in zip(*positions)], max=[max(v) for v in zip(*positions)])
            n = store([a for v in normals for a in v], 3, 5126, "f", 34962)
            c = store(packed_color(colors), 4, 5121, "B", 34962, normalized=True)
            attributes = dict(POSITION=p, NORMAL=n, COLOR_0=c)
            if uvs:
                attributes["TEXCOORD_0"] = store([a for v in uvs for a in v], 2, 5126, "f", 34962)
            idx = store(indices, 1, 5123, "H", 34963)
            primitives.append(dict(material=material, indices=idx, attributes=attributes))
            triangles += len(indices) // 3
        nodes.append(dict(name=name, translation=pivot, mesh=len(meshes)))
        meshes.append(dict(primitives=primitives))

    materials = []
    for name, roughness, fabric in MATERIALS:
        pbr = dict(metallicFactor=0, roughnessFactor=roughness)
        if fabric:
            pbr["baseColorTexture"] = dict(index=0)
        materials.append(dict(name=name, pbrMetallicRoughness=pbr))
    image = buffer_view(fabric_png())
    data.extend(b"\0" * (-len(data) % 4))
    document = dict(
        asset=dict(version="2.0", generator="Kilómetro 17 · Mr. Games"),
        scene=0, scenes=[dict(nodes=[0, 1])], nodes=nodes, meshes=meshes, materials=materials,
        samplers=[dict(magFilter=9729, minFilter=9987, wrapS=10497, wrapT=10497)],
        images=[dict(name="Trama original de lona", bufferView=image, mimeType="image/png")],
        textures=[dict(sampler=0, source=0)],
        buffers=[dict(byteLength=len(data))], bufferViews=views, accessors=accessors,
    )
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
