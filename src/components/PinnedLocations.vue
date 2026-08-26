<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useStateStore } from '../stores/stateStore'
import { useLocale } from '../composables/useLocale'
import { ITEM_IMAGES } from '../metadata/itemImages'
import fusionDataRaw from '../../SubModule/tmcrando_maptracker_deoxis/items/items/fusion.json'

const FUSION_MAP = {}
for (const item of fusionDataRaw) {
  FUSION_MAP[item.codes] = { img: item.img, fused_img: item.disabled_img }
}

const store = useStateStore()
const { checkedSections, pinnedLocations } = storeToRefs(store)
const { t, tLocation } = useLocale()
const BASE = import.meta.env.BASE_URL

const pinnedLocs = computed(() =>
  pinnedLocations.value
    .map(name => store.allLocations.find(l => l.name === name))
    .filter(Boolean)
)

function getChecked(loc, sec) {
  return checkedSections.value[store.sectionKey(loc.name, sec.name)] ?? 0
}

function getRemaining(loc, sec) {
  return (sec.item_count ?? 1) - getChecked(loc, sec)
}

function chestImg(loc, sec) {
  const img = getRemaining(loc, sec) <= 0 ? sec.chest_opened_img : sec.chest_unopened_img
  return img ? `${BASE}${img}` : null
}

function fusionImg(loc, sec) {
  const entry = FUSION_MAP[sec.hosted_item]
  if (!entry) return null
  return `${BASE}${getRemaining(loc, sec) <= 0 ? entry.img : entry.fused_img}`
}

function captureNoteImg(loc, sec) {
  const key = store.locationNotes[store.sectionKey(loc.name, sec.name)]
  if (!key) return null
  const img = ITEM_IMAGES[key]
  if (!img) return null
  const file = Array.isArray(img) ? img[0] : img
  return `${BASE}images/items/${file}`
}

// Left = take 1 (remaining -1), right = return 1 (remaining +1)
function onLeft(loc, sec)        { store.stepSection(loc.name, sec.name,  1, sec.item_count ?? 1) }
function onRight(loc, sec)       { store.stepSection(loc.name, sec.name, -1, sec.item_count ?? 1) }
function toggleCapture(loc, sec) { store.toggleSection(loc.name, sec.name, 1) }
</script>

<template>
  <div class="pinned-panel">
    <div class="col-title">{{ t('item_grid.pinned_locations') }}</div>

    <div class="pinned-list">
      <template v-if="pinnedLocs.length">
        <div v-for="loc in pinnedLocs" :key="loc.name" class="pinned-card">

          <div class="card-head">
            <span class="card-title" :title="tLocation(loc.key, loc.name)">{{ tLocation(loc.key, loc.name) }}</span>
            <button class="unpin-btn" @click="store.unpinLocation(loc.name)" :title="t('item_grid.unpin')">✕</button>
          </div>

          <div class="card-sections">
            <div v-for="sec in loc.sections" :key="sec.name" class="sec-col">
              <span class="sec-name" :title="tLocation(sec.key, sec.name)">{{ tLocation(sec.key, sec.name) }}</span>

              <!-- Fusion (kinstone) -->
              <div
                v-if="sec.hosted_item"
                :class="['chest-cell', { 'fusion-done': getRemaining(loc, sec) <= 0 }]"
                @click="toggleCapture(loc, sec)"
              >
                <img v-if="fusionImg(loc, sec)" :src="fusionImg(loc, sec)" class="chest-img" />
              </div>

              <!-- Capture item : picker box + image fixe -->
              <div v-else-if="sec.capture_item" class="capture-item-wrap">
                <div
                  :class="['capture-picker-box', { done: captureNoteImg(loc, sec) }]"
                  @click="toggleCapture(loc, sec)"
                >
                  <img v-if="captureNoteImg(loc, sec)" :src="captureNoteImg(loc, sec)" class="capture-picked-img" />
                </div>
                <div v-if="sec.chest_unopened_img" class="chest-cell chest-cell-icon">
                  <img :src="`${BASE}${sec.chest_unopened_img}`" class="chest-img" />
                </div>
              </div>

              <!-- Coffre standard -->
              <div
                v-else
                class="chest-cell"
                :title="t('item_grid.remaining', { n: getRemaining(loc, sec), total: sec.item_count ?? 1 })"
                @click="onLeft(loc, sec)"
                @contextmenu.prevent="onRight(loc, sec)"
              >
                <img v-if="chestImg(loc, sec)" :src="chestImg(loc, sec)" class="chest-img" />
                <span
                  v-if="(sec.item_count ?? 1) > 1 && getRemaining(loc, sec) > 0"
                  class="chest-count"
                >{{ getRemaining(loc, sec) }}</span>
              </div>
            </div>
          </div>

        </div>
      </template>

      <div v-else class="empty-hint">
        {{ t('item_grid.pinned_empty') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.pinned-panel {
  flex: 1;
  border-left: 1px solid var(--border);
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.col-title {
  padding: 3px 8px;
  background: var(--bg-panel);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  flex-shrink: 0;
}

.pinned-list {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px;
  overflow-y: auto;
  align-content: flex-start;
}

.empty-hint {
  font-size: 10px;
  color: var(--text-muted);
  opacity: 0.5;
  padding: 6px 2px;
  width: 100%;
}

.pinned-card {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
  min-width: 140px;
  flex: 1 1 140px;
  max-width: 280px;
}

.card-head {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px;
  border-bottom: 1px solid var(--border);
}

.card-title {
  flex: 1;
  font-size: 10px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unpin-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 9px;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
}
.unpin-btn:hover { color: #d82828; }

.card-sections {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 8px;
}

.sec-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.sec-name {
  font-size: 9px;
  color: var(--text-muted);
  white-space: nowrap;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.chest-cell {
  position: relative;
  width: 32px;
  height: 32px;
  cursor: pointer;
  flex-shrink: 0;
}
.chest-cell:hover { opacity: 0.8; }
.chest-cell.fusion-done { opacity: 0.35; }

.capture-item-wrap {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 3px;
}

.chest-cell-icon {
  cursor: default;
  pointer-events: none;
}

.capture-cell {
  border: 1px dashed rgba(212,168,75,0.4);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.capture-cell.capture-done {
  border-color: #7ac038;
  border-style: solid;
}

.capture-empty-mark {
  font-size: 14px;
  color: rgba(212,168,75,0.4);
  line-height: 1;
  pointer-events: none;
}

.chest-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.chest-count {
  position: absolute;
  bottom: 1px;
  right: 2px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 0 3px #000, 0 0 3px #000;
  line-height: 1;
  pointer-events: none;
}
.chest-count.full { color: #7ac038; }

.capture-picker-box {
  width: 28px;
  height: 28px;
  border: 1px dashed rgba(212,168,75,0.45);
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}
.capture-picker-box:hover {
  border-color: var(--accent, #d4882a);
  background: rgba(212,136,42,0.1);
}
.capture-picker-box.done {
  border-color: #7ac038;
  border-style: solid;
  background: rgba(122,192,56,0.08);
}
.capture-picked-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
</style>
