<script setup>
import { ref } from 'vue'
import { useSettingsStore, TRICKS } from '../stores/settingsStore'
import { watchEffect } from 'vue'

const isDev = import.meta.env.DEV

const s = useSettingsStore()

let saveTimer
watchEffect(() => {
  s.exportSettings()
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => s.save(), 400)
})

const TABS = [
  { id: 'goal',      label: 'Goal' },
  { id: 'dungeons',  label: 'Dungeons' },
  { id: 'locations', label: 'Locations' },
  { id: 'items',     label: 'Items' },
  { id: 'fusions',   label: 'Fusions' },
  { id: 'qol',       label: 'QoL & Tricks' },
  { id: 'tracker',   label: 'Tracker' },
]

const activeTab = ref('goal')

const WARP_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Blue' },
  { value: 2, label: 'Red' },
  { value: 3, label: 'Both' },
]


const FUSION_OPTIONS = [
  { value: 'closed',   label: 'Closed' },
  { value: 'vanilla',  label: 'Vanilla' },
  { value: 'combined', label: 'Combined' },
  { value: 'open',     label: 'Open' },
]
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
      >{{ tab.label }}</button>
    </div>

    <!-- Legend -->
    <div class="legend-bar">
      <span class="dot green"></span> Accessible
      <span class="dot yellow"></span> Out of logic (tricks)
      <span class="dot red"></span> Inaccessible
    </div>

    <!-- ── GOAL ──────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'goal'" class="tab-content">
      <section class="card">
        <h3>Goal</h3>
        <div class="setting-row">
          <label>Goal</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.goal === 'vaati' }]"    @click="s.goal = 'vaati'">Defeat Vaati</button>
            <button :class="['opt-btn', { active: s.goal === 'pedestal' }]" @click="s.goal = 'pedestal'">Pedestal</button>
          </div>
        </div>
        <div class="setting-row">
          <label>DHC Access</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.dhcAccess === 'closed' }]"   @click="s.dhcAccess = 'closed'">Closed</button>
            <button :class="['opt-btn', { active: s.dhcAccess === 'pedestal' }]" @click="s.dhcAccess = 'pedestal'">Pedestal</button>
            <button :class="['opt-btn', { active: s.dhcAccess === 'open' }]"     @click="s.dhcAccess = 'open'">Open</button>
          </div>
        </div>
        <div class="setting-row">
          <label>Pedestal Reward</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.pedReward === 'none' }]"         @click="s.pedReward = 'none'">None</button>
            <button :class="['opt-btn', { active: s.pedReward === 'dhc_big_key' }]"  @click="s.pedReward = 'dhc_big_key'">DHC Big Key</button>
            <button :class="['opt-btn', { active: s.pedReward === 'random_item' }]"  @click="s.pedReward = 'random_item'">Random Item</button>
          </div>
        </div>
        <h3 class="sub-title">Pedestal Conditions</h3>
        <div class="two-col-fields">
          <div class="field">
            <label>Required Elements (0–4)</label>
            <input type="number" v-model.number="s.pedElements" min="0" max="4" class="num-input" />
          </div>
          <div class="field">
            <label>Required Sword Tier (0–5)</label>
            <input type="number" v-model.number="s.pedSwords" min="0" max="5" class="num-input" />
          </div>
          <div class="field">
            <label>Required Dungeons (0–6)</label>
            <input type="number" v-model.number="s.pedDungeons" min="0" max="6" class="num-input" />
          </div>
          <div class="field">
            <label>Required Figurines (0–136)</label>
            <input type="number" v-model.number="s.pedFigurines" min="0" max="136" class="num-input" />
          </div>
          <div class="field">
            <label>Starting Hearts (1–20)</label>
            <input type="number" v-model.number="s.startingHearts" min="1" max="20" class="num-input" />
          </div>
        </div>
      </section>
    </div>

    <!-- ── DUNGEONS ──────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'dungeons'" class="tab-content two-col-layout">
      <section class="card">
        <h3>Dungeon Shuffle</h3>
        <div class="setting-row">
          <label>Shuffle Elements</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.shuffleElements === 'vanilla' }]"       @click="s.shuffleElements = 'vanilla'">Vanilla</button>
            <button :class="['opt-btn', { active: s.shuffleElements === 'dungeon_prize' }]" @click="s.shuffleElements = 'dungeon_prize'">Prize</button>
            <button :class="['opt-btn', { active: s.shuffleElements === 'anywhere' }]"      @click="s.shuffleElements = 'anywhere'">Anywhere</button>
          </div>
        </div>
        <div class="setting-row">
          <label>Small Keys</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.dungeonSmallKeys === 'own_dungeon' }]" @click="s.dungeonSmallKeys = 'own_dungeon'">Own</button>
            <button :class="['opt-btn', { active: s.dungeonSmallKeys === 'anywhere' }]"    @click="s.dungeonSmallKeys = 'anywhere'">Anywhere</button>
          </div>
        </div>
        <div class="setting-row">
          <label>Big Keys</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.dungeonBigKeys === 'own_dungeon' }]" @click="s.dungeonBigKeys = 'own_dungeon'">Own</button>
            <button :class="['opt-btn', { active: s.dungeonBigKeys === 'anywhere' }]"    @click="s.dungeonBigKeys = 'anywhere'">Anywhere</button>
          </div>
        </div>
        <div class="setting-row">
          <label>Dungeon Maps</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.dungeonMaps === 'own_dungeon' }]" @click="s.dungeonMaps = 'own_dungeon'">Own</button>
            <button :class="['opt-btn', { active: s.dungeonMaps === 'anywhere' }]"    @click="s.dungeonMaps = 'anywhere'">Anywhere</button>
            <button :class="['opt-btn', { active: s.dungeonMaps === 'start_with' }]"  @click="s.dungeonMaps = 'start_with'">Start</button>
          </div>
        </div>
        <div class="setting-row">
          <label>Compasses</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.dungeonCompasses === 'own_dungeon' }]" @click="s.dungeonCompasses = 'own_dungeon'">Own</button>
            <button :class="['opt-btn', { active: s.dungeonCompasses === 'anywhere' }]"    @click="s.dungeonCompasses = 'anywhere'">Anywhere</button>
            <button :class="['opt-btn', { active: s.dungeonCompasses === 'start_with' }]"  @click="s.dungeonCompasses = 'start_with'">Start</button>
          </div>
        </div>
        <div class="setting-row">
          <label>Non-Element Dungeons</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.nonElementDungeons === 'standard' }]" @click="s.nonElementDungeons = 'standard'">Standard</button>
            <button :class="['opt-btn', { active: s.nonElementDungeons === 'excluded' }]" @click="s.nonElementDungeons = 'excluded'">Excluded</button>
          </div>
        </div>
      </section>

      <section class="card">
        <h3>Entrance Shuffle</h3>
        <div class="setting-row">
          <label>Dungeon Entrance Shuffle</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: !s.dungeonEntranceShuffle }]" @click="s.dungeonEntranceShuffle = false">No</button>
            <button
              :class="['opt-btn', { active: s.dungeonEntranceShuffle }]"
              :disabled="!isDev"
              :title="!isDev ? 'Dev only' : ''"
              @click="isDev && (s.dungeonEntranceShuffle = true)"
            >Yes</button>
          </div>
        </div>
        <p class="hint-block">When enabled, dungeon entrances are shuffled. You can then assign which dungeon each entrance leads to.</p>
      </section>

      <section class="card">
        <h3>Dungeon Warps</h3>
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
        <h3>Location Shuffle</h3>
        <div class="setting-row"><label>Rupeesanity</label><div class="btn-group"><button :class="['opt-btn',{active:!s.rupeesanity}]" @click="s.rupeesanity=false">No</button><button :class="['opt-btn',{active:s.rupeesanity}]" @click="s.rupeesanity=true">Yes</button></div></div>
        <div class="setting-row"><label>Shuffle Pots</label><div class="btn-group"><button :class="['opt-btn',{active:!s.shufflePots}]" @click="s.shufflePots=false">No</button><button :class="['opt-btn',{active:s.shufflePots}]" @click="s.shufflePots=true">Yes</button></div></div>
        <div class="setting-row"><label>Shuffle Digging</label><div class="btn-group"><button :class="['opt-btn',{active:!s.shuffleDigging}]" @click="s.shuffleDigging=false">No</button><button :class="['opt-btn',{active:s.shuffleDigging}]" @click="s.shuffleDigging=true">Yes</button></div></div>
        <div class="setting-row"><label>Shuffle Underwater</label><div class="btn-group"><button :class="['opt-btn',{active:!s.shuffleUnderwater}]" @click="s.shuffleUnderwater=false">No</button><button :class="['opt-btn',{active:s.shuffleUnderwater}]" @click="s.shuffleUnderwater=true">Yes</button></div></div>
        <div class="setting-row"><label>Gold Enemies</label><div class="btn-group"><button :class="['opt-btn',{active:!s.shuffleGoldEnemies}]" @click="s.shuffleGoldEnemies=false">No</button><button :class="['opt-btn',{active:s.shuffleGoldEnemies}]" @click="s.shuffleGoldEnemies=true">Yes</button></div></div>
        <div class="setting-row"><label>Extra Shop Item</label><div class="btn-group"><button :class="['opt-btn',{active:!s.extraShopItem}]" @click="s.extraShopItem=false">No</button><button :class="['opt-btn',{active:s.extraShopItem}]" @click="s.extraShopItem=true">Yes</button></div></div>
        <div class="setting-row"><label>Early Weapon</label><div class="btn-group"><button :class="['opt-btn',{active:!s.earlyWeapon}]" @click="s.earlyWeapon=false">No</button><button :class="['opt-btn',{active:s.earlyWeapon}]" @click="s.earlyWeapon=true">Yes</button></div></div>
        <div class="setting-row mt-8">
          <label>Biggoron</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.biggoron === 'disabled' }]"      @click="s.biggoron = 'disabled'">Disabled</button>
            <button :class="['opt-btn', { active: s.biggoron === 'shield' }]"        @click="s.biggoron = 'shield'">Shield</button>
            <button :class="['opt-btn', { active: s.biggoron === 'mirror_shield' }]" @click="s.biggoron = 'mirror_shield'">Mirror Shield</button>
          </div>
        </div>
        <div class="two-col-fields mt-8">
          <div class="field">
            <label>Cucco Rounds (0–10)</label>
            <input type="number" v-model.number="s.cuccoRounds" min="0" max="10" class="num-input" />
          </div>
          <div class="field">
            <label>Goron Sets (0–5)</label>
            <input type="number" v-model.number="s.goronSets" min="0" max="5" class="num-input" />
          </div>
        </div>
        <div class="setting-row mt-8"><label>Goron JP Prices</label><div class="btn-group"><button :class="['opt-btn',{active:!s.goronJPPrices}]" @click="s.goronJPPrices=false">No</button><button :class="['opt-btn',{active:s.goronJPPrices}]" @click="s.goronJPPrices=true">Yes</button></div></div>
      </section>

      <section class="card">
        <h3>Wind Crests <span class="hint-inline">(unlocked at start)</span></h3>
        <div class="setting-row"><label>Mt. Crenel</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestCrenel}]" @click="s.windCrestCrenel=false">No</button><button :class="['opt-btn',{active:s.windCrestCrenel}]" @click="s.windCrestCrenel=true">Yes</button></div></div>
        <div class="setting-row"><label>Veil Falls</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestFalls}]" @click="s.windCrestFalls=false">No</button><button :class="['opt-btn',{active:s.windCrestFalls}]" @click="s.windCrestFalls=true">Yes</button></div></div>
        <div class="setting-row"><label>Cloud Tops</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestClouds}]" @click="s.windCrestClouds=false">No</button><button :class="['opt-btn',{active:s.windCrestClouds}]" @click="s.windCrestClouds=true">Yes</button></div></div>
        <div class="setting-row"><label>Castor Wilds</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestCastor}]" @click="s.windCrestCastor=false">No</button><button :class="['opt-btn',{active:s.windCrestCastor}]" @click="s.windCrestCastor=true">Yes</button></div></div>
        <div class="setting-row"><label>South Field</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestSouthField}]" @click="s.windCrestSouthField=false">No</button><button :class="['opt-btn',{active:s.windCrestSouthField}]" @click="s.windCrestSouthField=true">Yes</button></div></div>
        <div class="setting-row"><label>Minish Woods</label><div class="btn-group"><button :class="['opt-btn',{active:!s.windCrestMinishWoods}]" @click="s.windCrestMinishWoods=false">No</button><button :class="['opt-btn',{active:s.windCrestMinishWoods}]" @click="s.windCrestMinishWoods=true">Yes</button></div></div>
      </section>
    </div>

    <!-- ── ITEMS ───────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'items'" class="tab-content two-col-layout">
      <section class="card">
        <h3>Progressive Items</h3>
        <div class="setting-row"><label>Progressive Sword</label><div class="btn-group"><button :class="['opt-btn',{active:!s.progressiveSword}]" @click="s.progressiveSword=false">No</button><button :class="['opt-btn',{active:s.progressiveSword}]" @click="s.progressiveSword=true">Yes</button></div></div>
        <div class="setting-row"><label>Progressive Shield</label><div class="btn-group"><button :class="['opt-btn',{active:!s.progressiveShield}]" @click="s.progressiveShield=false">No</button><button :class="['opt-btn',{active:s.progressiveShield}]" @click="s.progressiveShield=true">Yes</button></div></div>
        <div class="setting-row"><label>Progressive Bow</label><div class="btn-group"><button :class="['opt-btn',{active:!s.progressiveBow}]" @click="s.progressiveBow=false">No</button><button :class="['opt-btn',{active:s.progressiveBow}]" @click="s.progressiveBow=true">Yes</button></div></div>
        <div class="setting-row"><label>Progressive Boomerang</label><div class="btn-group"><button :class="['opt-btn',{active:!s.progressiveBoomerang}]" @click="s.progressiveBoomerang=false">No</button><button :class="['opt-btn',{active:s.progressiveBoomerang}]" @click="s.progressiveBoomerang=true">Yes</button></div></div>
        <div class="setting-row"><label>Progressive Scroll</label><div class="btn-group"><button :class="['opt-btn',{active:!s.progressiveScroll}]" @click="s.progressiveScroll=false">No</button><button :class="['opt-btn',{active:s.progressiveScroll}]" @click="s.progressiveScroll=true">Yes</button></div></div>
        <div class="setting-row"><label>Random Bottle Contents</label><div class="btn-group"><button :class="['opt-btn',{active:!s.randomBottleContents}]" @click="s.randomBottleContents=false">No</button><button :class="['opt-btn',{active:s.randomBottleContents}]" @click="s.randomBottleContents=true">Yes</button></div></div>
        <div class="setting-row"><label>Traps Enabled</label><div class="btn-group"><button :class="['opt-btn',{active:!s.trapsEnabled}]" @click="s.trapsEnabled=false">No</button><button :class="['opt-btn',{active:s.trapsEnabled}]" @click="s.trapsEnabled=true">Yes</button></div></div>
      </section>

      <section class="card">
        <h3>Difficulty &amp; Weapons</h3>
        <div class="two-col-fields">
          <div class="field">
            <label>Heart Containers (0–20)</label>
            <input type="number" v-model.number="s.heartContainers" min="0" max="20" class="num-input" />
          </div>
          <div class="field">
            <label>Pieces of Heart (0–20)</label>
            <input type="number" v-model.number="s.pieceOfHearts" min="0" max="20" class="num-input" />
          </div>
        </div>
        <div class="setting-row mt-8">
          <label>Bomb Bag Required</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.weaponBomb === 0 }]" @click="s.weaponBomb = 0">Bag required</button>
            <button :class="['opt-btn', { active: s.weaponBomb === 1 }]" @click="s.weaponBomb = 1">Free bombs</button>
            <button :class="['opt-btn', { active: s.weaponBomb === 2 }]" @click="s.weaponBomb = 2">Free + Bosses</button>
          </div>
        </div>
        <div class="setting-row mt-8"><label>Bow = Weapon</label><div class="btn-group"><button :class="['opt-btn',{active:!s.weaponBow}]" @click="s.weaponBow=false">No</button><button :class="['opt-btn',{active:s.weaponBow}]" @click="s.weaponBow=true">Yes</button></div></div>
        <div class="setting-row"><label>Gust Jar = Weapon</label><div class="btn-group"><button :class="['opt-btn',{active:!s.weaponGust}]" @click="s.weaponGust=false">No</button><button :class="['opt-btn',{active:s.weaponGust}]" @click="s.weaponGust=true">Yes</button></div></div>
        <div class="setting-row"><label>Lantern = Weapon</label><div class="btn-group"><button :class="['opt-btn',{active:!s.weaponLantern}]" @click="s.weaponLantern=false">No</button><button :class="['opt-btn',{active:s.weaponLantern}]" @click="s.weaponLantern=true">Yes</button></div></div>
      </section>
    </div>

    <!-- ── FUSIONS ─────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'fusions'" class="tab-content">
      <section class="card">
        <h3>Fusion Access</h3>
        <template v-for="[key, label, model] in [
          ['gold','Gold Kinstone','goldFusionAccess'],
          ['red','Red Kinstone','redFusionAccess'],
          ['blue','Blue Kinstone','blueFusionAccess'],
          ['green','Green Kinstone','greenFusionAccess'],
        ]" :key="key">
          <div class="setting-row">
            <label>{{ label }}</label>
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
            <label>Cloud Multiplier ×<span class="hint-inline">(1–9)</span></label>
            <input type="number" v-model.number="s.cloudKinstoneMultiplier" min="1" max="9" class="num-input" />
          </div>
          <div class="field">
            <label>Swamp Multiplier ×<span class="hint-inline">(1–3)</span></label>
            <input type="number" v-model.number="s.swampKinstoneMultiplier" min="1" max="3" class="num-input" />
          </div>
        </div>
      </section>
    </div>

    <!-- ── QOL & TRICKS ────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'qol'" class="tab-content two-col-layout">
      <section class="card">
        <h3>Quality of Life</h3>
        <div class="setting-row"><label>Ocarina on Select</label><div class="btn-group"><button :class="['opt-btn',{active:!s.ocarinaOnSelect}]" @click="s.ocarinaOnSelect=false">No</button><button :class="['opt-btn',{active:s.ocarinaOnSelect}]" @click="s.ocarinaOnSelect=true">Yes</button></div></div>
        <div class="setting-row"><label>Boots on L</label><div class="btn-group"><button :class="['opt-btn',{active:!s.bootsOnL}]" @click="s.bootsOnL=false">No</button><button :class="['opt-btn',{active:s.bootsOnL}]" @click="s.bootsOnL=true">Yes</button></div></div>
        <div class="setting-row"><label>Boots as Minish</label><div class="btn-group"><button :class="['opt-btn',{active:!s.bootsAsMinish}]" @click="s.bootsAsMinish=false">No</button><button :class="['opt-btn',{active:s.bootsAsMinish}]" @click="s.bootsAsMinish=true">Yes</button></div></div>
        <div class="setting-row"><label>Skip Big Octorok</label><div class="btn-group"><button :class="['opt-btn',{active:!s.bigOctoManipulation}]" @click="s.bigOctoManipulation=false">No</button><button :class="['opt-btn',{active:s.bigOctoManipulation}]" @click="s.bigOctoManipulation=true">Yes</button></div></div>
        <div class="setting-row"><label>ToD Boss Door Replica</label><div class="btn-group"><button :class="['opt-btn',{active:!s.replicaTODBossDoor}]" @click="s.replicaTODBossDoor=false">No</button><button :class="['opt-btn',{active:s.replicaTODBossDoor}]" @click="s.replicaTODBossDoor=true">Yes</button></div></div>
      </section>

      <section class="card tricks-card">
        <div class="tricks-header">
          <h3>Tricks <span class="hint-inline">(yellow = accessible with tricks)</span></h3>
          <div class="tricks-btns">
            <button class="btn-sm" @click="s.setAllTricks(true)">All</button>
            <button class="btn-sm" @click="s.setAllTricks(false)">None</button>
          </div>
        </div>
        <div v-for="trick in Object.values(TRICKS)" :key="trick.key" class="setting-row">
          <label>{{ trick.label }}</label>
          <div class="btn-group">
            <button :class="['opt-btn',{active:!s.hasTrick(trick.key)}]" @click="s.hasTrick(trick.key) && s.toggleTrick(trick.key)">No</button>
            <button :class="['opt-btn',{active:s.hasTrick(trick.key)}]"  @click="!s.hasTrick(trick.key) && s.toggleTrick(trick.key)">Yes</button>
          </div>
        </div>
      </section>
    </div>

    <!-- ── TRACKER ─────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'tracker'" class="tab-content">
      <section class="card">
        <h3>Tracker Display</h3>
        <div class="setting-row"><label>Show inaccessible locations</label><div class="btn-group"><button :class="['opt-btn',{active:!s.showInaccessible}]" @click="s.showInaccessible=false">No</button><button :class="['opt-btn',{active:s.showInaccessible}]" @click="s.showInaccessible=true">Yes</button></div></div>
        <p class="hint-block">
          By default, <span style="color:#f44336">red</span> (inaccessible) locations are hidden
          in the checklist and left panel. Enabling this option shows them.
          Map pins are never hidden.
        </p>

        <div class="setting-row" style="margin-top:10px">
          <label>Auto tab — Dungeons</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.autoTabDungeons === 'non' }]"      @click="s.autoTabDungeons = 'non'">Off</button>
            <button :class="['opt-btn', { active: s.autoTabDungeons === 'overview' }]" @click="s.autoTabDungeons = 'overview'">Overview</button>
            <button :class="['opt-btn', { active: s.autoTabDungeons === 'etage' }]"    @click="s.autoTabDungeons = 'etage'">Floor</button>
          </div>
        </div>
        <div class="setting-row">
          <label>Auto tab — Overworld</label>
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.autoTabOverworld === 'non' }]" @click="s.autoTabOverworld = 'non'">Off</button>
            <button :class="['opt-btn', { active: s.autoTabOverworld === 'oui' }]" @click="s.autoTabOverworld = 'oui'">On</button>
          </div>
        </div>
        <p class="hint-block">
          Controls whether the map switches automatically when you change area (autotracking / AP).
          <b>Floor</b> shows individual floor maps in dungeons.
          <b>Overview</b> shows the full dungeon overview map.
        </p>
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
