import { Edged, bool, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/**
 * Pendant lamp (ceiling-mounted): y=0 is the ceiling contact point,
 * the cord hangs down `Drop` meters to a drum/cone shade.
 */
export default function Pendant({ params, selected }: ParametricProps) {
  const drop = num(params, 'Drop', 0.7)
  const cone = bool(params, 'Cone', true)
  const shadeH = cone ? 0.18 : 0.16
  const cordLen = Math.max(0.05, drop - shadeH)
  return (
    <group>
      <Edged selected={selected} color={PALETTE.ink} position={[0, -0.015, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.03, 12]} />
      </Edged>
      <Edged selected={selected} color={PALETTE.ink} position={[0, -cordLen / 2, 0]}>
        <cylinderGeometry args={[0.006, 0.006, cordLen, 6]} />
      </Edged>
      <Edged selected={selected} color={PALETTE.yellow} position={[0, -drop + shadeH / 2, 0]}>
        {cone ? (
          <cylinderGeometry args={[0.05, 0.17, shadeH, 20, 1, true]} />
        ) : (
          <cylinderGeometry args={[0.14, 0.14, shadeH, 20]} />
        )}
      </Edged>
    </group>
  )
}
