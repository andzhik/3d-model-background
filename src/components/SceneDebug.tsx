import { type ChangeEvent } from 'react'

import { MAJOR_GROUPS, type MajorGroup } from '../scene/constants'
import type { CameraPresetName } from '../scene/cameraPresets'
import type { SceneDebugSettings } from '../scene/debug'
import type { RendererStatistics } from '../scene/debug'
import type { SceneQuality } from '../scene/quality'
import { getVegetationMetrics } from '../scene/vegetationLayout'

interface SceneDebugProps {
  settings: SceneDebugSettings
  onChange: (settings: SceneDebugSettings) => void
  quality: SceneQuality
  onQualityChange: (quality: SceneQuality) => void
  rendererStatistics: RendererStatistics | null
  cameraPreset: CameraPresetName
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

function Slider({ label, value, min, max, step, onChange }: SliderProps) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
      />
      <output>{value.toFixed(1)}</output>
    </label>
  )
}

const DEBUG_QUALITY_TIERS = ['high', 'medium', 'low'] as const

export function SceneDebug({
  settings,
  onChange,
  quality,
  onQualityChange,
  rendererStatistics,
  cameraPreset,
}: SceneDebugProps) {
  const vegetation = getVegetationMetrics(quality)
  const setNumber =
    (key: keyof Omit<SceneDebugSettings, 'cameraOffset' | 'visibility'>) =>
    (value: number) =>
      onChange({ ...settings, [key]: value })

  const setCameraAxis = (axis: number) => (value: number) => {
    const position: [number, number, number] = [...settings.cameraOffset]
    position[axis] = value
    onChange({ ...settings, cameraOffset: position })
  }

  const setVisibility =
    (group: MajorGroup) => (event: ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...settings,
        visibility: {
          ...settings.visibility,
          [group]: event.currentTarget.checked,
        },
      })
    }

  return (
    <details className="scene-debug">
      <summary>Scene debug</summary>
      <div className="scene-debug__controls">
        <label>
          <span>Quality</span>
          <select
            value={quality}
            onChange={(event) =>
              onQualityChange(event.currentTarget.value as SceneQuality)
            }
          >
            {DEBUG_QUALITY_TIERS.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
        </label>
        <Slider
          label="Camera X offset"
          value={settings.cameraOffset[0]}
          min={-3}
          max={3}
          step={0.1}
          onChange={setCameraAxis(0)}
        />
        <Slider
          label="Camera Y offset"
          value={settings.cameraOffset[1]}
          min={-3}
          max={3}
          step={0.1}
          onChange={setCameraAxis(1)}
        />
        <Slider
          label="Camera Z offset"
          value={settings.cameraOffset[2]}
          min={-3}
          max={3}
          step={0.1}
          onChange={setCameraAxis(2)}
        />
        <Slider
          label="FOV offset"
          value={settings.fovOffset}
          min={-20}
          max={20}
          step={1}
          onChange={setNumber('fovOffset')}
        />
        <Slider
          label="Fog near"
          value={settings.fogNear}
          min={0}
          max={50}
          step={0.5}
          onChange={setNumber('fogNear')}
        />
        <Slider
          label="Fog far"
          value={settings.fogFar}
          min={1}
          max={100}
          step={0.5}
          onChange={setNumber('fogFar')}
        />
        <Slider
          label="Key light"
          value={settings.lightIntensity}
          min={0}
          max={8}
          step={0.1}
          onChange={setNumber('lightIntensity')}
        />
        <fieldset>
          <legend>Major groups</legend>
          {MAJOR_GROUPS.map((group) => (
            <label key={group}>
              <input
                type="checkbox"
                checked={settings.visibility[group]}
                onChange={setVisibility(group)}
              />
              <span>{group}</span>
            </label>
          ))}
        </fieldset>
        <dl className="scene-debug__statistics">
          <div>
            <dt>Camera preset</dt>
            <dd>{cameraPreset}</dd>
          </div>
          <div>
            <dt>Vegetation</dt>
            <dd>{vegetation.totalInstances} instances</dd>
          </div>
          <div>
            <dt>Vegetation calls</dt>
            <dd>{vegetation.expectedDrawCalls} expected</dd>
          </div>
          <div>
            <dt>Renderer</dt>
            <dd>
              {rendererStatistics
                ? `${rendererStatistics.drawCalls} calls / ${rendererStatistics.triangles} triangles`
                : 'waiting for frame'}
            </dd>
          </div>
        </dl>
      </div>
    </details>
  )
}
