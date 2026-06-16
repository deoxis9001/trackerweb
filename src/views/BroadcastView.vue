<script setup>
import { onMounted, onUnmounted } from 'vue'
import ItemGrid from '../components/ItemGrid.vue'
import broadcastLayout from '../../SubModule/tmcrando_maptracker_deoxis/layouts/standard_broadcast.json'

const broadcastRows = broadcastLayout.tracker_broadcast.content[0].content[0].rows
  .map(row => row.map(code => code === 'beta' ? '' : code))

onMounted(() => {
  document.body.style.background = '#000'
  document.body.style.overflow   = 'hidden'
})
onUnmounted(() => {
  document.body.style.background = ''
  document.body.style.overflow   = ''
})
</script>

<template>
  <div class="broadcast-root">
    <ItemGrid :rows="broadcastRows" />
  </div>
</template>

<style scoped>
.broadcast-root {
  background: #000;
  width: 254px;
  height: 370px;
  overflow: hidden;
}
</style>

<style>
.broadcast-root .item-grid-panel {
  background: #000;
  border-right: none;
}
</style>
