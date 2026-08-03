import { Edged, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Stool: round seat on three legs. */
export default function Stool({ params, selected }: ParametricProps) {
  const size = num(params, 'Size', 0.36)
  const h = 0.45
  const legR = size * 0.32
  return (
    <group>
      <Edged selected={selected} color={PALETTE.coral} position={[0, h - 0.025, 0]}>
        <cylinderGeometry args={[size / 2, size / 2, 0.05, 20]} />
      </Edged>
      {[0, 1, 2].map((i) => {
        const a = (i * 2 * Math.PI) / 3 + Math.PI / 6
        return (
          <Edged
            key={i}
            selected={selected}
            color={PALETTE.woodDark}
            position={[Math.sin(a) * legR, (h - 0.05) / 2, Math.cos(a) * legR]}
          >
            <cylinderGeometry args={[0.018, 0.018, h - 0.05, 8]} />
          </Edged>
        )
      })}
    </group>
  )
}
