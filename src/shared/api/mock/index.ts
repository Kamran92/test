import type {
  ApiClient,
  Author,
  AuthorListData,
  AuthorShort,
  Book,
  BookFormPayload,
  BookListData,
  ErrorItem,
  LoginData,
  Pagination,
  TopAuthorsData,
} from '../../types'
import { createDb, type MockDb } from './db'

export class ApiError extends Error {
  readonly errors: ErrorItem[]
  readonly status?: number

  constructor(errors: ErrorItem[], status?: number) {
    super(errors[0]?.message ?? 'Ошибка запроса')
    this.name = 'ApiError'
    this.errors = errors
    this.status = status
  }
}

function readStoredToken(): string | null {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    const data = JSON.parse(raw) as { token?: string }
    return data.token ?? null
  } catch {
    return null
  }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (typeof FileReader === 'undefined') {
      resolve('/covers/upload.svg')
      return
    }
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '/covers/upload.svg')
    reader.onerror = () => resolve('/covers/upload.svg')
    reader.readAsDataURL(file)
  })
}

function validate(form: BookFormPayload, requireCover: boolean): string[] {
  const errors: string[] = []
  if (!form.title?.trim()) errors.push('title|Название обязательно')
  if (!Number.isInteger(form.year) || form.year < 1000 || form.year > new Date().getFullYear() + 1)
    errors.push(`year|Год должен быть числом от 1000 до ${new Date().getFullYear() + 1}`)
  if (!Array.isArray(form.author_ids) || form.author_ids.length === 0)
    errors.push('author_ids|Выберите хотя бы одного автора')
  if (requireCover && !form.cover) errors.push('cover|Обложка обязательна')
  return errors
}

function paginate<T>(items: T[], page: number, perPage: number): { items: T[]; pagination: Pagination } {
  const start = (page - 1) * perPage
  const slice = items.slice(start, start + perPage)
  return {
    items: slice,
    pagination: {
      total: items.length,
      page,
      per_page: perPage,
      total_pages: Math.max(1, Math.ceil(items.length / perPage)),
    },
  }
}

export function createMockClient(db: MockDb = createDb(), getToken: () => string | null = readStoredToken): ApiClient {
  const { books, authors } = db

  const requireAuth = (): void => {
    if (!getToken()) throw new ApiError([{ message: 'Неавторизован' }], 401)
  }

  const findBook = (id: number): Book => {
    const book = books.find((b) => b.id === id)
    if (!book) throw new ApiError([{ message: 'Книга не найдена' }], 404)
    return book
  }

  const findAuthor = (id: number): { id: number; full_name: string } => {
    const author = authors.find((a) => a.id === id)
    if (!author) throw new ApiError([{ message: 'Автор не найден' }], 404)
    return author
  }

  const resolveAuthors = (ids: number[]): AuthorShort[] =>
    authors
      .filter((a) => ids.includes(a.id))
      .map(({ id, full_name }) => ({ id, full_name }))

  const applyForm = async (book: Book, form: BookFormPayload): Promise<Book> => {
    book.title = form.title
    book.year = form.year
    book.description = form.description
    book.isbn = form.isbn
    book.authors = resolveAuthors(form.author_ids)
    if (form.cover) book.cover_url = await fileToDataUrl(form.cover)
    return book
  }

  return {
    async login(username, password) {
      if (!username || !password) throw new ApiError([{ field: 'password', message: 'Неверные учётные данные' }], 401)
      const data: LoginData = {
        token: `mock-token-${Math.random().toString(36).slice(2)}`,
        expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        user: { id: 1, username, role: 'user' },
      }
      return data
    },

    async listBooks(params) {
      const page = Math.max(1, params.page || 1)
      const perPage = params.per_page || 20
      let result = books
      if (params.author_id) result = result.filter((b) => b.authors.some((a) => a.id === params.author_id))
      if (params.year) result = result.filter((b) => b.year === params.year)
      if (params.search) {
        const q = params.search.trim().toLowerCase()
        result = result.filter((b) => b.title.toLowerCase().includes(q))
      }
      const list = [...result].sort((a, b) => a.id - b.id)
      return paginate(list, page, perPage) as BookListData
    },

    async getBook(id) {
      return structuredClone(findBook(id))
    },

    async createBook(form) {
      requireAuth()
      const errors = validate(form, true)
      if (errors.length) {
        throw new ApiError(
          errors.map((e) => {
            const [field, message] = e.split('|')
            return { field, message }
          }),
          422,
        )
      }
      const book: Book = {
        id: db.nextBookId++,
        title: form.title,
        year: form.year,
        description: form.description,
        isbn: form.isbn,
        cover_url: '',
        authors: resolveAuthors(form.author_ids),
      }
      await applyForm(book, form)
      books.push(book)
      return structuredClone(book)
    },

    async updateBook(id, form) {
      requireAuth()
      const book = findBook(id)
      const errors = validate(form, Boolean(form.cover))
      if (errors.length) {
        throw new ApiError(
          errors.map((e) => {
            const [field, message] = e.split('|')
            return { field, message }
          }),
          422,
        )
      }
      await applyForm(book, form)
      return structuredClone(book)
    },

    async deleteBook(id) {
      requireAuth()
      const index = books.findIndex((b) => b.id === id)
      if (index === -1) throw new ApiError([{ message: 'Книга не найдена' }], 404)
      books.splice(index, 1)
    },

    async listAuthors(params) {
      const page = Math.max(1, params.page || 1)
      const perPage = params.per_page || 20
      let result: AuthorShort[] = authors.map(({ id, full_name }) => ({ id, full_name }))
      if (params.search) {
        const q = params.search.trim().toLowerCase()
        result = result.filter((a) => a.full_name.toLowerCase().includes(q))
      }
      const list = [...result].sort((a, b) => a.id - b.id)
      return paginate(list, page, perPage) as AuthorListData
    },

    async getAuthor(id) {
      const { full_name } = findAuthor(id)
      const authorBooks = books
        .filter((b) => b.authors.some((a) => a.id === id))
        .map(({ id: bookId, title, year }) => ({ id: bookId, title, year }))
      const data: Author = { id, full_name, books: authorBooks }
      return structuredClone(data)
    },

    async getTopAuthors(year) {
      if (!Number.isInteger(year) || year <= 0) {
        throw new ApiError([{ field: 'year', message: 'Параметр year не указан или неверен' }], 400)
      }
      const counts = new Map<number, { full_name: string; count: number }>()
      authors.forEach(({ id, full_name }) => counts.set(id, { full_name, count: 0 }))
      books
        .filter((b) => b.year === year)
        .forEach((b) =>
          b.authors.forEach((a) => {
            const entry = counts.get(a.id)
            if (entry) entry.count += 1
          }),
        )
      const ranked = [...counts.entries()]
        .map(([author_id, { full_name, count }]) => ({ author_id, full_name, count }))
        .filter((e) => e.count > 0)
        .sort((a, b) => b.count - a.count || a.full_name.localeCompare(b.full_name, 'ru'))
        .slice(0, 10)
      const items = ranked.map((e, i) => ({ rank: i + 1, author_id: e.author_id, full_name: e.full_name, books_count: e.count }))
      const data: TopAuthorsData = { year, items }
      return data
    },
  }
}