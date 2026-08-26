<script setup>
import { useStateStore } from '../stores/stateStore'
import { ITEM_IMAGES } from '../metadata/itemImages'
import { useLocale } from '../composables/useLocale'

const state = useStateStore()
const { t } = useLocale()

const GRID = [
  ['CoF', 'RC',  'DHC', 'PoW'],
  [null,  null,  null,  'ToD'],
  ['FoW', null,  null,  'DWS'],
]

const DUNGEONS = ['DWS', 'CoF', 'FoW', 'ToD', 'RC', 'PoW', 'DHC']

function bossImg(slot) {
  if (!slot) return null
  const p = ITEM_IMAGES[slot]
  return p ? p.replace('../dungeons/', '/images/dungeons/') : null
}

function assigned(slot) {
  return state.dungeonEntranceMap[slot] ?? null
}

function cycleEntrance(slot, dir) {
  const cur = assigned(slot)
  const idx = cur ? DUNGEONS.indexOf(cur) : -1
  const n = DUNGEONS.length
  let next
  if (dir > 0) {
    next = idx < n - 1 ? DUNGEONS[idx + 1] : null
  } else {
    next = idx === -1 ? DUNGEONS[n - 1] : idx > 0 ? DUNGEONS[idx - 1] : null
  }
  if (next) state.setDungeonEntrance(slot, next)
  else state.clearDungeonEntrance(slot)
}
</script>

<template>
  <div class="entrance-panel">
    <div class="ep-title">{{ t('item_grid.entrances') }}</div>
    <div class="ep-grid">
      <template v-for="(row, ri) in GRID" :key="ri">
        <div
          v-for="(slot, ci) in row"
          :key="`${ri}-${ci}`"
          :class="['ep-cell', slot ? 'ep-active' : 'ep-empty']"
          @click="slot && cycleEntrance(slot, 1)"
          @contextmenu.prevent="slot && cycleEntrance(slot, -1)"
        >
          <template v-if="slot">
            <span class="ep-label">{{ slot }}</span>
            <div class="ep-icon">
              <img v-if="bossImg(assigned(slot))" :src="bossImg(assigned(slot))" :alt="assigned(slot)" />
              <span v-else class="ep-unset">?</span>
            </div>
            <span class="ep-assigned">{{ assigned(slot) ?? '—' }}</span>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.entrance-panel {
  background: var(--bg-card);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.ep-title {
  padding: 3px 8px;
  background: var(--bg-panel);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.ep-grid {
  display: grid;
  grid-template-columns: repeat(4, 44px);
  grid-template-rows: repeat(3, 52px);
  gap: 2px;
  padding: 4px;
}

.ep-cell {
  border-radius: 3px;
  border: 1px solid transparent;
}

.ep-empty {
  background: transparent;
  cursor: default;
}

.ep-active {
  background: var(--bg-dark);
  border-color: var(--border);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
}
.ep-active:hover { border-color: var(--accent-soft); }

.ep-label {
  font-size: 7px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.ep-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ep-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.ep-unset {
  font-size: 16px;
  color: var(--text-muted);
  opacity: 0.35;
}

.ep-assigned {
  font-size: 6px;
  color: var(--text-muted);
}
</style>
