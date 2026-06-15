// EMO Tracker rule evaluation engine
// Ref: https://github.com/EmoTracker-Community/EmoTracker/wiki/Authoring-Locations-Accessibility-Logic

export const LEVEL_RANK = {
  none:             0,
  inspect:          1,
  'sequence-break': 2,
  partial:          3,
  normal:           4,
  cleared:          5,
}

function bestLevel(a, b) {
  return LEVEL_RANK[a] >= LEVEL_RANK[b] ? a : b
}

function worstLevel(a, b) {
  return LEVEL_RANK[a] <= LEVEL_RANK[b] ? a : b
}

// Evaluate one code token — handles [seq-break], $func|args, @location, code:N
function evaluateCode(token, provider) {
  token = token.trim()
  if (!token) return { count: 1, level: 'normal' }

  let seqBreak = false
  if (token.startsWith('[') && token.endsWith(']')) {
    seqBreak = true
    token = token.slice(1, -1).trim()
  }

  let count, level = 'normal'

  if (token.startsWith('$')) {
    const parts = token.slice(1).split('|')
    const result = provider.callFunction(parts[0], parts.slice(1))
    count = result?.count ?? 0
    level = result?.level ?? 'normal'
  } else if (token.startsWith('@')) {
    count = provider.locationReachable(token.slice(1)) ? 1 : 0
  } else {
    const colonIdx = token.lastIndexOf(':')
    const code = colonIdx >= 0 ? token.slice(0, colonIdx).trim() : token
    const min  = colonIdx >= 0 ? (parseInt(token.slice(colonIdx + 1)) || 1) : 1
    count = (provider.itemCount(code) >= min) ? 1 : 0
  }

  if (count === 0) {
    if (seqBreak) return { count: 1, level: 'sequence-break' }
    return { count: 0, level: 'none' }
  }
  return { count, level }
}

// Evaluate one rule string — comma = AND, {rule} = inspect cap
function evaluateRule(rule, provider) {
  rule = rule.trim()
  if (!rule) return { count: 1, level: 'normal' }

  let inspectCap = false
  if (rule.startsWith('{') && rule.endsWith('}')) {
    inspectCap = true
    rule = rule.slice(1, -1).trim()
  }

  const codes = rule.split(',').map(c => c.trim()).filter(Boolean)
  if (!codes.length) return { count: 1, level: inspectCap ? 'inspect' : 'normal' }

  let level = 'normal'
  for (const code of codes) {
    const r = evaluateCode(code, provider)
    if (r.count === 0) return { count: 0, level: 'none' }
    level = worstLevel(level, r.level)
  }

  if (inspectCap) level = worstLevel(level, 'inspect')
  return { count: 1, level }
}

// Evaluate an array of rules (OR — best result wins)
// provider: { itemCount(code), callFunction(name, args), locationReachable(name) }
export function evaluateRules(rules, provider) {
  if (!rules || rules.length === 0) return 'normal'
  let best = 'none'
  for (const rule of rules) {
    const r = evaluateRule(rule, provider)
    if (r.count > 0) {
      best = bestLevel(best, r.level)
      if (best === 'normal') break
    }
  }
  return best
}

// Compute location-level accessibility from its sections' individual levels
export function locationAccessibility(sections, getSectionLevel) {
  if (!sections?.length) return 'none'
  let hasAccessible = false
  let hasInaccessible = false
  let best = 'none'
  for (const section of sections) {
    const level = getSectionLevel(section)
    if (level === 'cleared') continue
    if (LEVEL_RANK[level] >= LEVEL_RANK['normal']) hasAccessible = true
    else hasInaccessible = true
    best = bestLevel(best, level)
  }
  if (hasAccessible && hasInaccessible) return 'partial'
  return best
}
