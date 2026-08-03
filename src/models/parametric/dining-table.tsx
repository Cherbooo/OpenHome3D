import { Edged, Rounded, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Dining table: top plus four sturdy legs. */
export default function DiningTable({ params, selected }: ParametricProps) {
  const w = num(params, 'Width', 1.6)
  const d = num(params, 'Depth', 0.9)
  const h = num(params, 'Height', 0.74)
  const legX = w / 2 - 0.08
  const legZ = d / 2 - 0.08
  const legs: [number, number][] = [
    [-legX, -legZ],
    [legX, -legZ],
    [-legX, legZ],
    [legX, legZ],
  ]
  return (
    <group>
      <Rounded selected={selected} color={PALETTE.wood} args={[w, 0.05, d]} radius={0.015} position={[0, h - 0.025, 0]} />
      {legs.map(([x, z], i) => (
        <Edged key={i} selected={selected} color={PALETTE.woodDark} position={[x, (h - 0.05) / 2, z]}>
          <boxGeometry args={[0.06, h - 0.05, 0.06]} />
        </Edged>
      ))}
    </group>
  )
}
