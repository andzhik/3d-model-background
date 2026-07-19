# Project guidance

The responsive low-poly background is stable. Keep background composition,
lighting, camera behavior, performance tiers, and fallbacks unchanged unless a
task explicitly requires an integration adjustment.

The active character goal is a new, complete 3D low-poly lemur that works from
all viewing angles and is suitable for skeletal animation. Follow
`docs/full-3d-lemur-plan.md` and execute
`docs/full-3d-lemur-prompts.md` one prompt at a time.

Build Blender assets deterministically from source-controlled Python. Develop
the character as a staging asset and do not replace the production GLB until
the integration prompt is approved. Preserve `images/yoge-lemur.png` as the
visual reference and poster.

Use `npm run assets:validate`, `npm run typecheck`, `npm run lint`, `npm test`,
and `npm run build` as relevant verification.

# Rules
- Generate commit message for meaningful changes
