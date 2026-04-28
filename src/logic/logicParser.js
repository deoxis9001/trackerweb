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
  setFlag('CRENEL_CREST',   settings.windCrestCrenel)
  setFlag('FALLS_CREST',    settings.windCrestFalls)
  setFlag('CLOUD_CREST',    settings.windCrestClouds)
  setFlag('TOWN_CREST',     settings.windCrestCastor)
  setFlag('SHF_CREST',      settings.windCrestSouthField)
  setFlag('MINISH_CREST',   settings.windCrestMinishWoods)

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
  // AP has no open-world mode — always use vanilla traversal
  setOption('OPENWORLD', 'OPENWORLD_OFF')

  // ── Kinstone Fusions ─────────────────────────────────────────────────────
  // 'closed' in AP ≡ 'none' in rando (no fusions in pool)
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
  // cuccoRounds > 0 means cucco NPCs are randomized
  if ((settings.cuccoRounds ?? 1) > 0) setOption('CUCCO_SETTING', 'RANDOM_CUCCOS')
  else                                  setOption('CUCCO_SETTING', 'VANILLA_CUCCOS')

  // ── Dig spots ────────────────────────────────────────────────────────────
  setFlag('KINSTONE_DIGS', settings.shuffleDigging)

  // ── Goron Merchant sets ──────────────────────────────────────────────────
  const goronSets = settings.goronSets ?? 0
  for (let i = 1; i <= 5; i++) {
    if (goronSets >= i) d[`GORON_${i}`] = true
  }
  setOption('GORON_SETTING', `GORON_${goronSets}`)

  // ── Biggoron ─────────────────────────────────────────────────────────────
  const biggoron = settings.biggoron ?? 'disabled'
  if (biggoron === 'shield')         setOption('BIGGORON_SETTING', 'BIGGORON_NORMAL')
  else if (biggoron === 'mirror_shield') setOption('BIGGORON_SETTING', 'BIGGORON_MIRROR')
  else                                setOption('BIGGORON_SETTING', 'BIGGORON_OFF')

  // ── DHC access ───────────────────────────────────────────────────────────
  const dhc = settings.dhcAccess ?? 'pedestal'
  if (dhc === 'open')    setOption('DHC_SETTING', 'OPENDHC')
  else if (dhc === 'closed') setOption('DHC_SETTING', 'NODHC')
  else                    setOption('DHC_SETTING', 'NORMALDHC')

  // ── Pedestal items ───────────────────────────────────────────────────────
  setFlag('PED_ITEMS', settings.pedReward != null && settings.pedReward !== 'none')

  // ── Tricks ───────────────────────────────────────────────────────────────
  setFlag('LAKE_MINISH_TRICKS', hasTrick('lake_minish'))
  setFlag('YESLAKEMINISH',      hasTrick('lake_minish'))

  return d
}
