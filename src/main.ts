import { createApp } from 'vue'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import { ru } from 'primelocale/js/ru.js'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Mask from 'primevue/mask'
import 'primeicons/primeicons.css'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(router)
app.use(PrimeVue, { theme: { preset: Aura }, locale: ru })
app.use(ToastService)
app.use(ConfirmationService)
app.directive('mask', Mask)
app.mount('#app')