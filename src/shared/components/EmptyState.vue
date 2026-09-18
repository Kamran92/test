<script setup lang="ts">
defineProps<{ title: string; hint?: string }>()
</script>

<template>
  <div class="empty">
    <i class="pi pi-book empty__icon"></i>
    <p class="empty__title">{{ title }}</p>
    <p v-if="hint" class="empty__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
  padding: 3.5rem 1rem;
  color: #6e7580;
}

.empty__icon {
  font-size: 2.5rem;
  opacity: 0.5;
}

.empty__title {
  font-size: 1.05rem;
  font-weight: 600;
  margin: 0.75rem 0 0.25rem;
  color: #3b4556;
}

.empty__hint {
  margin: 0;
  font-size: 0.9rem;
}
</style>