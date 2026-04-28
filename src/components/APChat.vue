<script setup>
import { ref, watch, nextTick } from 'vue'
import { useStateStore } from '../stores/stateStore'
import { getClient } from '../archipelago/client'
import { useLocale } from '../composables/useLocale'

const store   = useStateStore()
const { t }   = useLocale()
const input   = ref('')
const scrollEl = ref(null)

// AP item classification bit flags → color
const ITEM_COLOR = (flags) => {
  if (flags & 4) return '#fa8072'  // trap → salmon
  if (flags & 1) return '#6383fe'  // progression → blue
  if (flags & 2) return '#6eff6e'  // useful → green
  return '#ffffff'                  // filler → white
}

// Terminal color names → hex
const COLOR_HEX = {
  red:     '#ee4444',
  green:   '#44ee44',
  yellow:  '#eeee44',
  blue:    '#6383fe',
  magenta: '#ee44ee',
  cyan:    '#44eeee',
  white:   '#cccccc',
  black:   '#888888',
}

function nodeColor(node) {
  if (node.type === 'item')     return ITEM_COLOR(node.item.classification)
  if (node.type === 'player')   return '#eeee44'
  if (node.type === 'location') return '#44eeee'
  if (node.type === 'color')    return COLOR_HEX[node.color] ?? null
  return null
}

function segments(nodes) {
  return nodes.map(n => ({ text: n.text, color: nodeColor(n) }))
}

async function send() {
  const text = input.value.trim()
  if (!text) return
  const client = getClient()
  if (!client) return
  await client.messages.say(text)
  input.value = ''
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
}

watch(() => store.chatMessages.length, async () => {
  await nextTick()
  if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
}, { flush: 'post' })
</script>

<template>
  <div class="ap-chat">
    <div class="chat-log" ref="scrollEl">
      <div v-for="(msg, i) in store.chatMessages" :key="i" class="chat-line">
        <span
          v-for="(seg, j) in segments(msg.nodes)"
          :key="j"
          :style="seg.color ? { color: seg.color } : {}"
        >{{ seg.text }}</span>
      </div>
    </div>
    <div class="chat-input-row">
      <input
        v-model="input"
        class="chat-input"
        :placeholder="t('ap_connect.chat_placeholder')"
        @keydown="onKeydown"
      />
      <button class="chat-send" @click="send">↵</button>
    </div>
  </div>
</template>

<style scoped>
.ap-chat {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background: var(--bg-dark);
}

.chat-log {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
  font-size: 11px;
  line-height: 1.55;
  color: var(--text);
}

.chat-line { word-break: break-word; }

.chat-input-row {
  display: flex;
  gap: 4px;
  padding: 4px 8px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
}
.chat-input:focus { outline: none; border-color: var(--accent-soft); }

.chat-send {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.chat-send:hover { background: var(--accent-soft); }
</style>
