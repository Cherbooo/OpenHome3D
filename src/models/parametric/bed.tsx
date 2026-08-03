import { Edged, Rounded, bool, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Bed: frame + mattress + optional headboard; pillow count derives from width. Head at -z. */
export default function Bed({ params, selected }: ParametricProps) {
  const w = num(params, 'Width', 1.6)
  const d = num(params, 'Depth', 2.05)
  const headboard = bool(params, 'Headboard', true)
  const legH = 0.1
  const frameH = 0.22
  const mattH = 0.17
  const pillows = w >= 1.4 ? 2 : 1
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
        <Edged key={i} selected={selected} color={PALETTE.wood} position={[x, legH / 2, z]}>
          <boxGeometry args={[0.06, legH, 0.06]} />
        </Edged>
      ))}
      <Rounded
        selected={selected}
        color={PALETTE.wood}
        args={[w, frameH, d]}
        radius={0.02}
        position={[0, legH + frameH / 2, 0]}
      />
      <Rounded
        selected={selected}
        color={PALETTE.blue}
        args={[w - 0.08, mattH, d - 0.08]}
        radius={0.045}
        position={[0, legH + frameH + mattH / 2, 0.02]}
      />
      {headboard && (
        <Rounded
          selected={selected}
          color={PALETTE.wood}
          args={[w, 0.78, 0.07]}
          radius={0.025}
          position={[0, 0.39, -d / 2 + 0.035]}
        />
      )}
      {Array.from({ length: pillows }, (_, i) => {
        const x = pillows === 1 ? 0 : -w / 4 + (w / 4) * 2 * i + (i === 0 ? -0.02 : 0.02)
        return (
          <Rounded
            key={i}
            selected={selected}
            color={PALETTE.cream}
            args={[Math.min(0.6, w / 2 - 0.12), 0.11, 0.34]}
            radius={0.05}
            position={[x, legH + frameH + mattH + 0.055, -d / 2 + 0.32]}
            rotation={[-0.25, 0, 0]}
          />
        )
      })}
    </group>
  )
}
