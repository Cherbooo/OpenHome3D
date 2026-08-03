import { Edged, Rounded, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Dining chair: seat, backrest, four legs. Front faces +z. */
export default function Chair({ params, selected }: ParametricProps) {
  const w = num(params, 'Width', 0.46)
  const d = num(params, 'Depth', 0.48)
  const seatH = 0.45
  const backH = 0.48
  const legX = w / 2 - 0.04
  const legZ = d / 2 - 0.04
  const legs: [number, number][] = [
    [-legX, -legZ],
    [legX, -legZ],
    [-legX, legZ],
    [legX, legZ],
  ]
  return (
    <group>
      <Rounded
        selected={selected}
        color={PALETTE.wood}
        args={[w, 0.045, d]}
        radius={0.015}
        position={[0, seatH - 0.0225, 0]}
      />
      <Rounded
        selected={selected}
        color={PALETTE.wood}
        args={[w, backH, 0.04]}
        radius={0.015}
        position={[0, seatH + backH / 2, -d / 2 + 0.02]}
        rotation={[-0.06, 0, 0]}
      />
      {legs.map(([x, z], i) => (
        <Edged key={i} selected={selected} color={PALETTE.woodDark} position={[x, (seatH - 0.045) / 2, z]}>
          <boxGeometry args={[0.04, seatH - 0.045, 0.04]} />
        </Edged>
      ))}
    </group>
  )
}
