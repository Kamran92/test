<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const auth = useAuth()
</script>

<template>
  <header class="app-header">
    <div class="app-header__inner">
      <RouterLink to="/" class="app-header__brand">Каталог книг</RouterLink>
      <nav class="app-header__nav">
        <RouterLink to="/" class="app-header__link">Каталог</RouterLink>
        <RouterLink to="/top-authors" class="app-header__link">ТОП-10 авторов</RouterLink>
      </nav>
      <div class="app-header__right">
        <Tag :value="auth.isUser.value ? `Юзер: ${auth.state.user?.username}` : 'Гость'" :severity="auth.isUser.value ? 'success' : 'secondary'" />
        <Button
          v-if="!auth.isUser.value"
          label="Войти"
          icon="pi pi-sign-in"
          size="small"
          outlined
          @click="router.push('/login')"
        />
        <Button v-else label="Выйти" icon="pi pi-sign-out" size="small" text severity="secondary" @click="auth.logout()" />
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e2e6eb;
  position: sticky;
  top: 0;
  z-index: 20;
}

.app-header__inner {
  max-width: var(--content-max);
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.app-header__brand {
  font-weight: 700;
  font-size: 1.05rem;
  color: #222b39;
  text-decoration: none;
}

.app-header__nav {
  display: flex;
  gap: 0.25rem;
  flex: 1;
}

.app-header__link {
  color: #4e5a6b;
  text-decoration: none;
  padding: 0.45rem 0.8rem;
  border-radius: 6px;
  font-size: 0.95rem;
}

.app-header__link:hover {
  background: #f1f3f6;
}

.app-header__link.router-link-active {
  color: #2f5bd0;
  font-weight: 600;
  background: #e8f1fb;
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
</style>