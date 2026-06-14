import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const LUA_PATH = 'd:/git/emotracker/BetaTmcrTrackerDeoxis/pop/scripts/autotracking/room_mapping.lua'

const DUNGEON_NAME_TO_CODE = {
  'Deepwood Shrine':   'DWS',
  'Cave of Flames':    'CoF',
  'Fortress of Winds': 'FoW',
  'Fortress Of Winds': 'FoW',
  'Temple of Droplets':'ToD',
  'Royal Crypt':       'RC',
  'Palace of Winds':   'PoW',
  'Dark Hyrule Castle':'DHC',
}
const normalizeFloor = f => f === 'Sanctuary' ? 'Sanc' : f

const lua = fs.readFileSync(LUA_PATH, 'utf8')
const re  = /\['([0-9A-Fa-f]{4})'\]\s*=\s*\{[^}]*\{([^}]+)\}\s*\}/g
const result = {}
let m
while ((m = re.exec(lua)) !== null) {
  const parts = m[2].split(',').map(s => s.trim().replace(/'/g, ''))
  if (parts.length < 3) continue
  const dungeon = DUNGEON_NAME_TO_CODE[parts[1]]
  if (!dungeon) continue
  const floor = normalizeFloor(parts[2])
  result[parseInt(m[1], 16)] = { dungeon, floor }
}

fs.writeFileSync(
  path.join(ROOT, 'data/room_area_to_floor.json'),
  JSON.stringify(result, null, 2), 'utf8'
)
console.log(`Written ${Object.keys(result).length} dungeon room entries to data/room_area_to_floor.json`)
