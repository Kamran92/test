import { createMockClient } from './mock'

export { ApiError } from './mock'
export type { ApiClient } from '../types'

export const api = createMockClient()