<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { computeAccessibility, buildInventory } from '../logic/accessibility'

const store    = useStateStore()
const settings = useSettingsStore()

onMounted(() => {
  document.body.style.background = '#000'
  document.body.style.overflow   = 'hidden'
})
onUnmounted(() => {
  document.body.style.background = ''
  document.body.style.overflow   = ''
})

const accessibility = computed(() =>
  computeAccessibility(buildInventory(store), settings)
)

const owRegionKeys = computed(() =>
  new Set(
    store.allRegions
      .filter(r => !r.is_dungeon_region && r.key !== 'MENU')
      .map(r => r.key)
  )
)

const regionRows = computed(() => {
  const groups = {}
  for (const loc of store.visibleLocations) {
    if (loc.id == null) continue
    if (!owRegionKeys.value.has(loc.region_key)) continue
    if (store.isChecked(loc.id)) continue
    if (!groups[loc.region_name]) groups[loc.region_name] = { accessible: 0, ool: 0 }
    const status = accessibility.value.get(loc.id)
    if (status === 'accessible')   groups[loc.region_name].accessible++
    if (status === 'out_of_logic') groups[loc.region_name].ool++
  }
  return Object.entries(groups)
    .filter(([, g]) => g.accessible > 0 || g.ool > 0)
    .sort(([, a], [, b]) => b.accessible - a.accessible || b.ool - a.ool)
})
</script>

<template>
  <div class="bc-regions-root">
    <div class="bc-header">
      <span class="bc-title">Régions</span>
      <span class="bc-total">{{ store.checkedCount }}/{{ store.totalCount }}</span>
    </div>
    <div class="bc-list">
      <div v-for="([name, g]) in regionRows" :key="name" class="bc-row">
        <span class="bc-acc">{{ g.accessible }}</span>
        <span v-if="g.ool" class="bc-ool">+{{ g.ool }}</span>
        <span v-else class="bc-ool-placeholder" />
        <span class="bc-name">{{ name }}</span>
      </div>
      <div v-if="!regionRows.length" class="bc-empty">Aucune région accessible</div>
    </div>
  </div>
</template>

<style scoped>
.bc-regions-root {
  background: #000;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', sans-serif;
  padding: 8px 0 4px;
}

.bc-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 12px 6px;
  border-bottom: 1px solid rgba(212, 136, 42, 0.3);
  margin-bottom: 4px;
}

.bc-title {
  font-size: 13px;
  font-weight: 700;
  color: #fce070;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.bc-total {
  font-size: 11px;
  color: rgba(255, 248, 224, 0.45);
}

.bc-list {
  flex: 1;
  overflow-y: auto;
}

.bc-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 12px;
  font-size: 13px;
  line-height: 1.5;
}

.bc-acc             { color: #7ac038; font-weight: 700; min-width: 20px; text-align: right; }
.bc-ool             { color: #d4901a; font-size: 11px; min-width: 26px; }
.bc-ool-placeholder { min-width: 26px; }
.bc-name            { color: #fff8e0; }

.bc-empty {
  padding: 8px 12px;
  font-size: 12px;
  color: rgba(255, 248, 224, 0.35);
}
</style>
