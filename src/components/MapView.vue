<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { computeAccessibility, buildInventory } from '../logic/accessibility'
import mapCoordsRaw from '../../data/map_coords.json'

const state    = useStateStore()
const settings = useSettingsStore()

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

// Compute fitted dimensions preserving aspect ratio
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

  // keep the point under the cursor fixed
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

// reset when switching maps
watch(() => state.activeView, resetView)

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
  const inv = buildInventory(state)
  return computeAccessibility(inv, settings)
})

// ── Build pin groups (cluster same-coord locations) ───────────────────────────
const DUNGEON_MAP_NAMES = { RC: 'rc', DWS: 'dws', CoF: 'cof', FoW: 'fow', ToD: 'tod', PoW: 'pow', DHC: 'dhc' }

const mapName = computed(() => {
  if (state.activeView === 'overworld') return 'map'
  return DUNGEON_MAP_NAMES[state.activeView] || 'map'
})

// Group coords by id → array (locations can appear on multiple maps)
const coordsByIdAll = {}
for (const e of mapCoordsRaw) {
  if (!coordsByIdAll[e.id]) coordsByIdAll[e.id] = []
  coordsByIdAll[e.id].push(e)
}

const pins = computed(() => {
  if (!fittedW.value) return []

  const scaleX = fittedW.value  / naturalW.value
  const scaleY = fittedH.value  / naturalH.value

  const byCoord = {}
  for (const loc of state.visibleLocations) {
    if (loc.id == null) continue
    const coordList = coordsByIdAll[loc.id] || []
    const coords = coordList.filter(c => c.map === mapName.value)

    for (const coord of coords) {
      const key = `${coord.x}:${coord.y}`
      if (!byCoord[key]) {
        byCoord[key] = {
          x: Math.round(coord.x * scaleX),
          y: Math.round(coord.y * scaleY),
          locs: [],
        }
      }
      byCoord[key].locs.push(loc)
    }
  }

  return Object.values(byCoord).map(pin => ({
    ...pin,
    allChecked: pin.locs.every(l => state.isChecked(l.id)),
    tooltip:    pin.locs.map(l => l.name).join('\n'),
    type:       pinType(pin.locs),
    segments:   pinSegments(pin.locs),
    hintColor:  hintColorForLocs(pin.locs),
  }))
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
  if (best >= 30) return '#fce070'  // priority → gold
  if (best >= 20) return '#ff5050'  // avoid → red
  return '#ffffff'                   // unspecified / noPriority → white
}

// ── Hover pin → alimente ItemGrid ────────────────────────────────────────────
function showTooltip(e, pin) {
  state.hoveredPinLocs = pin.locs
}
function hideTooltip() {
  state.hoveredPinLocs = []
}

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

// ── Map image path ────────────────────────────────────────────────────────────
const mapSrc = computed(() => {
  const name = mapName.value === 'map' ? 'overworld' : mapName.value
  return `${import.meta.env.BASE_URL}images/maps/${name}.png`
})

</script>

<template>
  <div class="map-view">
    <div
      ref="containerEl"
      class="map-container"
      :style="{ cursor: dragging ? 'grabbing' : 'grab' }"
      @mousedown="onMousedown"
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
          <g
            v-for="pin in pins"
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
            <!-- Forme originale avec bandes horizontales (1, 2 ou 3 couleurs) -->
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

            <!-- Sections clippées à la forme -->
            <g :clip-path="`url(#pc-${pin.x}-${pin.y})`" :opacity="pin.allChecked ? 0.4 : 0.9">
              <!-- 3 couleurs : 3 secteurs égaux (120°) depuis le centre, clippés à la forme -->
              <!-- Rayons à 0°, 120°, 240° depuis le haut (R=30) : (0,-30), (+26,+15), (-26,+15) -->
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
              <!-- 2 couleurs : découpe diagonale -->
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
              <!-- 1 couleur : plein -->
              <rect
                v-else
                :x="pin.x - 20" :y="pin.y - 20"
                width="40" height="40"
                :fill="PIN_COLOR[pin.segments[0].status]"
              />
            </g>

            <!-- Contour (fill none, noir) -->
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
  overflow: hidden;
  position: relative;
  min-height: 0;
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
