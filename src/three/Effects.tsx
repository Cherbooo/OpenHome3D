import { EffectComposer, N8AO } from '@react-three/postprocessing'

/** Ambient occlusion only, tinted soft purple for the pastel-shadow cartoon look. */
export default function Effects() {
  return (
    <EffectComposer>
      <N8AO halfRes quality="performance" aoRadius={0.4} intensity={1.1} color="#9e8cc9" />
    </EffectComposer>
  )
}
