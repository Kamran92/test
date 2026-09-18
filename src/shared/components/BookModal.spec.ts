import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const toast = vi.hoisted(() => ({ add: vi.fn() }))
const confirm = vi.hoisted(() => ({ require: vi.fn() }))
const api = vi.hoisted(() => ({
  createBook: vi.fn(),
  updateBook: vi.fn(),
  deleteBook: vi.fn(),
}))

vi.mock('primevue/usetoast', () => ({ useToast: () => toast }))
vi.mock('primevue/useconfirm', () => ({ useConfirm: () => confirm }))
vi.mock('../api', () => ({ api, ApiError: class ApiError extends Error {} }))
vi.mock('../composables/useAuthorsOptions', () => ({
  useAuthorsOptions: () => ({
    authorOptions: [
      { id: 1, full_name: 'Иванов И.' },
      { id: 2, full_name: 'Петров П.' },
    ],
    ensureLoaded: vi.fn(),
  }),
}))

import BookModal from './BookModal.vue'
import FileUpload from 'primevue/fileupload'
import type { Book } from '../types'

const coverFile = new File(['x'], 'cover.jpg', { type: 'image/jpeg' })
const book: Book = { id: 1, title: 'Тестовая книга', year: 2020, authors: [{ id: 1, full_name: 'Иванов И.' }] }

function mountModal(props: { book?: Book | null; visible?: boolean } = {}) {
  return mount(BookModal, {
    props: { book: null, visible: true, ...props },
    global: {
      directives: { mask: {} },
      stubs: {
        Dialog: { template: '<div><slot /></div>' },
        InputText: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        },
        Textarea: { template: '<textarea><slot /></textarea>' },
        Select: { template: '<div class="select" @click="$emit(\'update:modelValue\', [1])"><slot /></div>' },
        Button: { props: ['label'], emits: ['click'], template: '<button @click="$emit(\'click\')">{{ label }}<slot /></button>' },
        FileUpload: { emits: ['select'], template: '<div class="fileupload" />' },
      },
    },
  })
}

describe('BookModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.createBook.mockResolvedValue(book)
    api.updateBook.mockResolvedValue(book)
    URL.createObjectURL = vi.fn(() => 'blob:cover')
    URL.revokeObjectURL = vi.fn()
  })

  it('пустая форма не вызывает api и показывает ошибки', async () => {
    const wrapper = mountModal()
    await wrapper.findAll('button').find((b) => b.text() === 'Сохранить')!.trigger('click')

    expect(api.createBook).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Название обязательно')
    expect(wrapper.text()).toContain('Выберите хотя бы одного автора')
  })

  it('валидная форма создаёт книгу и эмитит saved', async () => {
    const wrapper = mountModal()
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('Новая книга')
    await inputs[1].setValue('2024')
    await wrapper.findComponent(FileUpload).vm.$emit('select', { files: [coverFile] })
    await wrapper.find('.select').trigger('click')
    await wrapper.findAll('button').find((b) => b.text() === 'Сохранить')!.trigger('click')

expect(api.createBook).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Новая книга', year: 2024, author_ids: [1] }),
      )
    await flushPromises()
    expect(wrapper.emitted('saved')).toEqual([[book]])
    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })
})