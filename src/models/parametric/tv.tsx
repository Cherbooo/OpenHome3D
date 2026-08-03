import { Edged, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** TV: thin 16:9 panel on a small stand. Screen faces +z. */
export default function Tv({ params, selected }: ParametricProps) {
  const w = num(params, 'Width', 1.1)
  const panelH = (w * 9) / 16
  const standH = 0.12
  return (
    <group>
      <Edged selected={selected} color={PALETTE.ink} position={[0, 0.0125, 0]}>
        <boxGeometry args={[Math.min(0.45, w * 0.4), 0.025, 0.24]} />
      </Edged>
      <Edged selected={selected} color={PALETTE.ink} position={[0, standH / 2 + 0.01, 0]}>
        <boxGeometry args={[0.07, standH, 0.04]} />
      </Edged>
      <Edged selected={selected} color={PALETTE.blue} position={[0, standH + panelH / 2 + 0.01, 0]}>
        <boxGeometry args={[w, panelH, 0.035]} />
      </Edged>
    </group>
  )
}
