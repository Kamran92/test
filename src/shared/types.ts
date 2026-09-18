export interface AuthorShort {
  id: number
  full_name: string
}

export interface Book {
  id: number
  title: string
  year: number
  description?: string
  isbn?: string
  cover_url?: string
  authors: AuthorShort[]
}

export interface BookShort {
  id: number
  title: string
  year: number
}

export type BookCardData = Pick<Book, 'id' | 'title' | 'year' | 'isbn' | 'cover_url' | 'authors'>

export interface Author {
  id: number
  full_name: string
  books: BookShort[]
}

export interface UserData {
  id: number
  username: string
  role: string
}

export interface LoginData {
  token: string
  expires_at: string
  user: UserData
}

export interface Pagination {
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface BookListData {
  items: Book[]
  pagination: Pagination
}

export interface AuthorListData {
  items: AuthorShort[]
  pagination: Pagination
}

export interface TopAuthor {
  rank: number
  author_id: number
  full_name: string
  books_count: number
}

export interface TopAuthorsData {
  year: number
  items: TopAuthor[]
}

export interface ErrorItem {
  field?: string
  message: string
}

export interface BookFormPayload {
  title: string
  year: number
  description?: string
  isbn?: string
  author_ids: number[]
  cover?: File
}

export interface ListBooksParams {
  page: number
  per_page: number
  author_id?: number | null
  year?: number | null
  search?: string
}

export interface ListAuthorsParams {
  page: number
  per_page: number
  search?: string
}

export interface ApiClient {
  login(username: string, password: string): Promise<LoginData>
  listBooks(params: ListBooksParams): Promise<BookListData>
  getBook(id: number): Promise<Book>
  createBook(payload: BookFormPayload): Promise<Book>
  updateBook(id: number, payload: BookFormPayload): Promise<Book>
  deleteBook(id: number): Promise<void>
  listAuthors(params: ListAuthorsParams): Promise<AuthorListData>
  getAuthor(id: number): Promise<Author>
  getTopAuthors(year: number): Promise<TopAuthorsData>
}