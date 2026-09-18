import { describe, expect, it } from 'vitest'
import { validateBookForm, errorMessage } from './validation'

describe('validateBookForm', () => {
  it('принимает валидную форму', () => {
    const errors = validateBookForm({ title: 'Книга', year: 2026, authorIds: [1] })
    expect(errors).toEqual([])
  })

  it('пустое название → ошибка', () => {
    const errors = validateBookForm({ title: '  ', year: 2026, authorIds: [1] })
    expect(errors).toContainEqual({ field: 'title', message: 'Название обязательно' })
  })

  it('год вне диапазона → ошибка', () => {
    const errors = validateBookForm({ title: 'x', year: 999, authorIds: [1] })
    expect(errors.some((e) => e.field === 'year')).toBe(true)
  })

  it('нет авторов → ошибка', () => {
    const errors = validateBookForm({ title: 'x', year: 2026, authorIds: [] })
    expect(errors).toContainEqual(expect.objectContaining({ field: 'author_ids' }))
  })

  it('невалидный ISBN → ошибка, пустой ISBN ок', () => {
    const bad = validateBookForm({ title: 'x', year: 2026, authorIds: [1], isbn: 'abc' })
    expect(bad).toContainEqual(expect.objectContaining({ field: 'isbn' }))

    const ok = validateBookForm({ title: 'x', year: 2026, authorIds: [1], isbn: '' })
    expect(ok.some((e) => e.field === 'isbn')).toBe(false)

    const dashed = validateBookForm({ title: 'x', year: 2026, authorIds: [1], isbn: '978-5-17-200000-0' })
    expect(dashed.some((e) => e.field === 'isbn')).toBe(false)
  })

  it('requireCover=true без обложки → ошибка, с файлом ок', () => {
    const noCover = validateBookForm({ title: 'x', year: 2026, authorIds: [1] }, true)
    expect(noCover).toContainEqual({ field: 'cover', message: 'Обложка обязательна' })

    const withCover = validateBookForm(
      { title: 'x', year: 2026, authorIds: [1], cover: new File(['<svg/>'], 'c.svg', { type: 'image/svg+xml' }) },
      true,
    )
    expect(withCover.some((e) => e.field === 'cover')).toBe(false)
  })

  it('requireCover=false без обложки → нет ошибки', () => {
    const errors = validateBookForm({ title: 'x', year: 2026, authorIds: [1] })
    expect(errors.some((e) => e.field === 'cover')).toBe(false)
  })

  it('errorMessage достаёт первое сообщение по полю', () => {
    const errors = [
      { field: 'title', message: 'А' },
      { field: 'title', message: 'Б' },
      { field: 'year', message: 'В' },
    ]
    expect(errorMessage(errors, 'title')).toBe('А')
    expect(errorMessage(errors, 'year')).toBe('В')
    expect(errorMessage(errors, 'none')).toBeUndefined()
    expect(errorMessage(errors)).toBe('А')
  })
})