"""Build the isolated full-3D lemur staging diagnostic and Prompt 01 review."""

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
PROMPT = "01"
REVISION = "01"
FORWARD_AXIS = "-Y"
GROUND_PLANE_Z = 0.0
RENDER_SIZE = (512, 512)
ORTHO_SCALE = 3.6
CAMERA_TARGET = (0.0, 0.0, 1.36)
MATERIAL_SPECS = (
    ("DiagnosticFur", (0.31, 0.34, 0.40, 1.0)),
    ("DiagnosticForward", (0.83, 0.43, 0.22, 1.0)),
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
    "metrics.json",
    "review.md",
)


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
    return obj


def build_diagnostic(materials: dict[str, bpy.types.Material]) -> tuple:
    """Create a joined closed volume that exposes depth and the forward direction."""
    root = bpy.data.objects.new("LemurFull3DRoot", None)
    bpy.context.collection.objects.link(root)
    root.empty_display_type = "PLAIN_AXES"
    root.empty_display_size = 0.18

    parts = [
        add_icosphere(
            "DiagnosticTorso", (0.0, 0.0, 1.15), (0.48, 0.38, 1.15), materials["DiagnosticFur"]
        ),
        add_icosphere(
            "DiagnosticHead", (0.0, -0.02, 2.28), (0.46, 0.43, 0.46), materials["DiagnosticFur"]
        ),
        add_icosphere(
            "DiagnosticFootLeft", (-0.25, -0.01, 0.15), (0.28, 0.36, 0.15), materials["DiagnosticFur"]
        ),
        add_icosphere(
            "DiagnosticFootRight", (0.25, -0.01, 0.15), (0.28, 0.36, 0.15), materials["DiagnosticFur"]
        ),
        add_tapered_volume(
            "DiagnosticArmLeft", (-0.32, 0.0, 1.72), (-1.28, 0.0, 1.42), 0.15, 0.11, materials["DiagnosticFur"]
        ),
        add_tapered_volume(
            "DiagnosticArmRight", (0.32, 0.0, 1.72), (1.28, 0.0, 1.42), 0.15, 0.11, materials["DiagnosticFur"]
        ),
        add_tapered_volume(
            "DiagnosticForwardCue", (0.0, -0.31, 2.26), (0.0, -0.82, 2.18), 0.24, 0.08, materials["DiagnosticForward"], 6
        ),
    ]
    bpy.ops.object.select_all(action="DESELECT")
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    diagnostic = bpy.context.object
    diagnostic.name = "LemurFull3DDiagnostic"
    diagnostic.data.name = "LemurFull3DDiagnosticGeometry"
    for polygon in diagnostic.data.polygons:
        polygon.use_smooth = False
    diagnostic.parent = root
    return root, diagnostic


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
    "E": ("11111", "10000", "10000", "11110", "10000", "10000", "11111"),
    "F": ("11111", "10000", "10000", "11110", "10000", "10000", "10000"),
    "G": ("01111", "10000", "10000", "10111", "10001", "10001", "01111"),
    "H": ("10001", "10001", "10001", "11111", "10001", "10001", "10001"),
    "I": ("11111", "00100", "00100", "00100", "00100", "00100", "11111"),
    "K": ("10001", "10010", "10100", "11000", "10100", "10010", "10001"),
    "L": ("10000", "10000", "10000", "10000", "10000", "10000", "11111"),
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
    "Y": ("10001", "10001", "01010", "00100", "00100", "00100", "00100"),
    "0": ("01110", "10001", "10011", "10101", "11001", "10001", "01110"),
    "1": ("00100", "01100", "00100", "00100", "00100", "00100", "01110"),
    "3": ("11110", "00001", "00001", "01110", "00001", "00001", "11110"),
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


def build_contact_sheet(preview_dir: Path) -> None:
    items = [
        ("Front", "front.png"),
        ("Left", "left.png"),
        ("Right", "right.png"),
        ("Back", "back.png"),
        ("Front Left 3Q", "front-left-three-quarter.png"),
        ("Front Right 3Q", "front-right-three-quarter.png"),
        ("Perspective Turntable", PERSPECTIVE_CAMERA[1]),
    ]
    tile_width, tile_height = RENDER_SIZE
    columns, rows = 3, 3
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
    draw_text(pixels, width, margin, height - margin - 14, "PROMPT 01 REV 01", scale=1)
    write_png(preview_dir / "contact-sheet.png", width, height, pixels)


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
    build_contact_sheet(preview_dir)


def mesh_metrics(diagnostic: bpy.types.Object) -> dict:
    mesh = diagnostic.data
    evaluated_triangles = sum(len(polygon.vertices) - 2 for polygon in mesh.polygons)
    adjacency = [set() for _vertex in mesh.vertices]
    for edge in mesh.edges:
        first, second = edge.vertices
        adjacency[first].add(second)
        adjacency[second].add(first)
    unseen = set(range(len(mesh.vertices)))
    connected_components = 0
    while unseen:
        connected_components += 1
        pending = [unseen.pop()]
        while pending:
            vertex = pending.pop()
            neighbors = adjacency[vertex] & unseen
            unseen.difference_update(neighbors)
            pending.extend(neighbors)

    bounds = [diagnostic.matrix_world @ Vector(corner) for corner in diagnostic.bound_box]
    minimum = [min(point[axis] for point in bounds) for axis in range(3)]
    maximum = [max(point[axis] for point in bounds) for axis in range(3)]
    return {
        "vertices": len(mesh.vertices),
        "base_faces": len(mesh.polygons),
        "triangles": evaluated_triangles,
        "connected_components": connected_components,
        "primitives": len({polygon.material_index for polygon in mesh.polygons}),
        "materials": len(mesh.materials),
        "bounds_m": {"min": minimum, "max": maximum},
        "dimensions_m": [maximum[index] - minimum[index] for index in range(3)],
    }


def export_asset(output_path: Path, root: bpy.types.Object, diagnostic: bpy.types.Object) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    diagnostic.select_set(True)
    bpy.context.view_layer.objects.active = diagnostic
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
    root, diagnostic = build_diagnostic(materials)
    cameras, lights = create_preview_rig()
    configure_render()
    bpy.context.view_layer.update()

    export_asset(output_path, root, diagnostic)
    first_digest = file_sha256(output_path)
    temporary_path = output_path.with_name("lemur-full-3d.internal-repeat.glb")
    export_asset(temporary_path, root, diagnostic)
    repeat_digest = file_sha256(temporary_path)
    temporary_path.unlink(missing_ok=True)
    if first_digest != repeat_digest:
        raise RuntimeError("Internal repeat export was not deterministic")

    production_after = file_sha256(production_path) if production_path.exists() else None
    if production_before != production_after:
        raise RuntimeError("Production lemur GLB changed during staging generation")

    if not args.skip_previews:
        render_previews(preview_dir, cameras)
        write_review_packet(
            preview_dir,
            output_path,
            diagnostic,
            cameras,
            lights,
            first_digest,
            production_after,
        )
    if args.blend_output:
        save_source(Path(args.blend_output).resolve())


if __name__ == "__main__":
    main()
