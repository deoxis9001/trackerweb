# logic/settingsString.js

Encodeur/décodeur de la "Settings String" du randomizer — port JS de `MinifiedSettings.cs` + `OptionList.GetCrc32()`.

**Format** : `Base64( [0x36,0x58,0x02] + CRC32_LE(4 octets) + bits_flags + bits_dropdowns + octets_numberboxes )`. La chaîne commence toujours par `"NlgC"` (Base64 de l'en-tête 3 octets). Le CRC32 identifie le jeu d'options du fichier `.logic`, ce qui permet de rejeter au décodage une chaîne générée pour un autre fichier de logique.

---

## Constantes

### `_CRC32_TABLE`

Table de lookup CRC32 (IEEE 802.3, polynôme `0xedb88320`), construite une fois à l'import.

### `_CLASS` / `_TYPE`

`_CLASS` mappe le type de directive (`flag` / `dropdown` / `numberbox`) vers le nom de type C# complet (ex. `RandomizerCore.Randomizer.Logic.Options.LogicFlag`). `_TYPE = 'Setting'`. Ces chaînes entrent dans le calcul du CRC et doivent correspondre exactement au C#.

---

## Fonctions internes

### `_crc32(bytes)`

Calcule le CRC32 (IEEE 802.3) d'un tableau d'octets et le renvoie comme entier non signé 32 bits.

### `_utf8(s)`

Encode une chaîne en `Uint8Array` UTF-8 (via `TextEncoder`).

### `_nextPow2(n)` / `_bitInfo(count)`

`_nextPow2` arrondit à la puissance de 2 supérieure (≥ 2), miroir de `BitOperations.RoundUpToPowerOf2(max(2,n))`. `_bitInfo(count)` renvoie `{ mask, bitCount }` pour packer un dropdown à `count` options.

### `_sorted(directives)` / `_fileOrder(directives)`

Les deux ne gardent que les options `optionType === 'Setting'`. `_sorted` concatène flags + dropdowns + numberboxes puis trie par `defineName` en ordinal (miroir de `OnlyLogic().GetSorted()` en C#) — utilisé pour le packing des bits. `_fileOrder` garde l'ordre de fichier/parse — utilisé pour le CRC (le C# appelle `GetCrc32()` sur `OnlyLogic()` avant tri).

---

## Fonctions exportées

### `computeOptionsCrc32(directives)`

CRC32 qui empreinte le jeu d'options du fichier de logique. Miroir de `OptionList.GetCrc32()` appelé sur `OnlyLogic()` (ordre de fichier, non trié).

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `directives` | `object` | Sortie de `parseDirectives(rawText)` |

**Retourne** `number` — CRC32 non signé. Pour chaque option (ordre de fichier), concatène `defineName` + `"Setting"` + nom de classe C# en UTF-8, puis applique `_crc32` sur le buffer complet.

### `encodeSettingsString(directives, randoDefines)`

Encode un objet `randoDefines` en Settings String Base64 (commence par `"NlgC"`).

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `directives` | `object` | Sortie de `parseDirectives(rawText)` |
| `randoDefines` | `object` | `{ [defineName]: boolean\|string\|number }` |

**Retourne** `string` — chaîne Base64.

**Layout des octets**

- En-tête `0x36,0x58,0x02` puis les 4 octets du CRC en little-endian.
- **Flags** : 1 bit chacun, MSB d'abord ; bit à 1 si `randoDefines[defineName]` est vrai.
- **Dropdowns** : `bitCount` bits chacun (selon `_bitInfo`), packés à cheval sur les frontières d'octets ; l'index sélectionné est la position de l'option dans `dd.options` (défaut 0 si introuvable).
- **Numberboxes** : 1 octet chacun, valeur clampée `[0, 255]`.

### `decodeSettingsString(b64, directives)`

Décode une Settings String Base64 en objet `randoDefines`. Renvoie `null` si la chaîne est invalide ou générée pour un autre fichier de logique.

**Paramètres**

| Param | Type | Description |
|-------|------|-------------|
| `b64` | `string` | Chaîne Base64 (doit commencer par `"NlgC"`) |
| `directives` | `object` | Sortie de `parseDirectives(rawText)` |

**Retourne** `object|null` — `{ [defineName]: boolean\|string\|number }`, ou `null`.

**Validation / rejet** : renvoie `null` si `b64` est vide/ne commence pas par `"NlgC"`, si `atob` échoue, si moins de 8 octets, ou si le CRC lu (octets 3–6, LE) ne correspond pas à `computeOptionsCrc32(directives)`. Le décodage lit ensuite flags, dropdowns (chaque index redevient `options[idx].defineName`) et numberboxes en miroir exact de l'encodage.
