/**
 * Accessibility computation using the randomizer's default.logic (or a custom .logic file).
 *
 * No BFS — the rando logic is not region-graph based; each location has a direct expression.
 * No out_of_logic tier — the rando has no tricks.
 * Locations without key_rando are omitted from the result Map (tracker ignores them).
 * Locations whose key_rando has no compiled rule default to 'accessible' (fail-open).
 *
 * Interface mirrors accessibility.js so callers can swap implementations.
 */

import { parseLogic } from './logicParser.js'
import locationsRaw  from '../../data/location_meta.json'

/**
 * Compute accessibility for every AP location using rando logic rules.
 *
 * @param {Object} inv        - inventory object from buildInventory_rando()
 * @param {Object} settings   - settingsStore state
 * @param {string} logicText  - raw content of the .logic file to evaluate
 * @returns {Map<number, 'accessible'|'inaccessible'>}
 */
export function computeAccessibility_rando(inv, settings, logicText) {
  const { LOCATION_RULES } = parseLogic(logicText, settings)
  const result = new Map()

  for (const loc of locationsRaw) {
    if (!loc.key_rando) continue

    const rule = LOCATION_RULES[loc.key_rando]
    // Unknown rule → fail-open (location exists in AP but not parsed from this logic file)
    const accessible = !rule || rule(inv, settings)
    result.set(loc.id, accessible ? 'accessible' : 'inaccessible')
  }

  return result
}
