import { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF, Edges, Outlines } from '@react-three/drei'
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { EDGE, SELECT_EDGE } from '../models/parametric/shared'
import { applyToon, toonGradientMap } from '../lib/toon'

/** GLB selection tint (slightly deeper than the parametric SELECT_FILL). */
const GLB_SELECT_FILL = '#c9d9ff'

// One shared toon material instance for every selected GLB mesh in the scene.
// DoubleSide: some source models carry mirrored (negative-scale) transforms —
// single-sided materials would render them inside-out and near-black.
const selectedMaterial = new THREE.MeshToonMaterial({
  color: GLB_SELECT_FILL,
  gradientMap: toonGradientMap(),
  side: THREE.DoubleSide,
})

interface FlatMesh {
  key: string
  geometry: THREE.BufferGeometry
  /** toonified source material (shared cache in lib/toon — never dispose) */
  material: THREE.Material
  position: THREE.Vector3
  quaternion: THREE.Quaternion
  scale: THREE.Vector3
  edgeThreshold: number
  /** geometry too smooth for EdgesGeometry at any sane threshold — use hull outline */
  outlineOnly: boolean
}

// ---------------------------------------------------------------------------
// Adaptive edge threshold: EdgesGeometry only emits lines where the dihedral
// angle exceeds the threshold, so smooth low-poly models (lounge sofas, some
// plants) end up with ZERO outline at 20°. Step the threshold down per
// geometry until a sane number of segments appears (cached per geometry);
// when even 6° yields nothing, the mesh gets an inverted-hull outline.
// ---------------------------------------------------------------------------

const thresholdCache = new Map<string, { edgeThreshold: number; outlineOnly: boolean }>()

function edgeModeFor(geom: THREE.BufferGeometry): { edgeThreshold: number; outlineOnly: boolean } {
  const hit = thresholdCache.get(geom.uuid)
  if (hit) return hit
  const CANDIDATES = [20, 12, 6]
  let chosen = 20
  let lastSegs = 0
  for (let i = 0; i < CANDIDATES.length; i++) {
    const eg = new THREE.EdgesGeometry(geom, CANDIDATES[i])
    const segs = eg.getAttribute('position').count / 2
    eg.dispose()
    lastSegs = segs
    if (segs >= 12) {
      // don't drown dense meshes in a wireframe soup either
      chosen = segs > 8000 && i > 0 ? CANDIDATES[i - 1] : CANDIDATES[i]
      break
    }
    if (i === CANDIDATES.length - 1) chosen = CANDIDATES[i]
  }
  const result = { edgeThreshold: chosen, outlineOnly: lastSegs < 12 }
  thresholdCache.set(geom.uuid, result)
  return result
}

export interface EdgedModelProps {
  /** public URL or object URL of the GLB */
  url: string
  /** registry footprint the model is normalized to (meters, before instance scale) */
  footprint: [number, number]
  selected?: boolean
  /** ceiling-mounted: hang the model below the group origin instead of grounding it */
  hang?: boolean
}

/**
 * GLB rendered in the house cartoon style: the source asset's own flat colors
 * as toon materials, dark edge lines, auto-grounded (min.y = 0, centered on
 * x/z; with `hang`, max.y = 0 instead) and uniformly scaled so its
 * bounding-box footprint fits inside `footprint`.
 *
 * Geometry is shared with the useGLTF cache; only the scene graph is cloned
 * (via SkeletonUtils so skinned meshes survive) and flattened once per model.
 */
export default function EdgedModel({ url, footprint, selected, hang }: EdgedModelProps) {
  const { scene } = useGLTF(url)

  const { meshes, box } = useMemo(() => {
    const root = skeletonClone(scene)
    applyToon(root)
    root.updateMatrixWorld(true)
    const rootInv = root.matrixWorld.clone().invert()
    const meshes: FlatMesh[] = []
    root.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh) return
      const rel = new THREE.Matrix4().multiplyMatrices(rootInv, m.matrixWorld)
      const position = new THREE.Vector3()
      const quaternion = new THREE.Quaternion()
      const scale = new THREE.Vector3()
      rel.decompose(position, quaternion, scale)
      meshes.push({
        key: m.uuid,
        geometry: m.geometry,
        material: Array.isArray(m.material) ? m.material[0] : m.material,
        position,
        quaternion,
        scale,
        ...edgeModeFor(m.geometry),
      })
    })
    return { meshes, box: new THREE.Box3().setFromObject(root) }
  }, [scene])

  const { scaleFactor, offset } = useMemo(() => {
    const size = new THREE.Vector3()
    box.getSize(size)
    const sx = size.x > 1e-6 ? footprint[0] / size.x : 1
    const sz = size.z > 1e-6 ? footprint[1] / size.z : 1
    const s = Math.min(sx, sz) // fit inside, uniform
    const center = new THREE.Vector3()
    box.getCenter(center)
    return {
      scaleFactor: s,
      offset: new THREE.Vector3(-center.x * s, hang ? -box.max.y * s : -box.min.y * s, -center.z * s),
    }
  }, [box, footprint, hang])

  return (
    <group position={offset} scale={scaleFactor}>
      {meshes.map((m) => (
        <group key={m.key} position={m.position} quaternion={m.quaternion} scale={m.scale}>
          <mesh geometry={m.geometry} material={selected ? selectedMaterial : m.material} castShadow receiveShadow>
            {m.outlineOnly ? (
              <Outlines thickness={1} color={selected ? SELECT_EDGE : EDGE} />
            ) : (
              <Edges threshold={m.edgeThreshold} lineWidth={1} color={selected ? SELECT_EDGE : EDGE} />
            )}
          </mesh>
        </group>
      ))}
    </group>
  )
}
