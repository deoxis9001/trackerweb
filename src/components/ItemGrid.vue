<script setup>
import { computed, ref } from 'vue'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { computeAccessibility, buildInventory } from '../logic/accessibility'
import {
  ITEM_IMAGES,
  ITEM_MAX_COUNT,
  COMPOSITE_DEFS,
  BADGED_DEFS,
  PROGRESSIVE_WITH_DISABLED,
  SWORD_GRID_NOT_PROGRESSIVE,
  SWORD_GRID_PROGRESSIVE,
  INVENTORY_GRID,
  QUEST_GRID,
  SCROLL_GRID,
  DUNGEON_ITEM_ROWS,
} from '../metadata/itemImages'

const store    = useStateStore()
const settings = useSettingsStore()

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCounter(key)     { return ITEM_MAX_COUNT[key] !== undefined }
function isProgressive(key) { return Array.isArray(ITEM_IMAGES[key]) }

function receivedCount(key) {
  if (key === 'PROGRESSIVE_WALLET') {
    return store.receivedItems.filter(n => n === 'Big Wallet').length
  }
  if (key === 'HEART_TOTAL') {
    const containers = store.receivedItems.filter(n => n === 'Heart Container').length
    const pieces     = store.receivedItems.filter(n => n === 'Piece of Heart').length
    return Math.min(containers + Math.floor(pieces / 4), 20)
  }
  if (key === 'PROGRESSIVE_BOMB_BAG') {
    return store.receivedItems.filter(n => n === 'Bomb Bag').length
  }
  const name = store.allItems.find(i => i.key === key)?.name
  if (!name) return 0
  return store.receivedItems.filter(n => n === name).length
}

function autotrackCount(key) {
  if (!store.bizhawkConnected || Object.keys(store.autotrackItems).length === 0) return 0
  const at = store.autotrackItems
  if (key === 'BOMB_BAG')    return at.PROGRESSIVE_BOMB_BAG ?? 0
  if (key === 'BIG_WALLET')  return at.PROGRESSIVE_WALLET   ?? 0
  if (key === 'BOTTLE_1') return (at.BOTTLE ?? 0) >= 1 ? 1 : 0
  if (key === 'BOTTLE_2') return (at.BOTTLE ?? 0) >= 2 ? 1 : 0
  if (key === 'BOTTLE_3') return (at.BOTTLE ?? 0) >= 3 ? 1 : 0
  if (key === 'BOTTLE_4') return (at.BOTTLE ?? 0) >= 4 ? 1 : 0
  return at[key] ?? 0
}

function getCount(key) {
  return Math.max(receivedCount(key), autotrackCount(key), store.manualItems[key] ?? 0)
}

function imgSrc(key) {
  if (!key) return null
  const img = ITEM_IMAGES[key]
  if (!img) return null
  if (Array.isArray(img)) {
    const count = getCount(key)
    const idx = PROGRESSIVE_WITH_DISABLED.has(key)
      ? Math.min(count, img.length - 1)
      : Math.min(Math.max(0, count - 1), img.length - 1)
    return `${import.meta.env.BASE_URL}images/items/${img[idx]}`
  }
  return `${import.meta.env.BASE_URL}images/items/${img}`
}

function hasItem(key) {
  if (!key) return false
  return getCount(key) > 0
}

function incrementItem(key) {
  if (!key) return
  if (isCounter(key)) {
    const max = ITEM_MAX_COUNT[key]
    const cur = store.manualItems[key] ?? 0
    if (cur < max) store.manualItems[key] = cur + 1
  } else if (isProgressive(key)) {
    const max = PROGRESSIVE_WITH_DISABLED.has(key)
      ? ITEM_IMAGES[key].length - 1
      : ITEM_IMAGES[key].length
    const cur = store.manualItems[key] ?? 0
    if (cur < max) store.manualItems[key] = cur + 1
  } else {
    store.manualItems[key] = 1
  }
}

function decrementItem(key) {
  if (!key) return
  const cur = store.manualItems[key] ?? 0
  if (cur > 0) store.manualItems[key] = cur - 1
}

// ── Composite items ───────────────────────────────────────────────────────────

function compositeState(key) {
  const def = COMPOSITE_DEFS[key]
  const l = getCount(def.left) > 0 ? '1' : '0'
  const r = getCount(def.right) > 0 ? '1' : '0'
  return `${l}${r}`
}

function imgSrcComposite(key) {
  const def = COMPOSITE_DEFS[key]
  return `${import.meta.env.BASE_URL}images/items/${def.images[compositeState(key)]}`
}

function compositeHasAny(key) {
  return compositeState(key) !== '00'
}

function compositeDisabled(key) {
  return COMPOSITE_DEFS[key].disabled00 && compositeState(key) === '00'
}

function clickCompositeLeft(key) {
  const def = COMPOSITE_DEFS[key]
  store.manualItems[def.left] = getCount(def.left) > 0 ? 0 : 1
}

function clickCompositeRight(key) {
  const def = COMPOSITE_DEFS[key]
  store.manualItems[def.right] = getCount(def.right) > 0 ? 0 : 1
}

// ── Badged items ──────────────────────────────────────────────────────────────

function badgedHas(key)    { return getCount(BADGED_DEFS[key].base) > 0 }
function badgeActive(key)  { return (store.manualItems[BADGED_DEFS[key].badge] ?? 0) > 0 }
function imgSrcBadged(key) { return imgSrc(BADGED_DEFS[key].base) }
function badgeImgSrc(key) {
  if (key === 'BOMBS_AND_REMOTE') return `${import.meta.env.BASE_URL}images/items/overlay_remote.png`
  return `${import.meta.env.BASE_URL}images/items/${BADGED_DEFS[key].badgeImg}`
}

function clickBadgedBase(key) {
  const { base, loop } = BADGED_DEFS[key]
  const cur = store.manualItems[base] ?? 0
  const isDisabledFirst = PROGRESSIVE_WITH_DISABLED.has(base)
  const max = isProgressive(base)
    ? (isDisabledFirst ? ITEM_IMAGES[base].length - 1 : ITEM_IMAGES[base].length)
    : (ITEM_MAX_COUNT[base] ?? 1)
  store.manualItems[base] = loop ? (cur + 1) % (max + 1) : Math.min(cur + 1, max)
}

function clickBadgeToggle(key) {
  const { badge } = BADGED_DEFS[key]
  store.manualItems[badge] = (store.manualItems[badge] ?? 0) > 0 ? 0 : 1
}

function isAtMax(key) {
  const cur = getCount(key)
  if (isCounter(key)) return cur >= ITEM_MAX_COUNT[key]
  return false
}

function itemTitle(key) {
  return store.allItems.find(i => i.key === key)?.name ?? key
}

function padRow(row, n = 8) {
  if (row.length >= n) return row
  return [...row, ...Array(n - row.length).fill('')]
}

const ALL_SCROLL_KEYS = [
  'SPIN_ATTACK','FAST_SPIN_SCROLL','FAST_SPLIT_SCROLL','GREATSPIN','LONG_SPIN',
  'PERIL_BEAM','SWORD_BEAM','ROCK_BREAKER','DASH_ATTACK','DOWNTHRUST','ROLL_ATTACK',
]

function computedHearts() {
  return Math.min((settings.startingHearts || 3) + getCount('HEART_TOTAL'), 20)
}

function incrementHearts() {
  const current = store.manualItems['HEART_TOTAL'] ?? 0
  const maxAdditional = 20 - (settings.startingHearts || 3)
  if (current < maxAdditional) store.manualItems['HEART_TOTAL'] = current + 1
}

function decrementHearts() {
  const current = store.manualItems['HEART_TOTAL'] ?? 0
  if (current > 0) store.manualItems['HEART_TOTAL'] = current - 1
}

function countScrollActive() {
  const individual  = ALL_SCROLL_KEYS.filter(k => getCount(k) > 0).length
  const progressive = store.receivedItems.filter(n => n === 'Progressive Spin Scroll').length
                    + (store.manualItems['PROGRESSIVE_SPIN_SCROLL'] || 0)
  return Math.max(individual, progressive)
}

// ── Accessibility + location list ────────────────────────────────────────
const accessibility = computed(() => computeAccessibility(buildInventory(store), settings))

const STATUS_COLOR = { accessible: '#4caf50', out_of_logic: '#ffca28', inaccessible: '#f44336' }

const mapLocations = computed(() => {
  const view = store.activeView
  return store.visibleLocations.filter(loc => {
    if (loc.id == null) return false
    if (view === 'overworld') return true
    return loc.dungeon === view
  })
})

const visibleMapLocations = computed(() =>
  mapLocations.value.filter(loc =>
    !store.isChecked(loc.id) && accessibility.value.get(loc.id) === 'accessible'
  )
)

function locListColor(loc) {
  if (store.isChecked(loc.id)) return '#444466'
  return STATUS_COLOR[accessibility.value.get(loc.id)] ?? '#f44336'
}

const groupedMapLocations = computed(() => {
  const groups = {}
  for (const loc of visibleMapLocations.value) {
    const key = loc.region_name || 'Inconnu'
    if (!groups[key]) groups[key] = []
    groups[key].push(loc)
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
})

const expandedMapRegions = ref(new Set())
function toggleMapRegion(region) {
  const next = new Set(expandedMapRegions.value)
  if (next.has(region)) next.delete(region); else next.add(region)
  expandedMapRegions.value = next
}
function regionChecked(locs) { return locs.filter(l => store.isChecked(l.id)).length }

const regionStats = computed(() => {
  const stats = {}
  for (const loc of mapLocations.value) {
    const key = loc.region_name || 'Inconnu'
    if (!stats[key]) stats[key] = { total: 0, checked: 0 }
    stats[key].total++
    if (store.isChecked(loc.id)) stats[key].checked++
  }
  return stats
})

function toggleItem(key) {
  store.manualItems[key] = getCount(key) > 0 ? 0 : 1
}

function onRightClickItem(e, key) {
  const cur = store.manualItems[key] ?? 0
  if (cur > 0) {
    e.preventDefault()
    decrementItem(key)
  }
}

function onRightClickLoc(e, loc) {
  if (store.isChecked(loc.id)) store.toggleLocation(loc.id)
}


// ── Sections computed from settings ──────────────────────────────────────────

const swordGrid = computed(() =>
  settings.progressiveSword ? SWORD_GRID_PROGRESSIVE : SWORD_GRID_NOT_PROGRESSIVE
)

const KINSTONE_GOLD  = new Set(['KINSTONE_GOLD_CLOUD', 'KINSTONE_GOLD_SWAMP', 'KINSTONE_GOLD_FALLS'])
const KINSTONE_RED   = new Set(['KINSTONE_RED_W', 'KINSTONE_RED_ANGLE', 'KINSTONE_RED_E'])
const KINSTONE_BLUE  = new Set(['KINSTONE_BLUE_L', 'KINSTONE_BLUE_6'])
const KINSTONE_GREEN = new Set(['KINSTONE_GREEN_ANGLE', 'KINSTONE_GREEN_SQUARE', 'KINSTONE_GREEN_P'])

const gridSections = computed(() => {
  const gold  = settings.goldFusionAccess
  const red   = settings.redFusionAccess
  const blue  = settings.blueFusionAccess
  const green = settings.greenFusionAccess
  let goldReplaced = false

  function filterKey(k) {
    if (!k) return k
    let access
    if (KINSTONE_GOLD.has(k))  access = gold
    else if (KINSTONE_RED.has(k))   access = red
    else if (KINSTONE_BLUE.has(k))  access = blue
    else if (KINSTONE_GREEN.has(k)) access = green
    else return k
    if (access === 'closed' || access === 'open') return ''
    if (KINSTONE_GOLD.has(k) && access === 'combined') {
      if (!goldReplaced) { goldReplaced = true; return 'KINSTONE_BAG' }
      return ''
    }
    return k
  }

  const filterRows = rows => rows.map(row => row.map(filterKey))

  return [
    { id: 'sword',     rows: filterRows(swordGrid.value) },
    { id: 'inventory', rows: filterRows(INVENTORY_GRID) },
    { id: 'quest',     rows: filterRows(QUEST_GRID) },
    { id: 'scroll',    rows: filterRows(SCROLL_GRID) },
  ]
})
</script>

<template>
  <div class="item-grid-panel">

    <!-- Main item sections -->
    <div class="grid-section">
      <template v-for="section in gridSections" :key="section.id">
        <template v-for="(row, ri) in section.rows" :key="`${section.id}-${ri}`">
          <div v-if="row.some(k => k !== '')" class="item-row">
            <template v-for="(key, ci) in padRow(row)" :key="ci">
              <!-- Empty cell: invisible spacer, not clickable -->
              <div v-if="key === ''" class="item-cell empty" />

              <!-- Auto-count scroll display (non-clickable) -->
              <div
                v-else-if="key === 'PROGRESSIVE_COUNT_SCROLL'"
                :class="['item-cell', 'auto-count', countScrollActive() > 0 && 'has-item']"
                title="Spin Scrolls actifs"
              >
                <img :src="imgSrc(key)" :alt="key" />
                <span v-if="countScrollActive() > 0" :class="['count-badge', countScrollActive() >= 11 && 'count-max']">{{ countScrollActive() }}</span>
              </div>

              <!-- Heart total: clickable counter -->
              <div
                v-else-if="key === 'HEART_TOTAL'"
                class="item-cell has-item"
                title="Total Hearts"
                @click="incrementHearts()"
                @contextmenu.prevent="decrementHearts()"
              >
                <img :src="imgSrc(key)" :alt="key" />
                <span :class="['count-badge', computedHearts() >= 20 && 'count-max']">{{ computedHearts() }}</span>
              </div>

              <!-- Composite item: L-click = left sub-item, R-click = right sub-item -->
              <div
                v-else-if="COMPOSITE_DEFS[key]"
                :class="['item-cell', compositeHasAny(key) && 'has-item', compositeDisabled(key) && 'disabled']"
                :title="key"
                @click="clickCompositeLeft(key)"
                @contextmenu.prevent="clickCompositeRight(key)"
              >
                <img :src="imgSrcComposite(key)" :alt="key" />
              </div>

              <!-- Badged item: L-click cycles base, R-click toggles badge overlay -->
              <div
                v-else-if="BADGED_DEFS[key]"
                :class="['item-cell', 'item-badged', badgedHas(key) && 'has-item']"
                :title="key"
                @click="clickBadgedBase(key)"
                @contextmenu.prevent="clickBadgeToggle(key)"
              >
                <img :src="imgSrcBadged(key)" :alt="key" />
                <img v-if="badgeActive(key)" :src="badgeImgSrc(key)" class="badge-overlay" alt="badge" />
              </div>

              <!-- Normal / progressive / counter cell -->
              <div
                v-else
                :class="['item-cell', hasItem(key) && 'has-item']"
                :title="itemTitle(key)"
                @click="incrementItem(key)"
                @contextmenu="onRightClickItem($event, key)"
              >
                <template v-if="imgSrc(key)">
                  <img :src="imgSrc(key)" :alt="key" />
                  <span v-if="isCounter(key) && getCount(key) > 0" :class="['count-badge', isAtMax(key) && 'count-max']">
                    {{ getCount(key) }}
                  </span>
                </template>
                <div v-else class="item-placeholder">{{ key.slice(0, 4) }}</div>
              </div>
            </template>
          </div>
        </template>
      </template>
    </div>

    <!-- Dungeon items -->
    <div class="dungeon-section">
      <div class="dungeon-grid">
        <!-- Boss row → Wind -->
        <div class="item-row">
          <div v-for="(keys, dungeon) in DUNGEON_ITEM_ROWS" :key="dungeon"
            :class="['item-cell', 'sm', hasItem(dungeon) && 'has-item']"
            :title="itemTitle(dungeon)"
            @click="incrementItem(dungeon)"
            @contextmenu="onRightClickItem($event, dungeon)"
          ><img :src="imgSrc(dungeon)" :alt="dungeon" /></div>
          <div class="item-cell empty sm" />
          <div :class="['item-cell', 'sm', hasItem('WIND_ELEMENT') && 'has-item']"
            title="Wind Element"
            @click="incrementItem('WIND_ELEMENT')"
            @contextmenu="onRightClickItem($event, 'WIND_ELEMENT')"
          ><img :src="imgSrc('WIND_ELEMENT')" alt="Wind Element" /></div>
        </div>

        <!-- Small key row → Fire -->
        <div class="item-row">
          <div v-for="(keys, dungeon) in DUNGEON_ITEM_ROWS" :key="dungeon"
            :class="['item-cell', 'sm', hasItem(keys.smallKey) && 'has-item']"
            :title="itemTitle(keys.smallKey)"
            @click="incrementItem(keys.smallKey)"
            @contextmenu="onRightClickItem($event, keys.smallKey)"
          >
            <img :src="imgSrc(keys.smallKey)" alt="Small Key" />
            <span v-if="isCounter(keys.smallKey) && getCount(keys.smallKey) > 0"
              :class="['count-badge', 'sm', isAtMax(keys.smallKey) && 'count-max']">
              {{ getCount(keys.smallKey) }}
            </span>
          </div>
          <div class="item-cell empty sm" />
          <div :class="['item-cell', 'sm', hasItem('FIRE_ELEMENT') && 'has-item']"
            title="Fire Element"
            @click="incrementItem('FIRE_ELEMENT')"
            @contextmenu="onRightClickItem($event, 'FIRE_ELEMENT')"
          ><img :src="imgSrc('FIRE_ELEMENT')" alt="Fire Element" /></div>
        </div>

        <!-- Big key row → Water -->
        <div class="item-row">
          <template v-for="(keys, dungeon) in DUNGEON_ITEM_ROWS" :key="dungeon">
            <div v-if="keys.bigKey"
              :class="['item-cell', 'sm', hasItem(keys.bigKey) && 'has-item']"
              :title="itemTitle(keys.bigKey)"
              @click="incrementItem(keys.bigKey)"
              @contextmenu="onRightClickItem($event, keys.bigKey)"
            ><img :src="imgSrc(keys.bigKey)" alt="Big Key" /></div>
            <div v-else class="item-cell empty sm" />
          </template>
          <div class="item-cell empty sm" />
          <div :class="['item-cell', 'sm', hasItem('WATER_ELEMENT') && 'has-item']"
            title="Water Element"
            @click="incrementItem('WATER_ELEMENT')"
            @contextmenu="onRightClickItem($event, 'WATER_ELEMENT')"
          ><img :src="imgSrc('WATER_ELEMENT')" alt="Water Element" /></div>
        </div>

        <!-- Map+Compass combined row → Earth -->
        <div class="item-row">
          <template v-for="(keys, dungeon) in DUNGEON_ITEM_ROWS" :key="dungeon">
            <div v-if="keys.map && keys.compass"
              class="item-cell sm map-compass-cell"
              :title="`${itemTitle(keys.map)} / ${itemTitle(keys.compass)}`"
              @click="toggleItem(keys.map)"
              @contextmenu.prevent="toggleItem(keys.compass)"
            >
              <img :src="imgSrc(keys.map)"     :class="['map-half',     hasItem(keys.map)     && 'mc-active']" alt="Map" />
              <img :src="imgSrc(keys.compass)" :class="['compass-half', hasItem(keys.compass) && 'mc-active']" alt="Compass" />
            </div>
            <div v-else class="item-cell empty sm" />
          </template>
          <div class="item-cell empty sm" />
          <div :class="['item-cell', 'sm', hasItem('EARTH_ELEMENT') && 'has-item']"
            title="Earth Element"
            @click="incrementItem('EARTH_ELEMENT')"
            @contextmenu="onRightClickItem($event, 'EARTH_ELEMENT')"
          ><img :src="imgSrc('EARTH_ELEMENT')" alt="Earth Element" /></div>
        </div>
      </div>
    </div>

    <!-- ── Location list for current view ── -->
    <div class="loc-section">
      <div class="loc-section-title">
        {{ store.activeView === 'overworld' ? 'Overworld' : store.activeView }} Locations
        <span class="loc-count">{{ mapLocations.filter(l => store.isChecked(l.id)).length }}/{{ mapLocations.length }}</span>
      </div>
      <div class="loc-list">

        <template v-if="store.activeView !== 'overworld'">
          <!-- Donjon : liste plate -->
          <div
            v-for="loc in visibleMapLocations"
            :key="loc.id"
            :class="['loc-row', store.isChecked(loc.id) && 'checked']"
            @click="!store.isChecked(loc.id) && store.toggleLocation(loc.id)"
            @contextmenu="onRightClickLoc($event, loc)"
          >
            <span class="loc-dot" :style="{ color: locListColor(loc) }">●</span>
            <span class="loc-name">{{ loc.name }}</span>
          </div>
        </template>

        <template v-else>
          <!-- Overworld : groupé par région -->
          <div v-for="([region, locs]) in groupedMapLocations" :key="region" class="loc-group">
            <div class="loc-group-header" @click="toggleMapRegion(region)">
              <span class="loc-group-arrow">{{ expandedMapRegions.has(region) ? '▼' : '▶' }}</span>
              <span class="loc-group-name">{{ region }}</span>
              <span class="loc-group-count">{{ regionStats[region]?.checked ?? 0 }}/{{ regionStats[region]?.total ?? 0 }}</span>
            </div>
            <template v-if="expandedMapRegions.has(region)">
              <div
                v-for="loc in locs"
                :key="loc.id"
                :class="['loc-row', 'loc-row-indent', store.isChecked(loc.id) && 'checked']"
                @click="!store.isChecked(loc.id) && store.toggleLocation(loc.id)"
                @contextmenu="onRightClickLoc($event, loc)"
              >
                <span class="loc-dot" :style="{ color: locListColor(loc) }">●</span>
                <span class="loc-name">{{ loc.name }}</span>
              </div>
            </template>
          </div>
        </template>

        <div v-if="!visibleMapLocations.length" class="loc-empty">Aucune location</div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.item-grid-panel {
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  padding: 8px;
  overflow-y: auto;
  width: 320px;
  min-width: 320px;
  max-width: 320px;
  flex-shrink: 0;
}

.grid-section {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 12px;
}

.item-row {
  display: flex;
  gap: 2px;
}

.item-cell {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.35;
  transition: opacity 0.15s, border-color 0.15s;
  overflow: hidden;
  flex-shrink: 0;
}
.item-cell:hover          { opacity: 0.6; border-color: var(--accent-soft); }
.item-cell.has-item       { opacity: 1; border-color: var(--checked); }
.item-cell.sm             { width: 28px; height: 28px; }
.item-cell.empty          {
  background: transparent;
  border-color: transparent;
  cursor: default;
  pointer-events: none;
}
.item-cell.auto-count {
  cursor: default;
  pointer-events: none;
  border-style: dashed;
}

.item-cell img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: auto;
}

.item-cell.disabled { opacity: 0.2; }
.item-cell.disabled:hover { opacity: 0.4; }

.item-badged { position: relative; }
.badge-overlay {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 55%;
  height: 55%;
  object-fit: contain;
  image-rendering: auto;
  pointer-events: none;
}

.count-badge {
  position: absolute;
  bottom: 1px;
  right: 2px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 3px #000, 0 0 3px #000;
  line-height: 1;
  pointer-events: none;
}
.count-badge.sm { font-size: 8px; }
.count-badge.count-max { color: #7ac038; }

.item-placeholder {
  font-size: 8px;
  color: var(--text-muted);
  text-align: center;
}

.dungeon-section { margin-top: 4px; }

.dungeon-grid {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.map-compass-cell { opacity: 1 !important; cursor: pointer; }
.map-compass-cell img {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  object-fit: contain;
  opacity: 0.3;
  transition: opacity 0.15s;
}
.map-compass-cell .map-half     { left: 0; }
.map-compass-cell .compass-half { right: 0; }
.map-compass-cell img.mc-active { opacity: 1; }

.loc-section {
  margin-top: 8px;
  border-top: 1px solid var(--border);
  padding-top: 6px;
}

.loc-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.loc-count {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 400;
}

.loc-list { display: flex; flex-direction: column; gap: 1px; }

.loc-row {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 4px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  color: var(--text);
}
.loc-row:hover { background: rgba(255,255,255,0.05); }
.loc-row.checked { color: var(--text-muted); }
.loc-row.checked .loc-name { text-decoration: line-through; }

.loc-dot  { font-size: 8px; flex-shrink: 0; }
.loc-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.loc-group { margin-bottom: 1px; }

.loc-group-header {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 4px;
  background: var(--bg-panel);
  border-radius: 3px;
  cursor: pointer;
  user-select: none;
  font-size: 11px;
  font-weight: 600;
}
.loc-group-header:hover { background: var(--accent-soft); }

.loc-group-arrow { font-size: 8px; color: var(--text-muted); width: 10px; flex-shrink: 0; }
.loc-group-name  { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
.loc-group-count { font-size: 10px; color: var(--text-muted); font-weight: 400; }

.loc-row-indent { padding-left: 14px; }

.loc-hovered { background: rgba(76, 175, 80, 0.08); border-left: 2px solid #4caf50; }
.loc-hovered:hover { background: rgba(76, 175, 80, 0.15); }
.loc-hovered-sep { height: 1px; background: var(--border); margin: 3px 0; }

.loc-empty {
  font-size: 11px;
  color: var(--text-muted);
  padding: 4px;
}
</style>
