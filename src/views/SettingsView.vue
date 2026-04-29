<script setup>
import { ref, computed } from 'vue'
import { useSettingsStore, TRICKS } from '../stores/settingsStore'
import { watchEffect } from 'vue'
import { useLocale } from '../composables/useLocale'

const isDev = import.meta.env.DEV

const s = useSettingsStore()
const { t, locale } = useLocale()

let saveTimer
watchEffect(() => {
  s.exportSettings()
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => s.save(), 400)
})

const TABS = [
  { id: 'goal' },
  { id: 'dungeons' },
  { id: 'locations' },
  { id: 'items' },
  { id: 'fusions' },
  { id: 'qol' },
  { id: 'tracker' },
]

const activeTab = ref('goal')

const WARP_OPTIONS = computed(() => [
  { value: 0, label: t('settings.dungeons.warp_none') },
  { value: 1, label: t('settings.dungeons.warp_blue') },
  { value: 2, label: t('settings.dungeons.warp_red') },
  { value: 3, label: t('settings.dungeons.warp_both') },
])

const FUSION_OPTIONS = computed(() => [
  { value: 'closed',   label: t('settings.fusions.closed') },
  { value: 'vanilla',  label: t('settings.fusions.vanilla') },
  { value: 'combined', label: t('settings.fusions.combined') },
  { value: 'open',     label: t('settings.fusions.open') },
])

// ── Logic Source file import ──────────────────────────────────────────────────
const customLogicFileName = ref(null)
const logicFileInput = ref(null)

function openLogicFilePicker() {
  logicFileInput.value?.click()
}

function onLogicFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    s.customLogicText = e.target.result
    customLogicFileName.value = file.name
    s.logicSource = 'custom'
  }
  reader.readAsText(file)
  // reset so the same file can be re-imported
  event.target.value = ''
}
</script>

<template>
  <div class="settings-page">
    <!-- Tab bar -->
    <div class="tab-bar">
      <button
        v-for="tab in TABS"
        :key="tab.id"
        :class="['stab', activeTab === tab.id && 'active']"
        @click="activeTab = tab.id"
      >{{ t('settings.tabs.' + tab.id) }}</button>
    </div>

    <!-- Legend -->
    <div class="legend-bar">
      <span class="dot green"></span> {{ t('settings.legend.accessible') }}
      <span class="dot yellow"></span> {{ t('settings.legend.out_of_logic') }}
      <span class="dot red"></span> {{ t('settings.legend.inaccessible') }}
    </div>

    <!-- ── GOAL ──────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'goal'" class="tab-content">
      <section class="card">
        <h3>{{ t('settings.goal.title') }}</h3>
        <div class="setting-row">
          <label>{{ t('settings.goal.goal_label') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.goal === 'vaati' }]"    @click="s.goal = 'vaati'">{{ t('settings.goal.defeat_vaati') }}</button>
            <button :class="['opt-btn', { active: s.goal === 'pedestal' }]" @click="s.goal = 'pedestal'">{{ t('settings.goal.pedestal') }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('settings.goal.dhc_access') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.dhcAccess === 'closed' }]"   @click="s.dhcAccess = 'closed'">{{ t('settings.goal.closed') }}</button>
            <button :class="['opt-btn', { active: s.dhcAccess === 'pedestal' }]" @click="s.dhcAccess = 'pedestal'">{{ t('settings.goal.pedestal') }}</button>
            <button :class="['opt-btn', { active: s.dhcAccess === 'open' }]"     @click="s.dhcAccess = 'open'">{{ t('settings.goal.open') }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('settings.goal.pedestal_reward') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.pedReward === 'none' }]"         @click="s.pedReward = 'none'">{{ t('settings.goal.none') }}</button>
            <button :class="['opt-btn', { active: s.pedReward === 'dhc_big_key' }]"  @click="s.pedReward = 'dhc_big_key'">{{ t('settings.goal.dhc_big_key') }}</button>
            <button :class="['opt-btn', { active: s.pedReward === 'random_item' }]"  @click="s.pedReward = 'random_item'">{{ t('settings.goal.random_item') }}</button>
          </div>
        </div>
        <h3 class="sub-title">{{ t('settings.goal.pedestal_conditions') }}</h3>
        <div class="two-col-fields">
          <div class="field">
            <label>{{ t('settings.goal.required_elements') }}</label>
            <input type="number" v-model.number="s.pedElements" min="0" max="4" class="num-input" />
          </div>
          <div class="field">
            <label>{{ t('settings.goal.required_sword_tier') }}</label>
            <input type="number" v-model.number="s.pedSwords" min="0" max="5" class="num-input" />
          </div>
          <div class="field">
            <label>{{ t('settings.goal.required_dungeons') }}</label>
            <input type="number" v-model.number="s.pedDungeons" min="0" max="6" class="num-input" />
          </div>
          <div class="field">
            <label>{{ t('settings.goal.required_figurines') }}</label>
            <input type="number" v-model.number="s.pedFigurines" min="0" max="136" class="num-input" />
          </div>
          <div class="field">
            <label>{{ t('settings.goal.starting_hearts') }}</label>
            <input type="number" v-model.number="s.startingHearts" min="1" max="20" class="num-input" />
          </div>
        </div>
      </section>
    </div>

    <!-- ── DUNGEONS ──────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'dungeons'" class="tab-content two-col-layout">
      <section class="card">
        <h3>{{ t('settings.dungeons.dungeon_shuffle') }}</h3>
        <div class="setting-row">
          <label>{{ t('settings.dungeons.shuffle_elements') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.shuffleElements === 'vanilla' }]"       @click="s.shuffleElements = 'vanilla'">{{ t('settings.dungeons.vanilla') }}</button>
            <button :class="['opt-btn', { active: s.shuffleElements === 'dungeon_prize' }]" @click="s.shuffleElements = 'dungeon_prize'">{{ t('settings.dungeons.prize') }}</button>
            <button :class="['opt-btn', { active: s.shuffleElements === 'anywhere' }]"      @click="s.shuffleElements = 'anywhere'">{{ t('settings.dungeons.anywhere') }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('settings.dungeons.small_keys') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.dungeonSmallKeys === 'own_dungeon' }]" @click="s.dungeonSmallKeys = 'own_dungeon'">{{ t('settings.dungeons.own') }}</button>
            <button :class="['opt-btn', { active: s.dungeonSmallKeys === 'anywhere' }]"    @click="s.dungeonSmallKeys = 'anywhere'">{{ t('settings.dungeons.anywhere') }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('settings.dungeons.big_keys') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.dungeonBigKeys === 'own_dungeon' }]" @click="s.dungeonBigKeys = 'own_dungeon'">{{ t('settings.dungeons.own') }}</button>
            <button :class="['opt-btn', { active: s.dungeonBigKeys === 'anywhere' }]"    @click="s.dungeonBigKeys = 'anywhere'">{{ t('settings.dungeons.anywhere') }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('settings.dungeons.dungeon_maps') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.dungeonMaps === 'own_dungeon' }]" @click="s.dungeonMaps = 'own_dungeon'">{{ t('settings.dungeons.own') }}</button>
            <button :class="['opt-btn', { active: s.dungeonMaps === 'anywhere' }]"    @click="s.dungeonMaps = 'anywhere'">{{ t('settings.dungeons.anywhere') }}</button>
            <button :class="['opt-btn', { active: s.dungeonMaps === 'start_with' }]"  @click="s.dungeonMaps = 'start_with'">{{ t('settings.dungeons.start') }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('settings.dungeons.compasses') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.dungeonCompasses === 'own_dungeon' }]" @click="s.dungeonCompasses = 'own_dungeon'">{{ t('settings.dungeons.own') }}</button>
            <button :class="['opt-btn', { active: s.dungeonCompasses === 'anywhere' }]"    @click="s.dungeonCompasses = 'anywhere'">{{ t('settings.dungeons.anywhere') }}</button>
            <button :class="['opt-btn', { active: s.dungeonCompasses === 'start_with' }]"  @click="s.dungeonCompasses = 'start_with'">{{ t('settings.dungeons.start') }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('settings.dungeons.non_element_dungeons') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.nonElementDungeons === 'standard' }]" @click="s.nonElementDungeons = 'standard'">{{ t('settings.dungeons.standard') }}</button>
            <button :class="['opt-btn', { active: s.nonElementDungeons === 'excluded' }]" @click="s.nonElementDungeons = 'excluded'">{{ t('settings.dungeons.excluded') }}</button>
          </div>
        </div>
      </section>

      <section class="card">
        <h3>{{ t('settings.dungeons.entrance_shuffle') }}</h3>
        <div class="setting-row">
          <label>{{ t('settings.dungeons.dungeon_entrance_shuffle') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: !s.dungeonEntranceShuffle }]" @click="s.dungeonEntranceShuffle = false">{{ t('settings.dungeons.no') }}</button>
            <button
              :class="['opt-btn', { active: s.dungeonEntranceShuffle }]"
              :disabled="!isDev"
              :title="!isDev ? t('settings.dungeons.dev_only') : ''"
              @click="isDev && (s.dungeonEntranceShuffle = true)"
            >{{ t('settings.dungeons.yes') }}</button>
          </div>
        </div>
        <p class="hint-block">{{ t('settings.dungeons.entrance_hint') }}</p>
      </section>

      <section class="card">
        <h3>{{ t('settings.dungeons.dungeon_warps') }}</h3>
        <template v-for="[key, label] in [
          ['warpDWS','DWS'],['warpCoF','CoF'],['warpFoW','FoW'],
          ['warpToD','ToD'],['warpPoW','PoW'],['warpDHC','DHC'],
        ]" :key="key">
          <div class="setting-row">
            <label>{{ label }}</label>
            <div class="btn-group">
              <button v-for="o in WARP_OPTIONS" :key="o.value"
                :class="['opt-btn', { active: s[key] === o.value }]"
                @click="s[key] = o.value"
              >{{ o.label }}</button>
            </div>
          </div>
        </template>
      </section>
    </div>

    <!-- ── LOCATIONS ───────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'locations'" class="tab-content two-col-layout">
      <section class="card">
        <h3>{{ t('settings.locations.location_shuffle') }}</h3>
        <div class="setting-row"><label>{{ t('settings.locations.rupeesanity') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.rupeesanity}]" @click="s.rupeesanity=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.rupeesanity}]" @click="s.rupeesanity=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.locations.shuffle_pots') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.shufflePots}]" @click="s.shufflePots=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.shufflePots}]" @click="s.shufflePots=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.locations.shuffle_digging') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.shuffleDigging}]" @click="s.shuffleDigging=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.shuffleDigging}]" @click="s.shuffleDigging=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.locations.shuffle_underwater') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.shuffleUnderwater}]" @click="s.shuffleUnderwater=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.shuffleUnderwater}]" @click="s.shuffleUnderwater=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.locations.gold_enemies') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.shuffleGoldEnemies}]" @click="s.shuffleGoldEnemies=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.shuffleGoldEnemies}]" @click="s.shuffleGoldEnemies=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.locations.extra_shop_item') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.extraShopItem}]" @click="s.extraShopItem=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.extraShopItem}]" @click="s.extraShopItem=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.locations.early_weapon') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.earlyWeapon}]" @click="s.earlyWeapon=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.earlyWeapon}]" @click="s.earlyWeapon=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row mt-8">
          <label>{{ t('settings.locations.biggoron') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.biggoron === 'disabled' }]"      @click="s.biggoron = 'disabled'">{{ t('settings.locations.disabled') }}</button>
            <button :class="['opt-btn', { active: s.biggoron === 'shield' }]"        @click="s.biggoron = 'shield'">{{ t('settings.locations.shield') }}</button>
            <button :class="['opt-btn', { active: s.biggoron === 'mirror_shield' }]" @click="s.biggoron = 'mirror_shield'">{{ t('settings.locations.mirror_shield') }}</button>
          </div>
        </div>
        <div class="two-col-fields mt-8">
          <div class="field">
            <label>{{ t('settings.locations.cucco_rounds') }}</label>
            <input type="number" v-model.number="s.cuccoRounds" min="0" max="10" class="num-input" />
          </div>
          <div class="field">
            <label>{{ t('settings.locations.goron_sets') }}</label>
            <input type="number" v-model.number="s.goronSets" min="0" max="5" class="num-input" />
          </div>
        </div>
        <div class="setting-row mt-8"><label>{{ t('settings.locations.goron_jp_prices') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.goronJPPrices}]" @click="s.goronJPPrices=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.goronJPPrices}]" @click="s.goronJPPrices=true">{{ t('settings.dungeons.yes') }}</button></div></div>
      </section>

      <section class="card">
        <h3>{{ t('settings.locations.wind_crests') }} <span class="hint-inline">{{ t('settings.locations.wind_crests_hint') }}</span></h3>
        <div class="setting-row"><label>{{ t('settings.locations.mt_crenel') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestCrenel}]" @click="s.windCrestCrenel=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.windCrestCrenel}]" @click="s.windCrestCrenel=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.locations.veil_falls') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestFalls}]" @click="s.windCrestFalls=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.windCrestFalls}]" @click="s.windCrestFalls=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.locations.cloud_tops') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestClouds}]" @click="s.windCrestClouds=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.windCrestClouds}]" @click="s.windCrestClouds=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.locations.castor_wilds') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestCastor}]" @click="s.windCrestCastor=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.windCrestCastor}]" @click="s.windCrestCastor=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.locations.south_field') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestSouthField}]" @click="s.windCrestSouthField=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.windCrestSouthField}]" @click="s.windCrestSouthField=true">{{ t('settings.dungeons.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.locations.minish_woods') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestMinishWoods}]" @click="s.windCrestMinishWoods=false">{{ t('settings.dungeons.no') }}</button><button :class="['opt-btn',{active:s.windCrestMinishWoods}]" @click="s.windCrestMinishWoods=true">{{ t('settings.dungeons.yes') }}</button></div></div>
      </section>
    </div>

    <!-- ── ITEMS ───────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'items'" class="tab-content two-col-layout">
      <section class="card">
        <h3>{{ t('settings.items.progressive_items') }}</h3>
        <div class="setting-row"><label>{{ t('settings.items.progressive_sword') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.progressiveSword}]" @click="s.progressiveSword=false">{{ t('settings.items.no') }}</button><button :class="['opt-btn',{active:s.progressiveSword}]" @click="s.progressiveSword=true">{{ t('settings.items.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.items.progressive_shield') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.progressiveShield}]" @click="s.progressiveShield=false">{{ t('settings.items.no') }}</button><button :class="['opt-btn',{active:s.progressiveShield}]" @click="s.progressiveShield=true">{{ t('settings.items.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.items.progressive_bow') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.progressiveBow}]" @click="s.progressiveBow=false">{{ t('settings.items.no') }}</button><button :class="['opt-btn',{active:s.progressiveBow}]" @click="s.progressiveBow=true">{{ t('settings.items.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.items.progressive_boomerang') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.progressiveBoomerang}]" @click="s.progressiveBoomerang=false">{{ t('settings.items.no') }}</button><button :class="['opt-btn',{active:s.progressiveBoomerang}]" @click="s.progressiveBoomerang=true">{{ t('settings.items.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.items.progressive_scroll') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.progressiveScroll}]" @click="s.progressiveScroll=false">{{ t('settings.items.no') }}</button><button :class="['opt-btn',{active:s.progressiveScroll}]" @click="s.progressiveScroll=true">{{ t('settings.items.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.items.random_bottle_contents') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.randomBottleContents}]" @click="s.randomBottleContents=false">{{ t('settings.items.no') }}</button><button :class="['opt-btn',{active:s.randomBottleContents}]" @click="s.randomBottleContents=true">{{ t('settings.items.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.items.traps_enabled') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.trapsEnabled}]" @click="s.trapsEnabled=false">{{ t('settings.items.no') }}</button><button :class="['opt-btn',{active:s.trapsEnabled}]" @click="s.trapsEnabled=true">{{ t('settings.items.yes') }}</button></div></div>
      </section>

      <section class="card">
        <h3>{{ t('settings.items.difficulty') }}</h3>
        <div class="two-col-fields">
          <div class="field">
            <label>{{ t('settings.items.heart_containers') }}</label>
            <input type="number" v-model.number="s.heartContainers" min="0" max="20" class="num-input" />
          </div>
          <div class="field">
            <label>{{ t('settings.items.pieces_of_heart') }}</label>
            <input type="number" v-model.number="s.pieceOfHearts" min="0" max="20" class="num-input" />
          </div>
        </div>
        <div class="setting-row mt-8">
          <label>{{ t('settings.items.bomb_bag_required') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.weaponBomb === 0 }]" @click="s.weaponBomb = 0">{{ t('settings.items.bag_required') }}</button>
            <button :class="['opt-btn', { active: s.weaponBomb === 1 }]" @click="s.weaponBomb = 1">{{ t('settings.items.free_bombs') }}</button>
            <button :class="['opt-btn', { active: s.weaponBomb === 2 }]" @click="s.weaponBomb = 2">{{ t('settings.items.free_plus_bosses') }}</button>
          </div>
        </div>
        <div class="setting-row mt-8"><label>{{ t('settings.items.bow_weapon') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.weaponBow}]" @click="s.weaponBow=false">{{ t('settings.items.no') }}</button><button :class="['opt-btn',{active:s.weaponBow}]" @click="s.weaponBow=true">{{ t('settings.items.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.items.gust_jar_weapon') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.weaponGust}]" @click="s.weaponGust=false">{{ t('settings.items.no') }}</button><button :class="['opt-btn',{active:s.weaponGust}]" @click="s.weaponGust=true">{{ t('settings.items.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.items.lantern_weapon') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.weaponLantern}]" @click="s.weaponLantern=false">{{ t('settings.items.no') }}</button><button :class="['opt-btn',{active:s.weaponLantern}]" @click="s.weaponLantern=true">{{ t('settings.items.yes') }}</button></div></div>
      </section>
    </div>

    <!-- ── FUSIONS ─────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'fusions'" class="tab-content">
      <section class="card">
        <h3>{{ t('settings.fusions.fusion_access') }}</h3>
        <template v-for="[key, labelKey, model] in [
          ['gold','gold_kinstone','goldFusionAccess'],
          ['red','red_kinstone','redFusionAccess'],
          ['blue','blue_kinstone','blueFusionAccess'],
          ['green','green_kinstone','greenFusionAccess'],
        ]" :key="key">
          <div class="setting-row">
            <label>{{ t('settings.fusions.' + labelKey) }}</label>
            <div class="btn-group">
              <button v-for="o in FUSION_OPTIONS" :key="o.value"
                :class="['opt-btn', { active: s[model] === o.value }]"
                @click="s[model] = o.value"
              >{{ o.label }}</button>
            </div>
          </div>
        </template>
        <div class="two-col-fields mt-8">
          <div class="field">
            <label>{{ t('settings.fusions.cloud_multiplier') }}<span class="hint-inline">(1–9)</span></label>
            <input type="number" v-model.number="s.cloudKinstoneMultiplier" min="1" max="9" class="num-input" />
          </div>
          <div class="field">
            <label>{{ t('settings.fusions.swamp_multiplier') }}<span class="hint-inline">(1–3)</span></label>
            <input type="number" v-model.number="s.swampKinstoneMultiplier" min="1" max="3" class="num-input" />
          </div>
        </div>
      </section>
    </div>

    <!-- ── QOL & TRICKS ────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'qol'" class="tab-content two-col-layout">
      <section class="card">
        <h3>{{ t('settings.qol.quality_of_life') }}</h3>
        <div class="setting-row"><label>{{ t('settings.qol.ocarina_on_select') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.ocarinaOnSelect}]" @click="s.ocarinaOnSelect=false">{{ t('settings.qol.no') }}</button><button :class="['opt-btn',{active:s.ocarinaOnSelect}]" @click="s.ocarinaOnSelect=true">{{ t('settings.qol.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.qol.boots_on_l') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.bootsOnL}]" @click="s.bootsOnL=false">{{ t('settings.qol.no') }}</button><button :class="['opt-btn',{active:s.bootsOnL}]" @click="s.bootsOnL=true">{{ t('settings.qol.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.qol.boots_as_minish') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.bootsAsMinish}]" @click="s.bootsAsMinish=false">{{ t('settings.qol.no') }}</button><button :class="['opt-btn',{active:s.bootsAsMinish}]" @click="s.bootsAsMinish=true">{{ t('settings.qol.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.qol.skip_big_octorok') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.bigOctoManipulation}]" @click="s.bigOctoManipulation=false">{{ t('settings.qol.no') }}</button><button :class="['opt-btn',{active:s.bigOctoManipulation}]" @click="s.bigOctoManipulation=true">{{ t('settings.qol.yes') }}</button></div></div>
        <div class="setting-row"><label>{{ t('settings.qol.tod_boss_door') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.replicaTODBossDoor}]" @click="s.replicaTODBossDoor=false">{{ t('settings.qol.no') }}</button><button :class="['opt-btn',{active:s.replicaTODBossDoor}]" @click="s.replicaTODBossDoor=true">{{ t('settings.qol.yes') }}</button></div></div>
      </section>

      <section class="card tricks-card">
        <div class="tricks-header">
          <h3>{{ t('settings.qol.tricks') }} <span class="hint-inline">{{ t('settings.qol.tricks_hint') }}</span></h3>
          <div class="tricks-btns">
            <button class="btn-sm" @click="s.setAllTricks(true)">{{ t('settings.qol.all') }}</button>
            <button class="btn-sm" @click="s.setAllTricks(false)">{{ t('settings.qol.none') }}</button>
          </div>
        </div>
        <div v-for="trick in Object.values(TRICKS)" :key="trick.key" class="setting-row">
          <label>{{ trick.label }}</label>
          <div class="btn-group">
            <button :class="['opt-btn',{active:!s.hasTrick(trick.key)}]" @click="s.hasTrick(trick.key) && s.toggleTrick(trick.key)">{{ t('settings.qol.no') }}</button>
            <button :class="['opt-btn',{active:s.hasTrick(trick.key)}]"  @click="!s.hasTrick(trick.key) && s.toggleTrick(trick.key)">{{ t('settings.qol.yes') }}</button>
          </div>
        </div>
      </section>
    </div>

    <!-- ── TRACKER ─────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'tracker'" class="tab-content">

      <!-- Logic Source -->
      <section class="card">
        <h3>{{ t('settings.tracker.logic_source') }}</h3>
        <div class="setting-row">
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.logicSource === 'ap_world' }]"      @click="s.logicSource = 'ap_world'">{{ t('settings.tracker.ap_world') }}</button>
            <button :class="['opt-btn', { active: s.logicSource === 'default_logic' }]" @click="s.logicSource = 'default_logic'">{{ t('settings.tracker.default_logic') }}</button>
            <button :class="['opt-btn', { active: s.logicSource === 'custom' }]"        @click="s.logicSource = 'custom'">{{ t('settings.tracker.custom_logic') }}</button>
          </div>
        </div>
        <div v-if="s.logicSource === 'custom'" class="setting-row mt-8">
          <span class="hint-inline">{{ customLogicFileName ?? t('settings.tracker.no_file_loaded') }}</span>
          <button class="btn-sm" @click="openLogicFilePicker">{{ t('settings.tracker.import_logic_file') }}</button>
          <input ref="logicFileInput" type="file" accept=".logic" style="display:none" @change="onLogicFileChange" />
        </div>
        <p class="hint-block">{{ t('settings.tracker.logic_source_hint') }}</p>
      </section>

      <section class="card">
        <h3>{{ t('settings.tracker.tracker_display') }}</h3>
        <div class="setting-row">
          <label>{{ t('settings.tracker.language') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: locale === 'FR' }]" @click="locale = 'FR'">🇫🇷 FR</button>
            <button :class="['opt-btn', { active: locale === 'EN' }]" @click="locale = 'EN'">🇬🇧 EN</button>
          </div>
        </div>
        <div class="setting-row"><label>{{ t('settings.tracker.show_inaccessible') }}</label><div class="btn-group"><button :class="['opt-btn',{active:!s.showInaccessible}]" @click="s.showInaccessible=false">{{ t('settings.tracker.off') }}</button><button :class="['opt-btn',{active:s.showInaccessible}]" @click="s.showInaccessible=true">{{ t('settings.tracker.on') }}</button></div></div>
        <p class="hint-block">{{ t('settings.tracker.inaccessible_hint') }}</p>

        <div class="setting-row" style="margin-top:10px">
          <label>{{ t('settings.tracker.auto_tab_dungeons') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.autoTabDungeons === 'non' }]"      @click="s.autoTabDungeons = 'non'">{{ t('settings.tracker.off') }}</button>
            <button :class="['opt-btn', { active: s.autoTabDungeons === 'overview' }]" @click="s.autoTabDungeons = 'overview'">{{ t('settings.tracker.overview') }}</button>
            <button :class="['opt-btn', { active: s.autoTabDungeons === 'etage' }]"    @click="s.autoTabDungeons = 'etage'">{{ t('settings.tracker.floor') }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('settings.tracker.auto_tab_overworld') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.autoTabOverworld === 'non' }]" @click="s.autoTabOverworld = 'non'">{{ t('settings.tracker.off') }}</button>
            <button :class="['opt-btn', { active: s.autoTabOverworld === 'oui' }]" @click="s.autoTabOverworld = 'oui'">{{ t('settings.tracker.on') }}</button>
          </div>
        </div>
        <p class="hint-block">{{ t('settings.tracker.auto_tab_hint') }}</p>
      </section>
    </div>

  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ── Tab bar ──────────────────────────────────────────────────────────── */
.tab-bar {
  display: flex;
  gap: 2px;
  padding: 8px 12px 0;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.stab {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 600;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-bottom: none;
  color: var(--text-muted);
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  transition: all 0.15s;
}
.stab:hover { color: var(--text); background: var(--bg-card); }
.stab.active {
  background: var(--bg-card);
  color: var(--accent);
  border-color: var(--border);
  border-bottom: 1px solid var(--bg-card);
  margin-bottom: -1px;
  z-index: 1;
}

/* ── Legend ───────────────────────────────────────────────────────────── */
.legend-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 16px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  flex-shrink: 0;
}

.dot {
  display: inline-block;
  width: 10px; height: 10px;
  border-radius: 50%;
  margin-right: 4px;
}
.dot.green  { background: #4caf50; }
.dot.yellow { background: #ffca28; }
.dot.red    { background: #f44336; }

/* ── Tab content ──────────────────────────────────────────────────────── */
.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.two-col-layout {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
}
.two-col-layout .card { flex: 1 1 320px; }

/* ── Card ─────────────────────────────────────────────────────────────── */
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
}

.card h3 {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sub-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
  margin: 14px 0 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ── Fields ───────────────────────────────────────────────────────────── */
.field { margin-bottom: 10px; }
.field label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.two-col-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
}



.num-input {
  width: 70px;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}


.hint-inline {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--text);
}
.btn-group { display: flex; gap: 4px; }
.opt-btn {
  padding: 3px 10px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
}
.opt-btn:hover { background: var(--bg-hover, #2a1a08); }
.opt-btn.active {
  background: var(--accent, #5a3a10);
  color: #fff;
  border-color: var(--accent-bright, #d4a84b);
}

.hint-block {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}


.tricks-card { width: 100%; box-sizing: border-box; }
.tricks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.tricks-header h3 { margin-bottom: 0; }
.tricks-btns { display: flex; gap: 6px; }

.btn-sm {
  padding: 3px 10px;
  font-size: 11px;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 4px;
  cursor: pointer;
}
.btn-sm:hover { border-color: var(--accent); color: var(--accent); }

.mt-8 { margin-top: 8px; }
</style>
