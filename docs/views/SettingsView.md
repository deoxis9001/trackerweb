# views/SettingsView.vue

Page de settings à onglets : réglages web du tracker, réglages de logique du randomizer (générés depuis les directives du fichier `.logic`), presets et settings string.

---

## Rôle

Barre d'onglets en haut :

- **WebSetting** — réglages propres au tracker (voir plus bas).
- **Out of Logic** — vue unique regroupant le groupe `Require Tricks` de la logique, en mode oui/non (`yes-no-mode`).
- **Onglets de logique** (dynamiques) — un onglet par `tab` présent dans les directives du fichier `.logic` (hors `Cosmetics`), rendus via `LogicSettingsTab`.

Une `legend-bar` affiche la légende des couleurs (accessible / out of logic / inaccessible).

L'onglet **WebSetting** contient les sections (`card`) :

- **Logic Source** — choix de la source de logique (`default_logic`).
- **Presets** — boutons de presets bundlés (`presets.json`) + import d'un fichier `.yaml`.
- **Settings String** — champ read-only avec l'encodage courant (bouton Copy) + champ d'import (bouton Import, `Enter` valide).
- **Tracker Display** — police, langue, `showInaccessible`, `autoTabDungeons` (non/overview/etage), `autoTabOverworld` (non/oui).

---

## État / refs

| Ref | Rôle |
|-----|------|
| `activeTab` | Onglet actif (`'WebSetting'`, `'out_of_logic'` ou nom d'onglet de logique) |
| `settingsString` | Settings string encodé, recalculé par watcher |
| `importInput` | Texte saisi pour l'import de settings string |
| `importError` | `'invalid'` si le décodage échoue |
| `activePreset` | Nom du preset bundlé appliqué (surbrillance) |
| `yamlFileInput` | Ref sur l'`<input type=file>` caché pour l'import YAML |

---

## Computed

| Computed | Rôle |
|----------|------|
| `currentLogicText` | Texte de logique courant : custom si `logicSource==='custom'`, sinon `defaultLogicRaw` |
| `allDirectives` | Directives parsées (`parseDirectives`) du texte courant |
| `isLogicTab` | Vrai si l'onglet actif n'est pas `WebSetting` |
| `isOutOfLogic` | Vrai si l'onglet actif est `out_of_logic` |
| `logicTabsData` | Directives regroupées par `tab` puis `group` (hors `Cosmetics`) |
| `activeTabGroups` | Groupes de l'onglet de logique actif |
| `outOfLogicGroups` | Groupe unique `Require Tricks` pour l'onglet Out of Logic |

---

## Fonctions

| Fonction | Rôle |
|----------|------|
| `initRandoDefines()` | Initialise `s.randoDefines` avec les valeurs par défaut des flags/dropdowns/numberboxes ; appelée par un watcher sur `logicSource` (`immediate`) |
| `importSettingsString()` | Décode `importInput` via `decodeSettingsString` et applique le résultat à `s.randoDefines` (sinon `importError='invalid'`) |
| `copySettingsString()` | Copie `settingsString` dans le presse-papiers |
| `applyBundledPreset(preset)` | Applique un preset bundlé via `applyPreset` et mémorise son nom |
| `handleYamlImport(event)` | Lit le fichier `.yaml`/`.yml`, parse via `js-yaml` et applique `parsed.settings` |

Watchers : sur `logicSource` (→ `initRandoDefines`) et sur `[allDirectives, randoDefines]` (→ ré-encode `settingsString`).

---

## Store / composables utilisés

- **settingsStore** (`s`) — `logicSource`, `customLogicText`, `randoDefines`, `showInaccessible`, `autoTabDungeons`, `autoTabOverworld` ; `TRICKS`.
- **useLocale** — `t`, `locale`, `availableLocales`.
- **useFont** — `selectedFont`, `fonts`.
