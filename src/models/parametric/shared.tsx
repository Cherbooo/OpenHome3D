import { Edges, Outlines, RoundedBox } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import type { ReactNode } from 'react'
import { toonGradientMap } from '../../lib/toon'
import { PALETTE } from '../palette'

/** Shared look: flat toon colors with warm dark edges (cel-shaded cartoon). */
export const EDGE = PALETTE.ink
export const SELECT_FILL = '#bcd3ff'
export const SELECT_EDGE = '#2f6bff'

/** Props of every parametric furniture component. */
export interface ParametricProps {
  params: Record<string, number | boolean>
  selected?: boolean
}

/** Read a number param with fallback. */
export function num(
  params: Record<string, number | boolean>,
  key: string,
  fallback: number,
): number {
  const v = params[key]
  return typeof v === 'number' ? v : fallback
}

/** Read a boolean param with fallback. */
export function bool(
  params: Record<string, number | boolean>,
  key: string,
  fallback: boolean,
): boolean {
  const v = params[key]
  return typeof v === 'boolean' ? v : fallback
}

/** Standard toon material (blue-tinted while selected). */
export function Mat({ selected, color }: { selected?: boolean; color?: string }) {
  return (
    <meshToonMaterial
      color={selected ? SELECT_FILL : (color ?? PALETTE.cream)}
      gradientMap={toonGradientMap()}
    />
  )
}

/** Standard dark outline (blue while selected). Place inside a mesh. */
export function EdgeLines({ selected }: { selected?: boolean }) {
  return <Edges threshold={20} lineWidth={1} color={selected ? SELECT_EDGE : EDGE} />
}

/**
 * Silhouette outline (1px, blue while selected). For smooth geometry
 * (RoundedBox etc.) where EdgesGeometry finds no hard crease at all — the
 * inverted hull always shows a contour, and seams between adjacent parts
 * still read through the gaps.
 */
export function SilhouetteLines({ selected }: { selected?: boolean }) {
  return <Outlines thickness={1} color={selected ? SELECT_EDGE : EDGE} />
}

type MeshProps = Omit<ThreeElements['mesh'], 'children' | 'args' | 'ref'>

/**
 * Mesh wrapper with the standard toon material + edge lines.
 * Pass a geometry element as children:
 *   <Edged color={PALETTE.wood} position={...}><boxGeometry args={[1, 1, 1]} /></Edged>
 */
export function Edged({
  selected,
  color,
  children,
  ...props
}: MeshProps & { selected?: boolean; color?: string; children?: ReactNode }) {
  return (
    <mesh castShadow receiveShadow {...props}>
      {children}
      <Mat selected={selected} color={color} />
      <EdgeLines selected={selected} />
    </mesh>
  )
}

/** RoundedBox variant of Edged. args = [width, height, depth].
 *  RoundedBox geometry is fully smooth (ExtrudeGeometry), so it uses the
 *  silhouette outline instead of EdgesGeometry. */
export function Rounded({
  selected,
  color,
  args,
  radius = 0.03,
  smoothness = 4,
  children,
  ...props
}: MeshProps & {
  selected?: boolean
  color?: string
  args: [number, number, number]
  radius?: number
  smoothness?: number
  children?: ReactNode
}) {
  return (
    <RoundedBox args={args} radius={radius} smoothness={smoothness} castShadow receiveShadow {...props}>
      {children}
      <Mat selected={selected} color={color} />
      <SilhouetteLines selected={selected} />
    </RoundedBox>
  )
}
