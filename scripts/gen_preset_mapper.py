"""
Generates src/logic/presetMapper.js from the mapping table defined below.
Maps randomizer YAML preset keys → settingsStore fields + value transforms.

Run standalone: py scripts/gen_preset_mapper.py
Or via:         npm run generate  (called automatically)
"""
from pathlib import Path

OUT_FILE = Path(__file__).parent.parent / 'src/logic/presetMapper.js'

# ── Mapping tables ────────────────────────────────────────────────────────────

# { preset_key: (store_field, { preset_value: store_value }) }
ENUM_MAP = {
    'MAP_SETTING': ('dungeonMaps', {
        'MAP_KEASY':     'start_with',
        'MAP_STANDARD':  'own_dungeon',
        'MAP_REGION':    'own_dungeon',
        'MAP_KEYSANITY': 'anywhere',
    }),
    'COMPASS_SETTING': ('dungeonCompasses', {
        'COMPASS_KEASY':     'start_with',
        'COMPASS_STANDARD':  'own_dungeon',
        'COMPASS_REGION':    'own_dungeon',
        'COMPASS_KEYSANITY': 'anywhere',
    }),
    'SMALL_KEYS_SETTING': ('dungeonSmallKeys', {
        'SMALL_KEASY':         'start_with',
        'SMALL_KEYS_STANDARD': 'own_dungeon',
        'SMALL_KEYS_REGION':   'own_dungeon',
        'SMALL_KEYS_VANILLA':  'own_dungeon',
        'SMALL_KEYSANITY':     'anywhere',
    }),
    'BIG_KEYS_SETTING': ('dungeonBigKeys', {
        'BIG_KEASY':         'start_with',
        'BIG_KEYS_STANDARD': 'own_dungeon',
        'BIG_KEYS_REGION':   'own_dungeon',
        'BIG_KEYS_VANILLA':  'own_dungeon',
        'BIG_KEYSANITY':     'anywhere',
    }),
    'SHUFFLE_ELEMENTS': ('shuffleElements', {
        'SHUFFLE_ELEMENTS_OFF':           'vanilla',
        'SHUFFLE_ELEMENTS_VANILLA':       'vanilla',
        'SHUFFLE_ELEMENTS_DUNGEON':       'dungeon_prize',
        'SHUFFLE_ELEMENTS_DUNGEON_PRIZE': 'dungeon_prize',
        'SHUFFLE_ELEMENTS_REGION':        'dungeon_prize',
        'SHUFFLE_ELEMENTS_ON':            'anywhere',
    }),
    'DHC_SETTING': ('dhcAccess', {
        'NODHC':     'closed',
        'NORMALDHC': 'pedestal',
        'OPENDHC':   'open',
    }),
    'GOLD_FUSION_SETTING': ('goldFusionAccess', {
        'NO_GOLD_FUSIONS':       'closed',
        'VANILLA_GOLD_FUSIONS':  'vanilla',
        'COMBINED_GOLD_FUSIONS': 'combined',
        'OPEN_GOLD_FUSIONS':     'open',
    }),
    'RED_FUSION_SETTING': ('redFusionAccess', {
        'NO_RED_FUSIONS':       'closed',
        'VANILLA_RED_FUSIONS':  'vanilla',
        'COMBINED_RED_FUSIONS': 'combined',
        'OPEN_RED_FUSIONS':     'open',
    }),
    'BLUE_FUSION_SETTING': ('blueFusionAccess', {
        'NO_BLUE_FUSIONS':       'closed',
        'VANILLA_BLUE_FUSIONS':  'vanilla',
        'COMBINED_BLUE_FUSIONS': 'combined',
        'OPEN_BLUE_FUSIONS':     'open',
    }),
    'GREEN_FUSION_SETTING': ('greenFusionAccess', {
        'NO_GREEN_FUSIONS':       'closed',
        'VANILLA_GREEN_FUSIONS':  'vanilla',
        'COMBINED_GREEN_FUSIONS': 'combined',
        'OPEN_GREEN_FUSIONS':     'open',
    }),
    'BIGGORON_SETTING': ('biggoron', {
        'BIGGORON_OFF':    'disabled',
        'BIGGORON_NORMAL': 'shield',
        'BIGGORON_SHIELD': 'shield',
        'BIGGORON_MIRROR': 'mirror_shield',
    }),
    'BOMBWEAPON': ('weaponBomb', {
        'NOBOMB':   0,
        'YESBOMB':  1,
        'BOSSBOMB': 2,
    }),
    'BOWWEAPON': ('weaponBow', {
        'NOBOW':   False,
        'YESBOW':  True,
        'BOSSBOW': True,
    }),
    'GUSTWEAPON': ('weaponGust', {
        'NOGUST':  False,
        'YESGUST': True,
    }),
    'LAMPWEAPON': ('weaponLantern', {
        'NOLAMP':  False,
        'YESLAMP': True,
    }),
}

# { preset_key: (store_field, js_transform_fn) }
# js_transform_fn: JS arrow function source that receives the string preset value
NUM_MAP = {
    'SWORD_SETTING':   ('pedSwords',              "v => parseInt(v) || 0"),
    'ELEMENT_SETTING': ('pedElements',            "v => parseInt(v) || 0"),
    'CUCCO_SETTING':   ('cuccoRounds',            "v => { const m = v.match(/\\d+$/); return m ? +m[0] : 0 }"),
    'GORON_SETTING':   ('goronSets',              "v => { const m = v.match(/\\d+$/); return m ? +m[0] : 0 }"),
    'GOLD1MULTIPLIER': ('cloudKinstoneMultiplier', "v => v === 'GOLD1MAX' ? 9 : Math.max(1, +v || 1)"),
    'GOLD2MULTIPLIER': ('swampKinstoneMultiplier', "v => v === 'GOLD2MAX' ? 3 : Math.max(1, +v || 1)"),
}

# { preset_key: store_field }  (preset value is a bool, store field is a bool)
BOOL_MAP = {
    'CRENEL_CREST':          'windCrestCrenel',
    'FALLS_CREST':           'windCrestFalls',
    'CLOUD_CREST':           'windCrestClouds',
    'TOWN_CREST':            'windCrestCastor',
    'SHF_CREST':             'windCrestSouthField',
    'MINISH_CREST':          'windCrestMinishWoods',
    'RUPEEMANIA':            'rupeesanity',
    'SPECIALPOTS':           'shufflePots',
    'DIGGING':               'shuffleDigging',
    'UNDERWATER':            'shuffleUnderwater',
    'GOLDEN_ENEMY':          'shuffleGoldEnemies',
    'SHOP_BOMBBAG':          'extraShopItem',
    'RANDOM_BOTTLE_CONTENT': 'randomBottleContents',
    'TRAPS':                 'trapsEnabled',
    'YES_SWORD_PROG':        'progressiveSword',
    'YES_BOW_PROG':          'progressiveBow',
    'YES_BOOM_PROG':         'progressiveBoomerang',
    'YES_SHIELD_PROG':       'progressiveShield',
    'YES_SCROLL_PROG':       'progressiveScroll',
    'GORON_ALT_PRICES':      'goronJPPrices',
}

# [(blue_preset_key, red_preset_key, store_field)]
# store_field value: 0=none, 1=blue, 2=red, 3=both
WARP_PAIRS = [
    ('DWS_BLUEWARP', 'DWS_REDWARP', 'warpDWS'),
    ('COF_BLUEWARP', 'COF_REDWARP', 'warpCoF'),
    ('FOW_BLUEWARP', 'FOW_REDWARP', 'warpFoW'),
    ('TOD_BLUEWARP', 'TOD_REDWARP', 'warpToD'),
    ('POW_BLUEWARP', 'POW_REDWARP', 'warpPoW'),
    ('DHC_BLUEWARP', 'DHC_REDWARP', 'warpDHC'),
]

# { preset_key: (trick_store_key, [preset_values_that_enable_it]) }
TRICK_MAP = {
    'BLOWDUST_SETTING':    ('bomb_dust',         ['GUSTBOMBS']),
    'MUSHROOM_SETTING':    ('mushroom',           ['YESMUSH']),
    'ARROWBREAK_SETTING':  ('arrows_break',       ['YESLIGHTS']),
    'BOBOMBS_SETTING':     ('bobomb_walls',       ['YESBOBOMBS']),
    'LIKELIKE_SETTING':    ('likelike_swordless', ['YESLIKELIKE']),
    'GUARDSKIP_SETTING':   ('boots_guards',       ['YESGUARDSKIP']),
    'CRENELBEAM_SETTING':  ('beam_crenel_switch', ['YESBEAM']),
    'DTBEETLE_SETTING':    ('downthrust_beetle',  ['YESTHRUST']),
    'DARKROOMS_SETTING':   ('dark_rooms',         ['YESDARK']),
    'EXTENDCAPE_SETTING':  ('cape_extensions',    ['YESEXTENSION']),
    'LAKEMINISH_SETTING':  ('lake_minish',        ['YESLAKEMINISH']),
    'CABINSWIM_SETTING':   ('cabin_swim',         ['YESCABIN']),
    'CLOUDSKILL_SETTING':  ('sharks_swordless',   ['YESCLOUDSKILL']),
    'POWJUMP_SETTING':     ('pow_nocane',         ['YESPOWJUMP']),
    'POWPOTOOL_SETTING':   ('pot_puzzle',         ['YESPOWOOL']),
    'DHCCANON_SETTING':    ('dhc_cannons',        ['YESDHCCANON']),
    'DHCJOSTLE_SETTING':   ('dhc_clones',         ['YESDHCJOSTLE']),
    'DHCSWITCHES_SETTING': ('dhc_spin',           ['YESDHCSWITCHES']),
    'FOWPOT_SETTING':      ('fow_pot',            ['YESFOWPOT']),
}

# ── Code generation ───────────────────────────────────────────────────────────

def js_val(v):
    """Serialize a Python value to a JS literal."""
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, int):
        return str(v)
    if isinstance(v, str):
        # Escape single quotes inside the string
        return "'" + v.replace("'", "\\'") + "'"
    raise ValueError(f'Cannot serialize {v!r}')


def emit_enum_map():
    lines = ['const _ENUM = {']
    for preset_key, (store_field, value_map) in ENUM_MAP.items():
        lines.append(f"  {preset_key}: ['{store_field}', {{")
        for pv, sv in value_map.items():
            lines.append(f"    {pv}: {js_val(sv)},")
        lines.append('  }],')
    lines.append('}')
    return '\n'.join(lines)


def emit_bool_map():
    lines = ['const _BOOL = {']
    for preset_key, store_field in BOOL_MAP.items():
        lines.append(f"  {preset_key}: '{store_field}',")
    lines.append('}')
    return '\n'.join(lines)


def emit_num_map():
    lines = ['const _NUM = {']
    for preset_key, (store_field, fn) in NUM_MAP.items():
        lines.append(f"  {preset_key}: ['{store_field}', {fn}],")
    lines.append('}')
    return '\n'.join(lines)


def emit_warp_pairs():
    lines = ['const _WARP = [']
    for bk, rk, field in WARP_PAIRS:
        lines.append(f"  ['{bk}', '{rk}', '{field}'],")
    lines.append(']')
    return '\n'.join(lines)


def emit_trick_map():
    lines = ['const _TRICK = {']
    for preset_key, (trick_key, enabled_vals) in TRICK_MAP.items():
        ev_js = ', '.join(f"'{v}'" for v in enabled_vals)
        lines.append(f"  {preset_key}: ['{trick_key}', new Set([{ev_js}])],")
    lines.append('}')
    return '\n'.join(lines)


def main():
    body = f"""\
// AUTO-GENERATED by scripts/gen_preset_mapper.py — do not edit manually
// Maps randomizer preset keys → settingsStore fields.

{emit_enum_map()}

{emit_bool_map()}

{emit_num_map()}

{emit_warp_pairs()}

{emit_trick_map()}

/**
 * Apply a preset's settings object to the settingsStore.
 * @param {{Object}} presetSettings  - preset.settings from presets.json
 * @param {{Object}} store           - useSettingsStore() instance
 */
export function applyPreset(presetSettings, store) {{
  const s = presetSettings

  for (const [k, [field, map]] of Object.entries(_ENUM)) {{
    if (s[k] != null && map[s[k]] != null) store[field] = map[s[k]]
  }}

  for (const [k, field] of Object.entries(_BOOL)) {{
    if (s[k] != null) store[field] = Boolean(s[k])
  }}

  for (const [k, [field, fn]] of Object.entries(_NUM)) {{
    if (s[k] != null) store[field] = fn(String(s[k]))
  }}

  for (const [bk, rk, field] of _WARP) {{
    if (s[bk] != null || s[rk] != null) {{
      store[field] = (s[bk] ? 1 : 0) + (s[rk] ? 2 : 0)
    }}
  }}

  const nextTricks = new Set(store.tricks)
  for (const [k, [trick, enabled]] of Object.entries(_TRICK)) {{
    if (s[k] != null) {{
      if (enabled.has(s[k])) nextTricks.add(trick)
      else nextTricks.delete(trick)
    }}
  }}
  store.tricks = nextTricks
}}
"""

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(body, encoding='utf-8')
    print(f'Wrote {OUT_FILE}')


if __name__ == '__main__':
    main()
