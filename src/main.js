import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import { createMetaManager } from 'vue-meta';

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(createMetaManager()); 

app.mount('#app')
