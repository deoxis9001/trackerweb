import { lua, lauxlib, lualib, to_luastring, to_jsstring } from 'fengari-web'

// ── scripts/logic/ — helpers + location logic functions ──────────────────────
import lua_Function       from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Function.lua?raw'
import lua_Access         from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Access.lua?raw'
import lua_Beam           from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Beam.lua?raw'
import lua_CaveOfFlame_c  from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/CaveOfFlame.lua?raw'
import lua_Common         from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Common.lua?raw'
import lua_DHC_c          from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/DarkHyruleCastle.lua?raw'
import lua_Deepwood_c     from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Deepwood.lua?raw'
import lua_Droplet_c      from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Droplet.lua?raw'
import lua_Elements       from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Elements.lua?raw'
import lua_FortressOfWind from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/FortressOfWind.lua?raw'
import lua_Fusion         from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Fusion.lua?raw'
import lua_Overworld      from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Overworld.lua?raw'
import lua_Openworld      from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Openworld.lua?raw'
import lua_PalaceOfWind   from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/PalaceOfWind.lua?raw'
import lua_Settings       from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Settings.lua?raw'
import lua_Sword          from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Sword.lua?raw'
import lua_CanDamage      from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/CanDamage.lua?raw'
import lua_CanSplit       from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/CanSplit.lua?raw'
import lua_NoCloudtop     from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/NoCloudtop.lua?raw'
import lua_Options        from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/common/Options.lua?raw'

import lua_d_CaveOfFlame  from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/dungeons/CaveOfFlame.lua?raw'
import lua_d_Crypt        from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/dungeons/Crypt.lua?raw'
import lua_d_Deepwood     from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/dungeons/Deepwood.lua?raw'
import lua_d_DHC          from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/dungeons/DHC.lua?raw'
import lua_d_Droplet      from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/dungeons/Droplet.lua?raw'
import lua_d_Fortress     from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/dungeons/Fortress.lua?raw'
import lua_d_Palace       from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/dungeons/Palace.lua?raw'

import lua_o_Castle       from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/Castle.lua?raw'
import lua_o_Clouds       from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/Clouds.lua?raw'
import lua_o_Crenel       from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/Crenel.lua?raw'
import lua_o_CrenelBase   from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/CrenelBase.lua?raw'
import lua_o_Falls        from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/Falls.lua?raw'
import lua_o_FallsLower   from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/FallsLower.lua?raw'
import lua_o_Hills        from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/Hills.lua?raw'
import lua_o_Hylia        from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/Hylia.lua?raw'
import lua_o_LonLon       from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/LonLon.lua?raw'
import lua_o_MinishWoods  from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/MinishWoods.lua?raw'
import lua_o_NorthField   from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/NorthField.lua?raw'
import lua_o_Ruins        from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/Ruins.lua?raw'
import lua_o_SouthField   from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/SouthField.lua?raw'
import lua_o_Swamp        from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/Swamp.lua?raw'
import lua_o_Town         from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/Town.lua?raw'
import lua_o_Trilby       from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/Trilby.lua?raw'
import lua_o_Valley       from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/Valley.lua?raw'
import lua_o_WesternWoods from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/WesternWoods.lua?raw'
import lua_o_WindTribe    from '../../SubModule/tmcrando_maptracker_deoxis/scripts/logic/overworld/WindTribe.lua?raw'

// ── emo/scripts/locations/ — Json_ wrapper functions (referenced by access_rules) ──
import lua_j_Castle        from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Castle.lua?raw'
import lua_j_Clouds        from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Clouds.lua?raw'
import lua_j_Crenel        from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Crenel.lua?raw'
import lua_j_CrenelBase    from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/CrenelBase.lua?raw'
import lua_j_Falls         from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Falls.lua?raw'
import lua_j_FallsLower    from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/FallsLower.lua?raw'
import lua_j_Fusion        from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Fusion.lua?raw'
import lua_j_General       from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/General.lua?raw'
import lua_j_Hills         from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Hills.lua?raw'
import lua_j_Hylia         from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Hylia.lua?raw'
import lua_j_LonLon        from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/LonLon.lua?raw'
import lua_j_MinishWoods   from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/MinishWoods.lua?raw'
import lua_j_NorthField    from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/NorthField.lua?raw'
import lua_j_Ruins         from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Ruins.lua?raw'
import lua_j_SouthField    from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/SouthHyruleField.lua?raw'
import lua_j_Swamp         from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Swamp.lua?raw'
import lua_j_Town          from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Town.lua?raw'
import lua_j_Trilby        from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Trilby.lua?raw'
import lua_j_Valley        from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Valley.lua?raw'
import lua_j_WesternWoods  from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/WesternWoods.lua?raw'
import lua_j_d_CaveOfFlame from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Dungeons/CaveOfFlame.lua?raw'
import lua_j_d_Crypt       from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Dungeons/Crypt.lua?raw'
import lua_j_d_Deepwood    from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Dungeons/Deepwood.lua?raw'
import lua_j_d_DHC         from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Dungeons/DHC.lua?raw'
import lua_j_d_Droplet     from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Dungeons/Droplet.lua?raw'
import lua_j_d_Fortress    from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Dungeons/Fortress.lua?raw'
import lua_j_d_Palace      from '../../SubModule/tmcrando_maptracker_deoxis/emo/scripts/locations/Dungeons/Palace.lua?raw'

const LUA_FILES = [
  // --- logic helpers (must load before Json_ wrappers) ---
  ['common/Function',           lua_Function],
  ['common/Access',             lua_Access],
  ['common/Beam',               lua_Beam],
  ['common/CaveOfFlame',        lua_CaveOfFlame_c],
  ['common/Common',             lua_Common],
  ['common/DarkHyruleCastle',   lua_DHC_c],
  ['common/Deepwood',           lua_Deepwood_c],
  ['common/Droplet',            lua_Droplet_c],
  ['common/Elements',           lua_Elements],
  ['common/FortressOfWind',     lua_FortressOfWind],
  ['common/Fusion',             lua_Fusion],
  ['common/Overworld',          lua_Overworld],
  ['common/Openworld',          lua_Openworld],
  ['common/PalaceOfWind',       lua_PalaceOfWind],
  ['common/Settings',           lua_Settings],
  ['common/Sword',              lua_Sword],
  ['common/CanDamage',          lua_CanDamage],
  ['common/CanSplit',           lua_CanSplit],
  ['common/NoCloudtop',         lua_NoCloudtop],
  ['common/Options',            lua_Options],
  ['dungeons/CaveOfFlame',      lua_d_CaveOfFlame],
  ['dungeons/Crypt',            lua_d_Crypt],
  ['dungeons/Deepwood',         lua_d_Deepwood],
  ['dungeons/DHC',              lua_d_DHC],
  ['dungeons/Droplet',          lua_d_Droplet],
  ['dungeons/Fortress',         lua_d_Fortress],
  ['dungeons/Palace',           lua_d_Palace],
  ['overworld/Castle',          lua_o_Castle],
  ['overworld/Clouds',          lua_o_Clouds],
  ['overworld/Crenel',          lua_o_Crenel],
  ['overworld/CrenelBase',      lua_o_CrenelBase],
  ['overworld/Falls',           lua_o_Falls],
  ['overworld/FallsLower',      lua_o_FallsLower],
  ['overworld/Hills',           lua_o_Hills],
  ['overworld/Hylia',           lua_o_Hylia],
  ['overworld/LonLon',          lua_o_LonLon],
  ['overworld/MinishWoods',     lua_o_MinishWoods],
  ['overworld/NorthField',      lua_o_NorthField],
  ['overworld/Ruins',           lua_o_Ruins],
  ['overworld/SouthField',      lua_o_SouthField],
  ['overworld/Swamp',           lua_o_Swamp],
  ['overworld/Town',            lua_o_Town],
  ['overworld/Trilby',          lua_o_Trilby],
  ['overworld/Valley',          lua_o_Valley],
  ['overworld/WesternWoods',    lua_o_WesternWoods],
  ['overworld/WindTribe',       lua_o_WindTribe],
  // --- Json_ wrappers (read access_rules in JSON) ---
  ['locations/Castle',          lua_j_Castle],
  ['locations/Clouds',          lua_j_Clouds],
  ['locations/Crenel',          lua_j_Crenel],
  ['locations/CrenelBase',      lua_j_CrenelBase],
  ['locations/Falls',           lua_j_Falls],
  ['locations/FallsLower',      lua_j_FallsLower],
  ['locations/Fusion',          lua_j_Fusion],
  ['locations/General',         lua_j_General],
  ['locations/Hills',           lua_j_Hills],
  ['locations/Hylia',           lua_j_Hylia],
  ['locations/LonLon',          lua_j_LonLon],
  ['locations/MinishWoods',     lua_j_MinishWoods],
  ['locations/NorthField',      lua_j_NorthField],
  ['locations/Ruins',           lua_j_Ruins],
  ['locations/SouthHyruleField',lua_j_SouthField],
  ['locations/Swamp',           lua_j_Swamp],
  ['locations/Town',            lua_j_Town],
  ['locations/Trilby',          lua_j_Trilby],
  ['locations/Valley',          lua_j_Valley],
  ['locations/WesternWoods',    lua_j_WesternWoods],
  ['locations/Dungeons/CaveOfFlame', lua_j_d_CaveOfFlame],
  ['locations/Dungeons/Crypt',       lua_j_d_Crypt],
  ['locations/Dungeons/Deepwood',    lua_j_d_Deepwood],
  ['locations/Dungeons/DHC',         lua_j_d_DHC],
  ['locations/Dungeons/Droplet',     lua_j_d_Droplet],
  ['locations/Dungeons/Fortress',    lua_j_d_Fortress],
  ['locations/Dungeons/Palace',      lua_j_d_Palace],
]

// ── Singleton state ───────────────────────────────────────────────────────────

let L = null
let _provider = null

// ── Internal helpers ──────────────────────────────────────────────────────────

function toLS(s) { return to_luastring(s) }

function luaToString(idx) {
  const b = lua.lua_tostring(L, idx)
  return b ? to_jsstring(b) : null
}

function runLua(code, chunkName) {
  const src = toLS(code)
  const name = toLS(chunkName ?? '=(engine)')
  const loadStatus = lauxlib.luaL_loadbuffer(L, src, src.length, name)
  if (loadStatus !== lua.LUA_OK) {
    console.error('[luaEngine] load error in', chunkName ?? 'engine', ':', luaToString(-1))
    lua.lua_pop(L, 1)
    return false
  }
  const callStatus = lua.lua_pcall(L, 0, lua.LUA_MULTRET, 0)
  if (callStatus !== lua.LUA_OK) {
    console.error('[luaEngine] exec error in', chunkName ?? 'engine', ':', luaToString(-1))
    lua.lua_pop(L, 1)
    return false
  }
  return true
}

function setupTracker() {
  lua.lua_newtable(L)

  // Tracker:ProviderCountForCode(code) → number
  lua.lua_pushcfunction(L, (_L) => {
    const b = lua.lua_tostring(_L, 2)
    const code = b ? to_jsstring(b) : ''
    const count = _provider ? _provider.itemCount(code) : 0
    lua.lua_pushnumber(_L, count)
    return 1
  })
  lua.lua_setfield(L, -2, toLS('ProviderCountForCode'))

  // Tracker:FindObjectForCode(code) → table {AvailableChestCount, CurrentStage}
  lua.lua_pushcfunction(L, (_L) => {
    const b = lua.lua_tostring(_L, 2)
    const code = b ? to_jsstring(b) : ''
    lua.lua_newtable(_L)
    const avail = _provider ? _provider.sectionAvailable(code) : 1
    lua.lua_pushnumber(_L, avail)
    lua.lua_setfield(_L, -2, toLS('AvailableChestCount'))
    const stage = _provider ? _provider.itemCount(code) : 0
    lua.lua_pushnumber(_L, stage)
    lua.lua_setfield(_L, -2, toLS('CurrentStage'))
    return 1
  })
  lua.lua_setfield(L, -2, toLS('FindObjectForCode'))

  lua.lua_pushboolean(L, 0)
  lua.lua_setfield(L, -2, toLS('BulkUpdate'))

  lua.lua_setglobal(L, toLS('Tracker'))
}

function initGlobals() {
  runLua(`
    has_item_data         = {}
    has_item_data_dev     = {}
    function_data         = {}
    has_item_option_dev   = {}
    function_data_fusion  = {}
    setting_preset_data_other = {}
    setting_preset_data_title = {}
    setting_preset_data       = {}
    setting_preset_data_cache = -1
    Cache_reset    = true
    function_count = 0
    cache_number   = 0
    link_captures_cache = {}
    no_preset    = true
    PopVersion   = true
    VERSION_ALPHA = false
    VERSION_BETA  = true
    TMC_CACHE_DEBUG_FUNCTION = false
    TMC_CACHE_DEBUG_ITEM     = false
    setting_preset_version_customV2 = {[0]=0,[1]=0,[2]=0,[3]=0}
    AccessibilityLevel = { None = 0, SequenceBreak = 2, Inspect = 3 }
    local noop = function() end
    local subStub = { getActive = function() return 0 end, getActiveCount = function() return 0 end }
    redW = subStub; redV = subStub; redE = subStub
    blueL = subStub; blueS = subStub
    greenC = subStub; greenG = subStub; greenP = subStub
    swordprogress = { setActive = noop }
    redflag  = nil
    blueflag = nil
  `, '=(globals)')
}

function setupFusionCombined() {
  const colors = ['red', 'green', 'blue', 'gold']
  const noop = (_L) => 0
  for (const color of colors) {
    lua.lua_newtable(L)

    lua.lua_pushcfunction(L, (_L) => {
      const active = _provider ? _provider.getFusionCombined(color) : false
      lua.lua_pushboolean(_L, active ? 1 : 0)
      return 1
    })
    lua.lua_setfield(L, -2, toLS('getActive'))

    lua.lua_pushcfunction(L, (_L) => { lua.lua_pushnumber(_L, 0); return 1 })
    lua.lua_setfield(L, -2, toLS('getActiveCount'))

    lua.lua_pushcfunction(L, noop)
    lua.lua_setfield(L, -2, toLS('updateMax'))

    lua.lua_pushcfunction(L, noop)
    lua.lua_setfield(L, -2, toLS('setActive'))

    lua.lua_setglobal(L, toLS(`fusion${color}combined`))
  }
}

function initEngine() {
  L = lauxlib.luaL_newstate()
  lualib.luaL_openlibs(L)

  setupTracker()
  initGlobals()
  setupFusionCombined()

  let ok = 0
  let failed = 0
  for (const [name, code] of LUA_FILES) {
    if (runLua(code, name)) ok++
    else failed++
  }
  console.log(`[luaEngine] loaded ${ok}/${LUA_FILES.length} Lua files` + (failed ? ` (${failed} errors)` : ''))

  // Override has() to always read live from Tracker:ProviderCountForCode,
  // bypassing Function.lua's has_item_data cache that causes stale settings values.
  runLua(`
    function has(code, amount)
      amount = amount or 1
      return Tracker:ProviderCountForCode(code) >= amount
    end
  `, '=(override_has)')
}

function ensureInit() {
  if (L === null) initEngine()
}

// ── Public API ────────────────────────────────────────────────────────────────

export function setProvider(provider) {
  _provider = provider
}

export function resetCache() {
  ensureInit()
  runLua(`
    has_item_data    = {}
    function_data    = {}
    function_count   = 0
    function_data_fusion = {}
  `, '=(reset)')
}

// Returns { count: 0|1, luaLevel: 0|2|3 }
// Json_ functions return (count [, AccessibilityLevel.*])
// luaLevel: 0=normal, 2=SequenceBreak, 3=Inspect
export function callLuaFunction(name) {
  ensureInit()

  lua.lua_getglobal(L, toLS(name))
  if (lua.lua_type(L, -1) !== lua.LUA_TFUNCTION) {
    lua.lua_pop(L, 1)
    return { count: 0, luaLevel: 0 }
  }

  const status = lua.lua_pcall(L, 0, 2, 0)
  if (status !== lua.LUA_OK) {
    const msg = luaToString(-1)
    if (msg) console.warn('[luaEngine] error calling', name, ':', msg)
    lua.lua_pop(L, 1)
    return { count: 0, luaLevel: 0 }
  }

  // Stack: [-2 = first return (count), -1 = second return (level or nil)]
  const count    = Number(lua.lua_tonumber(L, -2)) || 0
  const luaLevel = lua.lua_type(L, -1) === lua.LUA_TNUMBER
    ? Number(lua.lua_tonumber(L, -1))
    : 0
  lua.lua_pop(L, 2)
  return { count, luaLevel }
}
