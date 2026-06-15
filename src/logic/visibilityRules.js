function evalHasToken(key, settings) {
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
    case 'dhc_closed':         return settings.dhcAccess === 'closed'
    case 'dhc_ped':            return settings.dhcAccess === 'pedestal'
    case 'dhc_open':           return settings.dhcAccess === 'open'
    case 'dhc_open_fast':      return settings.dhcAccess === 'open'
    case 'dhc_fast_vaati':     return true
    case 'dhc_warp_vaati':     return true
    case 'dungeonser_on':      return !!settings.dungeonEntranceShuffle
    case 'dungeonser_off':     return !settings.dungeonEntranceShuffle
    default: {
      const m = key.match(/^cucco_(\d+)$/)
      if (m) return settings.cuccoRounds >= parseInt(m[1])
      const g = key.match(/^goron_(\d+)$/)
      if (g) return settings.goronSets >= parseInt(g[1])
      return true
    }
  }
}

function evalRule(rule, settings, callLua) {
  return rule.split(',').every(token => {
    const t = token.trim()
    if (t.startsWith('$has|')) return evalHasToken(t.slice(5), settings)
    if (t.startsWith('$') && callLua) return callLua(t.slice(1))
    return true
  })
}

// rules = array of OR-conditions (each entry is an AND-chain joined by commas)
// callLua(name) — optional, called for $FunctionName tokens; should return boolean
export function evalRules(rules, settings, callLua) {
  if (!rules?.length) return true
  return rules.some(r => evalRule(r, settings, callLua))
}
