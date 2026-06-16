<script setup>
import { ref } from 'vue'
import MapView from './MapView.vue'

const dungeons = [
  { id: 'dws', label: 'DWS' },
  { id: 'cof', label: 'CoF' },
  { id: 'fow', label: 'FoW' },
  { id: 'tod', label: 'ToD' },
  { id: 'rc',  label: 'RC'  },
  { id: 'pow', label: 'PoW' },
  { id: 'dhc', label: 'DHC' },
]

const activeId = ref('dws')
</script>

<template>
  <div class="dungeon-maps">
    <div class="dungeon-tabs">
      <button
        v-for="d in dungeons"
        :key="d.id"
        :class="['dungeon-tab-btn', activeId === d.id && 'active']"
        @click="activeId = d.id"
      >{{ d.label }}</button>
    </div>
    <MapView :map-id="activeId" class="dungeon-map-view" />
  </div>
</template>

<style scoped>
.dungeon-maps {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.dungeon-tabs {
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  background: var(--bg-panel, #1a1008);
  border-bottom: 1px solid var(--border, #5a3a10);
  flex-shrink: 0;
}

.dungeon-tab-btn {
  padding: 3px 10px;
  background: transparent;
  border: 1px solid var(--border, #5a3a10);
  color: var(--text, #d4a84b);
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: background 0.15s, color 0.15s;
}
.dungeon-tab-btn:hover { background: var(--bg-hover, #2a1a08); }
.dungeon-tab-btn.active {
  background: var(--accent, #5a3a10);
  color: #fff;
  border-color: var(--accent-bright, #d4a84b);
}

.dungeon-map-view {
  flex: 1;
  min-height: 0;
}
</style>
