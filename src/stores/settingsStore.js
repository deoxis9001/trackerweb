import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const ENTRANCE_SHUFFLE_ENABLED = import.meta.env.MODE === 'alpha'

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
  const _dungeonEntranceShuffle = ref(false)
  const dungeonEntranceShuffle = computed({
    get: () => ENTRANCE_SHUFFLE_ENABLED && _dungeonEntranceShuffle.value,
    set: (v) => { if (ENTRANCE_SHUFFLE_ENABLED) _dungeonEntranceShuffle.value = v },
  })

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
    }
    for (const [k, r] of Object.entries(refs)) {
      if (s[k] != null) r.value = s[k]
    }
  }

  function importFromSlotData(sd) {
    if (!sd) return
    const o = sd.options ?? {}

    // Goal + DHC access — prefer combined goal_vaati_dhc (get_option_data) over legacy separate keys
    if (sd.goal_vaati_dhc != null) {
      const GOAL_DHC = {
        0: { goal: 'vaati',    dhcAccess: 'closed'   },
        1: { goal: 'vaati',    dhcAccess: 'pedestal' },
        2: { goal: 'vaati',    dhcAccess: 'open'     },
        3: { goal: 'pedestal', dhcAccess: 'closed'   },
        5: { goal: 'pedestal', dhcAccess: 'open'     },
      }
      const entry = GOAL_DHC[sd.goal_vaati_dhc]
      if (entry) {
        goal.value      = entry.goal
        dhcAccess.value = entry.dhcAccess
      }
    } else {
      goal.value      = ['vaati', 'pedestal'][o.goal]      ?? goal.value
      dhcAccess.value = ['closed', 'pedestal', 'open'][o.dhc_access] ?? dhcAccess.value
    }

    // Pedestal reward derived from goal + dhc_access + shuffle_pedestal
    if (goal.value === 'pedestal')           pedReward.value = 'random_item'
    else if (dhcAccess.value === 'pedestal') pedReward.value = 'dhc_big_key'
    else if (o.shuffle_pedestal === 1)       pedReward.value = 'random_item'
    else                                     pedReward.value = 'none'

    // Pedestal requirements
    // Top-level keys from get_option_data take priority; sd.options has the raw attribute names as fallback
    const rawPedElements  = sd.goal_elements  ?? o.ped_elements
    const rawPedSwords    = sd.goal_swords    ?? o.ped_swords
    const rawPedDungeons  = sd.goal_dungeons  ?? o.ped_dungeons
    const rawPedFigurines = sd.goal_figurines ?? o.ped_figurines
    if (rawPedElements  != null) pedElements.value  = rawPedElements
    if (rawPedSwords    != null) pedSwords.value    = rawPedSwords
    if (rawPedDungeons  != null) pedDungeons.value  = rawPedDungeons
    if (rawPedFigurines != null) pedFigurines.value = rawPedFigurines

    // Dungeon shuffle (AP uses integer enum values)
    const SHUFFLE_ELEMENTS = { 2: 'vanilla', 7: 'dungeon_prize', 8: 'anywhere' }
    const DUNGEON_ITEM     = { 1: 'start_with', 3: 'own_dungeon', 8: 'anywhere' }
    const NON_ELEM_DG      = { 0: 'standard', 2: 'excluded' }

    if (o.shuffle_elements     != null) shuffleElements.value     = SHUFFLE_ELEMENTS[o.shuffle_elements]    ?? shuffleElements.value
    if (o.dungeon_small_keys   != null) dungeonSmallKeys.value    = DUNGEON_ITEM[o.dungeon_small_keys]      ?? dungeonSmallKeys.value
    if (o.dungeon_big_keys     != null) dungeonBigKeys.value      = DUNGEON_ITEM[o.dungeon_big_keys]        ?? dungeonBigKeys.value
    if (o.dungeon_maps         != null) dungeonMaps.value         = DUNGEON_ITEM[o.dungeon_maps]            ?? dungeonMaps.value
    if (o.dungeon_compasses    != null) dungeonCompasses.value    = DUNGEON_ITEM[o.dungeon_compasses]       ?? dungeonCompasses.value
    if (o.non_element_dungeons != null) nonElementDungeons.value  = NON_ELEM_DG[o.non_element_dungeons]    ?? nonElementDungeons.value

    // Location shuffles — top-level key is shuffle_rupees; sd.options has rupeesanity
    const rawRupee = sd.shuffle_rupees ?? o.rupeesanity
    if (rawRupee != null) rupeesanity.value = Boolean(rawRupee)
    const rawShufflePots       = sd.shuffle_pots        ?? o.shuffle_pots
    if (rawShufflePots       != null) shufflePots.value        = Boolean(rawShufflePots)
    const rawShuffleDigging    = sd.shuffle_digging      ?? o.shuffle_digging
    if (rawShuffleDigging    != null) shuffleDigging.value     = Boolean(rawShuffleDigging)
    const rawShuffleUnderwater = sd.shuffle_underwater   ?? o.shuffle_underwater
    if (rawShuffleUnderwater != null) shuffleUnderwater.value  = Boolean(rawShuffleUnderwater)
    const rawShuffleGoldEnemies = sd.shuffle_gold_enemies ?? o.shuffle_gold_enemies
    if (rawShuffleGoldEnemies != null) shuffleGoldEnemies.value = Boolean(rawShuffleGoldEnemies)
    const rawCuccoRounds = sd.cucco_rounds ?? o.cucco_rounds
    if (rawCuccoRounds != null) cuccoRounds.value = rawCuccoRounds
    const rawGoronSets = sd.goron_sets ?? o.goron_sets
    if (rawGoronSets != null) goronSets.value = rawGoronSets
    const rawGoronJP = sd.goron_jp_prices ?? o.goron_jp_prices
    if (rawGoronJP != null) goronJPPrices.value = Boolean(rawGoronJP)
    if (o.random_bottle_contents != null) randomBottleContents.value = Boolean(o.random_bottle_contents)

    // Difficulty
    const rawHearts = sd.starting_hearts ?? o.starting_hearts
    if (rawHearts       != null) startingHearts.value  = rawHearts
    if (o.heart_containers != null) heartContainers.value = o.heart_containers
    if (o.piece_of_hearts  != null) pieceOfHearts.value  = o.piece_of_hearts
    if (o.early_weapon     != null) earlyWeapon.value    = Boolean(o.early_weapon)
    if (o.traps_enabled    != null) trapsEnabled.value   = Boolean(o.traps_enabled)

    // Weapons — top-level uses weapon_bombs/bows/gust_jar; sd.options uses weapon_bomb/bow/gust
    const rawBomb    = sd.weapon_bombs   ?? o.weapon_bomb
    const rawBow     = sd.weapon_bows    ?? o.weapon_bow
    const rawGust    = sd.weapon_gust_jar ?? o.weapon_gust
    const rawLantern = sd.weapon_lantern ?? o.weapon_lantern
    if (rawBomb    != null) weaponBomb.value    = rawBomb
    if (rawBow     != null) weaponBow.value     = Boolean(rawBow)
    if (rawGust    != null) weaponGust.value    = Boolean(rawGust)
    if (rawLantern != null) weaponLantern.value = Boolean(rawLantern)

    // Progressive items — progressive_sword also appears at top-level
    const rawProgSword = sd.progressive_sword ?? o.progressive_sword
    if (rawProgSword     != null) progressiveSword.value     = Boolean(rawProgSword)
    if (o.progressive_bow        != null) progressiveBow.value       = Boolean(o.progressive_bow)
    if (o.progressive_boomerang  != null) progressiveBoomerang.value = Boolean(o.progressive_boomerang)
    if (o.progressive_shield     != null) progressiveShield.value    = Boolean(o.progressive_shield)
    if (o.progressive_scroll     != null) progressiveScroll.value    = Boolean(o.progressive_scroll)

    // Dungeon warps — read from sd.options first, fall back to top-level sd
    const rawWarpDWS = o.dungeon_warp_dws ?? sd.dungeon_warp_dws
    const rawWarpCoF = o.dungeon_warp_cof ?? sd.dungeon_warp_cof
    const rawWarpFoW = o.dungeon_warp_fow ?? sd.dungeon_warp_fow
    const rawWarpToD = o.dungeon_warp_tod ?? sd.dungeon_warp_tod
    const rawWarpPoW = o.dungeon_warp_pow ?? sd.dungeon_warp_pow
    const rawWarpDHC = o.dungeon_warp_dhc ?? sd.dungeon_warp_dhc
    if (rawWarpDWS != null) warpDWS.value = rawWarpDWS
    if (rawWarpCoF != null) warpCoF.value = rawWarpCoF
    if (rawWarpFoW != null) warpFoW.value = rawWarpFoW
    if (rawWarpToD != null) warpToD.value = rawWarpToD
    if (rawWarpPoW != null) warpPoW.value = rawWarpPoW
    if (rawWarpDHC != null) warpDHC.value = rawWarpDHC

    // Wind crests — same dual lookup
    const rawCrenel  = o.wind_crest_crenel       ?? sd.wind_crest_crenel
    const rawFalls   = o.wind_crest_falls         ?? sd.wind_crest_falls
    const rawClouds  = o.wind_crest_clouds        ?? sd.wind_crest_clouds
    const rawCastor  = o.wind_crest_castor        ?? sd.wind_crest_castor
    const rawSmith   = o.wind_crest_south_field   ?? sd.wind_crest_south_field
    const rawMinish  = o.wind_crest_minish_woods  ?? sd.wind_crest_minish_woods
    if (rawCrenel != null) windCrestCrenel.value      = Boolean(rawCrenel)
    if (rawFalls  != null) windCrestFalls.value        = Boolean(rawFalls)
    if (rawClouds != null) windCrestClouds.value       = Boolean(rawClouds)
    if (rawCastor != null) windCrestCastor.value       = Boolean(rawCastor)
    if (rawSmith  != null) windCrestSouthField.value   = Boolean(rawSmith)
    if (rawMinish != null) windCrestMinishWoods.value  = Boolean(rawMinish)

    // Kinstone multipliers
    if (o.clouds_kinstone_multiplier != null) cloudKinstoneMultiplier.value = o.clouds_kinstone_multiplier
    if (o.swamp_kinstone_multiplier  != null) swampKinstoneMultiplier.value  = o.swamp_kinstone_multiplier

    // Flat slot_data fields (from get_option_data)
    const BIGGORON  = ['disabled', 'shield', 'mirror_shield']
    const KINSTONES = ['closed', 'vanilla', 'combined', 'open']

    if (sd.shuffle_biggoron != null) biggoron.value          = BIGGORON[sd.shuffle_biggoron]  ?? biggoron.value
    if (sd.kinstones_gold   != null) goldFusionAccess.value  = KINSTONES[sd.kinstones_gold]   ?? goldFusionAccess.value
    if (sd.kinstones_red    != null) redFusionAccess.value   = KINSTONES[sd.kinstones_red]    ?? redFusionAccess.value
    if (sd.kinstones_blue   != null) blueFusionAccess.value  = KINSTONES[sd.kinstones_blue]   ?? blueFusionAccess.value
    if (sd.kinstones_green  != null) greenFusionAccess.value = KINSTONES[sd.kinstones_green]  ?? greenFusionAccess.value
    if (sd.extra_shop_item  != null) extraShopItem.value     = Boolean(sd.extra_shop_item)

    // Tricks
    const TRICK_MAP = {
      trick_bombable_dust:              'bomb_dust',
      trick_crenel_mushroom_gust_jar:   'mushroom',
      trick_light_arrows_break_objects: 'arrows_break',
      trick_bobombs_destroy_walls:      'bobomb_walls',
      trick_like_like_cave_no_sword:    'likelike_swordless',
      trick_boots_skip_town_guard:      'boots_guards',
      trick_beam_crenel_switch:         'beam_crenel_switch',
      trick_down_thrust_spikey_beetle:  'downthrust_beetle',
      trick_dark_rooms_no_lantern:      'dark_rooms',
      trick_cape_extensions:            'cape_extensions',
      trick_lake_minish_no_boots:       'lake_minish',
      trick_cabin_swim_no_lilypad:      'cabin_swim',
      trick_cloud_sharks_no_weapons:    'sharks_swordless',
      trick_pow_2f_no_cane:             'pow_nocane',
      trick_pot_puzzle_no_bracelets:    'pot_puzzle',
      trick_fow_pot_gust_jar:           'fow_pot',
      trick_dhc_cannons_no_four_sword:  'dhc_cannons',
      trick_dhc_pads_no_four_sword:     'dhc_clones',
      trick_dhc_switches_no_four_sword: 'dhc_spin',
    }
    const enabledTricks = new Set()
    for (const [sdKey, trickKey] of Object.entries(TRICK_MAP)) {
      if (sd[sdKey]) enabledTricks.add(trickKey)
    }
    tricks.value = enabledTricks

    save()
  }

  function save() {
    localStorage.setItem('tmc_settings', JSON.stringify(exportSettings()))
  }

  // Auto-save on every setting change (skips initial run to avoid overwriting before load())
  watch(() => exportSettings(), save, { deep: true })

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
    exportSettings, importSettings, importFromSlotData, save, load,
  }
})
