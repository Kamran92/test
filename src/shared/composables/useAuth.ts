import { computed, reactive } from 'vue'
import type { ApiClient, UserData } from '../types'
import { api } from '../api'

const STORAGE_KEY = 'auth'

export interface AuthApi {
  login: ApiClient['login']
}

export interface AuthState {
  token: string | null
  user: UserData | null
}

export function createAuth(client: Pick<ApiClient, 'login'>, storage: Storage = localStorage) {
  const state = reactive<AuthState>({ token: null, user: null })

  function restore(): void {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw) as Partial<AuthState>
      state.token = data.token ?? null
      state.user = data.user ?? null
    } catch {
      storage.removeItem(STORAGE_KEY)
    }
  }
  restore()

  async function login(username: string, password: string): Promise<UserData> {
    const data = await client.login(username, password)
    state.token = data.token
    state.user = data.user
    storage.setItem(STORAGE_KEY, JSON.stringify({ token: data.token, user: data.user }))
    return data.user
  }

  function logout(): void {
    state.token = null
    state.user = null
    storage.removeItem(STORAGE_KEY)
  }

  const isUser = computed(() => Boolean(state.token) && state.user?.role === 'user')

  return { state, isUser, login, logout }
}

export const auth = createAuth(api)

export function useAuth() {
  return auth
}