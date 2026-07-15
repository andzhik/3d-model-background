export type SceneStatus = 'loading' | 'ready' | 'fallback'

export type SceneAction = { type: 'first-frame' } | { type: 'failure' }

export function sceneStatusReducer(
  status: SceneStatus,
  action: SceneAction,
): SceneStatus {
  if (action.type === 'failure') return 'fallback'
  if (action.type === 'first-frame' && status === 'loading') return 'ready'
  return status
}
