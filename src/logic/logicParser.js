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
          // !define - `NAME`  →  resolves NAME's value and activates it as a define.
          // e.g. MAP_SETTING='MAP_VANILLA' → substitutions['MAP_SETTING']='MAP_VANILLA'
          //      AND activeDefines['MAP_VANILLA']=true  (so !ifdef MAP_VANILLA works)
          const name  = rest.slice(1, -1)
          const value = String(activeDefines[name] ?? '')
          substitutions[name] = value
          if (value) activeDefines[value] = true
        } else {
          // !define - NAME - VALUE  (VALUE may contain backtick refs)
          const d = rest.indexOf(' - ')
          if (d >= 0) {
            const name = rest.slice(0, d)
            const value = _applySubs(rest.slice(d + 3), substitutions)
            substitutions[name] = value
            activeDefines[name] = value  // visible to subsequent !ifdef checks
          } else {
            substitutions[rest] = ''
            activeDefines[rest] = true   // bare !define → marks name as defined
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


// ─── 5c — Directive schema parser ────────────────────────────────────────────

// Token is a define name if it is all uppercase letters/digits/underscores,
// at least 2 chars (handles both ALL_CAPS_SNAKE and digit-prefixed like 5SWORD).
const _IS_DEFINE = /^[A-Z0-9][A-Z0-9_]+$/

/**
 * Parse !flag / !dropdown / !numberbox schema from the raw logic text.
 * Used later by settingsStringEncoder to build the UI settings panel.
 *
 * @param {string} rawText - raw default.logic content
 * @returns {{ flags: object[], dropdowns: object[], numberboxes: object[] }}
 */
export function parseDirectives(rawText) {
  const result = { flags: [], dropdowns: [], numberboxes: [] }

  for (const rawLine of rawText.split('\n')) {
    let line = rawLine
    const h = line.indexOf('#')
    if (h >= 0) line = line.slice(0, h)
    const trimmed = line.trim()
    if (!trimmed.startsWith('!')) continue

    // strip trailing " -" that some entries append after their last option description
    const parts = trimmed.split(' - ').map(p => p.replace(/ -$/, '').trim())
    const keyword = parts[0].slice(1)
    if (keyword !== 'flag' && keyword !== 'dropdown' && keyword !== 'numberbox') continue

    // Locate the first define-like token — that is the setting's DEFINE_NAME
    let di = -1
    for (let i = 1; i < parts.length; i++) {
      if (_IS_DEFINE.test(parts[i])) { di = i; break }
    }
    if (di < 0) continue

    const defineName = parts[di]

    if (keyword === 'flag') {
      const label = parts[di + 1] ?? ''
      // optional trailing "true" / "false" indicates the default value
      const last = parts[parts.length - 1]
      const defaultValue = last === 'true' ? true : last === 'false' ? false : undefined
      result.flags.push({ defineName, label, defaultValue })
    }

    else if (keyword === 'numberbox') {
      // DEFINE - label - description - defaultVal - min - max
      const label   = parts[di + 1] ?? ''
      const defVal  = Number(parts[di + 3] ?? parts[di + 2] ?? 0)
      const min     = Number(parts[di + 4] ?? parts[di + 3] ?? 0)
      const max     = Number(parts[di + 5] ?? parts[di + 4] ?? 0)
      result.numberboxes.push({ defineName, label, default: defVal, min, max })
    }

    else { // dropdown
      // After DEFINE: label [description_parts…] DEFAULT_DEFINE [opt_label OPT_DEFINE [opt_desc…]]…
      // Option descriptions always start with ' (single-quote).
      // Empty parts (from consecutive " - ") also count as descriptions to skip.
      const label = parts[di + 1] ?? ''

      let i = di + 2
      // skip description parts (non-define, non-empty) until we reach DEFAULT_DEFINE
      while (i < parts.length && !_IS_DEFINE.test(parts[i])) i++
      const defaultValue = parts[i] ?? ''
      i++

      const options = []
      while (i < parts.length) {
        // collect label words (non-define, non-quote, non-empty)
        // Strip leading "- " prefix: bare "-" description placeholders bleed into
        // the next part when the separator " - " is consumed (e.g. SWORD_SETTING).
        const labelParts = []
        while (i < parts.length &&
               !_IS_DEFINE.test(parts[i]) &&
               !parts[i].startsWith("'") &&
               parts[i] !== '') {
          const word = parts[i].replace(/^-\s+/, '')
          if (word) labelParts.push(word)
          i++
        }

        if (!_IS_DEFINE.test(parts[i] ?? '')) {
          // hit a quote-description or empty without finding a define — skip to next define
          while (i < parts.length && !_IS_DEFINE.test(parts[i])) i++
          continue
        }

        const optDefine = parts[i]
        i++

        // skip option description (empty or starts with ')
        while (i < parts.length && (parts[i] === '' || parts[i].startsWith("'"))) i++

        if (labelParts.length > 0) {
          options.push({ label: labelParts.join(' - '), defineName: optDefine })
        }
      }

      result.dropdowns.push({ defineName, label, defaultValue, options })
    }
  }

  return result
}


// ─── 5d — Location line parser ───────────────────────────────────────────────

// Detects compact-format lines where parts[1] holds an address or define
// reference rather than the type name (same heuristic as the Python extractor).
const _ADDR_PAT = /^0x[0-9A-Fa-f]|^\d+-|^[a-z]/

// Types that represent real locations or helpers we need for logic evaluation.
const _KEPT_TYPES = new Set([
  'Helper',
  'Any', 'Dungeon', 'Major', 'Minor', 'Nice',
  'Unshuffled', 'UnshuffledPrize', 'DungeonPrize',
])

// Name prefixes that indicate internal pool entries, not trackable locations.
const _SKIP_PREFIXES = ['Items.', 'Dummy_', 'Shared', 'FakeDojo']

/**
 * Parse preprocessed logic lines into location/helper descriptors.
 *
 * Line format: `Name[\`SUFFIX\`][; Type; Address; LogicStr[; Item]]`
 *
 * @param {string[]} lines  - output of preprocessLogic()
 * @returns {{ name: string, type: string, logicStr: string }[]}
 */
export function parseLocations(lines) {
  const result = []

  for (const line of lines) {
    const parts = line.split(';')
    if (parts.length < 2) continue

    const nameField = parts[0].trim()
    let   type      = parts[1].trim()

    // Compact format: type field holds an address/ROM define; real type is the
    // last backtick token embedded in the name field.
    if (_ADDR_PAT.test(type)) {
      const ticks = nameField.match(/`[^`]*`/g)
      type = ticks ? ticks[ticks.length - 1] : ''
    }

    // Filter by type — keep helpers and trackable location types only.
    const isBacktickType = type.startsWith('`') && type.endsWith('`')
    if (!_KEPT_TYPES.has(type) && !isBacktickType) continue

    // Clean name: strip backtick define suffixes and colon dungeon-ID suffixes.
    const name = nameField.replace(/`[^`]*`/g, '').split(':')[0].trim()
    if (!name) continue
    if (_SKIP_PREFIXES.some(p => name.startsWith(p))) continue

    // Logic string is the 4th field (index 3); empty = always accessible.
    const logicStr = (parts[3] ?? '').trim()

    result.push({ name, type, logicStr })
  }

  return result
}


// ─── 5e — Expression compiler ────────────────────────────────────────────────

// Set of helper names currently being evaluated — prevents infinite recursion.
const _evaluating = new Set()

// Always-false sentinel helpers used for inaccessible or infinite-resource gates.
const _ALWAYS_FALSE = new Set([
  'Helpers.Hundo', 'Helpers.Inaccessible', 'Helpers.InfiniteMoney',
])

/**
 * Split `str` on commas that are at parenthesis depth 0.
 * Trims and filters empty segments.
 */
function splitTopLevel(str) {
  const parts = []
  let depth = 0, start = 0
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if      (c === '(') depth++
    else if (c === ')') depth--
    else if (c === ',' && depth === 0) {
      parts.push(str.slice(start, i).trim())
      start = i + 1
    }
  }
  parts.push(str.slice(start).trim())
  return parts.filter(Boolean)
}

/**
 * Compile a logic expression string into an (inv, settings) => boolean function.
 *
 * Grammar:
 *   empty          → always true
 *   a, b, c        → AND (root-level commas)
 *   (| a, b, …)   → OR
 *   (& a, b, …)   → AND (explicit)
 *   (+ N, x:w, …) → weighted counter ≥ N
 *   Items.X[:N]    → item check (count ≥ N) via _itemCheck / _itemCount
 *   Helpers.X      → recursive helper lookup (cycle-safe)
 *   `TOKEN`        → unresolved substitution → fail-open (true)
 *
 * @param {string}          logicStr  - preprocessed logic expression
 * @param {Map<string,fn>}  helperMap - name → compiled helper fn
 * @returns {(inv:object, settings:object) => boolean}
 */
export function compileExpr(logicStr, helperMap) {
  if (!logicStr || !logicStr.trim()) return () => true
  const terms = splitTopLevel(logicStr)
  if (terms.length === 0) return () => true
  if (terms.length === 1) return _compileTerm(terms[0], helperMap)
  const fns = terms.map(t => _compileTerm(t, helperMap))
  return (inv, s) => fns.every(f => f(inv, s))
}

function _compileTerm(term, helperMap) {
  term = term.trim()
  if (!term) return () => true

  // ── Parenthesized expression ──────────────────────────────────────────────
  if (term.startsWith('(') && term.endsWith(')')) {
    const inner = term.slice(1, -1).trim()

    if (inner.startsWith('|')) {
      const fns = splitTopLevel(inner.slice(1)).map(t => _compileTerm(t, helperMap))
      return (inv, s) => fns.some(f => f(inv, s))
    }
    if (inner.startsWith('&')) {
      const fns = splitTopLevel(inner.slice(1)).map(t => _compileTerm(t, helperMap))
      return (inv, s) => fns.every(f => f(inv, s))
    }
    if (inner.startsWith('+')) {
      // Weighted counter: (+ threshold, item[:weight], ...)
      const parts = splitTopLevel(inner.slice(1))
      if (parts.length === 0) return () => true

      // Threshold — backtick token fallback to 4 (covers unresolved ELEMENT_COUNT)
      const rawN = parts[0].replace(/`[^`]*`/g, '4').trim()
      const threshold = parseFloat(rawN)
      if (isNaN(threshold)) return () => true

      // Build weighted contributors
      const contributors = parts.slice(1).map(p => {
        p = p.trim()
        if (p.startsWith('Helpers.') || p.startsWith('Locations.')) {
          // Boolean helper → contributes 0 or 1
          const fn = _compileTerm(p, helperMap)
          return (inv, s) => fn(inv, s) ? 1 : 0
        }
        if (p.startsWith('Items.')) {
          const ref = p.slice(6)
          // Last colon is the weight separator when followed only by digits/backticks
          const ci = ref.lastIndexOf(':')
          let name, weight
          if (ci > 0 && /^[\d`]/.test(ref.slice(ci + 1))) {
            name   = ref.slice(0, ci)
            const rawW = ref.slice(ci + 1).replace(/`[^`]*`/g, '1')
            weight = parseFloat(rawW) || 1
          } else {
            name   = ref
            weight = 1
          }
          // Item contributes count × weight to the sum
          return (inv) => _itemCount(name, inv) * weight
        }
        return () => 0
      })

      return (inv, s) => {
        let sum = 0
        for (const c of contributors) {
          sum += c(inv, s)
          if (sum >= threshold) return true
        }
        return false
      }
    }

    // Bare parentheses (no operator) → AND
    const fns = splitTopLevel(inner).map(t => _compileTerm(t, helperMap))
    return (inv, s) => fns.every(f => f(inv, s))
  }

  // ── Always-false sentinels ────────────────────────────────────────────────
  if (_ALWAYS_FALSE.has(term)) return () => false

  // ── Helper / Location reference ──────────────────────────────────────────
  if (term.startsWith('Helpers.') || term.startsWith('Locations.')) {
    const name = term.slice(term.indexOf('.') + 1)
    return (inv, s) => {
      if (_evaluating.has(name)) return false   // cycle → treat as inaccessible
      const fn = helperMap.get(name)
      if (!fn) return true                       // unknown helper → fail-open
      _evaluating.add(name)
      try { return fn(inv, s) } finally { _evaluating.delete(name) }
    }
  }

  // ── Item reference ────────────────────────────────────────────────────────
  if (term.startsWith('Items.')) {
    const ref = term.slice(6)
    const ci  = ref.lastIndexOf(':')
    if (ci > 0 && /^\d+$/.test(ref.slice(ci + 1))) {
      const name = ref.slice(0, ci)
      const min  = parseInt(ref.slice(ci + 1), 10) || 1
      return (inv) => _itemCheck(name, min, inv)
    }
    return (inv) => _itemCheck(ref, 1, inv)
  }

  // ── Unresolved backtick substitution → fail-open ─────────────────────────
  if (term.startsWith('`')) return () => true

  // ── Unknown token → fail-open ────────────────────────────────────────────
  return () => true
}

// ─── 5f — Item map ───────────────────────────────────────────────────────────

/** Shorthand: count how many of the named AP item are in the inventory. */
function _cnt(apName) {
  return { count: inv => inv[apName] || 0 }
}

/** Total number of distinct bottle slots filled (1–4). */
function _bottleCount(inv) {
  return ['Bottle 1', 'Bottle 2', 'Bottle 3', 'Bottle 4']
    .filter(b => (inv[b] || 0) >= 1).length
}

/**
 * Maps rando item names to { count: (inv) => number }.
 * Items absent from this map fall back to Infinity (fail-open) in _itemCount.
 */
const ITEM_MAP = {
  // ── Swords ──────────────────────────────────────────────────────────────────
  SmithSword:             _cnt("Smith's Sword"),
  SmithSwordQuest:        _cnt("Smith Sword (Quest)"),
  GreenSword:             _cnt("White Sword"),
  RedSword:               _cnt("White Sword (Two Elements)"),
  BlueSword:              _cnt("White Sword (Three Elements)"),
  FourSword:              _cnt("Four Sword"),
  'ProgressiveItem.0x00': _cnt("Progressive Sword"),
  // ── Bows ────────────────────────────────────────────────────────────────────
  Bow:                    _cnt("Bow"),
  LightArrow:             _cnt("Light Arrow"),
  'ProgressiveItem.0x01': _cnt("Progressive Bow"),
  // ── Boomerangs ──────────────────────────────────────────────────────────────
  Boomerang:              _cnt("Boomerang"),
  MagicBoomerang:         _cnt("Magic Boomerang"),
  'ProgressiveItem.0x02': _cnt("Progressive Boomerang"),
  // ── Shields ─────────────────────────────────────────────────────────────────
  Shield:                 _cnt("Shield"),
  MirrorShield:           _cnt("Mirror Shield"),
  'ProgressiveItem.0x03': _cnt("Progressive Shield"),
  // ── Spin Scrolls ────────────────────────────────────────────────────────────
  SpinAttack:             _cnt("Spin Attack"),
  FastSpin:               _cnt("Fast Spin Scroll"),
  FastSplit:              _cnt("Fast Split Scroll"),
  LongSpin:               _cnt("Long Spin"),
  GreatSpin:              _cnt("Greatspin"),
  'ProgressiveItem.0x04': _cnt("Progressive Spin Scroll"),
  // ── Tools ───────────────────────────────────────────────────────────────────
  GustJar:                _cnt("Gust Jar"),
  BombBag:                _cnt("Bomb Bag"),
  PegasusBoots:           _cnt("Pegasus Boots"),
  MoleMitts:              _cnt("Mole Mitts"),
  RocsCape:               _cnt("Roc's Cape"),
  PacciCane:              _cnt("Cane of Pacci"),
  Flippers:               _cnt("Flippers"),
  Ocarina:                _cnt("Ocarina"),
  Lantern:                _cnt("Lantern"),
  Firerod:                _cnt("Fire Rod"),
  RemoteBombs:            _cnt("Remote Bomb"),
  GripRing:               _cnt("Grip Ring"),
  PowerBracelets:         _cnt("Power Bracelets"),
  LargeQuiver:            _cnt("Quiver"),
  Wallet:                 _cnt("Big Wallet"),
  // ── Combat skills ───────────────────────────────────────────────────────────
  RockBreaker:            _cnt("Rock Breaker"),
  DashAttack:             _cnt("Dash Attack"),
  DownThrust:             _cnt("DownThrust"),
  RollAttack:             _cnt("Roll Attack"),
  SwordBeam:              _cnt("Sword Beam"),
  PerilBeam:              _cnt("Peril Beam"),
  // ── Quest items ─────────────────────────────────────────────────────────────
  TingleTrophy:           _cnt("Tingle Trophy"),
  LonLonKey:              _cnt("LonLon Key"),
  JabberNut:              _cnt("Jabber Nut"),
  WakeUpMushroom:         _cnt("Wakeup Mushroom"),
  GraveyardKey:           _cnt("Graveyard Key"),
  CarlovMedal:            _cnt("Carlov Medal"),
  BrokenPicoriBlade:      _cnt("Broken Picori Blade"),
  DogFoodBottle:          _cnt("Dog Food"),
  // ── Elements ────────────────────────────────────────────────────────────────
  EarthElement:           _cnt("Earth Element"),
  FireElement:            _cnt("Fire Element"),
  WaterElement:           _cnt("Water Element"),
  WindElement:            _cnt("Wind Element"),
  // ── Books ───────────────────────────────────────────────────────────────────
  RedBook:                _cnt("Red Book (Hyrulian Bestiary)"),
  GreenBook:              _cnt("Green Book (Picori Legend)"),
  BlueBook:               _cnt("Blue Book (History of Masks)"),
  // ── Hearts ──────────────────────────────────────────────────────────────────
  PieceOfHeart:           _cnt("Piece of Heart"),
  HeartContainer:         _cnt("Heart Container"),
  // ── Butterfly upgrades ───────────────────────────────────────────────────────
  ArrowButterfly:         _cnt("Bow Butterfly"),
  DigButterfly:           _cnt("Dig Butterfly"),
  SwimButterfly:          _cnt("Swim Butterfly"),
  // ── Small Keys ──────────────────────────────────────────────────────────────
  'SmallKey.0x18':        _cnt("Small Key (DWS)"),
  'SmallKey.0x19':        _cnt("Small Key (CoF)"),
  'SmallKey.0x1A':        _cnt("Small Key (FoW)"),
  'SmallKey.0x1B':        _cnt("Small Key (ToD)"),
  'SmallKey.0x1C':        _cnt("Small Key (PoW)"),
  'SmallKey.0x1D':        _cnt("Small Key (DHC)"),
  'SmallKey.0x1E':        _cnt("Small Key (RC)"),
  // ToD specific door flags → map to ToD small keys
  'ToDKeys.0xa':          _cnt("Small Key (ToD)"),
  'ToDKeys.0xb':          _cnt("Small Key (ToD)"),
  // ── Big Keys ────────────────────────────────────────────────────────────────
  'BigKey.0x18':          _cnt("Big Key (DWS)"),
  'BigKey.0x19':          _cnt("Big Key (CoF)"),
  'BigKey.0x1A':          _cnt("Big Key (FoW)"),
  'BigKey.0x1B':          _cnt("Big Key (ToD)"),
  'BigKey.0x1C':          _cnt("Big Key (PoW)"),
  'BigKey.0x1D':          _cnt("Big Key (DHC)"),
  // ── Dungeon Maps ────────────────────────────────────────────────────────────
  'DungeonMap.0x18':      _cnt("Dungeon Map (DWS)"),
  'DungeonMap.0x19':      _cnt("Dungeon Map (CoF)"),
  'DungeonMap.0x1A':      _cnt("Dungeon Map (FoW)"),
  'DungeonMap.0x1B':      _cnt("Dungeon Map (ToD)"),
  'DungeonMap.0x1C':      _cnt("Dungeon Map (PoW)"),
  'DungeonMap.0x1D':      _cnt("Dungeon Map (DHC)"),
  // ── Compasses ───────────────────────────────────────────────────────────────
  'Compass.0x18':         _cnt("Dungeon Compass (DWS)"),
  'Compass.0x19':         _cnt("Dungeon Compass (CoF)"),
  'Compass.0x1A':         _cnt("Dungeon Compass (FoW)"),
  'Compass.0x1B':         _cnt("Dungeon Compass (ToD)"),
  'Compass.0x1C':         _cnt("Dungeon Compass (PoW)"),
  'Compass.0x1D':         _cnt("Dungeon Compass (DHC)"),
  // ── Kinstones ───────────────────────────────────────────────────────────────
  'Kinstone.RedE':            _cnt("Kinstone Red E"),
  'Kinstone.RedV':            _cnt("Kinstone Red >"),
  'Kinstone.RedW':            _cnt("Kinstone Red W"),
  'Kinstone.Red':             { count: inv => (inv["Kinstone Red E"] || 0) + (inv["Kinstone Red >"] || 0) + (inv["Kinstone Red W"] || 0) },
  'Kinstone.BlueL':           _cnt("Kinstone Blue L"),
  'Kinstone.BlueS':           _cnt("Kinstone Blue 6"),
  'Kinstone.GreenC':          _cnt("Kinstone Green ["),
  'Kinstone.GreenG':          _cnt("Kinstone Green <"),
  'Kinstone.GreenP':          _cnt("Kinstone Green P"),
  'Kinstone.GoldenCloudTops': _cnt("Kinstone Cloud Tops"),
  'Kinstone.GoldenSwamp':     _cnt("Kinstone Swamp"),
  'Kinstone.GoldenFalls':     _cnt("Kinstone Falls"),
  // ── Bottles ─────────────────────────────────────────────────────────────────
  // Plain Bottle: total filled slots; Bottle1/2/3: need >=N slots filled
  Bottle:  { count: inv => _bottleCount(inv) },
  Bottle1: { count: inv => _bottleCount(inv) >= 1 ? 1 : 0 },
  Bottle2: { count: inv => _bottleCount(inv) >= 2 ? 1 : 0 },
  Bottle3: { count: inv => _bottleCount(inv) >= 3 ? 1 : 0 },
  // Bottle.0xNN (content-type variants) handled dynamically in _itemCount
}

/**
 * Returns how many of `name` the inventory contains.
 * Bottle.0xNN items are content-type variants that all mean "has any bottle".
 * Items absent from ITEM_MAP return Infinity (fail-open: untracked = no block).
 */
function _itemCount(name, inv) {
  const entry = ITEM_MAP[name]
  if (entry) return entry.count(inv)
  // Bottle.0xNN: content-type doesn't matter — just check if any bottle is held
  if (name.startsWith('Bottle.0x')) return _bottleCount(inv)
  return Infinity
}

/**
 * Returns true when the inventory holds at least `min` of `name`.
 */
function _itemCheck(name, min, inv) {
  return _itemCount(name, inv) >= min
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
  // LAKE_CREST and TOWN_CREST default to true in rando (no AP toggle)
  d['LAKE_CREST'] = true
  d['TOWN_CREST'] = true
  setFlag('CRENEL_CREST',    settings.windCrestCrenel)
  setFlag('FALLS_CREST',     settings.windCrestFalls)
  setFlag('CLOUD_CREST',     settings.windCrestClouds)
  setFlag('SWAMP_CREST',     settings.windCrestCastor)   // Castor Wilds = Swamp crest
  setFlag('SHF_CREST',       settings.windCrestSouthField)
  setFlag('MINISH_CREST',    settings.windCrestMinishWoods)

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

  // ── Dungeon entrance shuffle ─────────────────────────────────────────────
  // ENTRANCES_VANILLA activates the !define - ENTERDWS/ENTERFOW/etc. block so
  // that dungeon location logicStrs include their proper access helper.
  // Without this, `ENTERDWS` backtick references stay unresolved and fail-open.
  if (settings.dungeonEntranceShuffle) setOption('ENTRANCES', 'ENTRANCES_COUPLED')
  else                                  setOption('ENTRANCES', 'ENTRANCES_VANILLA')

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

  // ── Pedestal element count ───────────────────────────────────────────────
  // e.g. pedElements = 4 → d['4ELEMENT'] = true → preprocessor resolves ELEMENT_COUNT = 4
  const pedElems = settings.pedElements ?? 4
  d[`${pedElems}ELEMENT`] = true

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


// ─── 5g — Full parse + compile assembly ──────────────────────────────────────

// Last-call memoization: avoids recompiling when rawText + settings are unchanged.
let _memoRawText    = null
let _memoDefinesKey = null
let _memoResult     = null

/**
 * Parse and compile a .logic file into ready-to-call rule functions.
 *
 * Returns:
 *   LOCATION_RULES — plain object keyed by rando location name OR "Helpers.XFusion"
 *                    (covers all possible key_rando values in location_meta.json)
 *   HELPERS        — Map<name, fn> for all Helper entries
 *   DIRECTIVES     — { flags, dropdowns, numberboxes } from parseDirectives
 *
 * Result is memoized: same rawText + same settings → same object reference.
 *
 * @param {string} rawText  - raw content of the .logic file
 * @param {Object} settings - settingsStore state (or exportSettings() snapshot)
 * @returns {{ LOCATION_RULES: Object, HELPERS: Map, DIRECTIVES: Object }}
 */
export function parseLogic(rawText, settings) {
  const defines    = settingsToDefines(settings)
  const definesKey = JSON.stringify(defines)

  if (rawText === _memoRawText && definesKey === _memoDefinesKey) {
    return _memoResult
  }

  // 1 — Pre-process: apply ifdef/define/substitutions
  const lines = preprocessLogic(rawText, defines)

  // 2 — Extract directive schema (flags/dropdowns/numberboxes) from raw text
  const directives = parseDirectives(rawText)

  // 3 — Parse location + helper descriptors from preprocessed lines
  const allEntries = parseLocations(lines)

  // 4 — Pass 1: build helperMap (lazy refs → forward declarations work fine)
  const helperMap = new Map()
  for (const entry of allEntries) {
    if (entry.type === 'Helper') {
      helperMap.set(entry.name, compileExpr(entry.logicStr, helperMap))
    }
  }

  // 5 — Pass 2: compile LOCATION_RULES
  // Helpers are also indexed under "Helpers.Name" so key_rando = "Helpers.XFusion" resolves.
  const LOCATION_RULES = {}
  for (const [name, fn] of helperMap) {
    LOCATION_RULES[`Helpers.${name}`] = fn
  }
  for (const entry of allEntries) {
    if (entry.type !== 'Helper') {
      LOCATION_RULES[entry.name] = compileExpr(entry.logicStr, helperMap)
    }
  }

  _memoRawText    = rawText
  _memoDefinesKey = definesKey
  _memoResult     = { LOCATION_RULES, HELPERS: helperMap, DIRECTIVES: directives }
  return _memoResult
}
