import { Edged, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Plant: tapered pot with low-poly icosphere foliage blobs. */
export default function Plant({ params, selected }: ParametricProps) {
  const size = num(params, 'Size', 0.7)
  const k = size / 0.7 // normalize around the default size
  const potH = 0.26 * k
  const blobs: { p: [number, number, number]; r: number }[] = [
    { p: [0, potH + 0.2 * k, 0], r: 0.19 * k },
    { p: [0.1 * k, potH + 0.32 * k, 0.05 * k], r: 0.14 * k },
    { p: [-0.09 * k, potH + 0.3 * k, -0.06 * k], r: 0.13 * k },
  ]
  return (
    <group>
      <Edged selected={selected} color={PALETTE.terra} position={[0, potH / 2, 0]}>
        <cylinderGeometry args={[0.11 * k, 0.14 * k, potH, 14]} />
      </Edged>
      {blobs.map((b, i) => (
        <Edged key={i} selected={selected} color={PALETTE.green} position={b.p}>
          <icosahedronGeometry args={[b.r, 0]} />
        </Edged>
      ))}
    </group>
  )
}
