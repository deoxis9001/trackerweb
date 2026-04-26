<script setup>
import { computed } from 'vue'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { computeAccessibility, buildInventory } from '../logic/accessibility'

const store    = useStateStore()
const settings = useSettingsStore()

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
  <div class="region-guide" v-if="regionRows.length">
    <div class="guide-title">Regions</div>
    <div class="guide-list">
      <div v-for="([name, g]) in regionRows" :key="name" class="guide-row">
        <span class="g-acc">{{ g.accessible }}</span>
        <span v-if="g.ool" class="g-ool">+{{ g.ool }}</span>
        <span class="g-name">{{ name }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.region-guide {
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  max-height: 220px;
}

.guide-title {
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-panel);
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.guide-list {
  overflow-y: auto;
  flex: 1;
}

.guide-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 11px;
  line-height: 1.4;
}

.g-acc  { color: #7ac038; font-weight: 600; min-width: 18px; text-align: right; }
.g-ool  { color: #d4901a; font-size: 10px; min-width: 22px; }
.g-name { color: var(--text-muted); }
</style>
