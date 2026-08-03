import { Edged, Rounded, bool, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Sofa: base + seat/back cushions + optional arms + short legs. Front faces +z. */
export default function Sofa({
  params,
  selected,
  colors,
}: ParametricProps & { colors?: { body: string; cushion: string } }) {
  const bodyC = colors?.body ?? PALETTE.coral
  const cushC = colors?.cushion ?? PALETTE.pink
  const w = num(params, 'Width', 2.3)
  const d = num(params, 'Depth', 0.92)
  const seats = Math.max(1, Math.round(num(params, 'Seats', 3)))
  const arms = bool(params, 'Arms', true)
  const rounded = bool(params, 'Rounded', true)
  const r = rounded ? 0.055 : 0.015
  const legH = 0.07
  const baseH = 0.3
  const cushH = 0.15
  const backH = 0.38
  const armW = arms ? 0.16 : 0
  const innerW = w - armW * 2
  const seatW = innerW / seats
  const legX = w / 2 - 0.07
  const legZ = d / 2 - 0.07
  const legs: [number, number][] = [
    [-legX, -legZ],
    [legX, -legZ],
    [-legX, legZ],
    [legX, legZ],
  ]
  return (
    <group>
      {legs.map(([x, z], i) => (
        <Edged key={i} selected={selected} color={PALETTE.woodDark} position={[x, legH / 2, z]}>
          <cylinderGeometry args={[0.028, 0.028, legH, 10]} />
        </Edged>
      ))}
      <Rounded
        selected={selected}
        color={bodyC}
        args={[w, baseH, d]}
        radius={r}
        position={[0, legH + baseH / 2, 0]}
      />
      {Array.from({ length: seats }, (_, i) => (
        <Rounded
          key={`s${i}`}
          selected={selected}
          color={cushC}
          args={[seatW - 0.02, cushH, d - 0.24]}
          radius={r}
          position={[-innerW / 2 + seatW * (i + 0.5), legH + baseH + cushH / 2, 0.04]}
        />
      ))}
      <Rounded
        selected={selected}
        color={bodyC}
        args={[w, baseH + backH + 0.12, 0.16]}
        radius={r}
        position={[0, legH + (baseH + backH + 0.12) / 2, -d / 2 + 0.08]}
      />
      {Array.from({ length: seats }, (_, i) => (
        <Rounded
          key={`b${i}`}
          selected={selected}
          color={cushC}
          args={[seatW - 0.04, backH, 0.15]}
          radius={r}
          position={[
            -innerW / 2 + seatW * (i + 0.5),
            legH + baseH + cushH + backH / 2 - 0.04,
            -d / 2 + 0.22,
          ]}
          rotation={[-0.1, 0, 0]}
        />
      ))}
      {arms &&
        [-1, 1].map((s) => (
          <Rounded
            key={s}
            selected={selected}
            color={bodyC}
            args={[armW, baseH + 0.22, d]}
            radius={r}
            position={[s * (w / 2 - armW / 2), legH + (baseH + 0.22) / 2, 0]}
          />
        ))}
    </group>
  )
}
