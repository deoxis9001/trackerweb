# components/FaqPanel.vue

Popup d'aide / FAQ : liens vers le dépôt GitHub et la dernière release, et téléchargement du connecteur BizHawk.

---

## Rôle

Affiche des sections d'aide traduites (`useLocale`) : liens externes (dépôt, dernière release), téléchargement du connecteur Lua BizHawk, et une note. Bouton ✕ pour fermer (`store.showFaq = false`).

---

## État / refs

| Nom | Description |
|-----|-------------|
| `CONNECTOR_URL` | URL locale du script `bizhawk_tracker.lua` (téléchargement) |
| `REPO_URL` | Lien GitHub du dépôt |
| `RELEASES_URL` | Lien vers la dernière release |

---

## Stores utilisés

- `stateStore` — `showFaq` (fermeture du panneau).
- `useLocale` — traductions (`t`) des titres/textes de la FAQ.
