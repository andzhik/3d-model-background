"""Generate the deterministic faceted seated lemur blockout and previews."""

import argparse
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector


MATERIAL_SPECS = (
    ("LemurCharcoal", (0.055, 0.065, 0.085, 1.0)),
    ("LemurGray", (0.27, 0.29, 0.34, 1.0)),
    ("LemurLight", (0.68, 0.68, 0.65, 1.0)),
    ("LemurEye", (0.72, 0.36, 0.08, 1.0)),
)


def parse_arguments() -> argparse.Namespace:
    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--blend-output")
    parser.add_argument(
        "--preview-dir",
        default=str(Path(__file__).resolve().parents[1] / "generated" / "previews"),
    )
    return parser.parse_args(arguments)


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (
        bpy.data.meshes,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for block in list(collection):
            collection.remove(block)


def create_materials() -> dict[str, bpy.types.Material]:
    materials = {}
    for name, color in MATERIAL_SPECS:
        material = bpy.data.materials.new(name)
        material.diffuse_color = color
        material.roughness = 0.92
        material.metallic = 0.0
        materials[name] = material
    return materials


def create_node(
    name: str,
    parent: bpy.types.Object | None,
    location: tuple[float, float, float],
) -> bpy.types.Object:
    node = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(node)
    node.empty_display_type = "PLAIN_AXES"
    node.empty_display_size = 0.12
    node.location = location
    if parent:
        node.parent = parent
    return node


def parent_preserving_transform(child: bpy.types.Object, parent: bpy.types.Object) -> None:
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def finish_mesh(
    obj: bpy.types.Object,
    material: bpy.types.Material,
    parent: bpy.types.Object,
) -> bpy.types.Object:
    obj.name = f"{parent.name}Mesh"
    obj.data.name = f"{parent.name}Geometry"
    obj.data.materials.append(material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = False
    parent_preserving_transform(obj, parent)
    return obj


def create_icosphere(
    node: bpy.types.Object,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    subdivisions: int = 1,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=subdivisions, radius=1.0, location=location
    )
    obj = bpy.context.object
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish_mesh(obj, material, node)


def create_tapered_limb(
    node: bpy.types.Object,
    start: tuple[float, float, float],
    end: tuple[float, float, float],
    start_radius: float,
    end_radius: float,
    material: bpy.types.Material,
) -> bpy.types.Object:
    start_vector = Vector(start)
    end_vector = Vector(end)
    direction = end_vector - start_vector
    midpoint = (start_vector + end_vector) * 0.5
    bpy.ops.mesh.primitive_cone_add(
        vertices=7,
        radius1=start_radius,
        radius2=end_radius,
        depth=direction.length,
        location=midpoint,
    )
    obj = bpy.context.object
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = Vector((0.0, 0.0, 1.0)).rotation_difference(direction)
    return finish_mesh(obj, material, node)


def create_wedge(
    node: bpy.types.Object,
    center: tuple[float, float, float],
    width: float,
    depth: float,
    height: float,
    material: bpy.types.Material,
    mirror: float,
) -> bpy.types.Object:
    vertices = (
        (0.0, 0.0, height * 0.55),
        (mirror * width, 0.0, -height * 0.45),
        (0.0, 0.0, -height * 0.28),
        (0.0, depth, height * 0.42),
        (mirror * width * 0.78, depth, -height * 0.38),
        (0.0, depth, -height * 0.2),
    )
    faces = (
        (0, 2, 1),
        (3, 4, 5),
        (0, 1, 4, 3),
        (1, 2, 5, 4),
        (2, 0, 3, 5),
    )
    mesh = bpy.data.meshes.new(f"{node.name}Geometry")
    mesh.from_pydata(vertices, [], faces)
    mesh.update(calc_edges=True)
    obj = bpy.data.objects.new(f"{node.name}Mesh", mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = center
    return finish_mesh(obj, material, node)


def build_body(materials: dict[str, bpy.types.Material]) -> bpy.types.Object:
    charcoal = materials["LemurCharcoal"]
    gray = materials["LemurGray"]
    light = materials["LemurLight"]
    eye = materials["LemurEye"]

    root = create_node("Root", None, (0.0, 0.0, 0.0))
    pelvis = create_node("Pelvis", root, (0.0, 0.0, 0.72))
    torso = create_node("Torso", pelvis, (0.0, 0.0, 0.34))
    chest = create_node("Chest", torso, (0.0, 0.0, 0.46))
    neck = create_node("Neck", chest, (0.0, 0.0, 0.38))
    head = create_node("Head", neck, (0.0, 0.0, 0.3))

    create_icosphere(pelvis, (0.0, 0.0, 0.83), (0.58, 0.4, 0.48), gray)
    create_icosphere(torso, (0.0, 0.0, 1.18), (0.5, 0.34, 0.64), gray)
    create_icosphere(chest, (0.0, -0.035, 1.52), (0.56, 0.36, 0.5), light)
    create_tapered_limb(neck, (0.0, 0.0, 1.7), (0.0, 0.0, 1.92), 0.25, 0.2, gray)
    create_icosphere(head, (0.0, -0.015, 2.18), (0.58, 0.43, 0.53), gray, 2)

    for side, suffix in ((-1.0, "Left"), (1.0, "Right")):
        ear = create_node(f"Ear{suffix}", head, (side * 0.49, 0.0, 0.08))
        create_wedge(ear, (side * 0.5, 0.08, 2.3), 0.32, 0.14, 0.52, light, side)
        create_icosphere(
            ear,
            (side * 0.57, -0.06, 2.34),
            (0.22, 0.1, 0.28),
            light,
        )

    muzzle = create_node("Muzzle", head, (0.0, -0.37, -0.08))
    create_icosphere(muzzle, (0.0, -0.39, 2.1), (0.3, 0.29, 0.22), light)
    create_icosphere(muzzle, (0.0, -0.61, 2.12), (0.13, 0.09, 0.1), charcoal)

    eyes = create_node("Eyes", head, (0.0, -0.4, 0.11))
    for side in (-1.0, 1.0):
        create_icosphere(
            eyes,
            (side * 0.205, -0.405, 2.3),
            (0.09, 0.065, 0.105),
            eye,
        )

    for side, suffix in ((-1.0, "Left"), (1.0, "Right")):
        upper_arm = create_node(
            f"UpperArm{suffix}", chest, (side * 0.43, 0.0, -0.02)
        )
        lower_arm = create_node(
            f"LowerArm{suffix}", upper_arm, (side * 0.11, -0.08, -0.48)
        )
        hand = create_node(
            f"Hand{suffix}", lower_arm, (-side * 0.3, -0.15, -0.39)
        )
        create_tapered_limb(
            upper_arm,
            (side * 0.43, 0.0, 1.53),
            (side * 0.55, -0.08, 1.05),
            0.15,
            0.12,
            gray,
        )
        create_tapered_limb(
            lower_arm,
            (side * 0.55, -0.08, 1.05),
            (side * 0.25, -0.23, 0.66),
            0.12,
            0.085,
            charcoal,
        )
        create_icosphere(
            hand, (side * 0.16, -0.25, 0.64), (0.2, 0.11, 0.115), charcoal
        )

        upper_leg = create_node(
            f"UpperLeg{suffix}", pelvis, (side * 0.42, 0.0, -0.02)
        )
        lower_leg = create_node(
            f"LowerLeg{suffix}", upper_leg, (side * 0.31, -0.04, -0.34)
        )
        foot = create_node(
            f"Foot{suffix}", lower_leg, (-side * 0.65, -0.25, -0.26)
        )
        create_tapered_limb(
            upper_leg,
            (side * 0.42, 0.0, 0.78),
            (side * 0.78, -0.05, 0.44),
            0.25,
            0.2,
            gray,
        )
        create_tapered_limb(
            lower_leg,
            (side * 0.78, -0.05, 0.44),
            (side * 0.14, -0.28, 0.2),
            0.2,
            0.14,
            charcoal,
        )
        create_icosphere(
            foot, (-side * 0.2, -0.32, 0.18), (0.42, 0.17, 0.13), charcoal
        )

    tail_root = create_node("TailRoot", pelvis, (0.48, 0.22, -0.05))
    tail_points = (
        (0.48, 0.2, 0.76),
        (0.94, 0.27, 0.56),
        (1.22, 0.3, 0.82),
        (1.12, 0.32, 1.3),
        (0.88, 0.34, 1.68),
    )
    for index, (start, end) in enumerate(zip(tail_points, tail_points[1:])):
        tail_segment = create_node(f"TailBlockout{index + 1:02d}", tail_root, (0, 0, 0))
        create_tapered_limb(
            tail_segment,
            start,
            end,
            0.17 - index * 0.018,
            0.15 - index * 0.018,
            charcoal,
        )

    return root


def descendants(root: bpy.types.Object) -> list[bpy.types.Object]:
    result = [root]
    for child in root.children:
        result.extend(descendants(child))
    return result


def export_asset(root: bpy.types.Object, output_path: str) -> None:
    absolute_output = os.path.abspath(output_path)
    os.makedirs(os.path.dirname(absolute_output), exist_ok=True)
    bpy.ops.object.select_all(action="DESELECT")
    for obj in descendants(root):
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root
    bpy.ops.export_scene.gltf(
        filepath=absolute_output,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
    )


def add_preview_environment(materials: dict[str, bpy.types.Material]) -> None:
    bpy.context.scene.world.color = (0.035, 0.055, 0.09)
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=1.42, depth=0.16, location=(0, 0, 0.02))
    platform = bpy.context.object
    platform.name = "PreviewPlatform"
    platform.data.materials.append(materials["LemurGray"])
    bpy.ops.object.light_add(type="AREA", location=(-3.5, -4.5, 6.0))
    key = bpy.context.object
    key.name = "PreviewKey"
    key.data.energy = 850
    key.data.shape = "DISK"
    key.data.size = 4.0
    bpy.ops.object.light_add(type="AREA", location=(3.0, 1.0, 3.5))
    fill = bpy.context.object
    fill.name = "PreviewFill"
    fill.data.energy = 500
    fill.data.color = (0.35, 0.52, 0.8)
    fill.data.size = 3.0


def point_camera(camera: bpy.types.Object, target: tuple[float, float, float]) -> None:
    direction = Vector(target) - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def render_previews(preview_dir: str) -> None:
    absolute_dir = os.path.abspath(preview_dir)
    os.makedirs(absolute_dir, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 640
    scene.render.resolution_y = 640
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.look = "AgX - Medium High Contrast"

    bpy.ops.object.camera_add(location=(0.0, -7.0, 2.05))
    camera = bpy.context.object
    camera.name = "PreviewCamera"
    camera.data.lens = 58
    scene.camera = camera
    for filename, location in (
        ("lemur-front.png", (0.0, -7.0, 2.05)),
        ("lemur-three-quarter.png", (4.5, -5.7, 2.4)),
    ):
        camera.location = location
        point_camera(camera, (0.0, 0.0, 1.2))
        scene.render.filepath = os.path.join(absolute_dir, filename)
        bpy.ops.render.render(write_still=True)


def save_source(blend_path: str) -> None:
    absolute_blend = os.path.abspath(blend_path)
    os.makedirs(os.path.dirname(absolute_blend), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=absolute_blend)


def main() -> None:
    args = parse_arguments()
    clear_scene()
    materials = create_materials()
    root = build_body(materials)
    export_asset(root, args.output)
    add_preview_environment(materials)
    render_previews(args.preview_dir)
    if args.blend_output:
        save_source(args.blend_output)


if __name__ == "__main__":
    main()
