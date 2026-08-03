/**
 * 2D axis-aligned bounding-box (AABB) footprint helpers.
 * Rooms and furniture live on the x/z plane; a room of width×depth is
 * centered at the origin, so valid positions span ±width/2, ±depth/2.
 */

/** Axis-aligned box on the floor plane: center (x, z) plus size (w along x, d along z). */
export interface Box {
  x: number
  z: number
  w: number
  d: number
}

/**
 * Footprint (w, d) of a w×d piece after a rotationY of `rot` radians,
 * as the axis-aligned bounding box of the rotated rectangle.
 * For 90°-snapped rotations this is an exact swap.
 */
export function rotateFootprint(w: number, d: number, rot: number): [number, number] {
  const c = Math.abs(Math.cos(rot))
  const s = Math.abs(Math.sin(rot))
  return [w * c + d * s, w * s + d * c]
}

/** Build a Box from center position, base footprint and rotation. */
export function boxAt(x: number, z: number, w: number, d: number, rot = 0): Box {
  const [rw, rd] = rotateFootprint(w, d, rot)
  return { x, z, w: rw, d: rd }
}

/**
 * Overlap test. With margin > 0 the boxes are inflated by `margin` on every
 * side first, so pieces must keep at least `margin` clearance to pass.
 */
export function overlaps(a: Box, b: Box, margin = 0): boolean {
  return (
    Math.abs(a.x - b.x) * 2 < a.w + b.w + margin * 2 &&
    Math.abs(a.z - b.z) * 2 < a.d + b.d + margin * 2
  )
}

/** Clamp a value into [min, max]. */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/**
 * Clamp a center point so a footprint of w×d stays fully inside a room of
 * roomW×roomD centered at the origin. If the piece is larger than the room
 * on an axis it is centered on that axis.
 */
export function clampToRoom(
  x: number,
  z: number,
  w: number,
  d: number,
  roomW: number,
  roomD: number,
): [number, number] {
  const hw = Math.max(0, roomW / 2 - w / 2)
  const hd = Math.max(0, roomD / 2 - d / 2)
  return [clamp(x, -hw, hw), clamp(z, -hd, hd)]
}

/** True if the box lies fully inside a room of roomW×roomD centered at the origin. */
export function fitsInRoom(box: Box, roomW: number, roomD: number, inset = 0): boolean {
  return (
    Math.abs(box.x) + box.w / 2 <= roomW / 2 - inset + 1e-6 &&
    Math.abs(box.z) + box.d / 2 <= roomD / 2 - inset + 1e-6
  )
}

/**
 * Union AABB of a set of boxes (center + size form). Returns a zero box at
 * the origin for an empty input.
 */
export function aabbOf(rects: Box[]): Box {
  if (rects.length === 0) return { x: 0, z: 0, w: 0, d: 0 }
  let minX = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxZ = -Infinity
  for (const r of rects) {
    minX = Math.min(minX, r.x - r.w / 2)
    maxX = Math.max(maxX, r.x + r.w / 2)
    minZ = Math.min(minZ, r.z - r.d / 2)
    maxZ = Math.max(maxZ, r.z + r.d / 2)
  }
  return { x: (minX + maxX) / 2, z: (minZ + maxZ) / 2, w: maxX - minX, d: maxZ - minZ }
}

/** Quantize a position to a grid step (default 5 cm), rounding float noise away. */
export function quantize(v: number, step = 0.05): number {
  const r = Math.round(Math.round(v / step) * step * 10000) / 10000
  return r === 0 ? 0 : r // normalize -0
}
