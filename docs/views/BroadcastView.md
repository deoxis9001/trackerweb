# views/BroadcastView.vue

Vue broadcast pour OBS : affiche uniquement l'inventaire (`ItemGrid`) sur fond noir, dans un cadre fixe de 254×370 px.

---

## Rôle

- Charge le layout `standard_broadcast.json` du submodule `tmcrando_maptracker_deoxis` et en extrait les `rows` (les codes `'beta'` sont remplacés par `''`), passées en prop `rows` à `ItemGrid`.
- `onMounted` : force `document.body` en fond noir + `overflow: hidden` ; `onUnmounted` restaure les valeurs d'origine.
- Style : `.broadcast-root` fond noir, dimensions fixes 254×370 px, `ItemGrid` sans bordure droite.

---

## État

| Const | Rôle |
|-------|------|
| `broadcastRows` | Lignes d'items extraites du layout broadcast, nettoyées des codes `'beta'` |

---

## Composants enfants

`ItemGrid` (avec prop `rows`).
