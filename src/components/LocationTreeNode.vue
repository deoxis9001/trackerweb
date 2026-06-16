<script setup>
import { computed, ref } from 'vue'

defineOptions({ name: 'LocationTreeNode' })

const props = defineProps({
  node:           { type: Object,   required: true },
  isRoot:         { type: Boolean,  default: false },
  depth:          { type: Number,   default: 0 },
  collapsedKeys:  { type: Object,   required: true },
  toggleCollapse: { type: Function, required: true },
  locColor:       { type: Function, required: true },
  isChecked:      { type: Function, required: true },
  toggleLocation: { type: Function, required: true },
  onRightClick:   { type: Function, required: true },
  tLocation:      { type: Function, required: true },
})

const isCollapsed = computed(() => props.collapsedKeys.has(props.node.nodeKey))

function countLeaves(n) {
  return n.leaves.length + n.children.reduce((s, c) => s + countLeaves(c), 0)
}
function countChecked(n) {
  return n.leaves.filter(l => props.isChecked(l.loc.id)).length +
    n.children.reduce((s, c) => s + countChecked(c), 0)
}

const total   = computed(() => countLeaves(props.node))
const checked = computed(() => countChecked(props.node))
</script>

<template>
  <div :class="['tree-node', isRoot && 'tree-root']">
    <!-- Collapsible sub-area header — skip for root nodes -->
    <div v-if="!isRoot"
      class="subarea-header"
      :style="{ paddingLeft: (14 + depth * 10) + 'px' }"
      @click="toggleCollapse(node.nodeKey)"
    >
      <span class="subarea-toggle">{{ isCollapsed ? '▶' : '▼' }}</span>
      <span class="subarea-name">{{ node.label }}</span>
      <span class="subarea-count">{{ checked }}/{{ total }}</span>
    </div>

    <template v-if="isRoot || !isCollapsed">
      <!-- Leaf location rows -->
      <div
        v-for="leaf in node.leaves"
        :key="leaf.loc.id"
        :class="['location-row', isChecked(leaf.loc.id) && 'checked']"
        :style="{ paddingLeft: (isRoot ? 24 : 28 + depth * 10) + 'px' }"
        @click="!isChecked(leaf.loc.id) && toggleLocation(leaf.loc.id)"
        @contextmenu.prevent="onRightClick($event, leaf.loc)"
      >
        <span class="check-dot" :style="{ color: locColor(leaf.loc) }">●</span>
        <span class="loc-name">{{ tLocation(leaf.loc.key, leaf.shortName) }}</span>
        <span v-if="leaf.loc.pools.length" class="loc-pools">{{ leaf.loc.pools.slice(0, 2).join(', ') }}</span>
      </div>

      <!-- Recursive children -->
      <LocationTreeNode
        v-for="child in node.children"
        :key="child.nodeKey"
        :node="child"
        :is-root="false"
        :depth="isRoot ? 0 : depth + 1"
        :collapsed-keys="collapsedKeys"
        :toggle-collapse="toggleCollapse"
        :loc-color="locColor"
        :is-checked="isChecked"
        :toggle-location="toggleLocation"
        :on-right-click="onRightClick"
        :t-location="tLocation"
      />
    </template>
  </div>
</template>

<style scoped>
.subarea-header {
  display: flex;
  align-items: center;
  gap: 5px;
  padding-top: 3px;
  padding-bottom: 3px;
  padding-right: 10px;
  background: rgba(0, 0, 0, 0.18);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  user-select: none;
}
.subarea-header:hover { background: rgba(255, 255, 255, 0.03); }
.subarea-toggle { font-size: 9px; width: 10px; flex-shrink: 0; }
.subarea-name   { flex: 1; }
.subarea-count  { font-size: 10px; }

.location-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 3px;
  padding-bottom: 3px;
  padding-right: 12px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text);
  transition: background 0.1s;
}
.location-row:hover { background: rgba(255, 255, 255, 0.04); }
.location-row.checked { color: var(--text-muted); }
.location-row.checked .loc-name { text-decoration: line-through; }

.check-dot { font-size: 9px; flex-shrink: 0; }
.loc-name  { flex: 1; }
.loc-pools { font-size: 10px; color: var(--text-muted); white-space: nowrap; }
</style>
