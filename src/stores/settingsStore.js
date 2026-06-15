import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const TRICKS = {
  BOMB_DUST:            { key: 'bomb_dust',            label: 'Bomb Dust (Bomb/Gust blows dust)' },
  MUSHROOM:             { key: 'mushroom',              label: 'Mushroom Skip (Gust/Bomb/Grip)' },
  ARROWS_BREAK:         { key: 'arrows_break',          label: 'Light Arrows Break Objects' },
  BOBOMB_WALLS:         { key: 'bobomb_walls',          label: 'Bo-bomb Walls (no Bomb Bag)' },
  LIKELIKE_SWORDLESS:   { key: 'likelike_swordless',    label: 'Swordless Like-Like cave' },
  BOOTS_GUARDS:         { key: 'boots_guards',          label: 'Boots Past Town Guard' },
  BEAM_CRENEL_SWITCH:   { key: 'beam_crenel_switch',    label: 'Beam for Crenel Switch' },
  DOWNTHRUST_BEETLE:    { key: 'downthrust_beetle',     label: 'Downthrust Spikey Beetle' },
  DARK_ROOMS:           { key: 'dark_rooms',            label: 'Dark Rooms without Lantern' },
  CAPE_EXTENSIONS:      { key: 'cape_extensions',       label: 'Cape Extensions (longer jumps)' },
  LAKE_MINISH:          { key: 'lake_minish',           label: 'Lake Minish (no Boots)' },
  CABIN_SWIM:           { key: 'cabin_swim',            label: 'Cabin Swim (no Lilypad)' },
  SHARKS_SWORDLESS:     { key: 'sharks_swordless',      label: 'Cloud Sharks without Weapons' },
  POW_NOCANE:           { key: 'pow_nocane',            label: 'PoW 2F without Cane' },
  POT_PUZZLE:           { key: 'pot_puzzle',            label: 'PoW Pot Puzzle (no Bracelets)' },
  FOW_POT:              { key: 'fow_pot',               label: 'FoW Pot (Gust Jar through wall)' },
  DHC_CANNONS:          { key: 'dhc_cannons',           label: 'DHC Cannons (no Four Sword)' },
  DHC_CLONES:           { key: 'dhc_clones',            label: 'DHC Pads (no Four Sword)' },
  DHC_SPIN:             { key: 'dhc_spin',              label: 'DHC Switches (spin attack)' },
}

export const useSettingsStore = defineStore('settings', () => {
  // ── Tricks ───────────────────────────────────────────────────────────────────
  const tricks = ref(new Set())
  function hasTrick(key) { return tricks.value.has(key) }
  function toggleTrick(key) {
    const next = new Set(tricks.value)
    if (next.has(key)) next.delete(key); else next.add(key)
    tricks.value = next
  }
  function setAllTricks(enabled) {
    tricks.value = enabled
      ? new Set(Object.values(TRICKS).map(t => t.key))
      : new Set()
  }

  // ── Goal ─────────────────────────────────────────────────────────────────────
  const goal        = ref('vaati')     // 'vaati' | 'pedestal'
  const dhcAccess   = ref('pedestal')  // 'closed' | 'pedestal' | 'open'

  // Pedestal requirements
  const pedElements  = ref(4)   // 0–4
  const pedSwords    = ref(5)   // 0–5
  const pedDungeons  = ref(0)   // 0–6
  const pedFigurines = ref(0)   // 0–136

  // ── Dungeon Shuffle ───────────────────────────────────────────────────────────
  const shuffleElements  = ref('dungeon_prize') // 'vanilla' | 'dungeon_prize' | 'anywhere'
  const dungeonSmallKeys = ref('own_dungeon')   // 'own_dungeon' | 'anywhere'
  const dungeonBigKeys   = ref('own_dungeon')   // 'own_dungeon' | 'anywhere'
  const dungeonMaps      = ref('own_dungeon')   // 'own_dungeon' | 'anywhere' | 'start_with'
  const dungeonCompasses = ref('own_dungeon')   // 'own_dungeon' | 'anywhere' | 'start_with'
  const nonElementDungeons = ref('standard')    // 'standard' | 'excluded'

  // ── Location Shuffle ──────────────────────────────────────────────────────────
  const rupeesanity       = ref(false)
  const shufflePots       = ref(false)
  const shuffleDigging    = ref(false)
  const shuffleUnderwater = ref(false)
  const shuffleGoldEnemies = ref(false)
  const biggoron          = ref('disabled') // 'disabled' | 'shield' | 'mirror_shield'
  const cuccoRounds       = ref(1)          // 0–10
  const goronSets         = ref(0)          // 0–5
  const goronJPPrices     = ref(false)
  const extraShopItem     = ref(false)
  const shuffleSanctuary  = ref(false)      // not yet in AP — disabled by default
  const pedReward         = ref('none')     // 'none' | 'dhc_big_key' | 'random_item'

  // ── Difficulty ────────────────────────────────────────────────────────────────
  const startingHearts    = ref(3)          // 1–20
  const heartContainers   = ref(6)          // 0–20
  const pieceOfHearts     = ref(11)         // 0–20
  const earlyWeapon       = ref(false)

  // ── Weapons ───────────────────────────────────────────────────────────────────
  const weaponBow     = ref(false)
  const weaponBomb    = ref(0)        // 0=no, 1=yes, 2=yes+boss
  const weaponGust    = ref(false)
  const weaponLantern = ref(false)

  // ── Progressive Items ─────────────────────────────────────────────────────────
  const progressiveSword      = ref(true)
  const progressiveBow        = ref(true)
  const progressiveBoomerang  = ref(true)
  const progressiveShield     = ref(true)
  const progressiveScroll     = ref(true)
  const randomBottleContents  = ref(false)

  // ── Fusions ───────────────────────────────────────────────────────────────────
  const goldFusionAccess  = ref('vanilla') // 'closed' | 'vanilla' | 'combined' | 'open'
  const redFusionAccess   = ref('open')    // 'closed' | 'vanilla' | 'combined' | 'open'
  const blueFusionAccess  = ref('open')    // 'closed' | 'vanilla' | 'combined' | 'open'
  const greenFusionAccess = ref('open')    // 'closed' | 'vanilla' | 'combined' | 'open'
  const cloudKinstoneMultiplier = ref(1)   // 1–9
  const swampKinstoneMultiplier = ref(1)   // 1–3

  // ── Dungeon Warps ──────────────────────────────────────────────────────────────
  const warpDWS = ref(0)   // 0=none, 1=blue, 2=red, 3=both
  const warpCoF = ref(0)
  const warpFoW = ref(0)
  const warpToD = ref(0)
  const warpPoW = ref(0)
  const warpDHC = ref(0)

  // ── Wind Crests ───────────────────────────────────────────────────────────────
  const windCrestCrenel     = ref(false)
  const windCrestFalls      = ref(false)
  const windCrestClouds     = ref(false)
  const windCrestCastor     = ref(false)  // Castor Wilds
  const windCrestSouthField = ref(false)
  const windCrestMinishWoods = ref(false)

  // ── Entrance Shuffle ──────────────────────────────────────────────────────────
  const dungeonEntranceShuffle = ref(false)

  // ── Logic Source ─────────────────────────────────────────────────────────────
  const logicSource     = ref('default_logic') // 'default_logic' | 'custom'
  // Raw text of a user-imported .logic file — not persisted (session only, can be large)
  const customLogicText = ref(null)
  // Rando defines set by the user in logic mode — { [DEFINE_NAME]: bool|string|number }
  // null = not yet initialized (falls back to AP World logic)
  const randoDefines    = ref(null)

  // ── Tracker Display ───────────────────────────────────────────────────────────
  const showInaccessible = ref(false)
  const autoTabDungeons  = ref('overview') // 'non' | 'overview' | 'etage'
  const autoTabOverworld = ref('non')     // 'non' | 'oui'

  // ── Quality of Life ───────────────────────────────────────────────────────────
  const ocarinaOnSelect      = ref(true)
  const bootsOnL             = ref(true)
  const bootsAsMinish        = ref(false)
  const bigOctoManipulation  = ref(true)
  const replicaTODBossDoor   = ref(true)
  const trapsEnabled         = ref(false)

  // ── Serialization ─────────────────────────────────────────────────────────────
  function exportSettings() {
    return {
      tricks: [...tricks.value],
      goal: goal.value, dhcAccess: dhcAccess.value,
      pedElements: pedElements.value, pedSwords: pedSwords.value,
      pedDungeons: pedDungeons.value, pedFigurines: pedFigurines.value,
      shuffleElements: shuffleElements.value,
      dungeonSmallKeys: dungeonSmallKeys.value, dungeonBigKeys: dungeonBigKeys.value,
      dungeonMaps: dungeonMaps.value, dungeonCompasses: dungeonCompasses.value,
      nonElementDungeons: nonElementDungeons.value,
      rupeesanity: rupeesanity.value, shufflePots: shufflePots.value,
      shuffleDigging: shuffleDigging.value, shuffleUnderwater: shuffleUnderwater.value,
      shuffleGoldEnemies: shuffleGoldEnemies.value,
      biggoron: biggoron.value, cuccoRounds: cuccoRounds.value,
      goronSets: goronSets.value, goronJPPrices: goronJPPrices.value,
      extraShopItem: extraShopItem.value, shuffleSanctuary: shuffleSanctuary.value, pedReward: pedReward.value,
      startingHearts: startingHearts.value, heartContainers: heartContainers.value,
      pieceOfHearts: pieceOfHearts.value, earlyWeapon: earlyWeapon.value,
      weaponBow: weaponBow.value, weaponBomb: weaponBomb.value,
      weaponGust: weaponGust.value, weaponLantern: weaponLantern.value,
      progressiveSword: progressiveSword.value, progressiveBow: progressiveBow.value,
      progressiveBoomerang: progressiveBoomerang.value, progressiveShield: progressiveShield.value,
      progressiveScroll: progressiveScroll.value, randomBottleContents: randomBottleContents.value,
      goldFusionAccess: goldFusionAccess.value, redFusionAccess: redFusionAccess.value,
      blueFusionAccess: blueFusionAccess.value, greenFusionAccess: greenFusionAccess.value,
      cloudKinstoneMultiplier: cloudKinstoneMultiplier.value,
      swampKinstoneMultiplier: swampKinstoneMultiplier.value,
      warpDWS: warpDWS.value, warpCoF: warpCoF.value, warpFoW: warpFoW.value,
      warpToD: warpToD.value, warpPoW: warpPoW.value, warpDHC: warpDHC.value,
      windCrestCrenel: windCrestCrenel.value, windCrestFalls: windCrestFalls.value,
      windCrestClouds: windCrestClouds.value, windCrestCastor: windCrestCastor.value,
      windCrestSouthField: windCrestSouthField.value, windCrestMinishWoods: windCrestMinishWoods.value,
      ocarinaOnSelect: ocarinaOnSelect.value, bootsOnL: bootsOnL.value,
      bootsAsMinish: bootsAsMinish.value, bigOctoManipulation: bigOctoManipulation.value,
      replicaTODBossDoor: replicaTODBossDoor.value, trapsEnabled: trapsEnabled.value,
      showInaccessible: showInaccessible.value,
      autoTabDungeons: autoTabDungeons.value,
      autoTabOverworld: autoTabOverworld.value,
      dungeonEntranceShuffle: dungeonEntranceShuffle.value,
      logicSource: logicSource.value,
      randoDefines: randoDefines.value,
    }
  }

  function importSettings(s) {
    if (!s) return
    tricks.value = new Set(s.tricks || [])
    const refs = {
      goal, dhcAccess,
      pedElements, pedSwords, pedDungeons, pedFigurines,
      shuffleElements, dungeonSmallKeys, dungeonBigKeys, dungeonMaps, dungeonCompasses,
      nonElementDungeons,
      rupeesanity, shufflePots, shuffleDigging, shuffleUnderwater, shuffleGoldEnemies,
      biggoron, cuccoRounds, goronSets, goronJPPrices, extraShopItem, shuffleSanctuary, pedReward,
      startingHearts, heartContainers, pieceOfHearts, earlyWeapon,
      weaponBow, weaponBomb, weaponGust, weaponLantern,
      progressiveSword, progressiveBow, progressiveBoomerang, progressiveShield,
      progressiveScroll, randomBottleContents,
      goldFusionAccess, redFusionAccess, blueFusionAccess, greenFusionAccess,
      cloudKinstoneMultiplier, swampKinstoneMultiplier,
      warpDWS, warpCoF, warpFoW, warpToD, warpPoW, warpDHC,
      windCrestCrenel, windCrestFalls, windCrestClouds, windCrestCastor,
      windCrestSouthField, windCrestMinishWoods,
      ocarinaOnSelect, bootsOnL, bootsAsMinish, bigOctoManipulation,
      replicaTODBossDoor, trapsEnabled,
      showInaccessible, autoTabDungeons, autoTabOverworld,
      dungeonEntranceShuffle,
      logicSource,
    }
    for (const [k, r] of Object.entries(refs)) {
      if (s[k] != null) r.value = s[k]
    }
    if ('randoDefines' in s) randoDefines.value = s.randoDefines
  }

  function save() {
    localStorage.setItem('tmc_settings', JSON.stringify(exportSettings()))
  }

  // Auto-save on every setting change, debounced to avoid thrashing localStorage
  let _saveTid
  watch(() => exportSettings(), () => {
    clearTimeout(_saveTid)
    _saveTid = setTimeout(save, 300)
  })

  function load() {
    try {
      const raw = localStorage.getItem('tmc_settings')
      if (raw) importSettings(JSON.parse(raw))
    } catch {}
  }

  return {
    tricks, hasTrick, toggleTrick, setAllTricks,
    goal, dhcAccess,
    pedElements, pedSwords, pedDungeons, pedFigurines,
    shuffleElements, dungeonSmallKeys, dungeonBigKeys, dungeonMaps, dungeonCompasses,
    nonElementDungeons,
    rupeesanity, shufflePots, shuffleDigging, shuffleUnderwater, shuffleGoldEnemies,
    biggoron, cuccoRounds, goronSets, goronJPPrices, extraShopItem, shuffleSanctuary, pedReward,
    startingHearts, heartContainers, pieceOfHearts, earlyWeapon,
    weaponBow, weaponBomb, weaponGust, weaponLantern,
    progressiveSword, progressiveBow, progressiveBoomerang, progressiveShield,
    progressiveScroll, randomBottleContents,
    goldFusionAccess, redFusionAccess, blueFusionAccess, greenFusionAccess,
    cloudKinstoneMultiplier, swampKinstoneMultiplier,
    warpDWS, warpCoF, warpFoW, warpToD, warpPoW, warpDHC,
    windCrestCrenel, windCrestFalls, windCrestClouds, windCrestCastor,
    windCrestSouthField, windCrestMinishWoods,
    ocarinaOnSelect, bootsOnL, bootsAsMinish, bigOctoManipulation,
    replicaTODBossDoor, trapsEnabled,
    showInaccessible, autoTabDungeons, autoTabOverworld,
    dungeonEntranceShuffle,
    logicSource, customLogicText, randoDefines,
    exportSettings, importSettings, save, load,
  }
})
