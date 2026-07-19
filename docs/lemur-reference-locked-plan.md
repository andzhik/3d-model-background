# Reference-locked lemur implementation plan

Status: active; supersedes the archived model-accuracy passes  
Reference: `images/yoge-lemur.png`  
Production generator: `blender/scripts/generate_lemur.py`  
Archived passes: branch `archive/model-accuracy-passes`, commit `c6f4427`

## Decision

Rebuild the visible character as a shallow, layered 2.5D model instead of
iteratively fitting rounded 3D primitives to a single front-biased image.

The character is used as a composed website-background subject, not as a freely
rotating game asset. The supplied image contains reliable information about the
front silhouette, overlap order, graphic material boundaries, and facet rhythm,
but little reliable information about side or back anatomy. The model should
therefore preserve the known front view and infer only the depth needed for
lighting, modest parallax, and the existing subtle animations.

## Non-negotiable contracts

- Keep the existing GLB URL and required node names.
- Keep the `Breathing`, `Blink`, `EarTwitch`, and `TailIdle` animation names.
- Keep the current four-material runtime palette unless a measured visual gain
  requires a deliberately reviewed addition.
- Keep the pre-accuracy model recoverable at commit `93d1e40` and all three
  discarded passes recoverable on `archive/model-accuracy-passes`.
- Treat the front composition as authoritative. Three-quarter views are depth
  sanity checks, not independent likeness targets.

## Geometry method

1. Trace each major visible region as a small ordered polygon in normalized
   character coordinates.
2. Convert the polygon to a shallow prism, with the front surface slightly
   articulated in depth to create intentional triangular facets.
3. Layer regions by front-depth: body shell, pale markings, dark patches,
   muzzle, eyes, hands, crossed legs, and foreground tail.
4. Use separate transform nodes at natural articulation boundaries so the
   existing animation clips remain useful.
5. Add real volume only where it produces a visible benefit under modest
   parallax: muzzle, ears, limb overlap, hands, and tail.

Trace coordinates belong in the generator beside the corresponding part. They
are source-of-truth design data and should not be hidden in generated Blender or
GLB files.

## Implementation sequence

### Stage 1 — head and torso proof

- Replace the round head shell and box-like chest with traced relief meshes.
- Establish a compact head, narrow shoulders, long pear-shaped torso, and thin
  pale belly marking.
- Retain the existing limbs and tail temporarily so the comparison isolates the
  new construction method.
- Render the normal close and target-framing previews.

Exit check: the complete character looks more deliberate and closer to the
reference at target size, even though the temporary limbs remain inaccurate.

### Stage 2 — face and ears

- Trace connected brow, cheek, bridge, eye-patch, and muzzle regions.
- Use small dimensional eye and nose elements on top of the relief planes.
- Rebuild ears as shallow folded wedges attached to the existing twitch nodes.

Exit check: the expression and graphic mask read correctly before examining
fine landmark alignment.

### Stage 3 — pose and overlap

- Trace arms, crossed-leg masses, feet, and their visible overlap order.
- Preserve negative space around the torso and hands.
- Give overlapping pieces small depth offsets rather than inventing hidden
  anatomy to satisfy a turntable.

Exit check: the meditation pose reads immediately at mobile size.

### Stage 4 — hands and tail

- Replace mechanical finger loops with simplified graphic gesture shapes.
- Trace the visible tail path, stripe boundaries, taper, and attachment.
- Give the tail enough roundness for lighting while locking its front contour.

Exit check: the gesture and tail remain readable without dominating the body.

### Stage 5 — facet and scene integration

- Adjust front vertex depths and material regions to reproduce the reference's
  purposeful plane changes.
- Validate under neutral preview light and the live warm/cool scene lighting.
- Check the four supported viewports at a fixed animation time and neutral
  parallax position.

Exit check: the site composition, not an isolated diagnostic score, is approved.

## Review order

Every stage is reviewed in this order:

1. Character identity and expression.
2. Complete-pose readability at the website's displayed size.
3. Large silhouette and overlap relationships.
4. Light/dark material regions and facet rhythm.
5. Modest-parallax depth behavior.
6. Individual landmark correspondence.

Silhouette overlap scores may flag gross regressions but are not optimization
targets. No change is accepted solely because a numeric score improves.

## Rollback points

- `93d1e40`: production state before all model-accuracy passes.
- `archive/model-accuracy-passes` at `c6f4427`: Passes 1–3, including generated
  previews and GLB.
- Each accepted 2.5D stage should be committed separately so visual regressions
  can be bisected or reverted without reconstructing prior geometry.
