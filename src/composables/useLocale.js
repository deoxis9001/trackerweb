import { ref, watch, computed } from 'vue'

const STORAGE_KEY = 'tmc_locale'

const generalModules = import.meta.glob('../langue/*/general.json', { eager: true })
const subModules     = import.meta.glob('../langue/*/*.json',        { eager: true })

const LOCALES     = {}
const LOCALE_META = {}
for (const [path, mod] of Object.entries(generalModules)) {
  const m = path.match(/\/(\w+)\/general\.json$/)
  if (!m) continue
  const code = m[1].toUpperCase()
  LOCALES[code]     = mod.default
  LOCALE_META[code] = mod.default._meta ?? { label: code, flag: '' }
}

const LANG_SUBS = {}
for (const [path, mod] of Object.entries(subModules)) {
  const m = path.match(/\/(\w+)\/(\w+)\.json$/)
  if (!m) continue
  const [, lang, file] = m
  if (file === 'general') continue
  const code = lang.toUpperCase()
  if (!LANG_SUBS[code]) LANG_SUBS[code] = {}
  LANG_SUBS[code][file] = mod.default
}

const defaultLocale = LOCALES['EN'] ? 'EN' : (Object.keys(LOCALES)[0] ?? 'EN')
const stored = localStorage.getItem(STORAGE_KEY)
const locale = ref((stored && LOCALES[stored]) ? stored : defaultLocale)

watch(locale, val => localStorage.setItem(STORAGE_KEY, val))

export function useLocale() {
  const availableLocales = computed(() =>
    Object.entries(LOCALE_META).map(([code, meta]) => ({ code, ...meta }))
  )

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
    const items = LANG_SUBS[locale.value]?.items
    return items?.[key] ?? fallbackName ?? key
  }

  function tLocation(key, fallbackName) {
    const locations = LANG_SUBS[locale.value]?.locations
    return locations?.[key] ?? fallbackName ?? key
  }

  function tRegion(key, fallbackName) {
    const regions = LANG_SUBS[locale.value]?.regions
    return regions?.[key] ?? fallbackName ?? key
  }

  return { locale, availableLocales, t, tItem, tLocation, tRegion }
}
