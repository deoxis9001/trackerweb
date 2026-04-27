/**
 * TMC Logic Rules — ported from TMC-APWorld/tmc/rules.py
 *
 * Inventory = { [itemName]: count }
 * Settings  = settingsStore values
 *
 * Each rule is a function (inv, settings) => boolean
 */

// ─── Primitives ──────────────────────────────────────────────────────────────

export const always = () => true
export const never  = () => false

export function has(item, count = 1) {
  return (inv) => (inv[item] || 0) >= count
}

export function hasAny(...items) {
  return (inv) => items.some(i => (inv[i] || 0) >= 1)
}

export function hasAll(...items) {
  return (inv) => items.every(i => (inv[i] || 0) >= 1)
}

export function and(...rules) {
  return (inv, s) => rules.every(r => r(inv, s))
}

export function or(...rules) {
  return (inv, s) => rules.some(r => r(inv, s))
}

// Trick: returns true if the trick is enabled in settings
export function trick(key) {
  return (inv, s) => s.hasTrick(key)
}

// ─── Derived item predicates ─────────────────────────────────────────────────

export const hasSword = (inv, s) =>
  hasAny("Smith's Sword", "White Sword", "White Sword (Two Elements)",
         "White Sword (Three Elements)", "Four Sword")(inv) ||
  (s.progressiveSword && (inv["Progressive Sword"] || 0) >= 1)

export const hasShield = (inv, s) =>
  hasAny("Shield", "Mirror Shield")(inv) ||
  (s.progressiveShield && (inv["Progressive Shield"] || 0) >= 1)

export const hasMirrorShield = (inv, s) =>
  has("Mirror Shield")(inv) ||
  (s.progressiveShield && (inv["Progressive Shield"] || 0) >= 2)

export const hasBow = (inv, s) =>
  hasAny("Bow", "Light Arrow")(inv) ||
  (s.progressiveBow && (inv["Progressive Bow"] || 0) >= 1) ||
  s.weaponBow

export const hasLightArrows = (inv, s) =>
  has("Light Arrow")(inv) ||
  (s.progressiveBow && (inv["Progressive Bow"] || 0) >= 2)

export const hasBoomerang = (inv, s) =>
  hasAny("Boomerang", "Magic Boomerang")(inv) ||
  (s.progressiveBoomerang && (inv["Progressive Boomerang"] || 0) >= 1)

export const hasMagicBoomerang = (inv, s) =>
  has("Magic Boomerang")(inv) ||
  (s.progressiveBoomerang && (inv["Progressive Boomerang"] || 0) >= 2)

export const hasBombWeapon = (inv, s) =>
  (s.weaponBomb > 0) || has("Bomb Bag")(inv)
export const hasBombWeaponBoss = (inv, s) =>
  (s.weaponBomb >= 2) || has("Bomb Bag", 2)(inv)
export const hasGustWeapon = (inv, s) => s.weaponGust || has("Gust Jar")(inv)
export const hasLanternWeapon = (inv, s) => s.weaponLantern || has("Lantern")(inv)

export const hasWeapon = (inv, s) => hasSword(inv, s) || hasBow(inv, s) || hasBombWeapon(inv, s)
export const hasWeaponBoss = (inv, s) => hasSword(inv, s) || hasBombWeapon(inv, s)
export const hasWeaponScissor = (inv, s) => hasSword(inv, s) || hasBombWeaponBoss(inv, s)
export const hasWeaponWizzrobe = (inv, s) =>
  hasSword(inv, s) || hasBombWeapon(inv, s) || hasBow(inv, s) || hasLanternWeapon(inv, s)

// Scroll ability helpers — gèrent les deux modes : progressif et individuel
// Mode progressif (progressiveScroll=true) : chaque "Progressive Spin Scroll" = +1 niveau
// Mode individuel (progressiveScroll=false) : items séparés
const scrollLevel = (inv, s) =>
  s.progressiveScroll
    ? (inv["Progressive Spin Scroll"] || 0)
    : 99  // en mode individuel, les items séparés sont vérifiés directement

export const hasSpin      = (inv, s) => has("Spin Attack")(inv)      || scrollLevel(inv, s) >= 1
export const hasFastSpin  = (inv, s) => has("Fast Spin Scroll")(inv) || scrollLevel(inv, s) >= 2
export const hasFastSplit = (inv, s) => has("Fast Split Scroll")(inv)|| scrollLevel(inv, s) >= 3
export const hasGreatSpin = (inv, s) => has("Greatspin")(inv)        || scrollLevel(inv, s) >= 4
export const hasLongSpin  = (inv, s) => has("Long Spin")(inv)        || scrollLevel(inv, s) >= 5

// Sword count helpers for CanSplit (requires N swords + spin)
export const canSpin = (inv, s) =>
  hasSword(inv, s) && hasSpin(inv, s)

export const canBeam = (inv, s) =>
  hasSword(inv, s) && hasAny("Sword Beam", "Peril Beam")(inv)

export const canHitDistance = (inv, s) =>
  hasBoomerang(inv, s) || has("Bomb Bag")(inv) || hasBow(inv, s) || canBeam(inv, s)

// CanSplit(n) = have n+1 swords OR nth sword + spin
const ORDERED_SWORDS = [
  "Smith's Sword", "White Sword", "White Sword (Two Elements)",
  "White Sword (Three Elements)", "Four Sword"
]
export function canSplit(linkCount, allowMax = false) {
  return (inv, s) => {
    if (!canSpin(inv, s)) return false
    if (s.progressiveSword) {
      return (inv["Progressive Sword"] || 0) >= linkCount + 1
    }
    if (allowMax) {
      return ORDERED_SWORDS.slice(linkCount).some(sw => (inv[sw] || 0) >= 1)
    }
    return (inv[ORDERED_SWORDS[linkCount]] || 0) >= 1
  }
}

// ─── Trick-gated helpers ─────────────────────────────────────────────────────

export const blowDust = (inv, s) =>
  (hasBombWeapon(inv, s) && trick('bomb_dust')(inv, s)) || has("Gust Jar")(inv)

export const mushroom = (inv, s) =>
  (has("Gust Jar")(inv) && trick('mushroom')(inv, s)) ||
  hasAny("Bomb Bag", "Grip Ring")(inv)

export const arrowBreak = (inv, s) => hasLightArrows(inv, s) && trick('arrows_break')(inv, s)

export const likelike = (inv, s) =>
  (hasWeapon(inv, s) && has("Mole Mitts")(inv)) || trick('likelike_swordless')(inv, s)

export const darkRoom = (inv, s) => has("Lantern")(inv) || s.hasTrick('dark_rooms')

export const capeExtend = (inv, s) =>
  (has("Roc's Cape")(inv) && trick('cape_extensions')(inv, s)) || has("Flippers")(inv)

export const lakeMinish = (inv, s) =>
  has("Pegasus Boots")(inv) ||
  (has("Ocarina")(inv) && has("Flippers")(inv) && trick('lake_minish')(inv, s))

export const cabinSwim = (inv) => has("Flippers")(inv)

export const fowPot = (inv, s) => has("Gust Jar")(inv) && trick('fow_pot')(inv, s)

export const powJump = (inv, s) =>
  (has("Roc's Cape")(inv) && trick('pow_nocane')(inv, s)) ||
  and(has("Cane of Pacci"), has("Roc's Cape"), canSplit(3))(inv, s)

export const downthrust = (inv, s) =>
  hasSword(inv, s) && has("Roc's Cape")(inv) && has("DownThrust")(inv)

export const sharkKill = (inv, s) => hasWeapon(inv, s) || trick('sharks_swordless')(inv, s)

function hasScrolls(n) {
  return (inv) => {
    const count =
      (inv["Progressive Spin Scroll"] || 0) +
      (inv["Spin Attack"]      ? 1 : 0) +
      (inv["Roll Attack"]      ? 1 : 0) +
      (inv["Dash Attack"]      ? 1 : 0) +
      (inv["Rock Breaker"]     ? 1 : 0) +
      (inv["Sword Beam"]       ? 1 : 0) +
      (inv["Greatspin"]        ? 1 : 0) +
      (inv["DownThrust"]       ? 1 : 0) +
      (inv["Peril Beam"]       ? 1 : 0) +
      (inv["Fast Spin Scroll"] ? 1 : 0) +
      (inv["Fast Split Scroll"]? 1 : 0) +
      (inv["Long Spin"]        ? 1 : 0)
    return count >= n
  }
}

export const canPassTrees = (inv, s) =>
  hasAny("Bomb Bag", "Lantern")(inv) || hasSword(inv, s) || arrowBreak(inv, s)

// ─── Wallet / pay ────────────────────────────────────────────────────────────

function walletRequired(price) {
  if (price <= 100) return 0
  if (price <= 300) return 1
  if (price <= 500) return 2
  return 3
}
export function canPay(price) {
  return (inv) => (inv["Big Wallet"] || 0) >= walletRequired(price)
}

// ─── Named region-access helpers ─────────────────────────────────────────────

export const accessTownLeft = (inv, s) =>
  hasAny("Roc's Cape", "Flippers", "Cane of Pacci")(inv)

export const hasBottle = (inv) =>
  ["Bottle (Null)", "Bottle 1", "Bottle 2", "Bottle 3", "Bottle 4"]
    .some(b => (inv[b] || 0) >= 1)

export const accessTownFountain = (inv, s) =>
  accessTownLeft(inv, s) && hasBottle(inv)

export const accessLonLonRight = (inv, s) =>
  hasAny("LonLon Key", "Roc's Cape", "Ocarina")(inv) ||
  (has("Flippers")(inv) && has("Mole Mitts")(inv))

export const accessMinishWoodsTopLeft = (inv, s) =>
  hasAny("Flippers", "Roc's Cape")(inv) ||
  (accessLonLonRight(inv, s) && has("Cane of Pacci")(inv))

const hasAllBooks = hasAll(
  "Red Book (Hyrulian Bestiary)",
  "Green Book (Picori Legend)",
  "Blue Book (History of Masks)",
)

export const completeBookQuest = (inv) =>
  has("Ocarina")(inv) && has("Cane of Pacci")(inv) && hasAllBooks(inv)

export const hasMaxHealth = (hearts) => (inv, s) => {
  if ((s.startingHearts || 3) >= hearts) return true
  const containers = inv["Heart Container"] || 0
  const pieces = inv["Piece of Heart"] || 0
  return (s.startingHearts || 3) + containers + Math.floor(pieces / 4) >= hearts
}

// ─── Wind crests (Ocarina + option) ──────────────────────────────────────────
// Crests require Ocarina AND the option to be enabled in settings
export const crenelCrest = (inv, s) => has("Ocarina")(inv) && !!s.windCrestCrenel
export const fallsCrest  = (inv, s) => has("Ocarina")(inv) && !!s.windCrestFalls
export const cloudsCrest = (inv, s) => has("Ocarina")(inv) && !!s.windCrestClouds
export const swampCrest  = (inv, s) => has("Ocarina")(inv) && !!s.windCrestCastor
export const smithCrest  = (inv, s) => has("Ocarina")(inv) && !!s.windCrestSouthField
export const minishCrest = (inv, s) => has("Ocarina")(inv) && !!s.windCrestMinishWoods

// ─── Gold fusion helpers ──────────────────────────────────────────────────────
export const cloudsAllCanFuse = (inv, s) =>
  s.goldFusionAccess === 'open' ||
  (s.goldFusionAccess === 'vanilla' && (inv["Kinstone Cloud Tops"] || 0) >= 5) ||
  (s.goldFusionAccess === 'combined' && (inv["Kinstone Cloud Tops"] || 0) >= 9) ||
  (s.hasTrick('partial_kinstone') && (inv["Kinstone Cloud Tops"] || 0) >= 1)

export const swampsAllCanFuse = (inv, s) =>
  s.goldFusionAccess === 'open' ||
  (s.goldFusionAccess === 'vanilla' && (inv["Kinstone Swamp"] || 0) >= 3) ||
  (s.goldFusionAccess === 'combined' && (inv["Kinstone Cloud Tops"] || 0) >= 9) ||
  (s.hasTrick('partial_kinstone') && (inv["Kinstone Swamp"] || 0) >= 1)

export const fallsCanFuse = (inv) =>
  has("Kinstone Falls")(inv) ||
  (inv["Kinstone Cloud Tops"] || 0) >= 4

export const cloudsHasFusion = (inv, s) =>
  s.goldFusionAccess === 'open' ||
  hasAll(
    "Top Right Pinwheel",
    "Bottom Left Pinwheel",
    "Top Left Pinwheel",
    "Middle Pinwheel",
    "Bottom Right Pinwheel",
  )(inv)

export const swampsHasFusion = (inv, s) =>
  s.goldFusionAccess === 'open' ||
  hasAll(
    "West Statue Bashes Floor",
    "Middle Statue Bashes Floor",
    "East Statue Bashes Floor",
  )(inv)

export const fallsHasFusion = (inv, s) =>
  s.goldFusionAccess === 'open' || has("Veil Falls Kinstone Door Opens")(inv)

// ─── Dungeon key helpers ──────────────────────────────────────────────────────

export const dwsKey  = (n) => has("Small Key (DWS)", n)
export const cofKey  = (n) => has("Small Key (CoF)", n)
export const fowKey  = (n) => has("Small Key (FoW)", n)
export const todKey  = (n) => has("Small Key (ToD)", n)
export const rcKey   = (n) => has("Small Key (RC)", n)
export const powKey  = (n) => has("Small Key (PoW)", n)
export const dhcKey  = (n) => has("Small Key (DHC)", n)

// ─── Pedestal requirement ─────────────────────────────────────────────────────

const PEDESTAL_ELEMENTS = ["Earth Element", "Fire Element", "Water Element", "Wind Element"]
const DUNGEON_CLEARS    = ["Clear DWS", "Clear CoF", "Clear FoW", "Clear ToD", "Clear RC", "Clear PoW"]

export const canActivatePedestal = (inv, s) => {
  if ((s.pedElements || 0) > 0) {
    const count = PEDESTAL_ELEMENTS.filter(e => (inv[e] || 0) >= 1).length
    if (count < s.pedElements) return false
  }
  if ((s.pedSwords || 0) > 0) {
    const progCount   = inv["Progressive Sword"] || 0
    const hasTierSword = (inv[ORDERED_SWORDS[s.pedSwords - 1]] || 0) >= 1
    if (progCount < s.pedSwords && !hasTierSword) return false
  }
  if ((s.pedDungeons || 0) > 0) {
    const count = DUNGEON_CLEARS.filter(c => (inv[c] || 0) >= 1).length
    if (count < s.pedDungeons) return false
  }
  if ((s.pedFigurines || 0) > 0) {
    if ((inv["Figurine"] || 0) < s.pedFigurines) return false
  }
  return true
}

// ─── DHC warp helpers ─────────────────────────────────────────────────────────

const dhcPads = (inv, s) =>
  canSplit(2, true)(inv, s) || trick('dhc_clones')(inv, s) || canSplit(4)(inv, s)
const dhcCannons = (inv, s) =>
  (hasSword(inv, s) && hasBombWeapon(inv, s)) || trick('dhc_cannons')(inv, s) || canSplit(4)(inv, s)
const dhcSpin = (inv, s) =>
  canSpin(inv, s) || trick('dhc_spin')(inv, s) || canSplit(4)(inv, s)
const dhcSwitchGap = (inv, s) =>
  hasBow(inv, s) || hasBoomerang(inv, s) || canBeam(inv, s)
const dhcSouthTowers = (inv, s) =>
  s.warpDHC !== 0 || hasAny("Bomb Bag", "Roc's Cape")(inv)

// ─── REGION RULES ────────────────────────────────────────────────────────────
// dict: region → { connected_region: rule | null }
// rule = null means always accessible from parent

export const REGION_RULES = {
  MENU: {
    SOUTH_FIELD: always,
    FUSIONS: always,
  },
  FUSIONS: {},
  SOUTH_FIELD: {
    HYRULE_TOWN: always,
    EASTERN_HILLS: smithCrest,
    SOUTH_PUDDLE: (inv, s) => canPassTrees(inv, s) || hasAny("Roc's Cape", "Flippers")(inv),
    LAKE_HYLIA_NORTH: has("Ocarina"),
    BELARI: minishCrest,
    CASTOR_WILDS: swampCrest,
    WIND_TRIBE: cloudsCrest,
    UPPER_FALLS: fallsCrest,
    MELARI: crenelCrest,
  },
  SOUTH_PUDDLE: {
    SOUTH_FIELD: (inv, s) => canPassTrees(inv, s) || hasAny("Roc's Cape", "Flippers")(inv),
  },
  HYRULE_TOWN: {
    NORTH_FIELD: always,
    SOUTH_FIELD: always,
    LONLON: has("Bomb Bag"),
    TRILBY_HIGHLANDS: (inv, s) => canSpin(inv, s) || (has("Pegasus Boots")(inv) && trick('boots_guards')(inv, s)),
  },
  NORTH_FIELD: {
    CASTLE_EXTERIOR: always,
    HYRULE_TOWN: always,
    LONLON: canPassTrees,
    TRILBY_HIGHLANDS: hasAny("Flippers", "Roc's Cape"),
    FALLS_ENTRANCE: has("Bomb Bag"),
    ROYAL_VALLEY: (inv, s) => canSplit(3, true)(inv, s) && capeExtend(inv, s),
  },
  CASTLE_EXTERIOR: {
    NORTH_FIELD: always,
    SANCTUARY: always,
    DUNGEON_DHC_ENTRANCE: (inv, s) => s.dhcAccess === 'open',
  },
  LONLON: {
    HYRULE_TOWN: has("Bomb Bag"),
    NORTH_FIELD: canPassTrees,
    EASTERN_HILLS: has("Bomb Bag"),
    MINISH_WOODS: always,
    LOWER_FALLS: has("Cane of Pacci"),
    LAKE_HYLIA_NORTH: has("LonLon Key"),
  },
  EASTERN_HILLS: {
    LONLON: has("Bomb Bag"),
    BELARI: has("Bomb Bag"),
    SOUTH_FIELD: canPassTrees,
  },
  LAKE_HYLIA_NORTH: {
    LONLON: always,
    LAKE_HYLIA_SOUTH: capeExtend,
    DUNGEON_TOD_ENTRANCE: capeExtend,
  },
  MINISH_WOODS: {
    LONLON: always,
    LAKE_HYLIA_SOUTH: (inv, s) => accessMinishWoodsTopLeft(inv, s) && has("Mole Mitts")(inv),
    LAKE_HYLIA_NORTH: has("Roc's Cape"),
    DUNGEON_DWS_ENTRANCE: hasAny("Flippers", "Jabber Nut"),
    BELARI: (inv, s) => hasAny("Bomb Bag")(inv) || has("Clear DWS")(inv),
  },
  BELARI: {
    MINISH_WOODS: always,
    EASTERN_HILLS: has("Bomb Bag"),
  },
  WESTERN_WOODS: {
    SOUTH_PUDDLE: always,
    CASTOR_WILDS: hasAny("Pegasus Boots", "Roc's Cape"),
    TRILBY_HIGHLANDS: always,
  },
  TRILBY_HIGHLANDS: {
    HYRULE_TOWN: always,
    NORTH_FIELD: (inv, s) =>
      hasAny("Roc's Cape", "Flippers")(inv) || (has("Cane of Pacci")(inv) && hasSword(inv, s)),
    WESTERN_WOODS: canSplit(2, true),
    CRENEL_BASE: hasBottle,
  },
  CRENEL_BASE: {
    TRILBY_HIGHLANDS: always,
    CRENEL: (inv, s) =>
      has("Grip Ring")(inv) ||
      (hasBombWeapon(inv, s) && blowDust(inv, s) && hasBottle(inv)),
  },
  CRENEL: {
    CRENEL_BASE: has("Grip Ring"),
    MELARI: (inv, s) =>
      (mushroom(inv, s) && has("Cane of Pacci")(inv)) ||
      (has("Grip Ring")(inv) &&
        hasAny("Gust Jar", "Roc's Cape")(inv) || arrowBreak(inv, s)) &&
        (hasBow(inv, s) || hasBoomerang(inv, s) || hasBombWeapon(inv, s) ||
         has("Roc's Cape")(inv) || (canBeam(inv, s) && trick('beam_crenel_switch')(inv, s))),
  },
  MELARI: {
    CRENEL: always,
    DUNGEON_COF_ENTRANCE: always,
  },
  CASTOR_WILDS: {
    WESTERN_WOODS: (inv, s) => hasAny("Pegasus Boots", "Roc's Cape")(inv) || hasBow(inv, s),
    WIND_RUINS: (inv, s) =>
      (swampsHasFusion(inv, s) || swampsAllCanFuse(inv, s)) &&
      hasAny("Roc's Cape", "Pegasus Boots")(inv) &&
      (swampCrest(inv, s) || hasBow(inv, s) || has("Flippers")(inv)),
  },
  WIND_RUINS: {
    DUNGEON_FOW_ENTRANCE: (inv, s) => hasSword(inv, s) && hasWeapon(inv, s),
  },
  ROYAL_VALLEY: {
    NORTH_FIELD: always,
    TRILBY_HIGHLANDS: always,
    GRAVEYARD: (inv, s) =>
      hasAll("Graveyard Key", "Pegasus Boots")(inv) && darkRoom(inv, s),
  },
  GRAVEYARD: {
    DUNGEON_RC: canSplit(3),
  },
  DUNGEON_RC: {
    DUNGEON_RC_CLEAR: (inv, s) =>
      hasWeapon(inv, s) && rcKey(3)(inv) && has("Lantern")(inv),
  },
  FALLS_ENTRANCE: {
    MIDDLE_FALLS: (inv, s) => (fallsHasFusion(inv, s) || fallsCanFuse(inv)) && darkRoom(inv, s),
  },
  MIDDLE_FALLS: {
    FALLS_ENTRANCE: has("Flippers"),
    UPPER_FALLS: has("Grip Ring"),
  },
  UPPER_FALLS: {
    MIDDLE_FALLS: has("Grip Ring"),
    CLOUDS: has("Grip Ring"),
  },
  CLOUDS: {
    UPPER_FALLS: has("Grip Ring"),
    WIND_TRIBE: (inv, s) =>
      (cloudsHasFusion(inv, s) || cloudsAllCanFuse(inv, s)) &&
      hasAny("Mole Mitts", "Roc's Cape")(inv) &&
      (hasWeapon(inv, s) || trick('sharks_swordless')(inv, s)),
  },
  WIND_TRIBE: {
    CLOUDS: always,
    DUNGEON_POW_ENTRANCE: always,
  },
  // DWS
  DUNGEON_DWS_ENTRANCE: {
    DUNGEON_DWS_BARREL: (inv, s) =>
      (dwsKey(4)(inv) && (s.warpDWS === 1 || s.warpDWS === 3)) ||
      (dwsKey(1)(inv) && s.warpDWS !== 1 && s.warpDWS !== 3),
    DUNGEON_DWS_BLUE_WARP: (inv, s) => s.warpDWS === 1 || s.warpDWS === 3,
    DUNGEON_DWS_RED_WARP: (inv, s) => s.warpDWS === 2 || s.warpDWS === 3,
    DUNGEON_DWS_CLEAR: (inv, s) =>
      has("Big Key (DWS)")(inv) && has("Gust Jar")(inv) && hasWeaponBoss(inv, s),
  },
  DUNGEON_DWS_BLUE_WARP: { DUNGEON_DWS_BACK_HALF: always },
  DUNGEON_DWS_BARREL: {
    DUNGEON_DWS_MULLDOZER: dwsKey(4),
    DUNGEON_DWS_BACK_HALF: (inv, s) =>
      dwsKey(2)(inv) || has("Gust Jar")(inv) || (s.warpDWS !== 1 && s.warpDWS !== 3),
    DUNGEON_DWS_RED_WARP: (inv, s) => dwsKey(4)(inv) && has("Gust Jar")(inv),
  },
  DUNGEON_DWS_BACK_HALF: {
    DUNGEON_DWS_BLUE_WARP: blowDust,
    DUNGEON_DWS_BARREL: always,
  },
  DUNGEON_DWS_MULLDOZER: { DUNGEON_DWS_BACK_HALF: always },
  // CoF
  DUNGEON_COF_ENTRANCE: {
    DUNGEON_COF_MAIN: (inv, s) =>
      (hasBombWeapon(inv, s) || ((hasSword(inv, s) || has("Gust Jar")(inv)) && trick('bobomb_walls')(inv, s))) &&
      hasWeapon(inv, s) &&
      (hasShield(inv, s) || hasAny("Cane of Pacci", "Bomb Bag")(inv) ||
       (downthrust(inv, s) && trick('downthrust_beetle')(inv, s))),
    DUNGEON_COF_BLUE_WARP: (inv, s) => s.warpCoF === 1 || s.warpCoF === 3,
    DUNGEON_COF_LAVA_BASEMENT: (inv, s) => s.warpCoF === 2 || s.warpCoF === 3,
  },
  DUNGEON_COF_MAIN: {
    DUNGEON_COF_MINECART: (inv, s) =>
      ((cofKey(2)(inv) && (s.warpCoF === 1 || s.warpCoF === 3)) ||
       (cofKey(1)(inv) && s.warpCoF !== 1 && s.warpCoF !== 3)) &&
      hasSword(inv, s),
  },
  DUNGEON_COF_MINECART: {
    DUNGEON_COF_BLUE_WARP: (inv, s) =>
      hasWeapon(inv, s) && hasAny("Cane of Pacci", "Roc's Cape")(inv),
  },
  DUNGEON_COF_BLUE_WARP: {
    DUNGEON_COF_MINECART: has("Cane of Pacci"),
    DUNGEON_COF_LAVA_BASEMENT: (inv, s) =>
      hasSword(inv, s) && cofKey(2)(inv) && has("Cane of Pacci")(inv),
  },
  DUNGEON_COF_LAVA_BASEMENT: {
    DUNGEON_COF_CLEAR: (inv, s) =>
      hasSword(inv, s) && hasWeaponBoss(inv, s) &&
      hasAll("Cane of Pacci", "Big Key (CoF)")(inv),
  },
  // FoW
  DUNGEON_FOW_ENTRANCE: {
    DUNGEON_FOW_EYEGORE: hasBow,
    DUNGEON_FOW_BLUE_WARP: (inv, s) =>
      (hasWeaponBoss(inv, s) && (s.warpFoW === 1 || s.warpFoW === 3)) ||
      (s.warpFoW !== 1 && s.warpFoW !== 3),
    DUNGEON_FOW_CLEAR: (inv, s) =>
      hasAll("Mole Mitts", "Big Key (FoW)")(inv) && hasBow(inv, s) && hasWeaponBoss(inv, s),
  },
  DUNGEON_FOW_EYEGORE: {
    DUNGEON_FOW_BLUE_WARP: fowKey(4),
  },
  DUNGEON_FOW_BLUE_WARP: { DUNGEON_FOW_EYEGORE: always },
  // ToD
  DUNGEON_TOD_ENTRANCE: {
    DUNGEON_TOD_LEFT_BASEMENT: (inv, s) => hasWeaponScissor(inv, s) && (s.warpToD === 1 || s.warpToD === 3),
    DUNGEON_TOD_WEST_SWITCH_LEDGE: (inv, s) =>
      hasAll("Bomb Bag", "Lantern")(inv) && hasWeaponBoss(inv, s) && (s.warpToD === 2 || s.warpToD === 3),
    DUNGEON_TOD_MAIN: has("Big Key (ToD)"),
  },
  DUNGEON_TOD_WEST_SWITCH_LEDGE: {
    DUNGEON_TOD_MAIN: always,
    DUNGEON_TOD_WEST_SWITCH: canSplit(2),
  },
  DUNGEON_TOD_LEFT_BASEMENT: {
    DUNGEON_TOD_MAIN: always,
    DUNGEON_TOD_DARK_MAZE_END: has("Roc's Cape"),
    DUNGEON_TOD_EAST_SWITCH: canSplit(2),
  },
  DUNGEON_TOD_MAIN: {
    DUNGEON_TOD_LEFT_BASEMENT: (inv, s) =>
      todKey(4)(inv) && hasAll("Flippers", "Gust Jar")(inv),
    DUNGEON_TOD_DARK_MAZE_END: (inv, s) =>
      has("Lantern")(inv) && hasWeaponScissor(inv, s) && todKey(4)(inv),
    DUNGEON_TOD_CLEAR: (inv, s) =>
      (hasShield(inv, s) || hasSword(inv, s)) &&
      has("Lantern")(inv) &&
      canSplit(2)(inv, s),
  },
  // PoW
  DUNGEON_POW_ENTRANCE: {
    DUNGEON_POW_BLUE_WARP: (inv, s) =>
      hasWeaponBoss(inv, s) && (s.warpPoW === 1 || s.warpPoW === 3),
    DUNGEON_POW_RED_WARP: (inv, s) => s.warpPoW === 2 || s.warpPoW === 3,
    DUNGEON_POW_OUT_1F: (inv, s) =>
      canSplit(3)(inv, s) && (canHitDistance(inv, s) || hasAny("Roc's Cape", "Gust Jar")(inv)),
  },
  DUNGEON_POW_OUT_1F: { DUNGEON_POW_OUT_2F: powJump },
  DUNGEON_POW_OUT_2F: {
    DUNGEON_POW_OUT_3F: (inv, s) => canSplit(3)(inv, s) && has("Roc's Cape")(inv),
  },
  DUNGEON_POW_OUT_3F: {
    DUNGEON_POW_OUT_4F: (inv, s) =>
      (powKey(1)(inv)) && has("Roc's Cape")(inv),
  },
  DUNGEON_POW_OUT_4F: { DUNGEON_POW_OUT_5F: has("Roc's Cape") },
  DUNGEON_POW_OUT_5F: {
    DUNGEON_POW_BLUE_WARP: (inv, s) => has("Big Key (PoW)")(inv) && hasWeaponBoss(inv, s),
  },
  DUNGEON_POW_BLUE_WARP: { DUNGEON_POW_IN_1F: darkRoom },
  DUNGEON_POW_IN_1F: { DUNGEON_POW_IN_2F: always },
  DUNGEON_POW_IN_2F: {
    DUNGEON_POW_IN_1F: darkRoom,
    DUNGEON_POW_IN_3F: (inv, s) => has("Roc's Cape")(inv),
  },
  DUNGEON_POW_IN_3F: {
    DUNGEON_POW_IN_2F: always,
    DUNGEON_POW_IN_4F: hasWeapon,
  },
  DUNGEON_POW_IN_4F: {
    DUNGEON_POW_IN_3F: always,
    DUNGEON_POW_RED_WARP: (inv, s) => has("Roc's Cape")(inv) && canHitDistance(inv, s),
  },
  DUNGEON_POW_RED_WARP: {
    DUNGEON_POW_IN_3F: has("Bomb Bag"),
    DUNGEON_POW_IN_4F: hasAll("Bomb Bag", "Roc's Cape"),
    DUNGEON_POW_IN_5F: (inv, s) => powKey(5)(inv) && hasBombWeapon(inv, s),
  },
  DUNGEON_POW_IN_5F: {
    DUNGEON_POW_IN_3F: always,
    DUNGEON_POW_IN_4F_END: (inv, s) =>
      (has("Power Bracelets")(inv) && powKey(1)(inv)) ||
      (powKey(6)(inv) && trick('pot_puzzle')(inv, s)),
  },
  DUNGEON_POW_IN_4F_END: {
    DUNGEON_POW_IN_5F_END: has("Roc's Cape"),
    DUNGEON_POW_CLEAR: (inv, s) =>
      has("Roc's Cape")(inv) && has("Big Key (PoW)")(inv) && canSplit(3)(inv, s),
  },
  // Sanctuary → DHC
  SANCTUARY: {
    CASTLE_EXTERIOR: always,
    STAINED_GLASS: canActivatePedestal,
  },
  STAINED_GLASS: {
    DUNGEON_DHC_B1_WEST: (inv, s) => s.dhcAccess !== 'closed',
  },
  DUNGEON_DHC_B1_WEST: {
    SANCTUARY: always,
    DUNGEON_DHC_B2: has("Bomb Bag"),
    DUNGEON_DHC_ENTRANCE: always,
  },
  DUNGEON_DHC_B2: { DUNGEON_DHC_B1_WEST: always },
  DUNGEON_DHC_ENTRANCE: {
    DUNGEON_DHC_B1_WEST: always,
    CASTLE_EXTERIOR: always,
    DUNGEON_DHC_BLUE_WARP: (inv, s) =>
      hasWeaponBoss(inv, s) && (s.warpDHC === 1 || s.warpDHC === 3),
    DUNGEON_DHC_RED_WARP: (inv, s) =>
      hasWeapon(inv, s) && (s.warpDHC === 2 || s.warpDHC === 3),
    DUNGEON_DHC_B1_EAST: (inv, s) =>
      (s.warpDHC !== 0 ? dhcKey(5)(inv) : dhcKey(1)(inv)) && dhcCannons(inv, s) && hasBombWeapon(inv, s),
  },
  DUNGEON_DHC_B1_EAST: {
    DUNGEON_DHC_1F: hasWeaponBoss,
  },
  DUNGEON_DHC_1F: { DUNGEON_DHC_OUTSIDE: always },
  DUNGEON_DHC_OUTSIDE: {
    DUNGEON_DHC_RED_WARP: (inv, s) =>
      canSplit(4)(inv, s) && dhcSwitchGap(inv, s) && hasWeapon(inv, s),
  },
  DUNGEON_DHC_RED_WARP: {
    DUNGEON_DHC_BLUE_WARP: (inv, s) =>
      has("Roc's Cape")(inv) && dhcSwitchGap(inv, s) &&
      hasAny("Bomb Bag", "Gust Jar")(inv) && hasWeaponBoss(inv, s),
  },
  LAKE_HYLIA_SOUTH: {
    DUNGEON_TOD_ENTRANCE: capeExtend,
  },
  LOWER_FALLS: {
    LAKE_HYLIA_SOUTH: always,
  },
}

// ─── LOCATION RULES ──────────────────────────────────────────────────────────
// Location key (from data/locations.json name field) → rule | null

export const LOCATION_RULES = {
  // South Field
  "Smith's House Chest": always,
  "Smith's House Left Item": always,
  "Smith's House Right Item": always,
  "South Field Minish Size Water Hole Item": (inv, s) =>
    canPassTrees(inv, s) && hasAll("Pegasus Boots", "Flippers")(inv),
  // Hyrule Town
  "Town Cafe Lady NPC": always,
  "Town Shoe Shop NPC": has("Wakeup Mushroom"),
  "Town Shop 80 Item": canPay(80),
  "Town Shop 300 Item": canPay(300),
  "Town Shop 600 Item": canPay(600),
  "Town Shop 600 Item 2": canPay(600),
  "Town Shop Behind Counter Item": accessTownLeft,
  "Town Shop Attic Chest": accessTownLeft,
  "Town Bakery Attic Chest": accessTownLeft,
  "Town Inn Backdoor HP": accessTownLeft,
  "Town Inn Ledge Chest": has("Lantern"),
  "Town Inn Pot": always,
  "Town Well Right Chest": always,
  "Town Dojo NPC Sword": hasSword,
  "Town Dojo NPC Green Sword": (inv, s) =>
    has("White Sword")(inv) || (s.progressiveSword && (inv["Progressive Sword"] || 0) >= 2),
  "Town Dojo NPC Boots + Sword": (inv, s) => hasSword(inv, s) && has("Pegasus Boots")(inv),
  "Town Dojo NPC Cape + Sword": (inv, s) => hasSword(inv, s) && has("Roc's Cape")(inv),
  "Town Well Top Chest": has("Bomb Bag"),
  "Town School Roof Chest": has("Cane of Pacci"),
  "Town School Path Fusion Chest": has("Cane of Pacci"),
  "Town School Path Left Chest": (inv, s) => has("Cane of Pacci")(inv) && canSplit(4)(inv, s),
  "Town School Path Middle Chest": (inv, s) => has("Cane of Pacci")(inv) && canSplit(4)(inv, s),
  "Town School Path Right Chest": (inv, s) => has("Cane of Pacci")(inv) && canSplit(4)(inv, s),
  "Town School Path HP": (inv, s) => has("Cane of Pacci")(inv) && canSplit(4)(inv, s),
  "Town Digging Left Chest": has("Mole Mitts"),
  "Town Digging Top Chest": has("Mole Mitts"),
  "Town Digging Right Chest": has("Mole Mitts"),
  "Town Well Left Chest": has("Mole Mitts"),
  "Town Bell HP": has("Roc's Cape"),
  "Town Waterfall Fusion Chest": has("Flippers"),
  "Town Carlov NPC": (inv, s) => accessTownLeft(inv, s),
  "South Field Tingle NPC": (inv, s) =>
    has("Cane of Pacci")(inv) && has("Tingle Trophy")(inv) &&
    (canPassTrees(inv, s) || smithCrest(inv, s)),
  "Town Well Bottom Chest": hasAny("Roc's Cape", "Flippers"),
  "Town Cuccos Lv 10": hasAny("Roc's Cape", "Flippers"),
  "Town Jullieta Item": (inv, s) => accessTownLeft(inv, s) && hasBottle(inv),
  "Town Simulation Chest": (inv, s) => hasSword(inv, s) && canPay(10)(inv),
  "Town Music House Left Chest": has("Carlov Medal"),
  "Town Music House Middle Chest": has("Carlov Medal"),
  "Town Music House Right Chest": has("Carlov Medal"),
  "Town Music House HP": has("Carlov Medal"),
  "Town Well Pillar Chest": (inv, s) =>
    has("Mole Mitts")(inv) && hasAny("Roc's Cape", "Flippers")(inv) && canSplit(3, true)(inv, s),
  "Town Dr Left Attic Item": (inv, s) =>
    accessTownLeft(inv, s) && hasAll("Power Bracelets", "Gust Jar")(inv) && canSplit(2)(inv, s),
  "Town Fountain Big Chest": (inv, s) =>
    hasWeapon(inv, s) && accessTownFountain(inv, s) && has("Cane of Pacci")(inv),
  "Town Fountain Small Chest": (inv, s) =>
    accessTownFountain(inv, s) && hasAny("Flippers", "Roc's Cape")(inv),
  "Town Fountain HP": (inv, s) => accessTownFountain(inv, s) && has("Roc's Cape")(inv),
  "Town Library Yellow Minish NPC": hasAllBooks,
  "Town Under Library Frozen Chest": hasAll("Ocarina", "Cane of Pacci", "Flippers", "Lantern"),
  "Town Under Library Big Chest": (inv, s) =>
    ((completeBookQuest(inv) && has("Grip Ring")(inv) &&
      hasAny("Gust Jar", "Roc's Cape")(inv)) ||
     hasAll("Ocarina", "Cane of Pacci", "Flippers")(inv)) &&
    hasWeaponScissor(inv, s),
  "Town Under Library Underwater": hasAll("Ocarina", "Cane of Pacci", "Flippers"),
  // North Field
  "North Field Dig Spot": has("Mole Mitts"),
  "North Field HP": (inv, s) => hasBombWeapon(inv, s) || capeExtend(inv, s),
  "North Field Waterfall Fusion Dojo NPC": (inv, s) => has("Flippers")(inv) && hasSword(inv, s),
  // Castle
  "Castle Moat Left Chest": has("Flippers"),
  "Castle Moat Right Chest": has("Flippers"),
  "Castle Golden Rope": hasSword,
  "Castle Right Fountain Fusion HP": always,
  "Castle Dojo HP": always,
  "Castle Dojo NPC": (inv, s) => has("Lantern")(inv) && hasSword(inv, s),
  "Castle Right Fountain Fusion Minish Hole Chest": has("Pegasus Boots"),
  "Castle Left Fountain Fusion Minish Hole Chest": has("Pegasus Boots"),
  // Eastern Hills
  "Hills Golden Rope": hasSword,
  "Hills Bomb Cave Chest": has("Bomb Bag"),
  "Minish Great Fairy NPC": has("Cane of Pacci"),
  "Hills Farm Dig Cave Item": has("Mole Mitts"),
  // Lon Lon
  "Lon Lon Ranch Pot": always,
  "Lon Lon Puddle Fusion Big Chest": accessLonLonRight,
  "Lon Lon Cave Chest": (inv, s) => accessLonLonRight(inv, s) && canSplit(2, true)(inv, s),
  "Lon Lon Cave Secret Chest": (inv, s) =>
    accessLonLonRight(inv, s) && canSplit(2, true)(inv, s) && hasAll("Bomb Bag", "Lantern")(inv),
  "Lon Lon Path Fusion Chest": (inv, s) =>
    accessLonLonRight(inv, s) && has("Pegasus Boots")(inv),
  "Lon Lon Path HP": (inv, s) => accessLonLonRight(inv, s) && has("Pegasus Boots")(inv),
  "Lon Lon Dig Spot": (inv, s) =>
    accessLonLonRight(inv, s) && hasAny("Cane of Pacci", "Roc's Cape")(inv) && has("Mole Mitts")(inv),
  "Lon Lon North Minish Crack Chest": (inv, s) =>
    accessLonLonRight(inv, s) && hasAny("Cane of Pacci", "Roc's Cape")(inv),
  "Lon Lon Goron Cave Fusion Small Chest": accessMinishWoodsTopLeft,
  "Lon Lon Goron Cave Fusion Big Chest": accessMinishWoodsTopLeft,
  // Lower Falls
  "Falls Lower Lon Lon Fusion Chest": always,
  "Falls Lower HP": always,
  "Falls Lower Waterfall Fusion Dojo NPC": (inv, s) => has("Flippers")(inv) && hasSword(inv, s),
  "Falls Lower Rock Item1": hasAny("Flippers", "Roc's Cape"),
  "Falls Lower Rock Item2": hasAny("Flippers", "Roc's Cape"),
  "Falls Lower Rock Item3": hasAny("Flippers", "Roc's Cape"),
  "Falls Lower Dig Cave Left Chest": (inv, s) =>
    hasAny("Flippers", "Roc's Cape")(inv) && has("Mole Mitts")(inv),
  "Falls Lower Dig Cave Right Chest": (inv, s) =>
    hasAny("Flippers", "Roc's Cape")(inv) && has("Mole Mitts")(inv),
  // Lake Hylia
  "Hylia Sunken HP": has("Flippers"),
  "Hylia Dog NPC": has("Dog Food"),
  "Hylia Small Island HP": has("Roc's Cape"),
  "Hylia Cape Cave Top Right": hasAll("Mole Mitts", "Roc's Cape"),
  "Hylia Cape Cave Bottom Left": hasAll("Mole Mitts", "Roc's Cape"),
  "Hylia Cape Cave Top Left": hasAll("Mole Mitts", "Roc's Cape"),
  "Hylia Cape Cave Top Middle": hasAll("Mole Mitts", "Roc's Cape"),
  "Hylia Cape Cave Right": hasAll("Mole Mitts", "Roc's Cape"),
  "Hylia Cape Cave Bottom Right": hasAll("Mole Mitts", "Roc's Cape"),
  "Hylia Cape Cave Bottom Middle": hasAll("Mole Mitts", "Roc's Cape"),
  "Hylia Cape Cave Lon Lon HP": hasAll("Mole Mitts", "Roc's Cape"),
  "Hylia Beanstalk Fusion Left Chest": hasAll("Mole Mitts", "Roc's Cape"),
  "Hylia Beanstalk Fusion HP": hasAll("Mole Mitts", "Roc's Cape"),
  "Hylia Beanstalk Fusion Right Chest": hasAll("Mole Mitts", "Roc's Cape"),
  "Hylia Middle Island Fusion Dig Cave Chest": (inv, s) =>
    has("Mole Mitts")(inv) && capeExtend(inv, s),
  "Hylia Bottom HP": capeExtend,
  "Hylia Dojo HP": capeExtend,
  "Hylia Dojo NPC": (inv, s) => capeExtend(inv, s) && hasMaxHealth(10)(inv, s) && hasSword(inv, s),
  "Hylia Crack Fusion Librari NPC": (inv, s) =>
    has("Ocarina")(inv) && hasAny("Flippers", "Roc's Cape")(inv),
  "Hylia North Minish Hole Chest": (inv, s) => lakeMinish(inv, s) && has("Flippers")(inv),
  "Hylia South Minish Hole Chest": (inv, s) => lakeMinish(inv, s) && has("Flippers")(inv),
  "Hylia Cabin Path Fusion Chest": (inv, s) => lakeMinish(inv, s) && cabinSwim(inv, s),
  "Hylia Mayor Cabin Item": (inv, s) =>
    lakeMinish(inv, s) && cabinSwim(inv, s) && has("Power Bracelets")(inv),
  // Minish Woods
  "Minish Woods Golden Octo": (inv, s) => accessMinishWoodsTopLeft(inv, s) && hasSword(inv, s),
  "Minish Woods Witch Hut Item": (inv, s) => accessMinishWoodsTopLeft(inv, s) && canPay(60)(inv),
  "Witch Digging Cave Chest": (inv, s) =>
    accessMinishWoodsTopLeft(inv, s) && has("Mole Mitts")(inv),
  "Minish Woods North Fusion Chest": accessMinishWoodsTopLeft,
  "Minish Woods Top HP": accessMinishWoodsTopLeft,
  "Minish Woods Like Like Digging Cave Left Chest": (inv, s) =>
    has("Mole Mitts")(inv) && likelike(inv, s),
  "Minish Woods Like Like Digging Cave Right Chest": (inv, s) =>
    has("Mole Mitts")(inv) && likelike(inv, s),
  "Minish Woods Flipper Hole Middle Chest": has("Flippers"),
  "Minish Woods Flipper Hole Right Chest": has("Flippers"),
  "Minish Woods Flipper Hole Left Chest": has("Flippers"),
  "Minish Woods Flipper Hole HP": has("Flippers"),
  // Trilby Highlands
  "Trilby Dig Cave Left Chest": has("Mole Mitts"),
  "Trilby Dig Cave Right Chest": has("Mole Mitts"),
  "Trilby Dig Cave Water Fusion Chest": (inv, s) =>
    has("Mole Mitts")(inv) && hasAny("Roc's Cape", "Flippers")(inv),
  "Trilby Scrub NPC": (inv, s) => hasShield(inv, s) && hasBombWeapon(inv, s) && canPay(20)(inv),
  // Western Woods
  "Trilby Bomb Cave Chest": has("Bomb Bag"),
  "Western Woods Top Dig1": has("Mole Mitts"),
  "Western Woods Top Dig2": has("Mole Mitts"),
  "Western Woods Top Dig3": has("Mole Mitts"),
  "Western Woods Top Dig4": has("Mole Mitts"),
  "Western Woods Top Dig5": has("Mole Mitts"),
  "Western Woods Top Dig6": has("Mole Mitts"),
  "Western Woods Percy Fusion Moblin": has("Lantern"),
  "Western Woods Percy Fusion Percy": has("Lantern"),
  "Western Woods Bottom Dig1": has("Mole Mitts"),
  "Western Woods Bottom Dig2": has("Mole Mitts"),
  "Western Woods Golden Octo": hasSword,
  // Crenel Base
  "Crenel Base Fairy Cave Item1": has("Bomb Bag"),
  "Crenel Base Fairy Cave Item2": has("Bomb Bag"),
  "Crenel Base Fairy Cave Item3": has("Bomb Bag"),
  "Crenel Base Green Water Fusion Chest": has("Bomb Bag"),
  "Crenel Base West Fusion Chest": hasAny("Bomb Bag", "Roc's Cape"),
  "Crenel Base Water Cave Left Chest": has("Bomb Bag"),
  "Crenel Base Water Cave Right Chest": has("Bomb Bag"),
  "Crenel Base Water Cave HP": has("Bomb Bag"),
  "Crenel Base Minish Vine Hole Chest": (inv, s) =>
    hasAny("Bomb Bag", "Roc's Cape")(inv) && blowDust(inv, s),
  "Crenel Base Minish Crack Chest": (inv, s) =>
    hasAny("Bomb Bag", "Roc's Cape")(inv) && blowDust(inv, s),
  // Crenel
  "Crenel Vine Top Golden Tektite": hasSword,
  "Crenel Bridge Cave Chest": has("Bomb Bag"),
  "Crenel Fairy Cave HP": has("Bomb Bag"),
  "Crenel Below Cof Golden Tektite": (inv, s) => hasSword(inv, s) && mushroom(inv, s),
  "Crenel Scrub NPC": (inv, s) =>
    hasBombWeapon(inv, s) && hasShield(inv, s) && canPay(40)(inv) && mushroom(inv, s),
  "Crenel Dojo Left Chest": (inv, s) => has("Grip Ring")(inv) && canSplit(2, true)(inv, s),
  "Crenel Dojo Right Chest": (inv, s) => has("Grip Ring")(inv) && canSplit(2, true)(inv, s),
  "Crenel Dojo HP": (inv, s) => has("Grip Ring")(inv) && canSplit(2, true)(inv, s),
  "Crenel Dojo NPC": (inv, s) => has("Grip Ring")(inv) && canSplit(2, true)(inv, s),
  "Crenel Great Fairy NPC": (inv, s) => hasAll("Grip Ring", "Bomb Bag")(inv),
  "Crenel Climb Fusion Chest": (inv, s) => hasAll("Grip Ring", "Bomb Bag")(inv),
  "Crenel Dig Cave HP": hasAll("Grip Ring", "Mole Mitts"),
  "Crenel Beanstalk Fusion HP": has("Grip Ring"),
  "Crenel Rain Path Fusion Chest": has("Grip Ring"),
  // Melari / Mines
  "Crenel Upper Block Chest": always,
  "Crenel Mines Path Fusion Chest": always,
  "Crenel Melari Left Dig": has("Mole Mitts"),
  "Crenel Melari Top Middle Dig": has("Mole Mitts"),
  "Crenel Melari Top Left Dig": has("Mole Mitts"),
  "Crenel Melari Top Right Dig": has("Mole Mitts"),
  "Crenel Melari Bottom Right Dig": has("Mole Mitts"),
  "Crenel Melari Bottom Middle Dig": has("Mole Mitts"),
  "Crenel Melari Bottom Left Dig": has("Mole Mitts"),
  "Crenel Melari Center Dig": has("Mole Mitts"),
  // Castor Wilds
  "Swamp Center Cave Darknut Chest": hasWeaponBoss,
  "Swamp Center Chest": hasBow,
  "Swamp Golden Rope": hasSword,
  "Swamp Near Waterfall Cave HP": (inv, s) =>
    hasBow(inv, s) && hasAny("Roc's Cape", "Flippers")(inv),
  "Swamp Waterfall Fusion Dojo NPC": (inv, s) =>
    hasSword(inv, s) && hasBow(inv, s) && has("Flippers")(inv),
  "Swamp North Cave Chest": hasBow,
  "Swamp Digging Cave Left Chest": has("Mole Mitts"),
  "Swamp Digging Cave Right Chest": has("Mole Mitts"),
  "Swamp Underwater Top": has("Flippers"),
  "Swamp Underwater Middle": has("Flippers"),
  "Swamp Underwater Bottom": has("Flippers"),
  "Swamp South Cave Chest": (inv, s) =>
    hasAny("Roc's Cape", "Flippers")(inv) || hasBow(inv, s),
  "Swamp Dojo HP": (inv, s) =>
    has("Roc's Cape")(inv) || hasBow(inv, s) ||
    hasAll("Pegasus Boots", "Flippers")(inv) ||
    (swampCrest(inv, s) && has("Pegasus Boots")(inv)),
  "Swamp Dojo NPC": (inv, s) =>
    (has("Roc's Cape")(inv) || hasBow(inv, s) ||
     hasAll("Pegasus Boots", "Flippers")(inv) ||
     (swampCrest(inv, s) && has("Pegasus Boots")(inv))) &&
    hasSword(inv, s) && hasScrolls(7)(inv),
  // Wind Ruins
  "Ruins Bomb Cave Chest": has("Bomb Bag"),
  "Ruins Pillars Fusion Chest": hasSword,
  "Ruins Bean Stalk Fusion Big Chest": (inv, s) => hasSword(inv, s) && hasWeapon(inv, s),
  "Ruins Crack Fusion Chest": (inv, s) => hasSword(inv, s) && hasWeapon(inv, s),
  "Ruins Minish Cave HP": (inv, s) => hasSword(inv, s) && hasWeapon(inv, s),
  "Ruins Armos Kill Left Chest": (inv, s) => hasSword(inv, s) && hasWeapon(inv, s),
  "Ruins Armos Kill Right Chest": (inv, s) => hasSword(inv, s) && hasWeapon(inv, s),
  "Ruins Golden Octo": (inv, s) => hasSword(inv, s) && hasWeapon(inv, s),
  "Ruins Near Dungeon Fusion Chest": (inv, s) => hasSword(inv, s) && hasWeapon(inv, s),
  // Royal Valley
  "Valley Pre Valley Fusion Chest": always,
  "Valley Great Fairy NPC": has("Bomb Bag"),
  "Valley Lost Woods Chest": darkRoom,
  "Valley Dampe NPC": darkRoom,
  "Valley Graveyard Left Grave HP": canSplit(3, true),
  // Upper Falls
  "Fusion 09": fallsCanFuse,
  "Falls Entrance HP": capeExtend,
  "Falls Water Dig Cave Fusion HP": (inv, s) => has("Mole Mitts")(inv) && capeExtend(inv, s),
  "Falls Water Dig Cave Fusion Chest": (inv, s) => has("Mole Mitts")(inv) && capeExtend(inv, s),
  "Falls 1St Cave Chest": has("Bomb Bag"),
  "Falls Cliff Chest": (inv, s) => hasBombWeapon(inv, s) && canSplit(3, true)(inv, s),
  "Falls South Dig Spot": has("Mole Mitts"),
  "Falls Golden Tektite": hasSword,
  "Falls North Dig Spot": has("Mole Mitts"),
  "Falls Waterfall Fusion HP": has("Flippers"),
  "Falls Biggoron Item": (inv, s) => {
    if (s.biggoron === 'disabled') return false
    if (s.biggoron === 'mirror_shield') return hasMirrorShield(inv, s)
    return hasShield(inv, s)
  },
  // Wind Tribe
  "Wind Tribe 2F Gregal NPC 1": has("Gust Jar"),
  "Wind Tribe 2F Gregal NPC 2": has("Gust Jar"),
  // Clouds
  "Clouds Free Chest": always,
  "Clouds North East Dig Spot": has("Mole Mitts"),
  "Clouds North Shark Kill": sharkKill,
  "Clouds North West Right Chest": has("Mole Mitts"),
  "Clouds North West Left Chest": has("Mole Mitts"),
  "Clouds North West Dig Spot": has("Mole Mitts"),
  "Clouds North West Bottom Chest": hasAny("Mole Mitts", "Roc's Cape"),
  "Clouds South Left Chest": has("Mole Mitts"),
  "Clouds South Dig Spot": has("Mole Mitts"),
  "Clouds South Middle Chest": hasAny("Mole Mitts", "Roc's Cape"),
  "Clouds South Middle Dig Spot": has("Mole Mitts"),
  "Clouds South Shark Kill": sharkKill,
  "Clouds South Right Chest": hasAny("Mole Mitts", "Roc's Cape"),
  "Clouds South Right Dig Spot": has("Mole Mitts"),
  "Clouds South East Bottom Dig Spot": has("Mole Mitts"),
  "Clouds South East Top Dig Spot": has("Mole Mitts"),
  "Clouds Central Fusion": (inv, s) => cloudsAllCanFuse(inv, s),
  "Clouds Bottom Left Digging Spot": (inv, s) => cloudsAllCanFuse(inv, s) && has("Mole Mitts")(inv),
  "Clouds Top Right Digging Spot": (inv, s) => cloudsAllCanFuse(inv, s) && has("Mole Mitts")(inv),
  "Clouds Wind Tribe HP": always,
  // Gold fusion reward locations
  "Fused with Top Right Cloud":   (inv, s) => cloudsAllCanFuse(inv, s),
  "Fused with Bottom Left Cloud": (inv, s) => cloudsAllCanFuse(inv, s),
  "Fused with Top Left Cloud":    (inv, s) => cloudsAllCanFuse(inv, s),
  "Fused with Middle Cloud":      (inv, s) => cloudsAllCanFuse(inv, s),
  "Fused with Bottom Right Cloud":(inv, s) => cloudsAllCanFuse(inv, s),
  "Fused with West Statue":       (inv, s) => swampsAllCanFuse(inv, s),
  "Fused with Middle Statue":     (inv, s) => swampsAllCanFuse(inv, s),
  "Fused with East Statue":       (inv, s) => swampsAllCanFuse(inv, s),
  "Fused with Veil Falls Door":   (inv)     => fallsCanFuse(inv),
  // DHC dungeon locations
  "DHC B2 King":               canSplit(4),
  "DHC 1F Blade Chest":        (inv, s) => dhcCannons(inv, s) && dhcPads(inv, s),
  "DHC 3F North West Chest":   (inv, s) => hasWeaponBoss(inv, s) && hasBow(inv, s),
  "DHC 3F North East Chest":   (inv, s) => hasWeaponBoss(inv, s) && has("Lantern")(inv),
  "DHC 3F South West Chest":   (inv, s) => hasWeaponBoss(inv, s) && dhcSouthTowers(inv, s),
  "DHC 3F South East Chest":   (inv, s) => hasWeaponBoss(inv, s) && dhcSouthTowers(inv, s) && dhcSpin(inv, s),
  "DHC 2F Blue Warp Big Chest":(inv, s) => dhcKey(5)(inv) && canSplit(4)(inv, s),
  // Sanctuary / Pedestal
  "Pedestal Requirement Reward": canActivatePedestal,
  "Sanctuary Pedestal Item1": (inv) => PEDESTAL_ELEMENTS.filter(e => (inv[e] || 0) >= 1).length >= 2,
  "Sanctuary Pedestal Item2": (inv) => PEDESTAL_ELEMENTS.filter(e => (inv[e] || 0) >= 1).length >= 3,
  "Sanctuary Pedestal Item3": (inv) => PEDESTAL_ELEMENTS.filter(e => (inv[e] || 0) >= 1).length >= 4,
}
