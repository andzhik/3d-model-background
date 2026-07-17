import { WATER_CONFIG } from './constants'

export function getWaterAnimationTime(
  elapsedSeconds: number,
  reducedMotion: boolean,
): number {
  return reducedMotion ? 0 : elapsedSeconds * WATER_CONFIG.speed
}

export const WATER_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uAmplitude;
  varying vec2 vUv;
  varying float vRipple;

  float triangleWave(float value) {
    return abs(fract(value) - 0.5) * 2.0;
  }

  void main() {
    vUv = uv;
    vec3 displaced = position;
    float longWave = triangleWave(position.y * 0.42 + uTime) - 0.5;
    float crossWave = triangleWave(position.x * 0.31 - position.y * 0.14 - uTime * 0.7) - 0.5;
    vRipple = longWave * 0.7 + crossWave * 0.3;
    displaced.z += vRipple * uAmplitude;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
  }
`

export const WATER_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uForegroundColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uFacetColor;
  varying vec2 vUv;
  varying float vRipple;

  void main() {
    float depthBlend = smoothstep(0.04, 0.96, vUv.y);
    vec3 depthColor = mix(uForegroundColor, uHorizonColor, depthBlend);
    float facet = smoothstep(0.18, 0.48, vRipple) * (1.0 - depthBlend * 0.65);
    gl_FragColor = vec4(mix(depthColor, uFacetColor, facet * 0.34), 1.0);
  }
`

export const REFLECTION_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uReflectionColor;
  uniform float uTime;
  uniform float uReflectionWidth;
  varying vec2 vUv;
  varying float vRipple;

  void main() {
    float centeredX = abs(vUv.x - 0.5) * uReflectionWidth;
    float pathWidth = mix(0.46, 0.09, smoothstep(0.0, 1.0, vUv.y));
    float horizontalMask = 1.0 - smoothstep(pathWidth * 0.52, pathWidth, centeredX);

    float movingBands = sin(vUv.y * 118.0 - uTime * 3.2 + vRipple * 7.0);
    float broadBreaks = sin(vUv.y * 34.0 + uTime * 1.6);
    float brokenMask = smoothstep(0.18, 0.72, movingBands) * smoothstep(-0.6, 0.35, broadBreaks);
    float horizonFade = smoothstep(0.02, 0.18, vUv.y) * (1.0 - smoothstep(0.91, 1.0, vUv.y));
    float alpha = horizontalMask * brokenMask * horizonFade * 0.38;

    gl_FragColor = vec4(uReflectionColor, alpha);
  }
`
