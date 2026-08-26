# composables/useLocale.js

Composable d'internationalisation (i18n). Charge les traductions depuis `src/langue/`, gère la locale courante persistée et expose les fonctions de traduction.

---

## Chargement des traductions

Deux globs eager sur `src/langue/` :

- `../langue/*/general.json` → chaînes d'interface générales, une par langue.
- `../langue/*/*.json` → sous-fichiers par domaine (`items`, `locations`, `regions`, …), hors `general.json`.

Les codes de langue sont dérivés du nom de dossier et mis en majuscules (`fr` → `FR`).

| Structure | Contenu |
|-----------|---------|
| `LOCALES[code]` | Objet `general.json` de la langue |
| `LOCALE_META[code]` | `_meta` du `general.json` (`{ label, flag }`), ou `{ label: code, flag: '' }` par défaut |
| `LANG_SUBS[code][file]` | Sous-fichiers de traduction (ex. `LANG_SUBS.FR.items`) |

## Locale courante

La locale est un `ref` module-level partagé entre tous les appels à `useLocale()`.

- Locale par défaut : `EN` si disponible, sinon la première langue chargée, sinon `'EN'`.
- Initialisée depuis `localStorage['tmc_locale']` si la valeur existe et correspond à une langue chargée.
- Un `watch` persiste toute modification dans `localStorage`.

---

## API

### `useLocale()`

Retourne `{ locale, availableLocales, t, tItem, tLocation, tRegion }`.

| Retour | Type | Description |
|--------|------|-------------|
| `locale` | `ref<string>` | Code de langue courant (mutable, persisté) |
| `availableLocales` | `computed<Array>` | Liste `{ code, label, flag }` des langues disponibles |
| `t` | `function` | Traduction des chaînes d'interface |
| `tItem` | `function` | Traduction d'un nom d'item |
| `tLocation` | `function` | Traduction d'un nom de location |
| `tRegion` | `function` | Traduction d'un nom de région |

### `t(path, vars = {})`

Traduit une chaîne d'interface depuis `general.json` de la locale courante.

| Param | Type | Description |
|-------|------|-------------|
| `path` | `string` | Chemin pointé dans l'arbre (ex. `'settings.title'`) |
| `vars` | `object` | Variables interpolées dans les placeholders `{nom}` |

Résout `path` en descendant l'arbre clé par clé. Si le nœud final n'est pas une chaîne, retourne `path` tel quel (fallback). Les placeholders `{nom}` sont remplacés par `vars[nom]` ; une variable absente reste affichée sous la forme `{nom}`.

### `tItem(key, fallbackName)`

Traduit un nom d'item via `LANG_SUBS[locale].items`.

| Param | Type | Description |
|-------|------|-------------|
| `key` | `string` | Clé de l'item |
| `fallbackName` | `string` | Nom de secours si la clé est absente |

Fallback en cascade : traduction → `fallbackName` → `key`.

### `tLocation(key, fallbackName)`

Traduit un nom de location via `LANG_SUBS[locale].locations`. Même logique de fallback que `tItem`.

### `tRegion(key, fallbackName)`

Traduit un nom de région via `LANG_SUBS[locale].regions`. Même logique de fallback que `tItem`.
