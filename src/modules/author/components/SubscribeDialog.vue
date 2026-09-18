<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import { useSubscriptions } from '../composables/useSubscriptions'

const props = defineProps<{ authorId: number; authorName: string; visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

const toast = useToast()
const subs = useSubscriptions()
const phone = ref('')
const phoneMask = ref('+7 999 999-99-99')

const subscribed = computed(() => subs.isSubscribed(props.authorId))

watch(
  () => props.visible,
  (visible) => {
    if (visible) phone.value = subs.phoneOf(props.authorId) ?? '+7'
  },
)

function submit(): void {
  if (!/^\+?\d[\d\s()-]{9,}$/.test(phone.value.trim())) {
    toast.add({ severity: 'warn', summary: 'Некорректный номер', detail: 'Введите телефон в формате +7...', life: 3000 })
    return
  }
  subs.subscribe(props.authorId, phone.value.trim())
  toast.add({ severity: 'success', summary: 'Вы подписаны', detail: `Новинки автора придут на ${phone.value.trim()}` })
  emit('update:visible', false)
}

function unsubscribe(): void {
  subs.unsubscribe(props.authorId)
  toast.add({ severity: 'info', summary: 'Подписка отменена' })
  emit('update:visible', false)
}
</script>

<template>
  <Dialog :visible="visible" :modal="true" :header="`Подписка: ${authorName}`" :style="{ width: '420px', maxWidth: '96vw' }" @update:visible="emit('update:visible', $event)">
    <p v-if="subscribed" class="sub-text">Вы подписаны на обновления автора. Уведомления о новых книгах отправляются по SMS.</p>
    <template v-else>
      <p class="sub-text">Подпишитесь, чтобы получать SMS о новых книгах автора.</p>
      <InputText v-model="phone" v-mask="phoneMask" class="sub-field" placeholder="+7 900 000-00-00" />
    </template>
    <div class="sub-actions">
      <Button v-if="subscribed" label="Отписаться" severity="danger" outlined @click="unsubscribe" />
      <Button v-else label="Подписаться" icon="pi pi-bell" @click="submit" />
    </div>
  </Dialog>
</template>

<style scoped>
.sub-text {
  margin: 0 0 0.75rem;
  color: #3b4556;
}

.sub-field {
  width: 100%;
}

.sub-actions {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-end;
}
</style>