<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'
import FileUpload from 'primevue/fileupload'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import type { Book } from '../types'
import { api, ApiError } from '../api'
import { useAuthorsOptions } from '../composables/useAuthorsOptions'
import { validateBookForm, errorMessage } from '../utils/validation'
import { digitsOnly } from '../utils/input'

const props = defineProps<{ book: Book | null; visible: boolean }>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  saved: [book: Book]
  deleted: [book: Book]
}>()

const toast = useToast()
const confirm = useConfirm()

const title = ref('')
const year = ref<number | null>(null)
const description = ref('')
const isbn = ref('')
const authorIds = ref<number[]>([])
const cover = ref<File | null>(null)
const errors = ref<{ field?: string; message: string }[]>([])
const saving = ref(false)
const coverPreview = ref('')

const { authorOptions, ensureLoaded } = useAuthorsOptions()

const isEdit = computed(() => Boolean(props.book))

const currentPreview = computed(() => {
  if (coverPreview.value) return coverPreview.value
  return props.book?.cover_url ?? ''
})

watch(cover, (file) => {
  if (coverPreview.value) URL.revokeObjectURL(coverPreview.value)
  coverPreview.value = file ? URL.createObjectURL(file) : ''
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) return
    errors.value = []
    cover.value = null
    if (props.book) {
      title.value = props.book.title
      year.value = props.book.year
      description.value = props.book.description ?? ''
      isbn.value = props.book.isbn ?? ''
      authorIds.value = props.book.authors.map((a) => a.id)
    } else {
      title.value = ''
      year.value = new Date().getFullYear()
      description.value = ''
      isbn.value = ''
      authorIds.value = []
    }
  },
)

void ensureLoaded()

function close(): void {
  emit('update:visible', false)
}

function clearFieldError(field: string): void {
  errors.value = errors.value.filter((e) => e.field !== field)
}

function onFileSelect(event: { files: File[] }): void {
  cover.value = event.files[0] ?? null
  clearFieldError('cover')
}

function onYearInput(value: string | undefined): void {
  const digits = digitsOnly(value ?? '', 4)
  year.value = digits ? Number(digits) : null
  clearFieldError('year')
}

function onIsbnInput(value: string | undefined): void {
  const digits = (value ?? '').replace(/\D/g, '').slice(0, 13)
  let out = ''
  let offset = 0
  for (const size of [3, 1, 2, 6, 1]) {
    if (offset >= digits.length) break
    if (out) out += '-'
    out += digits.slice(offset, offset + size)
    offset += size
  }
  isbn.value = out
  clearFieldError('isbn')
}

function onDigitsKeydown(e: KeyboardEvent): void {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  if (e.key.length === 1 && !/\d/.test(e.key)) e.preventDefault()
}

function handleError(e: unknown): void {
  if (e instanceof ApiError && e.errors.length) {
    errors.value = e.errors
    return
  }
  errors.value = [{ message: e instanceof Error ? e.message : 'Не удалось сохранить книгу' }]
}

async function save(): Promise<void> {
  const violations = validateBookForm(
    { title: title.value, year: year.value, description: description.value, isbn: isbn.value, authorIds: authorIds.value, cover: cover.value },
    !props.book,
  )
  errors.value = violations
  if (violations.length) return
  if (!year.value) return

  saving.value = true
  try {
    const payload = {
      title: title.value.trim(),
      year: year.value,
      description: description.value || undefined,
      isbn: isbn.value.trim() || undefined,
      author_ids: authorIds.value,
      cover: cover.value ?? undefined,
    }
    const saved = props.book ? await api.updateBook(props.book.id, payload) : await api.createBook(payload)
    toast.add({ severity: 'success', summary: props.book ? 'Книга обновлена' : 'Книга добавлена', life: 3000 })
    emit('saved', saved)
    close()
  } catch (e) {
    handleError(e)
  } finally {
    saving.value = false
  }
}

function requestDelete(): void {
  const book = props.book
  if (!book) return
  confirm.require({
    message: `Удалить книгу «${book.title}»?`,
    header: 'Подтверждение удаления',
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    accept: async () => {
      try {
        await api.deleteBook(book.id)
        toast.add({ severity: 'success', summary: 'Книга удалена', life: 3000 })
        close()
        emit('deleted', book)
      } catch (e) {
        handleError(e)
      }
    },
  })
}
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :header="isEdit ? 'Редактирование книги' : 'Новая книга'"
    :style="{ width: '560px', maxWidth: '96vw' }"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="form">
      <div class="form__row">
        <label class="form__label">Название *</label>
        <InputText v-model="title" class="form__field" @update:model-value="clearFieldError('title')" />
        <small v-if="errorMessage(errors, 'title')" class="error-text">{{ errorMessage(errors, 'title') }}</small>
      </div>

      <div class="form__row form__row--split">
        <div>
          <label class="form__label">Год выпуска *</label>
          <InputText
            :model-value="year == null ? '' : String(year)"
            class="form__field--half"
            inputmode="numeric"
            maxlength="4"
            @update:model-value="onYearInput"
            @keydown="onDigitsKeydown"
          />
          <small v-if="errorMessage(errors, 'year')" class="error-text">{{ errorMessage(errors, 'year') }}</small>
        </div>
        <div>
          <label class="form__label">ISBN</label>
          <InputText
            :model-value="isbn"
            class="form__field--half"
            placeholder="978-"
            inputmode="numeric"
            :maxlength="17"
            @update:model-value="onIsbnInput"
            @keydown="onDigitsKeydown"
          />
          <small v-if="errorMessage(errors, 'isbn')" class="error-text">{{ errorMessage(errors, 'isbn') }}</small>
        </div>
      </div>

      <div class="form__row">
        <label class="form__label">Авторы *</label>
        <Select
          v-model="authorIds"
          :options="authorOptions"
          option-label="full_name"
          option-value="id"
          multiple
          filter
          class="form__field"
          placeholder="Выберите авторов"
          @update:model-value="clearFieldError('author_ids')"
        >
          <template #value="{ value, placeholder }">
            <span v-if="!value?.length" class="p-placeholder">{{ placeholder }}</span>
            <span v-for="id in value" :key="id" class="author-chip">{{ authorOptions.find((a) => a.id === id)?.full_name }}</span>
          </template>
        </Select>
        <small v-if="errorMessage(errors, 'author_ids')" class="error-text">{{ errorMessage(errors, 'author_ids') }}</small>
      </div>

      <div class="form__row">
        <label class="form__label">Описание</label>
        <Textarea v-model="description" class="form__field" :rows="4" autoResize />
      </div>

      <div class="form__row">
        <label class="form__label">Обложка {{ isEdit && !cover ? '(текущая не будет изменена)' : '*' }}</label>
        <div class="form__cover">
          <img v-if="currentPreview" :src="currentPreview" alt="Обложка" class="form__cover-preview" />
          <FileUpload mode="basic" name="cover" accept="image/*" chooseLabel="Выбрать файл" :auto="false" :custom-upload="true" @select="onFileSelect" />
        </div>
        <small v-if="errorMessage(errors, 'cover')" class="error-text">{{ errorMessage(errors, 'cover') }}</small>
      </div>

      <div class="form__actions">
        <Button v-if="isEdit" label="Удалить" icon="pi pi-trash" severity="danger" outlined @click="requestDelete" />
        <div class="form__spacer" />
        <Button label="Отмена" text severity="secondary" @click="close" />
        <Button label="Сохранить" icon="pi pi-check" :loading="saving" @click="save" />
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form__row {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form__row--split {
  flex-direction: row;
  gap: 1rem;
}

.form__row--split > div {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #3b4556;
}

.form__field,
.form__field--half {
  width: 100%;
}

.form__cover {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.form__cover-preview {
  width: 90px;
  border-radius: 6px;
  border: 1px solid #e2e6eb;
}

.author-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: #eaeef9;
  color: #3f4788;
  border-radius: 9999px;
  padding: 0.15rem 0.6rem;
  font-size: 0.8rem;
  margin-right: 0.3rem;
}

.form__actions {
  display: flex;
  gap: 0.5rem;
  padding-top: 0.5rem;
}

.form__spacer {
  flex: 1;
}

.error-text {
  color: #d64545;
  font-size: 0.85rem;
}
</style>