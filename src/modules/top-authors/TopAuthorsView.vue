<script setup lang="ts">
import { onMounted, ref } from 'vue'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import type { TopAuthor } from '../../shared/types'
import { api, ApiError } from '../../shared/api'
import { digitsOnly } from '../../shared/utils/input'

const currentYear = new Date().getFullYear()
const yearText = ref('')
const rows = ref<TopAuthor[]>([])
const loading = ref(false)
const error = ref('')

const effectiveYear = (): number => (yearText.value ? Number(yearText.value) : currentYear)

function onYearInput(): void {
  yearText.value = digitsOnly(yearText.value, 4)
  if (yearText.value.length === 4 || !yearText.value) {
    void load()
  }
}

function clearYear(): void {
  yearText.value = ''
  void load()
}

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const data = await api.getTopAuthors(effectiveYear())
    rows.value = data.items
  } catch (e) {
    rows.value = []
    error.value = e instanceof ApiError ? (e.errors[0]?.message ?? e.message) : 'Не удалось загрузить отчёт'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div>
    <h1>ТОП-10 авторов</h1>
    <p class="subtitle">Авторы, выпустившие больше всего книг за выбранный год</p>

    <div class="toolbar">
      <IconField>
        <InputIcon class="pi pi-search" />
        <InputText v-model="yearText" placeholder="Год" inputmode="numeric" maxlength="4" @input="onYearInput" />
        <InputIcon v-if="yearText" class="cursor-pointer pi pi-times" @click="clearYear" />
      </IconField>
    </div>

    <Message v-if="error" severity="error" :closable="false">{{ error }}</Message>

    <div v-if="loading" class="loader">
      <ProgressSpinner style="width: 48px; height: 48px" />
    </div>
    <DataTable v-else :value="rows" dataKey="author_id" stripedRows responsiveLayout="scroll">
      <template #empty>
        <div class="empty">За {{ effectiveYear() }} год данные отсутствуют</div>
      </template>
      <Column field="rank" header="Место" style="width: 90px" />
      <Column field="full_name" header="Автор">
        <template #body="slotProps">
          <RouterLink :to="`/authors/${slotProps.data.author_id}`">{{ slotProps.data.full_name }}</RouterLink>
        </template>
      </Column>
      <Column field="books_count" header="Книг за год" style="width: 140px" />
    </DataTable>
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

h1 {
  margin: 0 0 0.25rem;
  font-size: 1.5rem;
}

.subtitle {
  color: #6e7580;
  margin: 0 0 1.25rem;
}

.loader {
  display: flex;
  justify-content: center;
  padding: 3rem 0;
}

.empty {
  padding: 1.5rem;
  text-align: center;
  color: #6e7580;
}
</style>