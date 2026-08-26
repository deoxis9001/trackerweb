# logic/accessibility.js

Moteur d'évaluation des règles d'accessibilité EMO Tracker.

Référence : [EmoTracker Wiki — Authoring Locations Accessibility Logic](https://github.com/EmoTracker-Community/EmoTracker/wiki/Authoring-Locations-Accessibility-Logic)

---

## Constantes

### `LEVEL_RANK`

```js
export const LEVEL_RANK = {
  none:             0,
  inspect:          1,
  'sequence-break': 2,
  partial:          3,
  normal:           4,
  cleared:          5,
}
```

Ordre numérique des niveaux d'accessibilité. Utilisé pour comparer deux niveaux entre eux.

---

## Fonctions internes

### `bestLevel(a, b)`

Retourne le niveau le plus favorable (rank le plus élevé) entre `a` et `b`.

### `worstLevel(a, b)`

Retourne le niveau le moins favorable (rank le plus bas) entre `a` et `b`.

---

## Fonctions exportées

### `evaluateCode(token, provider)`

Évalue un token individuel d'une règle d'accès.

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `token` | `string` | Token à évaluer (voir formats ci-dessous) |
| `provider` | `object` | Provider (voir `makeProvider` dans itemProvider.js) |

**Formats de token supportés**

| Format | Comportement |
|--------|--------------|
| `[token]` | Sequence-break wrapper — si le token échoue, retourne `sequence-break` au lieu de `none` |
| `$FuncName\|arg` | Appelle `provider.callFunction(name, args)` — Lua Json_* function |
| `@LocationName` | Appelle `provider.locationReachable(name)` (toujours false dans l'implémentation actuelle) |
| `code:N` | Vérifie que `provider.itemCount(code) >= N` |
| `code` | Vérifie que `provider.itemCount(code) >= 1` |

**Retourne** `{ count: 0|1, level: string }`

---

### `evaluateRule(rule, provider)`

Évalue une règle AND (les tokens sont séparés par des virgules — tous doivent passer).

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `rule` | `string` | Chaîne de tokens séparés par `,` |
| `provider` | `object` | Provider |

**Syntaxe spéciale**

- `{rule}` — inspect cap : le niveau maximal retourné est `inspect`

**Retourne** `{ count: 0|1, level: string }` — `none` si un token échoue, sinon le pire niveau parmi tous les tokens.

---

### `evaluateRules(rules, provider)`

Évalue un tableau de règles OR (au moins une doit passer). C'est la fonction d'entrée principale.

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `rules` | `string[]` | Tableau de règles (`access_rules` d'une section) |
| `provider` | `object` | Provider |

**Retourne** `string` — meilleur niveau parmi toutes les règles qui passent, ou `'none'` si aucune ne passe. Si `rules` est vide ou null, retourne `'normal'` (accessible sans condition).

---

### `locationAccessibility(sections, getSectionLevel)`

Calcule le niveau d'accessibilité d'une location à partir des niveaux de ses sections.

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `sections` | `array` | Tableau de sections (objets EMO avec `item_count`) |
| `getSectionLevel` | `(section) => string` | Callback qui retourne le niveau d'une section |

**Logique**

- Si toutes les sections sont `cleared` → retourne `'cleared'`
- Si certaines sections sont accessibles ET d'autres inaccessibles → `'partial'`
- Sinon retourne le meilleur niveau des sections non-cleared

**Retourne** `string` — niveau d'accessibilité de la location entière.

**Mapping vers couleur pin**

| Niveau | `levelToPinStatus()` | Couleur |
|--------|---------------------|---------|
| `normal` | `accessible` | vert `#7ac038` |
| `sequence-break` / `partial` | `out_of_logic` | orange `#d4901a` |
| `cleared` | `checked` | gris `#606060` |
| tout le reste | `inaccessible` | rouge `#d82828` |
