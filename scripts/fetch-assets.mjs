#!/usr/bin/env node
/**
 * Fetches third-party 3D assets into public/models/:
 *
 *  1. Kenney Furniture Kit — downloads the zip from kenney.nl and extracts
 *     only `Models/GLB format/*.glb` (flat) plus License.txt.
 *  2. KayKit Furniture Bits & Restaurant Bits — shallow git clones into
 *     .asset-cache/, converts every .gltf to GLB via @gltf-transform/cli.
 *
 * Idempotent: each finished source leaves a marker in .asset-cache/.markers;
 * on later runs completed sources are skipped (partial work is resumed, since
 * existing .glb outputs are never regenerated).
 *
 * A source that fails is retried once, then reported; the script exits 1 if
 * any source failed.
 */
import { execFileSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const CACHE = join(ROOT, '.asset-cache')
const MARKERS = join(CACHE, '.markers')
const MODELS = join(ROOT, 'public', 'models')

const KENNEY_ZIP_URL =
  'https://kenney.nl/media/pages/assets/furniture-kit/440e0608a4-1677580847/kenney_furniture-kit.zip'
const KENNEY_PAGE_URL = 'https://kenney.nl/assets/furniture-kit'

const KAYKIT_REPOS = [
  {
    url: 'https://github.com/KayKit-Game-Assets/KayKit-Furniture-Bits-1.0',
    dest: 'kaykit-furniture',
  },
  {
    url: 'https://github.com/KayKit-Game-Assets/KayKit-Restaurant-Bits-1.0',
    dest: 'kaykit-restaurant',
  },
]

const log = (msg) => console.log(`[fetch-assets] ${msg}`)

function countGlbs(dir) {
  if (!existsSync(dir)) return 0
  return readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.glb')).length
}

function isDone(label, destDir) {
  return existsSync(join(MARKERS, label)) && countGlbs(destDir) > 0
}

function markDone(label) {
  mkdirSync(MARKERS, { recursive: true })
  writeFileSync(join(MARKERS, label), `${new Date().toISOString()}\n`)
}

async function withRetry(fn, label) {
  try {
    return await fn()
  } catch (err) {
    log(`${label} failed (${err.message}); retrying once...`)
    return await fn()
  }
}

async function download(url, destPath) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} for ${url}`)
    err.status = res.status
    throw err
  }
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(destPath, buf)
  return buf.length
}

// ---------------------------------------------------------------- Kenney ---

async function fetchKenney() {
  const dest = join(MODELS, 'kenney')
  if (isDone('kenney', dest)) {
    return log(`kenney: ${countGlbs(dest)} GLBs already present, skipping`)
  }
  mkdirSync(CACHE, { recursive: true })
  mkdirSync(dest, { recursive: true })

  const zipPath = join(CACHE, 'kenney_furniture-kit.zip')
  if (!existsSync(zipPath)) {
    await withRetry(async () => {
      try {
        const size = await download(KENNEY_ZIP_URL, zipPath)
        log(`kenney: downloaded ${(size / 1e6).toFixed(1)} MB`)
      } catch (err) {
        if (err.status !== 404) throw err
        log('kenney: direct zip URL returned 404, scraping asset page for zip link')
        const page = await (await fetch(KENNEY_PAGE_URL, { redirect: 'follow' })).text()
        const m =
          page.match(/href="([^"]*kenney_furniture-kit\.zip[^"]*)"/) ??
          page.match(/href="([^"]+\.zip[^"]*)"/)
        if (!m) throw new Error('no .zip link found on the Kenney furniture-kit page')
        const url = new URL(m[1], KENNEY_PAGE_URL).href
        const size = await download(url, zipPath)
        log(`kenney: downloaded ${(size / 1e6).toFixed(1)} MB from ${url}`)
      }
    }, 'kenney download')
  } else {
    log('kenney: zip already in .asset-cache, reusing')
  }

  const listing = execFileSync('unzip', ['-l', zipPath], { encoding: 'utf8' })
  const entries = [
    ...listing.matchAll(/^\s*\d+\s+\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}\s+(.+)$/gm),
  ].map((m) => m[1].trim())

  // The kit's model dir is "Models/GLTF format/" in current zips (older docs
  // say "GLB format"), so locate .glb entries in the listing instead of
  // hardcoding the folder name.
  const glbEntries = entries.filter((e) => e.toLowerCase().endsWith('.glb'))
  if (glbEntries.length === 0) throw new Error('kenney: zip contains no .glb files')
  const prefixes = [...new Set(glbEntries.map((e) => e.slice(0, e.lastIndexOf('/') + 1)))]
  await withRetry(async () => {
    // -j junks paths so the GLBs land flat in public/models/kenney/
    for (const prefix of prefixes) {
      execFileSync('unzip', ['-o', '-j', zipPath, `${prefix}*.glb`, '-d', dest], {
        stdio: ['ignore', 'ignore', 'inherit'],
      })
    }
  }, 'kenney unzip')

  const licenseEntry = entries.find((e) => /(^|\/)licen[cs]e\.txt$/i.test(e))
  if (licenseEntry) {
    writeFileSync(join(dest, 'LICENSE.txt'), execFileSync('unzip', ['-p', zipPath, licenseEntry]))
    log(`kenney: kept "${licenseEntry}" as LICENSE.txt (CC0)`)
  }

  const n = countGlbs(dest)
  if (n === 0) throw new Error('kenney: no GLBs were extracted')
  markDone('kenney')
  log(`kenney: extracted ${n} GLBs`)
}

// ---------------------------------------------------------------- KayKit ---

function findFiles(dir, re) {
  const out = []
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git') continue
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (re.test(e.name)) out.push(p)
    }
  }
  walk(dir)
  return out.sort()
}

function kebab(name) {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

const GLTF_TRANSFORM_BIN = join(ROOT, 'node_modules', '.bin', 'gltf-transform')

function toGlb(input, output, cwd) {
  if (existsSync(GLTF_TRANSFORM_BIN)) {
    execFileSync(GLTF_TRANSFORM_BIN, ['copy', input, output], {
      stdio: ['ignore', 'ignore', 'inherit'],
      cwd,
    })
  } else {
    execFileSync('npx', ['--yes', '@gltf-transform/cli', 'copy', input, output], {
      stdio: ['ignore', 'ignore', 'inherit'],
      cwd,
    })
  }
}

async function fetchKaykit({ url, dest }) {
  const destDir = join(MODELS, dest)
  if (isDone(dest, destDir)) {
    return log(`${dest}: ${countGlbs(destDir)} GLBs already present, skipping`)
  }
  mkdirSync(CACHE, { recursive: true })
  mkdirSync(destDir, { recursive: true })

  const cloneDir = join(CACHE, basename(url))
  if (!existsSync(join(cloneDir, '.git'))) {
    await withRetry(async () => {
      execFileSync('git', ['clone', '--depth', '1', url, cloneDir], {
        stdio: ['ignore', 'inherit', 'inherit'],
      })
    }, `git clone ${url}`)
  } else {
    log(`${dest}: clone already in .asset-cache, reusing`)
  }

  const gltfs = findFiles(cloneDir, /\.gltf$/i)
  if (gltfs.length === 0) throw new Error(`${dest}: no .gltf files found in ${cloneDir}`)
  log(`${dest}: converting ${gltfs.length} .gltf files to GLB`)

  const used = new Set()
  let converted = 0
  for (const input of gltfs) {
    let name = kebab(basename(input)) || `model-${converted + 1}`
    let candidate = name
    for (let i = 2; used.has(candidate); i += 1) candidate = `${name}-${i}`
    used.add(candidate)
    const output = join(destDir, `${candidate}.glb`)
    if (!existsSync(output)) {
      await withRetry(async () => toGlb(input, output, dirname(input)), `convert ${basename(input)}`)
    }
    converted += 1
    if (converted % 25 === 0) log(`${dest}: ${converted}/${gltfs.length}`)
  }

  const license = readdirSync(cloneDir).find((f) => /^licen[cs]e(\..+)?$/i.test(f))
  if (license) {
    const outName = /\.txt$/i.test(license) ? 'LICENSE.txt' : license
    copyFileSync(join(cloneDir, license), join(destDir, outName))
    log(`${dest}: copied ${license} as ${outName}`)
  } else {
    log(`${dest}: WARNING no license file found at repo root`)
  }

  markDone(dest)
  log(`${dest}: converted ${converted} GLBs`)
}

// ------------------------------------------------------------------ main ---

const failures = []
for (const [label, fn] of [
  ['kenney', fetchKenney],
  ...KAYKIT_REPOS.map((k) => [k.dest, () => fetchKaykit(k)]),
]) {
  try {
    await fn()
  } catch (err) {
    failures.push(label)
    console.error(`[fetch-assets] ERROR ${label}: ${err.message}`)
  }
}

if (failures.length > 0) {
  console.error(`[fetch-assets] FAILED sources: ${failures.join(', ')}`)
  process.exit(1)
}
log('all sources done')
