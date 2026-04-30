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
  // AP sends starting heart containers as received items, but the rando's HasHearts
  // threshold only counts hearts BEYOND the starting base (e.g. threshold 28 = 7
  // additional hearts needed to reach 10 total with 3 starting).
  // Subtract starting hearts so the count reflects only AP-received extras.
  const startHearts = settings.startingHearts ?? 3
  const evalInv = startHearts > 0 && (inv['Heart Container'] || 0) > 0
    ? { ...inv, 'Heart Container': Math.max(0, (inv['Heart Container'] || 0) - startHearts) }
    : inv

  const { LOCATION_RULES, HELPERS } = parseLogic(logicText, settings)

  // JS-side logic patches — correct gaps in the rando's default.logic without
  // modifying the logic file itself.
  _applyLogicPatches(LOCATION_RULES, HELPERS)

  const result = new Map()

  for (const loc of locationsRaw) {
    if (!loc.key_rando) continue

    const rule = LOCATION_RULES[loc.key_rando]
    // Unknown rule → fail-open (location exists in AP but not parsed from this logic file)
    const accessible = !rule || rule(evalInv, settings)
    result.set(loc.id, accessible ? 'accessible' : 'inaccessible')
  }

  return result
}

/**
 * Post-parse patches for locations where the rando's logic omits a physical
 * access requirement that the tracker needs to surface correctly.
 */
function _applyLogicPatches(LOCATION_RULES, HELPERS) {
  // FallsFusion ("Fused with Veil Falls Door"):
  // Rando only checks kinstone availability (CanFuseGoldCrown); physical
  // access to the door also requires OverworldBlocks (= BombBag).
  const fallsBase   = LOCATION_RULES['Helpers.FallsFusion']
  const overworldFn = HELPERS.get('OverworldBlocks')
  if (fallsBase && overworldFn) {
    LOCATION_RULES['Helpers.FallsFusion'] =
      (inv, s) => overworldFn(inv, s) && fallsBase(inv, s)
  }

  // RuinsFusion ("Fused with West/Middle/East Statue"):
  // Rando's RuinsFusion only checks kinstones.  AccessRuins = RuinsFusion AND
  // AccessSwamp AND swamp-navigation — use it directly for the location.
  const accessRuinsFn = HELPERS.get('AccessRuins')
  if (accessRuinsFn) {
    LOCATION_RULES['Helpers.RuinsFusion'] = accessRuinsFn
  }

  // CloudFusions ("Fused with Cloud Top Tornado"):
  // Rando's CloudFusions only checks kinstones (CanFuseGoldTornado).
  // Also require AccessClouds to physically reach Cloud Tops.
  const cloudBase      = LOCATION_RULES['Helpers.CloudFusions']
  const accessCloudsFn = HELPERS.get('AccessClouds')
  if (cloudBase && accessCloudsFn) {
    LOCATION_RULES['Helpers.CloudFusions'] =
      (inv, s) => accessCloudsFn(inv, s) && cloudBase(inv, s)
  }
}
