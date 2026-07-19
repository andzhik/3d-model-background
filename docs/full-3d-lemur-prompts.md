# Full-3D rigged lemur execution prompts

Prompts 01-09 are the active model-quality sequence. Run them in order, one
prompt per Codex turn, and stop at every review gate. Do not continue merely
because automated checks pass. Prompt 10 is a deferred optimization and web
integration phase: do not execute it until Prompt 09 has explicit model-quality
approval and the user separately requests that deferred work.

## Instructions for every prompt

1. Read `AGENTS.md`, `docs/full-3d-lemur-plan.md`, and this file before acting.
2. Inspect the workspace and preserve unrelated user changes.
3. Work only on the new staging character throughout Prompts 01-09.
4. Keep Blender generation deterministic and source-controlled.
5. Do not make undocumented manual-only `.blend` edits.
6. Keep `images/yoge-lemur.png` unchanged.
7. Do not overwrite `public/models/lemur.glb` unless the deferred Prompt 10 has
   been separately authorized.
8. Produce the required neutral previews for visual stages.
9. Record measurements, decisions, checks, and unresolved limitations.
10. Write every attempt to a new
    `blender/generated/previews/lemur-full-3d/prompt-XX/rev-YY/` directory; do
    not overwrite an earlier review packet.
11. Include `review.md`, `metrics.json`, a labeled contact sheet, and the
    full-resolution source renders required by the stage.
12. Compare against the previous approved revision whenever approved visual or
    deformation work may have changed.
13. Automated checks do not grant visual approval. Present the review packet,
    stop after the requested prompt, and request explicit user approval. If the
    result is rejected, remain on the same prompt and create a new revision.
14. Add a `How to verify` section to `review.md` following the approval workflow
    and stage-specific guide in `docs/full-3d-lemur-plan.md`. Include the exact
    command and `http://localhost:5173/?review=lemur-full-3d`; never ask the user
    to approve from an unexplained list of generated files.

---

## Prompt 01 — Establish the isolated full-3D asset pipeline

```text
Execute Prompt 01 from docs/full-3d-lemur-prompts.md.

Create an isolated deterministic Blender generator for the new full-3D lemur,
plus staging manifest/output entries and a neutral preview rig. The generator
must emit public/models/lemur-full-3d.glb and previews under
blender/generated/previews/lemur-full-3d/. Do not modify or replace the current
production lemur asset or change the application to load the staging model.

The generator entry point may use source-controlled helper modules under
blender/. Add an asset selector to the build workflow so the staging lemur can
be generated and validated without rebuilding or rewriting unrelated production
assets. Document the exact staging-only build command.

Start with a minimal full-volume diagnostic mesh and a coordinate convention,
not detailed anatomy. Add documented measurements for height, arm span, seated
footprint, forward axis, ground plane, and intended modeling pose. Provide front,
left, right, back, front-left three-quarter, and front-right three-quarter
orthographic cameras with locked settings and identical scale, plus a locked
perspective turntable camera and neutral lighting. Record the Blender version,
camera transforms, render resolution, lighting, and color-management settings.

Verification:
- Build the staging asset twice and confirm deterministic output.
- Validate finite bounds, required staging objects, and materials.
- Record initial file, vertex, triangle, primitive, and material counts.
- Confirm the staging-only command leaves existing production GLBs unchanged.
- Confirm review filenames and metadata are reproducible.

User verification guide:
- Open the contact sheet first, then the interactive reviewer. Reset to all six
  canonical directions and orbit once around the object.
- Verify consistent framing, useful neutral lighting, visible depth, and the
  unambiguous `-Y` forward cue. Do not judge anatomy at this stage.

Acceptance gate:
- The staging pipeline is independent from the production GLB.
- All review cameras show a genuinely volumetric object.
- Rebuilding requires no undocumented manual Blender action.

Present the diagnostic review packet and stop for explicit visual approval of
the pipeline, framing, cameras, and genuinely volumetric diagnostic object.
```

## Prompt 02 — Design proportions and complete primary volumes

```text
Execute Prompt 02 from docs/full-3d-lemur-prompts.md.

Replace the diagnostic mesh with a complete full-volume base character in a
relaxed rigging pose. Establish skull, projecting muzzle, neck, ribcage, pelvis,
upper and lower limbs, hands, feet, haunches, and the full tail. Match the
reference's front-view identity while deliberately designing coherent side and
back silhouettes. Keep forms simple and do not add final facets or markings yet.

Produce front, side, back, both three-quarter views, and a turntable contact
sheet. Overlay or otherwise compare the front silhouette with the supplied
reference without modifying the reference image. Treat the single perspective
reference as an identity guide rather than orthographic ground truth: include a
cropped side-by-side comparison, a transparent landmark/silhouette overlay, and
document deliberate departures caused by designing unseen anatomy.

Verification:
- Confirm every major form has real depth and a closed or intentionally joined
  volume.
- Report dimensions and mesh statistics.
- Check symmetry where intended and document intentional asymmetry.
- Record descriptive counts for GLB bytes, vertices, triangles, primitives,
  materials, planned bones, and planned maximum weighted influences. Do not use
  these measurements as web budgets or simplify approved forms to meet them.

User verification guide:
- Compare the front render and overlay with the reference, then judge every
  other locked view before orbiting the actual GLB.
- Inspect every named primary volume for depth, coherent attachment, balance,
  and a silhouette that does not work only from the front.

Acceptance gate:
- The character reads as a ring-tailed lemur from all primary views.
- It is balanced anatomically and does not depend on the front camera to work.
- The neutral pose leaves room for shoulder, hip, wrist, and tail deformation.

Present the review packet and stop for explicit visual approval of the primary
volumes.
```

## Prompt 03 — Build the unified deformation topology

```text
Execute Prompt 03 from docs/full-3d-lemur-prompts.md.

Convert the approved volumes into one primary animation-ready character mesh.
Create deliberate topology around the shoulders, elbows, wrists, hands, hips,
knees, ankles, neck, muzzle, eyes, ears, and tail base. Connect body regions
where continuous deformation is required. Embedded eye shells may remain
disconnected components inside the same mesh object.

Work in organized deformation topology before final triangulation. Remove
accidental intersections, duplicate surfaces, non-manifold defects, zero-area
faces, and unusable poles at bending zones.

Produce smooth-shaded topology previews, wireframes from all primary views, and
a topology-density heatmap or equivalent diagnostic. Include matched silhouette
comparisons against the approved Prompt 02 renders so topology conversion cannot
quietly change the approved proportions.

Verification:
- Run mesh integrity checks.
- Report vertices, base faces, connected components, and known intentional
  boundaries.
- Demonstrate adequate loops at every planned joint.
- Validate non-manifold edges, boundary edges, duplicate vertices and faces,
  zero-area faces, degenerate edges, inconsistent normals, and non-finite data.

User verification guide:
- Inspect the matched Prompt 02 silhouettes before topology details.
- Enable wireframe in the interactive reviewer and orbit every planned joint;
  use the density diagnostic to reject arbitrary density or unusable poles.

Acceptance gate:
- The mesh is structurally suitable for rigging.
- Density follows silhouette and deformation needs rather than uniform detail.
- The result still preserves the approved proportions and identity.

Present the review packet and stop for explicit topology approval.
```

## Prompt 04 — Refine identity, face, hands, feet, and tail

```text
Execute Prompt 04 from docs/full-3d-lemur-prompts.md.

Refine the unified mesh's defining features: head planes, brow, eye sockets,
muzzle, nose, ears, hand silhouette and meditation gesture capability, feet,
haunches, and tail taper. Design eyelid geometry capable of a clean blink.
Preserve deformation loops and avoid adding detail that will not survive at the
character's intended reduced presentation scales.

Produce face close-ups, hand and foot close-ups, tail attachment views, the full
turntable, and a reduced-size readability preview. Include matched full-character
views against the approved Prompt 03 stage to expose silhouette drift.

Verification:
- Re-run mesh integrity and topology checks.
- Compare updated statistics with Prompt 03.
- Confirm the eyes, eyelids, mouth/muzzle, fingers, and tail have no unintended
  intersections in the neutral pose.

User verification guide:
- Open the reference image in the reviewer and compare the face at full size and
  the supplied reduced-size render.
- Orbit close to the face, hands, feet, and tail base in solid and wireframe
  modes; reject hidden intersections or features that only read head-on.

Acceptance gate:
- The face has the calm, alert identity of the reference.
- Hands can form the required gesture without looking mechanical.
- Feet and folded-leg forms will remain readable in the seated pose.
- The tail is fully volumetric, well attached, and controllably segmented.

Present the review packet and stop for explicit feature approval.
```

## Prompt 05 — Create controlled triangular facets and markings

```text
Execute Prompt 05 from docs/full-3d-lemur-prompts.md.

Add a deterministic final triangulation layer without damaging the approved
deformation topology. Direct triangle edges to describe anatomy, silhouette,
facial planes, limb direction, and tail curvature. Avoid uniform or random
tessellation. Apply flat shading and the compact named material palette.

Author coherent facial mask, eye patches, belly, limb, back, ear, and ring-tail
color regions. Continue all markings intentionally around side and back views.
Use geometry-aligned material indices or vertex colors; do not introduce texture
maps unless a measured requirement is documented and approved.

Produce flat-shaded neutral turntable views, a triangulated wireframe sheet, a
material-ID sheet, and reduced-size readability comparisons. Include
matched comparisons against the approved smooth Prompt 04 form so triangulation
or markings cannot conceal a shape regression.

Verification:
- Confirm deterministic triangle orientation and material assignment.
- Report triangles, materials, primitives, and estimated draw calls.
- Inspect normals, cracks, z-fighting, and unintended smooth shading.

User verification guide:
- Compare the approved smooth form with the flat-shaded and material-ID sheets.
- Toggle wireframe while orbiting every canonical direction; inspect facet flow,
  side/back marking continuity, cracks, z-fighting, and reduced-size readability.

Acceptance gate:
- The character reads as one coherent object made from intentional triangles.
- Facets strengthen anatomy instead of creating visual noise.
- Markings work from every primary view and preserve reference identity.

Present the review packet and stop for explicit visual approval of facets and
markings.
```

## Prompt 06 — Build the production armature and skinning

```text
Execute Prompt 06 from docs/full-3d-lemur-prompts.md.

Create the production armature, stable bone naming contract, control structure,
and deterministic skin weights. Include root, pelvis, spine, chest, neck, head,
ears, eyelids, arms, wrists, simplified fingers, legs, feet, and a segmented tail.
Use Blender control bones or constraints where useful, but ensure glTF export can
bake animation correctly onto the deform skeleton.

Create diagnostic poses that test neck rotation, raised and crossed arms, deep
elbow and wrist bends, hip rotation, crossed legs, ankle bends, ear movement,
blink closure, and the complete tail range.

Use deterministic helper deform bones or limited corrective shape keys if they
are necessary to preserve approved forms through the required deep bends. Record
and validate any such mechanism; do not use an undocumented manual correction.

Produce labeled joint deformation sheets in smooth topology and final
flat-shaded modes. Each sheet must identify the tested bone transforms and show
the joint from at least two useful angles at neutral, moderate, and extreme
positions. Include close sheets for blink closure, fingers, and the tail base.

Verification:
- Check normalized weights and enforce the intended maximum influences per
  vertex.
- Report bone count, deform bone count, and influence statistics.
- Export and re-import the staging GLB to verify bind pose and bone transforms.
- Programmatically sample every diagnostic pose after re-import and check for
  non-finite transforms, detached geometry, and unexpected bound growth.

User verification guide:
- Review every labeled joint at neutral, moderate, and extreme positions from
  both supplied angles before judging the meditation range.
- Orbit the exported diagnostic poses in solid and wireframe; closely inspect
  shoulders, hips, wrists, eyelids, finger bases, and the tail base for collapse.

Acceptance gate:
- Major joints preserve useful volume without cracks or collapsing facets.
- Eyelids close cleanly and ears deform from appropriate bases.
- The tail bends as a continuous tapered form.
- The rig can produce the meditation pose without mesh breakage.

Present the review packet and stop for explicit deformation approval.
```

## Prompt 07 — Author and approve the meditation pose

```text
Execute Prompt 07 from docs/full-3d-lemur-prompts.md.

Use the approved rig to create the final seated meditation pose. Match the
reference's upright torso, calm head position, long relaxed arms, readable hand
gesture, crossed folded legs, and foreground ring-tail composition. Correct skin
weights or topology only where the pose exposes a genuine deformation problem;
do not disguise structural failures with camera placement.

Store the pose reproducibly and produce front, side, back, both three-quarter,
turntable, face, hands, and reduced-size model-readability previews.

Verification:
- Check mesh intersections, ground contact, center of mass, and tail clearance.
- Compare neutral-pose and meditation-pose bounds and statistics.
- Confirm the pose survives GLB export and re-import.

User verification guide:
- Compare neutral and meditation sheets, then orbit the seated GLB from front,
  sides, back, three-quarters, and underneath where contacts are ambiguous.
- Verify gesture readability, balance, ground contact, joint volume, marking
  continuity, and the absence of camera-hidden intersections.

Acceptance gate:
- The meditation gesture reads immediately from the front and three-quarter view.
- The pose remains anatomically coherent from side and back views.
- No important joint or marking collapses under the pose.

Present the review packet and stop for explicit final pose approval.
```

## Prompt 08 — Create production animation clips

```text
Execute Prompt 08 from docs/full-3d-lemur-prompts.md.

Create and export the required Breathing, Blink, EarTwitch, and TailIdle clips on
the approved rig and meditation pose. Keep motion restrained and compatible with
the character's calm visual identity. Ensure each loop has clean endpoints and
that independent clips can play together without fighting over unrelated bones.

Produce an individually playable MP4 for Breathing, Blink, EarTwitch, and
TailIdle, each showing at least two complete loops under neutral lighting.
Produce a combined-animation MP4 showing the clips playing concurrently for at
least two cycles of the longest loop, labeled sampled-frame contact sheets for
penetration inspection, and a motion-disabled still. Use broadly playable H.264
encoding and record frame rate, duration, resolution, and sampled frames.

Verification:
- Export and re-import the GLB and verify clip names, durations, tracks, and
  playback.
- Check for mesh penetration, foot drift, root drift, tail-floor clipping, and
  discontinuous loops.
- Confirm a motion-disabled pose remains visually complete.
- Compare the first and final evaluated loop frames within a documented numeric
  tolerance, and verify that concurrent clips do not animate unrelated bones.

User verification guide:
- Watch each individual video and the combined video for at least two complete
  loops, then inspect the sampled-frame sheets.
- In the reviewer, select every clip, orbit while it plays, pause at suspect
  frames, and verify the motion-disabled pose before approving animation.

Acceptance gate:
- Breathing preserves torso volume and seated stability.
- Blinks close cleanly and do not move the eyes unexpectedly.
- Ear and tail movement feel organic but unobtrusive.
- All clips work independently and concurrently.

Present the videos and review packet and stop for explicit animation approval.
```

## Prompt 09 — Complete the final model-quality audit

```text
Execute Prompt 09 from docs/full-3d-lemur-prompts.md.

Conduct a comprehensive final quality audit of the approved staging character.
Review the neutral model, meditation pose, anatomy from every canonical view,
face and expression, hands and feet, tail attachment and rings, deformation
topology, controlled facets, material continuity, diagnostic poses, and all
animation clips as one coherent asset. Correct only genuine model-quality or
export-integrity regressions, and keep any correction within this prompt until
the revised result receives approval.

Do not optimize for the web, decimate geometry, merge materials, simplify the
rig, reduce animation data, replace the production GLB, or modify the
application. Counts and file sizes remain descriptive at this stage.

Produce a final model dossier containing the canonical neutral and meditation
contact sheets, close face/hands/feet/tail sheets, topology and triangulation
sheets, material-ID sheet, deformation sheets, individual animation videos, the
combined-animation video, and matched comparisons against every relevant
approved stage.

Verification:
- Report final dimensions, GLB bytes, vertices, base faces, triangles,
  connected components, primitives, materials, bones, deform bones, influence
  statistics, clip durations, tracks, and animation bytes.
- Build twice to confirm determinism.
- Run complete mesh, rig, weight, transform, bounds, material, and animation
  validation.
- Export and re-import the staging GLB and repeat bind-pose, meditation-pose,
  deformation, and animation playback checks.
- Confirm matched comparisons show no unapproved regression from earlier visual
  gates.

User verification guide:
- Work through the dossier in quality-gate order, not file order: identity,
  silhouette, anatomy and pose, deformation, facets, markings, then animation.
- Repeat all canonical, free-orbit, wireframe, reduced-size, and per-clip checks
  on the final exported GLB before granting model-quality approval.

Acceptance gate:
- The character is visually coherent and intentionally designed from every
  canonical view in both neutral and meditation poses.
- Identity, anatomy, facets, markings, rig deformation, and animations all meet
  their approved quality gates together.
- The staging model and review dossier are deterministic and reproducible.
- No web-performance compromise has been applied before model approval.

Present the final model dossier and stop for explicit model-quality approval.
This approval ends the active model-creation sequence. Do not begin optimization
or application integration without a separate user request.
```

## Prompt 10 — Deferred web optimization and integration

```text
Execute Prompt 10 from docs/full-3d-lemur-prompts.md only after the Prompt 09
model has explicit quality approval and the user has separately requested web
optimization or integration. Otherwise stop without changing any production
asset or application code.

First measure the approved model in the existing application and propose numeric
runtime budgets. Optimize only where measured application needs justify it, and
preserve the approved silhouette, identity, facet design, markings, rig
deformation, meditation pose, and animations. Produce matched model-review
comparisons for every optimization and obtain approval for any visible tradeoff.

Replace the production lemur asset with the approved full-3D rigged character
and make the smallest runtime changes required for its skeleton and animation
contract. Preserve the background composition, camera system, landscape, water,
atmosphere, content, quality tiers, visibility pausing, reduced-motion behavior,
and poster fallback. Adjust only character placement, scale, shadow behavior,
and animation binding as necessary.

Verification:
- Report before/after GLB bytes, vertices, triangles, primitives, materials,
  bones, influences, and animation bytes, together with the measured reason for
  each optimization.
- Render matched pre/post-optimization model sheets and confirm no unapproved
  visual, deformation, or animation regression.
- Run asset build/validation, typecheck, lint, tests, and production build.
- Inspect high, medium, low, poster-only, and reduced-motion behavior.
- Inspect supported desktop, tablet, and mobile viewports at a deterministic
  animation time and neutral parallax position.
- Confirm no browser errors, missing tracks, animation leaks, or new fallback
  failures.
- Record final renderer and asset statistics.
- Produce labeled application contact sheets and full-resolution captures for
  desktop, tablet, and mobile across the required quality tiers, plus dedicated
  reduced-motion and poster-fallback captures. Record viewport dimensions,
  device pixel ratio, quality tier, animation time, and parallax position.

User verification guide:
- First approve matched pre/post optimization model sheets, using the staging
  reviewer to investigate any visible difference.
- Then inspect the labeled production-page captures and live page at every
  required tier, viewport, reduced-motion state, and poster fallback before
  granting separate integration approval.

Acceptance gate:
- The new lemur is visually integrated without background retuning.
- Its meditation pose, face, hands, markings, and tail remain readable at every
  supported viewport.
- Quality and accessibility behavior remain intact.
- The prior production asset remains recoverable from version control.

Present the final integration review packet, report remaining limitations, and
stop for explicit user visual approval. Do not treat successful automated checks
as final approval.
```
