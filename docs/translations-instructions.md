# Translations instructions

Langues supportées : **Français (`fr`)** et **Portugais brésilien (`pt`)**.
La documentation source est toujours rédigée en anglais. Les traductions sont générées via OpenRouter (modèle `deepseek/deepseek-v4-pro`) à partir du script `scripts/translate.mjs`.

---

## Commandes

Toutes les commandes se lancent depuis la racine du projet docs.

```bash
# Prévisualiser une traduction (appelle l'API mais n'écrit rien)
node scripts/translate.mjs --lang fr --file basic/ai-chat.mdx --dry-run

# Traduire une page précise
node scripts/translate.mjs --lang fr --file basic/ai-chat.mdx

# Traduire plusieurs pages
node scripts/translate.mjs --lang fr --file basic/ai-chat.mdx --file basic/analytics.mdx

# Re-traduire une page déjà traduite (après mise à jour de l'anglais)
node scripts/translate.mjs --lang fr --file basic/ai-chat.mdx --force

# Tout traduire en français (~37 pages, compter 10-15 min)
node scripts/translate.mjs --lang fr

# Tout traduire en portugais
node scripts/translate.mjs --lang pt
```

L'argument `--file` accepte le chemin avec ou sans `.mdx` :
```bash
node scripts/translate.mjs --lang fr --file basic/ai-chat
node scripts/translate.mjs --lang fr --file basic/ai-chat.mdx  # identique
```

---

## Ce qui se passe automatiquement après chaque run (hors dry-run)

1. Le fichier traduit est écrit dans `fr/<chemin>.mdx` ou `pt/<chemin>.mdx`
2. La section `navigation.languages` de `docs.json` est mise à jour pour cette langue — seules les pages dont la traduction existe apparaissent dans la nav
3. Le tableau `redirects` de `docs.json` est recalculé : les pages non encore traduites ont un redirect `/fr/<page>` → `/<page>` (anglais), et les redirects des pages nouvellement traduites sont supprimés

---

## Fallback pour les pages non traduites

Mintlify ne gère pas de fallback automatique. La stratégie choisie : **redirect vers l'équivalent anglais**.

Tant qu'une page n'est pas traduite, un redirect est inscrit dans `docs.json` :
```json
{ "source": "/fr/start/sources", "destination": "/start/sources" }
```
Une fois la page traduite, ce redirect disparaît et la page apparaît dans la navigation française.

---

## Ajouter une nouvelle langue

1. Ajouter la langue dans `LANGUAGE_NAMES` et `GROUP_LABELS` dans `scripts/translate.mjs`
2. Ajouter une entrée vide dans `navigation.languages` de `docs.json` :
   ```json
   { "language": "es", "groups": [] }
   ```
3. Lancer `node scripts/translate.mjs --lang es`

---

## Ajouter une nouvelle page anglaise

1. Créer la page `.mdx` et l'ajouter dans `navigation.languages[0].groups` (l'entrée `"en"`) de `docs.json`
2. C'est tout — le script détecte automatiquement les nouvelles pages depuis `docs.json` à chaque exécution. La prochaine run ajoutera les redirects pour cette page et la traduira si demandé.

---

## Structure des fichiers générés

```
docs/
├── docs.json              ← navigation + redirects (géré par le script)
├── fr/                    ← traductions françaises
│   ├── index.mdx
│   ├── start/
│   │   ├── sources.mdx
│   │   └── ...
│   ├── basic/
│   └── ...
├── pt/                    ← traductions portugaises
│   └── ...
└── scripts/
    └── translate.mjs      ← script de traduction
```

---

## Clé API

La clé OpenRouter est stockée dans `.env.local` (jamais commitée) :
```
OPENROUTER_TRANSLATION_KEY=sk-or-...
```
