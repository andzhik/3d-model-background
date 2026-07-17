"""Generate deterministic shore, rock-source, and meditation-platform meshes."""

import argparse
import math
import os
import random
import sys

import bpy


SEED = 0x1E4D2026

MATERIAL_SPECS = (
    ("ShoreDark", (0.13, 0.18, 0.24, 1.0)),
    ("ShoreMoss", (0.21, 0.29, 0.28, 1.0)),
    ("RockSlate", (0.25, 0.29, 0.38, 1.0)),
    ("RockViolet", (0.34, 0.31, 0.43, 1.0)),
    ("RockWarmFace", (0.49, 0.39, 0.40, 1.0)),
)


def parse_arguments() -> argparse.Namespace:
    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--blend-output")
    return parser.parse_args(arguments)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        for block in list(collection):
            collection.remove(block)


def create_materials() -> list[bpy.types.Material]:
    materials = []
    for name, color in MATERIAL_SPECS:
        material = bpy.data.materials.new(name)
        material.diffuse_color = color
        material.roughness = 0.94
        material.metallic = 0.0
        materials.append(material)
    return materials


def finish_mesh(obj: bpy.types.Object, materials: list[bpy.types.Material]) -> None:
    for material in materials:
        obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    if obj.data.validate(clean_customdata=False):
        raise ValueError(f"{obj.name} required mesh validation repairs")
    if not all(math.isfinite(value) for vertex in obj.data.vertices for value in vertex.co):
        raise ValueError(f"{obj.name} contains a non-finite vertex")


def create_shore(
    name: str,
    points: tuple[tuple[float, float], ...],
    materials: list[bpy.types.Material],
) -> None:
    top_y = -1.47
    bottom_y = -2.05
    vertices = [(x, top_y, z) for x, z in points] + [(x, bottom_y, z) for x, z in points]
    count = len(points)
    faces = []
    for index in range(1, count - 1):
        faces.append((0, index + 1, index))
        faces.append((count, count + index, count + index + 1))
    for index in range(count):
        next_index = (index + 1) % count
        faces.extend(((index, next_index, count + next_index), (index, count + next_index, count + index)))

    mesh = bpy.data.meshes.new(f"{name}Geometry")
    mesh.from_pydata(vertices, [], faces)
    mesh.update(calc_edges=True)
    shore = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(shore)
    finish_mesh(shore, materials[:2])
    for polygon in mesh.polygons:
        polygon.material_index = polygon.index % 2


def create_rock_source(
    name: str,
    scale: tuple[float, float, float],
    seed_offset: int,
    materials: list[bpy.types.Material],
) -> None:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1.0, location=(0, 0, 0))
    rock = bpy.context.object
    rock.name = name
    rock.data.name = f"{name}Geometry"
    rng = random.Random(SEED + seed_offset)
    for vertex in rock.data.vertices:
        direction_bias = 1.0 + rng.uniform(-0.16, 0.18)
        vertex.co.x *= scale[0] * direction_bias
        vertex.co.y *= scale[1] * direction_bias
        vertex.co.z *= scale[2] * direction_bias
    finish_mesh(rock, materials[2:5])
    for polygon in rock.data.polygons:
        polygon.material_index = rng.randrange(0, 3)


def export_asset(output_path: str) -> None:
    absolute_output = os.path.abspath(output_path)
    os.makedirs(os.path.dirname(absolute_output), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=absolute_output,
        export_format="GLB",
        export_apply=True,
        export_materials="EXPORT",
    )


def save_source(blend_path: str) -> None:
    absolute_blend = os.path.abspath(blend_path)
    os.makedirs(os.path.dirname(absolute_blend), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=absolute_blend)


def main() -> None:
    args = parse_arguments()
    clear_scene()
    materials = create_materials()
    create_shore(
        "ShoreLeft",
        ((-16.0, -9.0), (-3.0, -9.0), (-2.4, -2.1), (-4.0, 1.1), (-16.0, 2.0)),
        materials,
    )
    create_shore(
        "ShoreRight",
        ((2.4, -2.1), (3.0, -9.0), (16.0, -9.0), (16.0, 2.0), (4.0, 1.1)),
        materials,
    )
    create_rock_source("RockSourceSmallA", (0.72, 0.58, 0.62), 101, materials)
    create_rock_source("RockSourceSmallB", (0.58, 0.48, 0.82), 211, materials)
    create_rock_source("RockSourceSmallC", (0.86, 0.55, 0.52), 307, materials)
    create_rock_source("RockSourceFrameLeft", (1.45, 0.92, 1.18), 401, materials)
    create_rock_source("RockSourceFrameRight", (1.32, 0.86, 1.35), 503, materials)
    export_asset(args.output)
    if args.blend_output:
        save_source(args.blend_output)


if __name__ == "__main__":
    main()
