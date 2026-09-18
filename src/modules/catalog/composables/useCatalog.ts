import { onUnmounted, ref } from 'vue'
import type { ApiClient, Book } from '../../../shared/types'

export const DEFAULT_PER_PAGE = 20

export interface CatalogFilters {
  search: string
  authorId: number | null
  year: number | null
  page: number
  perPage: number
}

export interface CatalogState extends CatalogFilters {
  items: Book[]
  total: number
  loading: boolean
  error: string
}

function toQuery(filters: CatalogFilters): Record<string, string> {
  const q: Record<string, string> = {}
  if (filters.page > 1) q.page = String(filters.page)
  if (filters.perPage !== DEFAULT_PER_PAGE) q['per-page'] = String(filters.perPage)
  if (filters.authorId != null) q.author_id = String(filters.authorId)
  if (filters.year != null) q.year = String(filters.year)
  if (filters.search) q.search = filters.search
  return q
}

function num(value: unknown, fallback: number): number {
  if (Array.isArray(value)) value = value[0]
  const n = typeof value === 'string' || typeof value === 'number' ? Number(value) : NaN
  return Number.isFinite(n) && n >= 1 ? Math.trunc(n) : fallback
}

export function useCatalog(client: Pick<ApiClient, 'listBooks'>, delayMs = 300) {
  const search = ref('')
  const authorId = ref<number | null>(null)
  const year = ref<number | null>(null)
  const page = ref(1)
  const perPage = ref(DEFAULT_PER_PAGE)
  const items = ref<Book[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  let active = 0

  const snapshot = (): CatalogFilters => ({
    search: search.value,
    authorId: authorId.value,
    year: year.value,
    page: page.value,
    perPage: perPage.value,
  })

  async function load(): Promise<void> {
    const job = ++active
    loading.value = true
    error.value = ''
    try {
      const data = await client.listBooks({
        page: page.value,
        per_page: perPage.value,
        author_id: authorId.value ?? undefined,
        year: year.value ?? undefined,
        search: search.value || undefined,
      })
      if (job !== active) return
      items.value = data.items
      total.value = data.pagination.total
    } catch (e) {
      if (job !== active) return
      error.value = e instanceof Error ? e.message : 'Не удалось загрузить книги'
    } finally {
      if (job === active) loading.value = false
    }
  }

  function reload(pageValue = 1): void {
    page.value = pageValue
    void load()
  }

  function setSearch(value: string | undefined): void {
    search.value = value ?? ''
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => reload(1), delayMs)
  }

  onUnmounted(() => { if (timer) clearTimeout(timer) })

  function setFromQuery(query: Record<string, unknown>): void {
    page.value = num(query.page, 1)
    perPage.value = num(query['per-page'], DEFAULT_PER_PAGE)
    const author = query.author_id
    authorId.value = typeof author === 'string' && /^\d+$/.test(author) ? Number(author) : null
    const queryYear = query.year
    year.value = typeof queryYear === 'string' && /^\d+$/.test(queryYear) ? Number(queryYear) : null
    const searchQuery = query.search
    search.value = Array.isArray(searchQuery) ? String(searchQuery[0] ?? '') : typeof searchQuery === 'string' ? searchQuery : ''
  }

  return {
    search,
    authorId,
    year,
    page,
    perPage,
    items,
    total,
    loading,
    error,
    load,
    reload,
    setSearch,
    toQuery: () => toQuery(snapshot()),
    applyQuery: setFromQuery,
  }
}