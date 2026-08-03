/**
 * Wall derivation: turns a HomeDef (rooms + openings) into renderable wall
 * segments. Walls are never stored — they are derived from room adjacency:
 *
 * - A side shared with another room (sharedSpan) becomes ONE interior wall,
 *   rendered by the room with the lexicographically smaller id, thickness
 *   centered on the shared boundary.
 * - The unshared remainder of a side becomes exterior wall: inner face flush
 *   with the room edge, bulging outward by WALL_T (the legacy Room.tsx look).
 * - n/s exterior segments are extended by WALL_T at ends that coincide with a
 *   corner of homeAABB (matches the legacy corner caps: n/s walls span
 *   w + 2·WALL_T; e/w wall ends are capped by those extensions).
 * - Openings attach to the wall of room `a` on `side`; `u` is measured along
 *   the segment from `from` (n/s walls run west→east, e/w walls north→south,
 *   same convention as Opening.offset, converted from center to interval).
 */
import {
  homeAABB,
  openingsOn,
  sharedSpan,
  sideSpan,
  type HomeDef,
  type Opening,
  type RoomDef,
  type Side,
} from '../state/home'

export const WALL_T = 0.12

const EPS = 1e-6
const SIDES: Side[] = ['n', 's', 'e', 'w']
const OUTWARD: Record<Side, [number, number]> = {
  n: [0, -1],
  s: [0, 1],
  e: [1, 0],
  w: [-1, 0],
}
const OPPOSITE: Record<Side, Side> = { n: 's', s: 'n', e: 'w', w: 'e' }

export interface WallDoorway {
  /** center along the segment from `from` (m) */
  u: number
  /** opening width along the wall (m) */
  w: number
  kind: 'door' | 'open'
}

export interface WallWindow {
  u: number
  w: number
}

export interface WallSegment {
  key: string
  kind: 'ext' | 'int'
  /** axis the segment runs along in home coords */
  axis: 'x' | 'z'
  from: [number, number]
  to: [number, number]
  height: number
  doorways: WallDoorway[]
  windows: WallWindow[]
  /** outward normal, exterior walls only (drives cutaway) */
  normal?: [number, number]
  /** room that renders this segment (smaller id for interior walls) */
  roomId: string
}

/** Wall-start coordinate (t) along the side axis: x for n/s walls, z for e/w. */
function axisOf(side: Side): 'x' | 'z' {
  return side === 'n' || side === 's' ? 'x' : 'z'
}

function startCoord(room: RoomDef, side: Side): number {
  const { x, z, w, d } = room.rect
  switch (side) {
    case 'n':
    case 's':
      return x - w / 2
    case 'w':
    case 'e':
      return z - d / 2
  }
}

/** Point on the side line at wall-local distance t from the room's wall start. */
function pointAt(room: RoomDef, side: Side, t: number): [number, number] {
  const { x, z, w, d } = room.rect
  switch (side) {
    case 'n':
      return [x - w / 2 + t, z - d / 2]
    case 's':
      return [x - w / 2 + t, z + d / 2]
    case 'w':
      return [x - w / 2, z - d / 2 + t]
    case 'e':
      return [x + w / 2, z - d / 2 + t]
  }
}

interface SharedBit {
  /** shared interval in this room's wall-local coordinates */
  from: number
  to: number
  other: RoomDef
}

/** Convert an opening declared on `decl` (side `declSide`) to a segment-local doorway. */
function toOpening(o: Opening, decl: RoomDef, declSide: Side, segStart: number) {
  const tCenter = startCoord(decl, declSide) + o.offset
  return { u: tCenter - segStart, w: o.width }
}

export function deriveWalls(home: HomeDef, wallHeight: number): WallSegment[] {
  const aabb = homeAABB(home)
  const segments: WallSegment[] = []

  for (const room of home.rooms) {
    for (const side of SIDES) {
      const axis = axisOf(side)
      const span = sideSpan(room, side)

      // shared intervals on this side (merged left-to-right)
      const shared: SharedBit[] = []
      for (const other of home.rooms) {
        if (other.id === room.id) continue
        const sh = sharedSpan(room, other)
        if (sh && sh.side === side) shared.push({ from: sh.from, to: sh.to, other })
      }
      shared.sort((a, b) => a.from - b.from)

      // interior walls: one per shared interval, rendered by the smaller id
      for (const sh of shared) {
        if (room.id > sh.other.id) continue
        const segStart = startCoord(room, side) + sh.from
        const doorways: WallDoorway[] = []
        for (const o of home.openings) {
          if (o.kind === 'window') continue // defensively ignored on interior walls
          if (o.a === room.id && o.side === side && o.b === sh.other.id) {
            doorways.push({ ...toOpening(o, room, side, segStart), kind: o.kind })
          } else if (o.a === sh.other.id && o.side === OPPOSITE[side] && o.b === room.id) {
            doorways.push({ ...toOpening(o, sh.other, OPPOSITE[side], segStart), kind: o.kind })
          }
        }
        segments.push({
          key: `int:${room.id}:${sh.other.id}`,
          kind: 'int',
          axis,
          from: pointAt(room, side, sh.from),
          to: pointAt(room, side, sh.to),
          height: wallHeight,
          doorways,
          windows: [],
          roomId: room.id,
        })
      }

      // exterior remainders: side span minus the shared intervals
      const extSpans: [number, number][] = []
      let cursor = 0
      for (const sh of shared) {
        if (sh.from - cursor > EPS) extSpans.push([cursor, sh.from])
        cursor = Math.max(cursor, sh.to)
      }
      if (span.length - cursor > EPS) extSpans.push([cursor, span.length])

      const openings = openingsOn(room, side, home.openings).filter((o) => o.b === 'exterior')
      extSpans.forEach(([lo, hi], i) => {
        // corner caps: extend n/s segments at ends that coincide with an
        // aabb corner; e/w ends are capped by those extensions (legacy look)
        let elo = lo
        let ehi = hi
        if (axis === 'x') {
          const zLine = pointAt(room, side, lo)[1]
          const onAabbZ =
            Math.abs(zLine - aabb.minZ) < EPS || Math.abs(zLine - aabb.maxZ) < EPS
          const tLo = startCoord(room, side) + lo
          const tHi = startCoord(room, side) + hi
          if (onAabbZ && Math.abs(tLo - aabb.minX) < EPS) elo -= WALL_T
          if (onAabbZ && Math.abs(tHi - aabb.maxX) < EPS) ehi += WALL_T
        }
        const doorways: WallDoorway[] = []
        const windows: WallWindow[] = []
        for (const o of openings) {
          const tCenter = o.offset // room wall-local
          if (tCenter < lo - EPS || tCenter > hi + EPS) continue
          if (o.kind === 'window') {
            windows.push({ u: tCenter - elo, w: o.width })
          } else {
            doorways.push({ u: tCenter - elo, w: o.width, kind: o.kind })
          }
        }
        segments.push({
          key: `ext:${room.id}:${side}:${i}`,
          kind: 'ext',
          axis,
          from: pointAt(room, side, elo),
          to: pointAt(room, side, ehi),
          height: wallHeight,
          doorways,
          windows,
          normal: OUTWARD[side],
          roomId: room.id,
        })
      })
    }
  }
  return segments
}
