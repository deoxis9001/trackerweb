<script setup>
import { ref, computed } from 'vue'
import { useStateStore } from '../stores/stateStore'
import APChat from './APChat.vue'
import { useLocale } from '../composables/useLocale'

const store = useStateStore()
const { t }  = useLocale()

const activeTab     = ref('chat')
const activeDataTab = ref('slot_data')

const receivedItemCounts = computed(() => {
  const counts = {}
  for (const name of store.receivedItems) counts[name] = (counts[name] ?? 0) + 1
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
})

const slotDataEntries = computed(() =>
  Object.entries(store.rawSlotData).sort((a, b) => a[0].localeCompare(b[0]))
)
</script>

<template>
  <div class="ap-panel">
    <div v-if="!store.apConnected" class="not-connected">
      {{ t('ap_panel.not_connected') }}
    </div>

    <template v-else>
      <div class="panel-tabs">
        <button :class="['ptab', activeTab === 'chat' && 'active']" @click="activeTab = 'chat'">
          {{ t('ap_panel.chat') }}
        </button>
        <button :class="['ptab', activeTab === 'data' && 'active']" @click="activeTab = 'data'">
          {{ t('ap_panel.data') }}
        </button>
      </div>

      <div class="panel-content">
        <!-- Chat -->
        <template v-if="activeTab === 'chat'">
          <APChat />
        </template>

        <!-- AP Data -->
        <template v-else>
          <div class="data-subtabs">
            <button :class="['stab', activeDataTab === 'slot_data' && 'active']" @click="activeDataTab = 'slot_data'">
              slot_data <span class="cnt">{{ slotDataEntries.length }}</span>
            </button>
            <button :class="['stab', activeDataTab === 'items' && 'active']" @click="activeDataTab = 'items'">
              {{ t('ap_panel.items_received') }} <span class="cnt">{{ store.receivedItems.length }}</span>
            </button>
          </div>
          <div class="data-content">
            <table v-if="activeDataTab === 'slot_data'" class="data-table">
              <tbody>
                <tr v-for="[key, val] in slotDataEntries" :key="key">
                  <td class="k">{{ key }}</td>
                  <td class="v">{{ typeof val === 'object' ? JSON.stringify(val) : val }}</td>
                </tr>
              </tbody>
            </table>
            <table v-else class="data-table">
              <tbody>
                <tr v-for="[name, count] in receivedItemCounts" :key="name">
                  <td class="k">{{ name }}</td>
                  <td class="v cnt-badge">×{{ count }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ap-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--bg-dark);
  border-radius: 6px;
}

.not-connected {
  color: var(--text-muted);
  font-style: italic;
  font-size: 12px;
  text-align: center;
  padding: 20px 12px;
}

.panel-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.ptab {
  flex: 1;
  padding: 5px 10px;
  border: none;
  border-right: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
}
.ptab:last-child { border-right: none; }
.ptab.active { background: var(--bg-dark); color: var(--accent-gold); border-bottom: 2px solid var(--accent); }

.panel-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.data-subtabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.stab {
  padding: 3px 10px;
  border: none;
  border-right: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 11px;
}
.stab.active { background: var(--bg-dark); color: var(--text); border-bottom: 2px solid var(--accent); }
.cnt { font-size: 10px; color: var(--text-muted); margin-left: 3px; }

.data-content {
  flex: 1;
  overflow-y: auto;
  padding: 6px 10px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.data-table tr:nth-child(odd) { background: var(--bg-card); }
.data-table td { padding: 2px 6px; vertical-align: top; }
.k { color: var(--text-muted); white-space: nowrap; width: 1%; padding-right: 10px; }
.v { color: var(--text); word-break: break-all; }
.cnt-badge { color: var(--accent); font-weight: 700; text-align: right; white-space: nowrap; }
</style>
