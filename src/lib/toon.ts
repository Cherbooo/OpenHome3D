import * as THREE from 'three'

/* ---------------------------------------------------------------------------
   Cel-shading (toon) helpers — the house cartoon look for every GLB mesh:
   flat base colors from the source asset, hard 4-step light bands via a
   shared gradientMap. Used by both the R3F scene (EdgedModel) and the
   offscreen thumbnail renderer (lib/thumbnails.ts).
--------------------------------------------------------------------------- */

let gradientMap: THREE.DataTexture | null = null

/** Shared 4-step gradient map → hard cel bands instead of smooth shading. */
export function toonGradientMap(): THREE.DataTexture {
  if (!gradientMap) {
    const steps = new Uint8Array([120, 175, 220, 255])
    gradientMap = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat)
    gradientMap.minFilter = THREE.NearestFilter
    gradientMap.magFilter = THREE.NearestFilter
    gradientMap.needsUpdate = true
  }
  return gradientMap
}

const cache = new Map<string, THREE.MeshToonMaterial>()

/**
 * Convert a loaded GLTF material to the house toon look, keeping the source
 * asset's own flat colors: Kenney materials carry flat baseColorFactors,
 * KayKit a small palette atlas texture. Cached per source material; the
 * cached instances are shared — callers must NOT dispose them.
 */
export function toonifyMaterial(src: THREE.Material): THREE.MeshToonMaterial {
  const hit = cache.get(src.uuid)
  if (hit) return hit
  const std = src as THREE.MeshStandardMaterial
  const translucent = std.transparent === true && (std.opacity ?? 1) < 1
  const mat = new THREE.MeshToonMaterial({
    color: std.color ? std.color.clone() : new THREE.Color('#ffffff'),
    map: std.map ?? null,
    gradientMap: toonGradientMap(),
    // some source models carry mirrored (negative-scale) transforms —
    // single-sided materials would render them inside-out and near-black
    side: THREE.DoubleSide,
    transparent: translucent,
    opacity: translucent ? std.opacity : 1,
  })
  mat.userData.shared = true
  cache.set(src.uuid, mat)
  return mat
}

/** Swap every mesh material under `root` for its toon equivalent (in place). */
export function applyToon(root: THREE.Object3D): void {
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    m.material = Array.isArray(m.material)
      ? m.material.map(toonifyMaterial)
      : toonifyMaterial(m.material)
  })
}
