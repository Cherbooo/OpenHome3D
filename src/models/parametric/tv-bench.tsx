import { Edged, Rounded, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** TV bench: low body on legs with 1–3 drawer fronts. Front faces +z. */
export default function TvBench({ params, selected }: ParametricProps) {
  const w = num(params, 'Width', 1.4)
  const d = num(params, 'Depth', 0.42)
  const h = num(params, 'Height', 0.45)
  const drawers = Math.max(1, Math.round(num(params, 'Drawers', 2)))
  const legH = 0.08
  const bodyH = h - legH
  const drawerW = w / drawers
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
      {legs.map(([x, z], i) => (
        <Edged key={i} selected={selected} color={PALETTE.woodDark} position={[x, legH / 2, z]}>
          <boxGeometry args={[0.04, legH, 0.04]} />
        </Edged>
      ))}
      <Rounded
        selected={selected}
        color={PALETTE.wood}
        args={[w, bodyH, d]}
        radius={0.015}
        position={[0, legH + bodyH / 2, 0]}
      />
      {Array.from({ length: drawers }, (_, i) => {
        const x = -w / 2 + drawerW * (i + 0.5)
        return (
          <group key={i}>
            <Edged selected={selected} color={PALETTE.cream} position={[x, legH + bodyH / 2, d / 2 + 0.005]}>
              <boxGeometry args={[drawerW - 0.03, bodyH - 0.06, 0.012]} />
            </Edged>
            <Edged selected={selected} color={PALETTE.woodDark} position={[x, legH + bodyH / 2, d / 2 + 0.018]}>
              <boxGeometry args={[0.12, 0.015, 0.015]} />
            </Edged>
          </group>
        )
      })}
    </group>
  )
}
