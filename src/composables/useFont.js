import { ref, watch } from 'vue'

const STORAGE_KEY = 'tmc_font'

const fontModules = import.meta.glob('../fonts/*.{otf,ttf,woff,woff2}', {
  eager: true,
  query: '?url',
})

export const FONTS = [{ name: 'Default', value: null, url: null, ext: null }]
for (const [path, mod] of Object.entries(fontModules)) {
  const filename = path.split('/').pop()
  const name = filename.replace(/\.[^.]+$/, '')
  const ext  = filename.split('.').pop().toLowerCase()
  // Vite may return the URL as the module itself or as mod.default
  const url  = typeof mod === 'string' ? mod : mod?.default
  if (url) FONTS.push({ name, value: name, url, ext })
}

const stored = localStorage.getItem(STORAGE_KEY) || null
const selectedFont = ref(FONTS.some(f => f.value === stored) ? stored : null)

let _styleEl = null
function _getStyle() {
  if (!_styleEl) {
    _styleEl = document.createElement('style')
    _styleEl.id = 'tmc-custom-font'
    document.head.appendChild(_styleEl)
  }
  return _styleEl
}

const FORMAT = { otf: 'opentype', ttf: 'truetype', woff: 'woff', woff2: 'woff2' }

function applyFont(fontValue) {
  const style = _getStyle()
  if (!fontValue) {
    style.textContent = ''
    return
  }
  const font = FONTS.find(f => f.value === fontValue)
  if (!font?.url) return
  const format = FORMAT[font.ext] ?? font.ext
  style.textContent = [
    `@font-face { font-family: '${fontValue}'; src: url('${font.url}') format('${format}'); }`,
    `body, body *:not(.emoji-flag) { font-family: '${fontValue}', sans-serif !important; }`,
  ].join('\n')
}

watch(selectedFont, val => {
  localStorage.setItem(STORAGE_KEY, val ?? '')
  applyFont(val)
}, { immediate: true })

export function useFont() {
  return { selectedFont, fonts: FONTS }
}
