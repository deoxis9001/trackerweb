const modules = import.meta.glob(
  '../../SubModule/tmcrando_maptracker_deoxis/emo/json/locations/*.json',
  { eager: true }
)

const REGION_NAMES = {
  Town:             'Hyrule Town',
  Castle:           'Hyrule Castle',
  Clouds:           'Wind Tribe',
  Crenel:           'Mount Crenel',
  CrenelBase:       'Mount Crenel',
  Falls:            'Veil Falls',
  FallsLower:       'Veil Falls',
  Hills:            'Eastern Hills',
  Hylia:            'Lake Hylia',
  LonLon:           'Lon Lon Ranch',
  Mines:            'Mount Crenel',
  MinishWoods:      'Minish Woods',
  NorthField:       'North Hyrule Field',
  Ruins:            'Ancient Ruins',
  SouthHyruleField: 'South Hyrule Field',
  Swamp:            'Castor Wilds',
  Trilby:           'Trilby Highlands',
  Valley:           'Royal Valley',
  WesternWoods:     'Western Wood',
  Dungeons:         null,
  General:          'Shared',
}

const DUNGEON_SHORT = {
  'Cave Of Flame':               'CoF',
  'Cave Of Flame Entrance':      'CoF',
  'Crypt':                       'RC',
  'Crypt Entrance':              'RC',
  'DeepWoods':                   'DWS',
  'Deepwoods Entrance':          'DWS',
  'Fortress':                    'FoW',
  'Fortress Entrance':           'FoW',
  'Palace':                      'PoW',
  'Palace Entrance':             'PoW',
  'Droplet':                     'ToD',
  'Droplet Entrance':            'ToD',
  'DHC':                         'DHC',
  'Dark Hyrule Castle Entrance': 'DHC',
}

function fusionPool(rules) {
  if (!Array.isArray(rules)) return null
  const r = rules.join('|')
  if (r.includes('fusiongold'))  return 'fuse_gold'
  if (r.includes('fusionred'))   return 'fuse_red'
  if (r.includes('fusionblue'))  return 'fuse_blue'
  if (r.includes('fusiongreen')) return 'fuse_green'
  return null
}

function derivePools(loc) {
  const pools = new Set()
  const ln = loc.name?.toLowerCase() ?? ''

  for (const sec of (loc.sections ?? [])) {
    const img = sec.chest_unopened_img ?? ''
    const sn  = sec.name?.toLowerCase() ?? ''

    if (img.includes('Heart Piece') || sn === 'hp') pools.add('hp')
    if (img.includes('Tiger Scroll'))               pools.add('scroll')
    if (sn === 'pot')                               pools.add('pot')
    if (sn.includes('underwater'))                  pools.add('water')
    if (sn.includes('butterfly'))                   pools.add('butterfly')
    if (sn === 'reward')                            pools.add('element')
    if (sec.hosted_item) {
      const fp = fusionPool(sec.visibility_rules)
      if (fp) pools.add(fp)
    }
  }

  if (ln.includes('scrub'))                                  pools.add('scrub')
  if (ln.includes('great fairy'))                            pools.add('fairy')
  if (ln.includes('butterfly'))                              pools.add('butterfly')
  if (ln.includes('dojo'))                                   pools.add('scroll')
  if (ln.includes('dig'))                                    pools.add('dig')
  if (ln.includes('shop') || ln.includes('goron merchant')) pools.add('shop')
  if (ln.includes('golden'))                                 pools.add('enemy')

  return [...pools]
}

function toKey(name) {
  return name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')
}

const MAP_PREFIX_TO_DUNGEON = {
  cof: 'CoF', dws: 'DWS', fow: 'FoW', tod: 'ToD', pow: 'PoW', dhc: 'DHC', rc: 'RC'
}
function dungeonFromMapLocs(mapLocs) {
  for (const ml of (mapLocs ?? [])) {
    const base = ml.map.split('_')[0]
    if (MAP_PREFIX_TO_DUNGEON[base]) return MAP_PREFIX_TO_DUNGEON[base]
  }
  return null
}

export const locationsByFile = {}
export const allLocations = []
let _id = 0

for (const [path, mod] of Object.entries(modules)) {
  const filename = path.split('/').pop().replace('.json', '')

  for (const loc of mod.default) {
    const dungeon = filename === 'Dungeons'
      ? (loc.short_name ?? DUNGEON_SHORT[loc.name] ?? null)
      : filename === 'Maps'
        ? dungeonFromMapLocs(loc.map_locations)
        : null

    const locKey = toKey(loc.name)
    const entry = {
      ...loc,
      id:          _id++,
      key:         locKey,
      region_key:  filename,
      region_name: REGION_NAMES[filename] ?? filename,
      dungeon,
      pools:       derivePools(loc),
      sections:    (loc.sections ?? []).map(sec => ({
        ...sec,
        key: locKey + '_' + toKey(sec.name),
      })),
    }
    allLocations.push(entry)
    ;(locationsByFile[filename] ??= []).push(entry)
  }
}
