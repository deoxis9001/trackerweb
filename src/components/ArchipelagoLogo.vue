<script setup>
defineProps({
  size:   { type: Number, default: 22 },
  active: { type: Boolean, default: true },
})
</script>

<template>
  <!--
    5-petal radial flower matching the Archipelago icon.
    Each petal is a circle clipped to a 72° wedge.
    Colors: blue · white · red · blue · yellow (two blues non-adjacent).
  -->
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    xmlns="http://www.w3.org/2000/svg"
    class="ap-logo"
    :class="{ 'ap-logo--dim': !active }"
  >
    <defs>
      <clipPath id="apl-c1"><polygon points="16,16 -3,-17 16,-28 35,-17"/></clipPath>
      <clipPath id="apl-c2"><polygon points="16,16 35,-17 52,-1 52,21"/></clipPath>
      <clipPath id="apl-c3"><polygon points="16,16 52,21 35,46 16,54"/></clipPath>
      <clipPath id="apl-c4"><polygon points="16,16 16,54 -3,46 -20,21"/></clipPath>
      <clipPath id="apl-c5"><polygon points="16,16 -20,21 -20,-1 -3,-17"/></clipPath>
    </defs>

    <!-- Petal 1 (top): blue -->
    <circle cx="16"   cy="9.5"  r="7.2" :fill="active ? '#2878e8' : '#555'" clip-path="url(#apl-c1)"/>
    <!-- Petal 2 (upper-right): white -->
    <circle cx="22.4" cy="14"   r="7.2" :fill="active ? '#ffffff' : '#666'" clip-path="url(#apl-c2)"/>
    <!-- Petal 3 (lower-right): red -->
    <circle cx="19.8" cy="21.4" r="7.2" :fill="active ? '#e02020' : '#555'" clip-path="url(#apl-c3)"/>
    <!-- Petal 4 (lower-left): blue -->
    <circle cx="12.2" cy="21.4" r="7.2" :fill="active ? '#2878e8' : '#555'" clip-path="url(#apl-c4)"/>
    <!-- Petal 5 (upper-left): yellow -->
    <circle cx="9.6"  cy="14"   r="7.2" :fill="active ? '#f7d800' : '#555'" clip-path="url(#apl-c5)"/>

    <!-- Center hub -->
    <circle cx="16" cy="16" r="3.2" :fill="active ? '#0d0907' : '#333'"/>
    <circle cx="16" cy="16" r="1.6" :fill="active ? '#ffffff' : '#666'"/>
  </svg>
</template>

<style scoped>
.ap-logo {
  display: block;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.55));
  transition: opacity 0.2s;
}
.ap-logo--dim {
  opacity: 0.35;
  filter: none;
}
</style>
