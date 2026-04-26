<script setup>
import { useRouter } from 'vue-router'
import { useStateStore } from '../stores/stateStore'
import { disconnectFromAP } from '../archipelago/client'

const store  = useStateStore()
const router = useRouter()
const isDev  = import.meta.env.DEV

function handleReset() {
  disconnectFromAP()
  store.resetTracker()
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
      <button
        v-for="dungeon in store.dungeonRegions"
        :key="dungeon"
        :class="['tab', store.activeView === dungeon && 'active']"
        @click="store.setActiveView(dungeon)"
      >{{ dungeon }}</button>
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
      <span v-if="store.apConnected" class="connected">● AP</span>
      <span v-else class="disconnected">○ Offline</span>
    </div>

    <div class="nav-right">
      <button
        :class="['settings-btn', store.showRegionPopup && 'active']"
        @click="store.toggleRegionPopup()"
        title="Régions accessibles"
      >Régions</button>
      <button class="settings-btn" @click="openBroadcastItems()" title="Broadcast items">📡 Items</button>
      <button v-if="isDev" class="settings-btn" @click="openBroadcastRegions()" title="Broadcast régions [dev]">📡 Régions</button>
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

.connected    { color: var(--accent); font-size: 12px; font-weight: 600; }
.disconnected { color: var(--text-muted); font-size: 12px; }
.ap-status    { display: flex; align-items: center; gap: 8px; font-size: 12px; }

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
