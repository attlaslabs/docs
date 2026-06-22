---
name: mintlify-translate-en
description: Audit translation status of English documentation pages. Shows which pages are missing French or Portuguese translations and suggests commands to fill the gaps.
license: MIT
compatibility: Requires read access to docs.json and the fr/ and pt/ directories.
metadata:
  author: attlas
  version: "1.0"
---

# Translation status audit (English source)

English is the source language — no translation is needed for the `en` pages themselves. This skill audits which English pages still lack French or Portuguese translations.

**Always read `docs/translations-instructions.md` first** for full context on the translation workflow and project structure.

## Steps

1. Read `docs.json` and collect all pages listed under `navigation.languages[0].groups` (the `"en"` entry)
2. For each page path, check whether `fr/<path>.mdx` and `pt/<path>.mdx` exist
3. Output a status table:

| Page | fr | pt |
|------|----|----|
| start/sources | ✓ | ✗ |
| basic/ai-chat  | ✓ | ✓ |

4. Summarize counts:
   - Total English pages
   - Translated / missing in French
   - Translated / missing in Portuguese

5. If any pages are missing, suggest the commands to run:
   ```bash
   # Fill all missing French pages
   node scripts/translate.mjs --lang fr

   # Fill all missing Portuguese pages
   node scripts/translate.mjs --lang pt
   ```

## Notes

- Pages without a translation have a redirect in `docs.json`: `/fr/<page>` → `/<page>`
- Once translated, the redirect disappears and the page appears in the language nav
- To add a new English page: create the `.mdx` file and add it to `navigation.languages[0].groups` in `docs.json`
