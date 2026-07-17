import { describe, expect, it } from 'vitest'

import {
  CAMERA_BREAKPOINTS,
  CAMERA_PRESETS,
  getCameraPreset,
  selectCameraPresetName,
} from './cameraPresets'

describe('responsive camera preset selection', () => {
  it.each([
    [{ width: 1440, height: 900 }, 'desktop-landscape'],
    [{ width: 1920, height: 1080 }, 'desktop-landscape'],
    [{ width: 768, height: 1024 }, 'tablet-portrait'],
    [{ width: 360, height: 800 }, 'mobile-portrait'],
  ] as const)('selects %s as %s', (viewport, expected) => {
    expect(selectCameraPresetName(viewport)).toBe(expected)
    expect(getCameraPreset(viewport)).toBe(CAMERA_PRESETS[expected])
  })

  it('uses the mobile width boundary only in portrait orientation', () => {
    const boundary = CAMERA_BREAKPOINTS.mobilePortraitMaxWidth

    expect(
      selectCameraPresetName({ width: boundary, height: boundary + 1 }),
    ).toBe('mobile-portrait')
    expect(
      selectCameraPresetName({ width: boundary + 1, height: boundary + 2 }),
    ).toBe('tablet-portrait')
    expect(selectCameraPresetName({ width: boundary, height: boundary })).toBe(
      'desktop-landscape',
    )
  })

  it('falls back safely when dimensions are unusable', () => {
    expect(selectCameraPresetName({ width: 0, height: 800 })).toBe(
      'desktop-landscape',
    )
    expect(selectCameraPresetName({ width: Number.NaN, height: 800 })).toBe(
      'desktop-landscape',
    )
  })

  it('removes mobile foreground details without hiding the focal character', () => {
    expect(CAMERA_PRESETS['mobile-portrait'].details).toEqual({
      rockField: false,
      framingRocks: false,
      nearForest: false,
      foregroundPlants: false,
    })
    expect(CAMERA_PRESETS['desktop-landscape'].details).toEqual({
      rockField: true,
      framingRocks: true,
      nearForest: true,
      foregroundPlants: true,
    })
  })
})
