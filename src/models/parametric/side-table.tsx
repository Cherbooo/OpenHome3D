import { Edged, Rounded, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Side table: top plus four legs. */
export default function SideTable({ params, selected }: ParametricProps) {
  const w = num(params, 'Width', 0.5)
  const d = num(params, 'Depth', 0.5)
  const h = num(params, 'Height', 0.55)
  const legX = w / 2 - 0.05
  const legZ = d / 2 - 0.05
  const legs: [number, number][] = [
    [-legX, -legZ],
    [legX, -legZ],
    [-legX, legZ],
    [legX, legZ],
  ]
  return (
    <group>
      <Rounded selected={selected} color={PALETTE.yellow} args={[w, 0.035, d]} radius={0.012} position={[0, h - 0.0175, 0]} />
      {legs.map(([x, z], i) => (
        <Edged key={i} selected={selected} color={PALETTE.woodDark} position={[x, (h - 0.035) / 2, z]}>
          <boxGeometry args={[0.04, h - 0.035, 0.04]} />
        </Edged>
      ))}
    </group>
  )
}
