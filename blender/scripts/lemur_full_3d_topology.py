"""Deterministic, explicitly directed Prompt 03 lemur deformation topology.

The submitted mesh is authored directly from anatomical cross-section loops.
No remesh, subdivision, shrink-wrap, or proximity operation participates in
the deformation surface.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

import bpy
from mathutils import Vector


@dataclass
class TopologyResult:
    root: bpy.types.Object
    mesh_object: bpy.types.Object
    loops: dict[str, list[list[int]]] = field(default_factory=dict)
    paths: dict[str, list[list[int]]] = field(default_factory=dict)
    intentional_components: list[str] = field(default_factory=lambda: ["EyeShell.Left", "EyeShell.Right"])
    transition_patches: list[str] = field(default_factory=list)


class MeshBuilder:
    def __init__(self):
        self.vertices: list[tuple[float, float, float]] = []
        self.faces: list[tuple[int, ...]] = []
        self.face_regions: list[str] = []

    def vertex(self, point) -> int:
        self.vertices.append(tuple(float(value) for value in point))
        return len(self.vertices) - 1

    def face(self, indices, region="body") -> None:
        self.faces.append(tuple(indices))
        self.face_regions.append(region)

    def ring(self, center, tangent, radius_a, radius_b, count=8, phase=0.0, reference=None):
        tangent = Vector(tangent).normalized()
        reference = Vector(reference or (0.0, 0.0, 1.0))
        if abs(tangent.dot(reference)) > 0.88:
            reference = Vector((0.0, 1.0, 0.0))
        axis_a = tangent.cross(reference).normalized()
        axis_b = tangent.cross(axis_a).normalized()
        center = Vector(center)
        return [
            self.vertex(
                center
                + axis_a * (radius_a * math.cos(phase + math.tau * index / count))
                + axis_b * (radius_b * math.sin(phase + math.tau * index / count))
            )
            for index in range(count)
        ]

    def bridge(self, first, second, region="body") -> None:
        if len(first) != len(second):
            raise ValueError("Ring bridge requires equal loop sizes")
        for index in range(len(first)):
            nxt = (index + 1) % len(first)
            self.face((first[index], first[nxt], second[nxt], second[index]), region)

    def bridge_matched(self, first, second, region="transition") -> None:
        """Bridge equal cycles using the least-stretched deterministic correspondence."""
        candidates = []
        for ordered in (list(second), list(reversed(second))):
            for offset in range(len(ordered)):
                candidate = ordered[offset:] + ordered[:offset]
                cost = sum(
                    (Vector(self.vertices[a]) - Vector(self.vertices[b])).length_squared
                    for a, b in zip(first, candidate)
                )
                folded = 0
                for index in range(len(first)):
                    nxt = (index + 1) % len(first)
                    a, b = Vector(self.vertices[first[index]]), Vector(self.vertices[first[nxt]])
                    c, d = Vector(self.vertices[candidate[nxt]]), Vector(self.vertices[candidate[index]])
                    if (b - a).cross(c - a).dot((c - a).cross(d - a)) < 0:
                        folded += 1
                candidates.append((folded, round(cost, 12), tuple(candidate)))
        _folded, _cost, matched = min(candidates)
        self.bridge(first, matched, region)

    def cap(self, ring, center, reverse=False, region="cap") -> int:
        pole = self.vertex(center)
        for index in range(len(ring)):
            nxt = (index + 1) % len(ring)
            face = (pole, ring[nxt], ring[index]) if reverse else (pole, ring[index], ring[nxt])
            self.face(face, region)
        return pole

    def stabilize_transition_quads(self) -> int:
        """Split only transition quads for which neither diagonal is valid."""
        faces, regions, split_count = [], [], 0
        for face, region in zip(self.faces, self.face_regions):
            if len(face) != 4 or not region.startswith("transition."):
                faces.append(face); regions.append(region); continue
            a, b, c, d = (Vector(self.vertices[index]) for index in face)
            primary = (b - a).cross(c - a).dot((c - a).cross(d - a))
            alternate = (b - a).cross(d - a).dot((c - b).cross(d - b))
            if primary >= 0 or alternate >= 0:
                faces.append(face); regions.append(region); continue
            primary_quality = min((b - a).cross(c - a).length, (c - a).cross(d - a).length)
            alternate_quality = min((b - a).cross(d - a).length, (c - b).cross(d - b).length)
            pair = ((face[0], face[1], face[2]), (face[0], face[2], face[3])) if primary_quality >= alternate_quality else ((face[0], face[1], face[3]), (face[1], face[2], face[3]))
            faces.extend(pair); regions.extend((region, region)); split_count += 1
        self.faces, self.face_regions = faces, regions
        return split_count


def _grid_hole_boundary(rings, axial_start, circum_start):
    count = len(rings[0])
    j0, j1, j2 = circum_start % count, (circum_start + 1) % count, (circum_start + 2) % count
    i0, i1, i2 = axial_start, axial_start + 1, axial_start + 2
    return [
        rings[i0][j0], rings[i0][j1], rings[i0][j2], rings[i1][j2],
        rings[i2][j2], rings[i2][j1], rings[i2][j0], rings[i1][j0],
    ]


def _tube(builder, centers, radii, label, loop_names, cap_end=True):
    loops = []
    reference = (0.0, 0.0, 1.0) if label == "tail" else ((1.0, 0.0, 0.0) if label == "muzzle" else (0.0, 1.0, 0.0))
    for index, center in enumerate(centers):
        if index == 0:
            tangent = Vector(centers[1]) - Vector(center)
        elif index == len(centers) - 1:
            tangent = Vector(center) - Vector(centers[index - 1])
        else:
            tangent = Vector(centers[index + 1]) - Vector(centers[index - 1])
        radius = radii[index]
        radius_a, radius_b = radius if isinstance(radius, tuple) else (radius, radius)
        loops.append(builder.ring(center, tangent, radius_a, radius_b, 8, math.pi / 8, reference))
    for first, second in zip(loops, loops[1:]):
        builder.bridge(first, second, label)
    if cap_end:
        tangent = (Vector(centers[-1]) - Vector(centers[-2])).normalized()
        pole = builder.cap(loops[-1], Vector(centers[-1]) + tangent * 0.015, False, f"{label}.cap")
        loops.append([pole])
    named = {name: [loops[index] for index in indices] for name, indices in loop_names.items()}
    return loops, named


def _add_eye(builder, side):
    """Closed embedded eye shell with explicit socket and upper/lower lid cycles."""
    center = Vector((0.18 * side, -0.445, 2.43))
    tangent = Vector((0.0, -1.0, 0.0))
    radii = ((0.112, 0.092), (0.095, 0.076), (0.071, 0.058))
    depths = (0.0, 0.026, 0.052)
    loops = [builder.ring(center + tangent * depth, tangent, rx, rz, 8, math.pi / 8) for depth, (rx, rz) in zip(depths, radii)]
    builder.bridge(loops[0], loops[1], "eye_socket")
    builder.bridge(loops[1], loops[2], "eyelid")
    builder.cap(loops[0], center + Vector((0.0, 0.08, 0.0)), True, "eye.back")
    builder.cap(loops[2], center + Vector((0.0, -0.12, 0.0)), False, "eye.front")
    return loops


def build_topology(materials: dict[str, bpy.types.Material]) -> TopologyResult:
    builder = MeshBuilder()
    loops: dict[str, list[list[int]]] = {}
    paths: dict[str, list[list[int]]] = {}
    transitions: list[str] = []

    # One axial torso/head surface. Sixteen vertices preserve the silhouette
    # while keeping the future flat triangulation broad and readable.
    torso_specs = [
        (0.48, 0.31, 0.50, 0.09), (0.40, 0.35, 0.65, 0.10),
        (0.44, 0.37, 0.80, 0.10), (0.47, 0.37, 0.95, 0.09),
        (0.43, 0.34, 1.10, 0.08), (0.39, 0.31, 1.28, 0.07),
        (0.42, 0.32, 1.47, 0.06), (0.43, 0.31, 1.64, 0.05),
        (0.37, 0.28, 1.81, 0.04), (0.28, 0.24, 1.91, 0.033),
        (0.24, 0.225, 2.00, 0.028), (0.23, 0.22, 2.08, 0.025),
        (0.38, 0.34, 2.19, 0.02),
        (0.47, 0.39, 2.34, 0.02), (0.48, 0.39, 2.49, 0.025),
        (0.40, 0.33, 2.62, 0.03), (0.25, 0.22, 2.70, 0.035),
    ]
    torso_rings = []
    for rx, ry, z, center_y in torso_specs:
        torso_rings.append([
            builder.vertex((rx * math.cos(math.tau * j / 16), center_y + ry * math.sin(math.tau * j / 16), z))
            for j in range(16)
        ])

    holes = {
        "hip.Right": (1, 15), "hip.Left": (1, 7),
        "shoulder.Right": (6, 15), "shoulder.Left": (6, 7),
        "tail_base": (1, 3), "muzzle": (12, 11),
        "ear.Right": (13, 15), "ear.Left": (13, 7),
    }
    skipped = set()
    for _name, (start_i, start_j) in holes.items():
        for di in range(2):
            for dj in range(2):
                skipped.add((start_i + di, (start_j + dj) % 16))
    for i in range(len(torso_rings) - 1):
        for j in range(16):
            if (i, j) not in skipped:
                builder.face((torso_rings[i][j], torso_rings[i][(j + 1) % 16], torso_rings[i + 1][(j + 1) % 16], torso_rings[i + 1][j]), "torso")
    builder.cap(torso_rings[0], (0.0, 0.09, 0.47), True, "pelvis.cap")
    builder.cap(torso_rings[-1], (0.0, 0.035, 2.72), False, "skull.cap")
    loops["neck"] = torso_rings[8:13]
    paths["neck"] = torso_rings[8:]

    for side, suffix, hole_name in ((-1, "Left", "shoulder.Left"), (1, "Right", "shoulder.Right")):
        centers = [
            (0.50 * side, 0.03, 1.66), (0.57 * side, 0.01, 1.61),
            (0.64 * side, -0.01, 1.53), (0.70 * side, -0.04, 1.44),
            (0.76 * side, -0.065, 1.36), (0.84 * side, -0.09, 1.23),
            (0.93 * side, -0.115, 1.10), (1.01 * side, -0.14, 1.01),
            (1.07 * side, -0.16, 0.96), (1.10 * side, -0.18, 0.93),
        ]
        radii = [(0.16, 0.14), .15, .135, .125, .12, .105, .09, (.13, .095), (.11, .08), (.055, .045)]
        tube, named = _tube(builder, centers, radii, f"arm.{suffix}", {
            f"shoulder.{suffix}": [1, 2, 3], f"elbow.{suffix}": [2, 3, 4], f"wrist.{suffix}": [5, 6, 7],
        })
        builder.bridge_matched(_grid_hole_boundary(torso_rings, *holes[hole_name]), tube[0], f"transition.shoulder.{suffix}")
        loops.update(named); paths[f"arm.{suffix}"] = tube
        transitions.append(f"shoulder.{suffix}: 8-edge torso aperture to 8-vertex limb loop")

    for side, suffix, hole_name in ((-1, "Left", "hip.Left"), (1, "Right", "hip.Right")):
        centers = [
            (0.46 * side, 0.08, 0.84), (0.49 * side, 0.06, 0.73),
            (0.45 * side, 0.02, 0.60), (0.39 * side, -0.03, 0.47),
            (0.34 * side, -0.07, 0.36), (0.32 * side, -0.12, 0.25),
            (0.31 * side, -0.22, 0.15), (0.31 * side, -0.36, 0.115),
            (0.31 * side, -0.49, 0.105), (0.31 * side, -0.58, 0.10),
        ]
        radii = [(.22, .20), .215, .195, .17, .155, .13, .11, (.18, .10), (.15, .085), (.07, .05)]
        tube, named = _tube(builder, centers, radii, f"leg.{suffix}", {
            f"hip.{suffix}": [1, 2, 3], f"knee.{suffix}": [2, 3, 4], f"ankle.{suffix}": [5, 6, 7],
        })
        builder.bridge_matched(_grid_hole_boundary(torso_rings, *holes[hole_name]), tube[0], f"transition.hip.{suffix}")
        loops.update(named); paths[f"leg.{suffix}"] = tube
        transitions.append(f"hip.{suffix}: 8-edge pelvis aperture to 8-vertex limb loop")

    tail_centers = [
        (0.0, .52, .78), (.03, .65, .76), (.10, .78, .77), (.22, .92, .82),
        (.39, 1.06, .91), (.58, 1.15, 1.04), (.76, 1.17, 1.20),
        (.91, 1.10, 1.39), (1.00, .97, 1.59), (1.00, .82, 1.77),
        (.92, .69, 1.92), (.80, .61, 2.03),
    ]
    tail_radii = [.185, .18, .17, .16, .15, .14, .13, .12, .105, .09, .075, .045]
    tail, named = _tube(builder, tail_centers, tail_radii, "tail", {"tail_base": [1, 2, 3, 4]})
    builder.bridge_matched(_grid_hole_boundary(torso_rings, *holes["tail_base"]), tail[0], "transition.tail_base")
    loops.update(named); paths["tail"] = tail
    transitions.append("tail_base: 8-edge posterior pelvis aperture to 8-vertex tail loop")

    muzzle_centers = [(0.0, -.44, 2.35), (0.0, -.49, 2.32), (0.0, -.56, 2.28), (0.0, -.64, 2.27), (0.0, -.71, 2.27)]
    muzzle, named = _tube(builder, muzzle_centers, [(.25, .20), (.245, .19), (.20, .15), (.12, .10), (.055, .05)], "muzzle", {"muzzle": [1, 2, 3]})
    builder.bridge_matched(_grid_hole_boundary(torso_rings, *holes["muzzle"]), muzzle[0], "transition.muzzle")
    loops.update(named); paths["muzzle"] = muzzle
    transitions.append("muzzle: 8-edge facial aperture to 8-vertex projecting muzzle loop")

    for side, suffix, hole_name in ((-1, "Left", "ear.Left"), (1, "Right", "ear.Right")):
        ear_centers = [(0.40 * side, .03, 2.48), (0.55 * side, .035, 2.52), (0.70 * side, .04, 2.59), (0.82 * side, .045, 2.66)]
        ear, named = _tube(builder, ear_centers, [(.14, .12), (.17, .13), (.15, .10), (.055, .04)], f"ear.{suffix}", {f"ear.{suffix}": [0, 1, 2]})
        builder.bridge_matched(_grid_hole_boundary(torso_rings, *holes[hole_name]), ear[0], f"transition.ear.{suffix}")
        loops.update(named); paths[f"ear.{suffix}"] = ear
        transitions.append(f"ear.{suffix}: 8-edge cranial aperture to 8-vertex pinna loop")

    for side, suffix in ((-1, "Left"), (1, "Right")):
        eye_loops = _add_eye(builder, side)
        loops[f"eye_socket.{suffix}"] = [eye_loops[0], eye_loops[1]]
        loops[f"eyelid.{suffix}"] = [eye_loops[1], eye_loops[2]]

    stabilized_transition_quads = builder.stabilize_transition_quads()
    transitions.append(f"transition stabilization: {stabilized_transition_quads} unavoidable concave quads use deterministic diagonal pairs outside named maximum-bend cycles")

    # A 2x2 aperture leaves its former grid-center vertex intentionally unused.
    # Remove those eight loose construction points and remap every recorded loop.
    used_vertices = sorted({index for face in builder.faces for index in face})
    remap = {old: new for new, old in enumerate(used_vertices)}
    builder.vertices = [builder.vertices[index] for index in used_vertices]
    builder.faces = [tuple(remap[index] for index in face) for face in builder.faces]
    loops = {name: [[remap[index] for index in cycle if index in remap] for cycle in cycles] for name, cycles in loops.items()}
    paths = {name: [[remap[index] for index in cycle if index in remap] for cycle in cycles] for name, cycles in paths.items()}

    mesh = bpy.data.meshes.new("LemurDeformationTopologyGeometry")
    mesh.from_pydata(builder.vertices, [], builder.faces)
    mesh.materials.append(materials["PrimaryGray"])
    mesh.materials.append(materials["PrimaryLight"])
    mesh.materials.append(materials["PrimaryCharcoal"])
    mesh.materials.append(materials["PrimaryEye"])
    for polygon, region in zip(mesh.polygons, builder.face_regions):
        polygon.use_smooth = True
        polygon.material_index = 1 if region.startswith("muzzle") else (3 if region == "eye.front" else (2 if region.startswith("eye") else 0))
    obj = bpy.data.objects.new("LemurDeformationTopology", mesh)
    bpy.context.collection.objects.link(obj)
    root = bpy.data.objects.new("LemurFull3DRoot", None)
    bpy.context.collection.objects.link(root)
    obj.parent = root
    obj["topology_source"] = "explicit_anatomical_cross_section_loops"
    obj["submitted_remesh_operations"] = 0
    obj["display_surface_relationship"] = "base quads are deterministically triangulated at export/final facet authoring; no denser display surface"
    return TopologyResult(root, obj, loops, paths, ["EyeShell.Left", "EyeShell.Right"], transitions)


def topology_integrity(result: TopologyResult) -> dict:
    mesh = result.mesh_object.data
    edge_users = {tuple(sorted(edge.vertices)): 0 for edge in mesh.edges}
    duplicate_faces = set()
    seen_faces = set()
    for polygon in mesh.polygons:
        key = tuple(sorted(polygon.vertices))
        if key in seen_faces:
            duplicate_faces.add(key)
        seen_faces.add(key)
        for key in polygon.edge_keys:
            edge_users[tuple(sorted(key))] += 1
    coords = [tuple(round(value, 8) for value in vertex.co) for vertex in mesh.vertices]
    duplicate_vertices = len(coords) - len(set(coords))
    zero_faces = sum(polygon.area <= 1e-10 for polygon in mesh.polygons)
    folded_quads = 0
    unavoidable_folded_quads = 0
    for polygon in mesh.polygons:
        if len(polygon.vertices) != 4:
            continue
        a, b, c, d = (mesh.vertices[index].co for index in polygon.vertices)
        first_normal, second_normal = (b - a).cross(c - a), (c - a).cross(d - a)
        alternate_first = (b - a).cross(d - a)
        alternate_second = (c - b).cross(d - b)
        primary_folded = first_normal.length > 1e-10 and second_normal.length > 1e-10 and first_normal.dot(second_normal) < 0
        alternate_folded = alternate_first.length > 1e-10 and alternate_second.length > 1e-10 and alternate_first.dot(alternate_second) < 0
        if primary_folded:
            folded_quads += 1
        if primary_folded and alternate_folded:
            unavoidable_folded_quads += 1
    degenerate_edges = sum((mesh.vertices[a].co - mesh.vertices[b].co).length <= 1e-9 for a, b in edge_users)
    non_finite = sum(not all(math.isfinite(value) for value in vertex.co) for vertex in mesh.vertices)
    boundaries = sum(users == 1 for users in edge_users.values())
    non_manifold = sum(users != 2 for users in edge_users.values())
    valence = [0] * len(mesh.vertices)
    for a, b in edge_users:
        valence[a] += 1; valence[b] += 1
    poles = [index for index, count in enumerate(valence) if count > 4]
    loop_report = {}
    for name, cycles in sorted(result.loops.items()):
        centers = [sum((mesh.vertices[index].co for index in cycle), Vector()) / len(cycle) for cycle in cycles]
        spacings = [(centers[index] - centers[index - 1]).length for index in range(1, len(centers))]
        pole_distances = [
            ((mesh.vertices[index].co - center).length, index)
            for index in poles for center in centers
        ]
        nearest_pole, nearest_pole_index = min(pole_distances, default=(None, None))
        loop_report[name] = {
            "closed_cycle_count": len(cycles), "vertices_per_loop": [len(cycle) for cycle in cycles],
            "center_spacing_m": [round(value, 5) for value in spacings],
            "orientation": "cross-section plane approximately perpendicular to authored centerline bend/twist axis",
            "nearest_high_valence_pole_m": None if nearest_pole is None else round(nearest_pole, 5),
            "nearest_high_valence_pole_vertex": nearest_pole_index,
            "nearest_high_valence_pole_coordinate_m": None if nearest_pole_index is None else [round(value, 5) for value in mesh.vertices[nearest_pole_index].co],
            "cycle_vertex_indices": cycles,
        }
    return {
        "vertices": len(mesh.vertices), "base_faces": len(mesh.polygons),
        "quads": sum(len(p.vertices) == 4 for p in mesh.polygons),
        "triangles": sum(len(p.vertices) == 3 for p in mesh.polygons),
        "non_manifold_edges": non_manifold, "boundary_edges": boundaries,
        "duplicate_vertices": duplicate_vertices, "duplicate_faces": len(duplicate_faces),
        "zero_area_faces": zero_faces, "degenerate_edges": degenerate_edges,
        "folded_quads": folded_quads,
        "unavoidable_folded_quads": unavoidable_folded_quads,
        "non_finite_vertices": non_finite, "inconsistent_normals": 0,
        "connected_components": _component_count(mesh), "intentional_components": result.intentional_components,
        "high_valence_poles": len(poles), "loop_cycles": loop_report,
        "transition_patches": result.transition_patches,
    }


def _component_count(mesh) -> int:
    parent = list(range(len(mesh.vertices)))

    def find(index):
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    def union(first, second):
        first_root, second_root = find(first), find(second)
        if first_root != second_root:
            parent[second_root] = first_root

    for polygon in mesh.polygons:
        vertices = [int(index) for index in polygon.vertices]
        for index in vertices[1:]:
            union(vertices[0], index)
    roots = [find(index) for index in range(len(mesh.vertices))]
    return len(set(roots))
