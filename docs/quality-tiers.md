# Scene quality tiers and visibility behavior

Prompt 16 selects an intentionally conservative starting tier from capability
signals, then adjusts it from sustained runtime measurements. Selection never
uses a browser, operating-system, or device-model name.

## Selection order

1. `?quality=high`, `?quality=medium`, `?quality=low`, or
   `?quality=poster-only` forces a tier and disables runtime adaptation. This is
   available in development and production so the same URL can be used for QA.
2. Save-Data, when exposed by the browser, selects `poster-only`. Missing WebGL
   also uses the permanent poster fallback.
3. At most 4 logical processors or at most 4 GB reported device memory starts
   at low. Devices reporting at least 8 for both signals start at high. Missing
   or mixed capability signals start at medium.
4. After a 30-frame warm-up, 120 active frames are measured. Hysteresis promotes
   a consistently fast low/medium scene or demotes a slow high/medium scene one
   tier at a time. Low falls back to the poster after severe sustained slowdown.
   Changes have an eight-second cooldown. Resume gaps and debugger pauses are
   excluded from the sample.

The development Scene debug panel can override all four tiers during a session.
A query override remains authoritative when both are present.

## Tier contract

| Tier        | DPR cap | Vegetation (far/near/plants) |        Water grid | Shadows      | Optional detail                  |
| ----------- | ------: | ---------------------------: | ----------------: | ------------ | -------------------------------- |
| High        |     1.5 |                 72 / 42 / 54 | 48 × 64, animated | Lemur shadow | Both cloud layers and reflection |
| Medium      |    1.25 |                 48 / 28 / 36 | 32 × 40, animated | Off          | Both cloud layers and reflection |
| Low         |     1.0 |                 24 / 14 / 18 |   16 × 20, static | Off          | Far clouds and reflection        |
| Poster-only |     N/A |                    0 / 0 / 0 |          Disabled | Off          | Canvas is not mounted            |

Responsive camera rules can hide additional near detail on narrow viewports.
They do not raise a quality tier's configured cost.

## Pausing

The scene wrapper is observed with `IntersectionObserver`, and tab state is read
from the Page Visibility API. React Three Fiber switches its frame loop to
`never` while the hero is off-screen, the tab is hidden, or the visible 3D toggle
is off. Existing GPU resources stay mounted for a quick resume, but continuous
rendering, shader updates, mixers, and other `useFrame` work stop. The wrapper's
lemur animation timers are also cleaned up until resume. The wrapper's
`data-scene-active` attribute and the development panel expose the current state
for verification.
