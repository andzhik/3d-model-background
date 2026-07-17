/**
 * Central art-direction palette for the Yoga Lemur scene.
 *
 * Roles are ordered from distant atmosphere to foreground focal detail. Keep
 * authored GLB material names in MODEL_MATERIAL_PALETTE so a model cannot
 * silently bypass this module with stale export colors.
 */
export const SCENE_PALETTE = {
  // Air and light: cool overhead fill meeting a peach-gold horizon.
  skyZenith: '#7898c5',
  skyMiddle: '#aebed6',
  skyHorizon: '#f5bea7',
  skyLight: '#bed5f5',
  ambientFill: '#7488b4',
  groundFill: '#29334c',
  sunrise: '#ffd0a0',
  sunCore: '#fff0c8',
  fog: '#9aa9c4',

  // Clouds inherit the cool/warm split without becoming pure white.
  cloudFar: '#bec7dc',
  cloudNear: '#efc0b6',

  // Valley layers: lavender-blue depth with restrained coral sunward faces.
  mountainFar: '#526791',
  mountainCool: '#3d4f79',
  mountainViolet: '#51466f',
  mountainPeachLight: '#a96f79',

  // Lake: cyan foreground deepening to the distant valley and peach sun path.
  waterForeground: '#159fc2',
  waterHorizon: '#477baa',
  waterFacet: '#72c9d5',
  waterReflection: '#ffd0a1',

  // Shore and vegetation form a dark, green framing silhouette.
  shoreDark: '#26323b',
  shoreMoss: '#354940',
  forestFar: '#71817d',
  forestNear: '#536750',
  pineNeedle: '#829061',
  pineNeedleDark: '#536b50',
  pineTrunk: '#685046',
  reeds: '#718052',

  // Foreground rocks echo the mountain violets with warmer lit facets.
  rockSlate: '#4b5265',
  rockViolet: '#625a72',
  rockWarmFace: '#95716d',

  // The neutral lemur owns the scene's widest value range and warmest accent.
  lemurCharcoal: '#11141b',
  lemurGray: '#666873',
  lemurLight: '#d0cdc7',
  lemurEye: '#d77b17',
} as const

/** Maps stable authored material names to their runtime color roles. */
export const MODEL_MATERIAL_PALETTE = {
  MountainFarBlue: SCENE_PALETTE.mountainFar,
  MountainCoolBlue: SCENE_PALETTE.mountainCool,
  MountainViolet: SCENE_PALETTE.mountainViolet,
  MountainPeachLight: SCENE_PALETTE.mountainPeachLight,
  ShoreDark: SCENE_PALETTE.shoreDark,
  ShoreMoss: SCENE_PALETTE.shoreMoss,
  RockSlate: SCENE_PALETTE.rockSlate,
  RockViolet: SCENE_PALETTE.rockViolet,
  RockWarmFace: SCENE_PALETTE.rockWarmFace,
  LemurCharcoal: SCENE_PALETTE.lemurCharcoal,
  LemurGray: SCENE_PALETTE.lemurGray,
  LemurLight: SCENE_PALETTE.lemurLight,
  LemurEye: SCENE_PALETTE.lemurEye,
} as const

export type ModelMaterialName = keyof typeof MODEL_MATERIAL_PALETTE
