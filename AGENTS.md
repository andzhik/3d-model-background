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

Match verification to the prompt and explain what each check covers. Before
integration, prioritize the full-3D build, targeted GLB validation, review
renders, and visual inspection. Web tests/checks do not prove model quality;
run them when web code changes or integration makes them relevant.

If browser testing fails, pause, report the error, and fix it with the user.
Do not give up or claim browser verification.

If Git is missing or unusable, let the user fix it; do not change global Git
configuration. GitHub `origin` exists, but only push or open a PR when asked.

# Rules
- Generate commit message for meaningful changes
