<script setup>
import { ref, computed } from 'vue'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useLocale } from '../composables/useLocale'
import LocationTreeNode from './LocationTreeNode.vue'

const store    = useStateStore()
const settings = useSettingsStore()
const { t, tLocation, tRegion } = useLocale()

const searchQuery = ref('')
const filterPool  = ref('all')

const POOL_LABELS = computed(() => ({
  all: t('checklist.pools.all'),
  hp: t('checklist.pools.hp'),
  element: t('checklist.pools.element'),
  shop: t('checklist.pools.shop'),
  scrub: t('checklist.pools.scrub'),
  fairy: t('checklist.pools.fairy'),
  scroll: t('checklist.pools.scroll'),
  butterfly: t('checklist.pools.butterfly'),
  dig: t('checklist.pools.dig'),
  water: t('checklist.pools.water'),
  pot: t('checklist.pools.pot'),
  enemy: t('checklist.pools.enemy'),
  fuse_gold: t('checklist.pools.fuse_gold'),
  fuse_red: t('checklist.pools.fuse_red'),
  fuse_green: t('checklist.pools.fuse_green'),
  fuse_blue: t('checklist.pools.fuse_blue'),
  rupee: t('checklist.pools.rupee'),
}))

const STATUS_COLOR = {
  accessible:   '#7ac038',
  out_of_logic: '#d4901a',
  inaccessible: '#d82828',
}

// Display names for dungeon keys (used as group headers when grouping by dungeon)
const DUNGEON_LABELS = {
  DWS: 'Deepwood Shrine',
  CoF: 'Cave of Flames',
  FoW: 'Fortress of Winds',
  ToD: 'Temple of Droplets',
  RC:  'Royal Crypt',
  PoW: 'Palace of Winds',
  DHC: 'Dark Hyrule Castle',
}

function locColor() { return '#d82828' }

const visibleLocations = computed(() => {
  let locs = store.visibleLocations
  if (filterPool.value !== 'all') {
    locs = locs.filter(l => l.pools?.includes(filterPool.value))
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    locs = locs.filter(l => tLocation(l.key, l.name).toLowerCase().includes(q))
  }
  return locs
})

// Group dungeon locations by dungeon key; overworld by region_key
const groupedLocations = computed(() => {
  const groups = {}
  for (const loc of visibleLocations.value) {
    let key, fallback
    if (loc.dungeon) {
      key      = '__dungeon__' + loc.dungeon
      fallback = DUNGEON_LABELS[loc.dungeon] ?? loc.dungeon
    } else {
      key      = loc.region_key || loc.region_name || 'Unknown'
      fallback = loc.region_name || key
    }
    if (!groups[key]) groups[key] = { locs: [], fallback }
    groups[key].locs.push(loc)
  }
  return Object.entries(groups)
    .map(([key, { locs, fallback }]) => [key, locs, tRegion(key, fallback)])
    .sort(([, , a], [, , b]) => a.localeCompare(b))
})

// ── Prefix tree ─────────────────────────────────────────────────────────────

function buildPrefixTree(locs, keyPrefix = '', depth = 0) {
  if (locs.length === 0) return null

  const getDisplay = loc => loc._treeDisplay ?? loc.name

  // Safety: empty display names → flat
  if (locs.some(l => !getDisplay(l))) {
    return {
      nodeKey: keyPrefix || 'root',
      label:   '',
      leaves:  locs.map(loc => ({ loc, shortName: loc.name })),
      children: [],
    }
  }

  if (locs.length === 1) {
    return {
      nodeKey: (keyPrefix || 'root') + '_' + locs[0].id,
      label:   '',
      leaves:  [{ loc: locs[0], shortName: getDisplay(locs[0]) }],
      children: [],
    }
  }

  if (depth > 10) {
    return {
      nodeKey: keyPrefix || 'root',
      label:   '',
      leaves:  locs.map(loc => ({ loc, shortName: getDisplay(loc) })),
      children: [],
    }
  }

  const allWords = locs.map(loc => getDisplay(loc).split(' '))
  const minLen   = Math.min(...allWords.map(w => w.length))

  // Common prefix (leave at least 1 word different per location)
  let commonLen = 0
  for (let i = 0; i < minLen - 1; i++) {
    if (allWords.every(w => w[i] === allWords[0][i])) commonLen++
    else break
  }

  const label = allWords[0].slice(0, commonLen).join(' ')

  // Group by first non-shared word
  const grouped = new Map()
  for (let i = 0; i < locs.length; i++) {
    const remaining  = allWords[i].slice(commonLen)
    const firstWord  = remaining[0] ?? ''
    const afterFirst = remaining.slice(1).join(' ')
    if (!grouped.has(firstWord)) grouped.set(firstWord, [])
    grouped.get(firstWord).push({ loc: locs[i], afterFirst })
  }

  const leaves   = []
  const children = []

  for (const [firstWord, entries] of grouped) {
    if (entries.length === 1) {
      const { loc, afterFirst } = entries[0]
      leaves.push({ loc, shortName: (firstWord + (afterFirst ? ' ' + afterFirst : '')).trim() })
    } else {
      const subLocs = entries.map(({ loc, afterFirst }) => ({
        ...loc,
        _treeDisplay: afterFirst || firstWord,
      }))
      const subKey  = (keyPrefix || 'root') + '_' + firstWord
      const subtree = buildPrefixTree(subLocs, subKey, depth + 1)
      if (subtree) {
        children.push({
          nodeKey:  subKey,
          label:    (firstWord + (subtree.label ? ' ' + subtree.label : '')).trim(),
          leaves:   subtree.leaves,
          children: subtree.children,
        })
      }
    }
  }

  return { nodeKey: keyPrefix || 'root', label, leaves, children }
}

const locationTrees = computed(() => {
  const result = {}
  for (const [key, locs] of groupedLocations.value) {
    result[key] = buildPrefixTree(locs, key)
  }
  return result
})

// ── Region helpers ───────────────────────────────────────────────────────────

const collapsedRegions = ref(new Set())
const collapsedTreeKeys = ref(new Set())

function toggleRegion(key) {
  if (collapsedRegions.value.has(key)) collapsedRegions.value.delete(key)
  else collapsedRegions.value.add(key)
}

function toggleTreeKey(nodeKey) {
  if (collapsedTreeKeys.value.has(nodeKey)) collapsedTreeKeys.value.delete(nodeKey)
  else collapsedTreeKeys.value.add(nodeKey)
}

function regionCheckedCount(locs) {
  return locs.filter(l => store.isChecked(l.id)).length
}

function onRightClickLoc(e, loc) {
  if (store.isChecked(loc.id)) store.toggleLocation(loc.id)
}

const totalVisible = computed(() => visibleLocations.value.length)
const totalChecked = computed(() => visibleLocations.value.filter(l => store.isChecked(l.id)).length)
</script>

<template>
  <div class="checklist-panel">
    <div class="filters">
      <input v-model="searchQuery" class="search" :placeholder="t('checklist.search_placeholder')" />
      <select v-model="filterPool" class="pool-select">
        <option v-for="(label, val) in POOL_LABELS" :key="val" :value="val">{{ label }}</option>
      </select>
    </div>

    <div class="stats-bar">
      {{ totalChecked }} / {{ totalVisible }} {{ t('checklist.visible') }}
      <span v-if="!settings.showInaccessible" class="hint"> {{ t('checklist.inaccessible_hidden') }}</span>
    </div>

    <div class="location-groups">
      <div v-for="([key, locs, label]) in groupedLocations" :key="key" class="region-group">
        <div class="region-header" @click="toggleRegion(key)">
          <span class="region-toggle">{{ collapsedRegions.has(key) ? '▶' : '▼' }}</span>
          <span class="region-name">{{ label }}</span>
          <span class="region-count">{{ regionCheckedCount(locs) }}/{{ locs.length }}</span>
        </div>

        <div v-if="!collapsedRegions.has(key)" class="region-locations">

          <!-- Tree view when no active search -->
          <LocationTreeNode
            v-if="!searchQuery && locationTrees[key]"
            :node="locationTrees[key]"
            :is-root="true"
            :depth="0"
            :collapsed-keys="collapsedTreeKeys"
            :toggle-collapse="toggleTreeKey"
            :loc-color="locColor"
            :is-checked="(id) => store.isChecked(id)"
            :toggle-location="(id) => store.toggleLocation(id)"
            :on-right-click="onRightClickLoc"
            :t-location="tLocation"
          />

          <!-- Flat list when search is active -->
          <template v-else>
            <div
              v-for="loc in locs"
              :key="loc.id"
              :class="['location-row', store.isChecked(loc.id) && 'checked']"
              @click="!store.isChecked(loc.id) && store.toggleLocation(loc.id)"
              @contextmenu.prevent="onRightClickLoc($event, loc)"
            >
              <span class="check-dot" :style="{ color: locColor(loc) }">●</span>
              <span class="loc-name">{{ tLocation(loc.key, loc.name) }}</span>
              <span v-if="loc.pools.length" class="loc-pools">{{ loc.pools.slice(0, 2).join(', ') }}</span>
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

/* Flat search results */
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
.location-row:hover { background: rgba(255, 255, 255, 0.04); }
.location-row.checked { color: var(--text-muted); }
.location-row.checked .loc-name { text-decoration: line-through; }

.check-dot { font-size: 9px; flex-shrink: 0; }
.loc-name  { flex: 1; }
.loc-pools { font-size: 10px; color: var(--text-muted); white-space: nowrap; }
</style>
