import { Rounded, bool, num, type ParametricProps } from './shared'
import { PALETTE } from '../palette'

/** Rug: thin slab, optionally with well-rounded corners. Receives shadows only. */
export default function Rug({ params, selected }: ParametricProps) {
  const w = num(params, 'Width', 2.0)
  const d = num(params, 'Depth', 1.4)
  const rounded = bool(params, 'Rounded', true)
  return (
    <Rounded
      selected={selected}
      color={PALETTE.pink}
      args={[w, 0.015, d]}
      radius={rounded ? 0.09 : 0.008}
      position={[0, 0.0075, 0]}
      castShadow={false}
      receiveShadow
    />
  )
}
