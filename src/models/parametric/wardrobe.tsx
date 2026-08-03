import { Edged, Rounded, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Wardrobe: body with 1–3 door fronts (thin inset boxes leave seam lines). Front faces +z. */
export default function Wardrobe({ params, selected }: ParametricProps) {
  const w = num(params, 'Width', 1.4)
  const d = num(params, 'Depth', 0.6)
  const h = num(params, 'Height', 2.1)
  const doors = Math.max(1, Math.round(num(params, 'Doors', 2)))
  const plinthH = 0.06
  const doorW = w / doors
  return (
    <group>
      <Edged selected={selected} color={PALETTE.wood} position={[0, plinthH / 2, 0]}>
        <boxGeometry args={[w - 0.08, plinthH, d - 0.08]} />
      </Edged>
      <Rounded
        selected={selected}
        color={PALETTE.wood}
        args={[w, h - plinthH, d]}
        radius={0.015}
        position={[0, plinthH + (h - plinthH) / 2, 0]}
      />
      {Array.from({ length: doors }, (_, i) => {
        const x = -w / 2 + doorW * (i + 0.5)
        return (
          <group key={i}>
            <Edged selected={selected} color={PALETTE.cream} position={[x, h / 2 + 0.01, d / 2 + 0.006]}>
              <boxGeometry args={[doorW - 0.03, h - plinthH - 0.1, 0.014]} />
            </Edged>
            <Edged
              selected={selected}
              color={PALETTE.woodDark}
              position={[x + (i % 2 === 0 ? 1 : -1) * (doorW / 2 - 0.06), h / 2, d / 2 + 0.02]}
            >
              <boxGeometry args={[0.018, 0.18, 0.018]} />
            </Edged>
          </group>
        )
      })}
    </group>
  )
}
