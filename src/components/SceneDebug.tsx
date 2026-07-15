import { type ChangeEvent } from 'react'

import { MAJOR_GROUPS, type MajorGroup } from '../scene/constants'
import type { SceneDebugSettings } from '../scene/debug'

interface SceneDebugProps {
  settings: SceneDebugSettings
  onChange: (settings: SceneDebugSettings) => void
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

export function SceneDebug({ settings, onChange }: SceneDebugProps) {
  const setNumber =
    (key: keyof Omit<SceneDebugSettings, 'cameraPosition' | 'visibility'>) =>
    (value: number) =>
      onChange({ ...settings, [key]: value })

  const setCameraAxis = (axis: number) => (value: number) => {
    const position: [number, number, number] = [...settings.cameraPosition]
    position[axis] = value
    onChange({ ...settings, cameraPosition: position })
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
        <Slider
          label="Camera X"
          value={settings.cameraPosition[0]}
          min={-10}
          max={10}
          step={0.1}
          onChange={setCameraAxis(0)}
        />
        <Slider
          label="Camera Y"
          value={settings.cameraPosition[1]}
          min={-10}
          max={10}
          step={0.1}
          onChange={setCameraAxis(1)}
        />
        <Slider
          label="Camera Z"
          value={settings.cameraPosition[2]}
          min={1}
          max={15}
          step={0.1}
          onChange={setCameraAxis(2)}
        />
        <Slider
          label="Field of view"
          value={settings.fov}
          min={20}
          max={90}
          step={1}
          onChange={setNumber('fov')}
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
      </div>
    </details>
  )
}
