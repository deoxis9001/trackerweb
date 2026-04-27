<script setup>
import { ref, computed } from 'vue'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { computeAccessibility, buildInventory } from '../logic/accessibility'

const store    = useStateStore()
const settings = useSettingsStore()

const searchQuery = ref('')
const filterPool  = ref('all')

const POOL_LABELS = {
  all: 'All',
  hp: 'Hearts',
  element: 'Elements',
  shop: 'Shop',
  scrub: 'Scrub',
  fairy: 'Fairy',
  scroll: 'Scrolls',
  butterfly: 'Butterfly',
  dig: 'Dig',
  water: 'Water',
  pot: 'Pot',
  enemy: 'Enemy',
  fuse_gold: 'Gold Fuse',
  fuse_red: 'Red Fuse',
  fuse_green: 'Green Fuse',
  fuse_blue: 'Blue Fuse',
  rupee: 'Rupee',
}

const STATUS_COLOR = {
  accessible:   '#7ac038',
  out_of_logic: '#d4901a',
  inaccessible: '#d82828',
}

const accessibility = computed(() => {
  const inv = buildInventory(store)
  return computeAccessibility(inv, settings)
})

function locColor(loc) {
  if (store.isChecked(loc.id)) return '#3e2408'
  return STATUS_COLOR[accessibility.value.get(loc.id)] ?? '#e03030'
}


const visibleLocations = computed(() => {
  return store.visibleLocations.filter(loc => {
    if (loc.id == null) return false

    // Search filter
    const q = searchQuery.value.toLowerCase()
    if (q && !loc.name.toLowerCase().includes(q) && !loc.region_name.toLowerCase().includes(q)) return false

    // Pool filter
    if (filterPool.value !== 'all' && !loc.pools.includes(filterPool.value)) return false

    // Hide inaccessible unchecked unless setting enabled
    if (!store.isChecked(loc.id) && !settings.showInaccessible) {
      if (accessibility.value.get(loc.id) === 'inaccessible') return false
    }

    return true
  })
})

const groupedLocations = computed(() => {
  const groups = {}
  for (const loc of visibleLocations.value) {
    const region = loc.region_name || 'Unknown'
    if (!groups[region]) groups[region] = []
    groups[region].push(loc)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
})

const collapsedRegions = ref(new Set())

function toggleRegion(region) {
  if (collapsedRegions.value.has(region)) collapsedRegions.value.delete(region)
  else collapsedRegions.value.add(region)
}

function regionCheckedCount(locs) {
  return locs.filter(l => store.isChecked(l.id)).length
}

function onRightClickLoc(e, loc) {
  if (store.isChecked(loc.id)) store.toggleLocation(loc.id)
}

// ── Dungeon sub-area grouping ─────────────────────────────────────────────────
function isFloorCode(w) {
  return /^B\d+$/i.test(w) || /^\d+F$/i.test(w) || w === 'Sanc'
}

function parseSubArea(name, regionName) {
  let rest = name
  if (regionName && rest.startsWith(regionName + ' '))
    rest = rest.slice(regionName.length + 1)
  const words = rest.split(' ')
  const fi = words.findIndex(isFloorCode)
  if (fi >= 0) return {
    subArea: words.slice(0, fi + 1).join(' '),
    shortName: words.slice(fi + 1).join(' ') || rest,
  }
  return { subArea: null, shortName: rest }
}

function isDungeonRegion(locs) {
  return locs.some(l => l.dungeon != null)
}

const dungeonSubAreas = computed(() => {
  const result = {}
  for (const [region, locs] of groupedLocations.value) {
    if (!isDungeonRegion(locs)) continue
    const grouped = new Map()
    const flat = []
    for (const loc of locs) {
      const { subArea } = parseSubArea(loc.name, region)
      if (subArea != null) {
        if (!grouped.has(subArea)) grouped.set(subArea, [])
        grouped.get(subArea).push(loc)
      } else {
        flat.push(loc)
      }
    }
    result[region] = {
      groups: [...grouped.entries()].map(([name, ls]) => ({ name, locs: ls })),
      flat,
    }
  }
  return result
})

function shortLocName(locName, regionName) {
  return parseSubArea(locName, regionName).shortName
}

const collapsedSubAreas = ref(new Set())
function toggleSubArea(key) {
  if (collapsedSubAreas.value.has(key)) collapsedSubAreas.value.delete(key)
  else collapsedSubAreas.value.add(key)
}

const totalVisible  = computed(() => visibleLocations.value.length)
const totalChecked  = computed(() => visibleLocations.value.filter(l => store.isChecked(l.id)).length)
</script>

<template>
  <div class="checklist-panel">
    <div class="filters">
      <input v-model="searchQuery" class="search" placeholder="Rechercher…" />
      <select v-model="filterPool" class="pool-select">
        <option v-for="(label, val) in POOL_LABELS" :key="val" :value="val">{{ label }}</option>
      </select>
    </div>

    <div class="stats-bar">
      {{ totalChecked }} / {{ totalVisible }} visible
      <span v-if="!settings.showInaccessible" class="hint"> (inaccessible masqué)</span>
    </div>

    <div class="location-groups">
      <div v-for="([region, locs]) in groupedLocations" :key="region" class="region-group">
        <div class="region-header" @click="toggleRegion(region)">
          <span class="region-toggle">{{ collapsedRegions.has(region) ? '▶' : '▼' }}</span>
          <span class="region-name">{{ region }}</span>
          <span class="region-count">{{ regionCheckedCount(locs) }}/{{ locs.length }}</span>
        </div>

        <div v-if="!collapsedRegions.has(region)" class="region-locations">

          <!-- Dungeon: sub-area grouping (désactivé si recherche active) -->
          <template v-if="dungeonSubAreas[region] && !searchQuery">

            <!-- Locations sans code de floor (Boss, Prize…) -->
            <div
              v-for="loc in dungeonSubAreas[region].flat"
              :key="loc.id"
              :class="['location-row', store.isChecked(loc.id) && 'checked']"
              @click="!store.isChecked(loc.id) && store.toggleLocation(loc.id)"
              @contextmenu="onRightClickLoc($event, loc)"
            >
              <span class="check-dot" :style="{ color: locColor(loc) }">●</span>
              <span class="loc-name">{{ shortLocName(loc.name, region) }}</span>
              <span v-if="loc.pools.length" class="loc-pools">{{ loc.pools.slice(0,2).join(', ') }}</span>
            </div>

            <!-- Sous-groupes par étage -->
            <div
              v-for="sg in dungeonSubAreas[region].groups"
              :key="sg.name"
              class="subarea-group"
            >
              <div class="subarea-header" @click="toggleSubArea(region + ':' + sg.name)">
                <span class="subarea-toggle">{{ collapsedSubAreas.has(region + ':' + sg.name) ? '▶' : '▼' }}</span>
                <span class="subarea-name">{{ sg.name }}</span>
                <span class="subarea-count">{{ regionCheckedCount(sg.locs) }}/{{ sg.locs.length }}</span>
              </div>
              <div v-if="!collapsedSubAreas.has(region + ':' + sg.name)" class="subarea-locs">
                <div
                  v-for="loc in sg.locs"
                  :key="loc.id"
                  :class="['location-row', 'location-row--sub', store.isChecked(loc.id) && 'checked']"
                  @click="!store.isChecked(loc.id) && store.toggleLocation(loc.id)"
                  @contextmenu="onRightClickLoc($event, loc)"
                >
                  <span class="check-dot" :style="{ color: locColor(loc) }">●</span>
                  <span class="loc-name">{{ shortLocName(loc.name, region) }}</span>
                  <span v-if="loc.pools.length" class="loc-pools">{{ loc.pools.slice(0,2).join(', ') }}</span>
                </div>
              </div>
            </div>

          </template>

          <!-- Non-donjon ou recherche active : liste plate avec nom complet -->
          <template v-else>
            <div
              v-for="loc in locs"
              :key="loc.id"
              :class="['location-row', store.isChecked(loc.id) && 'checked']"
              @click="!store.isChecked(loc.id) && store.toggleLocation(loc.id)"
              @contextmenu="onRightClickLoc($event, loc)"
            >
              <span class="check-dot" :style="{ color: locColor(loc) }">●</span>
              <span class="loc-name">{{ loc.name }}</span>
              <span v-if="loc.pools.length" class="loc-pools">{{ loc.pools.slice(0,2).join(', ') }}</span>
            </div>
          </template>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.checklist-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.filters {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid var(--border);
}

.search {
  flex: 1;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.pool-select {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 5px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.stats-bar {
  padding: 4px 8px;
  font-size: 11px;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
}
.hint { opacity: 0.6; }

.location-groups {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.region-group { margin-bottom: 2px; }

.region-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--bg-panel);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  user-select: none;
}
.region-header:hover { background: var(--accent-soft); }

.region-toggle { font-size: 10px; color: var(--text-muted); width: 12px; }
.region-name   { flex: 1; }
.region-count  { font-size: 11px; color: var(--text-muted); }

.region-locations { padding: 2px 0; }

.location-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 12px 3px 24px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text);
  transition: background 0.1s;
}
.location-row:hover { background: rgba(255,255,255,0.04); }
.location-row.checked { color: var(--text-muted); }
.location-row.checked .loc-name { text-decoration: line-through; }

.check-dot { font-size: 9px; flex-shrink: 0; }
.loc-name  { flex: 1; }
.loc-pools { font-size: 10px; color: var(--text-muted); white-space: nowrap; }

.subarea-group { margin-bottom: 1px; }
.subarea-header {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px 3px 20px;
  background: rgba(0,0,0,0.18);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  user-select: none;
}
.subarea-header:hover { background: rgba(255,255,255,0.03); }
.subarea-toggle { font-size: 9px; width: 10px; }
.subarea-name   { flex: 1; }
.subarea-count  { font-size: 10px; }
.location-row--sub { padding-left: 32px; }
</style>
