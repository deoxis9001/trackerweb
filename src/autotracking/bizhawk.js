import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import locationsData from '../../data/locations.json'
import roomAreaToZoneRaw from '../../data/room_area_to_zone.json'

const BRIDGE_URL = 'http://localhost:65399'
const POLL_MS    = 1000

// room_area (16-bit) → dungeon key
const ROOM_AREA_TO_DUNGEON = {}
for (const loc of locationsData) {
  if (loc.dungeon && loc.room_area != null && !(loc.room_area in ROOM_AREA_TO_DUNGEON))
    ROOM_AREA_TO_DUNGEON[loc.room_area] = loc.dungeon
}

// room_area (16-bit) → overworld zone string
const ROOM_AREA_TO_ZONE = {}
for (const [k, v] of Object.entries(roomAreaToZoneRaw)) {
  ROOM_AREA_TO_ZONE[Number(k)] = v
}

// event flags → item keys (version <= 0.3.1)
const FUSE_EVENT_TO_KEY = {
  fuse_01: 'FUSION_01', fuse_02: 'FUSION_02', fuse_03: 'FUSION_03',
  fuse_04: 'FUSION_04', fuse_05: 'FUSION_05', fuse_06: 'FUSION_06',
  fuse_07: 'FUSION_07', fuse_08: 'FUSION_08', fuse_09: 'FUSION_09',
}

function semverLe(v1, v2) {
  const parse = v => (v || '0').split('.').map(Number)
  const [a1, b1, c1] = parse(v1)
  const [a2, b2, c2] = parse(v2)
  if (a1 !== a2) return a1 < a2
  if (b1 !== b2) return b1 < b2
  return c1 <= c2
}

let pollTimer     = null
let polling       = false
let failStreak    = 0
const MAX_FAILS   = 3

async function poll() {
  if (polling) return
  polling = true
  const store = useStateStore()
  try {
    const resp = await fetch(BRIDGE_URL, { signal: AbortSignal.timeout(800) })
    if (!resp.ok) throw new Error('bad response')

    const data = await resp.json()
    if (!data._ready) { polling = false; return }

    failStreak = 0
    if (!store.bizhawkConnected) store.bizhawkConnected = true

    // Extract items (keys starting with _ are internal)
    const items = {}
    for (const [k, v] of Object.entries(data)) {
      if (!k.startsWith('_')) items[k] = v
    }

    // Version <= 0.3.1: map fuse_XX event flags to FUSION_XX item keys
    if (semverLe(store.apVersion, '0.3.1')) {
      for (const [event, key] of Object.entries(FUSE_EVENT_TO_KEY)) {
        if (data[event]) items[key] = 1
      }
    }

    store.setAutotrackItems(items)

    if (Array.isArray(data._checked) && data._checked.length > 0) {
      store.markLocationsChecked(data._checked)
    }

    const roomArea = data._room_area
    if (roomArea) {
      const settings = useSettingsStore()
      const dungeon  = ROOM_AREA_TO_DUNGEON[roomArea] ?? null
      if (dungeon && settings.autoTabDungeons !== 'non') {
        store.setActiveView(dungeon)
        store.setActiveZone(null)
      } else if (!dungeon && settings.autoTabOverworld !== 'non') {
        store.setActiveView('overworld')
        const zone = ROOM_AREA_TO_ZONE[roomArea] ?? null
        store.setActiveZone(zone)
      }
    }
  } catch {
    failStreak++
    if (failStreak >= MAX_FAILS && store.bizhawkConnected) {
      store.bizhawkConnected = false
      store.setAutotrackItems({})
    }
  } finally {
    polling = false
  }
}

export function connectToBizhawk() {
  _disconnect()
  poll()
  pollTimer = setInterval(poll, POLL_MS)
}

export function disconnectFromBizhawk() {
  _disconnect()
  const store = useStateStore()
  store.bizhawkConnected = false
  store.setAutotrackItems({})
}

function _disconnect() {
  clearInterval(pollTimer)
  pollTimer = null
  polling   = false
  failStreak = 0
}
