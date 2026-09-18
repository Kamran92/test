import { reactive } from 'vue'

const STORAGE_KEY = 'subscriptions'

export function createSubscriptions(storage: Storage = localStorage) {
  const map = reactive(new Map<number, string>())

  function restore(): void {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) return
      const entries = JSON.parse(raw) as [number, string][]
      map.clear()
      entries.forEach(([id, phone]) => map.set(id, phone))
    } catch {
      storage.removeItem(STORAGE_KEY)
    }
  }
  restore()

  function persist(): void {
    storage.setItem(STORAGE_KEY, JSON.stringify([...map.entries()]))
  }

  return {
    isSubscribed: (authorId: number) => map.has(authorId),
    phoneOf: (authorId: number) => map.get(authorId),
    subscribe(authorId: number, phone: string): void {
      map.set(authorId, phone)
      persist()
    },
    unsubscribe(authorId: number): void {
      map.delete(authorId)
      persist()
    },
  }
}

export const subscriptions = createSubscriptions()

export function useSubscriptions() {
  return subscriptions
}