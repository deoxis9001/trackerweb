import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

import itemsAP       from '../../data/items.json'
import locationsAP   from '../../data/locations.json'
import locationMeta  from '../../data/location_meta.json'
import namesData     from '../../data/names.json'
import regionsData   from '../../data/regions.json'
import apTables      from '../../data/ap_tables.json'
import { useSettingsStore } from './settingsStore'

// Build enriched items list: merge AP table with names
const _itemKeyById = Object.fromEntries(itemsAP.map(i => [i.item_id, i.key]))
const allItemsBuilt = itemsAP.map(i => ({
  ...i,
  name: namesData.items[i.key] ?? i.key,
}))

// locations.json = [{id, key}] — just the AP table
// location_meta.json = [{id, key, name, region_key, region_name, dungeon, pools, ...}] — full metadata
// allLocations = location_meta (already has all fields including name)
const allLocationsBuilt = locationMeta

export const useStateStore = defineStore('state', () => {
  const settings = useSettingsStore()

  // Raw data (enriched)
  const allItems     = allItemsBuilt
  const allLocations = allLocationsBuilt
  const allRegions   = regionsData

  // First fusion ID per pool (for 'combined' mode — only the lowest ID is shown)
  const firstFusionIdByPool = {}
  for (const loc of allLocations) {
    if (loc.region_key !== 'FUSIONS') continue
    for (const pool of (loc.pools || [])) {
      if (firstFusionIdByPool[pool] == null || loc.id < firstFusionIdByPool[pool])
        firstFusionIdByPool[pool] = loc.id
    }
  }

  // AP connection state
  const apConnected      = ref(false)
  const apVersion        = ref('')        // slotData.version from AP login
  // Bizhawk NWA autotracking
  const bizhawkConnected = ref(false)
  const autotrackItems   = ref({})  // { itemKey: count } — set by bizhawk.js
  const apServer       = ref('archipelago.gg')
  const apPort         = ref(38281)
  const apSlot         = ref('')
  const apPassword     = ref('')

  // Tracker state: which locations have been checked
  const checkedLocations = ref(new Set())

  // Items received from AP server
  const receivedItems = ref([])  // array of item names

  // Manually toggled items (for offline use)
  const manualItems = ref({})  // { itemKey: count }

  // Active map/view
  const activeView      = ref('overworld')  // 'overworld' | dungeon key
  const activeZone      = ref(null)         // overworld sub-area, null = full map
  const activePanel     = ref('map')        // 'map' | 'checklist'
  const hoveredPinLocs  = ref([])           // locations du pin survolé sur la map
  const showSettings      = ref(false)
  const showRegionPopup   = ref(false)

  // Entrance shuffle: entrance slot → dungeon key (e.g. { 'DWS': 'RC' } = DWS entrance leads to RC)
  const dungeonEntranceMap = ref({})  // keys: dungeon slots, values: dungeon keys
  function setDungeonEntrance(slot, dungeon) {
    dungeonEntranceMap.value = { ...dungeonEntranceMap.value, [slot]: dungeon }
  }
  function clearDungeonEntrance(slot) {
    const next = { ...dungeonEntranceMap.value }
    delete next[slot]
    dungeonEntranceMap.value = next
  }
  function resetDungeonEntrances() {
    dungeonEntranceMap.value = {}
  }

  // Manual item notes: locationId → itemKey (persisted)
  const locationNotes = ref({})

  // AP hint-derived notes: locationId → itemKey (not persisted, cleared on disconnect)
  const apLocationItems = ref({})

  // Raw slot_data from AP login (for dev panel)
  const rawSlotData = ref({})

  // AP players: slot → name
  const apPlayers = ref({})


  function toggleSettings()     { showSettings.value    = !showSettings.value }
  function toggleRegionPopup()  { showRegionPopup.value = !showRegionPopup.value }

  // ---------------------------------------------------------------------------
  // Computed
  // ---------------------------------------------------------------------------

  const locationById = computed(() => {
    const map = {}
    for (const loc of allLocations) {
      if (loc.id != null) map[loc.id] = loc
    }
    return map
  })

  const locationsByRegion = computed(() => {
    const map = {}
    for (const loc of allLocations) {
      if (!map[loc.region_key]) map[loc.region_key] = []
      map[loc.region_key].push(loc)
    }
    return map
  })

  const overworldRegions = computed(() =>
    allRegions.filter(r => !r.is_dungeon_region && r.key !== 'MENU')
  )

  const dungeonRegions = computed(() => {
    const seen = new Set()
    const result = []
    for (const r of allRegions) {
      if (r.dungeon && !seen.has(r.dungeon)) {
        seen.add(r.dungeon)
        result.push(r.dungeon)
      }
    }
    return result
  })

  function isLocationVisible(loc) {
    const pools = loc.pools || []
    if (pools.includes('rupee')      && !settings.rupeesanity)           return false
    if (pools.includes('pot')        && !settings.shufflePots)           return false
    if (pools.includes('dig')        && !settings.shuffleDigging)        return false
    if (pools.includes('water')      && !settings.shuffleUnderwater)     return false
    if (pools.includes('enemy')      && !settings.shuffleGoldEnemies)    return false
    const fuseAccessMap = {
      fuse_gold:  settings.goldFusionAccess,
      fuse_red:   settings.redFusionAccess,
      fuse_blue:  settings.blueFusionAccess,
      fuse_green: settings.greenFusionAccess,
    }
    for (const [pool, access] of Object.entries(fuseAccessMap)) {
      if (!pools.includes(pool)) continue
      if (access === 'closed' || access === 'open') return false
      if (access === 'combined' && loc.id !== firstFusionIdByPool[pool]) return false
    }
    if (pools.includes('ped')        && settings.pedReward          === 'none')   return false

    if (loc.name.startsWith('Town Cuccos Lv ')) {
      const level = parseInt(loc.name.replace('Town Cuccos Lv ', ''))
      return level >= 11 - (settings.cuccoRounds ?? 0)
    }
    const goronMatch = loc.name.match(/^Town Goron Merchant (\d+)/)
    if (goronMatch) return parseInt(goronMatch[1]) <= (settings.goronSets ?? 0)

    if (loc.region_key === 'SANCTUARY')        return !!settings.shuffleSanctuary
    if (loc.name === 'Falls Biggoron Item')    return settings.biggoron !== 'disabled'
    if (loc.name === 'Town Shop 600 Item 2')   return !!settings.extraShopItem

    return true
  }

  const visibleLocations = computed(() => allLocations.filter(isLocationVisible))
  const checkedCount = computed(() =>
    visibleLocations.value.filter(l => l.id != null && checkedLocations.value.has(l.id)).length
  )
  const totalCount = computed(() => visibleLocations.value.filter(l => l.id != null).length)

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  function saveState() {
    try {
      localStorage.setItem('tmc_state', JSON.stringify({
        checkedLocations:  [...checkedLocations.value],
        receivedItems:     receivedItems.value,
        manualItems:       manualItems.value,
        locationNotes:     locationNotes.value,
        activeView:        activeView.value,
        apServer:          apServer.value,
        apPort:            apPort.value,
        apSlot:            apSlot.value,
        dungeonEntranceMap: dungeonEntranceMap.value,
      }))
    } catch {}
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('tmc_state')
      if (!raw) return
      const s = JSON.parse(raw)
      if (s.checkedLocations) checkedLocations.value = new Set(s.checkedLocations)
      if (s.receivedItems)    receivedItems.value    = s.receivedItems
      if (s.manualItems)      manualItems.value      = s.manualItems
      if (s.activeView)       activeView.value       = s.activeView
      if (s.apServer)          apServer.value          = s.apServer
      if (s.apPort  != null)   apPort.value            = s.apPort
      if (s.apSlot)            apSlot.value            = s.apSlot
      if (s.dungeonEntranceMap) dungeonEntranceMap.value = s.dungeonEntranceMap
      if (s.locationNotes)     locationNotes.value     = s.locationNotes
    } catch {}
  }

  // manualItems is mutated in place by the UI — watch it for auto-save
  watch(manualItems, saveState, { deep: true })

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  function toggleLocation(locationId) {
    const id = Number(locationId)
    if (checkedLocations.value.has(id)) {
      checkedLocations.value.delete(id)
    } else {
      checkedLocations.value.add(id)
      if (locationNotes.value[id] != null) {
        const next = { ...locationNotes.value }
        delete next[id]
        locationNotes.value = next
      }
    }
    saveState()
  }

  function isChecked(locationId) {
    return checkedLocations.value.has(Number(locationId))
  }

  function markLocationsChecked(ids) {
    const notesToClear = []
    for (const id of ids) {
      const n = Number(id)
      checkedLocations.value.add(n)
      if (locationNotes.value[n] != null) notesToClear.push(n)
    }
    if (notesToClear.length) {
      const next = { ...locationNotes.value }
      for (const n of notesToClear) delete next[n]
      locationNotes.value = next
    }
    saveState()
  }

  function receiveItem(apItemId) {
    const name = apTables.items[String(apItemId)]
    if (name) {
      receivedItems.value.push(name)
      saveState()
    }
  }

  function resetTracker() {
    checkedLocations.value = new Set()
    receivedItems.value = []
    manualItems.value = {}
    locationNotes.value = {}
    dungeonEntranceMap.value = {}
    saveState()
  }

  function setActiveView(view) {
    activeView.value = view
    saveState()
  }

  function setActiveZone(zone) {
    activeZone.value = zone
  }

  function setActivePanel(panel) {
    activePanel.value = panel
  }

  function setAutotrackItems(items) {
    autotrackItems.value = items
  }

  function setApLocationItems(map) {
    apLocationItems.value = map ?? {}
  }

  function setLocationNote(id, itemKey) {
    locationNotes.value = { ...locationNotes.value, [Number(id)]: itemKey }
    saveState()
  }
  function clearLocationNote(id) {
    const next = { ...locationNotes.value }
    delete next[Number(id)]
    locationNotes.value = next
    saveState()
  }

  function setRawSlotData(data) {
    rawSlotData.value = data ?? {}
  }

  function setApPlayers(map) {
    apPlayers.value = map
  }

  const showDevPanel = ref(false)

  const showChat     = ref(false)
  const chatMessages = ref([])  // { text, nodes }[]

  function addChatMessage(msg) {
    chatMessages.value.push(msg)
    if (chatMessages.value.length > 300) chatMessages.value.shift()
  }

  function clearChat() {
    chatMessages.value = []
  }

  return {
    allItems,
    allLocations,
    visibleLocations,
    allRegions,
    apConnected,
    apVersion,
    bizhawkConnected,
    autotrackItems,
    apServer,
    apPort,
    apSlot,
    apPassword,
    checkedLocations,
    receivedItems,
    manualItems,
    activeView, activeZone, setActiveZone,
    dungeonEntranceMap, setDungeonEntrance, clearDungeonEntrance, resetDungeonEntrances,
    activePanel,
    hoveredPinLocs,
    locationById,
    locationsByRegion,
    overworldRegions,
    dungeonRegions,
    checkedCount,
    totalCount,
    toggleLocation,
    isChecked,
    markLocationsChecked,
    receiveItem,
    resetTracker,
    setActiveView,
    setActivePanel,
    showSettings,
    toggleSettings,
    showRegionPopup,
    toggleRegionPopup,
    locationNotes,
    setLocationNote,
    clearLocationNote,
    apLocationItems,
    setApLocationItems,
    showChat,
    chatMessages,
    addChatMessage,
    clearChat,
    setAutotrackItems,
    rawSlotData,
    setRawSlotData,
    apPlayers,
    setApPlayers,
    showDevPanel,
    saveState,
    loadState,
  }
})
