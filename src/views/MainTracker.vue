<script setup>
import { useStateStore } from '../stores/stateStore'
import APConnect from '../components/APConnect.vue'
import ItemGrid from '../components/ItemGrid.vue'
import CheckList from '../components/CheckList.vue'
import MapView from '../components/MapView.vue'

const store = useStateStore()
</script>

<template>
  <div class="tracker-layout">
    <!-- AP connect bar -->
    <div class="top-bar">
      <APConnect class="ap-connect-wrapper" />
    </div>

    <!-- Main content -->
    <div class="main-content">
      <!-- Left: Item grid + Region guide -->
      <div class="left-panel">
        <ItemGrid class="item-grid" />
      </div>

      <!-- Right: Map or Checklist -->
      <div class="right-panel">
        <div v-if="store.activePanel === 'checklist'" class="panel-full">
          <CheckList />
        </div>
        <MapView v-else class="panel-full" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tracker-layout {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.ap-connect-wrapper { margin-left: auto; }

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-panel {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.item-grid {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.right-panel {
  flex: 1;
  display: flex;
  overflow: hidden;
  background: var(--bg-dark);
}

.panel-full {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
