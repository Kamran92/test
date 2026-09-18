import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAuth } from './useAuth'
import type { LoginData, UserData } from '../types'

type StorageStub = Record<string, string>

function stubStorage(): Storage {
  const store: StorageStub = {}
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

const loginData = (username: string): LoginData => ({
  token: `token-${username}`,
  expires_at: new Date().toISOString(),
  user: { id: 1, username, role: 'user' },
})

describe('createAuth', () => {
  let storage: Storage
  let client: { login: (u: string, p: string) => Promise<LoginData> }

  beforeEach(() => {
    storage = stubStorage()
    client = {
      login: vi.fn(async (u: string) => loginData(u)),
    }
  })

  it('создаёт авторизацию без токена', () => {
    const auth = createAuth(client, storage)
    expect(auth.isUser.value).toBe(false)
    expect(auth.state.token).toBeNull()
  })

  it('login сохраняет токен и юзера, isUser → true', async () => {
    const auth = createAuth(client, storage)
    const user: UserData = await auth.login('alice', 'pass')
    expect(user.role).toBe('user')
    expect(auth.state.token).toBe('token-alice')
    expect(auth.isUser.value).toBe(true)
    expect(JSON.parse(storage.getItem('auth') as string)).toEqual({
      token: 'token-alice',
      user: { id: 1, username: 'alice', role: 'user' },
    })
  })

  it('logout очищает состояние и storage', async () => {
    const auth = createAuth(client, storage)
    await auth.login('alice', 'pass')
    auth.logout()
    expect(auth.state.token).toBeNull()
    expect(auth.isUser.value).toBe(false)
    expect(storage.getItem('auth')).toBeNull()
  })

  it('восстанавливает сессию из storage', async () => {
    storage.setItem('auth', JSON.stringify({ token: 'restored', user: { id: 7, username: 'bob', role: 'user' } }))
    const auth = createAuth(client, storage)
    expect(auth.state.token).toBe('restored')
    expect(auth.state.user?.username).toBe('bob')
  })

  it('пробрасывает ошибку логина из клиента', async () => {
    const failing: { login: (u: string, p: string) => Promise<LoginData> } = {
      login: vi.fn(async () => Promise.reject(new Error('bad credentials'))),
    }
    const auth = createAuth(failing, storage)
    await expect(auth.login('a', 'b')).rejects.toThrow('bad credentials')
    expect(auth.isUser.value).toBe(false)
  })
})