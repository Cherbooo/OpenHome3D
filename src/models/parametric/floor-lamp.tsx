import { Edged, bool, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Floor lamp: pole or tripod base with a drum/cone shade. */
export default function FloorLamp({ params, selected }: ParametricProps) {
  const h = num(params, 'Height', 1.6)
  const tripod = bool(params, 'Tripod', false)
  const cone = bool(params, 'Cone', false)
  const shadeH = cone ? 0.2 : 0.24
  return (
    <group>
      {tripod ? (
        [0, 1, 2].map((i) => {
          const a = (i * 2 * Math.PI) / 3
          return (
            <Edged
              key={i}
              selected={selected}
              color={PALETTE.ink}
              position={[Math.sin(a) * 0.12, 0.26, Math.cos(a) * 0.12]}
              rotation={[Math.cos(a) * 0.32, 0, -Math.sin(a) * 0.32]}
            >
              <cylinderGeometry args={[0.012, 0.012, 0.56, 8]} />
            </Edged>
          )
        })
      ) : (
        <Edged selected={selected} color={PALETTE.ink} position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.14, 0.15, 0.02, 20]} />
        </Edged>
      )}
      <Edged selected={selected} color={PALETTE.ink} position={[0, (h - shadeH) / 2 + 0.1, 0]}>
        <cylinderGeometry args={[0.014, 0.014, h - shadeH - 0.16, 8]} />
      </Edged>
      <Edged selected={selected} color={PALETTE.yellow} position={[0, h - shadeH / 2, 0]}>
        {cone ? (
          <cylinderGeometry args={[0.09, 0.18, shadeH, 20, 1, true]} />
        ) : (
          <cylinderGeometry args={[0.16, 0.16, shadeH, 20]} />
        )}
      </Edged>
    </group>
  )
}
