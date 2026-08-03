import { Edged, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Shelf: two side panels, a back panel and 2–5 level boards. Front faces +z. */
export default function Shelf({ params, selected }: ParametricProps) {
  const w = num(params, 'Width', 0.9)
  const h = num(params, 'Height', 1.8)
  const levels = Math.max(2, Math.round(num(params, 'Levels', 4)))
  const d = 0.32
  return (
    <group>
      {[-1, 1].map((s) => (
        <Edged key={s} selected={selected} color={PALETTE.wood} position={[s * (w / 2 - 0.015), h / 2, 0]}>
          <boxGeometry args={[0.03, h, d]} />
        </Edged>
      ))}
      <Edged selected={selected} color={PALETTE.cream} position={[0, h / 2, -d / 2 + 0.01]}>
        <boxGeometry args={[w, h, 0.02]} />
      </Edged>
      {Array.from({ length: levels }, (_, i) => {
        const y = 0.04 + (i * (h - 0.08)) / (levels - 1)
        return (
          <Edged key={i} selected={selected} color={PALETTE.wood} position={[0, y, 0]}>
            <boxGeometry args={[w - 0.06, 0.025, d - 0.03]} />
          </Edged>
        )
      })}
    </group>
  )
}
