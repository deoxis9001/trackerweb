<template>
  <div id="app-root" @contextmenu.prevent>
    <NavBar v-if="!isBroadcastRoute" />
    <div :class="['app-content', isBroadcastRoute && 'app-content-broadcast']">
      <RouterView />
    </div>

    <Teleport to="body">
      <!-- Settings modal -->
      <div
        v-if="store.showSettings"
        class="settings-overlay"
        @click.self="store.showSettings = false"
      >
        <div class="settings-modal">
          <button class="modal-close" @click="store.showSettings = false">✕</button>
          <SettingsView />
        </div>
      </div>

      <!-- Chat window -->
      <div v-if="store.showChat && store.apConnected" class="chat-popup">
        <div class="chat-popup-header">
          <span>Chat AP</span>
          <button class="popup-close" @click="store.showChat = false">✕</button>
        </div>
        <APChat />
      </div>

      <!-- Dev panel -->
      <div
        v-if="store.showDevPanel"
        class="settings-overlay"
        @click.self="store.showDevPanel = false"
      >
        <div class="settings-modal">
          <button class="modal-close" @click="store.showDevPanel = false">✕</button>
          <DevPanel />
        </div>
      </div>

      <!-- Region popup -->
      <div v-if="store.showRegionPopup" class="region-popup">
        <div class="region-popup-header">
          <span>Régions</span>
          <button class="popup-close" @click="store.showRegionPopup = false">✕</button>
        </div>
        <RegionGuide />
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from './components/NavBar.vue'
import SettingsView from './views/SettingsView.vue'
import RegionGuide from './components/RegionGuide.vue'
import APChat from './components/APChat.vue'
import DevPanel from './components/DevPanel.vue'
import { useStateStore } from './stores/stateStore'

const store = useStateStore()
const route = useRoute()

const isBroadcastRoute = computed(() =>
  route.name === 'broadcast' || route.name === 'broadcast-regions'
)

function onKeydown(e) {
  if (e.key === 'Escape') {
    if (store.showSettings)    store.showSettings    = false
    if (store.showRegionPopup) store.showRegionPopup = false
    if (store.showChat)        store.showChat        = false
    if (store.showDevPanel)    store.showDevPanel    = false
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<style>
:root {
  /* Backgrounds – warm light wood */
  --bg-dark:  #3e2810;
  --bg-card:  #56371a;
  --bg-panel: #6a4420;

  /* Accents */
  --accent:      #f0b050;
  --accent-soft: #c07830;
  --accent-gold: #fce070;

  /* Text */
  --text:       #fff8e0;
  --text-muted: #d4b880;

  /* Borders */
  --border: #8a5428;

  /* Status */
  --checked:          #4a2e10;
  --unchecked:        #4a2c0e;
  --inaccessible:     #2a1808;

  /* Map pins */
  --pin-accessible:   #7ac038;
  --pin-outoflogic:   #d4901a;
  --pin-inaccessible: #d82828;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg-dark);
  color: var(--text);
  font-family: 'Segoe UI', sans-serif;
  font-size: 14px;
}

#app-root {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.app-content-broadcast {
  background: transparent;
  padding: 0;
  align-items: flex-start;
}

.settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-modal {
  position: relative;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 8px;
  width: 90vw;
  max-width: 960px;
  height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-close {
  position: absolute;
  top: 8px;
  right: 10px;
  z-index: 10;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 4px 6px;
  border-radius: 4px;
}
.modal-close:hover { color: var(--text); background: var(--bg-card); }

.chat-popup {
  position: fixed;
  bottom: 12px;
  right: 12px;
  z-index: 500;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  width: 420px;
  height: 320px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  background: var(--bg-dark);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-gold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.region-popup {
  position: fixed;
  top: 52px;
  right: 12px;
  z-index: 500;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  min-width: 180px;
  max-width: 260px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6);
  overflow: hidden;
}

.region-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  background: var(--bg-dark);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-gold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.popup-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 3px;
  line-height: 1;
}
.popup-close:hover { color: var(--text); background: var(--bg-card); }
</style>
