# components/LogicSettingsTab.vue

Rendu générique d'un onglet de settings logique : parcourt des groupes de directives et affiche le contrôle adapté à chaque type (flag, dropdown, numberbox), avec un mode deux-boutons optionnel.

---

## Rôle

Composant contrôlé (`v-model`). Pour chaque `group` de `groups`, rend une carte titrée (`group.name`) contenant une ligne par directive (`group.directives`). Chaque ligne affiche un label (`dir.label` ou `dir.defineName`) et un contrôle choisi selon `dir.type` :

- **`flag`** — groupe de deux boutons `No` / `Yes` (valeur booléenne).
- **`dropdown`** — `<select>` listant `dir.options` (valeur = `opt.defineName`). En **mode deux-boutons** (`yesNoMode` et exactement 2 options), rendu à la place comme un groupe de deux boutons `opt-btn`.
- **`numberbox`** — `<input type="number">` borné par `dir.min` / `dir.max`.

Toute modification émet `update:modelValue` avec une copie du modèle où seul le `defineName` concerné change.

---

## Props

| Prop | Type | Rôle |
|------|------|------|
| `groups` | Array (requis) | Groupes de settings : `{ name, directives: [...] }` |
| `modelValue` | Object (défaut `{}`) | Map `defineName → valeur` courante |
| `yesNoMode` | Boolean (défaut `false`) | Rend les dropdowns à 2 options comme des boutons Yes/No au lieu d'un `<select>` |

Émet : `update:modelValue`.

---

## Types de contrôles gérés

Déterminés par `dir.type` (l'ordre du template fait que le cas deux-boutons prime) :

| `dir.type` | Condition | Contrôle rendu |
|------------|-----------|----------------|
| `dropdown` | `yesNoMode` **et** `options.length === 2` | Deux boutons `opt-btn` (options `[0]`/`[1]`) |
| `flag` | — | Deux boutons `No` / `Yes` |
| `dropdown` | sinon | `<select>` des `options` |
| `numberbox` | — | `<input type="number">` avec `min`/`max` |

---

## Fonctions

- **`get(dir)`** — valeur courante d'une directive : `modelValue[dir.defineName]` si défini, sinon la valeur par défaut selon le type (`defaultValue` pour flag/dropdown, `default` pour numberbox).
- **`set(defineName, val)`** — émet `update:modelValue` avec le modèle mis à jour (copie immuable, seule la clé ciblée change).

---

## Stores utilisés

Aucun. Composant purement présentiel, piloté par ses props et son `v-model`.
