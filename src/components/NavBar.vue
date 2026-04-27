<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { disconnectFromAP, resyncFromAP } from '../archipelago/client'
import ArchipelagoLogo from './ArchipelagoLogo.vue'

const store    = useStateStore()
const settings = useSettingsStore()
const router   = useRouter()
const isDev    = import.meta.env.DEV

const entrancePicker = ref(null)

function onDungeonTabClick(slot) {
  if (!settings.dungeonEntranceShuffle) {
    store.setActiveView(slot)
    return
  }
  const assigned = store.dungeonEntranceMap[slot]
  if (assigned) {
    store.setActiveView(assigned)
    entrancePicker.value = null
  } else {
    entrancePicker.value = entrancePicker.value === slot ? null : slot
  }
}

function onDungeonTabRightClick(e, slot) {
  if (!settings.dungeonEntranceShuffle) return
  e.preventDefault()
  store.clearDungeonEntrance(slot)
  entrancePicker.value = null
}

function assignEntrance(slot, target) {
  store.setDungeonEntrance(slot, target)
  store.setActiveView(target)
  entrancePicker.value = null
}

function handleReset() {
  if (store.apConnected) {
    resyncFromAP()
  } else {
    disconnectFromAP()
    store.resetTracker()
  }
}

function openBroadcastItems() {
  window.open(router.resolve('/broadcast').href, '_blank', 'width=340,height=700,noopener')
}
function openBroadcastRegions() {
  window.open(router.resolve('/broadcast-regions').href, '_blank', 'width=260,height=400,noopener')
}
</script>

<template>
  <nav class="navbar">
    <div class="brand" @click="router.push('/')" style="cursor:pointer">
      <!-- Ezlo – the Minish Cap -->
      <svg class="logo" width="30" height="36" viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Hat body -->
        <path d="M15 2 C14 2 2 22 2 28 L28 28 C28 22 16 2 15 2Z" fill="#4fa82e"/>
        <!-- Inner highlight -->
        <path d="M15 5 C14.5 5 5 23 5 28 L15 28Z" fill="#6ed040" opacity="0.22"/>
        <!-- Brim -->
        <ellipse cx="15" cy="28" rx="13" ry="4.5" fill="#357a1c"/>
        <!-- Brim shine -->
        <ellipse cx="15" cy="27" rx="10" ry="2" fill="#5cb83a" opacity="0.55"/>
        <!-- Left eye -->
        <ellipse cx="9.5" cy="21.5" rx="2.4" ry="2.4" fill="#1a2e0c"/>
        <!-- Right eye -->
        <ellipse cx="20.5" cy="21.5" rx="2.4" ry="2.4" fill="#1a2e0c"/>
        <!-- Eye shines -->
        <ellipse cx="10.3" cy="20.7" rx="0.75" ry="0.75" fill="white"/>
        <ellipse cx="21.3" cy="20.7" rx="0.75" ry="0.75" fill="white"/>
        <!-- Tip curl -->
        <path d="M15 2 C13 0 10.5 1.5 12 4.5" stroke="#357a1c" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <!-- Brim underside -->
        <ellipse cx="15" cy="30.5" rx="13" ry="2.8" fill="#2a5e14"/>
      </svg>
      <span class="brand-text">TMC Tracker</span>
    </div>

    <div class="map-tabs">
      <button
        :class="['tab', store.activeView === 'overworld' && 'active']"
        @click="store.setActiveView('overworld')"
      >Overworld</button>
      <div
        v-for="dungeon in store.dungeonRegions"
        :key="dungeon"
        class="dungeon-tab-wrap"
      >
        <button
          :class="['tab', (settings.dungeonEntranceShuffle ? store.dungeonEntranceMap[dungeon] && store.activeView === store.dungeonEntranceMap[dungeon] : store.activeView === dungeon) && 'active', settings.dungeonEntranceShuffle && store.dungeonEntranceMap[dungeon] && 'mapped']"
          @click="onDungeonTabClick(dungeon)"
          @contextmenu="onDungeonTabRightClick($event, dungeon)"
        >
          {{ dungeon }}<template v-if="settings.dungeonEntranceShuffle && store.dungeonEntranceMap[dungeon]">→{{ store.dungeonEntranceMap[dungeon] }}</template>
        </button>
        <div v-if="entrancePicker === dungeon" class="entrance-picker">
          <button
            v-for="d in store.dungeonRegions"
            :key="d"
            :class="['ep-btn', { active: store.dungeonEntranceMap[dungeon] === d }]"
            @click="assignEntrance(dungeon, d)"
          >{{ d }}</button>
        </div>
      </div>
    </div>

    <div class="panel-tabs">
      <button
        :class="['tab', store.activePanel === 'map' && 'active']"
        @click="store.setActivePanel('map')"
      >Map</button>
      <button
        :class="['tab', store.activePanel === 'checklist' && 'active']"
        @click="store.setActivePanel('checklist')"
      >List</button>
    </div>

    <div class="stats">{{ store.checkedCount }} / {{ store.totalCount }}</div>

    <div class="ap-status">
      <button class="tab reset-btn" @click="handleReset()">Reset</button>
      <ArchipelagoLogo :size="22" :active="store.apConnected" :title="store.apConnected ? 'Connected' : 'Offline'"/>
    </div>

    <div class="nav-right">
      <button
        v-if="isDev"
        :class="['settings-btn', store.showDevPanel && 'active']"
        @click="store.showDevPanel = !store.showDevPanel"
        title="Dev panel"
      >🛠 Dev</button>
      <button
        v-if="isDev"
        :class="['settings-btn', store.showRegionPopup && 'active']"
        @click="store.toggleRegionPopup()"
        title="Régions accessibles"
      >Régions</button>
      <button class="settings-btn" @click="openBroadcastItems()" title="Broadcast items">📡 Items</button>
      <button v-if="isDev" class="settings-btn" @click="openBroadcastRegions()" title="Broadcast régions [dev]">📡 Régions</button>
      <button
        v-if="store.apConnected"
        :class="['settings-btn', store.showChat && 'active']"
        @click="store.showChat = !store.showChat"
      >💬 Chat</button>
      <button
        :class="['settings-btn', store.showSettings && 'active']"
        @click="store.toggleSettings()"
      >⚙ Settings</button>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  background: linear-gradient(180deg, #7a5028 0%, #5e3c1c 100%);
  border-bottom: 2px solid var(--accent-soft);
  box-shadow: 0 2px 8px rgba(0,0,0,0.5);
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.logo {
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.6));
  transition: transform 0.15s;
}
.brand:hover .logo { transform: rotate(-8deg) scale(1.08); }

.brand-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent-gold);
  letter-spacing: 0.04em;
  text-shadow: 0 1px 4px rgba(0,0,0,0.7);
  white-space: nowrap;
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--border);
  flex-shrink: 0;
}

.map-tabs, .panel-tabs {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.dungeon-tab-wrap {
  position: relative;
}

.tab.mapped {
  border-color: var(--accent-gold);
  color: var(--accent-gold);
}

.entrance-picker {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: #2e1a08;
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 4px;
  min-width: 70px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.6);
}

.ep-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted);
  padding: 3px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  text-align: left;
  white-space: nowrap;
}
.ep-btn:hover { background: rgba(212,136,42,0.2); color: var(--text); }
.ep-btn.active { background: var(--accent-soft); color: var(--text); border-color: var(--accent); }

.tab {
  background: rgba(255,255,255,0.05);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 3px 10px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.12s;
}
.tab:hover {
  color: var(--text);
  border-color: var(--accent);
  background: rgba(212,136,42,0.15);
}
.tab.active {
  background: var(--accent-soft);
  color: var(--text);
  border-color: var(--accent);
  box-shadow: 0 0 6px rgba(212,136,42,0.35);
}

.stats {
  font-size: 12px;
  color: var(--accent-gold);
  font-weight: 600;
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.nav-right { margin-left: auto; flex-shrink: 0; }

.ap-status { display: flex; align-items: center; gap: 8px; }

.reset-btn { color: #e04040; border-color: #6a2020; }
.reset-btn:hover { background: #6a2020; color: var(--text); border-color: #e04040; }

.settings-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 3px 10px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.12s;
}
.settings-btn:hover, .settings-btn.active {
  color: var(--accent-gold);
  border-color: var(--accent-gold);
  background: rgba(200,152,32,0.12);
}
</style>
