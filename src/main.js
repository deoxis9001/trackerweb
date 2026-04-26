import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import 'bootstrap/dist/css/bootstrap.min.css'

import App from './App.vue'
import MainTracker from './views/MainTracker.vue'
import BroadcastView from './views/BroadcastView.vue'
import BroadcastRegionsView from './views/BroadcastRegionsView.vue'

const routes = [
  { path: '/',                   name: 'tracker',            component: MainTracker },
  { path: '/broadcast',          name: 'broadcast',          component: BroadcastView },
  { path: '/broadcast-regions',  name: 'broadcast-regions',  component: BroadcastRegionsView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount('#app')

// Load persisted state after pinia is ready
import { useSettingsStore } from './stores/settingsStore'
import { useStateStore } from './stores/stateStore'
useSettingsStore().load()
useStateStore().loadState()
