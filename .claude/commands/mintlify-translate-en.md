Show the translation status of all English documentation pages.

English is the source language — this command audits which pages still need translation in French (fr) and Portuguese (pt).

Read `docs/translations-instructions.md` for full context on the translation workflow.

## Steps

1. Read `docs.json` to get the full list of English pages from `navigation.languages[0].groups` (the `"en"` entry)
2. Check which pages have a corresponding file in `fr/` and `pt/`
3. Output a status table:

| Page | fr | pt |
|------|----|----|
| start/sources | ✓ | ✗ |
| basic/ai-chat  | ✓ | ✓ |
| ...            |   |   |

4. Summarize:
   - Total English pages
   - Pages translated in French / missing in French
   - Pages translated in Portuguese / missing in Portuguese
5. Suggest the commands to run to fill the gaps (e.g. `/mintlify-translate-fr` or `/mintlify-translate-all`)
