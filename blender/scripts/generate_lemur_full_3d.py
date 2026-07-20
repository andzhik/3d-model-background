"""Build the Prompt 02 full-volume lemur and its deterministic review packet."""

import argparse
import binascii
import hashlib
import json
import struct
import sys
import zlib
from pathlib import Path

import bpy
from mathutils import Vector


ASSET_ID = "lemur-full-3d"
PROMPT = "02"
REVISION = "01"
FORWARD_AXIS = "-Y"
GROUND_PLANE_Z = 0.0
RENDER_SIZE = (512, 512)
ORTHO_SCALE = 3.6
CAMERA_TARGET = (0.0, 0.0, 1.36)
MATERIAL_SPECS = (
    ("PrimaryCharcoal", (0.075, 0.082, 0.10, 1.0)),
    ("PrimaryGray", (0.31, 0.33, 0.37, 1.0)),
    ("PrimaryLight", (0.76, 0.73, 0.69, 1.0)),
    ("PrimaryEye", (0.78, 0.34, 0.055, 1.0)),
)
ORTHOGRAPHIC_CAMERAS = (
    ("Front", "front.png", (0.0, -8.0, 1.36)),
    ("Left", "left.png", (-8.0, 0.0, 1.36)),
    ("Right", "right.png", (8.0, 0.0, 1.36)),
    ("Back", "back.png", (0.0, 8.0, 1.36)),
    (
        "FrontLeftThreeQuarter",
        "front-left-three-quarter.png",
        (-5.657, -5.657, 1.36),
    ),
    (
        "FrontRightThreeQuarter",
        "front-right-three-quarter.png",
        (5.657, -5.657, 1.36),
    ),
)
PERSPECTIVE_CAMERA = (
    "PerspectiveTurntable",
    "perspective-turntable.png",
    (4.8, -6.4, 3.4),
)
REVIEW_FILENAMES = tuple(item[1] for item in ORTHOGRAPHIC_CAMERAS) + (
    PERSPECTIVE_CAMERA[1],
    "contact-sheet.png",
    "turntable-contact-sheet.png",
    "reference-comparison.png",
    "reference-overlay.png",
    "metrics.json",
    "review.md",
) + tuple(f"turntable-{index:02d}.png" for index in range(8))


def parse_arguments() -> argparse.Namespace:
    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--blend-output")
    parser.add_argument(
        "--preview-dir",
        default=str(
            Path(__file__).resolve().parents[1]
            / "generated"
            / "previews"
            / ASSET_ID
            / f"prompt-{PROMPT}"
            / f"rev-{REVISION}"
        ),
    )
    parser.add_argument("--skip-previews", action="store_true")
    return parser.parse_args(arguments)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (
        bpy.data.meshes,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.curves,
    ):
        for block in list(collection):
            collection.remove(block)


def create_materials() -> dict[str, bpy.types.Material]:
    materials = {}
    for name, color in MATERIAL_SPECS:
        material = bpy.data.materials.new(name)
        material.diffuse_color = color
        material.metallic = 0.0
        material.roughness = 0.88
        materials[name] = material
    return materials


def add_icosphere(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def add_tapered_volume(
    name: str,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    start_radius: float,
    end_radius: float,
    material: bpy.types.Material,
    vertices: int = 8,
) -> bpy.types.Object:
    start_vector = Vector(start)
    end_vector = Vector(end)
    direction = end_vector - start_vector
    bpy.ops.mesh.primitive_cone_add(
        vertices=vertices,
        radius1=start_radius,
        radius2=end_radius,
        depth=direction.length,
        location=(start_vector + end_vector) * 0.5,
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0.0, 0.0, 1.0)).rotation_difference(direction)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def add_ear(name, side, material):
    """Create a closed, thick triangular pinna with a readable side silhouette."""
    center_x = 0.34 * side
    vertices = [
        (center_x, -0.055, 2.48), (0.88 * side, -0.035, 2.66),
        (0.60 * side, -0.04, 2.18), (center_x, 0.055, 2.48),
        (0.88 * side, 0.035, 2.66), (0.60 * side, 0.04, 2.18),
    ]
    faces = [(0, 2, 1), (3, 4, 5), (0, 1, 4, 3), (1, 2, 5, 4), (2, 0, 3, 5)]
    mesh = bpy.data.meshes.new(f"{name}Geometry")
    mesh.from_pydata(vertices, [], faces)
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def join_parts(name, parts):
    bpy.ops.object.select_all(action="DESELECT")
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    parts[0].name = name
    parts[0].data.name = f"{name}Geometry"
    return parts[0]


def build_primary_volumes(materials: dict[str, bpy.types.Material]) -> tuple:
    """Create closed primary forms in a relaxed, symmetric rigging pose."""
    root = bpy.data.objects.new("LemurFull3DRoot", None)
    bpy.context.collection.objects.link(root)
    root.empty_display_type = "PLAIN_AXES"
    root.empty_display_size = 0.18

    gray, charcoal = materials["PrimaryGray"], materials["PrimaryCharcoal"]
    light, eye = materials["PrimaryLight"], materials["PrimaryEye"]
    parts = []
    def sphere(name, location, scale, material=gray):
        obj = add_icosphere(name, location, scale, material)
        parts.append(obj)
        return obj
    def limb(name, start, end, r1, r2, material=gray, vertices=10):
        obj = add_tapered_volume(name, start, end, r1, r2, material, vertices)
        parts.append(obj)
        return obj

    sphere("Ribcage", (0.0, 0.06, 1.53), (0.43, 0.32, 0.64))
    sphere("Pelvis", (0.0, 0.10, 0.94), (0.46, 0.37, 0.42), charcoal)
    sphere("Belly", (0.0, -0.265, 1.34), (0.29, 0.095, 0.48), light)
    limb("Neck", (0.0, 0.03, 1.91), (0.0, 0.025, 2.09), 0.22, 0.25, charcoal)
    sphere("Skull", (0.0, 0.02, 2.36), (0.48, 0.40, 0.43), gray)
    sphere("FaceMaskLeft", (-0.17, -0.345, 2.37), (0.25, 0.075, 0.28), light)
    sphere("FaceMaskRight", (0.17, -0.345, 2.37), (0.25, 0.075, 0.28), light)
    sphere("EyePatchLeft", (-0.18, -0.407, 2.43), (0.145, 0.048, 0.13), charcoal)
    sphere("EyePatchRight", (0.18, -0.407, 2.43), (0.145, 0.048, 0.13), charcoal)
    sphere("EyeLeft", (-0.18, -0.452, 2.45), (0.061, 0.035, 0.061), eye)
    sphere("EyeRight", (0.18, -0.452, 2.45), (0.061, 0.035, 0.061), eye)
    sphere("Muzzle", (0.0, -0.49, 2.25), (0.27, 0.25, 0.20), light)
    sphere("Nose", (0.0, -0.705, 2.27), (0.13, 0.085, 0.105), charcoal)
    parts.extend([add_ear("EarLeft", -1, charcoal), add_ear("EarRight", 1, charcoal)])

    for side, suffix in ((-1, "Left"), (1, "Right")):
        limb(f"UpperArm{suffix}", (0.34 * side, 0.02, 1.78), (0.67 * side, -0.01, 1.43), 0.145, 0.12)
        limb(f"LowerArm{suffix}", (0.67 * side, -0.01, 1.43), (0.94 * side, -0.10, 1.10), 0.12, 0.085, light)
        sphere(f"Hand{suffix}", (1.01 * side, -0.13, 1.01), (0.14, 0.105, 0.18), charcoal)
        sphere(f"Haunch{suffix}", (0.27 * side, 0.11, 0.82), (0.29, 0.31, 0.39), charcoal)
        limb(f"UpperLeg{suffix}", (0.24 * side, 0.08, 0.78), (0.34 * side, 0.02, 0.43), 0.23, 0.18, charcoal)
        limb(f"LowerLeg{suffix}", (0.34 * side, 0.02, 0.43), (0.31 * side, -0.10, 0.18), 0.17, 0.115, light)
        sphere(f"Foot{suffix}", (0.32 * side, -0.28, 0.105), (0.205, 0.37, 0.105), charcoal)

    tail_points = [
        (0.0, 0.36, 0.87), (0.04, 0.65, 0.78), (0.18, 0.91, 0.80),
        (0.42, 1.12, 0.91), (0.69, 1.24, 1.08), (0.91, 1.23, 1.29),
        (1.05, 1.10, 1.52), (1.08, 0.91, 1.73), (0.99, 0.73, 1.91),
        (0.83, 0.61, 2.04),
    ]
    tail_parts = []
    for index, (start, end) in enumerate(zip(tail_points, tail_points[1:])):
        radius = 0.18 - index * 0.012
        tail_parts.append(add_tapered_volume(f"TailSegment{index + 1:02d}", start, end, radius, radius - 0.012, charcoal, 10))
    tail = join_parts("Tail", tail_parts)
    parts.append(tail)

    for part in parts:
        part.parent = root
        part["primary_volume"] = True
    root["modeling_pose"] = "relaxed A-pose with extended raised tail"
    return root, parts


def point_camera(camera: bpy.types.Object, target: tuple[float, float, float]) -> None:
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()


def create_camera(
    name: str,
    location: tuple[float, float, float],
    camera_type: str,
) -> bpy.types.Object:
    data = bpy.data.cameras.new(name)
    data.type = camera_type
    data.lens = 55.0
    if camera_type == "ORTHO":
        data.ortho_scale = ORTHO_SCALE
    camera = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(camera)
    camera.location = location
    point_camera(camera, CAMERA_TARGET)
    return camera


def create_preview_rig() -> tuple[list[bpy.types.Object], list[bpy.types.Object]]:
    cameras = [
        create_camera(name, location, "ORTHO")
        for name, _filename, location in ORTHOGRAPHIC_CAMERAS
    ]
    cameras.append(create_camera(PERSPECTIVE_CAMERA[0], PERSPECTIVE_CAMERA[2], "PERSP"))

    lights = []
    for name, light_type, energy, color, location, size in (
        ("NeutralKey", "AREA", 850.0, (1.0, 0.91, 0.82), (-3.2, -4.2, 6.0), 4.0),
        ("NeutralFill", "AREA", 520.0, (0.78, 0.88, 1.0), (3.8, -2.0, 3.8), 3.5),
        ("NeutralRim", "AREA", 700.0, (0.86, 0.91, 1.0), (0.0, 4.0, 4.8), 3.0),
    ):
        data = bpy.data.lights.new(name, light_type)
        data.energy = energy
        data.color = color
        data.shape = "DISK"
        data.size = size
        light = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(light)
        light.location = location
        point_camera(light, CAMERA_TARGET)
        lights.append(light)

    ground_material = bpy.data.materials.new("PreviewGround")
    ground_material.diffuse_color = (0.13, 0.14, 0.17, 1.0)
    ground_material.roughness = 1.0
    bpy.ops.mesh.primitive_plane_add(size=200.0, location=(0.0, 0.0, GROUND_PLANE_Z))
    ground = bpy.context.object
    ground.name = "PreviewGroundPlane"
    ground.data.materials.append(ground_material)
    return cameras, lights


def configure_render() -> None:
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x, scene.render.resolution_y = RENDER_SIZE
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 15
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGB"
    scene.world.color = (0.035, 0.04, 0.055)
    scene.display_settings.display_device = "sRGB"
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0


def png_chunks(data: bytes):
    offset = 8
    while offset < len(data):
        length = struct.unpack(">I", data[offset : offset + 4])[0]
        kind = data[offset + 4 : offset + 8]
        payload = data[offset + 8 : offset + 8 + length]
        yield kind, payload
        offset += 12 + length


def read_png(path: Path) -> tuple[int, int, bytearray]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Invalid PNG: {path}")
    chunks = list(png_chunks(data))
    ihdr = next(payload for kind, payload in chunks if kind == b"IHDR")
    width, height, depth, color_type, compression, filtering, interlace = struct.unpack(">IIBBBBB", ihdr)
    if (depth, color_type, compression, filtering, interlace) != (8, 2, 0, 0, 0):
        raise ValueError(f"Unsupported PNG encoding in {path}")
    raw = zlib.decompress(b"".join(payload for kind, payload in chunks if kind == b"IDAT"))
    stride = width * 3
    pixels = bytearray(height * stride)
    previous = bytearray(stride)
    source_offset = 0
    for row_index in range(height):
        filter_type = raw[source_offset]
        source_offset += 1
        row = bytearray(raw[source_offset : source_offset + stride])
        source_offset += stride
        for index in range(stride):
            left = row[index - 3] if index >= 3 else 0
            above = previous[index]
            upper_left = previous[index - 3] if index >= 3 else 0
            if filter_type == 1:
                row[index] = (row[index] + left) & 255
            elif filter_type == 2:
                row[index] = (row[index] + above) & 255
            elif filter_type == 3:
                row[index] = (row[index] + ((left + above) // 2)) & 255
            elif filter_type == 4:
                estimate = left + above - upper_left
                distances = (abs(estimate - left), abs(estimate - above), abs(estimate - upper_left))
                predictor = (left, above, upper_left)[distances.index(min(distances))]
                row[index] = (row[index] + predictor) & 255
            elif filter_type != 0:
                raise ValueError(f"Unsupported PNG filter {filter_type}")
        start = row_index * stride
        pixels[start : start + stride] = row
        previous = row
    return width, height, pixels


def png_chunk(kind: bytes, payload: bytes) -> bytes:
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", binascii.crc32(kind + payload) & 0xFFFFFFFF)


def write_png(path: Path, width: int, height: int, pixels: bytearray) -> None:
    stride = width * 3
    raw = b"".join(b"\x00" + pixels[row * stride : (row + 1) * stride] for row in range(height))
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    path.write_bytes(
        b"\x89PNG\r\n\x1a\n"
        + png_chunk(b"IHDR", header)
        + png_chunk(b"IDAT", zlib.compress(raw, 9))
        + png_chunk(b"IEND", b"")
    )


FONT = {
    "A": ("01110", "10001", "10001", "11111", "10001", "10001", "10001"),
    "B": ("11110", "10001", "10001", "11110", "10001", "10001", "11110"),
    "C": ("01111", "10000", "10000", "10000", "10000", "10000", "01111"),
    "D": ("11110", "10001", "10001", "10001", "10001", "10001", "11110"),
    "E": ("11111", "10000", "10000", "11110", "10000", "10000", "11111"),
    "F": ("11111", "10000", "10000", "11110", "10000", "10000", "10000"),
    "G": ("01111", "10000", "10000", "10111", "10001", "10001", "01111"),
    "H": ("10001", "10001", "10001", "11111", "10001", "10001", "10001"),
    "I": ("11111", "00100", "00100", "00100", "00100", "00100", "11111"),
    "K": ("10001", "10010", "10100", "11000", "10100", "10010", "10001"),
    "L": ("10000", "10000", "10000", "10000", "10000", "10000", "11111"),
    "M": ("10001", "11011", "10101", "10101", "10001", "10001", "10001"),
    "N": ("10001", "11001", "10101", "10101", "10101", "10011", "10001"),
    "O": ("01110", "10001", "10001", "10001", "10001", "10001", "01110"),
    "P": ("11110", "10001", "10001", "11110", "10000", "10000", "10000"),
    "Q": ("01110", "10001", "10001", "10001", "10101", "10010", "01101"),
    "R": ("11110", "10001", "10001", "11110", "10100", "10010", "10001"),
    "S": ("01111", "10000", "10000", "01110", "00001", "00001", "11110"),
    "T": ("11111", "00100", "00100", "00100", "00100", "00100", "00100"),
    "U": ("10001", "10001", "10001", "10001", "10001", "10001", "01110"),
    "V": ("10001", "10001", "10001", "10001", "10001", "01010", "00100"),
    "W": ("10001", "10001", "10101", "10101", "10101", "10101", "01010"),
    "X": ("10001", "10001", "01010", "00100", "01010", "10001", "10001"),
    "Y": ("10001", "10001", "01010", "00100", "00100", "00100", "00100"),
    "0": ("01110", "10001", "10011", "10101", "11001", "10001", "01110"),
    "1": ("00100", "01100", "00100", "00100", "00100", "00100", "01110"),
    "2": ("01110", "10001", "00001", "00010", "00100", "01000", "11111"),
    "3": ("11110", "00001", "00001", "01110", "00001", "00001", "11110"),
    "4": ("00010", "00110", "01010", "10010", "11111", "00010", "00010"),
    "5": ("11111", "10000", "10000", "11110", "00001", "00001", "11110"),
    "6": ("01110", "10000", "10000", "11110", "10001", "10001", "01110"),
    "7": ("11111", "00001", "00010", "00100", "01000", "01000", "01000"),
    "8": ("01110", "10001", "10001", "01110", "10001", "10001", "01110"),
    "9": ("01110", "10001", "10001", "01111", "00001", "00001", "01110"),
    "-": ("00000", "00000", "00000", "11111", "00000", "00000", "00000"),
    " ": ("00000",) * 7,
}


def draw_text(pixels: bytearray, width: int, x: int, y: int, label: str, scale: int = 2) -> None:
    color = (232, 234, 239)
    cursor = x
    for character in label.upper():
        glyph = FONT.get(character, FONT[" "])
        for row_index, row in enumerate(glyph):
            for column_index, enabled in enumerate(row):
                if enabled == "1":
                    for dy in range(scale):
                        for dx in range(scale):
                            offset = ((y + row_index * scale + dy) * width + cursor + column_index * scale + dx) * 3
                            pixels[offset : offset + 3] = bytes(color)
        cursor += 6 * scale


def build_sheet(preview_dir: Path, output_name: str, items, columns: int) -> None:
    """Compose labeled full-resolution renders without external image tools."""
    rows = (len(items) + columns - 1) // columns
    tile_width, tile_height = RENDER_SIZE
    margin, gutter, label_height = 18, 14, 28
    width = margin * 2 + columns * tile_width + (columns - 1) * gutter
    height = margin * 2 + rows * (label_height + tile_height) + (rows - 1) * gutter
    pixels = bytearray((22, 24, 31) * (width * height))
    for index, (label, filename) in enumerate(items):
        source_width, source_height, source = read_png(preview_dir / filename)
        if (source_width, source_height) != RENDER_SIZE:
            raise ValueError(f"Unexpected render size for {filename}")
        column, row = index % columns, index // columns
        x = margin + column * (tile_width + gutter)
        y = margin + row * (label_height + tile_height + gutter)
        draw_text(pixels, width, x, y + 5, label)
        destination_y = y + label_height
        for source_row in range(tile_height):
            source_start = source_row * tile_width * 3
            destination_start = ((destination_y + source_row) * width + x) * 3
            pixels[destination_start : destination_start + tile_width * 3] = source[source_start : source_start + tile_width * 3]
    draw_text(pixels, width, margin, height - margin - 14, "PROMPT 02 REV 01", scale=1)
    write_png(preview_dir / output_name, width, height, pixels)


def build_contact_sheet(preview_dir: Path) -> None:
    items = [
        ("Front", "front.png"),
        ("Left", "left.png"),
        ("Right", "right.png"),
        ("Back", "back.png"),
        ("Front Left 3Q", "front-left-three-quarter.png"),
        ("Front Right 3Q", "front-right-three-quarter.png"),
    ]
    build_sheet(preview_dir, "contact-sheet.png", items, 3)
    build_sheet(
        preview_dir,
        "turntable-contact-sheet.png",
        [(f"Turn {index * 45}", f"turntable-{index:02d}.png") for index in range(8)],
        4,
    )


def scaled_crop(source, source_width, crop, target_size=512):
    left, top, right, bottom = crop
    result = bytearray(target_size * target_size * 3)
    for y in range(target_size):
        source_y = min(bottom - 1, top + int(y * (bottom - top) / target_size))
        for x in range(target_size):
            source_x = min(right - 1, left + int(x * (right - left) / target_size))
            src = (source_y * source_width + source_x) * 3
            dst = (y * target_size + x) * 3
            result[dst : dst + 3] = source[src : src + 3]
    return result


def draw_line(pixels, width, first, second, color=(255, 115, 75), alpha=0.72, thickness=3):
    x0, y0 = first
    x1, y1 = second
    steps = max(abs(x1 - x0), abs(y1 - y0), 1)
    for step in range(steps + 1):
        x = round(x0 + (x1 - x0) * step / steps)
        y = round(y0 + (y1 - y0) * step / steps)
        for dy in range(-thickness, thickness + 1):
            for dx in range(-thickness, thickness + 1):
                px, py = x + dx, y + dy
                if 0 <= px < width and 0 <= py < len(pixels) // (width * 3):
                    offset = (py * width + px) * 3
                    for channel in range(3):
                        pixels[offset + channel] = round(pixels[offset + channel] * (1 - alpha) + color[channel] * alpha)


def build_reference_comparisons(preview_dir: Path) -> None:
    reference_path = Path(__file__).resolve().parents[2] / "images" / "yoge-lemur.png"
    ref_width, ref_height, ref = read_png(reference_path)
    front_width, front_height, front = read_png(preview_dir / "front.png")
    crop = (448, 369, 1103, 1024)
    cropped = scaled_crop(ref, ref_width, crop)
    gutter = 16
    comparison = bytearray((22, 24, 31) * ((512 * 2 + gutter) * 548))
    comparison_width = 512 * 2 + gutter
    draw_text(comparison, comparison_width, 8, 8, "REFERENCE CROP", 2)
    draw_text(comparison, comparison_width, 512 + gutter + 8, 8, "PROMPT 02 FRONT", 2)
    for row in range(512):
        y = row + 36
        comparison[(y * comparison_width) * 3 : (y * comparison_width + 512) * 3] = cropped[row * 512 * 3 : (row + 1) * 512 * 3]
        dst = (y * comparison_width + 512 + gutter) * 3
        comparison[dst : dst + 512 * 3] = front[row * 512 * 3 : (row + 1) * 512 * 3]
    write_png(preview_dir / "reference-comparison.png", comparison_width, 548, comparison)

    overlay = bytearray(front)
    # Approximate reference silhouette landmarks mapped from the documented crop.
    outline = [
        (171, 53), (125, 25), (107, 91), (137, 145), (150, 228), (108, 357),
        (32, 423), (124, 473), (235, 456), (250, 510), (397, 506), (476, 447),
        (402, 414), (363, 357), (377, 228), (367, 145), (407, 91), (389, 25),
        (343, 53), (307, 101), (257, 117), (207, 101),
    ]
    for first, second in zip(outline, outline[1:] + outline[:1]):
        draw_line(overlay, front_width, first, second)
    for y in (95, 171, 284, 422):
        draw_line(overlay, front_width, (247, y), (267, y), color=(91, 214, 255), alpha=0.85, thickness=2)
        draw_line(overlay, front_width, (257, y - 10), (257, y + 10), color=(91, 214, 255), alpha=0.85, thickness=2)
    write_png(preview_dir / "reference-overlay.png", front_width, front_height, overlay)


def render_previews(preview_dir: Path, cameras: list[bpy.types.Object]) -> None:
    preview_dir.mkdir(parents=True, exist_ok=True)
    scene = bpy.context.scene
    camera_by_name = {camera.name: camera for camera in cameras}
    for name, filename, _location in ORTHOGRAPHIC_CAMERAS + (PERSPECTIVE_CAMERA,):
        render_path = preview_dir / filename
        render_path.unlink(missing_ok=True)
        scene.camera = camera_by_name[name]
        scene.render.filepath = str(render_path)
        bpy.ops.render.render(write_still=True)
        width, height, pixels = read_png(render_path)
        write_png(render_path, width, height, pixels)
    perspective = camera_by_name[PERSPECTIVE_CAMERA[0]]
    radius, camera_height = 8.0, 3.35
    for index in range(8):
        angle = index * 3.141592653589793 / 4.0 - 0.6435011087932844
        perspective.location = (radius * __import__("math").sin(angle), -radius * __import__("math").cos(angle), camera_height)
        point_camera(perspective, CAMERA_TARGET)
        render_path = preview_dir / f"turntable-{index:02d}.png"
        scene.camera = perspective
        scene.render.filepath = str(render_path)
        bpy.ops.render.render(write_still=True)
        width, height, pixels = read_png(render_path)
        write_png(render_path, width, height, pixels)
    build_contact_sheet(preview_dir)
    build_reference_comparisons(preview_dir)


def component_count(mesh) -> int:
    adjacency = [set() for _vertex in mesh.vertices]
    for edge in mesh.edges:
        first, second = edge.vertices
        adjacency[first].add(second)
        adjacency[second].add(first)
    unseen = set(range(len(mesh.vertices)))
    count = 0
    while unseen:
        count += 1
        pending = [unseen.pop()]
        while pending:
            neighbors = adjacency[pending.pop()] & unseen
            unseen.difference_update(neighbors)
            pending.extend(neighbors)
    return count


def mesh_metrics(parts: list[bpy.types.Object]) -> dict:
    all_bounds = [part.matrix_world @ Vector(corner) for part in parts for corner in part.bound_box]
    minimum = [min(point[axis] for point in all_bounds) for axis in range(3)]
    maximum = [max(point[axis] for point in all_bounds) for axis in range(3)]
    closed_checks = {}
    vertices = faces = triangles = components = primitives = 0
    material_names = set()
    for part in parts:
        mesh = part.data
        vertices += len(mesh.vertices)
        faces += len(mesh.polygons)
        triangles += sum(len(polygon.vertices) - 2 for polygon in mesh.polygons)
        components += component_count(mesh)
        primitives += len({polygon.material_index for polygon in mesh.polygons})
        material_names.update(material.name for material in mesh.materials)
        edge_uses = {tuple(sorted(edge.vertices)): 0 for edge in mesh.edges}
        for polygon in mesh.polygons:
            for edge_key in polygon.edge_keys:
                edge_uses[tuple(sorted(edge_key))] += 1
        non_manifold = sum(uses != 2 for uses in edge_uses.values())
        closed_checks[part.name] = {
            "closed": non_manifold == 0,
            "non_manifold_or_boundary_edges": non_manifold,
            "connected_components": component_count(mesh),
        }
    return {
        "vertices": vertices, "base_faces": faces, "triangles": triangles,
        "connected_components": components, "mesh_objects": len(parts),
        "primitives": primitives, "materials": len(material_names),
        "bounds_m": {"min": minimum, "max": maximum},
        "dimensions_m": [maximum[index] - minimum[index] for index in range(3)],
        "all_primary_volumes_closed": all(item["closed"] for item in closed_checks.values()),
        "volume_checks": closed_checks,
    }


def export_asset(output_path: Path, root: bpy.types.Object, parts: list[bpy.types.Object]) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )


def file_sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def glb_statistics(path: Path) -> dict:
    data = path.read_bytes()
    if data[:4] != b"glTF":
        raise ValueError(f"Invalid GLB header: {path}")
    json_length, json_type = struct.unpack("<II", data[12:20])
    if json_type != 0x4E4F534A:
        raise ValueError(f"GLB JSON chunk is missing: {path}")
    document = json.loads(data[20 : 20 + json_length].decode("utf-8").rstrip(" \t\r\n\0"))
    primitives = [primitive for mesh in document.get("meshes", []) for primitive in mesh.get("primitives", [])]
    vertices = sum(document["accessors"][primitive["attributes"]["POSITION"]]["count"] for primitive in primitives)
    triangles = sum(document["accessors"][primitive["indices"]]["count"] // 3 for primitive in primitives)
    return {
        "vertices": vertices,
        "triangles": triangles,
        "primitives": len(primitives),
        "materials": len(document.get("materials", [])),
    }


def camera_metadata(camera: bpy.types.Object) -> dict:
    return {
        "name": camera.name,
        "type": camera.data.type,
        "location": list(camera.location),
        "rotation_euler_radians": list(camera.rotation_euler),
        "ortho_scale": camera.data.ortho_scale if camera.data.type == "ORTHO" else None,
        "lens_mm": camera.data.lens,
        "target": list(CAMERA_TARGET),
    }


def write_review_packet(
    preview_dir: Path,
    output_path: Path,
    diagnostic: bpy.types.Object,
    cameras: list[bpy.types.Object],
    lights: list[bpy.types.Object],
    deterministic_digest: str,
    production_digest: str | None,
) -> None:
    metrics = {
        "asset_id": ASSET_ID,
        "prompt": PROMPT,
        "revision": REVISION,
        "blender_version": bpy.app.version_string,
        "coordinate_convention": {
            "units": "meters",
            "up_axis": "+Z",
            "right_axis": "+X",
            "forward_axis": FORWARD_AXIS,
            "ground_plane_z_m": GROUND_PLANE_Z,
            "origin": "centered on the ground between the diagnostic feet",
            "intended_modeling_pose": "relaxed A-pose with extended tail; the Prompt 01 diagnostic uses open arms and no authored anatomy",
        },
        "documented_measurements": {
            "height_m": round(diagnostic.dimensions.z, 6),
            "arm_span_m": round(diagnostic.dimensions.x, 6),
            "diagnostic_depth_m": round(diagnostic.dimensions.y, 6),
            "intended_seated_footprint_m": {"width": 1.4, "depth": 1.25},
        },
        "mesh": mesh_metrics(diagnostic),
        "glb": {
            "bytes": output_path.stat().st_size,
            "sha256": deterministic_digest,
            "deterministic_internal_repeat": True,
        },
        "production_glb": {
            "path": "public/models/lemur.glb",
            "sha256_before_and_after_generator": production_digest,
            "unchanged": True,
        },
        "render": {
            "engine": "BLENDER_EEVEE_NEXT",
            "resolution": list(RENDER_SIZE),
            "resolution_percentage": 100,
            "format": "PNG RGB 8-bit",
            "canonical_png_encoding": True,
            "world_color": [0.035, 0.04, 0.055],
            "color_management": {
                "display_device": "sRGB",
                "view_transform": "Standard",
                "look": "Medium High Contrast",
                "exposure": 0.0,
                "gamma": 1.0,
            },
        },
        "cameras": [camera_metadata(camera) for camera in cameras],
        "lights": [
            {
                "name": light.name,
                "type": light.data.type,
                "location": list(light.location),
                "rotation_euler_radians": list(light.rotation_euler),
                "energy_w": light.data.energy,
                "color": list(light.data.color),
                "size_m": light.data.size,
            }
            for light in lights
        ],
        "materials": [name for name, _color in MATERIAL_SPECS],
        "required_staging_objects": ["LemurFull3DRoot", "LemurFull3DDiagnostic"],
        "review_files": list(REVIEW_FILENAMES),
        "review_filenames_reproducible": True,
        "known_limitations": [
            "The mesh is a pipeline diagnostic, not approved anatomy or final proportions.",
            "Disconnected closed volumes are joined into one staging mesh only to expose depth, bounds, materials, and camera coverage.",
            "The perspective camera is locked at the canonical turntable start angle; animation is deferred.",
        ],
    }
    (preview_dir / "metrics.json").write_text(
        json.dumps(metrics, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    review = f"""# Full-3D lemur — Prompt 01, revision 01

## Visual entry point

![Labeled canonical camera contact sheet](contact-sheet.png)

Full-resolution renders: [front](front.png), [left](left.png), [right](right.png), [back](back.png), [front-left three-quarter](front-left-three-quarter.png), [front-right three-quarter](front-right-three-quarter.png), and [locked perspective turntable start](perspective-turntable.png).

## Scope and decisions

- This is an isolated, intentionally minimal full-volume pipeline diagnostic. It does not replace or modify the production lemur and it is not an anatomy proposal.
- Blender uses meters, `+Z` up, `+X` right, `-Y` forward, and a ground plane at `Z = 0`.
- The intended future modeling pose is a relaxed A-pose with an extended tail. The diagnostic opens the arms so arm span, volume, symmetry, and identical orthographic framing are easy to judge.
- All six orthographic cameras use scale `{ORTHO_SCALE}` and `{RENDER_SIZE[0]} × {RENDER_SIZE[1]}` output. The separate 55 mm perspective camera is locked at the turntable start angle.
- Neutral key, fill, and rim lights use fixed transforms and energies. Exact camera, lighting, render, Blender, color-management, bounds, and count data are in [metrics.json](metrics.json).

## Measurements and checks

- Height: `{metrics['documented_measurements']['height_m']}` m; arm span: `{metrics['documented_measurements']['arm_span_m']}` m; diagnostic depth: `{metrics['documented_measurements']['diagnostic_depth_m']}` m.
- Intended seated footprint for later proportion work: `1.4 m × 1.25 m`.
- GLB: `{metrics['glb']['bytes']}` bytes, `{metrics['mesh']['vertices']}` vertices, `{metrics['mesh']['triangles']}` triangles, `{metrics['mesh']['primitives']}` primitives, `{metrics['mesh']['materials']}` materials.
- The generator exports twice internally and confirmed byte-identical GLBs: `{deterministic_digest}`.
- The production `public/models/lemur.glb` SHA-256 remained `{production_digest}` before and after generation. The scoped build command also guards every unselected manifest output.
- Required object names, material names, finite position bounds, PNG signatures, and deterministic repeat export are validated by the manifest workflow.
- Review filenames and JSON key order are fixed in source; every accepted attempt uses a new prompt/revision directory.

## Rebuild

Run `npm run assets:build:lemur-full-3d` from the repository root. The expanded command is `npm run assets:build -- --asset lemur-full-3d`. No manual Blender action is required. Validate the existing output alone with `npm run assets:validate -- lemur-full-3d`.

## How to verify

1. Run `npm run assets:validate -- lemur-full-3d`.
2. Inspect this contact sheet and every linked full-resolution render. Confirm consistent framing and neutral lighting.
3. Run `npm run dev`, open `http://localhost:5173/?review=lemur-full-3d`, reset to all six canonical directions, and orbit one full revolution.
4. Confirm real depth and the unambiguous `-Y` forward cue. Do not judge anatomy, topology, markings, rigging, or animation in Prompt 01.
5. Approve or reject **Prompt 01 revision 01** explicitly, naming any failed direction or review condition.

## Changes from previous approved revision

None. This is the first review packet and establishes the staging pipeline, framing, cameras, neutral lighting, measurements, and coordinate contract.

## Known limitations

- The diagnostic deliberately has no finished anatomy, topology, markings, rig, or animation.
- Its closed component volumes are joined into one mesh object but are not yet unified deformation topology.
- The perspective camera records the locked turntable start view only; turntable animation belongs to later visual review work.

## Review gate

Approve or reject only the isolated pipeline, framing, locked cameras, neutral lighting, coordinate convention, and whether the diagnostic reads as genuinely volumetric from every supplied view. Automated checks do not approve this gate.
"""
    (preview_dir / "review.md").write_text(review, encoding="utf-8", newline="\n")


def write_prompt_02_review_packet(
    preview_dir: Path,
    output_path: Path,
    parts: list[bpy.types.Object],
    cameras: list[bpy.types.Object],
    lights: list[bpy.types.Object],
    deterministic_digest: str,
    production_digest: str | None,
) -> None:
    mesh = mesh_metrics(parts)
    exported = glb_statistics(output_path)
    dimensions = mesh["dimensions_m"]
    reference_path = Path(__file__).resolve().parents[2] / "images" / "yoge-lemur.png"
    metrics = {
        "asset_id": ASSET_ID,
        "prompt": PROMPT,
        "revision": REVISION,
        "blender_version": bpy.app.version_string,
        "coordinate_convention": {
            "units": "meters", "up_axis": "+Z", "right_axis": "+X",
            "forward_axis": FORWARD_AXIS, "ground_plane_z_m": GROUND_PLANE_Z,
            "origin": "centered on the ground between the feet",
            "intended_modeling_pose": "relaxed A-pose with separated limbs and an extended raised tail",
        },
        "documented_measurements": {
            "height_m": round(dimensions[2], 6),
            "arm_span_m": 2.30,
            "overall_width_with_tail_m": round(dimensions[0], 6),
            "overall_depth_m": round(dimensions[1], 6),
            "skull_width_m": 0.96,
            "muzzle_projection_from_skull_center_m": 0.725,
            "tail_centerline_length_m": 2.677083,
            "intended_seated_footprint_m": {"width": 1.4, "depth": 1.25},
        },
        "mesh": mesh,
        "glb": {
            "bytes": output_path.stat().st_size,
            "sha256": deterministic_digest,
            "deterministic_internal_repeat": True,
            **exported,
        },
        "production_glb": {
            "path": "public/models/lemur.glb",
            "sha256_before_and_after_generator": production_digest,
            "unchanged": True,
        },
        "render": {
            "engine": "BLENDER_EEVEE_NEXT", "resolution": list(RENDER_SIZE),
            "resolution_percentage": 100, "format": "PNG RGB 8-bit",
            "canonical_png_encoding": True, "world_color": [0.035, 0.04, 0.055],
            "color_management": {
                "display_device": "sRGB", "view_transform": "Standard",
                "look": "Medium High Contrast", "exposure": 0.0, "gamma": 1.0,
            },
        },
        "cameras": [camera_metadata(camera) for camera in cameras],
        "lights": [{
            "name": light.name, "type": light.data.type,
            "location": list(light.location),
            "rotation_euler_radians": list(light.rotation_euler),
            "energy_w": light.data.energy, "color": list(light.data.color),
            "size_m": light.data.size,
        } for light in lights],
        "materials": [name for name, _color in MATERIAL_SPECS],
        "required_staging_objects": ["LemurFull3DRoot"] + [part.name for part in parts],
        "primary_volume_inventory": [
            "skull and facial projection", "neck", "ribcage", "belly", "pelvis",
            "paired upper/lower arms", "paired hands", "paired haunches",
            "paired upper/lower legs", "paired feet", "paired ears", "full tapered tail",
        ],
        "symmetry": {
            "intended_pairs": ["ears", "face masks", "eye patches", "eyes", "arms", "hands", "haunches", "legs", "feet"],
            "construction": "paired forms use identical dimensions and X-mirrored coordinates",
            "maximum_authored_pair_deviation_m": 0.0,
            "intentional_asymmetry": "the tail curves behind and toward character right to expose attachment and full length",
        },
        "rig_plan": {
            "planned_bones": 54, "planned_deform_bones": 46,
            "planned_maximum_weighted_influences": 4,
            "neutral_pose_clearance": "shoulders, elbows, wrists, hips, knees, ankles, and tail base remain separated for weighting",
        },
        "reference_comparison": {
            "source": "images/yoge-lemur.png", "source_sha256": file_sha256(reference_path),
            "crop_pixels_left_top_right_bottom": [448, 369, 1103, 1024],
            "role": "front-view identity guide, not orthographic ground truth",
            "landmarks": ["ear tips", "eye line", "muzzle", "shoulders", "pelvis/tail region"],
        },
        "review_files": list(REVIEW_FILENAMES),
        "review_filenames_reproducible": True,
        "known_limitations": [
            "Primary forms are separate closed components; unified deformation topology belongs to Prompt 03.",
            "Face colors identify primary geometric volumes and are not final markings.",
            "Hands are mitten-like primary volumes; fingers and gesture refinement belong to Prompt 04.",
            "The reference is seated and perspective-projected, while this stage uses a relaxed A-pose for rigging.",
        ],
    }
    (preview_dir / "metrics.json").write_text(
        json.dumps(metrics, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )
    review = f"""# Full-3D lemur — Prompt 02, revision 01

## Visual entry point

![Labeled primary-volume contact sheet](contact-sheet.png)

Start with the [reference crop beside the front render](reference-comparison.png), then inspect the [transparent silhouette and landmark overlay](reference-overlay.png). Review the [front](front.png), [left](left.png), [right](right.png), [back](back.png), [front-left three-quarter](front-left-three-quarter.png), [front-right three-quarter](front-right-three-quarter.png), and [eight-angle turntable sheet](turntable-contact-sheet.png).

## Scope and design decisions

- The diagnostic was replaced by complete primary volumes: skull, projecting muzzle, neck, ribcage, belly, pelvis, arms, hands, haunches, legs, feet, ears, eyes, and a fully modeled tapered tail.
- The relaxed A-pose keeps joint clearance for shoulder, hip, wrist, ankle, and tail deformation. Separate closed components are intentional until Prompt 03 builds unified topology.
- The reference controls the compact head, large triangular ears, long tapered torso, facial focus, and ring-tailed-lemur identity. It does not define hidden anatomy.
- Deliberate unseen-anatomy decisions include a deep cranium, projecting muzzle, compressed ribcage, broad haunch support, elliptical limbs, plantigrade feet, and a raised tail attached behind the pelvis.
- The tail is the only intentional asymmetry. It curves behind and toward character right so attachment, taper, and length remain judgeable.
- Final facets, markings, fingers, deformation topology, rigging, and the seated pose are deferred to their named prompts.

## Measurements and checks

- Height: `{metrics['documented_measurements']['height_m']}` m; arm span: `{metrics['documented_measurements']['arm_span_m']}` m; overall width/depth: `{metrics['documented_measurements']['overall_width_with_tail_m']}` m / `{metrics['documented_measurements']['overall_depth_m']}` m.
- GLB: `{metrics['glb']['bytes']}` bytes, `{metrics['glb']['vertices']}` exported vertices, `{metrics['glb']['triangles']}` triangles, `{metrics['glb']['primitives']}` primitives, and `{metrics['glb']['materials']}` materials. The source meshes contain `{mesh['vertices']}` vertices, `{mesh['base_faces']}` base faces, and `{mesh['connected_components']}` intentional closed components.
- Every mesh edge has exactly two face users: `{mesh['all_primary_volumes_closed']}`. Per-volume results are recorded in `mesh.volume_checks` in [metrics.json](metrics.json).
- Intended paired forms use identical dimensions and mirrored X coordinates; maximum authored deviation is `0.0 m`. The curved tail is documented asymmetry.
- The planned rig has 54 bones, 46 deform bones, and at most 4 weighted influences per vertex. These are descriptive design targets, not web budgets.
- The generator exported twice internally and confirmed byte-identical GLBs: `{deterministic_digest}`.
- The production `public/models/lemur.glb` remained `{production_digest}` before and after generation.

## Reference comparison and deliberate departures

The cropped comparison preserves `images/yoge-lemur.png` unchanged. The orange outline in the overlay is a transparent landmark/silhouette guide from the seated perspective reference; blue crosses mark the face, shoulders, torso, and pelvis/tail axis. The rigging pose deliberately opens the arms, straightens the legs, lifts the torso, and raises/extends the tail. Side and back depth are authored rather than inferred as orthographic truth.

## Rebuild

Run `npm run assets:build:lemur-full-3d` from the repository root. The expanded command is `npm run assets:build -- --asset lemur-full-3d`. No manual Blender action is required. Validate the existing output with `npm run assets:validate -- lemur-full-3d`.

## How to verify

1. Run `npm run assets:validate -- lemur-full-3d`.
2. Open `reference-comparison.png` and `reference-overlay.png`, then inspect `contact-sheet.png`, `turntable-contact-sheet.png`, and the linked full-resolution renders.
3. Run `npm run dev` and open `http://localhost:5173/?review=lemur-full-3d`. Reset to all six canonical directions, then orbit the actual staging GLB once.
4. Inspect skull, muzzle, neck, ribcage, pelvis, each limb segment, hands, feet, haunches, tail attachment, and tail tip for real depth, coherent attachment, balance, and all-angle silhouette. Compare the front only for identity; the seated perspective reference is not hidden-anatomy ground truth.
5. Approve or reject **Prompt 02 revision 01** explicitly, naming any unacceptable volume or viewing direction.

## Changes from previous approved revision

Prompt 01's diagnostic object is replaced by a complete proportioned ring-tailed lemur base. Locked cameras, neutral studio, coordinate convention, staging output, and production-asset isolation are preserved.

## Known limitations

- Primary forms are closed but intentionally disconnected. Prompt 03 owns unified deformation topology and joint loops.
- The reference and model use different poses by design; arms, legs, and tail should not coincide in the overlay.
- Hands are primary mitten volumes. Finger silhouettes and meditation gesture capability belong to Prompt 04.
- Materials distinguish volumes for review but are not final markings or facets.

## Review gate

Approve or reject the primary proportions, front identity, designed side/back anatomy, all-angle balance, joint clearance, and complete tail. Automated checks do not approve this gate; explicit visual approval is required before Prompt 03.
"""
    (preview_dir / "review.md").write_text(review, encoding="utf-8", newline="\n")


def save_source(blend_path: Path) -> None:
    blend_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))


def main() -> None:
    args = parse_arguments()
    output_path = Path(args.output).resolve()
    preview_dir = Path(args.preview_dir).resolve()
    production_path = Path(__file__).resolve().parents[2] / "public" / "models" / "lemur.glb"
    production_before = file_sha256(production_path) if production_path.exists() else None

    clear_scene()
    materials = create_materials()
    root, parts = build_primary_volumes(materials)
    cameras, lights = create_preview_rig()
    configure_render()
    bpy.context.view_layer.update()

    export_asset(output_path, root, parts)
    first_digest = file_sha256(output_path)
    temporary_path = output_path.with_name("lemur-full-3d.internal-repeat.glb")
    export_asset(temporary_path, root, parts)
    repeat_digest = file_sha256(temporary_path)
    temporary_path.unlink(missing_ok=True)
    if first_digest != repeat_digest:
        raise RuntimeError("Internal repeat export was not deterministic")

    production_after = file_sha256(production_path) if production_path.exists() else None
    if production_before != production_after:
        raise RuntimeError("Production lemur GLB changed during staging generation")

    if not args.skip_previews:
        render_previews(preview_dir, cameras)
        write_prompt_02_review_packet(
            preview_dir,
            output_path,
            parts,
            cameras,
            lights,
            first_digest,
            production_after,
        )
    if args.blend_output:
        save_source(Path(args.blend_output).resolve())


if __name__ == "__main__":
    main()
