import { Client } from 'archipelago.js'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import apTables from '../../data/ap_tables.json'

// Low byte of room_area_id → dungeon key. Derived from room_mapping.lua (authoritative).
// Covers all rooms including corridors/boss rooms without chests.
const AREA_BYTE_TO_DUNGEON = {
  0x48: 'DWS', 0x49: 'DWS',
  0x50: 'CoF', 0x51: 'CoF',
  0x18: 'FoW', 0x58: 'FoW', 0x59: 'FoW', 0x5A: 'FoW',
  0x60: 'ToD',
  0x68: 'RC',
  0x70: 'PoW', 0x71: 'PoW',
  0x78: 'DHC', 0x88: 'DHC', 0x89: 'DHC', 0x8A: 'DHC', 0x8B: 'DHC', 0x8C: 'DHC', 0x8D: 'DHC',
}

let client = null

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
    store.apConnected = false
    store.setLocationHints({})
  })

  try {
    const slotData = await client.login(`${server}:${port}`, slot, 'The Minish Cap', { password })
    const settingsStore = useSettingsStore()
    settingsStore.importFromSlotData(slotData)

    // Subscribe to room changes for auto tab switching
    const me = client.players.self
    await client.storage.notify(
      [`tmc_room_${me.team}_${me.slot}`],
      (_key, roomAreaId) => {
        if (!roomAreaId) return
        const dungeon = AREA_BYTE_TO_DUNGEON[roomAreaId & 0xFF] ?? null
        store.setActiveView(dungeon ?? 'overworld')
      }
    )

    // Hints — only hints for locations in our world (we are the finding_player)
    function applyHints(hints, replace) {
      const map = replace ? {} : { ...store.locationHints }
      for (const hint of hints) {
        if (hint.item.sender.slot === me.slot) {
          const status = hint.status
          if (status === 40) delete map[hint.item.locationId] // found = no halo
          else map[hint.item.locationId] = status
        }
      }
      store.setLocationHints(map)
    }

    client.items.on('hintsInitialized', (hints) => applyHints(hints, true))
    client.items.on('hintReceived',     (hint)  => applyHints([hint], false))
    client.items.on('hintFound',        (hint)  => applyHints([hint], false))

    return true
  } catch (err) {
    console.error('AP connection failed:', err)
    return false
  }
}

export function disconnectFromAP() {
  if (client) {
    client.disconnect?.()
    client = null
  }
  const store = useStateStore()
  store.apConnected = false
}

export function locationName(apId) {
  return apTables.locations[String(apId)] ?? `Unknown (${apId})`
}

export function itemName(apId) {
  return apTables.items[String(apId)] ?? `Unknown (${apId})`
}
