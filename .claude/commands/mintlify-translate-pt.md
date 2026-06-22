Translate Mintlify documentation pages to Brazilian Portuguese using the project translation script.

Read `docs/translations-instructions.md` for full context on the translation workflow.

## Arguments

Parse `$ARGUMENTS` to determine what to run:

- **File path** (e.g. `basic/ai-chat` or `basic/ai-chat.mdx`) → translate that specific file
- **`--force`** → add the flag to re-translate even if the file already exists
- **No arguments** → translate all missing Portuguese pages

## Steps

1. Confirm you are in the project root (where `scripts/translate.mjs` and `docs.json` live)
2. Run the appropriate command:

**Specific file:**
```bash
node scripts/translate.mjs --lang pt --file <path> [--force]
```

**Multiple files:**
```bash
node scripts/translate.mjs --lang pt --file <path1> --file <path2>
```

**All missing pages (~37 pages, 10–15 min):**
```bash
node scripts/translate.mjs --lang pt
```

3. After completion, report:
   - Which pages were translated
   - Whether `docs.json` navigation and redirects were updated
   - Any errors encountered
