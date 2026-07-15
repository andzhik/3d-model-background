"""Generate the deterministic layered mountain valley asset."""

import argparse
import math
import os
import random
import sys
from dataclasses import dataclass

import bpy


SEED = 0x1E4D2026


@dataclass(frozen=True)
class LayerSpec:
    name: str
    depth: float
    profile: tuple[tuple[float, float], ...]
    material_indices: tuple[int, ...]
    depth_variation: float


LAYER_SPECS = (
    LayerSpec(
        "MountainLayerFar",
        9.0,
        (
            (-18.0, 0.1),
            (-14.0, 1.2),
            (-10.0, 0.55),
            (-6.0, 1.05),
            (-2.2, -0.8),
            (0.0, -1.35),
            (2.2, -0.82),
            (6.5, 0.85),
            (11.0, 0.45),
            (15.0, 1.35),
            (18.0, 0.25),
        ),
        (0, 1, 0, 1, 3),
        0.22,
    ),
    LayerSpec(
        "MountainLayerLeft",
        6.2,
        (
            (-18.0, 2.0),
            (-14.0, 3.4),
            (-10.5, 5.4),
            (-8.1, 3.15),
            (-5.6, 2.1),
            (-3.35, 0.45),
            (-1.1, -1.45),
        ),
        (1, 2, 1, 3, 2, 1),
        0.42,
    ),
    LayerSpec(
        "MountainLayerRight",
        5.8,
        (
            (1.0, -1.45),
            (3.3, 0.35),
            (5.4, 2.25),
            (7.4, 4.35),
            (10.0, 5.15),
            (13.5, 3.8),
            (18.0, 2.35),
        ),
        (2, 1, 3, 2, 1, 2),
        0.46,
    ),
)

MATERIAL_SPECS = (
    ("MountainFarBlue", (0.27, 0.38, 0.62, 1.0)),
    ("MountainCoolBlue", (0.22, 0.29, 0.52, 1.0)),
    ("MountainViolet", (0.30, 0.25, 0.49, 1.0)),
    ("MountainPeachLight", (0.82, 0.47, 0.43, 1.0)),
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
        material.roughness = 0.92
        material.metallic = 0.0
        materials.append(material)
    return materials


def interpolate_profile(profile: tuple[tuple[float, float], ...], column: int) -> tuple[float, float]:
    segment = column // 2
    if column % 2 == 0:
        return profile[segment]
    left = profile[segment]
    right = profile[segment + 1]
    return ((left[0] + right[0]) * 0.5, (left[1] + right[1]) * 0.5)


def build_layer(spec: LayerSpec, materials: list[bpy.types.Material], seed_offset: int) -> bpy.types.Object:
    rng = random.Random(SEED + seed_offset)
    column_count = (len(spec.profile) - 1) * 2 + 1
    vertices: list[tuple[float, float, float]] = []

    for column in range(column_count):
        x, summit = interpolate_profile(spec.profile, column)
        valley_floor = -7.5
        for row, ratio in enumerate((0.0, 0.34, 0.68, 1.0)):
            height = valley_floor + (summit - valley_floor) * ratio
            edge_vertex = row in (0, 3)
            depth_jitter = 0.0 if edge_vertex else rng.uniform(-spec.depth_variation, spec.depth_variation)
            vertices.append((x, spec.depth + depth_jitter, height))

    faces: list[tuple[int, int, int]] = []
    material_indices: list[int] = []
    rows = 4
    for column in range(column_count - 1):
        for row in range(rows - 1):
            lower_left = column * rows + row
            upper_left = lower_left + 1
            lower_right = (column + 1) * rows + row
            upper_right = lower_right + 1
            if (column + row) % 2 == 0:
                faces.extend(((lower_left, lower_right, upper_right), (lower_left, upper_right, upper_left)))
            else:
                faces.extend(((lower_left, lower_right, upper_left), (lower_right, upper_right, upper_left)))

            base_index = spec.material_indices[column // 2 % len(spec.material_indices)]
            material_indices.extend((base_index, base_index if row == 0 else (base_index + row) % len(materials)))

    mesh = bpy.data.meshes.new(f"{spec.name}Geometry")
    mesh.from_pydata(vertices, [], faces)
    mesh.update(calc_edges=True)
    if mesh.validate(clean_customdata=False):
        raise ValueError(f"{spec.name} required mesh validation repairs")
    if not all(math.isfinite(value) for vertex in vertices for value in vertex):
        raise ValueError(f"{spec.name} contains a non-finite vertex")
    if len(mesh.polygons) != (column_count - 1) * (rows - 1) * 2:
        raise ValueError(f"{spec.name} has an incomplete triangle grid")
    if any(polygon.normal.y >= -1e-6 for polygon in mesh.polygons):
        raise ValueError(f"{spec.name} contains a reversed front face")

    mountain = bpy.data.objects.new(spec.name, mesh)
    bpy.context.collection.objects.link(mountain)
    for material in materials:
        mesh.materials.append(material)
    for polygon, material_index in zip(mesh.polygons, material_indices):
        polygon.use_smooth = False
        polygon.material_index = material_index
    return mountain


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
    for index, spec in enumerate(LAYER_SPECS):
        build_layer(spec, materials, index * 101)
    export_asset(args.output)
    if args.blend_output:
        save_source(args.blend_output)


if __name__ == "__main__":
    main()
