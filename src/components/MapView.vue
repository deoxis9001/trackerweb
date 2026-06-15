<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({ mapId: { type: String, default: null } })

const isDev = import.meta.env.DEV
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { ITEM_IMAGES } from '../metadata/itemImages'
import ItemNotePicker from './ItemNotePicker.vue'
import fusionDataRaw from '../../SubModule/tmcrando_maptracker_deoxis/items/items/fusion.json'

const FUSION_MAP = {}
for (const item of fusionDataRaw) {
  FUSION_MAP[item.codes] = { img: item.img, fused_img: item.disabled_img }
}
import { useLocale } from '../composables/useLocale'
import { evalRules } from '../logic/visibilityRules'
import { evaluateRules, locationAccessibility } from '../logic/accessibility'
import { prepareProvider } from '../logic/itemProvider'
import { callLuaFunction } from '../logic/luaEngine'
const overworldAreaModules = {}
const dungeonCoordsDws = []
const dungeonCoordsCof = []
const dungeonCoordsRc  = []
const dungeonCoordsFow = []
const dungeonCoordsTod = []
const dungeonCoordsPow = []
const dungeonCoordsDhc = []

const state    = useStateStore()
const settings = useSettingsStore()
const { t, tLocation } = useLocale()

// ── Overworld area metadata ───────────────────────────────────────────────────
const OVERWORLD_AREAS = [
  'castle','clouds','crenel','falls','hills','hylia','lonlon',
  'minishwoods','northfield','ruins','southfield','swamp',
  'town','trilby','valley','westernwoods',
]

const AREA_LABELS = computed(() => ({
  castle: t('map_areas.castle'), clouds: t('map_areas.clouds'), crenel: t('map_areas.crenel'), falls: t('map_areas.falls'),
  hills: t('map_areas.hills'), hylia: t('map_areas.hylia'), lonlon: t('map_areas.lonlon'),
  minishwoods: t('map_areas.minishwoods'), northfield: t('map_areas.northfield'), ruins: t('map_areas.ruins'),
  southfield: t('map_areas.southfield'), swamp: t('map_areas.swamp'), town: t('map_areas.town'),
  trilby: t('map_areas.trilby'), valley: t('map_areas.valley'), westernwoods: t('map_areas.westernwoods'),
}))

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
  window.addEventListener('keydown',   onKeydown)
  window.addEventListener('click',     closePopup)
})
onUnmounted(() => {
  ro?.disconnect()
  containerEl.value?.removeEventListener('wheel', onWheel)
  window.removeEventListener('mousemove', onMousemove)
  window.removeEventListener('mouseup',   onMouseup)
  window.removeEventListener('keydown',   onKeydown)
  window.removeEventListener('click',     closePopup)
})

function levelToPinStatus(level) {
  if (level === 'normal')                        return 'accessible'
  if (level === 'sequence-break' || level === 'partial') return 'out_of_logic'
  if (level === 'cleared')                       return 'checked'
  return 'inaccessible'
}

const accessibility = computed(() => {
  // Establish Vue reactive dependencies on settings that feed into Lua has() calls
  void settings.randoDefines  // LogicSettingsTab writes here (defines → fusion, warps, crests, etc.)
  void settings.redFusionAccess; void settings.greenFusionAccess
  void settings.blueFusionAccess; void settings.goldFusionAccess
  void settings.windCrestCrenel; void settings.windCrestFalls; void settings.windCrestClouds
  void settings.windCrestCastor; void settings.windCrestSouthField; void settings.windCrestMinishWoods
  void settings.warpDWS; void settings.warpCoF; void settings.warpFoW
  void settings.warpToD; void settings.warpPoW; void settings.warpDHC
  void settings.tricks
  void settings.dungeonEntranceShuffle; void JSON.stringify(state.dungeonEntranceMap)
  // Force deep tracking of all manual/autotrack items — items gated behind false conditions
  // are never read by Lua (short-circuit and), so we must establish the dependency here.
  void JSON.stringify(state.manualItems)
  void JSON.stringify(state.autotrackItems)
  try {
    const provider = prepareProvider(state, settings)
    const map    = new Map()
    const secMap = new Map()

    for (const loc of state.allLocations) {
      const sections = (loc.sections || []).filter(s => evalRules(s.visibility_rules, settings))
      if (sections.length === 0) {
        map.set(loc.id, 'accessible')
        continue
      }
      const level = locationAccessibility(sections, (sec) => {
        const remaining = (sec.item_count ?? 1) -
          (state.checkedSections[state.sectionKey(loc.name, sec.name)] ?? 0)
        const secLevel = remaining <= 0 ? 'cleared' : evaluateRules(sec.access_rules, provider)
        secMap.set(`${loc.id}/${sec.name}`, secLevel)
        return secLevel
      })
      map.set(loc.id, levelToPinStatus(level))
    }

    return {
      get:        (id)           => map.get(id)              ?? 'inaccessible',
      getSection: (id, secName) => secMap.get(`${id}/${secName}`) ?? 'inaccessible',
    }
  } catch (e) {
    console.error('[accessibility]', e)
    return { get: () => 'accessible', getSection: () => 'accessible' }
  }
})

function secDotColor(locId, secName) {
  return secLevelColor(accessibility.value.getSection(locId, secName))
}

// ── Map name + floor selection ────────────────────────────────────────────────
const mapName = computed(() => {
  if (props.mapId !== null) return props.mapId
  if (state.activeView === 'overworld') return 'map'
  return DUNGEON_MAP_NAMES[state.activeView] || 'map'
})

const currentFloor = ref(null)

const availableFloors = computed(() => DUNGEON_FLOORS[mapName.value] ?? [])

watch([() => state.activeView, () => props.mapId], () => {
  resetView()
  const floors = DUNGEON_FLOORS[mapName.value]
  currentFloor.value = floors ? floors[0] : null
  currentArea.value = (mapName.value === 'map' && props.mapId === null) ? (state.activeZone ?? null) : null
}, { immediate: true })

watch(() => state.bizhawkFloor, (floor) => {
  if (floor && useFloors.value && availableFloors.value.includes(floor)) {
    setFloor(floor)
  }
})

watch(() => state.activeZone, (zone) => {
  if (props.mapId === null && state.activeView === 'overworld') {
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
const MAP_IMG_NAME = { mines: 'mine' }

const mapSrc = computed(() => {
  const base = import.meta.env.BASE_URL
  if (mapName.value === 'map') {
    if (currentArea.value) return `${base}images/maps/overworld/${currentArea.value}.png`
    return `${base}images/maps/overworld.png`
  }
  if (useFloors.value && currentFloor.value) return `${base}images/maps/dungeons/${mapName.value}/${currentFloor.value}.png`
  const imgName = MAP_IMG_NAME[mapName.value] ?? mapName.value
  return `${base}images/maps/${imgName}.png`
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
  const _acc = accessibility.value  // ensure provider is initialized before visibility filter

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


  // map name used in map_locations data (mines image = mine.png but data key = mines)
  const MAP_DATA_NAME = { map: 'map', mines: 'mines' }
  const dataMapKey = MAP_DATA_NAME[dname] ?? dname

  const byCoord = {}
  for (const loc of state.visibleLocations) {
    if (loc.id == null) continue
    if (loc.sections?.length > 0 && !(loc.sections).some(s => evalRules(s.visibility_rules, settings))) continue

    const mapLocs = loc.map_locations || []
    let candidates = mapLocs.filter(ml => ml.map === dataMapKey)
    if (!candidates.length) continue

    const coordList = candidates
      .filter(ml => evalRules(ml.restrict_visibility_rules, settings, n => callLuaFunction(n).count > 0))
      .filter(ml => ml.x > 0 && ml.y > 0)

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
    tooltip:    pin.locs.map(l => tLocation(l.key, l.name)).join('\n'),
    type:       pinType(pin.locs),
    segments:   pinSegments(pin.locs),
    noteImg:    noteImgSrcForLocs(pin.locs),
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

const doorPinsList    = computed(() => pins.value.filter(p => p.isDoor))
const regularPinsList = computed(() => pins.value.filter(p => !p.isDoor))

function pinSegments(locs) {
  const unchecked = locs.filter(l => !state.isChecked(l.id))
  if (unchecked.length === 0) return [{ status: 'checked' }]

  const order = ['accessible', 'out_of_logic', 'inaccessible']
  const counts = { accessible: 0, out_of_logic: 0, inaccessible: 0 }
  for (const l of unchecked) counts[accessibility.value.get(l.id) ?? 'inaccessible']++

  return order.filter(s => counts[s] > 0).map(status => ({ status }))
}

function isFusionOnly(locs) {
  return locs.every(l => (l.sections || []).length > 0 && (l.sections || []).every(s => s.hosted_item))
}

function pinType(locs) {
  if (locs.some(l => l.dungeon != null)) return 'dungeon'
  if (isFusionOnly(locs)) return 'fused'
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

const SEC_DOT_COLOR = {
  accessible:   '#7ac038',
  out_of_logic: '#d4901a',
  inaccessible: '#d82828',
  cleared:      '#4488cc',
}

function secLevelColor(rawLevel) {
  if (rawLevel === 'normal')                                             return SEC_DOT_COLOR.accessible
  if (rawLevel === 'sequence-break' || rawLevel === 'partial'
    || rawLevel === 'inspect')                                           return SEC_DOT_COLOR.out_of_logic
  if (rawLevel === 'cleared')                                            return SEC_DOT_COLOR.cleared
  return SEC_DOT_COLOR.inaccessible
}

function noteImgSrcForLocs(locs) {
  for (const loc of locs) {
    // Note de localisation (annotée manuellement ou AP)
    const key = state.locationNotes[loc.id] ?? state.apLocationItems[loc.id]
    if (key) {
      const img = ITEM_IMAGES[key]
      if (img) {
        const file = Array.isArray(img) ? img[0] : img
        return `${import.meta.env.BASE_URL}images/items/${file}`
      }
    }
    // Item sélectionné via picker sur une section capture
    for (const sec of (loc.sections || [])) {
      if (!sec.capture_item) continue
      const secNote = state.locationNotes[state.sectionKey(loc.name, sec.name)]
      if (!secNote) continue
      const img = ITEM_IMAGES[secNote]
      if (!img) continue
      const file = Array.isArray(img) ? img[0] : img
      return `${import.meta.env.BASE_URL}images/items/${file}`
    }
  }
  return null
}


// ── Hover pin ─────────────────────────────────────────────────────────────────
function showTooltip(e, pin) { state.hoveredPinLocs = pin.locs }
function hideTooltip()       { state.hoveredPinLocs = [] }


// ── Pin popup ─────────────────────────────────────────────────────────────────
const clickedPin = ref(null)
const popupPos   = ref({ x: 0, y: 0 })

const popupStyle = computed(() => {
  const gap  = 14
  const maxH = 400
  const clickY = popupPos.value.y
  let x = popupPos.value.x + gap
  if (x + 210 > window.innerWidth) x = popupPos.value.x - 210 - gap

  const roomBelow = window.innerHeight - clickY - 4
  if (roomBelow < maxH) {
    // not enough room below → open upward from click point
    return {
      left:      x + 'px',
      top:       'auto',
      bottom:    (window.innerHeight - clickY) + 'px',
      maxHeight: Math.min(clickY - 4, maxH) + 'px',
    }
  }
  return {
    left:      x + 'px',
    top:       Math.max(4, clickY) + 'px',
    bottom:    'auto',
    maxHeight: maxH + 'px',
  }
})

function openPinPopup(e, pin) {
  e.stopPropagation()
  if (clickedPin.value === pin) { clickedPin.value = null; return }
  clickedPin.value = pin
  popupPos.value = { x: e.clientX, y: e.clientY }
  state.hoveredPinLocs = pin.locs
}

function closePopup() {
  clickedPin.value = null
  notePickerPin.value = null
  state.hoveredPinLocs = []
}

function onKeydown(e) { if (e.key === 'Escape') closePopup() }

// Group locations with suffix pattern "Name Item1", "Name Item2" → one row
function locBaseName(name) {
  return name.replace(/\s+(?:Item\s*)?\d+$/, '').trim()
}

const popupGroups = computed(() => {
  if (!clickedPin.value) return []
  const groups = new Map()
  for (const loc of clickedPin.value.locs) {
    const base = locBaseName(loc.name)
    if (!groups.has(base)) groups.set(base, [])
    groups.get(base).push(loc)
  }
  return [...groups.values()].map(locs => {
    const checked  = locs.filter(l => state.isChecked(l.id)).length
    const unchecked = locs.filter(l => !state.isChecked(l.id))
    const status   = unchecked.length === 0 ? 'checked'
      : unchecked.some(l => (accessibility.value.get(l.id) ?? 'inaccessible') === 'accessible')   ? 'accessible'
      : unchecked.some(l => (accessibility.value.get(l.id) ?? 'inaccessible') === 'out_of_logic') ? 'out_of_logic'
      : 'inaccessible'
    const name = locs.length > 1
      ? locBaseName(tLocation(locs[0].key, locs[0].name))
      : tLocation(locs[0].key, locs[0].name)
    return { name, locs, checked, total: locs.length, status }
  })
})

function toggleGroup(group) {
  const allChecked = group.checked === group.total
  for (const loc of group.locs) {
    const c = state.isChecked(loc.id)
    if (allChecked && c) state.toggleLocation(loc.id)
    else if (!allChecked && !c) state.toggleLocation(loc.id)
  }
}

// ── Popup sub-area grouping (dungeons) ────────────────────────────────────────
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

function groupStatus(locs) {
  const unchecked = locs.filter(l => !state.isChecked(l.id))
  if (!unchecked.length) return 'checked'
  if (unchecked.some(l => (accessibility.value.get(l.id) ?? 'inaccessible') === 'accessible'))    return 'accessible'
  if (unchecked.some(l => (accessibility.value.get(l.id) ?? 'inaccessible') === 'out_of_logic')) return 'out_of_logic'
  return 'inaccessible'
}

const popupSubAreas = computed(() => {
  if (!clickedPin.value) return null
  const locs = clickedPin.value.locs
  if (!locs.some(l => l.dungeon != null)) return null

  // Common dungeon name prefix across all loc names
  const names = locs.map(l => l.name)
  let prefix = names[0] ?? ''
  for (const name of names.slice(1)) {
    while (prefix && !name.startsWith(prefix)) {
      const sp = prefix.lastIndexOf(' ')
      prefix = sp >= 0 ? prefix.slice(0, sp) : ''
    }
  }
  const regionName = prefix.trim()

  const grouped = new Map()
  const flat = []
  for (const loc of locs) {
    const { subArea } = parseSubArea(loc.name, regionName)
    if (subArea != null) {
      if (!grouped.has(subArea)) grouped.set(subArea, [])
      grouped.get(subArea).push(loc)
    } else {
      flat.push(loc)
    }
  }
  if (grouped.size === 0) return null
  return {
    regionName,
    groups: [...grouped.entries()].map(([name, ls]) => ({
      name, locs: ls,
      checked: ls.filter(l => state.isChecked(l.id)).length,
      total: ls.length,
      status: groupStatus(ls),
    })),
    flat,
  }
})

function shortPopupName(locName, regionName) {
  return parseSubArea(locName, regionName).shortName
}

const collapsedPopupSubs = ref(new Set())
function togglePopupSub(key) {
  if (collapsedPopupSubs.value.has(key)) collapsedPopupSubs.value.delete(key)
  else collapsedPopupSubs.value.add(key)
}

function uncheckPin(pin) {
  for (const loc of pin.locs) {
    if (state.isChecked(loc.id)) state.toggleLocation(loc.id)
  }
}
function onContextmenuPin(e, pin) {
  e.preventDefault()
  if (clickedPin.value) { closePopup(); return }
  uncheckPin(pin)
}

// ── Note picker ───────────────────────────────────────────────────────────────
const notePickerPin = ref(null)
const notePickerPos = ref({ x: 0, y: 0 })

const notePickerStyle = computed(() => {
  const gap = 14
  let x = notePickerPos.value.x + gap
  let y = notePickerPos.value.y
  if (x + 270 > window.innerWidth)  x = notePickerPos.value.x - 270 - gap
  if (y + 320 > window.innerHeight) y = window.innerHeight - 320
  return { left: x + 'px', top: Math.max(4, y) + 'px' }
})

function openNotePicker(e, pin) {
  e.stopPropagation()
  notePickerPin.value = pin
  notePickerPos.value = { x: e.clientX, y: e.clientY }
}

function onNoteSelect(key) {
  if (!notePickerPin.value) return
  for (const loc of notePickerPin.value.locs) state.setLocationNote(loc.id, key)
  if (notePickerPin.value._captureContext) {
    const { loc, sec } = notePickerPin.value._captureContext
    state.setSectionCleared(loc.name, sec.name, 1)
  }
  notePickerPin.value = null
}

function onNoteClear() {
  if (!notePickerPin.value) return
  for (const loc of notePickerPin.value.locs) state.clearLocationNote(loc.id)
  if (notePickerPin.value._captureContext) {
    const { loc, sec } = notePickerPin.value._captureContext
    state.setSectionCleared(loc.name, sec.name, 0)
  }
  notePickerPin.value = null
}

function toggleGroupPin(group) {
  const anyPinned = group.locs.some(l => state.isPinned(l.name))
  for (const loc of group.locs) {
    if (anyPinned) state.unpinLocation(loc.name)
    else           state.pinLocation(loc.name)
  }
}

// ── Section-based popup (new overworld mode) ──────────────────────────────────

const BASE_URL = import.meta.env.BASE_URL

function secRemaining(loc, sec) {
  const cleared = state.checkedSections[state.sectionKey(loc.name, sec.name)] ?? 0
  return (sec.item_count ?? 1) - cleared
}

function secImg(loc, sec) {
  const img = secRemaining(loc, sec) <= 0 ? sec.chest_opened_img : sec.chest_unopened_img
  return img ? `${BASE_URL}${img}` : null
}

function secFusionImg(loc, sec) {
  const entry = FUSION_MAP[sec.hosted_item]
  if (!entry) return null
  // à faire → kinstone colorée (illuminée) ; fait → kinstone grise (éteinte)
  return `${BASE_URL}${secRemaining(loc, sec) <= 0 ? entry.img : entry.fused_img}`
}

function captureNoteImg(loc, sec) {
  const key = state.locationNotes[state.sectionKey(loc.name, sec.name)]
  if (!key) return null
  const img = ITEM_IMAGES[key]
  if (!img) return null
  const file = Array.isArray(img) ? img[0] : img
  return `${BASE_URL}images/items/${file}`
}

function isLocCleared(loc) {
  return (loc.sections || []).every(sec => secRemaining(loc, sec) <= 0)
}

function collectOneSec(loc, sec) { state.stepSection(loc.name, sec.name,  1, sec.item_count ?? 1) }
function returnOneSec(loc, sec)  { state.stepSection(loc.name, sec.name, -1, sec.item_count ?? 1) }
function toggleCaptureSec(loc, sec) { state.toggleSection(loc.name, sec.name, 1) }

function openCapturePicker(e, loc, sec) {
  e.stopPropagation()
  notePickerPin.value = {
    locs: [{ id: state.sectionKey(loc.name, sec.name), name: sec.name }],
    _captureContext: { loc, sec },
  }
  notePickerPos.value = { x: e.clientX, y: e.clientY }
}

function clearCaptureSec(e, loc, sec) {
  e.preventDefault()
  state.clearLocationNote(state.sectionKey(loc.name, sec.name))
  state.setSectionCleared(loc.name, sec.name, 0)
}

function toggleLocPin(loc) {
  if (state.isPinned(loc.name)) state.unpinLocation(loc.name)
  else                          state.pinLocation(loc.name)
}

</script>

<template>
  <div class="map-view">

    <!-- Floor selector (dungeons only, when mode = étage) -->
    <div v-if="useFloors && availableFloors.length > 1" class="floor-selector">
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
          <defs></defs>
          <!-- Door pins (entrance shuffle, unassigned) -->
          <g
            v-for="pin in doorPinsList"
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
            v-for="pin in regularPinsList"
            :key="`${pin.x}:${pin.y}`"
            class="pin-group"
            @click="openPinPopup($event, pin)"
            @contextmenu="onContextmenuPin($event, pin)"
            @mouseenter="showTooltip($event, pin)"
            @mouseleave="hideTooltip"
          >
            <defs>
              <clipPath :id="`pc-${pin.x}-${pin.y}`">
                <rect
                  v-if="mapName !== 'map' || pin.type === 'location'"
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
              v-if="mapName !== 'map' || pin.type === 'location'"
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

            <!-- Item note badge (bottom-left of pin) -->
            <image
              v-if="pin.noteImg"
              :href="pin.noteImg"
              :x="pin.x - 17"
              :y="pin.y + 3"
              width="12"
              height="12"
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

    <!-- Pin popup -->
    <Teleport to="body">
      <div v-if="clickedPin" class="pin-popup" :style="popupStyle" @click.stop @contextmenu.prevent>

        <!-- Mode donjon : sous-groupage par étage -->
        <template v-if="popupSubAreas">

          <!-- Locations sans code de floor (Boss, Prize…) -->
          <div
            v-for="loc in popupSubAreas.flat"
            :key="loc.id"
            :class="['popup-row', { 'popup-row--checked': state.isChecked(loc.id) }]"
            @click="state.toggleLocation(loc.id)"
          >
            <span class="popup-dot" :style="{ background: PIN_COLOR[state.isChecked(loc.id) ? 'checked' : (accessibility.value.get(loc.id) ?? 'inaccessible')] }"></span>
            <span class="popup-name">{{ tLocation(loc.key, shortPopupName(loc.name, popupSubAreas.regionName)) }}</span>
            <span v-if="state.isChecked(loc.id)" class="popup-check">✓</span>
            <button :class="['popup-note-btn', { 'has-note': noteImgSrcForLocs([loc]) }]"
              @click.stop="openNotePicker($event, { locs: [loc] })" title="Annoter un item">
              <img v-if="noteImgSrcForLocs([loc])" :src="noteImgSrcForLocs([loc])" class="popup-note-img" />
            </button>
          </div>

          <!-- Sous-zones par étage -->
          <div v-for="sg in popupSubAreas.groups" :key="sg.name">
            <div class="popup-subarea-header" @click="togglePopupSub(sg.name)">
              <span class="popup-subarea-toggle">{{ collapsedPopupSubs.has(sg.name) ? '▶' : '▼' }}</span>
              <span class="popup-subarea-name">{{ sg.name }}</span>
              <span class="popup-count">{{ sg.checked }}/{{ sg.total }}</span>
              <button :class="['popup-note-btn', { 'has-note': noteImgSrcForLocs(sg.locs) }]"
                @click.stop="openNotePicker($event, { locs: sg.locs })" title="Annoter un item">
                <img v-if="noteImgSrcForLocs(sg.locs)" :src="noteImgSrcForLocs(sg.locs)" class="popup-note-img" />
              </button>
            </div>
            <template v-if="!collapsedPopupSubs.has(sg.name)">
              <div
                v-for="loc in sg.locs"
                :key="loc.id"
                :class="['popup-row', 'popup-row--sub', { 'popup-row--checked': state.isChecked(loc.id) }]"
                @click="state.toggleLocation(loc.id)"
              >
                <span class="popup-dot" :style="{ background: PIN_COLOR[state.isChecked(loc.id) ? 'checked' : (accessibility.value.get(loc.id) ?? 'inaccessible')] }"></span>
                <span class="popup-name">{{ tLocation(loc.key, shortPopupName(loc.name, popupSubAreas.regionName)) }}</span>
                <span v-if="state.isChecked(loc.id)" class="popup-check">✓</span>
                <button :class="['popup-note-btn', { 'has-note': noteImgSrcForLocs([loc]) }]"
                  @click.stop="openNotePicker($event, { locs: [loc] })" title="Annoter un item">
                  <img v-if="noteImgSrcForLocs([loc])" :src="noteImgSrcForLocs([loc])" class="popup-note-img" />
                </button>
              </div>
            </template>
          </div>

        </template>

        <!-- Mode normal (overworld) : affichage par section -->
        <template v-else>
          <div
            v-for="loc in clickedPin.locs.filter(l => (l.sections || []).some(s => evalRules(s.visibility_rules, settings)))"
            :key="loc.id"
            :class="['popup-loc-block', { 'loc-cleared': isLocCleared(loc) }]"
          >

            <!-- Titre location -->
            <div class="popup-loc-header">
              <span class="popup-loc-name">{{ tLocation(loc.key, loc.name) }}</span>
              <button
                :class="['popup-pin-btn', { 'is-pinned': state.isPinned(loc.name) }]"
                @click.stop="toggleLocPin(loc)"
                title="Épingler"
              >📌</button>
            </div>

            <!-- Sections -->
            <div
              v-for="sec in (loc.sections || []).filter(s => evalRules(s.visibility_rules, settings))"
              :key="sec.name"
              class="popup-sec-row"
            >
              <div class="sec-controls">

                <!-- Fusion (hosted_item) : kinstone toggle -->
                <div
                  v-if="sec.hosted_item"
                  :class="['sec-chest-btn', { 'sec-fusion-done': secRemaining(loc, sec) <= 0 }]"
                  @click.stop="toggleCaptureSec(loc, sec)"
                >
                  <img v-if="secFusionImg(loc, sec)" :src="secFusionImg(loc, sec)" class="sec-chest-img" />
                </div>

                <!-- Capture item : picker box + image fixe -->
                <template v-else-if="sec.capture_item">
                  <div
                    :class="['capture-picker-box', { done: captureNoteImg(loc, sec) }]"
                    @click.stop="openCapturePicker($event, loc, sec)"
                  >
                    <img v-if="captureNoteImg(loc, sec)" :src="captureNoteImg(loc, sec)" class="capture-picked-img" />
                  </div>
                  <div v-if="sec.chest_unopened_img" class="sec-chest-btn sec-item-icon">
                    <img :src="`${BASE_URL}${sec.chest_unopened_img}`" class="sec-chest-img" />
                  </div>
                </template>

                <!-- Coffre standard -->
                <div
                  v-else
                  class="sec-chest-btn"
                  @click.stop="collectOneSec(loc, sec)"
                  @contextmenu.prevent="returnOneSec(loc, sec)"
                >
                  <img v-if="secImg(loc, sec)" :src="secImg(loc, sec)" class="sec-chest-img" />
                  <span
                    v-if="(sec.item_count ?? 1) > 1 && secRemaining(loc, sec) > 0"
                    class="sec-chest-count"
                  >{{ secRemaining(loc, sec) }}</span>
                </div>

              </div>
              <span class="sec-label">{{ sec.name }}</span>
              <span class="sec-dot" :style="{ background: secDotColor(loc.id, sec.name) }"></span>
            </div>

          </div>
        </template>

      </div>
    </Teleport>

    <!-- Item note picker -->
    <Teleport to="body">
      <ItemNotePicker
        v-if="notePickerPin"
        :locs="notePickerPin.locs"
        :popup-style="notePickerStyle"
        @select="onNoteSelect"
        @clear="onNoteClear"
        @close="notePickerPin = null"
      />
    </Teleport>

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

/* ── Pin popup ─────────────────────────────────────────────────────────────── */
:global(.pin-popup) {
  position: fixed;
  z-index: 9999;
  min-width: 180px;
  max-width: 260px;
  max-height: calc(100vh - 16px);
  overflow-y: auto;
  background: #1e1006;
  border: 1px solid var(--accent, #d4882a);
  border-radius: 5px;
  padding: 4px 0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.7);
  pointer-events: all;
}

:global(.popup-row) {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text, #d4a84b);
  transition: background 0.1s;
}
:global(.popup-row:hover) {
  background: rgba(212,136,42,0.15);
}
:global(.popup-row--checked) {
  opacity: 0.45;
}
:global(.popup-row--sub) {
  padding-left: 20px;
}

:global(.popup-subarea-header) {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  background: rgba(0,0,0,0.25);
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  color: var(--text, #d4a84b);
  user-select: none;
}
:global(.popup-subarea-header:hover) {
  background: rgba(212,136,42,0.1);
}
:global(.popup-subarea-toggle) {
  font-size: 9px;
  width: 10px;
  flex-shrink: 0;
  color: var(--text-muted);
}
:global(.popup-subarea-name) {
  flex: 1;
}

:global(.popup-dot) {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  flex-shrink: 0;
}

:global(.popup-name) {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.popup-check) {
  color: #7ac038;
  font-size: 11px;
  font-weight: bold;
  flex-shrink: 0;
}

:global(.popup-count) {
  font-size: 11px;
  font-weight: 700;
  color: #c8983a;
  background: rgba(212,136,42,0.15);
  border: 1px solid rgba(212,136,42,0.35);
  border-radius: 3px;
  padding: 0 5px;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

:global(.popup-note-btn) {
  width: 18px;
  height: 18px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1px;
  flex-shrink: 0;
  margin-left: 2px;
}
:global(.popup-note-btn:hover) {
  background: rgba(212,136,42,0.2);
  border-color: var(--accent, #d4882a);
}
:global(.popup-note-btn.has-note) {
  border-color: rgba(212,168,75,0.5);
  background: rgba(212,168,75,0.1);
}
:global(.popup-note-img) {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

:global(.popup-pin-btn) {
  width: 18px;
  height: 18px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  margin-left: 2px;
  font-size: 11px;
  line-height: 1;
  filter: grayscale(1) opacity(0.5);
}
:global(.popup-pin-btn:hover) {
  filter: none;
  background: rgba(212,136,42,0.2);
  border-color: var(--accent, #d4882a);
}
:global(.popup-pin-btn.is-pinned) {
  filter: none;
  background: rgba(212,168,75,0.15);
  border-color: rgba(212,168,75,0.6);
}

/* ── Section-based popup ────────────────────────────────────────────────────── */

:global(.popup-loc-block + .popup-loc-block) {
  border-top: 1px solid var(--border, #5a3a10);
}

:global(.popup-loc-header) {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px 4px;
}

:global(.popup-loc-name) {
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  color: var(--text, #d4a84b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(.popup-sec-row) {
  display: flex;
  align-items: center;
  padding: 4px 10px 4px 8px;
  gap: 8px;
  border-top: 1px solid rgba(90,58,16,0.4);
}

:global(.sec-label) {
  flex: 1;
  min-width: 0;
}

:global(.sec-dot) {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

:global(.sec-controls) {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

:global(.capture-chk) {
  width: 18px;
  height: 18px;
  border: 1px dashed rgba(212,168,75,0.5);
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
:global(.capture-chk.done) {
  border-color: #7ac038;
  background: rgba(122,192,56,0.15);
}
:global(.capture-chk.done::after) {
  content: '✓';
  font-size: 11px;
  color: #7ac038;
}

:global(.capture-picker-box) {
  width: 28px;
  height: 28px;
  border: 1px dashed rgba(212,168,75,0.45);
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}
:global(.capture-picker-box:hover) {
  border-color: var(--accent, #d4882a);
  background: rgba(212,136,42,0.1);
}
:global(.capture-picker-box.done) {
  border-color: #7ac038;
  border-style: solid;
  background: rgba(122,192,56,0.08);
}
:global(.capture-picked-img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

:global(.sec-chest-btn) {
  position: relative;
  width: 28px;
  height: 28px;
  cursor: pointer;
  flex-shrink: 0;
}
:global(.sec-chest-btn:hover) { opacity: 0.75; }

:global(.sec-chest-img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

:global(.sec-chest-count) {
  position: absolute;
  bottom: 1px;
  right: 1px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 3px #000, 0 0 3px #000;
  line-height: 1;
  pointer-events: none;
}

:global(.sec-label) {
  font-size: 11px;
  color: var(--text-muted, #9a7a3b);
  white-space: nowrap;
  flex: 1;
  text-align: right;
}

:global(.popup-loc-block.loc-cleared) {
  opacity: 0.38;
}

:global(.sec-chest-btn.sec-fusion-done) {
  opacity: 0.35;
}

:global(.sec-item-icon) {
  cursor: default;
  pointer-events: none;
}

:global(.sec-capture-btn) {
  border: 1px dashed rgba(212,168,75,0.4);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}
:global(.sec-capture-btn:hover) {
  border-color: var(--accent, #d4882a);
}
:global(.sec-capture-btn.sec-capture-done) {
  border-color: #7ac038;
  border-style: solid;
}

:global(.capture-empty-mark) {
  font-size: 14px;
  color: rgba(212,168,75,0.4);
  line-height: 1;
  pointer-events: none;
}
</style>
