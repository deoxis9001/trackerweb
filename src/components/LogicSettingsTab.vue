<script setup>
const props = defineProps({
  groups:     { type: Array,  required: true },
  modelValue: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue'])

function get(dir) {
  const v = props.modelValue?.[dir.defineName]
  if (v !== undefined) return v
  if (dir.type === 'flag')      return dir.defaultValue ?? false
  if (dir.type === 'dropdown')  return dir.defaultValue ?? ''
  if (dir.type === 'numberbox') return dir.default ?? 0
}

function set(defineName, val) {
  emit('update:modelValue', { ...(props.modelValue ?? {}), [defineName]: val })
}
</script>

<template>
  <template v-for="group in groups" :key="group.name">
    <section class="card">
      <h3>{{ group.name }}</h3>

      <div v-for="dir in group.directives" :key="dir.defineName" class="setting-row">
        <label>{{ dir.label || dir.defineName }}</label>

        <div v-if="dir.type === 'flag'" class="btn-group">
          <button :class="['opt-btn', { active: !get(dir) }]"  @click="set(dir.defineName, false)">No</button>
          <button :class="['opt-btn', { active: !!get(dir) }]" @click="set(dir.defineName, true)">Yes</button>
        </div>

        <select v-else-if="dir.type === 'dropdown'"
          class="logic-select"
          :value="get(dir)"
          @change="set(dir.defineName, $event.target.value)"
        >
          <option v-for="opt in dir.options" :key="opt.defineName" :value="opt.defineName">
            {{ opt.label }}
          </option>
        </select>

        <input v-else-if="dir.type === 'numberbox'"
          class="num-input" type="number"
          :value="get(dir)" :min="dir.min" :max="dir.max"
          @change="set(dir.defineName, +$event.target.value)"
        />
      </div>
    </section>
  </template>
</template>

<style scoped>
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

.setting-row label {
  font-size: 12px;
  color: var(--text);
  flex-shrink: 0;
  max-width: 55%;
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

.logic-select {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 12px;
  min-width: 100px;
  max-width: 260px;
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
</style>
