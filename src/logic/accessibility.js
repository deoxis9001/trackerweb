/**
 * Computes accessibility for every AP location given the current inventory and settings.
 *
 * Returns a Map<locationId, 'accessible' | 'out_of_logic' | 'inaccessible'>
 *
 * Algorithm:
 *  1. BFS the region graph from MENU using the provided inventory+settings.
 *  2. For each reachable region, evaluate location rules.
 *  3. Repeat with tricks enabled (settings clone) to detect out-of-logic access.
 */

import { REGION_RULES, LOCATION_RULES, always } from './rules.js'
import locationsRaw from '../../data/locations.json'

// Pre-index locations by name for O(1) rule lookup
const RULE_BY_NAME = LOCATION_RULES

// Pre-index locations by region key for grouping
const locationsByRegion = {}
for (const loc of locationsRaw) {
  const rk = loc.region_key || loc.region_name || 'UNKNOWN'
  if (!locationsByRegion[rk]) locationsByRegion[rk] = []
  locationsByRegion[rk].push(loc)
}

/**
 * BFS to find all reachable regions given inv+settings.
 * Returns a Set of region keys.
 */
function reachableRegions(inv, settings) {
  const visited = new Set(['MENU'])
  const queue = ['MENU']

  while (queue.length) {
    const current = queue.shift()
    const edges = REGION_RULES[current]
    if (!edges) continue

    for (const [target, rule] of Object.entries(edges)) {
      if (visited.has(target)) continue
      const pass = rule === null || rule === always || rule(inv, settings)
      if (pass) {
        visited.add(target)
        queue.push(target)
      }
    }
  }

  return visited
}

/**
 * Build a fake settings proxy with all tricks enabled.
 */
function settingsWithAllTricks(settings) {
  return new Proxy(settings, {
    get(target, prop) {
      if (prop === 'hasTrick') return () => true
      return target[prop]
    }
  })
}

/**
 * Build the inventory map from the state store's received + manual items.
 */
export function buildInventory(stateStore) {
  const inv = {}

  // Items received from AP
  for (const name of stateStore.receivedItems) {
    inv[name] = (inv[name] || 0) + 1
  }

  // Bizhawk autotrack takes priority over manual items when active
  const itemSource = (stateStore.bizhawkConnected && Object.keys(stateStore.autotrackItems).length > 0)
    ? stateStore.autotrackItems
    : stateStore.manualItems

  // Manually toggled or autotracked items
  for (const [key, count] of Object.entries(itemSource)) {
    if (!count) continue

    // PROGRESSIVE_SPIN_SCROLL: maps to "Progressive Spin Scroll" for scrollLevel() in rules
    if (key === 'PROGRESSIVE_SPIN_SCROLL') {
      inv['Progressive Spin Scroll'] = Math.max(inv['Progressive Spin Scroll'] || 0, count)
      continue
    }
    // PROGRESSIVE_WALLET: chaque niveau = 1 Big Wallet (nom utilisé par rules.js)
    if (key === 'PROGRESSIVE_WALLET') {
      inv['Big Wallet'] = Math.max(inv['Big Wallet'] || 0, count)
      continue
    }
    // HEART_TOTAL: le clic manuel représente des coeurs additionnels (= containers pour la logique)
    if (key === 'HEART_TOTAL') {
      inv['Heart Container'] = Math.max(inv['Heart Container'] || 0, count)
      continue
    }
    // PROGRESSIVE_BOMB_BAG n'existe pas dans items.json ; chaque niveau = 1 Bomb Bag
    if (key === 'PROGRESSIVE_BOMB_BAG') {
      inv['Bomb Bag'] = Math.max(inv['Bomb Bag'] || 0, count)
      continue
    }
    // Le compteur BOTTLE représente N bouteilles distinctes
    if (key === 'BOTTLE') {
      for (let i = 1; i <= count; i++) inv[`Bottle ${i}`] = 1
      continue
    }

    const item = stateStore.allItems.find(i => i.key === key)
    if (item) inv[item.name] = Math.max(inv[item.name] || 0, count)
  }

  return inv
}

/**
 * Main function: returns Map<id, 'accessible' | 'out_of_logic' | 'inaccessible'>
 *
 * out_of_logic (yellow) means: accessible with tricks AND items still required
 * (i.e. the trick doesn't fully bypass item requirements).
 * If a location is reachable with an empty inventory + all tricks, the trick is
 * a pure skill bypass — no items needed — so it stays inaccessible (red) until
 * either the player has the item or enables the trick in settings.
 */
export function computeAccessibility(inv, settings) {
  const result = new Map()

  const allTricks = settingsWithAllTricks(settings)
  const emptyInv  = {}

  // BFS pass 1: current inventory + checked tricks
  const reachable = reachableRegions(inv, settings)
  // BFS pass 2: current inventory + all tricks (OOL candidate)
  const reachableOOL = reachableRegions(inv, allTricks)
  // BFS pass 3: empty inventory + all tricks (detects pure-trick bypasses)
  const reachableOOLEmpty = reachableRegions(emptyInv, allTricks)

  for (const loc of locationsRaw) {
    if (loc.id == null) continue

    const regionKey = loc.region_key || loc.region_name || ''
    const rule = RULE_BY_NAME[loc.name] ?? always

    const inLogic = reachable.has(regionKey)      && rule(inv,      settings)
    const ool     = reachableOOL.has(regionKey)   && rule(inv,      allTricks)
    // Accessible even with no items: trick is a pure bypass, items not needed
    const oolEmpty = reachableOOLEmpty.has(regionKey) && rule(emptyInv, allTricks)

    if (inLogic) {
      result.set(loc.id, 'accessible')
    } else if (ool) {
      result.set(loc.id, 'out_of_logic')
    } else {
      result.set(loc.id, 'inaccessible')
    }
  }

  return result
}
