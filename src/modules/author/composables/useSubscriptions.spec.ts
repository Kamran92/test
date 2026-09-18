import { beforeEach, describe, expect, it } from 'vitest'
import { createSubscriptions } from './useSubscriptions'

function stubStorage(): Storage {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => void Object.keys(store).forEach((k) => delete store[k]),
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length
    },
  } as Storage
}

describe('createSubscriptions', () => {
  let storage: Storage

  beforeEach(() => {
    storage = stubStorage()
  })

  it('subscribe запоминает подписку и телефон', () => {
    const subs = createSubscriptions(storage)
    expect(subs.isSubscribed(1)).toBe(false)
    subs.subscribe(1, '+7 900 000-00-00')
    expect(subs.isSubscribed(1)).toBe(true)
    expect(subs.phoneOf(1)).toBe('+7 900 000-00-00')
  })

  it('unsubscribe отменяет подписку', () => {
    const subs = createSubscriptions(storage)
    subs.subscribe(1, '+7 111')
    subs.unsubscribe(1)
    expect(subs.isSubscribed(1)).toBe(false)
  })

  it('подписки персистятся в storage', () => {
    const subs = createSubscriptions(storage)
    subs.subscribe(2, '+7 222')
    const revived = createSubscriptions(storage)
    expect(revived.isSubscribed(2)).toBe(true)
    expect(revived.phoneOf(2)).toBe('+7 222')
  })

  it('разные авторы — независимые подписки', () => {
    const subs = createSubscriptions(storage)
    subs.subscribe(1, 'a')
    subs.subscribe(2, 'b')
    expect(subs.isSubscribed(1)).toBe(true)
    expect(subs.isSubscribed(2)).toBe(true)
    subs.unsubscribe(1)
    expect(subs.isSubscribed(1)).toBe(false)
    expect(subs.isSubscribed(2)).toBe(true)
  })
})