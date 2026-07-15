"""Build the deterministic Blender pipeline smoke-test asset."""

import argparse
import os
import sys

import bpy


OBJECT_NAME = "PipelineTestMesh"
MATERIAL_NAME = "PipelineTestMaterial"


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


def build_test_mesh() -> bpy.types.Object:
    material = bpy.data.materials.new(MATERIAL_NAME)
    material.diffuse_color = (0.941, 0.545, 0.451, 1.0)
    material.roughness = 0.78
    material.metallic = 0.0

    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=(0, 0, 0))
    test_object = bpy.context.object
    test_object.name = OBJECT_NAME
    test_object.data.name = f"{OBJECT_NAME}Geometry"
    test_object.data.materials.append(material)

    for polygon in test_object.data.polygons:
        polygon.use_smooth = False

    return test_object


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
    build_test_mesh()
    export_asset(args.output)
    if args.blend_output:
        save_source(args.blend_output)


if __name__ == "__main__":
    main()
