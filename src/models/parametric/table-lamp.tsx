import { Edged, bool, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Table lamp: small base, stem, drum/cone shade. */
export default function TableLamp({ params, selected }: ParametricProps) {
  const h = num(params, 'Height', 0.4)
  const cone = bool(params, 'Cone', false)
  const shadeH = cone ? 0.13 : 0.15
  return (
    <group>
      <Edged selected={selected} color={PALETTE.ink} position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.08, 0.09, 0.02, 16]} />
      </Edged>
      <Edged selected={selected} color={PALETTE.ink} position={[0, (h - shadeH) / 2, 0]}>
        <cylinderGeometry args={[0.011, 0.011, h - shadeH, 8]} />
      </Edged>
      <Edged selected={selected} color={PALETTE.yellow} position={[0, h - shadeH / 2, 0]}>
        {cone ? (
          <cylinderGeometry args={[0.06, 0.12, shadeH, 16, 1, true]} />
        ) : (
          <cylinderGeometry args={[0.1, 0.1, shadeH, 16]} />
        )}
      </Edged>
    </group>
  )
}
