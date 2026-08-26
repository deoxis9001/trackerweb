// Dungeon-to-entrance assignment pattern: [dungeon]_[entrance]
// e.g. pow_dhc = "PoW dungeon assigned to DHC entrance"
const DUNGEON_CODE  = { dws: 'DWS', cof: 'CoF', fow: 'FoW', tod: 'ToD', pow: 'PoW', dhc: 'DHC', crypt: 'RC' }
const ENTRANCE_CODE = { dws: 'DWS', cof: 'CoF', fow: 'FoW', tod: 'ToD', pow: 'PoW', dhc: 'DHC', crypt: 'RC' }

function evalHasToken(key, settings, extras) {
  switch (key) {
    case 'fusionblue_vanilla':  return settings.blueFusionAccess  === 'vanilla'
    case 'fusiongold_vanilla':  return settings.goldFusionAccess  === 'vanilla'
    case 'fusiongreen_vanilla': return settings.greenFusionAccess === 'vanilla'
    case 'fusionred_vanilla':   return settings.redFusionAccess   === 'vanilla'
    case 'golden_enemy_on':    return !!settings.shuffleGoldEnemies
    case 'digging_on':         return !!settings.shuffleDigging
    case 'specialpot_on':      return !!settings.shufflePots
    case 'shopbag_extra_on':   return !!settings.extraShopItem
    case 'underwater_on':      return !!settings.shuffleUnderwater
    case 'rupees_on':          return !!settings.rupeesanity
    case 'hp_vanilla':         return settings.shuffleElements === 'vanilla'
    case 'ped_items_on':       return settings.pedReward !== 'none'
    case 'biggoron_shield':    return settings.biggoron === 'shield'
    case 'biggoron_mirror':    return settings.biggoron === 'mirror_shield'
    case 'dhc_closed':     { const d = settings.randoDefines?.DHC_SETTING; return d ? d === 'NORMALDHC' : settings.dhcAccess === 'closed' }
    case 'dhc_ped':        { const d = settings.randoDefines?.DHC_SETTING; return d ? d === 'NODHC'    : settings.dhcAccess === 'pedestal' }
    case 'dhc_open':       { const d = settings.randoDefines?.DHC_SETTING; return d ? d === 'OPENDHC'  : settings.dhcAccess === 'open' }
    case 'dhc_open_fast':  { const d = settings.randoDefines?.DHC_SETTING; return d ? d === 'OPENDHC'  : settings.dhcAccess === 'open' }
    case 'dhc_fast_vaati': { const d = settings.randoDefines?.DHC_SETTING; return d ? d === 'FASTVAATI': settings.dhcAccess === 'fast_vaati' }
    case 'dhc_warp_vaati': return true
    case 'dungeonser_on': {
      const e = settings.randoDefines?.ENTRANCES
      return e === 'ENTRANCES_COUPLED' || (e !== 'ENTRANCES_VANILLA' && !!settings.dungeonEntranceShuffle)
    }
    case 'dungeonser_off': {
      const e = settings.randoDefines?.ENTRANCES
      return e === 'ENTRANCES_VANILLA' || (e !== 'ENTRANCES_COUPLED' && !settings.dungeonEntranceShuffle)
    }
    default: {
      const mc = key.match(/^cucco_(\d+)$/)
      if (mc) return settings.cuccoRounds >= parseInt(mc[1])
      const mg = key.match(/^goron_(\d+)$/)
      if (mg) return settings.goronSets >= parseInt(mg[1])
      // Pattern [dungeon]_[entrance] — résolu depuis entranceMap
      const me = key.match(/^([a-z]+)_([a-z]+)$/)
      if (me) {
        const dungeon  = DUNGEON_CODE[me[1]]
        const entrance = ENTRANCE_CODE[me[2]]
        if (dungeon !== undefined && entrance !== undefined) {
          return !!extras?.entranceMap && extras.entranceMap[entrance] === dungeon
        }
      }
      return true
    }
  }
}

function evalRule(rule, settings, callLua, extras) {
  return rule.split(',').every(token => {
    const t = token.trim()
    if (t.startsWith('$has|')) return evalHasToken(t.slice(5), settings, extras)
    if (t.startsWith('$') && callLua) return callLua(t.slice(1))
    return true
  })
}

// rules = array of OR-conditions (each entry is an AND-chain joined by commas)
// callLua(name) — optional, called for $FunctionName tokens; should return boolean
// extras.entranceMap — optional, used to resolve dungeon-entrance assignment items
export function evalRules(rules, settings, callLua, extras) {
  if (!rules?.length) return true
  return rules.some(r => evalRule(r, settings, callLua, extras))
}
