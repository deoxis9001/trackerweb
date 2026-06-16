import { setProvider, resetCache, callLuaFunction } from './luaEngine'
import itemsSpec from '../data/items_spec.json'

// Map stage codes → { parentCode, minStage } for progressive items
const STAGE_CODE_MAP = {}
for (const item of itemsSpec.items ?? []) {
  if (item.type !== 'progressive') continue
  item.stages?.forEach((stage, idx) => {
    for (const code of (stage.codes ?? '').split(',').map(s => s.trim()).filter(Boolean)) {
      if (!(code in STAGE_CODE_MAP)) STAGE_CODE_MAP[code] = { parentCode: item.codes, minStage: idx }
    }
  })
}

// Dungeon entrance shuffle: tracker dungeon/slot key → Lua entrance token (RC → crypt)
const ENTRANCE_TOKEN = { DWS: 'dws', CoF: 'cof', FoW: 'fow', ToD: 'tod', RC: 'crypt', PoW: 'pow', DHC: 'dhc' }
const ENTRANCE_CODE_RE = /^(dws|cof|fow|tod|crypt|pow|dhc)_(dws|cof|fow|tod|crypt|pow|dhc)$/

// luaLevel: 0=normal, 2=SequenceBreak, 3=Inspect
function levelFromLuaLevel(luaLevel) {
  if (luaLevel === 2) return 'sequence-break'
  if (luaLevel === 3) return 'inspect'
  return 'normal'
}

// Mapping from randoDefines define names → settingsStore values
const FUSION_DEFINES = {
  gold:  ['GOLD_FUSION_SETTING',  { NO_GOLD_FUSIONS: 'closed',  VANILLA_GOLD_FUSIONS: 'vanilla',  COMBINED_GOLD_FUSIONS: 'combined',  OPEN_GOLD_FUSIONS: 'open'  }],
  red:   ['RED_FUSION_SETTING',   { NO_RED_FUSIONS:  'closed',  VANILLA_RED_FUSIONS:  'vanilla',  COMBINED_RED_FUSIONS:  'combined',  OPEN_RED_FUSIONS:  'open'  }],
  blue:  ['BLUE_FUSION_SETTING',  { NO_BLUE_FUSIONS: 'closed',  VANILLA_BLUE_FUSIONS: 'vanilla',  COMBINED_BLUE_FUSIONS: 'combined',  OPEN_BLUE_FUSIONS: 'open'  }],
  green: ['GREEN_FUSION_SETTING', { NO_GREEN_FUSIONS:'closed',  VANILLA_GREEN_FUSIONS:'vanilla',  COMBINED_GREEN_FUSIONS:'combined',  OPEN_GREEN_FUSIONS:'open'  }],
}

// lua trick base name → [defineName, enabledValue, trickKey]
const TRICK_CODES = {
  'blowdust':         ['BLOWDUST_SETTING',    'GUSTBOMBS',        'bomb_dust'],
  'crenelmushroom':   ['MUSHROOM_SETTING',     'YESMUSH',          'mushroom'],
  'lightarrowbreak':  ['ARROWBREAK_SETTING',   'YESLIGHTS',        'arrows_break'],
  'bobombs':          ['BOBOMBS_SETTING',      'YESBOBOMBS',       'bobomb_walls'],
  'likelike':         ['LIKELIKE_SETTING',     'YESLIKELIKE',      'likelike_swordless'],
  'guardskip':        ['GUARDSKIP_SETTING',    'YESGUARDSKIP',     'boots_guards'],
  'crenelbeam':       ['CRENELBEAM_SETTING',   'YESBEAM',          'beam_crenel_switch'],
  'downstrikebeetle': ['DTBEETLE_SETTING',     'YESTHRUST',        'downthrust_beetle'],
  'darkrooms':        ['DARKROOMS_SETTING',    'YESDARK',          'dark_rooms'],
  'capeextension':    ['EXTENDCAPE_SETTING',   'YESEXTENSION',     'cape_extensions'],
  'lakeminish':       ['LAKEMINISH_SETTING',   'YESLAKEMINISH',    'lake_minish'],
  'cabinswim':        ['CABINSWIM_SETTING',    'YESCABIN',         'cabin_swim'],
  'cloudskill':       ['CLOUDSKILL_SETTING',   'YESCLOUDSKILL',    'sharks_swordless'],
  'powjump':          ['POWJUMP_SETTING',      'YESPOWJUMP',       'pow_nocane'],
  'powpotpuzzleool':  ['POWPOTOOL_SETTING',    'YESPOWOOL',        'pot_puzzle'],
  'fowpot':           ['FOWPOT_SETTING',       'YESFOWPOT',        'fow_pot'],
  'dhccanonhit':      ['DHCCANON_SETTING',     'YESDHCCANON',      'dhc_cannons'],
  'clonetrick':       ['DHCJOSTLE_SETTING',    'YESDHCJOSTLE',     'dhc_clones'],
  'dhcswitchhit':     ['DHCSWITCHES_SETTING',  'YESDHCSWITCHES',   'dhc_spin'],
}

function isTrickEnabled(settingsStore, base) {
  const entry = TRICK_CODES[base]
  if (!entry) return false
  const [defineName, enabledValue, trickKey] = entry
  const rd = settingsStore?.randoDefines
  if (rd?.[defineName] !== undefined) return rd[defineName] === enabledValue
  return settingsStore?.hasTrick?.(trickKey) ?? false
}

// Resolve fusion access for a color: randoDefines takes priority over direct store field.
function fusionAccess(settingsStore, color) {
  const rd = settingsStore?.randoDefines
  if (rd) {
    const [defineName, valueMap] = FUSION_DEFINES[color]
    const mapped = valueMap[rd[defineName]]
    if (mapped) return mapped
  }
  return settingsStore?.[`${color}FusionAccess`] ?? 'open'
}

// Build a provider from the current stateStore snapshot.
// sectionAvailable(code): handles "@Location/Section" refs used by FindObjectForCode.
function makeProvider(stateStore, settingsStore) {
  // Dungeon entrance shuffle: `<dungeon>_<entrance>` codes the Lua XxxDungeons()
  // functions read. Map slot→dungeon assignments to the active code set.
  const entranceShuffleOn = !!settingsStore?.dungeonEntranceShuffle
  const activeEntranceCodes = new Set()
  if (entranceShuffleOn) {
    for (const [slot, dungeon] of Object.entries(stateStore.dungeonEntranceMap ?? {})) {
      const d = ENTRANCE_TOKEN[dungeon]
      const e = ENTRANCE_TOKEN[slot]
      if (d && e) activeEntranceCodes.add(`${d}_${e}`)
    }
  }

  return {
    getFusionCombined(color) {
      return fusionAccess(settingsStore, color) === 'combined'
    },

    itemCount(code) {
      if (settingsStore) {
        switch (code) {
          // Fusions — exclusive stages: removed=closed, vanilla=vanilla|combined, complet=open
          // 'combined' → vanilla=1 (NPC pins present) + fusionXcombined:getActive()=true
          case 'fusionred_removed':   { const a = fusionAccess(settingsStore,'red');   return a === 'closed'                 ? 1 : 0 }
          case 'fusionred_vanilla':   { const a = fusionAccess(settingsStore,'red');   return (a === 'vanilla'||a==='combined') ? 1 : 0 }
          case 'fusionred_complet':   { const a = fusionAccess(settingsStore,'red');   return a === 'open'                   ? 1 : 0 }
          case 'fusionblue_removed':  { const a = fusionAccess(settingsStore,'blue');  return a === 'closed'                 ? 1 : 0 }
          case 'fusionblue_vanilla':  { const a = fusionAccess(settingsStore,'blue');  return (a === 'vanilla'||a==='combined') ? 1 : 0 }
          case 'fusionblue_complet':  { const a = fusionAccess(settingsStore,'blue');  return a === 'open'                   ? 1 : 0 }
          case 'fusiongreen_removed': { const a = fusionAccess(settingsStore,'green'); return a === 'closed'                 ? 1 : 0 }
          case 'fusiongreen_vanilla': { const a = fusionAccess(settingsStore,'green'); return (a === 'vanilla'||a==='combined') ? 1 : 0 }
          case 'fusiongreen_complet': { const a = fusionAccess(settingsStore,'green'); return a === 'open'                   ? 1 : 0 }
          case 'fusiongold_removed':  { const a = fusionAccess(settingsStore,'gold');  return a === 'closed'                 ? 1 : 0 }
          case 'fusiongold_vanilla':  { const a = fusionAccess(settingsStore,'gold');  return (a === 'vanilla'||a==='combined') ? 1 : 0 }
          case 'fusiongold_complet':  { const a = fusionAccess(settingsStore,'gold');  return a === 'open'                   ? 1 : 0 }

          // Wind crests
          case 'crenelwindcrest_yes':  return settingsStore.windCrestCrenel      ? 1 : 0
          case 'fallswindcrest_yes':   return settingsStore.windCrestFalls        ? 1 : 0
          case 'cloudwindcrest_yes':   return settingsStore.windCrestClouds       ? 1 : 0
          case 'swampwindcrest_yes':   return settingsStore.windCrestCastor       ? 1 : 0
          case 'shfwindcrest_yes':     return settingsStore.windCrestSouthField   ? 1 : 0
          case 'minishwindcrest_yes':  return settingsStore.windCrestMinishWoods  ? 1 : 0
          case 'lakewindcrest_yes':  { const v = settingsStore.randoDefines?.LAKE_CREST ? 1 : 0; console.log('[provider] lakewindcrest_yes → LAKE_CREST:', settingsStore.randoDefines?.LAKE_CREST, '→', v); return v }
          case 'open_library_yes':     return settingsStore.randoDefines?.OPEN_LIBRARY ? 1 : 0

          // Dungeon warps — value 1=blue, 2=red, 3=both
          case 'dws_warps_blue':  return (settingsStore.warpDWS === 1 || settingsStore.warpDWS === 3) ? 1 : 0
          case 'dws_warps_red':   return (settingsStore.warpDWS === 2 || settingsStore.warpDWS === 3) ? 1 : 0
          case 'cof_warps_blue':  return (settingsStore.warpCoF === 1 || settingsStore.warpCoF === 3) ? 1 : 0
          case 'cof_warps_red':   return (settingsStore.warpCoF === 2 || settingsStore.warpCoF === 3) ? 1 : 0
          case 'fow_warps_blue':  return (settingsStore.warpFoW === 1 || settingsStore.warpFoW === 3) ? 1 : 0
          case 'tod_warps_blue':  return (settingsStore.warpToD === 1 || settingsStore.warpToD === 3) ? 1 : 0
          case 'tod_warps_red':   return (settingsStore.warpToD === 2 || settingsStore.warpToD === 3) ? 1 : 0
          case 'pow_warps_blue':  return (settingsStore.warpPoW === 1 || settingsStore.warpPoW === 3) ? 1 : 0
          case 'pow_warps_red':   return (settingsStore.warpPoW === 2 || settingsStore.warpPoW === 3) ? 1 : 0
          case 'dhc_warps_blue':  return (settingsStore.warpDHC === 1 || settingsStore.warpDHC === 3) ? 1 : 0
          case 'dhc_warps_red':   return (settingsStore.warpDHC === 2 || settingsStore.warpDHC === 3) ? 1 : 0
        }
      }
      // Dungeon entrance shuffle (must precede the generic _off/_on fallback below)
      if (code === 'dungeonser_off') return entranceShuffleOn ? 0 : 1
      if (code === 'dungeonser_on')  return entranceShuffleOn ? 1 : 0
      if (ENTRANCE_CODE_RE.test(code)) return activeEntranceCodes.has(code) ? 1 : 0

      // Known tricks: _out_on=sequence break (1 if enabled), _on=never in-logic (0), _off=1 if disabled
      const suffix = code.endsWith('_out_on') ? '_out_on' : code.endsWith('_on') ? '_on' : code.endsWith('_off') ? '_off' : null
      if (suffix) {
        const base = code.slice(0, code.length - suffix.length)
        if (TRICK_CODES[base]) {
          const enabled = isTrickEnabled(settingsStore, base)
          if (suffix === '_out_on') return enabled ? 1 : 0
          if (suffix === '_off')    return enabled ? 0 : 1
          return 0  // _on: tricks always out-of-logic in AP, never in-logic
        }
      }
      // Fallback for unmapped settings codes: _off = feature disabled (1), _on/_out_on = inactive (0)
      if (code.endsWith('_off')) return 1
      if (code.endsWith('_on'))  return 0

      const stageInfo = STAGE_CODE_MAP[code]
      if (stageInfo) {
        const cur = (stateStore.manualItems[stageInfo.parentCode] ?? 0)
                  + (stateStore.autotrackItems[stageInfo.parentCode] ?? 0)
        return cur >= stageInfo.minStage ? 1 : 0
      }
      const manual = stateStore.manualItems[code] ?? 0
      const auto   = stateStore.autotrackItems[code] ?? 0
      return manual + auto
    },

    // "@Location Name/Section Name" → 1 if section still has remaining items, 0 if cleared
    sectionAvailable(code) {
      if (!code.startsWith('@')) return 1
      // strip leading @
      const inner = code.slice(1)
      const slashIdx = inner.indexOf('/')
      if (slashIdx < 0) return 1
      const locName = inner.slice(0, slashIdx).trim()
      const secName = inner.slice(slashIdx + 1).trim()
      const key = stateStore.sectionKey(locName, secName)
      const loc = stateStore.allLocations.find(l => l.name === locName)
      if (!loc) return 1
      const sec = (loc.sections || []).find(s => s.name === secName)
      if (!sec) return 1
      const cleared = stateStore.checkedSections[key] ?? 0
      return cleared < (sec.item_count ?? 1) ? 1 : 0
    },

    callFunction(name /*, _args */) {
      const { count, luaLevel } = callLuaFunction(name)
      return { count, level: count > 0 ? levelFromLuaLevel(luaLevel) : 'none' }
    },

    locationReachable(_name) { return false },
  }
}

// Inject current provider into luaEngine and reset the Lua caches.
// Call once before computing accessibility for all locations.
export function prepareProvider(stateStore, settingsStore) {
  const provider = makeProvider(stateStore, settingsStore)
  setProvider(provider)
  resetCache()
  return provider
}
