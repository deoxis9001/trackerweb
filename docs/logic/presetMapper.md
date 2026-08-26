# logic/presetMapper.js

Mappe un preset du randomizer (objet `settings` de `presets.json`) vers les champs du `settingsStore`.

Fichier **auto-généré** par `scripts/gen_preset_mapper.py` — ne pas éditer à la main. Il contient des tables de correspondance define-du-preset → champ-du-store, puis une seule fonction publique qui les applique.

---

## Constantes (tables de mapping)

### `_ENUM`

`{ DEFINE_PRESET: [champStore, { VALEUR_PRESET: valeurStore, … }] }`. Chaque entrée traduit une option enum du preset (ex. `MAP_SETTING`, `SHUFFLE_ELEMENTS`, `*_FUSION_SETTING`, `BIGGORON_SETTING`, armes `BOMBWEAPON`/`BOWWEAPON`/…) vers un champ du store et sa valeur cible. Plusieurs valeurs de preset peuvent pointer vers la même valeur store (ex. `MAP_STANDARD` et `MAP_REGION` → `'own_dungeon'`).

### `_BOOL`

`{ DEFINE_PRESET: champStore }`. Flags booléens directs (ex. `RUPEEMANIA` → `rupeesanity`, `TRAPS` → `trapsEnabled`, `YES_SWORD_PROG` → `progressiveSword`).

### `_NUM`

`{ DEFINE_PRESET: [champStore, fn] }`. Le define du preset est passé (en `String`) à `fn` qui renvoie la valeur numérique du store (ex. `SWORD_SETTING` → `pedSwords` via `parseInt`, `GOLD1MULTIPLIER` → `cloudKinstoneMultiplier` avec cas spécial `GOLD1MAX` → 9).

### `_WARP`

Tableau `[defineBlue, defineRed, champStore]`. Chaque donjon encode ses deux warps en un entier : `(blue?1:0) + (red?2:0)`.

### `_TRICK`

`{ DEFINE_PRESET: [nomTrick, Set(valeursActivantes) ] }`. Si la valeur du preset est dans le `Set`, le trick est ajouté à `store.tricks`, sinon retiré.

---

## Fonctions exportées

### `applyPreset(presetSettings, store)`

Applique l'objet `settings` d'un preset au `settingsStore`.

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `presetSettings` | `Object` | `preset.settings` issu de `presets.json` |
| `store` | `Object` | Instance `useSettingsStore()` |

**Comportement** : parcourt chaque table dans l'ordre.

- `_ENUM` : si la clé preset est présente et mappée, écrit `store[field] = map[valeur]`.
- `_BOOL` : `store[field] = Boolean(valeur)`.
- `_NUM` : `store[field] = fn(String(valeur))`.
- `_WARP` : si le define bleu ou rouge est présent, écrit l'entier combiné.
- `_TRICK` : construit un nouveau `Set` à partir de `store.tricks`, ajoute/retire chaque trick selon le preset, puis réassigne `store.tricks`.

Seules les clés présentes (`!= null`) dans `presetSettings` sont appliquées ; les autres champs du store restent inchangés.
