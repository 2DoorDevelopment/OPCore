import { get as idbGet, set as idbSet } from 'idb-keyval'

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const entry = await idbGet<CacheEntry<T>>(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) return null
  return entry.data
}

export async function cacheSet<T>(key: string, data: T, ttlMs: number): Promise<void> {
  await idbSet(key, { data, expiresAt: Date.now() + ttlMs } satisfies CacheEntry<T>)
}

export const TTL = {
  ONE_HOUR: 60 * 60 * 1000,
  SIX_HOURS: 6 * 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  SEVEN_DAYS: 7 * 24 * 60 * 60 * 1000,
}
