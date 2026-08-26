<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useStateStore } from '../stores/stateStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useLocale } from '../composables/useLocale'
import itemsSpec from '../data/items_spec.json'
import trackerLayout from '../../SubModule/tmcrando_maptracker_deoxis/layouts/tracker.json'

const props = defineProps({
  rows: { type: Array, default: null },
})

const store = useStateStore()
const { randoDefines } = storeToRefs(useSettingsStore())
const { tItem } = useLocale()

const BASE = import.meta.env.BASE_URL
const imgSrc = path => `${BASE}${path}`

// Grid rows: from prop or from tracker.json (canonical source), beta filtered out.
// Inject ud_cm into the last empty cell of the cm row (for universal compass/map setting).
const _baseRows = trackerLayout.shared_item_grid.rows.map(row =>
  row.map(code => code === 'beta' ? '' : code)
)
const defaultRows = computed(() => {
  const rd = randoDefines.value ?? {}
  const cmUniversal = rd.COMPASS_SETTING === 'COMPASS_UNIVERSAL' || rd.MAP_SETTING === 'MAP_UNIVERSAL'
  return _baseRows.map(row => {
    if (!cmUniversal || !row.includes('dws_cm')) return row
    const lastEmpty = row.lastIndexOf('')
    if (lastEmpty < 0) return row
    const r = [...row]; r[lastEmpty] = 'ud_cm'; return r
  })
})
const gridRows = computed(() => props.rows ?? defaultRows.value)

// Build code→def map for O(1) lookup (primary codes + aliases)
const defsMap = {}
for (const d of itemsSpec.items) {
  defsMap[d.codes] = d
  for (const a of (d.aliases ?? [])) defsMap[a] = d
}

// ── Hidden codes (fusion settings) ───────────────────────────────────────────

const hiddenCodes = computed(() => {
  const rd = randoDefines.value ?? {}
  const hidden = new Set()

  // ── Kinstone fusions ─────────────────────────────────────────────────────
  const gold = rd.GOLD_FUSION_SETTING
  if      (gold === 'OPEN_GOLD_FUSIONS' || gold === 'NO_GOLD_FUSIONS') { hidden.add('clouds'); hidden.add('wilds'); hidden.add('falls') }
  else if (gold === 'COMBINED_GOLD_FUSIONS')                            { hidden.add('wilds');  hidden.add('falls') }
  const red = rd.RED_FUSION_SETTING
  if      (red === 'OPEN_RED_FUSIONS' || red === 'NO_RED_FUSIONS')     { hidden.add('redW'); hidden.add('redV'); hidden.add('redE') }
  else if (red === 'COMBINED_RED_FUSIONS')                              { hidden.add('redV'); hidden.add('redE') }
  const blue = rd.BLUE_FUSION_SETTING
  if      (blue === 'OPEN_BLUE_FUSIONS' || blue === 'NO_BLUE_FUSIONS') { hidden.add('blueL'); hidden.add('blueS') }
  else if (blue === 'COMBINED_BLUE_FUSIONS')                            { hidden.add('blueS') }
  const green = rd.GREEN_FUSION_SETTING
  if      (green === 'OPEN_GREEN_FUSIONS' || green === 'NO_GREEN_FUSIONS') { hidden.add('greenC'); hidden.add('greenG'); hidden.add('greenP') }
  else if (green === 'COMBINED_GREEN_FUSIONS')                              { hidden.add('greenG'); hidden.add('greenP') }

  // ── Sword progression ─────────────────────────────────────────────────────
  const swordProg = rd.YES_SWORD_PROG ?? true
  if (swordProg) {
    hidden.add('smithsword'); hidden.add('greensword'); hidden.add('redsword')
    hidden.add('bluesword');  hidden.add('foursword')
  } else {
    hidden.add('sword0')
  }

  // ── Universal dungeon items ───────────────────────────────────────────────
  const skUni   = rd.SMALL_KEYS_SETTING === 'SMALL_KEYS_UNIVERSAL'
  const bkUni   = rd.BIG_KEYS_SETTING   === 'BIG_KEYS_UNIVERSAL'
  const cmUni   = rd.COMPASS_SETTING    === 'COMPASS_UNIVERSAL' || rd.MAP_SETTING === 'MAP_UNIVERSAL'

  if (skUni) {
    hidden.add('dws_smallkey'); hidden.add('cof_smallkey'); hidden.add('fow_smallkey')
    hidden.add('tod_smallkey'); hidden.add('rc_smallkey');  hidden.add('pow_smallkey')
    hidden.add('dhc_smallkey')
  }
  if (bkUni) {
    hidden.add('dws_bigkey'); hidden.add('cof_bigkey'); hidden.add('fow_bigkey')
    hidden.add('tod_bigkey'); hidden.add('pow_bigkey'); hidden.add('dhc_bigkey')
  }
  if (cmUni) {
    hidden.add('dws_cm'); hidden.add('cof_cm'); hidden.add('fow_cm')
    hidden.add('tod_cm'); hidden.add('pow_cm'); hidden.add('dhc_cm')
  }

  if (!skUni && !bkUni && !cmUni) hidden.add('universal_dungeons')

  return hidden
})

// ── Consumable multipliers (keychain size + kinstone pack size) ───────────────

const CONSUMABLE_MULTIPLIER_DEFINE = {
  // Small keys
  dws_smallkey: 'KEYDWSMULTIPLIER',
  cof_smallkey: 'KEYCOFMULTIPLIER',
  fow_smallkey: 'KEYFOWMULTIPLIER',
  tod_smallkey: 'KEYTODMULTIPLIER',
  rc_smallkey:  'KEYRCMULTIPLIER',
  pow_smallkey: 'KEYPOWMULTIPLIER',
  dhc_smallkey: 'KEYDHCMULTIPLIER',
  // Kinstones
  clouds: 'GOLD1MULTIPLIER',
  wilds:  'GOLD2MULTIPLIER',
  redW:   'REDWMULTIPLIER',
  redV:   'REDVMULTIPLIER',
  redE:   'REDEMULTIPLIER',
  blueL:  'BLUELMULTIPLIER',
  blueS:  'BLUESMULTIPLIER',
  greenC: 'GREENCMULTIPLIER',
  greenG: 'GREENGMULTIPLIER',
  greenP: 'GREENPMULTIPLIER',
}

function getConsumableMultiplier(code) {
  const defineName = CONSUMABLE_MULTIPLIER_DEFINE[code]
  if (!defineName) return 1
  const val = String((randoDefines.value ?? {})[defineName] ?? '1')
  if (val.endsWith('MAX')) return 1
  const m = val.match(/\d+/)
  return m ? parseInt(m[0]) : 1
}

function stepConsumable(def, dir) {
  const cur  = getVal(def.codes)
  const min  = def.min_quantity ?? 0
  const max  = def.max_quantity
  const mult = getConsumableMultiplier(def.codes)
  let next
  if (dir > 0) {
    next = Math.min(cur + mult, max)
  } else {
    next = cur % mult === 0
      ? cur - mult
      : Math.floor(cur / mult) * mult
    next = Math.max(next, min)
  }
  setVal(def.codes, next)
}

// ── State accessors ───────────────────────────────────────────────────────────

function getVal(code, init = 0) { return store.manualItems[code] ?? init }
function setVal(code, v) { store.manualItems[code] = v }

// ── Dungeon boss drag (entrance shuffle) ──────────────────────────────────────

const BOSS_CODES = new Set(['dws', 'cof', 'fow', 'tod', 'rc', 'pow', 'dhc'])

function onBossDragStart(code, event) {
  event.dataTransfer.setData('dungeon-code', code)
  event.dataTransfer.effectAllowed = 'link'
}

// ── Click handlers ────────────────────────────────────────────────────────────

function onLeftClick(def) {
  if (!def) return
  switch (def.type) {
    case 'toggle':
      setVal(def.codes, getVal(def.codes) > 0 ? 0 : 1)
      break
    case 'progressive':
      stepProgressive(def, 1)
      break
    case 'consumable':
      stepConsumable(def, 1)
      break
    case 'composite_toggle':
      setVal(def.item_left, getVal(def.item_left) > 0 ? 0 : 1)
      break
    case 'toggle_badged':
      clickBadgedBase(def)
      break
  }
}

function onRightClick(def) {
  if (!def) return
  switch (def.type) {
    case 'toggle':
      setVal(def.codes, getVal(def.codes) > 0 ? 0 : 1)
      break
    case 'progressive':
      stepProgressive(def, -1)
      break
    case 'consumable':
      stepConsumable(def, -1)
      break
    case 'composite_toggle':
      setVal(def.item_right, getVal(def.item_right) > 0 ? 0 : 1)
      break
    case 'toggle_badged':
      setVal(def.codes, getVal(def.codes) > 0 ? 0 : 1)
      break
  }
}

function stepProgressive(def, dir, forceLoop = false) {
  const n = def.stages.length
  const cur = getVal(def.codes, def.initial_stage_idx ?? 0)
  let next
  if (def.loop || forceLoop) {
    const min = def.allow_disabled === false ? 1 : 0
    const range = n - min
    next = ((cur + dir - min) % range + range) % range + min
  } else {
    next = Math.max(0, Math.min(n - 1, cur + dir))
  }
  setVal(def.codes, next)
}

function clickBadgedBase(def) {
  const baseDef = defsMap[def.base_item]
  if (!baseDef) { setVal(def.base_item, getVal(def.base_item) > 0 ? 0 : 1); return }
  if (baseDef.type === 'progressive') setVal(baseDef.codes, (getVal(baseDef.codes) + 1) % baseDef.stages.length)
  else if (baseDef.type === 'consumable') setVal(baseDef.codes, Math.min(baseDef.max_quantity, getVal(baseDef.codes) + 1))
  else setVal(def.base_item, getVal(def.base_item) > 0 ? 0 : 1)
}

// ── Image resolution ──────────────────────────────────────────────────────────

function autoCount(def) {
  return (def.auto_count_codes ?? []).filter(c => getVal(c) > 0).length
}

function cellImg(def) {
  if (!def) return null
  switch (def.type) {
    case 'toggle':
      return imgSrc(def.img)
    case 'progressive': {
      const idx = Math.min(getVal(def.codes, def.initial_stage_idx ?? 0), def.stages.length - 1)
      return imgSrc(def.stages[idx].img)
    }
    case 'consumable':
    case 'auto_count':
      return imgSrc(def.img)
    case 'composite_toggle': {
      const l = getVal(def.item_left) > 0
      const r = getVal(def.item_right) > 0
      const entry = def.images.find(i => i.left === l && i.right === r)
      return entry ? imgSrc(entry.img) : null
    }
    case 'toggle_badged': {
      const baseDef = defsMap[def.base_item]
      return baseDef ? cellImg(baseDef) : null
    }
  }
  return null
}

// ── Active state ──────────────────────────────────────────────────────────────

function isActive(def) {
  if (!def) return false
  switch (def.type) {
    case 'toggle':          return getVal(def.codes) > 0
    case 'progressive':     return def.allow_disabled === false || getVal(def.codes, def.initial_stage_idx ?? 0) > 0
    case 'consumable':      return getVal(def.codes) > 0
    case 'auto_count':      return autoCount(def) > 0
    case 'composite_toggle': return getVal(def.item_left) > 0 || getVal(def.item_right) > 0
    case 'toggle_badged':   return getVal(def.base_item) > 0
  }
  return false
}

function isBadgeActive(def) { return getVal(def.codes) > 0 }

function countBadge(def) {
  if (def?.type === 'consumable' && getVal(def.codes) > 0) return getVal(def.codes)
  if (def?.type === 'auto_count') return autoCount(def)
  return null
}

function isCountMax(def) {
  if (def?.type === 'consumable') return getVal(def.codes) >= def.max_quantity
  if (def?.type === 'auto_count') return autoCount(def) >= (def.auto_count_codes?.length ?? 0)
  return false
}
</script>

<template>
  <div class="item-grid-panel">
    <div
      v-for="(row, ri) in gridRows"
      :key="ri"
      class="item-row"
    >
      <template v-for="(code, ci) in row" :key="`${ri}-${ci}`">
        <div v-if="!code || hiddenCodes.has(code)" class="item-cell empty" />

        <div
          v-else-if="defsMap[code]?.type === 'toggle_badged'"
          :class="['item-cell', 'item-badged', isActive(defsMap[code]) && 'has-item']"
          :title="tItem(defsMap[code]?.codes, defsMap[code]?.name ?? code)"
          @click="onLeftClick(defsMap[code])"
          @contextmenu.prevent="onRightClick(defsMap[code])"
        >
          <img v-if="cellImg(defsMap[code])" :src="cellImg(defsMap[code])" :alt="code" />
          <div v-else class="item-placeholder">{{ code.slice(0, 4) }}</div>
          <img v-if="isBadgeActive(defsMap[code])" :src="imgSrc(defsMap[code].img)" class="badge-overlay" alt="badge" />
        </div>

        <div
          v-else
          :class="['item-cell', isActive(defsMap[code]) && 'has-item']"
          :title="tItem(defsMap[code]?.codes, defsMap[code]?.name ?? code)"
          :draggable="BOSS_CODES.has(code)"
          @dragstart="BOSS_CODES.has(code) && onBossDragStart(code, $event)"
          @click="onLeftClick(defsMap[code])"
          @contextmenu.prevent="onRightClick(defsMap[code])"
        >
          <img v-if="defsMap[code] && cellImg(defsMap[code])" :src="cellImg(defsMap[code])" :alt="code" draggable="false" />
          <div v-else class="item-placeholder">{{ code.slice(0, 4) }}</div>
          <span
            v-if="countBadge(defsMap[code]) !== null"
            :class="['count-badge', isCountMax(defsMap[code]) && 'count-max']"
          >{{ countBadge(defsMap[code]) }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.item-grid-panel {
  background: var(--bg-card);
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

.item-row {
  display: flex;
  gap: 2px;
}

.item-cell {
  position: relative;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 3px;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.15s, border-color 0.15s;
  overflow: hidden;
  flex-shrink: 0;
}
.item-cell:hover       { opacity: 0.6; border-color: var(--accent-soft); }
.item-cell.has-item    { opacity: 1; border-color: var(--checked, #7ac038); }
.item-cell.empty {
  background: transparent;
  border-color: transparent;
  cursor: default;
  pointer-events: none;
}

.item-cell img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: auto;
}

.item-badged { position: relative; }
.badge-overlay {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 55%;
  height: 55%;
  object-fit: contain;
  pointer-events: none;
}

.count-badge {
  position: absolute;
  bottom: 1px;
  right: 2px;
  font-size: 8px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 3px #000, 0 0 3px #000;
  line-height: 1;
  pointer-events: none;
}
.count-badge.count-max { color: #7ac038; }

.item-placeholder {
  font-size: 7px;
  color: var(--text-muted);
  text-align: center;
}
</style>
