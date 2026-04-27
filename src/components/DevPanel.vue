<script setup>
import { ref, computed } from 'vue'
import { useStateStore } from '../stores/stateStore'
import apTables from '../../data/ap_tables.json'

const store = useStateStore()
const activeTab    = ref('ap')
const activeSubTab = ref('slot_data')


const receivedItemCounts = computed(() => {
  const counts = {}
  for (const name of store.receivedItems) {
    counts[name] = (counts[name] ?? 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
})

const slotDataEntries = computed(() =>
  Object.entries(store.rawSlotData).sort((a, b) => a[0].localeCompare(b[0]))
)
</script>

<template>
  <div class="dev-panel">

    <!-- Main tabs -->
    <div class="dev-tabs main-tabs">
      <button :class="['dev-tab', activeTab === 'ap' && 'active']" @click="activeTab = 'ap'">AP</button>
    </div>

    <div v-if="!store.apConnected" class="not-connected">Non connecté à AP</div>
    <template v-else>

      <!-- Sub-tabs (AP) -->
      <div v-if="activeTab === 'ap'" class="dev-tabs sub-tabs">
        <button :class="['sub-tab', activeSubTab === 'slot_data' && 'active']" @click="activeSubTab = 'slot_data'">
          slot_data <span class="count">{{ slotDataEntries.length }}</span>
        </button>
        <button :class="['sub-tab', activeSubTab === 'items' && 'active']" @click="activeSubTab = 'items'">
          Items reçus <span class="count">{{ store.receivedItems.length }}</span>
        </button>
      </div>

      <!-- Content -->
      <div class="dev-content">

        <!-- slot_data -->
        <template v-if="activeTab === 'ap' && activeSubTab === 'slot_data'">
          <table class="data-table">
            <tbody>
              <tr v-for="[key, val] in slotDataEntries" :key="key">
                <td class="key">{{ key }}</td>
                <td class="val">{{ typeof val === 'object' ? JSON.stringify(val) : val }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <!-- Items reçus -->
        <template v-if="activeTab === 'ap' && activeSubTab === 'items'">
          <table class="data-table">
            <tbody>
              <tr v-for="[name, count] in receivedItemCounts" :key="name">
                <td class="key">{{ name }}</td>
                <td class="val count-badge">×{{ count }}</td>
              </tr>
            </tbody>
          </table>
        </template>


      </div>
    </template>
  </div>
</template>

<style scoped>
.dev-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--bg-dark);
}

/* Main tabs */
.main-tabs {
  display: flex;
  gap: 2px;
  padding: 6px 10px 0;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.dev-tab {
  padding: 4px 14px;
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  background: var(--bg-panel);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.dev-tab.active {
  background: var(--bg-dark);
  color: var(--accent-gold);
}

/* Sub-tabs */
.sub-tabs {
  display: flex;
  gap: 0;
  padding: 0;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg-card);
}

.sub-tab {
  padding: 4px 12px;
  border: none;
  border-right: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
}
.sub-tab.active {
  background: var(--bg-dark);
  color: var(--text);
  border-bottom: 2px solid var(--accent);
}
.sub-tab .count {
  font-size: 10px;
  color: var(--text-muted);
  margin-left: 4px;
}

/* Content */
.dev-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

.not-connected {
  color: var(--text-muted);
  font-style: italic;
  margin-top: 20px;
  text-align: center;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.data-table tr:nth-child(odd) { background: var(--bg-card); }
.data-table td, .data-table th {
  padding: 2px 6px;
  vertical-align: top;
}
.data-table th {
  text-align: left;
  color: var(--accent-gold);
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border);
}
.data-table .key {
  color: var(--text-muted);
  white-space: nowrap;
  width: 1%;
  padding-right: 12px;
}
.data-table .val {
  color: var(--text);
  word-break: break-all;
}
.data-table tr.found { opacity: 0.4; }
.count-badge {
  color: var(--accent);
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
}
</style>
