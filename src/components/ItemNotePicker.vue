<script setup>
import { computed } from 'vue'
import { PICKER_ITEMS, ITEM_IMAGES } from '../metadata/itemImages'
import { useStateStore } from '../stores/stateStore'

const props = defineProps({
  locs: { type: Array, required: true },
  popupStyle: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['select', 'clear', 'close'])

const store = useStateStore()

const title = computed(() =>
  props.locs.length === 1 ? props.locs[0].name : `${props.locs.length} locations`
)

const currentNote = computed(() => {
  for (const loc of props.locs) {
    if (store.locationNotes[loc.id]) return store.locationNotes[loc.id]
  }
  return null
})

function itemImgSrc(key) {
  const img = ITEM_IMAGES[key]
  if (!img) return null
  const file = Array.isArray(img) ? img[0] : img
  return `${import.meta.env.BASE_URL}images/items/${file}`
}
</script>

<template>
  <div class="note-picker" :style="popupStyle" @click.stop @contextmenu.prevent>
    <div class="picker-header">
      <span class="picker-title">{{ title }}</span>
      <button class="picker-clear" @click="$emit('clear')">Effacer</button>
      <button class="picker-close" @click="$emit('close')">✕</button>
    </div>
    <div class="picker-grid">
      <button
        v-for="key in PICKER_ITEMS"
        :key="key"
        :class="['picker-item', { active: currentNote === key }]"
        :title="key"
        @click="$emit('select', key)"
      >
        <img v-if="itemImgSrc(key)" :src="itemImgSrc(key)" :alt="key" />
        <span v-else class="picker-fallback">{{ key.slice(0, 4) }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.note-picker {
  position: fixed;
  z-index: 9999;
  background: #1e1006;
  border: 1px solid var(--accent, #d4882a);
  border-radius: 5px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.75);
  min-width: 210px;
  max-width: 260px;
}

.picker-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-bottom: 1px solid var(--border, #5a3a10);
}

.picker-title {
  flex: 1;
  font-size: 11px;
  color: var(--text, #d4a84b);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-clear {
  font-size: 10px;
  padding: 2px 7px;
  background: rgba(255,255,255,0.07);
  border: 1px solid var(--border, #5a3a10);
  color: var(--text-muted, #9a7a3b);
  border-radius: 3px;
  cursor: pointer;
  flex-shrink: 0;
}
.picker-clear:hover { background: rgba(255,255,255,0.13); }

.picker-close {
  font-size: 12px;
  background: none;
  border: none;
  color: var(--text-muted, #9a7a3b);
  cursor: pointer;
  padding: 2px 4px;
  line-height: 1;
  flex-shrink: 0;
}
.picker-close:hover { color: var(--text, #d4a84b); }

.picker-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 3px;
  padding: 6px;
}

.picker-item {
  width: 30px;
  height: 30px;
  background: rgba(255,255,255,0.05);
  border: 1px solid transparent;
  border-radius: 3px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  transition: background 0.1s, border-color 0.1s;
}
.picker-item:hover {
  background: rgba(212,136,42,0.2);
  border-color: var(--accent, #d4882a);
}
.picker-item.active {
  background: rgba(212,136,42,0.35);
  border-color: var(--accent-bright, #d4a84b);
}

.picker-item img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: pixelated;
}

.picker-fallback {
  font-size: 8px;
  color: var(--text-muted, #9a7a3b);
}
</style>
