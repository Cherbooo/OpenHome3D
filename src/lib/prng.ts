import seedrandom from 'seedrandom'

/** Seeded pseudo-random stream (seedrandom PRNG). */
export type Rng = seedrandom.PRNG

/** Create a deterministic RNG stream from an arbitrary seed string. */
export function rngFrom(seed: string): Rng {
  return seedrandom(seed)
}

/** Characters allowed in room seeds — uppercase letters + digits, minus ambiguous 0/O/1/I. */
const SEED_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Generate a random 6-char room seed, e.g. "EX5XU6". Uses Math.random (non-deterministic by design). */
export function randomSeed(): string {
  let s = ''
  for (let i = 0; i < 6; i++) {
    s += SEED_ALPHABET[Math.floor(Math.random() * SEED_ALPHABET.length)]
  }
  return s
}

/** Pick a uniformly random element of a non-empty array. */
export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]
}

/** Uniform float in [min, max). */
export function range(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min)
}

/** Uniform integer in [min, max] (inclusive). */
export function int(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/** True with probability p. */
export function chance(rng: Rng, p: number): boolean {
  return rng() < p
}

/** Non-deterministic short id for user-created entities ("nanoid-ish"). */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}
