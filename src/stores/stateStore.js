import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { allLocations as rawLocations } from '../data/locations.js'

export const useStateStore = defineStore('state', () => {
  // EMO-format locations from deoxis submodule [{name, map_locations, sections}]
  const allLocations = rawLocations
  const allItems     = []
  const allRegions   = []

  // Bizhawk autotracking
  const bizhawkConnected = ref(false)
  const bizhawkFloor     = ref(null)
  const autotrackItems   = ref({})

  // Checked sections: "Location Name/Section Name" → cleared chest count
  const checkedSections = ref({})

  // Legacy numeric id tracking (used by bizhawk.js)
  const checkedLocations = ref(new Set())

  // Manually toggled items { code: count }
  const manualItems = ref({})

  // Received items (AP compat stub)
  const receivedItems = ref([])

  // Active view/panel
  const activeView     = ref('overworld')
  const activeZone     = ref(null)
  const activePanel    = ref('map')
  const hoveredPinLocs = ref([])

  // UI toggles
  const showSettings    = ref(false)
  const showRegionPopup = ref(false)
  const showApPanel     = ref(false)
  const showFaq         = ref(false)

  // AP compat stubs (keep refs so AP components don't crash)
  const apConnected = ref(false)
  const apVersion   = ref('')
  const apServer    = ref('archipelago.gg')
  const apPort      = ref(38281)
  const apSlot      = ref('')
  const apPassword  = ref('')
  const apPlayers   = ref({})
  const rawSlotData = ref({})
  const apLocationItems = ref({})

  // Entrance shuffle: slot → dungeon key
  const dungeonEntranceMap = ref({})
  function setDungeonEntrance(slot, dungeon) {
    dungeonEntranceMap.value = { ...dungeonEntranceMap.value, [slot]: dungeon }
  }
  function clearDungeonEntrance(slot) {
    const next = { ...dungeonEntranceMap.value }
    delete next[slot]
    dungeonEntranceMap.value = next
  }
  function resetDungeonEntrances() { dungeonEntranceMap.value = {} }

  // Pinned locations (array of EMO location names, ordered)
  const pinnedLocations = ref([])

  function pinLocation(name) {
    if (!pinnedLocations.value.includes(name))
      pinnedLocations.value = [...pinnedLocations.value, name]
    saveState()
  }
  function unpinLocation(name) {
    pinnedLocations.value = pinnedLocations.value.filter(n => n !== name)
    saveState()
  }
  function isPinned(name) { return pinnedLocations.value.includes(name) }

  // Step section cleared count by dir (+1 or -1), clamped to [0, maxCount]
  function stepSection(locationName, sectionName, dir, maxCount) {
    const key = sectionKey(locationName, sectionName)
    const current = checkedSections.value[key] ?? 0
    const next = Math.max(0, Math.min(maxCount, current + dir))
    checkedSections.value = { ...checkedSections.value, [key]: next }
    saveState()
  }

  // Location notes
  const locationNotes = ref({})

  // Chat
  const showChat     = ref(false)
  const chatMessages = ref([])
  function addChatMessage(msg) {
    chatMessages.value.push(msg)
    if (chatMessages.value.length > 300) chatMessages.value.shift()
  }
  function clearChat() { chatMessages.value = [] }

  // ── Computed ────────────────────────────────────────────────────────────────

  const visibleLocations = computed(() => allLocations)

  const totalCount = computed(() => {
    let n = 0
    for (const loc of allLocations) {
      for (const sec of (loc.sections || [])) n += sec.item_count ?? 1
    }
    return n
  })

  const checkedCount = computed(() => {
    let n = 0
    for (const id of checkedLocations.value) {
      const loc = allLocations[id]
      if (loc) for (const sec of (loc.sections || [])) n += sec.item_count ?? 1
    }
    return n
  })

  // ── Section tracking (new EMO model) ─────────────────────────────────────

  function sectionKey(locationName, sectionName) {
    return `${locationName}/${sectionName}`
  }

  function getSectionCleared(locationName, sectionName) {
    return checkedSections.value[sectionKey(locationName, sectionName)] ?? 0
  }

  function setSectionCleared(locationName, sectionName, count) {
    checkedSections.value = {
      ...checkedSections.value,
      [sectionKey(locationName, sectionName)]: count,
    }
    saveState()
  }

  function toggleSection(locationName, sectionName, maxCount = 1) {
    const key = sectionKey(locationName, sectionName)
    const current = checkedSections.value[key] ?? 0
    const next = current >= maxCount ? 0 : maxCount
    checkedSections.value = { ...checkedSections.value, [key]: next }
    saveState()
  }

  function isSectionCleared(locationName, sectionName, itemCount = 1) {
    return (checkedSections.value[sectionKey(locationName, sectionName)] ?? 0) >= itemCount
  }

  // ── Legacy numeric id actions (bizhawk compat) ───────────────────────────

  function toggleLocation(locationId) {
    const id = Number(locationId)
    if (checkedLocations.value.has(id)) checkedLocations.value.delete(id)
    else checkedLocations.value.add(id)
    saveState()
  }

  function isChecked(locationId) {
    return checkedLocations.value.has(Number(locationId))
  }

  function markLocationsChecked(ids) {
    for (const id of ids) checkedLocations.value.add(Number(id))
    saveState()
  }


  // ── Actions ──────────────────────────────────────────────────────────────

  function resetTracker() {
    checkedSections.value  = {}
    checkedLocations.value = new Set()
    manualItems.value      = {}
    receivedItems.value    = []
    locationNotes.value    = {}
    dungeonEntranceMap.value = {}
    saveState()
  }

  function setActiveView(view)   { activeView.value = view; saveState() }
  function setActiveZone(zone)   { activeZone.value = zone }
  function setActivePanel(panel) { activePanel.value = panel }
  function setBizhawkFloor(floor) { bizhawkFloor.value = floor }
  function setAutotrackItems(items) { autotrackItems.value = items }
  function toggleSettings()    { showSettings.value    = !showSettings.value }
  function toggleRegionPopup() { showRegionPopup.value = !showRegionPopup.value }

  function setLocationNote(id, itemKey) {
    locationNotes.value = { ...locationNotes.value, [id]: itemKey }
    saveState()
  }
  function clearLocationNote(id) {
    const next = { ...locationNotes.value }
    delete next[id]
    locationNotes.value = next
    saveState()
  }

  function setApLocationItems(map) { apLocationItems.value = map ?? {} }
  function setRawSlotData(data)    { rawSlotData.value = data ?? {} }
  function setApPlayers(map)       { apPlayers.value = map }

  // ── Persistence ──────────────────────────────────────────────────────────

  let _stateTid
  function saveState() {
    clearTimeout(_stateTid)
    _stateTid = setTimeout(() => {
      try {
        localStorage.setItem('tmc_state', JSON.stringify({
          checkedSections:    checkedSections.value,
          checkedLocations:   [...checkedLocations.value],
          manualItems:        manualItems.value,
          locationNotes:      locationNotes.value,
          activeView:         activeView.value,
          dungeonEntranceMap: dungeonEntranceMap.value,
          pinnedLocations:    pinnedLocations.value,
        }))
      } catch {}
    }, 200)
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('tmc_state')
      if (!raw) return
      const s = JSON.parse(raw)
      if (s.checkedSections)    checkedSections.value    = s.checkedSections
      if (s.checkedLocations)   checkedLocations.value   = new Set(s.checkedLocations)
      if (s.manualItems)        manualItems.value        = s.manualItems
      if (s.locationNotes)      locationNotes.value      = s.locationNotes
      if (s.activeView)         activeView.value         = s.activeView
      if (s.dungeonEntranceMap) dungeonEntranceMap.value = s.dungeonEntranceMap
      if (s.pinnedLocations)    pinnedLocations.value    = s.pinnedLocations
    } catch {}
  }

  watch(manualItems, saveState, { deep: true })

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', e => {
      if (e.key === 'tmc_state') loadState()
    })
  }

  return {
    allLocations,
    allItems,
    allRegions,
    checkedSections,
    checkedLocations,
    manualItems,
    receivedItems,
    bizhawkConnected,
    bizhawkFloor,
    autotrackItems,
    activeView, setActiveView,
    activeZone, setActiveZone,
    activePanel, setActivePanel,
    hoveredPinLocs,
    dungeonEntranceMap, setDungeonEntrance, clearDungeonEntrance, resetDungeonEntrances,
    locationNotes, setLocationNote, clearLocationNote,
    visibleLocations,
    checkedCount,
    totalCount,
    pinnedLocations, pinLocation, unpinLocation, isPinned,
    toggleLocation, isChecked, markLocationsChecked,
    getSectionCleared, setSectionCleared, toggleSection, isSectionCleared, stepSection, sectionKey,
    resetTracker,
    setBizhawkFloor, setAutotrackItems,
    showSettings, toggleSettings,
    showRegionPopup, toggleRegionPopup,
    showApPanel, showFaq,
    apConnected, apVersion, apServer, apPort, apSlot, apPassword,
    apPlayers, setApPlayers,
    rawSlotData, setRawSlotData,
    apLocationItems, setApLocationItems,
    showChat, chatMessages, addChatMessage, clearChat,
    saveState, loadState,
  }
})
