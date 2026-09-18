import type { ErrorItem } from '../types'

export interface BookFormValue {
  title: string
  year: number | null
  description?: string
  isbn?: string
  authorIds: number[]
  cover?: File | null
}

const ISBN_RE = /^(?:\d[\d-]{8,}|\d{10}|\d{13})$/

export function validateBookForm(value: BookFormValue, requireCover = false): ErrorItem[] {
  const errors: ErrorItem[] = []
  if (!value.title.trim()) errors.push({ field: 'title', message: 'Название обязательно' })
  const year = value.year
  if (year == null || !Number.isInteger(year) || year < 1000 || year > new Date().getFullYear() + 1) {
    errors.push({ field: 'year', message: `Год должен быть от 1000 до ${new Date().getFullYear() + 1}` })
  }
  if (!Array.isArray(value.authorIds) || value.authorIds.length === 0) {
    errors.push({ field: 'author_ids', message: 'Выберите хотя бы одного автора' })
  }
  if (requireCover && !value.cover) {
    errors.push({ field: 'cover', message: 'Обложка обязательна' })
  }
  const isbn = value.isbn?.trim()
  if (isbn && !ISBN_RE.test(isbn)) {
    errors.push({ field: 'isbn', message: 'Неверный формат ISBN' })
  }
  return errors
}

export function errorMessage(errors: ErrorItem[], field?: string): string | undefined {
  const list = field ? errors.filter((e) => e.field === field) : errors
  return list[0]?.message
}