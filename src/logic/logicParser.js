/**
 * Runtime parser for default.logic (TMC randomizer logic file).
 *
 * Steps implemented here:
 *   5a — preprocessLogic(rawText, defines)  → string[]
 *   5b — settingsToDefines(settings)         → object
 */

// ─── 5a — Pre-processor ──────────────────────────────────────────────────────

/**
 * Pre-process default.logic with the given active defines.
 *
 * Handles:
 *   !define / !eventdefine / !undefine
 *   !ifdef / !ifndef / !else / !endif
 *   backtick substitution (`NAME`)
 *   Strips # comments; drops all other directives (!flag, !dropdown, …)
 *
 * @param {string} rawText  - raw content of default.logic
 * @param {Object} defines  - { [NAME]: string|true } — active setting defines
 * @returns {string[]}       - processed non-directive content lines
 */
export function preprocessLogic(rawText, defines) {
  const activeDefines = { ...defines }
  // substitutions[NAME] = expansion string for `NAME` backtick references
  const substitutions = {}

  // Conditional stack: each frame = { active: bool, seenElse: bool }
  // `active` already incorporates parent activation.
  const stack = []
  const isActive = () => stack.length === 0 || stack[stack.length - 1].active

  const output = []

  for (const rawLine of rawText.split('\n')) {
    let line = rawLine
    // Strip inline comment
    const h = line.indexOf('#')
    if (h >= 0) line = line.slice(0, h)
    const trimmed = line.trim()
    if (!trimmed) continue

    if (!trimmed.startsWith('!')) {
      if (isActive()) {
        const processed = _applySubs(trimmed, substitutions)
        if (processed) output.push(processed)
      }
      continue
    }

    // Directive — parse "!keyword" and optional "- rest"
    const m = trimmed.match(/^!(\w+)(?:\s*-\s*(.*))?$/)
    if (!m) continue
    const keyword = m[1]
    const rest    = (m[2] ?? '').trim()

    switch (keyword) {
      case 'ifdef':
        stack.push({ active: isActive() && rest in activeDefines, seenElse: false })
        break

      case 'ifndef':
        stack.push({ active: isActive() && !(rest in activeDefines), seenElse: false })
        break

      case 'else': {
        if (stack.length === 0) break
        const top = stack[stack.length - 1]
        if (top.seenElse) break
        // Parent activation (all frames except the current top)
        const parentActive = stack.length < 2 || stack[stack.length - 2].active
        top.active = parentActive && !top.active
        top.seenElse = true
        break
      }

      case 'endif':
        if (stack.length > 0) stack.pop()
        break

      case 'define':
        if (!isActive()) break
        if (rest.startsWith('`') && rest.endsWith('`')) {
          // !define - `NAME`  →  load value from activeDefines
          const name = rest.slice(1, -1)
          substitutions[name] = String(activeDefines[name] ?? '')
        } else {
          // !define - NAME - VALUE  (VALUE may contain backtick refs)
          const d = rest.indexOf(' - ')
          if (d >= 0) {
            substitutions[rest.slice(0, d)] = _applySubs(rest.slice(d + 3), substitutions)
          } else {
            substitutions[rest] = ''
          }
        }
        break

      case 'eventdefine':
        if (!isActive()) break
        {
          const d = rest.indexOf(' - ')
          if (d >= 0) {
            activeDefines[rest.slice(0, d)] = _applySubs(rest.slice(d + 3), substitutions)
          } else {
            activeDefines[rest] = true
          }
        }
        break

      case 'undefine':
        if (!isActive()) break
        delete activeDefines[rest]
        delete substitutions[rest]
        break

      // !flag, !dropdown, !numberbox, !replace, !import, … — ignored
      default:
        break
    }
  }

  return output
}

/** Replace `NAME` backtick tokens with entries from the substitutions map. */
function _applySubs(text, substitutions) {
  return text.replace(/`([^`]*)`/g, (match, name) =>
    name in substitutions ? substitutions[name] : match
  )
}


// ─── 5b — Settings → defines ─────────────────────────────────────────────────

/**
 * Convert the tracker's settingsStore state into the `defines` object
 * expected by preprocessLogic().
 *
 * For every enum-style setting the selected option becomes:
 *   defines['SETTING_NAME'] = 'SELECTED_OPTION'
 *   defines['SELECTED_OPTION'] = true
 *
 * For every boolean flag the define name is added when true.
 *
 * @param {Object} settings  - settingsStore.exportSettings() snapshot or $state
 * @returns {Object}          - { [DEFINE_NAME]: string|true }
 */
export function settingsToDefines(settings) {
  const d = {}

  function setOption(settingKey, optionName) {
    d[settingKey]  = optionName
    d[optionName]  = true
  }
  function setFlag(defineName, value) {
    if (value) d[defineName] = true
  }

  // tricks is a Set on the live store, an Array in exportSettings() snapshots
  const _tricks = settings.tricks
  const hasTrick = (key) => {
    if (!_tricks) return false
    if (_tricks instanceof Set) return _tricks.has(key)
    if (Array.isArray(_tricks)) return _tricks.includes(key)
    return false
  }

  // ── Wind Crests ──────────────────────────────────────────────────────────
  // LAKE_CREST and TOWN_CREST default to true in rando and have no AP toggle
  d['LAKE_CREST'] = true
  d['TOWN_CREST'] = true
  setFlag('CRENEL_CREST',    settings.windCrestCrenel)
  setFlag('FALLS_CREST',     settings.windCrestFalls)
  setFlag('CLOUD_CREST',     settings.windCrestClouds)
  setFlag('SHF_CREST',       settings.windCrestSouthField)
  setFlag('MINISH_CREST',    settings.windCrestMinishWoods)
  // windCrestCastor maps to TOWN_CREST but we already force it true above
  // (Castor Wilds crest — always enabled in AP)

  // ── Dungeon Warps ────────────────────────────────────────────────────────
  setFlag('DWS_BLUEWARP',  (settings.warpDWS ?? 0) >= 1)
  setFlag('DWS_REDWARP',   (settings.warpDWS ?? 0) >= 2)
  setFlag('COF_BLUEWARP',  (settings.warpCoF ?? 0) >= 1)
  setFlag('COF_REDWARP',   (settings.warpCoF ?? 0) >= 2)
  setFlag('FOW_BLUEWARP',  (settings.warpFoW ?? 0) >= 1)
  setFlag('FOW_REDWARP',   (settings.warpFoW ?? 0) >= 2)
  setFlag('TOD_BLUEWARP',  (settings.warpToD ?? 0) >= 1)
  setFlag('TOD_REDWARP',   (settings.warpToD ?? 0) >= 2)
  setFlag('POW_BLUEWARP',  (settings.warpPoW ?? 0) >= 1)
  setFlag('POW_REDWARP',   (settings.warpPoW ?? 0) >= 2)
  setFlag('DHC_BLUEWARP',  (settings.warpDHC ?? 0) >= 1)
  setFlag('DHC_REDWARP',   (settings.warpDHC ?? 0) >= 2)

  // ── Open World ───────────────────────────────────────────────────────────
  // AP has no open-world traversal mode
  setOption('OPENWORLD', 'OPENWORLD_OFF')

  // ── Shuffle flags ────────────────────────────────────────────────────────
  setFlag('HEART_RANDO',   true)                       // hearts always shuffled in AP
  setFlag('DIGGING',       settings.shuffleDigging)
  setFlag('UNDERWATER',    settings.shuffleUnderwater)
  setFlag('SPECIALPOTS',   settings.shufflePots)
  setFlag('GOLDEN_ENEMY',  settings.shuffleGoldEnemies)
  setFlag('RUPEEMANIA',    settings.rupeesanity)
  setFlag('SHOP_BOMBBAG',  settings.extraShopItem)

  // ── Element shuffle ──────────────────────────────────────────────────────
  // AP values: 'vanilla' | 'dungeon_prize' | 'anywhere'
  const elems = settings.shuffleElements ?? 'dungeon_prize'
  if (elems === 'vanilla')       setOption('SHUFFLE_ELEMENTS', 'SHUFFLE_ELEMENTS_VANILLA')
  else if (elems === 'anywhere') setOption('SHUFFLE_ELEMENTS', 'SHUFFLE_ELEMENTS_ON')
  else                           setOption('SHUFFLE_ELEMENTS', 'SHUFFLE_ELEMENTS_OFF')

  // ── Dungeon item settings ────────────────────────────────────────────────
  // Small Keys
  const sk = settings.dungeonSmallKeys ?? 'own_dungeon'
  if (sk === 'anywhere') setOption('SMALL_KEYS_SETTING', 'SMALL_KEYSANITY')
  else                   setOption('SMALL_KEYS_SETTING', 'SMALL_KEYS_STANDARD')

  // Big Keys
  const bk = settings.dungeonBigKeys ?? 'own_dungeon'
  if (bk === 'anywhere') setOption('BIG_KEYS_SETTING', 'BIG_KEYSANITY')
  else                   setOption('BIG_KEYS_SETTING', 'BIG_KEYS_STANDARD')

  // Maps
  const maps = settings.dungeonMaps ?? 'own_dungeon'
  if (maps === 'anywhere')    setOption('MAP_SETTING', 'MAP_KEYSANITY')
  else if (maps === 'start_with') setOption('MAP_SETTING', 'MAP_KEASY')
  else                        setOption('MAP_SETTING', 'MAP_STANDARD')

  // Compasses
  const comp = settings.dungeonCompasses ?? 'own_dungeon'
  if (comp === 'anywhere')    setOption('COMPASS_SETTING', 'COMPASS_KEYSANITY')
  else if (comp === 'start_with') setOption('COMPASS_SETTING', 'COMPASS_KEASY')
  else                        setOption('COMPASS_SETTING', 'COMPASS_STANDARD')

  // ── Pedestal / requirements ──────────────────────────────────────────────
  const pedReward = settings.pedReward ?? 'none'
  setFlag('PED_ITEMS', pedReward !== 'none')
  if (pedReward === 'dhc_big_key')  setOption('REQUIREMENT_ITEM', 'REQUIREMENT_ITEM_DHC_BK')
  else if (pedReward === 'random_item') setOption('REQUIREMENT_ITEM', 'REQUIREMENT_ITEM_RANDOM')
  else                              setOption('REQUIREMENT_ITEM', 'REQUIREMENT_ITEM_NONE')

  // Sword requirement (0–5; 5 = Four Sword)
  const pedSwords = settings.pedSwords ?? 5
  setOption('SWORD_SETTING', `${pedSwords}SWORD`)

  // ── DHC access ───────────────────────────────────────────────────────────
  const dhc = settings.dhcAccess ?? 'pedestal'
  if (dhc === 'open')    setOption('DHC_SETTING', 'OPENDHC')
  else if (dhc === 'closed') setOption('DHC_SETTING', 'NODHC')
  else                    setOption('DHC_SETTING', 'NORMALDHC')

  // ── Kinstone Fusions ─────────────────────────────────────────────────────
  // 'closed' in AP ≡ no fusions in pool (same as rando 'none')
  const gold = settings.goldFusionAccess ?? 'vanilla'
  if (gold === 'closed' || gold === 'none') setOption('GOLD_FUSION_SETTING', 'NO_GOLD_FUSIONS')
  else if (gold === 'combined')             setOption('GOLD_FUSION_SETTING', 'COMBINED_GOLD_FUSIONS')
  else if (gold === 'open')                 setOption('GOLD_FUSION_SETTING', 'OPEN_GOLD_FUSIONS')
  else                                      setOption('GOLD_FUSION_SETTING', 'VANILLA_GOLD_FUSIONS')

  const red = settings.redFusionAccess ?? 'open'
  if (red === 'closed' || red === 'none')   setOption('RED_FUSION_SETTING', 'NO_RED_FUSIONS')
  else if (red === 'combined')              setOption('RED_FUSION_SETTING', 'COMBINED_RED_FUSIONS')
  else if (red === 'open')                  setOption('RED_FUSION_SETTING', 'OPEN_RED_FUSIONS')
  else                                      setOption('RED_FUSION_SETTING', 'VANILLA_RED_FUSIONS')

  const blue = settings.blueFusionAccess ?? 'open'
  if (blue === 'closed' || blue === 'none') setOption('BLUE_FUSION_SETTING', 'NO_BLUE_FUSIONS')
  else if (blue === 'combined')             setOption('BLUE_FUSION_SETTING', 'COMBINED_BLUE_FUSIONS')
  else if (blue === 'open')                 setOption('BLUE_FUSION_SETTING', 'OPEN_BLUE_FUSIONS')
  else                                      setOption('BLUE_FUSION_SETTING', 'VANILLA_BLUE_FUSIONS')

  const green = settings.greenFusionAccess ?? 'open'
  if (green === 'closed' || green === 'none') setOption('GREEN_FUSION_SETTING', 'NO_GREEN_FUSIONS')
  else if (green === 'combined')              setOption('GREEN_FUSION_SETTING', 'COMBINED_GREEN_FUSIONS')
  else if (green === 'open')                  setOption('GREEN_FUSION_SETTING', 'OPEN_GREEN_FUSIONS')
  else                                        setOption('GREEN_FUSION_SETTING', 'VANILLA_GREEN_FUSIONS')

  // ── Cucco setting ────────────────────────────────────────────────────────
  if ((settings.cuccoRounds ?? 1) > 0) setOption('CUCCO_SETTING', 'RANDOM_CUCCOS')
  else                                  setOption('CUCCO_SETTING', 'VANILLA_CUCCOS')

  // ── Goron Merchant sets ──────────────────────────────────────────────────
  const goronSets = settings.goronSets ?? 0
  for (let i = 1; i <= 5; i++) {
    if (goronSets >= i) d[`GORON_${i}`] = true
  }
  setOption('GORON_SETTING', `GORON_${goronSets}`)
  setFlag('GORON_ALT_PRICES', settings.goronJPPrices)

  // ── Biggoron ─────────────────────────────────────────────────────────────
  const biggoron = settings.biggoron ?? 'disabled'
  if (biggoron === 'shield')             setOption('BIGGORON_SETTING', 'BIGGORON_NORMAL')
  else if (biggoron === 'mirror_shield') setOption('BIGGORON_SETTING', 'BIGGORON_MIRROR')
  else                                   setOption('BIGGORON_SETTING', 'BIGGORON_OFF')

  // ── Progressive items ────────────────────────────────────────────────────
  setFlag('YES_SWORD_PROG',  settings.progressiveSword)
  setFlag('YES_BOW_PROG',    settings.progressiveBow)
  setFlag('YES_BOOM_PROG',   settings.progressiveBoomerang)
  setFlag('YES_SHIELD_PROG', settings.progressiveShield)
  setFlag('YES_SCROLL_PROG', settings.progressiveScroll)

  // ── Misc item pool ───────────────────────────────────────────────────────
  setFlag('RANDOM_BOTTLE_CONTENT', settings.randomBottleContents)
  setFlag('TRAPS',                 settings.trapsEnabled)

  // ── Boots on L ──────────────────────────────────────────────────────────
  if (settings.bootsAsMinish && settings.bootsOnL) setOption('BOOTS_L', 'BOOTS_L_MINISH')
  else if (settings.bootsOnL)                       setOption('BOOTS_L', 'BOOTS_L_NORMAL')
  else                                              setOption('BOOTS_L', 'BOOTS_L_OFF')

  // ── Tricks ───────────────────────────────────────────────────────────────
  setFlag('LAKE_MINISH_TRICKS', hasTrick('lake_minish'))
  setFlag('YESLAKEMINISH',      hasTrick('lake_minish'))

  return d
}
