# Yoga Lemur Interactive Background

## Design and implementation plan

Status: implementation-ready draft  
Reference: `images/yoge-lemur.png`  
Target: responsive website hero/background  
Rendering strategy: hybrid 2.5D/3D scene  

## 1. Purpose

Create a responsive, animated web background inspired by the supplied low-poly yoga lemur image. The result should preserve the original composition and mood while adding restrained depth, parallax, character motion, moving water, and atmospheric animation.

This is a background, not a game or unrestricted 3D viewer. Website content must remain readable, interaction must be subtle, and the page must still work when WebGL, animation, or high-performance rendering is unavailable.

## 2. Product goals

The finished experience must:

1. Read immediately as the same scene: meditating ring-tailed lemur, alpine lake, low-poly mountains, pine forest, and warm sunrise.
2. Add convincing depth without requiring every distant object to be full 3D geometry.
3. Run smoothly on current desktop and mobile browsers.
4. Preserve a stable camera composition behind website content.
5. load progressively, beginning with the supplied PNG as a poster image.
6. Respect reduced-motion, data-saving, and low-performance environments.
7. Be organized so individual assets and effects can be upgraded later.

## 3. Non-goals for the first release

The first release will not include:

- Free orbit, pan, or zoom controls.
- Physically accurate water or real-time planar reflections.
- A fully explorable landscape.
- Complex cloth, fur, fluid, or rigid-body simulation.
- Photorealistic rendering.
- Procedural terrain generation.
- User-controlled lemur poses.
- Exact reconstruction of hidden geometry from the reference image.

## 4. Core technical decisions

### 4.1 Application stack

- Vite for the build and development server.
- React and TypeScript for application structure.
- Three.js through React Three Fiber for rendering.
- `@react-three/drei` for loaders, helpers, and common scene utilities.
- Blender for modeling, rigging, animation, baking, and GLB export.
- glTF Binary (`.glb`) for production 3D assets.
- CSS for the poster fallback, foreground content, gradients, and readability overlays.

If the eventual host application is not React, the scene architecture can be ported to plain Three.js. The asset pipeline and scene design remain the same.

### 4.2 Rendering strategy

Use a hybrid scene:

- Full 3D for the lemur and nearest rocks/plants.
- Lightweight geometry for the lake and near shore.
- Instanced low-poly trees in the middle distance.
- Simplified layered mountain silhouettes rather than detailed terrain.
- Flat or gently shaded sky and cloud layers.
- Shader-based movement only where it produces a visible benefit.

This gives useful parallax and animation while avoiding the cost of reconstructing an entire valley.

### 4.3 Automated Blender asset path

Blender 4.3.1 is installed locally. Blender will be used as a scripted asset compiler; the user will not need to perform manual modeling.

- Codex writes version-controlled Python scripts under `blender/scripts/`.
- Scripts clear and rebuild their target Blender collections deterministically.
- Scripts generate faceted geometry, materials, named object hierarchies, simple animation actions, cameras, and preview lighting.
- Blender runs headlessly from an npm/PowerShell command and exports reproducible `.glb` assets under `public/models/`.
- Generated `.blend` files and preview renders may be retained for inspection, but Python scripts remain the source of truth.
- The Blender executable is resolved from `BLENDER_PATH`, with the detected local default of `D:\Program Files\Blender Foundation\Blender 4.3\blender.exe` documented in local setup instructions rather than hard-coded into application code.
- The web application validates exported node and animation names before using an asset.

Three.js procedural primitives remain useful for early blockouts, repeated instances, water, clouds, and fallback rendering. The final lemur should be generated in Blender because modifiers, object hierarchies, animation authoring, preview rendering, and glTF export are easier to validate there. Mountains, rocks, and tree source meshes may also be Blender-generated when this reduces web code or improves visual control.

### 4.4 Visual style

- Deliberately faceted, low-poly forms.
- Flat shading or controlled low-roughness faceted shading.
- Cool blue-violet mountains contrasted with warm peach sunlight.
- Saturated cyan-blue water with a restrained highlight path.
- Dark desaturated green trees.
- Lemur remains the highest-contrast object and focal point.
- No outlines unless later tests show they are needed for mobile readability.

## 5. Composition analysis

The supplied image uses a centered, symmetrical valley composition:

- The lemur occupies the lower central portion of the frame.
- The lake creates a horizontal middle plane and a path toward the sun.
- Mountains form two diagonals converging near the horizon.
- The sun and reflection create the central vertical light axis.
- Large rocks and plants frame both lower corners.
- Tall trees frame the left and right edges.
- The upper center contains relatively calm sky and is the best candidate for headline copy.

### 5.1 Responsive framing rules

Desktop landscape:

- Keep the lemur centered.
- Keep the sun close to the vertical center axis.
- Preserve both mountain walls and foreground corner framing.

Tablet portrait:

- Move the camera slightly backward rather than scaling the lemur independently.
- Allow outer mountain and tree edges to crop.
- Keep the lemur, sun, and main reflection visible.

Mobile portrait:

- Use a dedicated camera position and field of view.
- Keep the lemur in the lower-middle region.
- Reduce or hide some foreground rocks and edge trees.
- Preserve clear sky behind the primary headline.
- Avoid placing essential website controls over the lemur's face or hands.

### 5.2 Content safe zones

Default website content should occupy one of two approved zones:

1. Upper-center sky for centered hero copy.
2. Upper-left sky for left-aligned copy, with the left mountain exposure reduced through a CSS gradient.

The lemur's head, eyes, hands, torso silhouette, and tail should be treated as protected visual areas.

## 6. Scene architecture

Proposed scene graph:

```text
SceneRoot
├── Environment
│   ├── SkyGradient
│   ├── SunDisc
│   ├── CloudLayerFar
│   └── CloudLayerNear
├── DistantWorld
│   ├── MountainLayerFar
│   ├── MountainLayerLeft
│   ├── MountainLayerRight
│   └── DistantForest
├── MiddleWorld
│   ├── Lake
│   ├── SunReflection
│   ├── ShoreLeft
│   ├── ShoreRight
│   └── InstancedTrees
├── Foreground
│   ├── MeditationRock
│   ├── ForegroundRocks
│   ├── ForegroundPlants
│   └── LemurRig
├── Lighting
│   ├── HemisphereLight
│   ├── KeyDirectionalLight
│   └── OptionalRimLight
├── CameraRig
└── Effects
    ├── ColorGrade
    └── OptionalVignette
```

Every major group should have an independent parallax multiplier so motion can be tuned without editing asset geometry.

## 7. Asset specification

### 7.1 Lemur

The lemur is the priority asset and should receive most of the modeling effort.

Required features:

- Recognizable ring-tailed lemur head and ears.
- Orange or amber eyes.
- Seated lotus-like meditation pose.
- Hands forming a simple meditation gesture.
- Tail curled across the foreground.
- Faceted black, white, and gray material regions.
- Clean silhouette at mobile size.

Recommended construction for the default scripted-Blender path:

- A deterministic Blender Python generator creates the character from low-resolution icospheres, wedges, tapered cylinders, and custom polygon meshes.
- Named objects or bones represent root, pelvis, torso, chest, neck, head, ears, upper/lower arms, hands, legs, feet, eyelids, and tail segments.
- Flat shading and carefully positioned transform pivots preserve the faceted style and provide a lightweight rig.
- Eyelids are animated with small meshes, shape keys, or bones, whichever exports most reliably to glTF.
- Tail segments follow a scripted curve and use alternating black/white material regions.
- Separate eye material to preserve focal contrast.

Web fallback construction:

- A simplified Three.js primitive lemur can render while the GLB is unavailable or during early composition work.
- The procedural fallback preserves the same component API and named animation states where practical.

Animation clips:

| Clip | Duration | Loop | Description |
|---|---:|---|---|
| `idle_breathe` | 6–8 s | Yes | Small chest, shoulder, and head movement |
| `blink` | 0.15–0.25 s | No | Triggered at irregular intervals |
| `ear_twitch` | 0.4–0.7 s | No | Very occasional, low-amplitude motion |
| `tail_idle` | 8–12 s | Yes | Slow secondary motion without changing silhouette drastically |

Animations must not make the character look distracted or break the calm pose.

### 7.2 Mountains

- Build three to five depth layers.
- Use very low-poly triangulated silhouettes.
- Use vertex colors or a compact material palette rather than large textures.
- Increase atmospheric haze with distance.
- Distant layers should move less than near layers during parallax.

The mountains do not need to reproduce every ridge. Their silhouette, converging perspective, and color rhythm matter more than geological detail.

### 7.3 Lake

- Use one subdivided plane extending from foreground to horizon.
- Apply small vertex displacement or normal distortion.
- Use a vertical color gradient from bright foreground cyan to muted horizon blue.
- Create the sunlight reflection as a separate animated strip or shader mask.
- Fake mountain reflections through blurred/stretched colors rather than rendering the scene twice.

Water motion must remain slow enough that it does not compete with page content.

### 7.4 Trees

- Create two to four pine variants.
- Use instanced meshes for repeated trees.
- Reduce scale and saturation with distance.
- Use only a few material colors per tree.
- Do not animate every tree. A very small shared sway on near trees is sufficient.

### 7.5 Rocks and plants

- Build rocks from simplified irregular polyhedra.
- Use color variation by face or vertex color.
- Model only enough foreground plants to preserve the reference framing.
- Hide nonessential foreground assets at narrow responsive breakpoints.

### 7.6 Clouds and sun

- Clouds can be low-poly meshes or transparent cards with no cast shadows.
- Use at least two depth/speed groups.
- The sun can be an emissive disc or sprite.
- Use restrained bloom only if it remains cheap and does not wash out text.

## 8. Interaction and animation design

### 8.1 Pointer parallax

- Normalize pointer position to `-1..1` on both axes.
- Apply damping so the camera eases toward the target.
- Limit yaw and pitch to approximately 1–2 degrees.
- Move the camera position slightly as well as its target.
- Return slowly to neutral when the pointer leaves.
- Disable or substantially reduce pointer response on touch devices.

Suggested relative parallax multipliers:

| Group | Multiplier |
|---|---:|
| Sky | 0.00 |
| Far clouds | 0.05 |
| Far mountains | 0.08 |
| Near mountains | 0.16 |
| Forest/shore | 0.25 |
| Lemur | 0.35 |
| Foreground rocks/plants | 0.50 |

These values are starting points, not final constants.

### 8.2 Scroll response

For the first release, scrolling should only:

- Move the camera forward a small amount.
- Raise the camera target slightly.
- Increase atmospheric haze or lower scene opacity as the hero exits.

Do not rotate the scene dramatically or detach the lemur from the composition.

### 8.3 Ambient motion

- Run breathing continuously.
- Schedule blinking with randomized intervals, approximately every 4–9 seconds.
- Drift cloud layers continuously at different speeds.
- Advance water shader time only while the canvas is visible.
- Use an intersection observer to pause rendering when the hero is off-screen.

### 8.4 Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Disable pointer and scroll parallax.
- Freeze clouds and tail motion.
- Either retain only extremely subtle breathing/blinking or render a static frame.
- Avoid unnecessary continuous rendering.

## 9. Lighting and materials

### 9.1 Lighting plan

- Warm directional key light from the horizon/sun direction.
- Cool hemisphere or ambient fill from the sky.
- Optional low-cost rim light for the lemur silhouette.
- Baked ambient occlusion where it materially improves the lemur and foreground.
- No dynamic shadows on distant scenery.
- If shadows are enabled, restrict them to the lemur and meditation rock.

### 9.2 Material plan

- Prefer `MeshStandardMaterial`, `MeshLambertMaterial`, or unlit materials depending on the asset.
- Use flat shading for visible facets.
- Prefer vertex colors to texture maps for mountains, rocks, and plants.
- Keep the number of unique materials low to reduce draw calls.
- Use transparent materials sparingly and carefully order cloud layers.

## 10. Performance budget

Initial targets:

| Metric | Desktop target | Mobile target |
|---|---:|---:|
| Visible triangles | ≤ 150k | ≤ 70k |
| Draw calls | ≤ 80 | ≤ 50 |
| Initial 3D payload | ≤ 5 MB | ≤ 3 MB preferred |
| Texture memory | ≤ 64 MB | ≤ 32 MB preferred |
| Frame rate | 60 fps target | 30–60 fps |
| Device pixel ratio | cap at 1.5 | cap at 1.25–1.5 |

Optimization rules:

- Use mesh instancing for trees and repeated rocks where practical.
- Merge static meshes that share materials.
- Use Draco or Meshopt compression for geometry.
- Use KTX2/Basis compression if image textures become necessary.
- Avoid real-time reflections and unnecessary post-processing.
- Preload only the first required asset set.
- Lazy-load optional enhancements after the basic scene is visible.
- Use demand-based rendering if ambient animation is disabled.
- Provide low and high quality configurations selected from measured capability.

## 11. Progressive enhancement and fallback

Loading sequence:

1. Render the supplied PNG immediately as a CSS background/poster.
2. Render hero content and controls normally over the poster.
3. Detect WebGL support and user motion/data preferences.
4. Load the core GLB and scene code.
5. Fade the WebGL canvas in only after the first correct frame is ready.
6. Keep the poster behind the canvas to prevent blank or flashing frames.
7. If loading or rendering fails, remove the canvas and retain the poster.

Fallback conditions should include:

- WebGL unavailable.
- Asset load failure.
- Severe performance degradation.
- Optional explicit low-data mode.
- Automated crawlers or server-rendered initial output.

## 12. Accessibility and page integration

- Treat the canvas as decorative with `aria-hidden="true"` unless meaningful interactive controls are later added.
- Keep all important copy and actions in semantic HTML outside the canvas.
- Meet contrast requirements using a configurable CSS overlay, text shadow, or gradient scrim.
- Do not use motion as the only way to convey information.
- Ensure keyboard navigation never enters decorative canvas elements.
- Respect reduced motion.
- Ensure the poster fallback conveys the same decorative context.

## 13. Proposed project structure

```text
lemur-background/
├── docs/
│   └── scene-design-and-implementation-plan.md
├── images/
│   └── yoge-lemur.png
├── public/
│   ├── models/
│   │   ├── lemur.glb
│   │   ├── environment-core.glb
│   │   └── environment-detail.glb
│   └── textures/
├── src/
│   ├── components/
│   │   ├── Hero.tsx
│   │   └── SceneBackground.tsx
│   ├── scene/
│   │   ├── Experience.tsx
│   │   ├── CameraRig.tsx
│   │   ├── Environment.tsx
│   │   ├── Lemur.tsx
│   │   ├── Lake.tsx
│   │   ├── Mountains.tsx
│   │   ├── Trees.tsx
│   │   ├── Atmosphere.tsx
│   │   ├── QualityController.tsx
│   │   ├── constants.ts
│   │   └── shaders/
│   ├── hooks/
│   │   ├── useReducedMotion.ts
│   │   ├── useSceneVisibility.ts
│   │   └── useQualityTier.ts
│   ├── styles/
│   │   └── hero.css
│   ├── App.tsx
│   └── main.tsx
├── blender/
│   ├── scripts/
│   │   ├── generate_environment.py
│   │   ├── generate_lemur.py
│   │   └── shared.py
│   ├── generated/
│   │   ├── previews/
│   │   └── source-scene.blend
│   └── README.md
├── tests/
│   └── visual/
├── package.json
├── vite.config.ts
└── README.md
```

Large binary source files may eventually belong in Git LFS or external asset storage, depending on repository policy.

## 14. Implementation phases

### Phase 0 — Confirm direction

Tasks:

- Confirm React/TypeScript as the host stack.
- Confirm whether the hero copy is centered or left-aligned.
- Confirm target browsers and minimum mobile device tier.
- Confirm whether the first implementation may use temporary procedural geometry while the final Blender assets are produced.
- Establish whether the intent is close reproduction or broader visual inspiration.

Exit criteria:

- Technical assumptions accepted or amended.
- One desktop and one mobile composition target approved.

### Phase 1 — Scaffold and static hero

Tasks:

- Initialize the Vite React TypeScript project.
- Add linting and formatting.
- Build semantic hero markup.
- Use the reference image as a responsive poster background.
- Add content safe-zone styles and readability overlay.
- Add a canvas container without 3D content.

Exit criteria:

- Hero is responsive at 360×800, 768×1024, 1440×900, and 1920×1080.
- No layout shift when the future canvas is mounted.
- The page remains usable with JavaScript disabled.

### Phase 2 — 3D proof of concept

Tasks:

- Install Three.js, React Three Fiber, and Drei.
- Create the renderer, camera, lights, and resize behavior.
- Reproduce the composition using primitive placeholder geometry.
- Create layered mountain silhouettes.
- Create a basic lake plane and sun.
- Add bounded pointer parallax.
- Crossfade from poster to canvas.

Exit criteria:

- Depth reads clearly without final assets.
- Camera framing works on desktop and mobile.
- Pointer motion never exposes the edges of the scene.
- Poster remains available as a fallback.

### Phase 3 — Scripted environment asset pass

Tasks:

- Generate mountain, shore, rock, and tree source assets through version-controlled Blender Python scripts where useful.
- Keep repeated placement, lightweight plants, clouds, and shader effects in TypeScript.
- Assign flat-shaded materials and vertex colors.
- Keep generation and placement deterministic through fixed seeds.
- Export and validate production GLBs headlessly.
- Add instanced trees.
- Implement atmospheric depth and color matching.
- Replace placeholders incrementally.

Exit criteria:

- Environment matches the reference silhouette and palette.
- Asset sizes and draw calls remain within budget.
- No obvious seams appear at maximum parallax offset.

### Phase 4 — Script-generated lemur and rig

Tasks:

- Generate the lemur from scripted faceted primitives in Blender.
- Validate the silhouette at desktop and mobile sizes.
- Build and test a named object hierarchy or small armature.
- Generate breathing, blink, ear, and tail animation clips through the script.
- Export GLB and validate required nodes, materials, and animation clips.
- Integrate animation mixing and randomized one-shot actions in Three.js.

Exit criteria:

- Pose and facial read match the reference.
- Loops contain no visible pops.
- Hands, face, and tail remain stable under all camera presets.
- Animation can be disabled cleanly.

### Phase 5 — Water and atmospheric polish

Tasks:

- Implement lightweight water motion.
- Add the stylized sun reflection.
- Tune cloud drift.
- Tune haze, lighting, exposure, and color grading.
- Add restrained bloom or vignette only if performance allows.

Exit criteria:

- Water reads as water without real-time reflection.
- Effects do not reduce copy contrast.
- Mobile performance remains within target.

### Phase 6 — Performance and resilience

Tasks:

- Profile draw calls, triangles, GPU time, memory, and load size.
- Add quality tiers.
- Add viewport visibility pausing.
- Add reduced-motion behavior.
- Test network failure and WebGL failure paths.
- Compress production models and textures.
- Remove unused scene objects, materials, and dependencies.

Exit criteria:

- No blank state during loading or failure.
- Desktop reaches the target frame rate on representative hardware.
- Mobile remains responsive and thermally reasonable.
- Reduced-motion behavior is verified.

### Phase 7 — Visual QA and handoff

Tasks:

- Capture reference screenshots at all target viewports.
- Compare focal placement, horizon, palette, and safe zones.
- Verify Chromium, Firefox, Safari, iOS Safari, and Android Chrome as available.
- Document asset replacement and export procedures.
- Add production build and deployment instructions.

Exit criteria:

- Visual regression baselines approved.
- No critical browser or accessibility defects.
- Another developer can rebuild and replace assets using the documentation.

## 15. Quality-tier behavior

### High

- Full environment detail.
- Higher instance count.
- Dynamic lemur shadow.
- Full water displacement and optional restrained post-processing.
- DPR capped at 1.5.

### Medium

- Reduced tree count.
- Lower water subdivision.
- Static or cheaper shadow.
- No optional post-processing.
- DPR capped around 1.25.

### Low

- Simplified GLB or reduced scene groups.
- Minimal water animation.
- No shadows or post-processing.
- Reduced ambient animations.
- DPR capped at 1.0.

### Fallback

- Supplied image only.
- CSS gradient/readability overlay.
- No canvas.

Quality selection must be conservative. It is better to promote a device after measuring stable performance than to begin with an expensive scene that stutters.

## 16. Testing plan

### Functional tests

- Poster appears before WebGL content.
- Canvas fades in only after a valid frame.
- Asset errors return to the poster.
- Pointer parallax is bounded.
- Scroll behavior is bounded.
- Animations pause when the scene is not visible.
- Reduced-motion preferences are honored.

### Visual tests

- Lemur remains centered at approved viewports.
- Sun/reflection axis remains coherent.
- Content never overlaps protected regions unexpectedly.
- Scene edges never become visible during parallax.
- Color and exposure remain close to the mockup.
- Canvas/poster transition does not flash.

### Performance tests

- Record initial JS, GLB, and texture payload sizes.
- Record draw calls and triangle counts for each quality tier.
- Measure frame pacing, not only average frames per second.
- Test under CPU and network throttling.
- Test a representative integrated-GPU laptop and mid-tier mobile device.

### Accessibility tests

- Keyboard navigation ignores the decorative canvas.
- Screen readers encounter meaningful hero content only.
- Text contrast passes with the scene at its brightest frame.
- Reduced-motion mode removes significant motion.

## 17. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Lemur model does not match the reference | High | Approve silhouette and untextured turntable before rigging |
| Mobile portrait crop loses the composition | High | Design a dedicated mobile camera and hide edge assets |
| Scene payload is too large | High | Split core/detail GLBs, compress, and load progressively |
| Water shader is distracting or slow | Medium | Use a separate reflection strip and low-cost displacement |
| Text becomes unreadable | High | Maintain safe zones and configurable CSS scrims |
| Pointer movement causes nausea | Medium | Keep motion small, damped, and removable |
| WebGL fails | High | Retain the poster as a permanent underlying fallback |
| Flat-shaded export inflates vertex count | Medium | Measure exported geometry and simplify before export |
| Asset work blocks code progress | Medium | Use procedural placeholder geometry in early phases |

## 18. Definition of done

The feature is complete when:

- The final scene clearly evokes the supplied mockup.
- Desktop and mobile compositions are approved.
- The lemur has subtle, polished idle animation.
- Water, clouds, and parallax add depth without distracting from content.
- Performance budgets are met or explicitly revised from measurements.
- The poster fallback works under loading, failure, reduced capability, and no-WebGL conditions.
- Accessibility requirements are met.
- Production build and integration instructions are documented.
- Blender generators, web generators, and exported assets can be reproduced by another developer.

## 19. Recommended starting point

Begin with Phases 1 and 2, using only the existing reference image and procedural placeholder geometry. Do not begin by building the final lemur model. The proof of concept should first validate:

1. Responsive camera composition.
2. Content safe zones.
3. Parallax strength.
4. Poster-to-canvas loading behavior.
5. Approximate performance cost.

Once those are approved, freeze the camera and composition. Blender and web generators can then target a known scene instead of repeatedly adapting to changing web layouts.

## 20. Decisions required before implementation

The following answers should be recorded at the top of the implementation issue or README:

- Host stack: React/TypeScript as proposed, or another framework?
- Hero copy layout: centered or upper-left?
- Visual fidelity: close reproduction or inspired reinterpretation?
- Mobile policy: simplified 3D or static poster on lower-tier phones?
- Asset strategy: scripted Blender GLBs as proposed, pure web geometry, commissioned asset, or licensed base model?
- Target launch constraints: browser support, maximum payload, and deadline?

Unless changed, implementation should proceed with these defaults:

- React + TypeScript + Vite.
- Centered hero copy in the upper sky.
- Close visual reproduction with simplified distant geometry.
- Simplified 3D on mobile with automatic static fallback.
- Scripted Blender GLB for the lemur and selected environment meshes; procedural Three.js for dynamic and repeated elements.
- Current evergreen desktop and mobile browsers.

## 21. Reference documentation

- Three.js fundamentals: <https://threejs.org/manual/en/fundamentals.html>
- Three.js WebGL renderer: <https://threejs.org/docs/pages/WebGLRenderer.html>
- React Three Fiber documentation: <https://r3f.docs.pmnd.rs/>
- Blender glTF 2.0 export: <https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html>
