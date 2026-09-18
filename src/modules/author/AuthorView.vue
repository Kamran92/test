<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import Message from 'primevue/message'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import type { Author, Book } from '../../shared/types'
import { api, ApiError } from '../../shared/api'
import { useAuth } from '../../shared/composables/useAuth'
import BookCard from '../../shared/components/BookCard.vue'
import BookModal from '../../shared/components/BookModal.vue'
import SubscribeDialog from './components/SubscribeDialog.vue'
import EmptyState from '../../shared/components/EmptyState.vue'

const props = defineProps<{ id: string }>()

const auth = useAuth()

const countText = computed(() => {
  const n = author.value?.books.length ?? 0
  const mod10 = n % 10
  const mod100 = n % 100
  const word = mod10 === 1 && mod100 !== 11 ? 'книга' : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? 'книги' : 'книг'
  return `Автор ${n} ${word} в каталоге`
})

const author = ref<Author | null>(null)
const loading = ref(false)
const notFound = ref(false)
const modalBook = ref<Book | null>(null)
const modalOpen = ref(false)
const subscribeOpen = ref(false)

async function load(): Promise<void> {
  loading.value = true
  notFound.value = false
  author.value = null
  try {
    const data = await api.getAuthor(Number(props.id))
    author.value = data
  } catch (e) {
    notFound.value = e instanceof ApiError && e.status === 404
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.id, load)

async function openBook(id: number): Promise<void> {
  if (!auth.isUser.value) return
  try {
    modalBook.value = await api.getBook(id)
    modalOpen.value = true
  } catch {
    /* книга могла быть удалена */
  }
}
</script>

<template>
  <div>
    <div v-if="loading" class="loader">
      <ProgressSpinner style="width: 48px; height: 48px" />
    </div>

    <Message v-else-if="notFound" severity="warn" :closable="false">
      Автор не найден. <RouterLink to="/">Вернуться в каталог</RouterLink>
    </Message>

    <template v-else-if="author">
      <div class="author-head">
        <div>
          <h1 class="author-head__name">{{ author.full_name }}</h1>
          <p class="author-head__count">{{ countText }}</p>
        </div>
        <Button label="Подписаться" icon="pi pi-bell" outlined @click="subscribeOpen = true" />
      </div>

      <div v-if="author.books.length" class="grid-cards">
        <BookCard
          v-for="bookShort in author.books"
          :key="bookShort.id"
          :book="{ ...bookShort, authors: [{ id: author.id, full_name: author.full_name }] }"
          @open="openBook(bookShort.id)"
        />
      </div>
      <EmptyState v-else title="У автора пока нет книг" />
    </template>

    <SubscribeDialog v-model:visible="subscribeOpen" :author-id="author?.id ?? 0" :author-name="author?.full_name ?? ''" />
    <BookModal v-model:visible="modalOpen" :book="modalBook" @saved="load()" @deleted="load()" />
  </div>
</template>

<style scoped>
.loader {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1.25rem;
}

.author-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.author-head__name {
  margin: 0;
  font-size: 1.5rem;
}

.author-head__count {
  margin: 0.25rem 0 0;
  color: #6e7580;
}
</style>