import { ref, watch } from 'vue'
import FR from '../langue/FR.json'
import EN from '../langue/EN.json'
import ITEMS_FR from '../langue/items_FR.json'
import LOCATIONS_FR from '../langue/locations_FR.json'
import REGIONS_FR from '../langue/regions_FR.json'

const LOCALES = { FR, EN }
const STORAGE_KEY = 'tmc_locale'

const locale = ref(localStorage.getItem(STORAGE_KEY) || 'FR')

watch(locale, val => localStorage.setItem(STORAGE_KEY, val))

export function useLocale() {
  function t(path, vars = {}) {
    const keys = path.split('.')
    let node = LOCALES[locale.value]
    for (const k of keys) {
      if (node == null) break
      node = node[k]
    }
    if (typeof node !== 'string') return path
    return node.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`)
  }

  function tItem(key, fallbackName) {
    if (locale.value === 'FR') {
      const fr = ITEMS_FR[key]
      if (fr) return fr
    }
    return fallbackName ?? key
  }

  function tLocation(key, fallbackName) {
    if (locale.value === 'FR') {
      const fr = LOCATIONS_FR[key]
      if (fr) return fr
    }
    return fallbackName ?? key
  }

  function tRegion(key, fallbackName) {
    if (locale.value === 'FR') {
      const fr = REGIONS_FR[key]
      if (fr) return fr
    }
    return fallbackName ?? key
  }

  return { locale, t, tItem, tLocation, tRegion }
}
