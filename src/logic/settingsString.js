/**
 * Settings String encoder/decoder — JS port of MinifiedSettings.cs + OptionList.GetCrc32().
 *
 * Format: Base64( [0x36,0x58,0x02] + CRC32_LE(4) + flags_bits + dropdowns_bits + numberboxes_bytes )
 * Always starts with "NlgC" (the Base64 of the 3-byte header).
 *
 * The CRC32 identifies the logic file's option set so that strings from different
 * logic files are rejected at decode time.
 */

// ─── CRC32 (IEEE 802.3) ──────────────────────────────────────────────────────

const _CRC32_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[i] = c >>> 0
  }
  return t
})()

function _crc32(bytes) {
  let crc = 0xffffffff >>> 0
  for (const b of bytes) crc = (((crc >>> 8) ^ _CRC32_TABLE[(crc ^ b) & 0xff]) >>> 0)
  return (crc ^ 0xffffffff) >>> 0
}

// ─── UTF-8 ───────────────────────────────────────────────────────────────────

const _ENC = new TextEncoder()
const _utf8 = s => _ENC.encode(s)

// ─── Option class names (must match C# full type names) ──────────────────────

const _CLASS = {
  flag:      'RandomizerCore.Randomizer.Logic.Options.LogicFlag',
  dropdown:  'RandomizerCore.Randomizer.Logic.Options.LogicDropdown',
  numberbox: 'RandomizerCore.Randomizer.Logic.Options.LogicNumberBox',
}
const _TYPE = 'Setting'

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Round up to the next power of 2 (≥ 2). Matches C# BitOperations.RoundUpToPowerOf2(max(2,n)).
function _nextPow2(n) {
  n = Math.max(2, n)
  let p = 1; while (p < n) p <<= 1
  return p
}

// { mask, bitCount } for packing a dropdown with `count` options.
function _bitInfo(count) {
  const p = _nextPow2(count)
  return { mask: p - 1, bitCount: Math.log2(p) | 0 }
}

// Logic-only options sorted by defineName (ordinal, matching C# string.CompareOrdinal).
// Mirrors C# OnlyLogic().GetSorted(): keeps only optionType === "Setting".
function _sorted(directives) {
  return [
    ...directives.flags,
    ...directives.dropdowns,
    ...directives.numberboxes,
  ]
    .filter(o => o.optionType === 'Setting')
    .sort((a, b) => a.defineName < b.defineName ? -1 : a.defineName > b.defineName ? 1 : 0)
}

// Logic-only options in file/parse order (matching C# Options.Where(Setting) — NOT sorted).
// Used for CRC: C# calls GetCrc32() on OnlyLogic() before GetSorted().
function _fileOrder(directives) {
  return directives.directives.filter(o => o.optionType === 'Setting')
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * CRC32 that fingerprints this logic file's option set.
 * Matches C# OptionList.GetCrc32() called on OnlyLogic() (file/parse order, NOT sorted).
 */
export function computeOptionsCrc32(directives) {
  const sorted = _fileOrder(directives)
  const chunks = []
  for (const opt of sorted) {
    chunks.push(_utf8(opt.defineName))
    chunks.push(_utf8(_TYPE))
    chunks.push(_utf8(_CLASS[opt.type]))
  }
  const len = chunks.reduce((s, c) => s + c.length, 0)
  const buf = new Uint8Array(len)
  let off = 0
  for (const c of chunks) { buf.set(c, off); off += c.length }
  return _crc32(buf)
}

/**
 * Encode randoDefines → Base64 settings string (starts with "NlgC").
 *
 * @param {object} directives   - output of parseDirectives(rawText)
 * @param {object} randoDefines - { [defineName]: boolean | string | number }
 * @returns {string}            - Base64 string
 */
export function encodeSettingsString(directives, randoDefines) {
  const rd  = randoDefines ?? {}
  const crc = computeOptionsCrc32(directives)

  const bytes = [
    0x36, 0x58, 0x02,
    (crc)        & 0xff,
    (crc >>> 8)  & 0xff,
    (crc >>> 16) & 0xff,
    (crc >>> 24) & 0xff,
  ]

  const sorted    = _sorted(directives)
  const flags     = sorted.filter(o => o.type === 'flag')
  const dropdowns = sorted.filter(o => o.type === 'dropdown')
  const numboxes  = sorted.filter(o => o.type === 'numberbox')

  // ── Flags: 1 bit each, MSB first ─────────────────────────────────────────
  let curByte = 0, iBit = 7
  for (let fi = 0; fi < flags.length; fi++) {
    if (iBit < 0) { bytes.push(curByte); curByte = 0; iBit = 7 }
    if (rd[flags[fi].defineName]) curByte |= (1 << iBit)
    iBit--
  }
  bytes.push(curByte)

  // ── Dropdowns: variable bits, packed across byte boundaries ──────────────
  curByte = 0
  let iD = 8
  for (const dd of dropdowns) {
    const { mask, bitCount } = _bitInfo(dd.options.length)
    const sel = rd[dd.defineName] ?? dd.defaultValue ?? ''
    let idx = dd.options.findIndex(o => o.defineName === sel)
    if (idx < 0) idx = 0
    idx &= mask

    iD -= bitCount

    if (iD < 0) {
      iD += 8
      curByte |= (idx >>> (8 - iD)) & 0xff
      bytes.push(curByte)
      curByte = 0
      curByte |= (idx << iD) & 0xff
    }

    curByte |= (idx << iD) & 0xff
  }
  bytes.push(curByte)

  // ── Numberboxes: 1 byte each ─────────────────────────────────────────────
  for (const nb of numboxes) {
    bytes.push(Math.max(0, Math.min(255, (rd[nb.defineName] ?? nb.default ?? 0) | 0)))
  }

  return btoa(String.fromCharCode(...bytes))
}

/**
 * Decode a Base64 settings string → randoDefines object.
 * Returns null if the string is invalid or was generated for a different logic file.
 *
 * @param {string} b64        - Base64 string (must start with "NlgC")
 * @param {object} directives - output of parseDirectives(rawText)
 * @returns {object|null}
 */
export function decodeSettingsString(b64, directives) {
  if (!b64 || !b64.startsWith('NlgC')) return null

  let raw
  try { raw = atob(b64) } catch { return null }
  const bytes = Uint8Array.from(raw, c => c.charCodeAt(0))
  if (bytes.length < 8) return null

  const crc = (bytes[3] | (bytes[4] << 8) | (bytes[5] << 16) | (bytes[6] << 24)) >>> 0
  if (crc !== computeOptionsCrc32(directives)) return null

  const sorted    = _sorted(directives)
  const flags     = sorted.filter(o => o.type === 'flag')
  const dropdowns = sorted.filter(o => o.type === 'dropdown')
  const numboxes  = sorted.filter(o => o.type === 'numberbox')

  const rd = {}
  let byteIdx = 7
  let curByte = bytes[byteIdx]
  let iBit    = 7

  // ── Flags ─────────────────────────────────────────────────────────────────
  for (let fi = 0; fi < flags.length; fi++) {
    if (iBit < 0) { iBit = 7; curByte = bytes[++byteIdx] }
    rd[flags[fi].defineName] = ((curByte >> iBit) & 1) === 1
    iBit--
  }

  // Advance past the flags byte (or partial byte) — mirrors encode's bytes.push after flags loop
  curByte = bytes[++byteIdx]
  let iD = 8

  // ── Dropdowns ─────────────────────────────────────────────────────────────
  for (const dd of dropdowns) {
    const { mask, bitCount } = _bitInfo(dd.options.length)
    let optIdx = 0
    iD -= bitCount

    if (iD < 0) {
      iD += 8
      optIdx |= (curByte << (8 - iD)) & mask
      curByte = bytes[++byteIdx]
    }

    optIdx |= (curByte >> iD) & mask

    const opt = dd.options[optIdx]
    rd[dd.defineName] = opt ? opt.defineName : (dd.defaultValue ?? '')
  }

  // ── Numberboxes ───────────────────────────────────────────────────────────
  for (const nb of numboxes) {
    curByte = bytes[++byteIdx]
    if (curByte === undefined) break
    rd[nb.defineName] = curByte
  }

  return rd
}
