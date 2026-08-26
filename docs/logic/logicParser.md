# logic/logicParser.js

Préprocesseur et compilateur runtime du fichier `default.logic` du randomizer.

Transforme le texte brut du `.logic` (directives `!define`/`!ifdef`, substitutions backtick, lignes de locations) en fonctions de règles prêtes à appeler `(inv, settings) => boolean`. C'est le pont entre les settings du tracker et l'évaluation d'accessibilité, sans passer par le moteur Lua.

---

## Constantes

### `_IS_DEFINE`

```js
const _IS_DEFINE = /^[A-Z0-9][A-Z0-9_]+$/
```

Reconnaît un nom de define : majuscules/chiffres/underscores, au moins 2 caractères (couvre `ALL_CAPS_SNAKE` et les noms préfixés d'un chiffre comme `5SWORD`). Sert à localiser le `DEFINE_NAME` dans une directive.

### `_KEPT_TYPES`

Ensemble des types de location conservés par `parseLocations` : `Helper`, `Any`, `Dungeon`, `Major`, `Minor`, `Nice`, `Unshuffled`, `UnshuffledPrize`, `DungeonPrize`. Les autres types sont ignorés.

### `_SKIP_PREFIXES`

Préfixes de nom écartés (entrées de pool internes, pas des locations trackables) : `Items.`, `Dummy_`, `Shared`, `FakeDojo`.

### `_ALWAYS_FALSE`

Helpers-sentinelles toujours faux (gates inaccessibles ou ressources infinies) : `Helpers.Hundo`, `Helpers.Inaccessible`, `Helpers.InfiniteMoney`.

### `ITEM_MAP`

Table statique qui mappe les noms d'items du rando (`SmithSword`, `Bow`, `SmallKey.0x18`, `Kinstone.Red`, …) vers `{ count: (inv) => number }`, où `inv` est l'inventaire (nom rando → quantité). Les items absents de la table retombent sur `Infinity` (fail-open : non tracké = ne bloque pas). Cas particuliers : les bouteilles (`Bottle`, `Bottle1..3`, `Bottle.0xNN`) comptent les slots de bouteilles remplis via `_bottleCount`, et `Kinstone.Red` somme les trois variantes E/>/W.

---

## Fonctions internes

### `_applySubs(text, substitutions)`

Remplace les tokens backtick `` `NAME` `` par la valeur correspondante de la map `substitutions`. Un token absent de la map est laissé tel quel.

### `_cnt(apName)` / `_bottleCount(inv)`

Helpers de construction d'`ITEM_MAP`. `_cnt` renvoie `{ count: inv => inv[apName] || 0 }`. `_bottleCount` compte les slots `Bottle 1..4` remplis (1–4).

### `_itemCount(name, inv)` / `_itemCheck(name, min, inv)`

`_itemCount` renvoie le nombre d'exemplaires de `name` dans l'inventaire (via `ITEM_MAP`, fallback `_bottleCount` pour `Bottle.0x…`, sinon `Infinity`). `_itemCheck` renvoie `true` si `_itemCount(...) >= min`.

### `splitTopLevel(str)`

Découpe `str` sur les virgules à profondeur de parenthèses 0. Trim et supprime les segments vides.

### `_compileTerm(term, helperMap)`

Compile un terme unique d'expression logique en fonction `(inv, settings) => boolean`. Gère les sous-expressions parenthésées (`|` OR, `&` AND, `+` compteur pondéré, parenthèses nues = AND), les sentinelles toujours-fausses, les références `Helpers.`/`Locations.` (lookup récursif cycle-safe), les références `Items.X[:N]`, et les tokens non résolus (fail-open `() => true`).

### `_mergeRandoDefines(d, rd)`

Fusionne les defines contrôlés par l'utilisateur (`randoDefines`) par-dessus les defaults rando dans l'objet `d`. Pour un dropdown surchargé, efface l'ancienne valeur-option (`old=true`) avant d'appliquer la nouvelle (`k=v` et `v=true`).

---

## Fonctions exportées

### `preprocessLogic(rawText, defines)`

Pré-traite `default.logic` avec les defines actifs et renvoie les lignes de contenu non-directives.

Gère : `!define` / `!eventdefine` / `!undefine`, les blocs conditionnels `!ifdef` / `!ifndef` / `!else` / `!endif`, la substitution backtick `` `NAME` ``, le strip des commentaires `#`, et ignore toutes les autres directives (`!flag`, `!dropdown`, `!numberbox`, …).

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `rawText` | `string` | Contenu brut de `default.logic` |
| `defines` | `Object` | `{ [NAME]: string\|true }` — defines de settings actifs |

**Retourne** `string[]` — lignes de contenu traitées, prêtes pour `parseLocations`.

**Détails d'implémentation**

- Une pile de frames `{ active, seenElse }` gère l'imbrication des conditionnels ; `active` intègre déjà l'activation du parent.
- `substitutions` est pré-remplie depuis `defines` (valeurs non-`true`) pour que les valeurs de numberbox soient disponibles immédiatement en substitution backtick.
- `!define - `NAME`` résout la valeur de `NAME` et l'active comme define (`activeDefines[value] = true`) pour que les `!ifdef` suivants fonctionnent.

### `parseDirectives(rawText)`

Parse le schéma des directives `!flag` / `!dropdown` / `!numberbox` depuis le texte brut. Utilisé par `settingsString.js` pour construire le panneau de settings et calculer le CRC.

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `rawText` | `string` | Contenu brut de `default.logic` |

**Retourne** `{ flags, dropdowns, numberboxes, directives }` — trois tableaux typés plus `directives` (tous en ordre de fichier). Chaque entrée porte `defineName`, `label`, `tab`, `optionType` (`"Setting"` / `"Cosmetic"`), `group`, et selon le type : `defaultValue` (flag/dropdown), `default`/`min`/`max` (numberbox), `options: [{ label, defineName }]` (dropdown).

**Détails** : le split se fait sur `-` simple puis trim (miroir exact de `DirectiveParser.SplitDirective()` en C#, pour gérer les descriptions vides). Le `DEFINE_NAME` est le premier token reconnu par `_IS_DEFINE`. Les dropdowns valident `length % 3 === 2 && length >= 11` (au moins une option).

### `parseLocations(lines)`

Parse les lignes pré-traitées en descripteurs de location/helper.

Format de ligne : `` Name[`SUFFIX`][; Type; Address; LogicStr[; Item]] ``.

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `lines` | `string[]` | Sortie de `preprocessLogic()` |

**Retourne** `{ name, type, logicStr }[]`.

**Détails**

- Format compact : si le champ type ressemble à une adresse/define (`_ADDR_PAT`), le vrai type est le dernier token backtick du champ nom.
- Type `Inaccessible` : conservé avec `logicStr: ''` pour que `parseLogic` le compile en `() => false` au lieu de fail-open.
- Filtrage : seuls les types de `_KEPT_TYPES` (ou un type backtick) sont conservés ; les noms préfixés `_SKIP_PREFIXES` sont écartés. Le nom est nettoyé de ses suffixes backtick et de son suffixe d'ID de donjon `:`.
- `logicStr` = 4e champ (index 3) ; vide = toujours accessible.

### `compileExpr(logicStr, helperMap)`

Compile une chaîne d'expression logique en fonction `(inv, settings) => boolean`.

**Grammaire**

| Forme | Sémantique |
|-------|-----------|
| (vide) | toujours `true` |
| `a, b, c` | AND (virgules racine) |
| `(\| a, b, …)` | OR |
| `(& a, b, …)` | AND explicite |
| `(+ N, x:w, …)` | compteur pondéré ≥ N |
| `Items.X[:N]` | l'inventaire contient ≥ N de X |
| `Helpers.X` | lookup récursif (cycle-safe) |
| `` `TOKEN` `` | substitution non résolue → fail-open (`true`) |

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `logicStr` | `string` | Expression logique pré-traitée |
| `helperMap` | `Map<string,fn>` | Nom → fonction helper compilée |

**Retourne** `(inv, settings) => boolean`. Une chaîne vide renvoie `() => true`.

**Compteur pondéré `(+ N, …)`** : le seuil `N` retombe à 4 si non résolu (couvre `ELEMENT_COUNT`). Chaque contributeur ajoute au total : un `Items.X:K` ajoute `count × weight`, un `Helpers.X:K` ajoute `K` si vrai (sinon 0), un helper booléen ajoute 0 ou 1. Renvoie `true` dès que la somme atteint le seuil.

**Cycle-safe** : un ensemble `_evaluating` piste les helpers en cours d'évaluation ; une référence cyclique est traitée comme inaccessible (`false`), un helper inconnu fail-open (`true`).

### `settingsToDefines(settings)`

Convertit l'état du `settingsStore` en objet `defines` attendu par `preprocessLogic()`.

Pour chaque setting enum, l'option sélectionnée devient `defines['SETTING'] = 'OPTION'` **et** `defines['OPTION'] = true`. Pour chaque flag booléen, le define est ajouté quand vrai.

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `settings` | `Object` | Snapshot `exportSettings()` ou `$state` du store |

**Retourne** `Object` — `{ [DEFINE_NAME]: string\|true }`.

**Détails notables**

- `tricks` peut être un `Set` (store live) ou un `Array` (snapshot) ; le helper `hasTrick` gère les deux.
- Beaucoup de defines sont figés côté rando (crests Lake/Town toujours vrais, `HEART_RANDO` toujours vrai, capacités de départ à 0, multiplicateurs kinstone/clé à 1, kinstones de départ à 0) — ils servent surtout à résoudre des références backtick qui resteraient sinon non résolues.
- Les warps de donjon (`warpDWS` etc.) encodent bleu (≥1) et rouge (≥2) en deux flags.
- Si `randoDefines` est présent et `logicSource` vaut `default_logic` ou `custom`, `_mergeRandoDefines` applique les overrides utilisateur par-dessus les defaults rando.

### `parseLogic(rawText, settings)`

Assemblage complet : parse et compile un fichier `.logic` en règles appelables. Point d'entrée principal du module.

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `rawText` | `string` | Contenu brut du `.logic` |
| `settings` | `Object` | État du `settingsStore` (ou snapshot) |

**Retourne** `{ LOCATION_RULES, HELPERS, DIRECTIVES }`

| Clé | Type | Description |
|-----|------|-------------|
| `LOCATION_RULES` | `Object` | Nom de location OU `Helpers.XFusion` → fonction de règle. Les entrées `Inaccessible` sont `() => false`. |
| `HELPERS` | `Map<string,fn>` | Toutes les entrées `Helper` |
| `DIRECTIVES` | `Object` | `{ flags, dropdowns, numberboxes }` de `parseDirectives` |

**Pipeline** : `settingsToDefines` → `preprocessLogic` → `parseDirectives` (sur le brut) → `parseLocations` → passe 1 (build `helperMap`, forward-refs OK) → passe 2 (compile `LOCATION_RULES`, helpers aussi indexés sous `Helpers.Name`).

**Mémoïsation** : le dernier appel est mis en cache (`rawText` + clé JSON des defines) ; mêmes entrées → même référence d'objet retournée.
