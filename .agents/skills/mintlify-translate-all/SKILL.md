---
name: mintlify-translate-all
description: Translate all missing Mintlify documentation pages into all supported languages (French and Portuguese) in one go. Use when asked to translate everything, sync all languages, or fill all translation gaps.
license: MIT
compatibility: Requires Node.js and a valid OPENROUTER_TRANSLATION_KEY in .env.local
metadata:
  author: attlas
  version: "1.0"
---

# Translate all missing pages (fr + pt)

**Always read `docs/translations-instructions.md` first** for the full workflow, script options, and what happens to `docs.json` after each run.

## Quick reference

```bash
# Translate all missing pages in all languages (~74 pages total, 20–30 min)
node scripts/translate.mjs --lang fr
node scripts/translate.mjs --lang pt

# Translate a specific file into both languages
node scripts/translate.mjs --lang fr --file basic/ai-chat.mdx
node scripts/translate.mjs --lang pt --file basic/ai-chat.mdx

# Force re-translate everything (after bulk English source updates)
node scripts/translate.mjs --lang fr --force
node scripts/translate.mjs --lang pt --force
```

Run all commands from the project root (where `docs.json` and `scripts/` live).

## What happens after each run

1. Translated files are written to `fr/<path>.mdx` and `pt/<path>.mdx`
2. `docs.json` `navigation.languages` sections are updated for each language
3. `docs.json` `redirects` are recalculated — untranslated pages get fallback redirects to English; translated pages lose their redirects

## Workflow

1. Run French translations first, wait for completion
2. Run Portuguese translations, wait for completion
3. Verify output files in `fr/` and `pt/`
4. Check `docs.json` was updated for both languages
5. Report totals: how many pages translated per language, any errors
