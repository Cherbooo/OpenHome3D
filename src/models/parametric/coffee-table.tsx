import { Edged, Rounded, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Coffee table: top, four legs, low shelf. */
export default function CoffeeTable({ params, selected }: ParametricProps) {
  const w = num(params, 'Width', 1.2)
  const d = num(params, 'Depth', 0.6)
  const h = num(params, 'Height', 0.4)
  const legX = w / 2 - 0.06
  const legZ = d / 2 - 0.06
  const legs: [number, number][] = [
    [-legX, -legZ],
    [legX, -legZ],
    [-legX, legZ],
    [legX, legZ],
  ]
  return (
    <group>
      <Rounded selected={selected} color={PALETTE.wood} args={[w, 0.04, d]} radius={0.015} position={[0, h - 0.02, 0]} />
      <Rounded
        selected={selected}
        color={PALETTE.woodDark}
        args={[w - 0.16, 0.025, d - 0.16]}
        radius={0.01}
        position={[0, 0.09, 0]}
      />
      {legs.map(([x, z], i) => (
        <Edged key={i} selected={selected} color={PALETTE.woodDark} position={[x, (h - 0.04) / 2, z]}>
          <boxGeometry args={[0.045, h - 0.04, 0.045]} />
        </Edged>
      ))}
    </group>
  )
}
