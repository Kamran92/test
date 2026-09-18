<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

import Select from 'primevue/select'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import type { Book } from '../../shared/types'
import { api } from '../../shared/api'
import { useCatalog } from './composables/useCatalog'
import { useAuth } from '../../shared/composables/useAuth'
import { useAuthorsOptions } from '../../shared/composables/useAuthorsOptions'
import BookCard from '../../shared/components/BookCard.vue'
import BookModal from '../../shared/components/BookModal.vue'
import EmptyState from '../../shared/components/EmptyState.vue'
import { digitsOnly } from '../../shared/utils/input'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const {
  search,
  authorId,
  year,
  page,
  perPage,
  items,
  total,
  loading,
  error,
  load,
  reload,
  setSearch,
  toQuery,
  applyQuery,
} = useCatalog(api)
const { authorOptions, ensureLoaded } = useAuthorsOptions()

const modalBook = ref<Book | null>(null)
const modalOpen = ref(false)

onMounted(() => {
  applyQuery(route.query as Record<string, unknown>)
  void load()
  void ensureLoaded()
})

watch(
  () => toQuery(),
  (q) => {
    router.replace({ query: q })
  },
)

function openBook(book: Book): void {
  if (!auth.isUser.value) return
  modalBook.value = book
  modalOpen.value = true
}

function openCreate(): void {
  modalBook.value = null
  modalOpen.value = true
}

const yearInput = computed({
  get: () => (year.value != null ? String(year.value) : ''),
  set: (v: string) => {
    const digits = digitsOnly(v, 4)
    year.value = digits ? Number(digits) : null
    reload(1)
  },
})

function clearSearch(): void {
  search.value = ''
  reload(1)
}

function clearYear(): void {
  year.value = null
  reload(1)
}

function onPage(event: { page: number }): void {
  reload(event.page + 1)
}
</script>

<template>
  <div>
    <div class="toolbar">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText :model-value="search" placeholder="Поиск по названию" class="filter-search" @update:model-value="setSearch" />
        <InputIcon v-if="search" class="cursor-pointer pi pi-times" @click="clearSearch" />
      </IconField>
      <Select v-model="authorId" :options="authorOptions" option-label="full_name" option-value="id" placeholder="Все авторы" show-clear class="filter-select" @change="reload(1)" />
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="yearInput" placeholder="Год" inputmode="numeric" maxlength="4" />
        <InputIcon v-if="yearInput" class="cursor-pointer pi pi-times" @click="clearYear" />
      </IconField>
      
      <div class="toolbar__spacer" />
      <Button v-if="auth.isUser.value" label="Добавить книгу" icon="pi pi-plus" @click="openCreate" />
    </div>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-if="loading" class="loader">
      <ProgressSpinner style="width: 48px; height: 48px" />
    </div>

    <template v-else>
      <div v-if="items.length" class="grid-cards">
        <BookCard v-for="book in items" :key="book.id" :book="book" @open="openBook(book)" />
      </div>
      <EmptyState v-else title="Книги не найдены" hint="Попробуйте изменить фильтры" />
    </template>

    <Paginator
      :first="(page - 1) * perPage"
      :rows="perPage"
      :totalRecords="total"
      :rows-per-page-options="[10, 20, 50]"
      class="paginator"
      @page="onPage"
    />

    <BookModal v-model:visible="modalOpen" :book="modalBook" @saved="load()" @deleted="load()" />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  margin-bottom: 1.25rem;
}

.toolbar__spacer {
  flex: 1;
}

.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.25rem;
}

.filter-select {
  min-width: 220px;
}

.filter-search {
  width: 220px;
}

.loader {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.paginator {
  margin-top: 1.25rem;
}
</style>