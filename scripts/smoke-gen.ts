/**
 * Smoke test for the procedural generator (no vitest, run via tsx):
 *   npx tsx scripts/smoke-gen.ts
 *
 * For every room type × 3 fixed seeds:
 *  - generate twice → deep-equal (determinism)
 *  - every modelId resolves in the registry
 *  - every instance stays within room bounds
 *  - pairwise AABB overlap count = 0 (rug / tv-on-bench pairs excepted)
 *  - living room contains a sofa and a tv-bench
 *
 * Plus door avoidance (P3):
 *  - doorZonesFor maps own + mirrored neighbor declarations onto a room
 *  - multi-room fixture (4 rooms sharing edges) × 3 seeds × 2 salts:
 *    determinism / in-bounds / zero overlap per room, and no wall- or
 *    run-placed piece intersects a door strip on its own wall
 *  - door stress: one living room, a 0.9 m door centered on every wall
 */
import { DOOR_CLEAR, generateLayout, generateLayoutDetailed, overlapAllowed, type LayoutOpts } from '../src/gen/layout'
import { ROOM_TYPES, typeDefaults } from '../src/gen/roomTypes'
import { boxAt, overlaps, type Box } from '../src/lib/geom'
import { rngFrom } from '../src/lib/prng'
import { allModels, footprintOf, getModel, type FurnitureInstance } from '../src/models/registry'
import {
  doorZonesFor,
  type DoorZone,
  type HomeDef,
  type RoomDef,
} from '../src/state/home'

const SEEDS = ['ALPHA2', 'BETA33', 'GAMMA4']
const SALTS = [0, 1]

let failures = 0
let checks = 0

function fail(msg: string) {
  failures++
  console.error(`  FAIL ${msg}`)
}

function instanceBox(inst: FurnitureInstance): Box | null {
  const def = getModel(inst.modelId)
  if (!def) return null
  const [w, d] = footprintOf(def, inst.params, inst.scale)
  return boxAt(inst.position[0], inst.position[1], w, d, inst.rotationY)
}

for (const type of ROOM_TYPES) {
  for (const seed of SEEDS) {
    const dims = typeDefaults(type.id, rngFrom(`${seed}:room:${type.id}`))
    for (const salt of SALTS) {
      const tag = `${type.id}/${seed}/salt${salt}`
      const opts = {
        roomType: type.id,
        seed,
        salt,
        width: dims.width,
        depth: dims.depth,
        extras: 85,
        models: allModels(),
      }
      const a = generateLayout(opts)
      const b = generateLayout(opts)
      checks++

      if (JSON.stringify(a) !== JSON.stringify(b)) {
        fail(`${tag}: non-deterministic output`)
      }
      if (a.length === 0) {
        fail(`${tag}: empty layout`)
        continue
      }

      // registry lookups + bounds
      const boxes: (Box | null)[] = []
      for (const inst of a) {
        if (!getModel(inst.modelId)) {
          fail(`${tag}: unknown modelId ${inst.modelId}`)
          boxes.push(null)
          continue
        }
        const box = instanceBox(inst)!
        boxes.push(box)
        if (
          Math.abs(box.x) + box.w / 2 > dims.width / 2 + 1e-6 ||
          Math.abs(box.z) + box.d / 2 > dims.depth / 2 + 1e-6
        ) {
          fail(
            `${tag}: ${inst.modelId} out of bounds at (${box.x.toFixed(2)}, ${box.z.toFixed(2)}) ` +
              `${box.w.toFixed(2)}x${box.d.toFixed(2)} in room ${dims.width}x${dims.depth}`,
          )
        }
      }

      // pairwise overlaps
      for (let i = 0; i < a.length; i++) {
        for (let j = i + 1; j < a.length; j++) {
          const bi = boxes[i]
          const bj = boxes[j]
          if (!bi || !bj) continue
          if (overlaps(bi, bj, 0) && !overlapAllowed(a[i], a[j])) {
            fail(`${tag}: overlap ${a[i].modelId} <-> ${a[j].modelId}`)
          }
        }
      }

      if (type.id === 'living') {
        const ids = a.map((f) => f.modelId)
        for (const req of ['builtin:sofa', 'builtin:tv-bench']) {
          if (!ids.includes(req)) fail(`${tag}: living room missing ${req}`)
        }
      }
      checks++
    }
  }
}

// spot-check: different seeds should give different arrangements
{
  const dims = typeDefaults('living', rngFrom('SAME:room:living'))
  const mk = (seed: string) =>
    JSON.stringify(
      generateLayout({
        roomType: 'living',
        seed,
        salt: 0,
        width: dims.width,
        depth: dims.depth,
        extras: 85,
        models: allModels(),
      }),
    )
  checks++
  if (mk('SEEDAA') === mk('SEEDBB')) fail('different seeds produced identical living layouts')
}

// ---------------------------------------------------------------------------
// P3: door avoidance
// ---------------------------------------------------------------------------

/** How deep a door strip reaches into the room from its wall (meters). */
const DOOR_STRIP_DEPTH = 0.6

/** Room-local AABB of a door zone expanded by DOOR_CLEAR along the wall. */
function doorStripBox(zone: DoorZone, roomW: number, roomD: number): Box {
  const c = (zone.from + zone.to) / 2
  const len = zone.to - zone.from + 2 * DOOR_CLEAR
  switch (zone.side) {
    case 'n':
      return { x: c - roomW / 2, z: -roomD / 2 + DOOR_STRIP_DEPTH / 2, w: len, d: DOOR_STRIP_DEPTH }
    case 's':
      return { x: c - roomW / 2, z: roomD / 2 - DOOR_STRIP_DEPTH / 2, w: len, d: DOOR_STRIP_DEPTH }
    case 'e':
      return { x: roomW / 2 - DOOR_STRIP_DEPTH / 2, z: c - roomD / 2, w: DOOR_STRIP_DEPTH, d: len }
    case 'w':
      return { x: -roomW / 2 + DOOR_STRIP_DEPTH / 2, z: c - roomD / 2, w: DOOR_STRIP_DEPTH, d: len }
  }
}

/**
 * Shared assertions for a door-aware layout: determinism, in-bounds, zero
 * overlap, and no wall/run-placed piece (side-tagged by the engine) blocking
 * a door strip on its own wall. Only the avoided class is checked, and only
 * against its own wall — other rule kinds don't avoid doors, and a piece on
 * one wall may legitimately stand next to a door on an adjacent wall.
 */
function checkDoorAwareLayout(tag: string, opts: LayoutOpts, doors: DoorZone[]): void {
  const a = generateLayoutDetailed(opts)
  const b = generateLayoutDetailed(opts)
  checks++
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    fail(`${tag}: non-deterministic output`)
  }
  if (a.length === 0) {
    fail(`${tag}: empty layout`)
    checks++
    return
  }

  // bounds
  const boxes: (Box | null)[] = []
  for (const p of a) {
    const box = instanceBox(p.inst)
    if (!box) {
      fail(`${tag}: unknown modelId ${p.inst.modelId}`)
      boxes.push(null)
      continue
    }
    boxes.push(box)
    if (
      Math.abs(box.x) + box.w / 2 > opts.width / 2 + 1e-6 ||
      Math.abs(box.z) + box.d / 2 > opts.depth / 2 + 1e-6
    ) {
      fail(
        `${tag}: ${p.inst.modelId} out of bounds at (${box.x.toFixed(2)}, ${box.z.toFixed(2)}) ` +
          `${box.w.toFixed(2)}x${box.d.toFixed(2)} in room ${opts.width}x${opts.depth}`,
      )
    }
  }

  // pairwise overlaps
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      const bi = boxes[i]
      const bj = boxes[j]
      if (!bi || !bj) continue
      if (overlaps(bi, bj, 0) && !overlapAllowed(a[i].inst, a[j].inst)) {
        fail(`${tag}: overlap ${a[i].inst.modelId} <-> ${a[j].inst.modelId}`)
      }
    }
  }

  // door strips (1 mm tolerance: stored rotationY is rounded to 4 decimals,
  // which inflates the piece AABB by ~2e-6 m at exact-touch boundaries)
  const strips = doors.map((zone) => ({ zone, box: doorStripBox(zone, opts.width, opts.depth) }))
  for (let i = 0; i < a.length; i++) {
    const side = a[i].side
    if (!side) continue // only wall/run placements avoid doors
    const box = boxes[i]
    if (!box) continue
    for (const s of strips) {
      if (s.zone.side !== side) continue
      if (overlaps(box, s.box, -1e-3)) {
        fail(
          `${tag}: ${a[i].inst.modelId} blocks door on ${side} ` +
            `[${s.zone.from.toFixed(2)}, ${s.zone.to.toFixed(2)}]`,
        )
      }
    }
  }
  checks++
}

// multi-room fixture: living + bedroom (west-adjacent) + kitchen (north) +
// bath (east), all sharing edges with the living room
const mkRoom = (id: string, type: string, x: number, z: number, w: number, d: number): RoomDef => ({
  id,
  type,
  name: id,
  rect: { x, z, w, d },
  salt: 0,
  partitionHeight: 0,
})
const HOME: HomeDef = {
  rooms: [
    mkRoom('living', 'living', 0, 0, 4.8, 4.6),
    mkRoom('bedroom', 'bedroom', -4.2, 0, 3.6, 3.4),
    mkRoom('kitchen', 'kitchen', 1.2, -3.6, 2.4, 2.6),
    mkRoom('bath', 'bathroom', 3.6, 0, 2.4, 2.6),
  ],
  openings: [
    { id: 'o1', kind: 'door', a: 'living', b: 'exterior', side: 's', offset: 1.5, width: 0.9 },
    { id: 'o2', kind: 'door', a: 'bedroom', b: 'living', side: 'e', offset: 1.7, width: 0.9 },
    { id: 'o3', kind: 'door', a: 'kitchen', b: 'living', side: 's', offset: 1.2, width: 0.9 },
    { id: 'o4', kind: 'door', a: 'bath', b: 'living', side: 'w', offset: 1.3, width: 0.9 },
    // second kitchen door on a run-candidate wall, exercises placeRun avoidance
    { id: 'o5', kind: 'door', a: 'kitchen', b: 'exterior', side: 'w', offset: 1.3, width: 0.9 },
    { id: 'o6', kind: 'window', a: 'bedroom', b: 'exterior', side: 'w', offset: 1.7, width: 1.2 },
    { id: 'o7', kind: 'window', a: 'kitchen', b: 'exterior', side: 'n', offset: 1.2, width: 1.2 },
    { id: 'o8', kind: 'window', a: 'bath', b: 'exterior', side: 'e', offset: 1.3, width: 1.2 },
    { id: 'o9', kind: 'window', a: 'living', b: 'exterior', side: 's', offset: 3.6, width: 1.5 },
  ],
}

// doorZonesFor: living's own south entrance + three mirrored neighbor doors
{
  checks++
  const zones = doorZonesFor(HOME.rooms[0], HOME)
  const expect: DoorZone[] = [
    { side: 's', from: 1.05, to: 1.95 }, // own entrance
    { side: 'w', from: 1.85, to: 2.75 }, // mirrored from bedroom's east door
    { side: 'n', from: 3.15, to: 4.05 }, // mirrored from kitchen's south door
    { side: 'e', from: 1.85, to: 2.75 }, // mirrored from bath's west door
  ]
  const match =
    zones.length === expect.length &&
    expect.every(
      (e, i) =>
        zones[i].side === e.side &&
        Math.abs(zones[i].from - e.from) < 1e-9 &&
        Math.abs(zones[i].to - e.to) < 1e-9,
    )
  if (!match) fail(`doorZonesFor(living): got ${JSON.stringify(zones)}`)
}

// every fixture room: determinism + bounds + overlaps + door strips
for (const seed of SEEDS) {
  for (const salt of SALTS) {
    for (const room of HOME.rooms) {
      const doors = doorZonesFor(room, HOME)
      checkDoorAwareLayout(
        `home/${room.id}/${seed}/salt${salt}`,
        {
          roomType: room.type,
          seed: `${seed}@${room.id}`,
          salt,
          width: room.rect.w,
          depth: room.rect.d,
          extras: 85,
          models: allModels(),
          doors,
        },
        doors,
      )
    }
  }
}

// door stress: one living room, a 0.9 m door centered on each of the 4 walls
{
  const W = 6.4
  const doors: DoorZone[] = (['n', 's', 'e', 'w'] as const).map((side) => ({
    side,
    from: W / 2 - 0.45,
    to: W / 2 + 0.45,
  }))
  for (const seed of SEEDS) {
    for (const salt of SALTS) {
      checkDoorAwareLayout(
        `door-stress/${seed}/salt${salt}`,
        {
          roomType: 'living',
          seed: `${seed}@stress`,
          salt,
          width: W,
          depth: W,
          extras: 85,
          models: allModels(),
          doors,
        },
        doors,
      )
    }
  }
}

if (failures > 0) {
  console.error(`\nsmoke-gen: ${failures} failure(s) across ${checks} checks`)
  process.exit(1)
}
console.log(
  `smoke-gen OK: ${checks} checks ` +
    `(${ROOM_TYPES.length} room types x ${SEEDS.length} seeds x ${SALTS.length} salts ` +
    `+ door zones + ${HOME.rooms.length + 1} door-aware rooms)`,
)
