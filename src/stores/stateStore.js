import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

import itemsData     from '../../data/items.json'
import locationsData from '../../data/locations.json'
import regionsData   from '../../data/regions.json'
import apTables      from '../../data/ap_tables.json'
import { useSettingsStore } from './settingsStore'

export const useStateStore = defineStore('state', () => {
  const settings = useSettingsStore()

  // Raw data
  const allItems     = itemsData
  const allLocations = locationsData
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
  const activePanel     = ref('map')        // 'map' | 'checklist'
  const hoveredPinLocs  = ref([])           // locations du pin survolé sur la map
  const showSettings      = ref(false)
  const showRegionPopup   = ref(false)

  // AP hints: locationId → hint status (0=unspecified,10=noPriority,20=avoid,30=priority,40=found)
  const locationHints   = ref({})

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
        checkedLocations: [...checkedLocations.value],
        receivedItems:    receivedItems.value,
        manualItems:      manualItems.value,
        activeView:       activeView.value,
        apServer:         apServer.value,
        apPort:           apPort.value,
        apSlot:           apSlot.value,
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
      if (s.apServer)         apServer.value         = s.apServer
      if (s.apPort  != null)  apPort.value           = s.apPort
      if (s.apSlot)           apSlot.value           = s.apSlot
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
    }
    saveState()
  }

  function isChecked(locationId) {
    return checkedLocations.value.has(Number(locationId))
  }

  function markLocationsChecked(ids) {
    for (const id of ids) checkedLocations.value.add(Number(id))
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
    saveState()
  }

  function setActiveView(view) {
    activeView.value = view
    saveState()
  }

  function setActivePanel(panel) {
    activePanel.value = panel
  }

  function setLocationHints(map) {
    locationHints.value = map
  }

  function updateLocationHint(locId, status) {
    locationHints.value = { ...locationHints.value, [locId]: status }
  }

  function setAutotrackItems(items) {
    autotrackItems.value = items
  }

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
    activeView,
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
    locationHints,
    setLocationHints,
    showChat,
    chatMessages,
    addChatMessage,
    clearChat,
    updateLocationHint,
    setAutotrackItems,
    saveState,
    loadState,
  }
})
