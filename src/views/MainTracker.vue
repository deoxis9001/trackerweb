<script setup>
import { ref } from 'vue'
import { useStateStore } from '../stores/stateStore'
import ItemGrid from '../components/ItemGrid.vue'
import MapView from '../components/MapView.vue'
import DungeonMaps from '../components/DungeonMaps.vue'
import CheckList from '../components/CheckList.vue'
import PinnedLocations from '../components/PinnedLocations.vue'

const store = useStateStore()
const activeTab = ref('overworld')
</script>

<template>
  <div class="tracker-layout">
    <div class="map-section">
      <CheckList v-if="store.activePanel === 'checklist'" />

      <template v-else>
        <div class="tab-bar">
          <button
            :class="['tab-btn', activeTab === 'overworld' && 'active']"
            @click="activeTab = 'overworld'"
          >Overworld</button>
          <button
            :class="['tab-btn', activeTab === 'mines' && 'active']"
            @click="activeTab = 'mines'"
          >Melari's Mines</button>
          <button
            :class="['tab-btn', activeTab === 'dungeons' && 'active']"
            @click="activeTab = 'dungeons'"
          >Maps Dungeons</button>
        </div>
        <div class="tab-content">
          <MapView v-if="activeTab === 'overworld'" map-id="map" />
          <MapView v-else-if="activeTab === 'mines'" map-id="mine" />
          <DungeonMaps v-else />
        </div>
      </template>
    </div>

    <div class="bottom-bar">
      <div class="items-col">
        <div class="col-title">Inventory</div>
        <div class="items-scroll">
          <ItemGrid />
        </div>
      </div>
      <PinnedLocations />
    </div>
  </div>
</template>

<style scoped>
.tracker-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.map-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.tab-bar {
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.tab-btn {
  padding: 3px 12px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  transition: background 0.15s, color 0.15s;
}
.tab-btn:hover { background: var(--bg-hover, #2a1a08); }
.tab-btn.active {
  background: var(--accent, #5a3a10);
  color: #fff;
  border-color: var(--accent-bright, #d4a84b);
}

.tab-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  background: var(--bg-dark);
}

/* ── Bottom bar ─────────────────────────────────────────────────────────── */

.bottom-bar {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  overflow: hidden;
}

.items-col {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.col-title {
  padding: 3px 8px;
  background: var(--bg-panel);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.items-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
}
</style>
