# components/ItemGrid.vue

Grille d'items du tracker : clic gauche/droit pour faire progresser chaque item, avec filtrage des codes selon les settings de fusion et de donjon.

---

## Rôle

Rend une grille de cellules 28×28 à partir de lignes de codes d'items. Chaque code est résolu vers une définition (`defsMap`) qui porte son `type` :

- **`toggle`** — actif/inactif.
- **`progressive`** — étapes ordonnées (`stages`), avec ou sans bouclage (`loop`).
- **`consumable`** — quantité `min`/`max`, incrément par multiplicateur (keychain / pack de kinstones).
- **`auto_count`** — compteur dérivé d'autres codes (`auto_count_codes`), lecture seule.
- **`composite_toggle`** — deux items indépendants (gauche/droite), image choisie selon leur état.
- **`toggle_badged`** — item de base surmonté d'un badge cliquable séparément.

Clic gauche = avancer (`onLeftClick`), clic droit = reculer / basculer le badge (`onRightClick`). Les cellules affichent l'image résolue (`cellImg`), un badge de compte (`countBadge`) ou un placeholder de repli.

Source des lignes : la prop `rows` si fournie, sinon `tracker.json` (`shared_item_grid.rows`), avec `beta` retiré et injection optionnelle de `ud_cm`.

---

## Props

| Prop | Type | Rôle |
|------|------|------|
| `rows` | Array (défaut `null`) | Lignes de codes à afficher ; si absent, utilise la grille de `tracker.json` |

---

## Computed

| Nom | Rôle |
|-----|------|
| `defaultRows` | Grille de base (`_baseRows`) avec injection de `ud_cm` dans la dernière cellule vide de la ligne `dws_cm` si compass/map universel |
| `gridRows` | `props.rows ?? defaultRows` — la grille effectivement rendue |
| `hiddenCodes` | `Set` des codes masqués selon les settings de fusion / progression épée / items universels de donjon |

---

## Règles de filtrage (`hiddenCodes`)

Calculées depuis `randoDefines` (settingsStore) :

- **Fusions kinstone** (gold/red/blue/green) : `OPEN_*` et `NO_*` masquent toutes les variantes de la couleur ; `COMBINED_*` masque toutes sauf la première (regroupées sur un seul code).
- **Progression épée** : `YES_SWORD_PROG` (défaut `true`) masque les épées individuelles (`smithsword`, `greensword`, `redsword`, `bluesword`, `foursword`) et n'affiche que l'épée progressive ; sinon masque `sword0`.
- **Items universels de donjon** : `SMALL_KEYS_UNIVERSAL`, `BIG_KEYS_UNIVERSAL`, `COMPASS_UNIVERSAL`/`MAP_UNIVERSAL` masquent respectivement les petites clés / grandes clés / boussoles-cartes par donjon. Si aucun n'est universel, masque au contraire le code agrégé `universal_dungeons`.

`defaultRows` complète ce filtrage en injectant `ud_cm` (item boussole/carte universel) quand compass ou map est en mode universel.

---

## Fonctions

**Accès à l'état**
- `getVal(code, init)` / `setVal(code, v)` — lecture/écriture dans `store.manualItems`.

**Progression et quantités**
- `onLeftClick(def)` / `onRightClick(def)` — dispatch selon `def.type` (avancer vs reculer/basculer).
- `stepProgressive(def, dir, forceLoop)` — avance/recule dans `stages`, avec bouclage (`loop`) et gestion de `allow_disabled`.
- `stepConsumable(def, dir)` — incrémente/décrémente par `getConsumableMultiplier`, borné par `min`/`max`.
- `getConsumableMultiplier(code)` — lit le define de multiplicateur associé (`CONSUMABLE_MULTIPLIER_DEFINE`) ; `1` si absent ou valeur `MAX`.
- `clickBadgedBase(def)` — fait progresser l'item de base d'un `toggle_badged` selon son propre type.

**Affichage**
- `cellImg(def)` — image à afficher selon le type et l'état courant.
- `autoCount(def)` — nombre de `auto_count_codes` actifs.
- `isActive(def)` — cellule allumée (`.has-item`).
- `isBadgeActive(def)` — badge actif d'un `toggle_badged`.
- `countBadge(def)` — nombre affiché en surimpression (consommable ou auto-count), sinon `null`.
- `isCountMax(def)` — quantité au maximum (colore le badge).

---

## Stores utilisés

- **stateStore** (`store`) — `manualItems` (état des items cochés manuellement).
- **settingsStore** — `randoDefines` (via `storeToRefs`) pour le filtrage et les multiplicateurs.

Données statiques : `items_spec.json` (définitions d'items) et `SubModule/.../layouts/tracker.json` (grille canonique).
