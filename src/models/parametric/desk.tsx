import { Edged, Rounded, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Desk: top, two side panels, modesty panel, small drawer box. Front faces +z. */
export default function Desk({ params, selected }: ParametricProps) {
  const w = num(params, 'Width', 1.3)
  const d = num(params, 'Depth', 0.65)
  const h = num(params, 'Height', 0.74)
  return (
    <group>
      <Rounded selected={selected} color={PALETTE.wood} args={[w, 0.04, d]} radius={0.012} position={[0, h - 0.02, 0]} />
      {[-1, 1].map((s) => (
        <Edged key={s} selected={selected} color={PALETTE.woodDark} position={[s * (w / 2 - 0.02), (h - 0.04) / 2, 0]}>
          <boxGeometry args={[0.04, h - 0.04, d - 0.06]} />
        </Edged>
      ))}
      <Edged selected={selected} color={PALETTE.woodDark} position={[0, h - 0.04 - 0.17, -d / 2 + 0.06]}>
        <boxGeometry args={[w - 0.12, 0.34, 0.025]} />
      </Edged>
      <Edged selected={selected} color={PALETTE.teal} position={[w / 2 - 0.24, h - 0.04 - 0.08, 0.02]}>
        <boxGeometry args={[0.4, 0.16, d - 0.16]} />
      </Edged>
    </group>
  )
}
