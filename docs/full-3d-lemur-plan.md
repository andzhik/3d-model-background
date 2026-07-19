# Full-3D rigged lemur plan

Status: active and authoritative for model creation  
Reference: `images/yoge-lemur.png`  
Scope: character asset only; web optimization and application integration are
deferred until the model receives explicit quality approval

## 1. Objective

Create a new, complete 3D ring-tailed lemur character inspired by the supplied
low-poly reference. The character must have intentional anatomy and markings
from front, side, back, and three-quarter views. It must retain the recognizable
meditation pose while also being constructed for a reusable skeletal rig and
clean deformation.

The result should read as one coherent character made from controlled triangular
planes. It must not read as a collection of overlapping geometric primitives or
as a camera-facing relief.

## 2. Deliverable

The active phase delivers an approved deterministic staging GLB containing:

- one primary, full-volume character mesh;
- a complete armature with stable, documented bone names;
- flat-shaded triangular surface geometry;
- deliberate low-poly color regions and facial markings;
- production animation clips for idle breathing, blinking, ear movement, and
  tail movement;
- a seated meditation pose that matches the reference's identity and gesture;
- finite bounds, normalized transforms, and a documented real-world scale.

Eyes may use embedded disconnected shells within the same mesh object when that
improves rotation or blinking. This still counts as one character mesh. Separate
render objects require a documented deformation or material reason.

The staging asset becomes eligible for later optimization and production use
only after the complete model receives explicit user quality approval.

## 3. Source of truth and asset safety

Blender Python is the source of truth. Authored topology, proportions, material
assignments, armature construction, weights, constraints, animation data, export
settings, and preview setup must be reproducible from source control. Do not
rely on undocumented manual edits to a `.blend` file.

The generator may use source-controlled helper modules under `blender/` so the
topology, rig, preview, validation, and export code do not have to live in one
monolithic script. Temporary interactive Blender experiments are allowed for
design and diagnosis, but every accepted change must be represented in the
source-controlled generator before a stage can pass.

Develop the character separately from the production asset:

- generator: `blender/scripts/generate_lemur_full_3d.py`;
- staging output: `public/models/lemur-full-3d.glb`;
- staging previews: `blender/generated/previews/lemur-full-3d/`;
- optional source snapshot: `blender/generated/lemur-full-3d.blend`.

Do not overwrite `public/models/lemur.glb` during the active model-creation
phase. Production replacement belongs only to the separately authorized deferred
integration stage after all model-quality gates have passed.

## 4. Shape design

The reference controls the front-view identity, including:

- compact head and large triangular ears;
- dark eye patches, pale facial mask, and projecting muzzle;
- narrow shoulders and a long, tapered torso;
- long arms ending in readable meditation hand gestures;
- folded and crossed legs with clear overlap;
- a thick, tapered ringed tail placed around the foreground;
- a calm, alert expression.

The reference does not define hidden geometry. Side and back anatomy must be
designed deliberately and consistently, including skull depth, muzzle projection,
ribcage and pelvis volume, spine curvature, haunches, limb cross-sections, tail
attachment, and the continuation of markings. These are design decisions, not
attempts to recover unavailable information.

The neutral modeling pose should permit reliable skinning. A relaxed A-pose with
an extended tail is preferred for construction and weighting; the meditation
pose should be produced by the rig and stored as a named pose or animation.

## 5. Topology and triangulation

Rig behavior takes priority over arbitrary triangle density. Construct an
animation-friendly base topology, primarily with organized quad loops, then
apply a deterministic triangulation strategy for export and final shading.

Topology must provide:

- sufficient loops at shoulders, elbows, wrists, fingers, hips, knees, ankles,
  neck, jaw, eyelids, ears, and the tail base;
- useful volume preservation at strongly bent joints;
- controlled facial loops for blinking and subtle expression;
- intentional edge direction across large visible planes;
- no accidental duplicate faces, non-finite vertices, or zero-area triangles;
- clean normals and no visible cracks under animation.

Triangulation must be authored or deterministically controlled. Large triangles
should describe anatomy and graphic plane changes. Small triangles belong only
where silhouette, markings, or deformation require them. The visible result must
not resemble uniform automatic tessellation.

## 6. Materials and low-poly appearance

Use a compact named palette covering charcoal, mid gray, pale fur, warm iris,
dark pupil/nose, and any deliberately approved intermediate tone. Favor material
indices or vertex colors over texture maps so color boundaries follow geometry
and remain sharp.

All production materials should be nonmetallic, rough, and flat shaded. Lighting
must reveal the planes without making the character look glossy. Color regions
must continue coherently around the sides and back.

## 7. Rig requirements

The rig must support:

- root and pelvis placement;
- spine, chest, neck, and head control;
- jaw or muzzle adjustment where useful;
- independent ears and eyelids;
- clavicle, arm, wrist, and simplified finger articulation;
- hip, leg, ankle, and foot articulation;
- a segmented, smoothly controllable tail chain;
- a stable meditation pose without collapsed shoulders, hips, wrists, or ankles.

Use predictable left/right naming and document the exported skeleton contract.
The deform skeleton must be suitable for glTF export. Blender-only control bones
and constraints are allowed when animation is baked correctly to deform bones.

Helper deform bones and limited corrective shape keys are allowed when ordinary
weights cannot preserve an approved form through the deep bends required by the
meditation pose. Their construction, drivers, animation behavior, and export
must remain deterministic and documented.

Skin weights must be deterministic and explicitly generated or assigned. Test
extreme diagnostic poses before judging the final seated pose.

## 8. Animation requirements

Required production clips:

- `Breathing`: subtle torso and shoulder motion without visible volume collapse;
- `Blink`: clean eyelid closure without eye penetration;
- `EarTwitch`: restrained asymmetric ear movement;
- `TailIdle`: slow movement through the tail chain without floor clipping.

The seated meditation pose must be reproducible through the rig. Animation loops
must avoid discontinuities. Application playback policy, reduced-motion
behavior, responsive behavior, and runtime animation binding belong to the
deferred integration phase and must not constrain model-quality work before the
character is approved.

## 9. Review artifacts and visual approval

Prompt 01 must establish canonical review cameras and a neutral studio setup.
Orthographic front, left, right, back, front-left three-quarter, and front-right
three-quarter cameras must use locked transforms and identical framing wherever
that comparison is meaningful. A separate locked perspective camera may be used
for turntables and close views. Record camera, lighting, resolution, color
management, ground-plane, character-axis, and Blender-version settings in the
review metadata. Scene-lighting previews are secondary and should begin only
after the character works under neutral light.

Do not overwrite evidence from an earlier review. Each prompt attempt writes to
a versioned directory such as:

`blender/generated/previews/lemur-full-3d/prompt-02/rev-01/`

Every attempt must contain a self-contained review packet with:

- `review.md`, identifying the prompt, revision, artifact links, changes since
  the previous approved revision, checks, decisions, and known limitations;
- `metrics.json`, containing the measurements and asset statistics relevant to
  that stage;
- a labeled contact sheet that serves as the visual entry point;
- the individual full-resolution renders used in the contact sheet;
- direct comparison renders against the previous approved stage whenever an
  approved silhouette, topology, facet layout, marking, or deformation may have
  changed.

Review artifacts are stage-dependent:

- Prompts 01-05 show the neutral modeling pose from the canonical cameras;
- Prompt 06 adds clearly labeled diagnostic deformation poses in both smooth
  topology and final flat-shaded modes;
- Prompts 07-09 show the approved meditation pose, including close face, hands,
  tail, and reduced-size model-readability views;
- topology stages add wireframe, triangulation, density, or material-ID sheets
  as applicable;
- Prompt 08 adds playable videos for each animation and a combined-animation
  video, with at least two complete loops plus sampled-frame contact sheets;
- Prompt 09 performs the comprehensive final model-quality review and preserves
  matched comparisons against all approved visual stages;
- the deferred integration prompt defines application captures only after model
  quality has received explicit approval and the user separately starts that
  phase.

Automated checks establish technical eligibility for review; they do not grant
visual approval. Every prompt must present its review packet and stop for the
user's explicit approval. If rejected, remain on the same prompt, create a new
revision directory, and do not advance.

## 10. Quality gates

A stage advances only when its own acceptance criteria pass. Review in this order:

1. identity and expression;
2. silhouette from all primary views;
3. anatomy, balance, and meditation-pose readability;
4. joint topology and deformation;
5. triangular facet design;
6. markings and material continuity;
7. animation quality;
8. final model consistency and export integrity.

Front-view similarity alone cannot approve the model. Likewise, an attractive
static mesh cannot advance if its joints are unsuitable for the planned rig.

## 11. Model measurements

Record measurements throughout development to understand the asset, detect
regressions, and support later decisions. These are descriptive measurements,
not pre-approval web budgets:

- triangles, vertices, base faces, and connected components;
- mesh primitives and materials;
- bones, deform bones, and weighted influences per vertex;
- animation clip durations, tracks, and exported bytes;
- uncompressed scene data and final staging GLB byte size.

Do not decimate, merge materials, simplify the rig, remove deformation geometry,
or otherwise trade approved visual quality for hypothetical runtime savings
before final model approval.

## 12. Deferred optimization and integration boundary

Responsive web application work, runtime optimization, production asset
replacement, character placement in the scene, quality-tier behavior,
reduced-motion behavior, poster fallback checks, and viewport testing are not
part of the active model-creation phase. Do not begin them merely because the
model passes automated checks or reaches the final model-review prompt.

Begin this deferred phase only after:

- the complete staging model, rig, meditation pose, facets, markings, and
  animations have explicit user quality approval; and
- the user separately requests optimization or integration work.

Character development must not retune the background. Integration may adjust only
the character scale, placement, shadow settings, animation binding, and the
smallest necessary runtime loader contract. Camera, landscape, water, atmosphere,
copy, responsive composition, quality selection, and fallbacks remain unchanged
unless a separately approved issue proves an integration change is necessary.

If the deferred integration phase is authorized, the production GLB is replaced
only after:

- the complete staging asset is approved from all review views;
- rig deformation and required animation clips pass;
- the asset manifest and validation checks pass;
- the application works at all supported quality tiers and viewports;
- the previous production asset remains recoverable from version control.
