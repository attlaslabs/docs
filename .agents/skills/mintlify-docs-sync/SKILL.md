---
name: mintlify-docs-sync
description: Skill to review codebase logic and create, write or edit Mintlify documentation in the sibling directory, and run translations ONLY when explicitly requested by the user.
license: MIT
compatibility: Node.js translation script.
---

# Mintlify docs sync skill

**Core concept:** `Review the codebase logic first, then create, write or edit the documentation.`

This skill manages the lifecycle of the public documentation (sibling folder `../docs`): English drafting/editing first. Translation is NEVER run automatically; it must only be executed when the user explicitly requests it.

This file is the single source of truth. `.claude/commands/documentation-mintlify.md` is a thin shim that delegates here, and `.agents/skills/mintlify-docs-sync/SKILL.md` is a symlink to this file.

---

## Workflow 1: Documenting a new feature (English source)

### 1. Identify code context
Identify the key files of the feature in `attlas-next` (database schema, API route handlers, frontend cards, actions).

### 2. Generate the English MDX with the optimized prompt
Feed the codebase files into the LLM alongside this prompt:

```markdown
You are a writer for Attlas (https://attlas.so).
Your task is to write or update a high-quality, clear, and highly accessible documentation page in English for a new or modified feature, based on the provided codebase files.

Our goal is to simplify all technical aspects so they are understandable by anyone, avoiding heavy developer jargon.

Analyze the codebase files to understand:
- The feature's purpose and how it helps the user (explain in simple terms).
- Simple step-by-step setup instructions (what the user needs to click, fill in, or provide in the interface).
- Key requirements presented in an easy-to-understand manner (e.g. explain why a "read-only" user is safer in plain language instead of deep security jargon).
- Any plan limitations (e.g., is this feature available on the Free, Starter, or PRO plan?).

Output the documentation in Mintlify MDX format following these rules:
1. FRONTMATTER: Provide title, description, and optionally tags (e.g. tag: "Soon").
2. HEADING STRUCTURE: Use a simple, non-intimidating hierarchy (##, ###).
3. VISUAL ELEMENTS: Use Mintlify components to make reading easier:
   - <Info> for simple tips or helpful context.
   - <Warning> for important notices or security recommendations explained simply.
   - <Note> for plan limitations (e.g. Free vs Starter/PRO).
   - <Tip> for best practices.
4. FORMATTING: Use tables to describe settings or configuration fields, explaining what each field does in simple, plain language.
5. Use your skill /stop-slop

Return ONLY the raw MDX content inside a markdown code block, ready to be written to a file.
```

### 3. Plan and show the content before saving
Always before writing the file, show the full planned content in the chat for user review and approval. This is the last opportunity for manual corrections.

### 4. Plan and show the content before saving
Always before writing the file, show the full planned content in the chat for user review and approval. This is the last opportunity for manual corrections.

### 5. Save the file
Create the new `.mdx` file under the appropriate folder in `../docs/` (e.g. `../docs/integrations/hubspot.mdx`).

### 6. Register in navigation
Add the new file path (without `.mdx`) to the `"en"` navigation array in `../docs/docs.json`. Run the local Mintlify preview inside `../docs/` to verify the layout.

---

## Workflow 2: Updating an existing feature (English source)

### 1. Locate the English source
Find the existing English MDX file in `../docs/` (e.g. `../docs/start/sharing.mdx`).

### 2. Update the content
Make targeted changes: keep parameters, UI descriptions, and instructions accurate; maintain existing visual components (images, frames, alerts); preview locally to verify formatting.

---

## Translation (downstream step only)

**CRITICAL:** Do NOT run the translation script automatically. Write/update the English version first, wait for the user to review and edit it, and only run the translation step when the user explicitly asks for it.

When explicitly requested, translate the finalized English page into French (`fr`) or Portuguese (`pt`) using the translator inside `../docs/`:

```bash
# From the `../docs/` directory:
node scripts/translate.mjs --lang fr --file <path-to-file>.mdx
node scripts/translate.mjs --lang pt --file <path-to-file>.mdx
```

### Critical link translation rule
All **internal absolute links** (paths starting with `/` pointing to other docs pages) **must be prefixed** with the target language code:
- **English**: `/start/sharing`
- **French**: `/fr/start/sharing`
- **Portuguese**: `/pt/start/sharing`

Applies to markdown links (`[Label](/path)` → `[Label](/fr/path)`) and JSX props (`href="/path"` → `href="/fr/path"`).
Do **not** modify external URLs (e.g. `https://attlas.so`). Do **not** modify relative links (e.g. `../start/sharing`), they resolve naturally.

### Style rule
Never use the em-dash (`—`) or en-dash in documentation prose (English drafts and translations); use a comma (`,`) instead.
