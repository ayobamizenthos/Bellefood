const store = new Map<string, { value: unknown; expires: number }>()

export function getCache<T>(key: string): T | undefined {
  const hit = store.get(key)
  if (!hit) return undefined
  if (hit.expires < Date.now()) {
    store.delete(key)
    return undefined
  }
  return hit.value as T
}

export function setCache(key: string, value: unknown, ttlMs = 60_000): void {
  store.set(key, { value, expires: Date.now() + ttlMs })
}
