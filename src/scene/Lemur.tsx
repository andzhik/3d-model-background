import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'

import { LEMUR_CONFIG } from './constants'
import { validateLemurNodes } from './lemurAsset'

interface LemurProps {
  visible?: boolean
}

export function Lemur({ visible = true }: LemurProps) {
  const { nodes } = useGLTF(LEMUR_CONFIG.modelUrl)
  const root = useMemo(() => {
    const validated = validateLemurNodes(nodes)
    return validated.Root.clone(true)
  }, [nodes])

  return (
    <group
      name="LemurRig"
      visible={visible}
      position={LEMUR_CONFIG.position}
      rotation={LEMUR_CONFIG.rotation}
      scale={LEMUR_CONFIG.scale}
      dispose={null}
    >
      <primitive object={root} />
    </group>
  )
}

useGLTF.preload(LEMUR_CONFIG.modelUrl)
