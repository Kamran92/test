<script setup lang="ts">
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppHeader from './shared/components/AppHeader.vue'
</script>

<template>
  <AppHeader />
  <main class="container">
    <RouterView />
  </main>
  <Toast />
  <ConfirmDialog />
</template>

<style scoped>
.container {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 24px 24px 64px;
}
</style>