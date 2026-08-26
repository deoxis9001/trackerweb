# views/ChangelogView.vue

Affiche le changelog : rend `changelog.json` groupé par date, chaque commit avec son tag de type.

---

## Rôle

- Importe `changelog` depuis `../metadata/changelog.json` (généré par `gen_changelog.py`).
- Une `section` par entrée (`entry.date`), listant `entry.commits`.
- Chaque commit affiche un `commit-tag` coloré selon `commit.type` (`feat`, `fix`, `ci`, `chore`, `init`, `other`), le `commit.title`, et une sous-liste `commit.details` si présente.

Vue purement statique — aucun state, computed ni store.
