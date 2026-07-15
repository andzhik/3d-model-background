# Codex execution prompts

These prompts implement the Yoga Lemur background incrementally. Run them in order, one prompt per Codex turn. Every step must leave the application in a working state and add a visible feature, a measurable capability, or automated protection.

The default implementation uses scripted Blender-generated assets plus code-native Three.js effects and repeated geometry. Blender 4.3.1 is installed locally; no manual modeling is required.

## Instructions for every prompt

The following rules apply to all prompts below:

1. Read `docs/scene-design-and-implementation-plan.md` and this file before changing code.
2. Inspect the current workspace and preserve existing user changes.
3. Implement only the requested step plus the smallest supporting changes it requires.
4. Use TypeScript with strict types. Avoid `any` unless an external API makes it unavoidable and explain it in code.
5. Keep procedural generation deterministic. Never use unseeded `Math.random()` for scene layout.
6. Keep the supplied `images/yoge-lemur.png` unchanged.
7. Run the relevant checks after implementation. Fix failures caused by the step.
8. Report files changed, checks run, measured results, and remaining limitations.
9. Add or update `docs/implementation-progress.md` with the step number, completion date, outcome, decisions, and verification results.
10. Stop after the current step. Do not silently continue into the next prompt.
11. Treat Blender Python scripts as asset source code. Do not make undocumented manual-only changes to `.blend` files.
12. Resolve Blender from `BLENDER_PATH`; the detected local executable is `D:\Program Files\Blender Foundation\Blender 4.3\blender.exe`. Do not hard-code that machine-specific path into browser code.
13. When done with changes, propose one-line commit message

---

## Prompt 01 — Scaffold a working application

```text
Execute Prompt 01 from docs/codex-execution-prompts.md.

Create a Vite React TypeScript application in the repository root without deleting the existing docs or images. Add React Three Fiber, Three.js, Drei, Vitest, Testing Library, ESLint, and Prettier. Add useful npm scripts for dev, build, lint, typecheck, and test. Create a minimal semantic page with a full-viewport hero, a visible title, a short subtitle, and one call-to-action button. Use images/yoge-lemur.png as the initial static hero background.

Create docs/implementation-progress.md and record this step. Add a concise README with setup and command instructions. Add a sensible .gitignore.

Verification:
- Run npm install if needed.
- Run typecheck, lint, tests, and production build.
- Confirm the production build emits successfully.

Acceptance criteria:
- npm run dev can start the application.
- The hero fills the viewport and displays the supplied image.
- Semantic HTML content remains independent from future canvas rendering.
- No existing reference or documentation file is removed.
```

## Prompt 02 — Establish responsive static composition

```text
Execute Prompt 02 from docs/codex-execution-prompts.md.

Improve the static hero into a production-quality responsive baseline before adding WebGL. Preserve the reference image as the poster. Add CSS variables for hero height, content width, scrim intensity, and focal position. Implement desktop, tablet portrait, and mobile portrait image positioning so the lemur remains visible and the headline stays in the approved upper-center safe zone. Add a subtle gradient scrim that improves text contrast without flattening the artwork.

Add component tests for the hero's semantic structure. Document responsive focal-point decisions in implementation-progress.md.

Verification:
- Run typecheck, lint, tests, and build.
- If browser tooling is available, inspect at 360x800, 768x1024, 1440x900, and 1920x1080 and capture screenshots under tests/visual/baseline-static/.

Acceptance criteria:
- No horizontal scrolling at target widths.
- Lemur and sun remain compositionally useful.
- Text is readable over the brightest part of the sky.
- The hero still works without JavaScript.
```

## Prompt 03 — Add the WebGL shell and safe fallback

```text
Execute Prompt 03 from docs/codex-execution-prompts.md.

Add a decorative React Three Fiber Canvas behind the semantic hero content and above the permanent poster image. Create SceneBackground and Experience components. Add a basic camera, ambient/hemisphere light, and one visible faceted placeholder object so successful WebGL rendering is obvious. Keep the canvas aria-hidden and pointer-events disabled.

Implement a loading state and an error boundary. The canvas must fade in only after the scene has rendered a valid first frame. If WebGL initialization or rendering fails, remove or hide the canvas and leave the poster visible. Do not remove the poster after success.

Verification:
- Run typecheck, lint, tests, and build.
- Add tests for loading/fallback state logic where practical.

Acceptance criteria:
- A faceted placeholder is visible over the poster when WebGL succeeds.
- There is no blank or flashing background during startup.
- Hero text and CTA remain normal accessible HTML.
```

## Prompt 04 — Create deterministic scene and Blender foundations

```text
Execute Prompt 04 from docs/codex-execution-prompts.md.

Create the scene foundation modules: constants, palette, seeded random utility, scene quality types, and shared low-poly material helpers. Add a development-only SceneDebug panel or Leva controls for camera position, field of view, fog, light intensity, and major group visibility. Ensure debug controls are excluded or disabled in production.

Establish the automated Blender pipeline. Add blender/scripts/, blender/generated/, and public/models/ conventions; a Blender executable resolver; an asset manifest; and an npm command such as assets:build. Write a first deterministic Blender Python smoke-test script that clears the scene, creates one flat-shaded faceted test mesh with a named material, saves an optional generated .blend, and exports public/models/pipeline-test.glb. Add a validation script that confirms the GLB exists, is non-empty, and includes the expected named object/material. Document BLENDER_PATH setup and the detected Blender 4.3.1 location.

Replace scattered magic values with named configuration. Add unit tests proving that seeded random sequences are repeatable and stay within requested ranges.

Verification:
- Run typecheck, lint, tests, and build.

Acceptance criteria:
- Reloading produces identical procedural values.
- Core visual constants have one documented source.
- Production builds do not expose debug UI.
- A headless Blender command reproducibly generates and validates pipeline-test.glb.
```

## Prompt 05 — Build the sky, sun, and clouds

```text
Execute Prompt 05 from docs/codex-execution-prompts.md.

Replace the placeholder background with a procedural sky matching the reference palette. Add a sky gradient, warm sun disc near the horizon, and two cloud depth layers made from low-poly geometry or carefully controlled transparent cards. Clouds should use deterministic placement. Add extremely slow, frame-rate-independent cloud drift.

Keep the poster visible underneath while the procedural scene is incomplete. Add reduced-motion plumbing now so cloud movement can be frozen later.

Verification:
- Run typecheck, lint, tests, and build.
- Inspect that the sun remains near the central vertical axis at target aspect ratios.

Acceptance criteria:
- Sky, sun, and at least two cloud layers are visible.
- Clouds visibly differ in parallax depth or speed.
- Animation is time-based, not frame-count-based.
```

## Prompt 06 — Generate layered low-poly mountains

```text
Execute Prompt 06 from docs/codex-execution-prompts.md.

Create a deterministic Blender Python mountain generator with flat-shaded triangular geometry. Build far, left, and right mountain layers that form a valley converging toward the central sun. Use the cool blue-violet and peach-lit face palette from the design document. Export a named environment-mountains.glb and load it into separate web groups for future parallax. Add distance haze/fog in Three.js.

Do not create a generic random mountain range. Match the reference's framing: dominant left peak, tall right wall, lower center horizon, and clear central valley.

Extend GLB validation to check expected mountain node names, finite accessor bounds, deterministic repeat builds, and valid asset size.

Verification:
- Run typecheck, lint, tests, and build.

Acceptance criteria:
- The valley silhouette reads correctly without the poster.
- No holes, NaNs, or inverted composition-breaking faces are visible.
- Mountain layers remain within camera coverage at target aspect ratios.
```

## Prompt 07 — Add the lake and stylized sunlight reflection

```text
Execute Prompt 07 from docs/codex-execution-prompts.md.

Add a lake plane extending from the foreground to the horizon. Implement a lightweight custom shader or vertex animation for slow polygonal ripples. Add a separate stylized sunlight reflection aligned with the sun, using a broken vertical highlight rather than real-time planar reflection. Match the reference's cyan foreground water and cooler horizon color.

Expose water speed, amplitude, and reflection width as named configuration. Respect reduced motion by freezing time or switching to a static material.

Verification:
- Run typecheck, lint, tests, and build.
- Confirm shader compilation errors are absent in development.

Acceptance criteria:
- Water motion is visible but calm.
- The reflection visually leads from the foreground toward the sun.
- No scene re-render pass is used for reflection.
```

## Prompt 08 — Create shores, rocks, and foreground framing

```text
Execute Prompt 08 from docs/codex-execution-prompts.md.

Extend the Blender environment generator with shore source meshes, reusable seeded deformed-icosahedron rocks, larger framing rocks for both lower corners, and the central meditation platform. Export named meshes with flat shading and controlled color variation. Place repeated rock instances in Three.js when that is more efficient. Ensure no rock intersects the camera or blocks the future lemur safe area.

Create reusable RockAsset and RockField components rather than duplicating JSX. Extend headless asset generation and validation tests.

Verification:
- Run typecheck, lint, tests, and build.

Acceptance criteria:
- Foreground depth is clearly stronger than mountain depth.
- The meditation platform establishes the character's position.
- Both lower corners have reference-like framing without covering page controls.
```

## Prompt 09 — Add instanced pine forests and plants

```text
Execute Prompt 09 from docs/codex-execution-prompts.md.

Create two to four procedural low-poly pine variants from stacked cones and simple trunks. Render repeated trees with InstancedMesh, separated into distance bands for palette and scale control. Add sparse foreground grass/reed blades using shared geometry or instancing. Match the reference's dark forest edges and keep the central lake corridor open.

Expose instance counts by quality tier. Add a development statistic or test that reports expected instance counts and draw calls.

Verification:
- Run typecheck, lint, tests, and build.
- Inspect renderer statistics in development.

Acceptance criteria:
- Forest density frames both sides without obscuring the valley.
- Repeated trees do not create one draw call per tree.
- Low quality visibly reduces instance density.
```

## Prompt 10 — Generate the lemur blockout in Blender

```text
Execute Prompt 10 from docs/codex-execution-prompts.md.

Create `blender/scripts/generate_lemur.py`. Generate a faceted lemur blockout from low-resolution icospheres, wedges, tapered cylinders, and custom meshes. Build a named hierarchy or armature for root, pelvis, torso, chest, neck, head, ears, muzzle, eyes, arms, hands, legs, feet, and tail root. Place the lemur in a centered seated meditation pose and export `public/models/lemur.glb`.

At this step prioritize silhouette and proportions over facial detail. Also render deterministic front and three-quarter preview PNGs from Blender into `blender/generated/previews/` so the asset can be inspected without opening Blender. Add a typed React loader component and validate all required node names. Keep the Python generator modular rather than one enormous function.

Verification:
- Run typecheck, lint, tests, and build.
- Inspect the silhouette at desktop and mobile target sizes.

Acceptance criteria:
- The figure is immediately recognizable as a seated lemur-like character.
- The pose reads symmetrically from the hero camera.
- Body parts are organized into an animation-ready hierarchy.
- The GLB and preview renders are reproducible from the script without opening Blender's UI.
```

## Prompt 11 — Finish the lemur face, hands, and striped tail

```text
Execute Prompt 11 from docs/codex-execution-prompts.md.

Refine the scripted Blender lemur so it matches the reference more closely. Add the white facial mask, dark eye patches, amber eyes, black muzzle/nose, pale ears, defined meditation hands, crossed legs, and a prominent curled black-and-white striped tail across the foreground. Build the tail from tapered faceted segments following a deterministic curve.

Make the eyes and facial mask readable at mobile size. Keep material count controlled by reusing a small palette. Add script configuration for tail curve and stripe pattern. Regenerate the GLB and preview renders, then inspect both previews before integrating.

Verification:
- Run typecheck, lint, tests, and build.
- Inspect close and target-framing screenshots.

Acceptance criteria:
- The character is recognizable as a ring-tailed lemur.
- Amber eyes remain the facial focal point.
- Hands read as a meditation gesture.
- Tail silhouette resembles the reference and does not clip through the body.
```

## Prompt 12 — Animate breathing, blinking, ears, and tail

```text
Execute Prompt 12 from docs/codex-execution-prompts.md.

Extend the Blender generator to create and export named animation actions/clips for a 6–8 second breathing loop, blink, ear twitch, and slow tail idle. Use a simple armature or export-safe object transforms based on a small proof test. In Three.js, use AnimationMixer to run the breathing/tail loops and trigger irregular blink/ear one-shots with a controlled scheduler. Clean up mixers, timers, and listeners on unmount.

Create a centralized animation-state hook or controller. Validate required clip names in the GLB. Reduced-motion mode must stop tail/cloud motion and either freeze the character or retain only a minimal blink.

Verification:
- Run typecheck, lint, tests, and build.
- Add fake-timer tests for blink interval bounds and cleanup where practical.

Acceptance criteria:
- No visible loop pops.
- The pose remains calm and stable.
- Animation does not accumulate drift over time.
- Reduced motion produces a substantially quieter scene.
```

## Prompt 13 — Implement bounded pointer and scroll parallax

```text
Execute Prompt 13 from docs/codex-execution-prompts.md.

Add CameraRig and group-level parallax using the multipliers in the design document. Normalize pointer input, clamp it, and apply damping. Limit camera yaw/pitch to approximately 1–2 degrees and ensure the scene always covers the viewport. Add a small bounded scroll response that moves the camera forward and raises its target as the hero exits.

Disable pointer parallax on touch/coarse-pointer devices and in reduced-motion mode. Do not capture pointer events from the hero CTA.

Verification:
- Run typecheck, lint, tests, and build.
- Test extreme pointer positions and scroll limits.

Acceptance criteria:
- Foreground, lemur, forest, mountains, and clouds have visibly different motion depth.
- Scene edges never become visible.
- Camera returns smoothly to neutral.
- Semantic page controls remain fully interactive.
```

## Prompt 14 — Add responsive camera presets

```text
Execute Prompt 14 from docs/codex-execution-prompts.md.

Implement explicit desktop landscape, tablet portrait, and mobile portrait camera presets. Interpolate safely when breakpoints change rather than snapping if that can be done without complexity. Add visibility/detail rules for foreground objects that would crowd mobile. Keep the lemur in the lower-middle region, the sun near center, and the upper-center content safe zone clear.

Centralize camera presets and document their measured target viewport behavior. Add tests for preset selection.

Verification:
- Run typecheck, lint, tests, and build.
- Capture visual screenshots at 360x800, 768x1024, 1440x900, and 1920x1080 if browser tooling is available.

Acceptance criteria:
- All target aspect ratios present an intentional composition.
- No important character features are cropped.
- Mobile does not merely use the desktop camera with severe side cropping.
```

## Prompt 15 — Match lighting, palette, and atmospheric depth

```text
Execute Prompt 15 from docs/codex-execution-prompts.md.

Perform a deliberate visual-matching pass against images/yoge-lemur.png. Tune the warm horizon key light, cool ambient fill, fog, mountain saturation, lake gradient, tree values, rock palette, and lemur contrast. Add only a restrained vignette or color-grade pass if it materially improves matching and remains within budget. Avoid expensive bloom unless measurements support it.

Create a palette module with documented color roles. Remove temporary debug colors and placeholder objects.

Verification:
- Run typecheck, lint, tests, and build.
- Compare side-by-side screenshots at the primary desktop viewport.

Acceptance criteria:
- The scene evokes the same time of day and calm mood.
- Lemur remains the highest-contrast focal object.
- Hero text remains readable at the brightest animation state.
```

## Prompt 16 — Implement visibility pausing and quality tiers

```text
Execute Prompt 16 from docs/codex-execution-prompts.md.

Add high, medium, low, and poster-only quality tiers based on conservative capability checks and measured runtime performance. Configure DPR cap, tree/plant counts, water subdivisions, shadows, and optional effects per tier. Add IntersectionObserver and page visibility handling so expensive animation/rendering pauses when the hero or tab is not visible.

Avoid brittle user-agent detection. Provide a query-string or development override for testing every tier. Document selection behavior.

Verification:
- Run typecheck, lint, tests, and build.
- Test each forced quality tier and hidden/off-screen behavior.

Acceptance criteria:
- Every tier produces a valid intentional scene.
- Poster-only cleanly disables the canvas.
- Off-screen/hidden rendering work is substantially reduced or stopped.
```

## Prompt 17 — Harden accessibility and failure handling

```text
Execute Prompt 17 from docs/codex-execution-prompts.md.

Audit and improve accessibility and resilience. Ensure the decorative canvas is hidden from assistive technology and keyboard navigation. Verify hero content order, focus visibility, contrast, and reduced-motion behavior. Add a user-safe fallback for WebGL context loss, shader failure, and asset/runtime errors. Keep the poster permanently usable.

Add tests for the most important fallback and preference branches. Do not add controls inside the canvas.

Verification:
- Run typecheck, lint, tests, and build.
- Perform keyboard-only and reduced-motion checks.

Acceptance criteria:
- The page is fully usable without the canvas.
- No decorative 3D element enters the accessibility tree.
- Context loss or scene failure returns to the poster without losing hero content.
```

## Prompt 18 — Add automated visual and performance diagnostics

```text
Execute Prompt 18 from docs/codex-execution-prompts.md.

Add a repeatable browser-based visual test setup, preferably Playwright, with screenshots for the four approved viewports and at least reduced-motion plus poster-only variants. Add a development diagnostics overlay or test-accessible report for renderer draw calls, triangle count, geometries, textures, selected quality tier, and DPR. Keep diagnostics out of production by default.

Set pragmatic screenshot tolerances for animated WebGL or provide a deterministic visual-test mode that freezes animation time and procedural seeds.

Verification:
- Run typecheck, lint, unit tests, visual tests, and build.
- Record measured scene statistics in implementation-progress.md.

Acceptance criteria:
- Visual tests are deterministic enough for repeatable local runs.
- Metrics are available for all quality tiers.
- The documented desktop/mobile budgets can be evaluated from captured data.
```

## Prompt 19 — Optimize measured bottlenecks

```text
Execute Prompt 19 from docs/codex-execution-prompts.md.

Use the diagnostics from Prompt 18 to optimize actual bottlenecks. Reduce draw calls by sharing materials/geometries and instancing repeated objects. Reduce triangle count where it has little visual benefit. Remove unnecessary React per-frame state updates and object allocations. Confirm shaders and animation hooks do not recreate resources each frame.

Do not optimize blindly or reduce visible quality without before/after measurements. Record the measurements and decisions.

Verification:
- Run typecheck, lint, unit tests, visual tests, and build.
- Compare before/after draw calls, triangles, bundle size, and representative frame behavior.

Acceptance criteria:
- Performance improves measurably or the step documents that budgets were already met.
- Visual regression remains within approved tolerance.
- No new loading or fallback regression is introduced.
```

## Prompt 20 — Final integration and production handoff

```text
Execute Prompt 20 from docs/codex-execution-prompts.md.

Perform the production-readiness pass. Remove obsolete debug code and stale comments. Confirm environment-specific configuration is documented. Finalize README instructions for development, testing, building, rebuilding Blender assets headlessly, embedding the hero in another React application, changing copy, changing camera presets, changing the palette, and forcing quality tiers. Add a concise architecture section explaining the scripted-Blender workflow and Three.js runtime geometry.

Run the complete verification suite and create a final checklist in implementation-progress.md mapping results to the design document's definition of done. Do not claim success for tests or browsers that were not actually run.

Verification:
- Run typecheck, lint, all unit tests, all available visual tests, and production build.
- Report final output sizes and measured renderer statistics.

Acceptance criteria:
- A new developer can install, run, test, and build the project from README instructions.
- The poster fallback and all quality tiers work.
- The final implementation satisfies or explicitly documents exceptions to the definition of done.
```

## Optional upgrade prompts

These are deliberately outside the core sequence because the scripted-Blender implementation should be evaluated first.

### Optional A — Add a pure Three.js lemur fallback

```text
If Blender-generated assets cannot be built in a deployment or contributor environment, create a simplified Three.js primitive lemur with the same public component API, approximate named parts, reduced-motion behavior, and failure fallback. Keep the Blender GLB as the primary visual path. Verify that a failed GLB load switches to the simplified character without breaking the hero.
```

### Optional B — Create an editable generated Blender scene

```text
Extend the existing asset scripts to assemble a presentation-ready master `.blend` containing the low-poly environment and lemur, assigned materials, transform rig, matching camera, lights, and animation actions. The script must remain repeatable and must not require manual modeling. Document Blender 4.3.1 and the exact headless generation command. Treat the generated `.blend` as an inspectable deliverable; scripts remain the source of truth.
```

### Optional C — Replace only the scripted lemur with an external asset

```text
Create a typed adapter that can replace the generated Blender lemur with a commissioned or licensed GLB while preserving position, scale, animation state, reduced-motion behavior, shadows, quality tiers, and fallback behavior. Do not change the environment. Add validation for required nodes/clips and fall back to the generated `lemur.glb` or simplified Three.js character when the external asset is invalid or fails to load.
```
