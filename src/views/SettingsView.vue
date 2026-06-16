<script setup>
import { ref, computed, watch } from 'vue'
import { useSettingsStore, TRICKS } from '../stores/settingsStore'
import { useLocale } from '../composables/useLocale'
import { useFont } from '../composables/useFont'
import { parseDirectives } from '../logic/logicParser.js'
import { encodeSettingsString, decodeSettingsString } from '../logic/settingsString.js'
import defaultLogicRaw from '../logic/defaultLogic.js'
import LogicSettingsTab from '../components/LogicSettingsTab.vue'
import presets from '../data/presets.json'
import { applyPreset } from '../logic/presetMapper.js'
import { load as loadYaml } from 'js-yaml'

const s = useSettingsStore()
const { t, locale, availableLocales } = useLocale()
const { selectedFont, fonts } = useFont()


// ── Logic directives ──────────────────────────────────────────────────────────

const currentLogicText = computed(() =>
  s.logicSource === 'custom' && s.customLogicText ? s.customLogicText : defaultLogicRaw
)

const allDirectives = computed(() => parseDirectives(currentLogicText.value))

function initRandoDefines() {
  const dir = allDirectives.value
  if (!dir) return
  const rd = { ...(s.randoDefines ?? {}) }
  for (const d of dir.flags)
    if (!(d.defineName in rd) && d.defaultValue !== undefined)
      rd[d.defineName] = d.defaultValue
  for (const d of dir.dropdowns) {
    const cur = rd[d.defineName]
    const valid = cur && d.options.some(o => o.defineName === cur)
    if (!valid) rd[d.defineName] = d.defaultValue ?? (d.options[0]?.defineName ?? '')
  }
  for (const d of dir.numberboxes)
    if (!(d.defineName in rd))
      rd[d.defineName] = d.default ?? 0
  s.randoDefines = rd
}

watch(() => s.logicSource, () => initRandoDefines(), { immediate: true })

// ── Settings String ───────────────────────────────────────────────────────────

const settingsString = ref('')
watch(
  [allDirectives, () => s.randoDefines],
  ([dirs, rd]) => {
    if (!dirs || !rd) { settingsString.value = ''; return }
    try { settingsString.value = encodeSettingsString(dirs, rd) } catch { settingsString.value = '' }
  },
  { immediate: true }
)

const importInput = ref('')
const importError = ref('')

function importSettingsString() {
  const rd = decodeSettingsString(importInput.value.trim(), allDirectives.value)
  if (!rd) { importError.value = 'invalid'; return }
  s.randoDefines = rd
  importInput.value = ''
  importError.value = ''
}

function copySettingsString() {
  navigator.clipboard?.writeText(settingsString.value)
}

const activeTab = ref('WebSetting')
const isLogicTab   = computed(() => activeTab.value !== 'WebSetting')
const isOutOfLogic = computed(() => activeTab.value === 'out_of_logic')

// ── Individual logic tabs (from directive file) ───────────────────────────────

const logicTabsData = computed(() => {
  const dir = allDirectives.value
  if (!dir) return []
  const tabMap = new Map()
  for (const d of dir.directives) {
    if (d.tab === 'Cosmetics') continue
    if (!tabMap.has(d.tab)) tabMap.set(d.tab, new Map())
    const groupMap = tabMap.get(d.tab)
    if (!groupMap.has(d.group)) groupMap.set(d.group, [])
    groupMap.get(d.group).push(d)
  }
  return Array.from(tabMap.entries()).map(([tabName, groupMap]) => ({
    name: tabName,
    groups: Array.from(groupMap.entries()).map(([groupName, directives]) => ({
      name: groupName,
      directives,
    })),
  }))
})

const activeTabGroups = computed(() => {
  const tab = logicTabsData.value.find(t => t.name === activeTab.value)
  return tab ? tab.groups : []
})

// ── "Out of Logic" supplementary tab — all groups from all logic tabs in one view ──

const outOfLogicGroups = computed(() => {
  const dir = allDirectives.value
  if (!dir) return []
  const tricks = dir.directives.filter(d => d.group === 'Require Tricks')
  if (!tricks.length) return []
  return [{ name: 'Require Tricks', directives: tricks }]
})

// ── Presets ───────────────────────────────────────────────────────────────────

const activePreset = ref(null)
const yamlFileInput = ref(null)

function applyBundledPreset(preset) {
  applyPreset(preset.settings, s)
  activePreset.value = preset.name
}

function handleYamlImport(event) {
  const file = event.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = e => {
    try {
      const parsed = loadYaml(e.target.result)
      if (parsed?.settings) {
        applyPreset(parsed.settings, s)
        activePreset.value = null
      }
    } catch {}
    event.target.value = ''
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="settings-page">
    <!-- Tab bar -->
    <div class="tab-bar">
      <button :class="['stab', activeTab === 'WebSetting' && 'active']"   @click="activeTab = 'WebSetting'">WebSetting</button>
      <button :class="['stab', activeTab === 'out_of_logic' && 'active']" @click="activeTab = 'out_of_logic'">Out of Logic</button>
      <button
        v-for="tab in logicTabsData"
        :key="tab.name"
        :class="['stab', activeTab === tab.name && 'active']"
        @click="activeTab = tab.name"
      >{{ tab.name }}</button>
    </div>

    <!-- Legend -->
    <div class="legend-bar">
      <span class="dot green"></span> {{ t('settings.legend.accessible') }}
      <span class="dot yellow"></span> {{ t('settings.legend.out_of_logic') }}
      <span class="dot red"></span> {{ t('settings.legend.inaccessible') }}
    </div>

    <!-- ── OUT OF LOGIC TAB (all settings in one view) ────────────────────── -->
    <div v-if="isOutOfLogic" class="tab-content">
      <LogicSettingsTab
        :groups="outOfLogicGroups"
        :model-value="s.randoDefines"
        yes-no-mode
        @update:model-value="s.randoDefines = $event"
      />
    </div>

    <!-- ── INDIVIDUAL LOGIC TABS ──────────────────────────────────────────── -->
    <div v-else-if="isLogicTab" class="tab-content">
      <LogicSettingsTab
        :groups="activeTabGroups"
        :model-value="s.randoDefines"
        @update:model-value="s.randoDefines = $event"
      />
    </div>

    <!-- ── WEBSETTING ────────────────────────────────────────────────────── -->
    <div v-else class="tab-content">

      <!-- Logic Source -->
      <section class="card">
        <h3>{{ t('settings.tracker.logic_source') }}</h3>
        <div class="setting-row">
          <div class="btn-group">
            <button :class="['opt-btn', { active: s.logicSource === 'default_logic' }]" @click="s.logicSource = 'default_logic'">{{ t('settings.tracker.default_logic') }}</button>
          </div>
        </div>
        <p class="hint-block">{{ t('settings.tracker.logic_source_hint') }}</p>
      </section>

      <!-- Presets -->
      <section class="card">
        <h3>Presets</h3>
        <div class="preset-grid">
          <button
            v-for="p in presets" :key="p.name"
            :class="['opt-btn', { active: activePreset === p.name }]"
            :title="p.description"
            @click="applyBundledPreset(p)"
          >{{ p.name }}</button>
        </div>
        <div class="setting-row" style="margin-top:10px">
          <button class="btn-sm" @click="yamlFileInput.click()">Import .yaml</button>
          <input ref="yamlFileInput" type="file" accept=".yaml,.yml" style="display:none" @change="handleYamlImport" />
        </div>
      </section>

      <!-- Settings String -->
      <section class="card">
        <h3>Settings String</h3>
        <div class="settings-str-row">
          <input class="str-input" readonly :value="settingsString" @focus="$event.target.select()" />
          <button class="btn-sm" @click="copySettingsString">Copy</button>
        </div>
        <div class="settings-str-row" style="margin-top:6px">
          <input
            class="str-input"
            v-model="importInput"
            placeholder="Paste settings string…"
            @keydown.enter="importSettingsString"
          />
          <button class="btn-sm" @click="importSettingsString">Import</button>
        </div>
        <p v-if="importError" class="err-msg">{{ importError }}</p>
      </section>

      <!-- Tracker Display -->
      <section class="card">
        <h3>{{ t('settings.tracker.tracker_display') }}</h3>
        <div class="setting-row">
          <label>{{ t('settings.tracker.font') }}</label>
          <div class="btn-group btn-group--wrap">
            <button
              v-for="f in fonts" :key="f.value ?? 'default'"
              :class="['opt-btn', { active: selectedFont === f.value }]"
              @click="selectedFont = f.value"
            >{{ f.name }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('settings.tracker.language') }}</label>
          <div class="btn-group">
            <button
              v-for="loc in availableLocales" :key="loc.code"
              :class="['opt-btn', { active: locale === loc.code }]"
              @click="locale = loc.code"
            ><span class="emoji-flag">{{ loc.flag }}</span> {{ loc.code }}</button>
          </div>
        </div>
        <div class="setting-row">
          <label>{{ t('settings.tracker.show_inaccessible') }}</label>
          <div class="btn-group">
            <button :class="['opt-btn',{active:!s.showInaccessible}]" @click="s.showInaccessible=false">{{ t('settings.tracker.off') }}</button>
            <button :class="['opt-btn',{active:s.showInaccessible}]"  @click="s.showInaccessible=true">{{ t('settings.tracker.on') }}</button>
          </div>
        </div>
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

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

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
.btn-group--wrap { flex-wrap: wrap; }
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

.settings-str-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.str-input {
  flex: 1;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  min-width: 0;
}
.err-msg {
  margin-top: 6px;
  font-size: 11px;
  color: #e04040;
}

.logic-settings-block {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.logic-tab-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 6px 8px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.logic-tab-btn {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: 3px;
  cursor: pointer;
}
.logic-tab-btn:hover { color: var(--text); background: var(--bg-hover, #2a1a08); }
.logic-tab-btn.active {
  background: var(--accent, #5a3a10);
  color: #fff;
  border-color: var(--accent-bright, #d4a84b);
}

.preset-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
