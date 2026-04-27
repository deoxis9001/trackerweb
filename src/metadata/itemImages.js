// Maps TMCItem key → image path under /images/items/
// Images come from src_info/tmcrando_maptracker_deoxis (copied to public/)

export const ITEM_IMAGES = {
  // Swords
  SMITHS_SWORD:       "Smith's Sword.png",
  WHITE_SWORD_GREEN:  "Green Sword.png",
  WHITE_SWORD_RED:    "Red Sword.png",
  WHITE_SWORD_BLUE:   "Blue Sword.png",
  FOUR_SWORD:         "Four Sword.png",

  // Weapons & Tools
  BOMB:              "Bomb.png",
  BOMB_BAG:          "Bomb.png",
  REMOTE_BOMB:       "Remote Bombs.png",
  BOW:               "Bow0.png",
  LIGHT_ARROW:       "Light Arrows Smaller.png",
  PROGRESSIVE_BOW:   "Bow0.png",
  BOOMERANG:         "Boomerang.png",
  MAGIC_BOOMERANG:   "Magical Boomerang.png",
  LANTERN:           "Lamp.png",
  GUST_JAR:          "Gust Jar.png",
  CANE_OF_PACCI:     "Cane of Pacci.png",
  MOLE_MITTS:        "Mole Mitts.png",
  ROCS_CAPE:         "Roc's Cape.png",
  PEGASUS_BOOTS:     "Pegasus Boots.png",
  FIRE_ROD:          "Fire Element2.png",
  OCARINA:           "Ocarina of Wind.png",
  FLIPPERS:          "Flippers.png",
  GRIP_RING:         "Grip Ring.png",
  POWER_BRACELETS:   "Power Bracelets.png",
//progressive ITEM
  PROGRESSIVE_SWORD:  ["Smith's Sword.png", "Green Sword.png", "Red Sword.png", "Blue Sword.png", "Four Sword.png"],
  PROGRESSIVE_BOOMERANG: ["Boomerang.png", "Magical Boomerang.png"],
  PROGRESSIVE_SHIELD: ["Small Shield.png", "Mirror Shield.png"],
  PROGRESSIVE_BOW: ["Bow0.png", "Light Arrows Smaller.png"],
  PROGRESSIVE_BOOK: ["Book1.png", "Book2.png", "Book3.png"],
  PROGRESSIVE_WALLET: ["Wallet300alt.png", "Wallet500alt.png", "Wallet999alt.png"],
  PROGRESSIVE_BOMB_BAG: ["Bomb.png", "Bomb10.png", "Bomb30.png", "Bomb50.png", "Bomb99.png"],
  // Shields
  SHIELD:     "Small Shield.png",
  MIRROR_SHIELD:     "Mirror Shield.png",


  // Sword abilities / scrolls
  SPIN_ATTACK:       "Spin Attack.png",
  ROLL_ATTACK:       "Roll Attack.png",
  DASH_ATTACK:       "Dash Attack.png",
  ROCK_BREAKER:      "Rock Breaker.png",
  SWORD_BEAM:        "Sword Beam.png",
  GREATSPIN:         "Great Spin Attack.png",
  DOWNTHRUST:        "Down Thrust.png",
  PERIL_BEAM:        "Peril Beam.png",
  FAST_SPIN_SCROLL:  "Fast Spin.png",
  FAST_SPLIT_SCROLL: "Fast Split.png",
  LONG_SPIN:         "Long Great Spin.png",
  PROGRESSIVE_SCROLL: "Tiger Scroll.png",
  PROGRESSIVE_SPIN_SCROLL: ["Spin Attack.png", "Fast Spin.png", "Fast Split.png", "Great Spin Attack.png", "Long Great Spin.png"],
  PROGRESSIVE_COUNT_SCROLL: "Tiger Scroll.png",

  // Upgrades & misc
  HEART_CONTAINER:   "Heart Container.png",
  HEART_PIECE:       "Heart Piece.png",
  HEART_TOTAL:       "Heart Container.png",
  BIG_WALLET:        "Wallet300alt.png",
  QUIVER:            "Quiver.png",
  FIGURINE:          "figurine.png",
  HYRULE_MAP:        "Map.png",

  // Butterflies (composite sub-items)
  MITTS_BUTTERFLY:    "Mole Mitts B.png",
  FLIPPERS_BUTTERFLY: "Flippers B.png",
  BOW_BUTTERFLY:      "overlay_butterfly.png",

  // Quest items
  DOG_FOOD:         "overlay_dogfood.png",
  LONLON_KEY:       "Lon Lon Ranch Key.png",
  WAKEUP_MUSHROOM:  "Mushroom.png",
  RED_BOOK:         "Book1.png",
  GREEN_BOOK:       "Green Book.png",
  BLUE_BOOK:        "Book3.png",
  GRAVEYARD_KEY:    "Graveyard Key.png",
  TINGLE_TROPHY:    "Tingle Trophy.png",
  CARLOV_MEDAL:     "Carlov Medal.png",
  JABBER_NUT:       "Jabber Nut.png",
  BOTTLE: ["Empty Bottle.png","Empty Bottle1.png","Empty Bottle2.png","Empty Bottle3.png","Empty Bottle4.png"],

  // Dungeon items  (use generic dungeon icons)

  DUNGEON_COMPASS_DWS: "Compass.png",
  DUNGEON_COMPASS_COF: "Compass.png",
  DUNGEON_COMPASS_FOW: "Compass.png",
  DUNGEON_COMPASS_TOD: "Compass.png",
  DUNGEON_COMPASS_POW: "Compass.png",
  DUNGEON_COMPASS_DHC: "Compass.png",

  DUNGEON_MAP_DWS: "../dungeons/Map.png",
  DUNGEON_MAP_COF: "../dungeons/Map.png",
  DUNGEON_MAP_FOW: "../dungeons/Map.png",
  DUNGEON_MAP_TOD: "../dungeons/Map.png",
  DUNGEON_MAP_POW: "../dungeons/Map.png",
  DUNGEON_MAP_DHC: "../dungeons/Map.png",

  BIG_KEY_DWS: "../dungeons/Big Key.png",
  BIG_KEY_COF: "../dungeons/Big Key.png",
  BIG_KEY_FOW: "../dungeons/Big Key.png",
  BIG_KEY_TOD: "../dungeons/Big Key.png",
  BIG_KEY_POW: "../dungeons/Big Key.png",
  BIG_KEY_DHC: "../dungeons/Big Key.png",

  SMALL_KEY_DWS: "../dungeons/Small Key.png",
  SMALL_KEY_COF: "../dungeons/Small Key.png",
  SMALL_KEY_FOW: "../dungeons/Small Key.png",
  SMALL_KEY_TOD: "../dungeons/Small Key.png",
  SMALL_KEY_POW: "../dungeons/Small Key.png",
  SMALL_KEY_DHC: "../dungeons/Small Key.png",
  SMALL_KEY_RC:  "../dungeons/Small Key.png",

  DWS: "../dungeons/chu.png",
  CoF: "../dungeons/gleerok.png",
  FoW: "../dungeons/mazaal.png",
  ToD: "../dungeons/octo.png",
  PoW: "../dungeons/gyorg.png",
  DHC: "../dungeons/vaati.png",
  RC:  "../dungeons/gustaf.png",

  EARTH_ELEMENT:    "Earth Element.png",
  FIRE_ELEMENT:     "Fire Element.png",
  WATER_ELEMENT:    "Water Element.png",
  WIND_ELEMENT:     "Wind Element.png",

  // Kinstones
  KINSTONE_GOLD_CLOUD:  "Kinstone Clouds Half.png",
  KINSTONE_GOLD_SWAMP:  "Kinstone Wilds Half.png",
  KINSTONE_GOLD_FALLS:  "Kinstone Falls Half.png",
  KINSTONE_RED_W:       "KinstoneRedW.png",
  KINSTONE_RED_ANGLE:   "KinstoneRedV.png",
  KINSTONE_RED_E:       "KinstoneRedE.png",
  KINSTONE_BLUE_L:      "KinstoneBlueL.png",
  KINSTONE_BLUE_6:      "KinstoneBlueS.png",
  KINSTONE_GREEN_ANGLE: "KinstoneGreenC.png",
  KINSTONE_GREEN_SQUARE:"KinstoneGreenG.png",
  KINSTONE_GREEN_P:     "KinstoneGreenP.png",
  KINSTONE_BAG:         "Generic Gold Kinstone.png",

  KINSTONE_GENERIC_RED:   "Generic Red Kinstone.png",
  KINSTONE_GENERIC_BLUE:  "Generic Blue Kinstone.png",
  KINSTONE_GENERIC_GREEN: "Generic Green Kinstone.png",
  KINSTONE_GENERIC_GOLD:  "Generic Gold Kinstone.png",

  AP_ITEM:        "Archipelago.svg",
  AP_ITEM_RED:    "AP_red.svg",
  AP_ITEM_WHITE:  "AP_white.svg",
  AP_ITEM_YELLOW: "AP_yellow.svg",
  AP_ITEM_BLUE:   "AP_blue.svg",
  AP_ITEM_GREEN:  "AP_green.svg",

  BIG_KEY:   "../dungeons/Big Key.png",
  SMALL_KEY: "../dungeons/Small Key.png",
  BUTTERFLY: "overlay_butterfly.png",
}

// Items shown in the main tracker grid (ordered for display)
export const SWORD_GRID_NOT_PROGRESSIVE = [
  ['SMITHS_SWORD','WHITE_SWORD_GREEN','WHITE_SWORD_RED','WHITE_SWORD_BLUE','FOUR_SWORD'],
  ['','GUST_JAR','CANE_OF_PACCI','PROGRESSIVE_BOOMERANG','','','KINSTONE_GOLD_CLOUD','KINSTONE_GREEN_ANGLE'],
]
export const SWORD_GRID_PROGRESSIVE = [
  ['PROGRESSIVE_SWORD','GUST_JAR','CANE_OF_PACCI','PROGRESSIVE_BOOMERANG','','','KINSTONE_GOLD_CLOUD','KINSTONE_GREEN_ANGLE'],
]
export const INVENTORY_GRID = [
  ['PROGRESSIVE_SHIELD','MITTS_AND_FLY','LANTERN','BOMBS_AND_REMOTE','DOG_BOTTLE','FIGURINE','KINSTONE_GOLD_SWAMP','KINSTONE_GREEN_SQUARE'],
  ['PEGASUS_BOOTS','ROCS_CAPE','OCARINA','BOW_AND_FLY','FLIPPERS_AND_FLY','HEART_TOTAL','KINSTONE_GOLD_FALLS','KINSTONE_GREEN_P'],
]
export const QUEST_GRID = [
  ['RING_AND_BRACELETS','NUT_AND_SHROOM','CARLOV_AND_TINGLE','BOTH_KEYS','PROGRESSIVE_BOOK','PROGRESSIVE_WALLET','KINSTONE_RED_W','KINSTONE_BLUE_L'],
]
export const FUSION_GRID = []
export const SCROLL_GRID = [
  ['SPIN_ATTACK','FAST_SPIN_SCROLL','FAST_SPLIT_SCROLL','GREATSPIN','LONG_SPIN','PROGRESSIVE_COUNT_SCROLL','KINSTONE_RED_ANGLE','KINSTONE_BLUE_6'],
  ['PERIL_BEAM','SWORD_BEAM','ROCK_BREAKER','DASH_ATTACK','DOWNTHRUST','ROLL_ATTACK','KINSTONE_RED_E',''],
]



export const TRACKER_GRID = []

//'GRIP_RING','POWER_BRACELETS','JABBER_NUT'
//'TINGLE_TROPHY','CARLOV_MEDAL','WAKEUP_MUSHROOM'
// Dungeon item rows
export const ITEM_MAX_COUNT = {
  SMALL_KEY_DWS:      4,
  SMALL_KEY_COF:      2,
  SMALL_KEY_FOW:      4,
  SMALL_KEY_TOD:      4,
  SMALL_KEY_POW:      6,
  SMALL_KEY_RC:       3,
  SMALL_KEY_DHC:      5,
  HEART_TOTAL:        20,
  FIGURINE:           136,
  PROGRESSIVE_SCROLL: 11,
  KINSTONE_GOLD_CLOUD:5,
  KINSTONE_GOLD_SWAMP:3,
  KINSTONE_RED_W: 9,
  KINSTONE_RED_ANGLE: 7,
  KINSTONE_RED_E: 8,
  KINSTONE_BLUE_L: 9,
  KINSTONE_BLUE_6: 9,
  KINSTONE_GREEN_ANGLE: 17,
  KINSTONE_GREEN_SQUARE: 16,
  KINSTONE_GREEN_P: 16,
}

// Flat list of items available in the location note picker (6 columns × 8 rows)
export const PICKER_ITEMS = [
  'PROGRESSIVE_SWORD',    'GUST_JAR',         'CANE_OF_PACCI',     'PROGRESSIVE_BOOMERANG', 'PROGRESSIVE_WALLET', 'KINSTONE_GENERIC_RED',
  'PROGRESSIVE_SHIELD',   'MOLE_MITTS',       'LANTERN',           'BOMB_BAG',              'REMOTE_BOMB',        'KINSTONE_GENERIC_BLUE',
  'PEGASUS_BOOTS',        'ROCS_CAPE',        'OCARINA',           'PROGRESSIVE_BOW',       'QUIVER',             'KINSTONE_GENERIC_GREEN',
  'DOG_FOOD',             'GRIP_RING',        'CARLOV_MEDAL',      'JABBER_NUT',            'LONLON_KEY',         'KINSTONE_GENERIC_GOLD',
  'BOTTLE',               'POWER_BRACELETS',  'TINGLE_TROPHY',     'WAKEUP_MUSHROOM',       'GRAVEYARD_KEY',      'BIG_KEY',
  'HEART_TOTAL',          'HEART_PIECE',      'PROGRESSIVE_SCROLL','FLIPPERS',              'BUTTERFLY',          'SMALL_KEY',
  'EARTH_ELEMENT',        'FIRE_ELEMENT',     'WATER_ELEMENT',     'WIND_ELEMENT',          'PROGRESSIVE_BOOK',   'FIGURINE',
  'AP_ITEM',              'AP_ITEM_RED',      'AP_ITEM_WHITE',     'AP_ITEM_YELLOW',        'AP_ITEM_BLUE',       'AP_ITEM_GREEN',
]

// Composite items: left-click toggles left sub-item, right-click toggles right sub-item
// Image chosen by state key "${leftHas}${rightHas}"
export const COMPOSITE_DEFS = {
  MITTS_AND_FLY: {
    left: 'MOLE_MITTS', right: 'MITTS_BUTTERFLY',
    disabled00: true,
    images: { '00': 'Mole Mitts.png', '10': 'Mole Mitts.png', '01': 'Mole Mitts B Gray.png', '11': 'Mole Mitts B.png' },
  },
  FLIPPERS_AND_FLY: {
    left: 'FLIPPERS', right: 'FLIPPERS_BUTTERFLY',
    disabled00: true,
    images: { '00': 'Flippers.png', '10': 'Flippers.png', '01': 'Flippers B Gray.png', '11': 'Flippers B.png' },
  },
  RING_AND_BRACELETS: {
    left: 'GRIP_RING', right: 'POWER_BRACELETS',
    images: { '00': 'Power_Grips_Gray.png', '10': 'Power_Grips_G.png', '01': 'Power_Grips_P.png', '11': 'Power_Grips.png' },
  },
  NUT_AND_SHROOM: {
    left: 'JABBER_NUT', right: 'WAKEUP_MUSHROOM',
    images: { '00': 'Jabber_Shroom_Gray.png', '10': 'Jabber_Shroom_J.png', '01': 'Jabber_Shroom_S.png', '11': 'Jabber_Shroom.png' },
  },
  CARLOV_AND_TINGLE: {
    left: 'CARLOV_MEDAL', right: 'TINGLE_TROPHY',
    images: { '00': 'carlov_tingle_gray.png', '10': 'carlov_tingle_c.png', '01': 'carlov_tingle_t.png', '11': 'carlov_tingle.png' },
  },
  BOTH_KEYS: {
    left: 'LONLON_KEY', right: 'GRAVEYARD_KEY',
    images: { '00': 'Both_Keys_Gray.png', '10': 'Both_Keys_L.png', '01': 'Both_Keys_G.png', '11': 'Both_Keys.png' },
  },
}

// Badged items: left-click cycles base item (with loop), right-click toggles badge overlay
export const BADGED_DEFS = {
  BOW_AND_FLY: {
    base: 'PROGRESSIVE_BOW', badge: 'BOW_BUTTERFLY',
    badgeImg: 'overlay_butterfly.png', loop: true,
  },
  DOG_BOTTLE: {
    base: 'BOTTLE', badge: 'DOG_FOOD',
    badgeImg: 'overlay_dogfood.png', loop: true,
  },
  BOMBS_AND_REMOTE: {
    base: 'PROGRESSIVE_BOMB_BAG', badge: 'REMOTE_BOMB',
    badgeImg: 'Remote Bombs.png', loop: true,
  },
}

// Progressives where array[0] is the "disabled/zero" image (direct index = count)
export const PROGRESSIVE_WITH_DISABLED = new Set(['PROGRESSIVE_BOMB_BAG', 'BOTTLE'])

export const DUNGEON_ITEM_ROWS = {
  DWS: { smallKey: 'SMALL_KEY_DWS', bigKey: 'BIG_KEY_DWS', map: 'DUNGEON_MAP_DWS', compass: 'DUNGEON_COMPASS_DWS' },
  CoF: { smallKey: 'SMALL_KEY_COF', bigKey: 'BIG_KEY_COF', map: 'DUNGEON_MAP_COF', compass: 'DUNGEON_COMPASS_COF' },
  FoW: { smallKey: 'SMALL_KEY_FOW', bigKey: 'BIG_KEY_FOW', map: 'DUNGEON_MAP_FOW', compass: 'DUNGEON_COMPASS_FOW' },
  ToD: { smallKey: 'SMALL_KEY_TOD', bigKey: 'BIG_KEY_TOD', map: 'DUNGEON_MAP_TOD', compass: 'DUNGEON_COMPASS_TOD' },
  PoW: { smallKey: 'SMALL_KEY_POW', bigKey: 'BIG_KEY_POW', map: 'DUNGEON_MAP_POW', compass: 'DUNGEON_COMPASS_POW' },
  RC:  { smallKey: 'SMALL_KEY_RC' },
  DHC: { smallKey: 'SMALL_KEY_DHC', bigKey: 'BIG_KEY_DHC', map: 'DUNGEON_MAP_DHC', compass: 'DUNGEON_COMPASS_DHC' },
}
