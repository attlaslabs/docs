Translate all missing Mintlify documentation pages to all supported languages (French and Portuguese).

Read `docs/translations-instructions.md` for full context on the translation workflow.

## Arguments

Parse `$ARGUMENTS` to determine what to run:

- **File path** (e.g. `basic/ai-chat`) → translate that specific file into both fr and pt
- **`--force`** → re-translate pages that already exist
- **No arguments** → translate all missing pages in both languages

## Steps

1. Confirm you are in the project root (where `scripts/translate.mjs` and `docs.json` live)
2. Run French translations first, then Portuguese:

**Specific file into all languages:**
```bash
node scripts/translate.mjs --lang fr --file <path> [--force]
node scripts/translate.mjs --lang pt --file <path> [--force]
```

**All missing pages in all languages (~74 pages total, 20–30 min):**
```bash
node scripts/translate.mjs --lang fr
node scripts/translate.mjs --lang pt
```

3. After both runs, report:
   - How many pages were translated per language
   - Whether `docs.json` navigation and redirects were updated
   - Any errors encountered
