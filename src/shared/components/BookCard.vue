<script setup lang="ts">
import type { BookCardData } from '../types'

defineProps<{ book: BookCardData }>()
const emit = defineEmits<{ open: [] }>()
</script>

<template>
  <div class="book-card" role="button" tabindex="0" @click="emit('open')" @keydown.enter="emit('open')">
    <img v-if="book.cover_url" :src="book.cover_url" :alt="book.title" class="cover-img" loading="lazy" />
    <h3 class="book-card__title">{{ book.title }}</h3>
    <p class="book-card__meta">{{ book.year }} · {{ book.isbn ?? 'без ISBN' }}</p>
    <p class="book-card__authors">{{ book.authors.map((a) => a.full_name).join(', ') }}</p>
  </div>
</template>

<style scoped>
.book-card {
  background: #ffffff;
  border: 1px solid #e2e6eb;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.15s ease;
}

.cover-img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 6px;
  object-fit: cover;
}

.book-card:hover {
  box-shadow: 0 6px 18px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.book-card__title {
  font-size: 0.95rem;
  margin: 0.6rem 0 0.2rem;
  line-height: 1.3;
}

.book-card__meta {
  color: #6e7580;
  font-size: 0.8rem;
  margin: 0 0 0.25rem;
}

.book-card__authors {
  color: #3b4556;
  font-size: 0.82rem;
  margin: 0;
}
</style>