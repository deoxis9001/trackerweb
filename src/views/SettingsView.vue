<script setup>
import { ref } from 'vue'
import { useSettingsStore, TRICKS } from '../stores/settingsStore'
import { watchEffect } from 'vue'

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

const DUNGEON_ITEM_OPTIONS = [
  { value: 'own_dungeon', label: 'Own Dungeon' },
  { value: 'anywhere',   label: 'Anywhere' },
]

const DUNGEON_ITEM_OPTIONS_WITH_START = [
  { value: 'own_dungeon', label: 'Own Dungeon' },
  { value: 'anywhere',   label: 'Anywhere' },
  { value: 'start_with', label: 'Start With' },
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
        <div class="field">
          <label>Goal</label>
          <div class="radio-row">
            <label><input type="radio" v-model="s.goal" value="vaati" /> Defeat Vaati</label>
            <label><input type="radio" v-model="s.goal" value="pedestal" /> Pedestal</label>
          </div>
        </div>
        <div class="field">
          <label>DHC Access</label>
          <div class="radio-row">
            <label><input type="radio" v-model="s.dhcAccess" value="closed" /> Closed</label>
            <label><input type="radio" v-model="s.dhcAccess" value="pedestal" /> Pedestal</label>
            <label><input type="radio" v-model="s.dhcAccess" value="open" /> Open</label>
          </div>
        </div>
        <div class="field">
          <label>Pedestal Reward</label>
          <select v-model="s.pedReward" class="sel">
            <option value="none">None</option>
            <option value="dhc_big_key">DHC Big Key</option>
            <option value="random_item">Random Item</option>
          </select>
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
        <div class="field">
          <label>Shuffle Elements</label>
          <select v-model="s.shuffleElements" class="sel">
            <option value="vanilla">Vanilla</option>
            <option value="dungeon_prize">Dungeon Prize</option>
            <option value="anywhere">Anywhere</option>
          </select>
        </div>
        <div class="field">
          <label>Small Keys</label>
          <select v-model="s.dungeonSmallKeys" class="sel">
            <option v-for="o in DUNGEON_ITEM_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>Big Keys</label>
          <select v-model="s.dungeonBigKeys" class="sel">
            <option v-for="o in DUNGEON_ITEM_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>Dungeon Maps</label>
          <select v-model="s.dungeonMaps" class="sel">
            <option v-for="o in DUNGEON_ITEM_OPTIONS_WITH_START" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>Compasses</label>
          <select v-model="s.dungeonCompasses" class="sel">
            <option v-for="o in DUNGEON_ITEM_OPTIONS_WITH_START" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="field">
          <label>Non-Element Dungeons</label>
          <div class="radio-row">
            <label><input type="radio" v-model="s.nonElementDungeons" value="standard" /> Standard</label>
            <label><input type="radio" v-model="s.nonElementDungeons" value="excluded" /> Excluded</label>
          </div>
        </div>
      </section>

      <section class="card">
        <h3>Dungeon Warps</h3>
        <div class="warp-grid">
          <template v-for="[key, label] in [
            ['warpDWS','DWS'],['warpCoF','CoF'],['warpFoW','FoW'],
            ['warpToD','ToD'],['warpPoW','PoW'],['warpDHC','DHC'],
          ]" :key="key">
            <span class="warp-label">{{ label }}</span>
            <select v-model.number="s[key]" class="sel sm">
              <option v-for="o in WARP_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </template>
        </div>
      </section>
    </div>

    <!-- ── LOCATIONS ───────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'locations'" class="tab-content two-col-layout">
      <section class="card">
        <h3>Location Shuffle</h3>
        <div class="check-list two-col">
          <label><input type="checkbox" v-model="s.rupeesanity" /> Rupeesanity</label>
          <label><input type="checkbox" v-model="s.shufflePots" /> Shuffle Pots</label>
          <label><input type="checkbox" v-model="s.shuffleDigging" /> Shuffle Digging</label>
          <label><input type="checkbox" v-model="s.shuffleUnderwater" /> Shuffle Underwater</label>
          <label><input type="checkbox" v-model="s.shuffleGoldEnemies" /> Gold Enemies</label>
          <label><input type="checkbox" v-model="s.extraShopItem" /> Extra Shop Item</label>
          <label><input type="checkbox" v-model="s.earlyWeapon" /> Early Weapon</label>
        </div>
        <div class="field mt-8">
          <label>Biggoron</label>
          <select v-model="s.biggoron" class="sel">
            <option value="disabled">Disabled</option>
            <option value="shield">Requires Shield</option>
            <option value="mirror_shield">Requires Mirror Shield</option>
          </select>
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
        <div class="check-list mt-8">
          <label><input type="checkbox" v-model="s.goronJPPrices" /> Goron JP Prices</label>
        </div>
      </section>

      <section class="card">
        <h3>Wind Crests <span class="hint-inline">(unlocked at start)</span></h3>
        <div class="check-list two-col">
          <label><input type="checkbox" v-model="s.windCrestCrenel" /> Mt. Crenel</label>
          <label><input type="checkbox" v-model="s.windCrestFalls" /> Veil Falls</label>
          <label><input type="checkbox" v-model="s.windCrestClouds" /> Cloud Tops</label>
          <label><input type="checkbox" v-model="s.windCrestCastor" /> Castor Wilds</label>
          <label><input type="checkbox" v-model="s.windCrestSouthField" /> South Field</label>
          <label><input type="checkbox" v-model="s.windCrestMinishWoods" /> Minish Woods</label>
        </div>
      </section>
    </div>

    <!-- ── ITEMS ───────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'items'" class="tab-content two-col-layout">
      <section class="card">
        <h3>Progressive Items</h3>
        <div class="check-list two-col">
          <label><input type="checkbox" v-model="s.progressiveSword" /> Progressive Sword</label>
          <label><input type="checkbox" v-model="s.progressiveShield" /> Progressive Shield</label>
          <label><input type="checkbox" v-model="s.progressiveBow" /> Progressive Bow</label>
          <label><input type="checkbox" v-model="s.progressiveBoomerang" /> Progressive Boomerang</label>
          <label><input type="checkbox" v-model="s.progressiveScroll" /> Progressive Scroll</label>
          <label><input type="checkbox" v-model="s.randomBottleContents" /> Random Bottle Contents</label>
          <label><input type="checkbox" v-model="s.trapsEnabled" /> Traps Enabled</label>
        </div>
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
        <div class="field mt-8">
          <label>Bomb Bag Required</label>
          <select v-model.number="s.weaponBomb" class="sel">
            <option :value="0">No (Bag required)</option>
            <option :value="1">Yes (Free bombs)</option>
            <option :value="2">Yes + Bosses</option>
          </select>
        </div>
        <div class="check-list mt-8">
          <label><input type="checkbox" v-model="s.weaponBow" /> Bow = Weapon</label>
          <label><input type="checkbox" v-model="s.weaponGust" /> Gust Jar = Weapon</label>
          <label><input type="checkbox" v-model="s.weaponLantern" /> Lantern = Weapon</label>
        </div>
      </section>
    </div>

    <!-- ── FUSIONS ─────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'fusions'" class="tab-content">
      <section class="card">
        <h3>Fusion Access</h3>
        <div class="fusion-grid">
          <template v-for="[key, label, model] in [
            ['gold','Gold Kinstone','goldFusionAccess'],
            ['red','Red Kinstone','redFusionAccess'],
            ['blue','Blue Kinstone','blueFusionAccess'],
            ['green','Green Kinstone','greenFusionAccess'],
          ]" :key="key">
            <span class="fusion-label">{{ label }}</span>
            <select v-model="s[model]" class="sel sm">
              <option v-for="o in FUSION_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </template>
        </div>
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
        <div class="check-list two-col">
          <label><input type="checkbox" v-model="s.ocarinaOnSelect" /> Ocarina on Select</label>
          <label><input type="checkbox" v-model="s.bootsOnL" /> Boots on L</label>
          <label><input type="checkbox" v-model="s.bootsAsMinish" /> Boots as Minish</label>
          <label><input type="checkbox" v-model="s.bigOctoManipulation" /> Skip Big Octorok</label>
          <label><input type="checkbox" v-model="s.replicaTODBossDoor" /> ToD Boss Door Replica</label>
        </div>
      </section>

      <section class="card tricks-card">
        <div class="tricks-header">
          <h3>Tricks <span class="hint-inline">(yellow = accessible with tricks)</span></h3>
          <div class="tricks-btns">
            <button class="btn-sm" @click="s.setAllTricks(true)">All</button>
            <button class="btn-sm" @click="s.setAllTricks(false)">None</button>
          </div>
        </div>
        <div class="check-list two-col">
          <label v-for="trick in Object.values(TRICKS)" :key="trick.key">
            <input type="checkbox" :checked="s.hasTrick(trick.key)" @change="s.toggleTrick(trick.key)" />
            {{ trick.label }}
          </label>
        </div>
      </section>
    </div>

    <!-- ── TRACKER ─────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'tracker'" class="tab-content">
      <section class="card">
        <h3>Tracker Display</h3>
        <div class="check-list">
          <label>
            <input type="checkbox" v-model="s.showInaccessible" />
            Show inaccessible locations in the list
          </label>
        </div>
        <p class="hint-block">
          By default, <span style="color:#f44336">red</span> (inaccessible) locations are hidden
          in the checklist and left panel. Enabling this option shows them.
          Map pins are never hidden.
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

.radio-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
}
.radio-row label {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text);
  cursor: pointer;
}

.check-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.check-list label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
}
.check-list.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
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

.sel {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  width: 100%;
}
.sel.sm { width: auto; min-width: 120px; }

.hint-inline {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.hint-block {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.6;
}

.warp-grid {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 8px 12px;
  align-items: center;
}
.warp-label { font-size: 12px; font-weight: 600; color: var(--text-muted); }

.fusion-grid {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 8px 12px;
  align-items: center;
}
.fusion-label { font-size: 12px; color: var(--text-muted); }

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
