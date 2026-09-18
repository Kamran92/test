import { ref } from 'vue'
import type { AuthorShort } from '../types'
import type { ApiClient } from '../types'
import { api } from '../api'

export function createAuthorsOptions(client: Pick<ApiClient, 'listAuthors'> = api) {
  const authorOptions = ref<AuthorShort[]>([])
  const loaded = ref(false)

  async function ensureLoaded(): Promise<void> {
    if (loaded.value) return
    const data = await client.listAuthors({ page: 1, per_page: 200 })
    authorOptions.value = data.items
    loaded.value = true
  }

  return { authorOptions, ensureLoaded }
}

export const authorsOptions = createAuthorsOptions()

export function useAuthorsOptions() {
  return authorsOptions
}