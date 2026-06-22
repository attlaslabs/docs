---
name: mintlify-translate-pt
description: Translate Mintlify documentation pages to Brazilian Portuguese using the project translation script. Use when asked to translate docs to Portuguese, add pt translations, or update the pt/ folder.
license: MIT
compatibility: Requires Node.js and a valid OPENROUTER_TRANSLATION_KEY in .env.local
metadata:
  author: attlas
  version: "1.0"
---

# Translate docs to Brazilian Portuguese

**Always read `docs/translations-instructions.md` first** for the full workflow, script options, and what happens to `docs.json` after each run.

## Quick reference

```bash
# Translate a specific page
node scripts/translate.mjs --lang pt --file basic/ai-chat.mdx

# Translate multiple pages
node scripts/translate.mjs --lang pt --file basic/ai-chat.mdx --file basic/analytics.mdx

# Re-translate an already translated page (after English source was updated)
node scripts/translate.mjs --lang pt --file basic/ai-chat.mdx --force

# Translate all missing Portuguese pages (~37 pages, 10–15 min)
node scripts/translate.mjs --lang pt

# Preview without writing (dry run)
node scripts/translate.mjs --lang pt --file basic/ai-chat.mdx --dry-run
```

Run all commands from the project root (where `docs.json` and `scripts/` live).

## What happens after each run

1. Translated file is written to `pt/<path>.mdx`
2. `docs.json` `navigation.languages` section is updated — only translated pages appear in the Portuguese nav
3. `docs.json` `redirects` are recalculated — untranslated pages redirect `/pt/<page>` → `/<page>` (English fallback); redirects for newly translated pages are removed

## Workflow

1. Run the script with the appropriate flags
2. Verify the output file in `pt/`
3. Check that `docs.json` was updated correctly
4. Report which pages were translated and any errors
