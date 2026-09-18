import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const toast = vi.hoisted(() => ({ add: vi.fn() }))
const subs = vi.hoisted(() => ({
  isSubscribed: vi.fn(),
  phoneOf: vi.fn(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
}))

vi.mock('primevue/usetoast', () => ({ useToast: () => toast }))
vi.mock('../composables/useSubscriptions', () => ({ useSubscriptions: () => subs }))

import SubscribeDialog from './SubscribeDialog.vue'

function mountDialog(props: { authorId?: number; visible?: boolean } = {}) {
  return mount(SubscribeDialog, {
    props: { authorId: 1, authorName: 'Иванов И.', visible: true, ...props },
    global: {
      directives: { mask: {} },
      stubs: {
        Dialog: { template: '<div><slot /></div>' },
        InputText: {
          props: ['modelValue'],
          emits: ['update:modelValue'],
          template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
        },
        Button: { emits: ['click'], template: '<button @click="$emit(\'click\')"><slot /></button>' },
      },
    },
  })
}

describe('SubscribeDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    subs.phoneOf.mockReturnValue(null)
    subs.subscribe.mockImplementation((id: number) => void id)
    subs.unsubscribe.mockImplementation((id: number) => void id)
  })

  it('валидный телефон подписывает и закрывает', async () => {
    subs.isSubscribed.mockReturnValue(false)
    const wrapper = mountDialog()
    await wrapper.find('input').setValue('+7 900 000-00-00')
    await wrapper.get('button').trigger('click')

    expect(subs.subscribe).toHaveBeenCalledWith(1, '+7 900 000-00-00')
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success', summary: 'Вы подписаны' }))
    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })

  it('невалидный телефон не подписывает', async () => {
    subs.isSubscribed.mockReturnValue(false)
    const wrapper = mountDialog()
    await wrapper.find('input').setValue('+7')
    await wrapper.get('button').trigger('click')

    expect(subs.subscribe).not.toHaveBeenCalled()
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }))
    expect(wrapper.emitted('update:visible')).toBeUndefined()
  })

  it('подписанный автор — кнопка отписки', async () => {
    subs.isSubscribed.mockReturnValue(true)
    const wrapper = mountDialog()
    await wrapper.get('button').trigger('click')

    expect(subs.unsubscribe).toHaveBeenCalledWith(1)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
    expect(wrapper.emitted('update:visible')).toEqual([[false]])
  })
})