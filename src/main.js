import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import router from './router'
import { createMetaManager } from 'vue-meta';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios' // 添加这行以确保 axios 被导入
import { setupAxiosInterceptors } from './utils/auth'

// 设置 axios 为全局可用（可选）
const app = createApp(App)
app.config.globalProperties.$axios = axios

// 设置axios拦截器
setupAxiosInterceptors()

app.use(createPinia())
app.use(router)
app.use(createMetaManager()); 
app.use(ElementPlus)

app.mount('#app')
