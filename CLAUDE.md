# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Règles projet

@prompts/claude.md

## Prompts système de Claude Code

Collection de référence des prompts système de Claude Code (635 fichiers, en anglais), rapatriée localement dans `prompts/`.
Index commenté en français : [prompts/README.md](prompts/README.md).

Chaque dossier est trié par utilité pour ce projet : `<type>/*.md` = utile, `<type>/passable/` = utile un jour, `<type>/delete/` = hors sujet ici.

| Dossier | Contenu | Utile | Passable | Delete |
|---|---|---|---|---|
| [prompts/system-prompt/](prompts/system-prompt/) | Blocs du prompt système principal | 77 | 20 | 43 |
| [prompts/tool-description/](prompts/tool-description/) | Descriptions des outils intégrés | 72 | 26 | 54 |
| [prompts/tool-parameter/](prompts/tool-parameter/) | Descriptions de paramètres d'outils | 3 | 2 | 2 |
| [prompts/data/](prompts/data/) | Données et schémas injectés dans le contexte | 1 | 26 | 79 |
| [prompts/skill/](prompts/skill/) | Prompts des skills intégrés | 32 | 36 | 16 |
| [prompts/system-reminder/](prompts/system-reminder/) | Textes des `<system-reminder>` | 51 | 10 | 20 |
| [prompts/agent-prompt/](prompts/agent-prompt/) | Prompts des sous-agents intégrés | 44 | 15 | 6 |

> `prompts/` est **local et non versionné** (voir [.gitignore](.gitignore)) : le dossier n'est ni commité ni publié. Sur un clone frais du dépôt, l'import `@prompts/claude.md` et les liens ci-dessus ne résolvent rien tant que le dossier n'a pas été recréé.
