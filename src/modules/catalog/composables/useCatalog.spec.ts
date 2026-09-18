import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCatalog, DEFAULT_PER_PAGE } from './useCatalog'
import type { ApiClient, BookListData } from '../../../shared/types'

function makeBookList(items: { id: number; title: string }[]): BookListData {
  return {
    items: items.map((b) => ({ ...b, year: 2026, authors: [] })),
    pagination: { total: items.length, page: 1, per_page: DEFAULT_PER_PAGE, total_pages: 1 },
  }
}

const book = (id: number, title: string) => ({ id, title })

describe('useCatalog', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('load вызывает listBooks с текущими фильтрами', async () => {
    const listBooks = vi.fn(async (_params: Parameters<ApiClient['listBooks']>[0]) => makeBookList([book(1, 'А')]))
    const catalog = useCatalog({ listBooks })
    await catalog.load()
    expect(listBooks).toHaveBeenCalledWith({
      page: 1,
      per_page: DEFAULT_PER_PAGE,
      author_id: undefined,
      year: undefined,
      search: undefined,
    })
    expect(catalog.items.value).toHaveLength(1)
  })

  it('setSearch откладывает запрос и сбрасывает страницу', async () => {
    vi.useFakeTimers()
    const listBooks = vi.fn(async (_params: Parameters<ApiClient['listBooks']>[0]) => makeBookList([]))
    const catalog = useCatalog({ listBooks })
    catalog.page.value = 3
    catalog.setSearch('роман')
    expect(listBooks).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(301)
    expect(listBooks).toHaveBeenCalledTimes(1)
    expect(listBooks.mock.calls[0][0]).toMatchObject({ page: 1, search: 'роман' })
  })

  it('при ошибке кладёт сообщение в error', async () => {
    const listBooks = vi.fn(async (_params: Parameters<ApiClient['listBooks']>[0]) => Promise.reject(new Error('Сеть недоступна')))
    const catalog = useCatalog({ listBooks })
    await catalog.load()
    expect(catalog.error.value).toBe('Сеть недоступна')
  })

  it('toQuery пропускает значения по умолчанию', () => {
    const listBooks = vi.fn(async (_params: Parameters<ApiClient['listBooks']>[0]) => makeBookList([]))
    const catalog = useCatalog({ listBooks })
    expect(catalog.toQuery()).toEqual({})
    catalog.page.value = 2
    catalog.authorId.value = 5
    catalog.year.value = 2026
    expect(catalog.toQuery()).toEqual({ page: '2', author_id: '5', year: '2026' })
  })

  it('per-page включается в query только если отличается от дефолта', () => {
    const listBooks = vi.fn(async (_params: Parameters<ApiClient['listBooks']>[0]) => makeBookList([]))
    const catalog = useCatalog({ listBooks })
    catalog.perPage.value = 50
    expect(catalog.toQuery()).toEqual({ 'per-page': '50' })
  })

  it('applyQuery восстанавливает состояние из query и игнорирует мусор', () => {
    const listBooks = vi.fn(async (_params: Parameters<ApiClient['listBooks']>[0]) => makeBookList([]))
    const catalog = useCatalog({ listBooks })
    catalog.applyQuery({ page: '3', 'per-page': '10', author_id: '7', year: '2026', search: 'город', junk: 'x' })
    expect(catalog.page.value).toBe(3)
    expect(catalog.perPage.value).toBe(10)
    expect(catalog.authorId.value).toBe(7)
    expect(catalog.year.value).toBe(2026)
    expect(catalog.search.value).toBe('город')
  })

  it('applyQuery для массива search берёт первый элемент', () => {
    const listBooks = vi.fn(async (_params: Parameters<ApiClient['listBooks']>[0]) => makeBookList([]))
    const catalog = useCatalog({ listBooks })
    catalog.applyQuery({ search: ['первый', 'второй'] })
    expect(catalog.search.value).toBe('первый')
  })

  it('reload обновляет страницу и грузит', async () => {
    const listBooks = vi.fn(async (_params: Parameters<ApiClient['listBooks']>[0]) => makeBookList([book(1, 'А')]))
    const catalog = useCatalog({ listBooks })
    catalog.reload(2)
    expect(catalog.page.value).toBe(2)
    expect(listBooks).toHaveBeenCalled()
  })
})