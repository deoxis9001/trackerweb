<script setup>
import { onMounted, onUnmounted } from 'vue'
import ItemGrid from '../components/ItemGrid.vue'

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
    <ItemGrid />
  </div>
</template>

<style scoped>
.broadcast-root {
  background: #000;
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>

<style>
.broadcast-root .item-grid-panel {
  background: #000;
  border-right: none;
}
</style>
