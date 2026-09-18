<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { useToast } from 'primevue/usetoast'
import { useAuth } from '../../shared/composables/useAuth'
import { ApiError } from '../../shared/api'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const auth = useAuth()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function login(): Promise<void> {
  if (!username.value || !password.value) {
    error.value = 'Введите логин и пароль'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await auth.login(username.value.trim(), password.value)
    toast.add({ severity: 'success', summary: 'Вы вошли как пользователь', life: 3000 })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (e) {
    error.value = e instanceof ApiError ? (e.errors[0]?.message ?? e.message) : 'Ошибка входа'
  } finally {
    loading.value = false
  }
}

function continueAsGuest(): void {
  router.push('/')
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-card">
      <h1 class="login-title">Вход в систему</h1>
      <Message severity="info" :closable="false" class="login-hint">
        Демо-режим: введите любые логин и пароль — войдёте как пользователь.
      </Message>

      <form class="login-form" @submit.prevent="login">
        <InputText v-model="username" placeholder="Логин" autocomplete="username" class="login-field" />
        <InputText v-model="password" type="password" placeholder="Пароль" autocomplete="current-password" class="login-field" />

        <Message v-if="error" severity="error" :closable="false" class="login-error">{{ error }}</Message>

        <Button label="Войти" icon="pi pi-sign-in" :loading="loading" class="login-submit" @click="login" />
      </form>

      <Button label="Смотреть каталог как гость" text severity="secondary" class="login-guest" @click="continueAsGuest" />
    </div>
  </div>
</template>

<style scoped>
.login-wrap {
  display: flex;
  justify-content: center;
  padding-top: 4rem;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border: 1px solid #e2e6eb;
  border-radius: 10px;
  padding: 2rem;
}

.login-title {
  margin: 0 0 1rem;
  font-size: 1.35rem;
  text-align: center;
}

.login-hint {
  margin-bottom: 1.25rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.login-field {
  width: 100%;
}

.login-error {
  margin: 0;
}

.login-submit {
  width: 100%;
  margin-top: 0.5rem;
}

.login-guest {
  width: 100%;
  margin-top: 0.75rem;
}
</style>