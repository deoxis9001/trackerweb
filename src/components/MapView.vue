<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const isDev = import.meta.env.DEV
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { computeAccessibility, buildInventory } from '../logic/accessibility'
const overworldAreaModules = import.meta.glob('../../data/map_coords_overworld_*.json', { eager: true })

import dungeonCoordsDws from '../../data/map_coords_dungeons_dws.json'
import dungeonCoordsCof from '../../data/map_coords_dungeons_cof.json'
import dungeonCoordsRc  from '../../data/map_coords_dungeons_rc.json'
import dungeonCoordsFow from '../../data/map_coords_dungeons_fow.json'
import dungeonCoordsTod from '../../data/map_coords_dungeons_tod.json'
import dungeonCoordsPow from '../../data/map_coords_dungeons_pow.json'
import dungeonCoordsDhc from '../../data/map_coords_dungeons_dhc.json'

const state    = useStateStore()
const settings = useSettingsStore()

// ── Overworld area metadata ───────────────────────────────────────────────────
const OVERWORLD_AREAS = [
  'castle','clouds','crenel','falls','hills','hylia','lonlon',
  'minishwoods','northfield','ruins','southfield','swamp',
  'town','trilby','valley','westernwoods',
]

const AREA_LABELS = {
  castle: 'Castle', clouds: 'Clouds', crenel: 'Crenel', falls: 'Falls',
  hills: 'Hills', hylia: 'Hylia', lonlon: 'Lon Lon',
  minishwoods: 'Minish Woods', northfield: 'N. Field', ruins: 'Ruins',
  southfield: 'S. Field', swamp: 'Swamp', town: 'Town',
  trilby: 'Trilby', valley: 'Valley', westernwoods: 'W. Woods',
}

// area → id → [{x, y}]  (location entries where map === area)
// id → [{x, y}]  (location entries where map === 'map')
const areaCoordById = {}
const overworldCoordById = {}
for (const [path, mod] of Object.entries(overworldAreaModules)) {
  const area = path.match(/map_coords_overworld_(.+)\.json$/)[1]
  if (!OVERWORLD_AREAS.includes(area)) continue
  areaCoordById[area] = {}
  for (const entry of mod.default) {
    areaCoordById[area][entry.id] = entry.location
      .filter(l => l.map === area)
      .map(l => ({ x: l.x, y: l.y }))
    for (const l of entry.location) {
      if (l.map !== 'map') continue
      if (!overworldCoordById[entry.id]) overworldCoordById[entry.id] = []
      overworldCoordById[entry.id].push({ x: l.x, y: l.y })
    }
  }
}

// current overworld area (null = full map)
const currentArea = ref(null)

// ── Dungeon metadata ──────────────────────────────────────────────────────────
const DUNGEON_MAP_NAMES = { RC: 'rc', DWS: 'dws', CoF: 'cof', FoW: 'fow', ToD: 'tod', PoW: 'pow', DHC: 'dhc' }

// Fixed overworld entrance position per dungeon slot
const DUNGEON_ENTRANCE_COORDS = {
  CoF: { x: 325,  y: 233  },
  DHC: { x: 1326, y: 164  },
  DWS: { x: 2284, y: 1842 },
  FoW: { x: 591,  y: 1777 },
  PoW: { x: 2304, y: 245  },
  RC:  { x: 830,  y: 165  },
  ToD: { x: 2337, y: 1060 },
}

const DUNGEON_FLOORS = {
  dws: ['B2', 'B1', '1F'],
  cof: ['B3', 'B2', 'B1', '1F'],
  rc:  ['rc'],
  fow: ['1F', '2F', '3F'],
  tod: ['B3', 'B2', 'B1'],
  pow: ['1F', '2F', '3F', '4F', '5F'],
  dhc: ['B2', 'B1', '1F', '2F', '3F', '4F', 'Sanc'],
}

const DUNGEON_COORDS_RAW = {
  dws: dungeonCoordsDws,
  cof: dungeonCoordsCof,
  rc:  dungeonCoordsRc,
  fow: dungeonCoordsFow,
  tod: dungeonCoordsTod,
  pow: dungeonCoordsPow,
  dhc: dungeonCoordsDhc,
}

// ── Container + fitted image size ─────────────────────────────────────────────
const containerEl = ref(null)
const mapEl       = ref(null)
const naturalW    = ref(3300)
const naturalH    = ref(2060)
const containerW  = ref(0)
const containerH  = ref(0)

function onMapLoad(e) {
  naturalW.value = e.target.naturalWidth  || 3300
  naturalH.value = e.target.naturalHeight || 2060
}

const fittedW = computed(() => {
  if (!containerW.value || !containerH.value) return 0
  const scale = Math.min(
    containerW.value  / naturalW.value,
    containerH.value  / naturalH.value,
    1
  )
  return Math.round(naturalW.value * scale)
})

const fittedH = computed(() => {
  if (!fittedW.value) return 0
  return Math.round(fittedW.value * naturalH.value / naturalW.value)
})

// ── Mouse coords on image ─────────────────────────────────────────────────────
const mouseImgX = ref(null)
const mouseImgY = ref(null)

function onMousemoveMap(e) {
  const rect    = containerEl.value?.getBoundingClientRect()
  if (!rect || !fittedW.value) return
  const offsetX = (containerW.value - fittedW.value) / 2
  const offsetY = (containerH.value - fittedH.value) / 2
  const imgX = (e.clientX - rect.left - offsetX - panX.value) / zoom.value
  const imgY = (e.clientY - rect.top  - offsetY - panY.value) / zoom.value
  mouseImgX.value = Math.round(imgX)
  mouseImgY.value = Math.round(imgY)
}
function onMouseleaveMap() {
  mouseImgX.value = null
  mouseImgY.value = null
}

// ── Zoom & Pan ────────────────────────────────────────────────────────────────
const zoom     = ref(1)
const panX     = ref(0)
const panY     = ref(0)
const dragging = ref(false)

const MIN_ZOOM = 0.5
const MAX_ZOOM = 5

let dragStartX = 0
let dragStartY = 0

const wrapperTransform = computed(() =>
  `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`
)

function onWheel(e) {
  e.preventDefault()
  const rect = containerEl.value.getBoundingClientRect()
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top

  const factor  = e.deltaY < 0 ? 1.15 : 1 / 1.15
  const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.value * factor))
  if (newZoom === zoom.value) return

  const offsetX = (containerW.value - fittedW.value) / 2
  const offsetY = (containerH.value - fittedH.value) / 2
  const uwX = (cx - offsetX - panX.value) / zoom.value
  const uwY = (cy - offsetY - panY.value) / zoom.value

  panX.value = cx - uwX * newZoom - offsetX
  panY.value = cy - uwY * newZoom - offsetY
  zoom.value = newZoom
}

function onMousedown(e) {
  if (e.button !== 0) return
  if (e.target.closest('.pin-group')) return
  dragging.value = true
  dragStartX = e.clientX - panX.value
  dragStartY = e.clientY - panY.value
}

function onMousemove(e) {
  if (!dragging.value) return
  panX.value = e.clientX - dragStartX
  panY.value = e.clientY - dragStartY
}

function onMouseup() {
  dragging.value = false
}

function resetView() {
  zoom.value = 1
  panX.value = 0
  panY.value = 0
}

let ro
onMounted(() => {
  ro = new ResizeObserver(entries => {
    const r = entries[0].contentRect
    containerW.value = r.width
    containerH.value = r.height
  })
  if (containerEl.value) ro.observe(containerEl.value)
  containerEl.value?.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('mousemove', onMousemove)
  window.addEventListener('mouseup',   onMouseup)
})
onUnmounted(() => {
  ro?.disconnect()
  containerEl.value?.removeEventListener('wheel', onWheel)
  window.removeEventListener('mousemove', onMousemove)
  window.removeEventListener('mouseup',   onMouseup)
})

// ── Accessibility computation ─────────────────────────────────────────────────
const accessibility = computed(() => {
  const inv          = buildInventory(state)
  const entranceMap  = settings.dungeonEntranceShuffle ? state.dungeonEntranceMap : {}
  return computeAccessibility(inv, settings, entranceMap)
})

// ── Map name + floor selection ────────────────────────────────────────────────
const mapName = computed(() => {
  if (state.activeView === 'overworld') return 'map'
  return DUNGEON_MAP_NAMES[state.activeView] || 'map'
})

const currentFloor = ref(null)

const availableFloors = computed(() => DUNGEON_FLOORS[mapName.value] ?? [])

watch(() => state.activeView, (view) => {
  resetView()
  const dname = DUNGEON_MAP_NAMES[view]
  currentFloor.value = dname ? (DUNGEON_FLOORS[dname]?.[0] ?? null) : null
  if (view === 'overworld') currentArea.value = state.activeZone ?? null
}, { immediate: true })

watch(() => state.activeZone, (zone) => {
  if (state.activeView === 'overworld') {
    currentArea.value = zone
    resetView()
  }
})

function setFloor(floor) {
  currentFloor.value = floor
  resetView()
}

const useFloors = computed(() => settings.autoTabDungeons === 'etage')

function setArea(area) {
  currentArea.value = area
  state.activeZone = area
  resetView()
}

// ── Map image path ────────────────────────────────────────────────────────────
const mapSrc = computed(() => {
  const base = import.meta.env.BASE_URL
  if (mapName.value === 'map') {
    if (currentArea.value) return `${base}images/maps/overworld/${currentArea.value}.png`
    return `${base}images/maps/overworld.png`
  }
  if (useFloors.value && currentFloor.value) return `${base}images/maps/dungeons/${mapName.value}/${currentFloor.value}.png`
  return `${base}images/maps/${mapName.value}.png`
})

// ── Coord indexes ─────────────────────────────────────────────────────────────
// Dungeon overview: id → [{map, x, y}]  (all location entries across dungeon files)
const coordsByIdAll = {}
// Dungeons: dname → id → [{map, x, y}]  (map = floor name or dname for overview)
const dungeonCoordById = {}
for (const [dname, raw] of Object.entries(DUNGEON_COORDS_RAW)) {
  dungeonCoordById[dname] = {}
  for (const entry of raw) {
    dungeonCoordById[dname][entry.id] = entry.location
    if (!coordsByIdAll[entry.id]) coordsByIdAll[entry.id] = []
    for (const l of entry.location) coordsByIdAll[entry.id].push(l)
  }
}

// ── Build pin groups ──────────────────────────────────────────────────────────
const pins = computed(() => {
  if (!fittedW.value) return []

  const scaleX   = fittedW.value / naturalW.value
  const scaleY   = fittedH.value / naturalH.value
  const dname    = mapName.value
  const isDungeon = dname !== 'map'
  const floor    = currentFloor.value

  const entranceShuffle  = !isDungeon && settings.dungeonEntranceShuffle
  const entranceMap      = state.dungeonEntranceMap
  // Set of dungeons that have an entrance slot assigned to them (values of entranceMap)
  const assignedDungeons = new Set(Object.values(entranceMap))
  // Reverse map: dungeon key → entrance slot (e.g. 'DWS' → 'DHC')
  const dungeonToSlot = {}
  for (const [slot, dungeon] of Object.entries(entranceMap)) dungeonToSlot[dungeon] = slot


  const byCoord = {}
  for (const loc of state.visibleLocations) {
    if (loc.id == null) continue

    // With entrance shuffle: hide dungeon locations whose dungeon has no assigned entrance slot
    if (entranceShuffle && loc.dungeon && !assignedDungeons.has(loc.dungeon)) continue

    let coordList
    if (!isDungeon && currentArea.value) {
      // Overworld area zoom
      const byId = areaCoordById[currentArea.value] || {}
      coordList = (byId[loc.id] || []).map(c => ({ ...c, map: 'area' }))
    } else if (!isDungeon) {
      if (entranceShuffle && loc.dungeon && dungeonToSlot[loc.dungeon]) {
        // Show dungeon checks at the entrance slot's overworld position
        const slot = dungeonToSlot[loc.dungeon]
        const slotCoord = DUNGEON_ENTRANCE_COORDS[slot]
        coordList = slotCoord ? [{ ...slotCoord, _slot: slot }] : []
      } else {
        coordList = overworldCoordById[loc.id] || []
      }
    } else if (useFloors.value) {
      const byId = dungeonCoordById[dname] || {}
      coordList = (byId[loc.id] || []).filter(c => c.map === floor && c.x > 0 && c.y > 0)
    } else {
      // overview mode: use map_coords.json dungeon entries
      coordList = (coordsByIdAll[loc.id] || []).filter(c => c.map === dname)
    }

    for (const coord of coordList) {
      const key = `${coord.x}:${coord.y}`
      if (!byCoord[key]) byCoord[key] = {
        x: Math.round(coord.x * scaleX),
        y: Math.round(coord.y * scaleY),
        locs: [],
        _slot: coord._slot ?? null,
      }
      byCoord[key].locs.push(loc)
    }
  }

  const regularPins = Object.values(byCoord).map(pin => ({
    ...pin,
    allChecked: pin.locs.every(l => state.isChecked(l.id)),
    tooltip:    pin.locs.map(l => l.name).join('\n'),
    type:       pinType(pin.locs),
    segments:   pinSegments(pin.locs),
    hintColor:  hintColorForLocs(pin.locs),
  }))

  // Door pins for unassigned dungeon entrances (entrance shuffle mode, full overworld only)
  const doorPins = []
  if (entranceShuffle && !currentArea.value) {
    for (const [slot, coord] of Object.entries(DUNGEON_ENTRANCE_COORDS)) {
      if (!entranceMap[slot]) {
        const dungeonLocs = state.visibleLocations.filter(l => l.dungeon === slot && l.id != null)
        const statuses = dungeonLocs.map(l => accessibility.value.get(l.id) ?? 'inaccessible')
        let status = 'inaccessible'
        if (statuses.includes('accessible'))        status = 'accessible'
        else if (statuses.includes('out_of_logic')) status = 'out_of_logic'
        doorPins.push({
          x:       Math.round(coord.x * scaleX),
          y:       Math.round(coord.y * scaleY),
          slot,
          isDoor:  true,
          status,
          locs:    [],
          tooltip: `${slot} — entrance not assigned`,
        })
      }
    }
  }

  return [...regularPins, ...doorPins]
})

function pinSegments(locs) {
  const unchecked = locs.filter(l => !state.isChecked(l.id))
  if (unchecked.length === 0) return [{ status: 'checked' }]

  const order = ['accessible', 'out_of_logic', 'inaccessible']
  const counts = { accessible: 0, out_of_logic: 0, inaccessible: 0 }
  for (const l of unchecked) counts[accessibility.value.get(l.id) ?? 'inaccessible']++

  return order.filter(s => counts[s] > 0).map(status => ({ status }))
}

function pinType(locs) {
  if (locs.some(l => l.name.includes('Fused')))  return 'fused'
  if (locs.every(l => l.dungeon !== null))        return 'dungeon'
  return 'location'
}

function dungeonPath(x, y) {
  return `M ${x-7},${y+7} H ${x+7} V ${y} A 7,7 0 0 0 ${x-7},${y} Z`
}

const PIN_COLOR = {
  accessible:   '#7ac038',
  out_of_logic: '#d4901a',
  inaccessible: '#d82828',
  checked:      '#3e2408',
}

function hintColorForLocs(locs) {
  let best = null
  for (const loc of locs) {
    const s = state.locationHints[loc.id]
    if (s == null) continue
    if (best === null || s > best) best = s
  }
  if (best === null) return null
  if (best >= 30) return '#fce070'
  if (best >= 20) return '#ff5050'
  return '#ffffff'
}

// ── Hover pin ─────────────────────────────────────────────────────────────────
function showTooltip(e, pin) { state.hoveredPinLocs = pin.locs }
function hideTooltip()       { state.hoveredPinLocs = [] }

// ── Click: check / right-click: uncheck ──────────────────────────────────────
function checkPin(pin) {
  for (const loc of pin.locs) {
    if (!state.isChecked(loc.id)) state.toggleLocation(loc.id)
  }
}
function uncheckPin(pin) {
  for (const loc of pin.locs) {
    if (state.isChecked(loc.id)) state.toggleLocation(loc.id)
  }
}
function onContextmenuPin(e, pin) {
  if (pin.locs.some(l => state.isChecked(l.id))) uncheckPin(pin)
}

</script>

<template>
  <div class="map-view">

    <!-- Overworld area selector -->
    <div v-if="state.activeView === 'overworld'" class="floor-selector">
      <button
        :class="['floor-btn', { active: currentArea === null }]"
        @click.stop="setArea(null)"
      >Full Map</button>
      <button
        v-for="area in OVERWORLD_AREAS"
        :key="area"
        :class="['floor-btn', { active: currentArea === area }]"
        @click.stop="setArea(area)"
      >{{ AREA_LABELS[area] }}</button>
    </div>

    <!-- Floor selector (dungeons only, when mode = étage) -->
    <div v-else-if="useFloors && availableFloors.length > 1" class="floor-selector">
      <button
        v-for="floor in availableFloors"
        :key="floor"
        :class="['floor-btn', { active: currentFloor === floor }]"
        @click.stop="setFloor(floor)"
      >{{ floor }}</button>
    </div>

    <div
      ref="containerEl"
      class="map-container"
      :style="{ cursor: dragging ? 'grabbing' : 'grab' }"
      @mousedown="onMousedown"
      @mousemove="onMousemoveMap"
      @mouseleave="onMouseleaveMap"
    >

      <!-- Wrapper explicitly sized to the fitted image dimensions -->
      <div
        v-if="fittedW && fittedH"
        class="map-wrapper"
        :style="{
          width: fittedW + 'px',
          height: fittedH + 'px',
          transform: wrapperTransform,
          transformOrigin: '0 0',
        }"
      >
        <img
          ref="mapEl"
          :src="mapSrc"
          :width="fittedW"
          :height="fittedH"
          class="map-img"
          @load="onMapLoad"
          @error="e => e.target.style.opacity = '0.3'"
        />

        <svg class="pin-overlay" :width="fittedW" :height="fittedH">
          <defs>
            <filter id="halo-blur" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="4"/>
            </filter>
          </defs>
          <!-- Door pins (entrance shuffle, unassigned) -->
          <g
            v-for="pin in pins.filter(p => p.isDoor)"
            :key="`door-${pin.slot}`"
            class="pin-group"
            @mouseenter="showTooltip($event, pin)"
            @mouseleave="hideTooltip"
          >
            <path :d="dungeonPath(pin.x, pin.y)" :fill="PIN_COLOR[pin.status]" stroke="#000" stroke-width="1.5" opacity="0.85" />
            <text :x="pin.x" :y="pin.y+5" text-anchor="middle"
              font-size="7" font-weight="bold" fill="#fff" pointer-events="none"
            >?</text>
          </g>

          <g
            v-for="pin in pins.filter(p => !p.isDoor)"
            :key="`${pin.x}:${pin.y}`"
            class="pin-group"
            @click="checkPin(pin)"
            @contextmenu="onContextmenuPin($event, pin)"
            @mouseenter="showTooltip($event, pin)"
            @mouseleave="hideTooltip"
          >
            <!-- Hint halo -->
            <circle
              v-if="pin.hintColor && !pin.allChecked"
              :cx="pin.x" :cy="pin.y"
              r="12"
              :fill="pin.hintColor"
              opacity="0.75"
              filter="url(#halo-blur)"
              pointer-events="none"
            />
            <defs>
              <clipPath :id="`pc-${pin.x}-${pin.y}`">
                <rect
                  v-if="state.activeView !== 'overworld' || pin.type === 'location'"
                  :x="pin.x - 7" :y="pin.y - 7" width="14" height="14"
                />
                <circle
                  v-else-if="pin.type === 'fused'"
                  :cx="pin.x" :cy="pin.y" r="7"
                />
                <path v-else :d="dungeonPath(pin.x, pin.y)" />
              </clipPath>
            </defs>

            <g :clip-path="`url(#pc-${pin.x}-${pin.y})`" :opacity="pin.allChecked ? 0.4 : 0.9">
              <template v-if="pin.segments.length === 3">
                <polygon
                  :points="`${pin.x},${pin.y} ${pin.x},${pin.y-30} ${pin.x+26},${pin.y+15}`"
                  :fill="PIN_COLOR[pin.segments[0].status]"
                />
                <polygon
                  :points="`${pin.x},${pin.y} ${pin.x+26},${pin.y+15} ${pin.x-26},${pin.y+15}`"
                  :fill="PIN_COLOR[pin.segments[1].status]"
                />
                <polygon
                  :points="`${pin.x},${pin.y} ${pin.x-26},${pin.y+15} ${pin.x},${pin.y-30}`"
                  :fill="PIN_COLOR[pin.segments[2].status]"
                />
              </template>
              <template v-else-if="pin.segments.length === 2">
                <polygon
                  :points="`${pin.x+7},${pin.y-7} ${pin.x-7},${pin.y-7} ${pin.x-7},${pin.y+7}`"
                  :fill="PIN_COLOR[pin.segments[0].status]"
                />
                <polygon
                  :points="`${pin.x+7},${pin.y-7} ${pin.x+7},${pin.y+7} ${pin.x-7},${pin.y+7}`"
                  :fill="PIN_COLOR[pin.segments[1].status]"
                />
              </template>
              <rect
                v-else
                :x="pin.x - 20" :y="pin.y - 20"
                width="40" height="40"
                :fill="PIN_COLOR[pin.segments[0].status]"
              />
            </g>

            <rect
              v-if="state.activeView !== 'overworld' || pin.type === 'location'"
              :x="pin.x - 7" :y="pin.y - 7" width="14" height="14"
              fill="none" stroke="#000" stroke-width="1.5"
              :opacity="pin.allChecked ? 0.4 : 0.9"
              class="pin"
            />
            <circle
              v-else-if="pin.type === 'fused'"
              :cx="pin.x" :cy="pin.y" r="7"
              fill="none" stroke="#000" stroke-width="1.5"
              :opacity="pin.allChecked ? 0.4 : 0.9"
              class="pin"
            />
            <path
              v-else
              :d="dungeonPath(pin.x, pin.y)"
              fill="none" stroke="#000" stroke-width="1.5"
              :opacity="pin.allChecked ? 0.4 : 0.9"
              class="pin"
            />

            <circle
              v-if="pin.locs.length > 1"
              :cx="pin.x + 4"
              :cy="pin.y - 4"
              r="3"
              fill="#fff"
              pointer-events="none"
            />
          </g>
        </svg>
      </div>

      <!-- Mouse coords (dev only) -->
      <div
        v-if="isDev && mouseImgX !== null"
        class="mouse-coords"
      >{{ mouseImgX }}, {{ mouseImgY }}</div>

      <!-- Reset zoom button -->
      <button
        v-if="zoom !== 1 || panX !== 0 || panY !== 0"
        class="zoom-reset"
        @click.stop="resetView"
      >↺</button>

    </div>

  </div>
</template>

<style scoped>
.map-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  min-height: 0;
}

.floor-selector {
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  background: var(--bg-panel, #1a1008);
  border-bottom: 1px solid var(--border, #5a3a10);
  flex-shrink: 0;
}

.floor-btn {
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
.floor-btn:hover {
  background: var(--bg-hover, #2a1a08);
}
.floor-btn.active {
  background: var(--accent, #5a3a10);
  color: #fff;
  border-color: var(--accent-bright, #d4a84b);
}

.map-container {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  position: relative;
  user-select: none;
}

.map-wrapper {
  position: relative;
  flex-shrink: 0;
  line-height: 0;
}

.map-img {
  display: block;
  width: 100%;
  height: 100%;
}

.pin-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.pin-group {
  pointer-events: all;
  cursor: pointer;
}
.pin {
  transition: transform 0.1s;
  transform-box: fill-box;
  transform-origin: center;
}
.pin-group:hover .pin {
  transform: scale(1.28);
}

.mouse-coords {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-family: monospace;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  pointer-events: none;
}

.zoom-reset {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  background: rgba(62, 40, 8, 0.85);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
.zoom-reset:hover {
  background: var(--bg-panel);
}
</style>
