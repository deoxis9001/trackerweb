# App.vue

Composant racine : navbar, `RouterView`, modale de settings, popup FAQ et lien changelog.

---

## Rôle

- Rend `NavBar` (masquée sur la route `broadcast`) au-dessus du `RouterView`.
- Affiche via `Teleport to="body"` la modale settings (`SettingsView`) et le popup FAQ (`FaqPanel`) selon les flags du store.
- Lien flottant `changelog` (masqué sur la route broadcast).
- Ferme settings/FAQ sur la touche `Échap` (listener global monté/démonté).

---

## État / refs

| Nom | Description |
|-----|-------------|
| `isBroadcastRoute` | `computed` : `true` si `route.name === 'broadcast'` |

---

## Fonctions

#### `onKeydown(e)`
Sur `Escape`, ferme `store.showSettings` et `store.showFaq` s'ils sont ouverts. Enregistré sur `window` via `onMounted` / `onUnmounted`.

---

## Composants utilisés

- `NavBar`, `SettingsView`, `FaqPanel`, plus `RouterView` / `RouterLink`.

---

## Stores utilisés

- `stateStore` — `showSettings`, `showFaq`.
