import { useStateStore } from '../stores/stateStore'
import locationsData from '../../data/locations.json'

const BRIDGE_URL = 'http://localhost:65399'
const POLL_MS    = 1000

// room_area (16-bit) → dungeon key
const ROOM_AREA_TO_DUNGEON = {}
for (const loc of locationsData) {
  if (loc.dungeon && loc.room_area != null && !(loc.room_area in ROOM_AREA_TO_DUNGEON))
    ROOM_AREA_TO_DUNGEON[loc.room_area] = loc.dungeon
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
    store.setAutotrackItems(items)

    if (Array.isArray(data._checked) && data._checked.length > 0) {
      store.markLocationsChecked(data._checked)
    }

    const roomArea = data._room_area
    if (roomArea) {
      const dungeon = ROOM_AREA_TO_DUNGEON[roomArea] ?? null
      store.setActiveView(dungeon ?? 'overworld')
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
