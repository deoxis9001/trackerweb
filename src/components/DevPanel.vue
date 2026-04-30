<script setup>
import { ref, computed } from 'vue'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { computeAccessibility, buildInventory } from '../logic/accessibility'
import locationsRaw from '../../data/location_meta.json'

const store    = useStateStore()
const settings = useSettingsStore()

// ── Logic tab ────────────────────────────────────────────────────────────────

const logicFilter = ref('accessible')

const accessibilityMap = computed(() => {
  const inv = buildInventory(store)
  return computeAccessibility(inv, settings)
})

const STATUS_LABEL = {
  accessible:   'OK',
  out_of_logic: 'OOL',
  inaccessible: 'NON',
}
const STATUS_COLOR = {
  accessible:   '#7ac038',
  out_of_logic: '#d4901a',
  inaccessible: '#c03030',
}

const logicRows = computed(() => {
  const map = accessibilityMap.value
  return locationsRaw
    .filter(loc => loc.id != null)
    .map(loc => ({ loc, status: map.get(loc.id) ?? 'inaccessible' }))
    .filter(({ status }) => logicFilter.value === 'all' || status === logicFilter.value)
    .sort((a, b) => a.loc.name.localeCompare(b.loc.name))
})

const logicCopied = ref(false)
function copyLogic() {
  const lines = logicRows.value.map(({ loc, status }) =>
    `[${STATUS_LABEL[status]}] ${loc.name}  (${loc.key_rando ?? loc.key})`
  )
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    logicCopied.value = true
    setTimeout(() => { logicCopied.value = false }, 1500)
  })
}
</script>

<template>
  <div class="dev-panel">

    <!-- Logic tab -->
    <template>
      <div class="logic-toolbar">
        <div class="filter-btns">
          <button :class="['filter-btn', logicFilter === 'accessible' && 'active-ok']"   @click="logicFilter = 'accessible'">Accessible <span class="count">{{ accessibilityMap.size > 0 ? [...accessibilityMap.values()].filter(s => s === 'accessible').length : '?' }}</span></button>
          <button :class="['filter-btn', logicFilter === 'out_of_logic' && 'active-ool']" @click="logicFilter = 'out_of_logic'">OOL <span class="count">{{ [...accessibilityMap.values()].filter(s => s === 'out_of_logic').length }}</span></button>
          <button :class="['filter-btn', logicFilter === 'inaccessible' && 'active-no']"  @click="logicFilter = 'inaccessible'">Inaccess. <span class="count">{{ [...accessibilityMap.values()].filter(s => s === 'inaccessible').length }}</span></button>
          <button :class="['filter-btn', logicFilter === 'all' && 'active']"              @click="logicFilter = 'all'">Tout</button>
        </div>
        <button class="copy-btn" @click="copyLogic">{{ logicCopied ? 'Copié ✓' : 'Copier' }}</button>
      </div>
      <div class="dev-content">
        <table class="data-table">
          <tbody>
            <tr v-for="{ loc, status } in logicRows" :key="loc.id">
              <td class="logic-badge" :style="{ color: STATUS_COLOR[status] }">{{ STATUS_LABEL[status] }}</td>
              <td class="key">{{ loc.name }}</td>
              <td class="val logic-key">{{ loc.key_rando ?? loc.key }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="logicRows.length === 0" class="not-connected">Aucune location dans ce filtre</div>
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

/* Logic tab */
.logic-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 8px;
}
.filter-btns {
  display: flex;
  gap: 4px;
}
.filter-btn {
  padding: 2px 8px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--bg-panel);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 11px;
}
.filter-btn .count { margin-left: 3px; font-size: 10px; }
.filter-btn.active-ok  { background: #1a3a0a; color: #7ac038; border-color: #7ac038; }
.filter-btn.active-ool { background: #3a2800; color: #d4901a; border-color: #d4901a; }
.filter-btn.active-no  { background: #3a0808; color: #c03030; border-color: #c03030; }
.filter-btn.active     { background: var(--bg-dark); color: var(--text); }
.copy-btn {
  padding: 2px 10px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--bg-panel);
  color: var(--text);
  cursor: pointer;
  font-size: 11px;
  white-space: nowrap;
}
.copy-btn:hover { border-color: var(--accent); color: var(--accent); }
.logic-badge {
  font-weight: 700;
  font-size: 10px;
  white-space: nowrap;
  width: 1%;
  padding-right: 6px;
  text-align: center;
}
.logic-key {
  color: var(--text-muted);
  font-size: 10px;
}
</style>
