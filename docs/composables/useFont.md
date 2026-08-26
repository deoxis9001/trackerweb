# composables/useFont.js

Composable de sélection de police. Découvre les fontes de `src/fonts/`, applique la police choisie via une balise `<style>` injectée (`@font-face`), et persiste le choix.

---

## Chargement des polices

Glob eager sur `../fonts/*.{otf,ttf,woff,woff2}` (avec `query: '?url'`) : chaque fichier fournit son URL packagée par Vite.

## Exports

### `FONTS`

Tableau des polices disponibles. Commence par l'entrée `Default` (police système, valeur nulle), puis une entrée par fichier trouvé.

| Champ | Description |
|-------|-------------|
| `name` | Nom affiché (nom de fichier sans extension) |
| `value` | Identifiant de la police, `null` pour Default |
| `url` | URL du fichier de police, `null` pour Default |
| `ext` | Extension (`otf` / `ttf` / `woff` / `woff2`), `null` pour Default |

### `useFont()`

Retourne `{ selectedFont, fonts }`.

| Retour | Type | Description |
|--------|------|-------------|
| `selectedFont` | `ref<string\|null>` | Police courante (mutable, persistée) |
| `fonts` | `Array` | Référence vers `FONTS` |

---

## Fonctionnement interne

- `selectedFont` est un `ref` module-level, initialisé depuis `localStorage['tmc_font']` si la valeur correspond à une police connue, sinon `null`.
- Un `watch` (`immediate: true`) persiste le choix et appelle `applyFont()` à chaque changement.
- `applyFont(fontValue)` injecte dans un unique `<style id="tmc-custom-font">` une règle `@font-face` (avec le format déduit de l'extension via `FORMAT`) et force la police sur `body, body *:not(.emoji-flag)` en `!important`. Une valeur nulle vide la balise (retour à la police par défaut). L'exclusion `.emoji-flag` préserve l'affichage des drapeaux emoji.
