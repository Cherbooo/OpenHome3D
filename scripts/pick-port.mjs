import { randomInt } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const MIN_PORT = 40000
const MAX_PORT = 65000
// vite loads this file with cwd = project root, and the CLI below is also run
// from the project root, so cwd is a stable anchor for the .port cache file.
const PORT_FILE = join(process.cwd(), '.port')

/**
 * Returns a stable random high port for the dev server. The port is generated
 * once, cached in `.port`, and reused on subsequent runs. Combined with
 * `strictPort: false` in vite.config.ts, vite will bump to the next free port
 * if this one happens to be busy.
 */
export function pickPort() {
  try {
    if (existsSync(PORT_FILE)) {
      const port = Number.parseInt(readFileSync(PORT_FILE, 'utf8').trim(), 10)
      if (Number.isInteger(port) && port >= MIN_PORT && port <= MAX_PORT) {
        return port
      }
    }
  } catch {
    // unreadable/corrupt cache file: fall through and regenerate
  }
  const port = randomInt(MIN_PORT, MAX_PORT + 1)
  writeFileSync(PORT_FILE, `${port}\n`)
  return port
}

// CLI usage: `node scripts/pick-port.mjs` prints (and creates) the cached port.
if (process.argv[1] && process.argv[1].endsWith('pick-port.mjs')) {
  console.log(pickPort())
}
