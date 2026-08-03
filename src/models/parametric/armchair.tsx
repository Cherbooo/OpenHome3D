import Sofa from './sofa'
import { PALETTE } from '../palette'
import type { ParametricProps } from './shared'

/** Armchair: a one-seat sofa with its own defaults (and its own colorway). */
export default function Armchair({ params, selected }: ParametricProps) {
  return (
    <Sofa
      params={{ Width: 0.94, Depth: 0.92, Seats: 1, Arms: true, Rounded: true, ...params }}
      selected={selected}
      colors={{ body: PALETTE.teal, cushion: PALETTE.cream }}
    />
  )
}
