# Responsive camera presets

The scene selects one of three explicit presets from the live viewport. Portrait viewports up to 640 CSS pixels wide use mobile; wider portrait viewports use tablet; landscape and square viewports use desktop. Camera position and field of view use frame-rate-independent damping (`6`) when the selected preset changes. Reduced-motion mode applies the new pose immediately.

## Measured target behavior

The values below use the centered, neutral-parallax pose. Lemur measurements project its authored feature envelope (tail edge, head top, and feet) through each camera; sun measurements project the configured disc center. Percentages are relative to the viewport from its top or left edge.

| Target viewport | Selected preset   | Position / FOV          | Lemur envelope     | Sun center   | Detail behavior                                                    |
| --------------- | ----------------- | ----------------------- | ------------------ | ------------ | ------------------------------------------------------------------ |
| 1440×900        | desktop landscape | `[0, 0.8, 8]` / `44°`   | x 36–64%, y 48–80% | x 38%, y 52% | Full rocks, near forest, and reeds                                 |
| 1920×1080       | desktop landscape | `[0, 0.8, 8]` / `44°`   | x 38–62%, y 48–80% | x 40%, y 52% | Full rocks, near forest, and reeds                                 |
| 768×1024        | tablet portrait   | `[0, 0.5, 6.8]` / `46°` | x 17–83%, y 43–79% | x 30%, y 50% | Rock field, near forest, and reeds; oversized framing rocks hidden |
| 360×800         | mobile portrait   | `[0, 1, 9.7]` / `49°`   | x 14–86%, y 51–75% | x 30%, y 53% | Near forest, reeds, field rocks, and framing rocks hidden          |

The upper-center safe zone extends through the CTA at roughly 47% of the tallest measured content stack. The sun shifts left of the content column and the desktop lemur begins below that boundary; portrait presets preserve at least six percentage points of separation below their shorter content stacks. The mobile horizontal envelope includes the full authored striped tail with roughly 10% clearance on each edge before bounded parallax, so it does not rely on desktop side cropping.

These are projection measurements, not pixel recognition from a screenshot. Visual captures at the four target viewports remain the final composition check because mountain silhouettes, fog, and animated poses affect perceived balance without changing the camera contract.
