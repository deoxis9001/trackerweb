import { Client } from 'archipelago.js'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import apTables from '../../data/ap_tables.json'
import roomAreaToZoneRaw from '../../data/room_area_to_zone.json'
import roomAreaToFloor from '../../data/room_area_to_floor.json'

const ROOM_AREA_TO_ZONE = {}
for (const [k, v] of Object.entries(roomAreaToZoneRaw)) {
  ROOM_AREA_TO_ZONE[Number(k)] = v
}

let client = null
let _me = null  // { team, slot } — set after successful login, cleared on disconnect

function applyHints(rawHints) {
  const store = useStateStore()
  if (!_me) return
  const map = {}
  for (const hint of rawHints ?? []) {
    if (hint.finding_player !== _me.slot) continue
    if (hint.found) continue
    const flags = hint.item_flags ?? 0
    let key
    if      (flags & 4) key = 'AP_ITEM_RED'    // trap
    else if (flags & 1) key = 'AP_ITEM_YELLOW'  // progression
    else if (flags & 2) key = 'AP_ITEM_BLUE'    // useful
    else                key = 'AP_ITEM_WHITE'    // junk/filler
    map[hint.location] = key
  }
  store.setApLocationItems(map)
}

export function getClient() {
  return client
}

export async function connectToAP(server, port, slot, password = '') {
  const store = useStateStore()
  store.resetTracker()

  client = new Client({ autoFetchDataPackage: false })

  client.items.on('itemsReceived', (items) => {
    for (const item of items) {
      store.receiveItem(item.id)
    }
  })

  client.room.on('locationsChecked', (locationIds) => {
    store.markLocationsChecked(locationIds)
  })

  client.socket.on('connected', () => {
    store.apConnected = true
    store.markLocationsChecked(client.room.checkedLocations ?? [])
  })

  client.socket.on('disconnected', () => {
    _me = null
    store.apConnected = false
    store.setRawSlotData({})
    store.setApPlayers({})
    store.setApLocationItems({})
  })

  client.messages.on('message', (text, nodes) => {
    store.addChatMessage({ text, nodes })
  })

  try {
    const slotData = await client.login(`${server}:${port}`, slot, 'The Minish Cap', { password })
    const settingsStore = useSettingsStore()
    settingsStore.importFromSlotData(slotData)
    store.apVersion = slotData.version ?? ''
    store.setRawSlotData(slotData)

    _me = client.players.self

    const playersMap = {}
    for (const p of client.players.teams[_me.team] ?? []) {
      playersMap[p.slot] = p.name
    }
    store.setApPlayers(playersMap)

    // Subscribe to room changes for auto tab switching
    await client.storage.notify(
      [`tmc_room_${_me.team}_${_me.slot}`],
      (_key, roomAreaId) => {
        if (!roomAreaId) return
        const settings  = useSettingsStore()
        const floorInfo = roomAreaToFloor[roomAreaId] ?? null
        if (floorInfo && settings.autoTabDungeons !== 'non') {
          store.setActiveView(floorInfo.dungeon)
          store.setActiveZone(null)
          store.setBizhawkFloor(floorInfo.floor)
        } else if (!floorInfo) {
          if (settings.autoTabOverworld !== 'non') {
            store.setActiveView('overworld')
            store.setActiveZone(ROOM_AREA_TO_ZONE[roomAreaId] ?? null)
            store.setBizhawkFloor(null)
          } else if (settings.autoTabDungeons !== 'non') {
            store.setActiveView('overworld')
            store.setBizhawkFloor(null)
          }
        }
      }
    )

    // Fetch hints and subscribe to updates
    const hintsKey = `_read_hints_${_me.team}_${_me.slot}`
    const initialHints = await client.storage.fetch(hintsKey)
    applyHints(initialHints)
    await client.storage.notify([hintsKey], (_key, hints) => applyHints(hints))

    return true
  } catch (err) {
    console.error('AP connection failed:', err)
    return false
  }
}

export async function resyncFromAP() {
  if (!client || !_me) return
  const store = useStateStore()
  store.resetTracker()
  // Re-apply all items received so far
  for (const item of client.items.received ?? []) {
    store.receiveItem(item.id)
  }
  // Re-apply all checked locations
  store.markLocationsChecked(client.room.checkedLocations ?? [])
  // Re-fetch hints
  const hintsKey = `_read_hints_${_me.team}_${_me.slot}`
  const hints = await client.storage.fetch(hintsKey)
  applyHints(hints)
}

export function disconnectFromAP() {
  if (client) {
    client.disconnect?.()
    client = null
  }
  _me = null
  const store = useStateStore()
  store.apConnected = false
}

export function locationName(apId) {
  return apTables.locations[String(apId)] ?? `Unknown (${apId})`
}

export function itemName(apId) {
  return apTables.items[String(apId)] ?? `Unknown (${apId})`
}
