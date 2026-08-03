// Dump real bounding boxes of every GLB, grouped by manifest type, for size-rule design.
import { NodeIO, getBounds } from '@gltf-transform/core'
import { KHRONOS_EXTENSIONS } from '@gltf-transform/extensions'
import { readdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'

const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS)
const manifest = JSON.parse(readFileSync('src/assets/manifest.json', 'utf8'))
const rows = []
for (const m of manifest) {
  const file = path.join('public', m.file)
  try {
    const doc = await io.read(file)
    const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0]
    const b = getBounds(scene)
    rows.push({
      id: m.id,
      type: m.type,
      w: +(b.max[0] - b.min[0]).toFixed(2),
      h: +(b.max[1] - b.min[1]).toFixed(2),
      d: +(b.max[2] - b.min[2]).toFixed(2),
      minY: +b.min[1].toFixed(2),
    })
  } catch (e) {
    rows.push({ id: m.id, type: m.type, error: e.message })
  }
}
rows.sort((a, b) => a.type.localeCompare(b.type) || a.id.localeCompare(b.id))
writeFileSync('.asset-cache/bbox-audit.json', JSON.stringify(rows, null, 1))
let cur = ''
for (const r of rows) {
  if (r.type !== cur) { cur = r.type; console.log(`\n== ${cur} ==`) }
  console.log(r.error ? `${r.id} ERROR` : `${r.id.padEnd(42)} ${String(r.w).padStart(5)} x ${String(r.h).padStart(5)} x ${String(r.d).padStart(5)}  minY=${r.minY}`)
}
