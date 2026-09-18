import type { Book } from '../../types'
import { buildAuthors, fixtureBooks } from './fixtures'

export interface MockDb {
  books: Book[]
  authors: ReturnType<typeof buildAuthors>
  nextBookId: number
}

export function createDb(): MockDb {
  return {
    books: structuredClone(fixtureBooks),
    authors: buildAuthors(),
    nextBookId: 1000,
  }
}