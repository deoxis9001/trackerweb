<script setup>
import { ref, computed } from 'vue'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useLocale } from '../composables/useLocale'
import ItemGrid from '../components/ItemGrid.vue'
import MapView from '../components/MapView.vue'
import DungeonMaps from '../components/DungeonMaps.vue'
import CheckList from '../components/CheckList.vue'
import PinnedLocations from '../components/PinnedLocations.vue'
import EntrancePanel from '../components/EntrancePanel.vue'

const store    = useStateStore()
const settings = useSettingsStore()
const { t }    = useLocale()
const activeTab      = ref('overworld')
const showEntrances  = ref(false)

const shuffleOn = computed(() => {
  const e = settings.randoDefines?.ENTRANCES
  return e === 'ENTRANCES_COUPLED' || (e !== 'ENTRANCES_VANILLA' && !!settings.dungeonEntranceShuffle)
})
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
          >{{ t('navbar.overworld') }}</button>
          <button
            :class="['tab-btn', activeTab === 'mines' && 'active']"
            @click="activeTab = 'mines'"
          >{{ t('navbar.tab_mines') }}</button>
          <button
            :class="['tab-btn', activeTab === 'dungeons' && 'active']"
            @click="activeTab = 'dungeons'"
          >{{ t('navbar.tab_dungeon_maps') }}</button>
        </div>
        <div class="tab-content">
          <MapView v-if="activeTab === 'overworld'" map-id="map" />
          <MapView v-else-if="activeTab === 'mines'" map-id="mines" />
          <DungeonMaps v-else />
        </div>
      </template>
    </div>

    <div class="bottom-bar">
      <div class="items-col">
        <div class="col-title">
        {{ t('item_grid.inventory') }}
        <button
          v-if="shuffleOn"
          :class="['ep-toggle', showEntrances && 'ep-toggle--on']"
          :title="showEntrances ? t('item_grid.ep_toggle_hide') : t('item_grid.ep_toggle_assign')"
          @click="showEntrances = !showEntrances"
        >⚙</button>
      </div>
        <div class="items-scroll">
          <ItemGrid />
        </div>
      </div>
      <EntrancePanel v-if="showEntrances && shuffleOn" />
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
  display: flex;
  align-items: center;
  gap: 6px;
}

.ep-toggle {
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 3px;
  padding: 0 4px;
  font-size: 11px;
  line-height: 1.4;
  cursor: pointer;
}
.ep-toggle:hover { color: var(--text); border-color: var(--accent-soft); }
.ep-toggle--on   { color: var(--accent); border-color: var(--accent); }

.items-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
}
</style>
