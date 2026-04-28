<script setup>
import { ref } from 'vue'
import { useStateStore } from '../stores/stateStore'
import { connectToAP, disconnectFromAP } from '../archipelago/client'
import { connectToBizhawk, disconnectFromBizhawk } from '../autotracking/bizhawk'
import { useLocale } from '../composables/useLocale'

const store = useStateStore()
const { t } = useLocale()
const isDev = import.meta.env.DEV
const connecting = ref(false)
const error = ref('')
const showPanel = ref(false)

async function connect() {
  error.value = ''
  connecting.value = true
  const ok = await connectToAP(
    store.apServer,
    store.apPort,
    store.apSlot,
    store.apPassword,
  )
  connecting.value = false
  if (!ok) error.value = t('ap_connect.error')
  else showPanel.value = false
}

function disconnect() {
  disconnectFromAP()
}

function toggleBizhawk() {
  if (store.bizhawkConnected) disconnectFromBizhawk()
  else connectToBizhawk()
}
</script>

<template>
  <div class="ap-connect">
    <div class="btn-row">
      <button v-if="!store.apConnected" class="btn-connect" @click="showPanel = !showPanel">
        {{ t('ap_connect.connect') }}
      </button>
      <button v-else class="btn-disconnect" @click="disconnect">
        {{ t('ap_connect.disconnect') }}
      </button>

      <button
        v-if="isDev"
        class="btn-bizhawk"
        :class="{ connected: store.bizhawkConnected }"
        @click="toggleBizhawk"
      >
        {{ store.bizhawkConnected ? t('ap_connect.bizhawk_connected') : t('ap_connect.bizhawk_lua') }}
      </button>
    </div>

    <div v-if="showPanel && !store.apConnected" class="panel">
      <h3>{{ t('ap_connect.panel_title') }}</h3>

      <label>{{ t('ap_connect.server') }}</label>
      <input v-model="store.apServer" placeholder="archipelago.gg" />

      <label>{{ t('ap_connect.port') }}</label>
      <input v-model.number="store.apPort" type="number" placeholder="38281" />

      <label>{{ t('ap_connect.slot_name') }}</label>
      <input v-model="store.apSlot" placeholder="Player1" />

      <label>{{ t('ap_connect.password') }}</label>
      <input v-model="store.apPassword" type="password" placeholder="" />

      <div v-if="error" class="error">{{ error }}</div>

      <button class="btn-go" :disabled="connecting || !store.apSlot" @click="connect">
        {{ connecting ? t('ap_connect.connecting') : t('ap_connect.connect_btn') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ap-connect { position: relative; }

.btn-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.btn-connect {
  background: var(--accent-soft);
  color: var(--text);
  border: none;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.btn-connect:hover { filter: brightness(1.2); }

.btn-disconnect {
  background: #553333;
  color: #ffaaaa;
  border: none;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.panel {
  position: absolute;
  right: 0;
  top: 36px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
  min-width: 260px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.panel h3 { margin: 0 0 8px; font-size: 14px; color: var(--accent); }

label { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

input {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 13px;
  width: 100%;
}

.error { color: var(--accent); font-size: 12px; }

.btn-go {
  margin-top: 8px;
  background: var(--accent);
  color: white;
  border: none;
  padding: 7px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.btn-go:disabled { opacity: 0.5; cursor: default; }

.btn-bizhawk {
  background: #2a2a3a;
  color: var(--text-muted);
  border: 1px solid var(--border);
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}
.btn-bizhawk:hover { filter: brightness(1.3); }
.btn-bizhawk.connected {
  background: #1a3a2a;
  color: #88ffaa;
  border-color: #447755;
}
</style>
