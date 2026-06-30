#!/usr/bin/env node
/**
 * translate.mjs, Attlas Docs translation script
 *
 * Usage:
 *   node scripts/translate.mjs --lang fr
 *   node scripts/translate.mjs --lang pt
 *   node scripts/translate.mjs --lang fr --file basic/ai-chat.mdx
 *   node scripts/translate.mjs --lang fr --force
 *   node scripts/translate.mjs --lang fr --dry-run
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── Config ───────────────────────────────────────────────────────────────────

const MODEL = 'deepseek/deepseek-v4-pro'
const BASE_URL = 'https://openrouter.ai/api/v1'
const RATE_LIMIT_MS = 400

const LANGUAGE_NAMES = {
  fr: 'French',
  pt: 'Portuguese (Brazilian)',
}

const GROUP_LABELS = {
  fr: {
    Learn: 'Apprendre',
    'Get started': 'Prise en main',
    'Basic features': 'Fonctionnalités de base',
    'Pro features': 'Fonctionnalités Pro',
    'Best practices': 'Bonnes pratiques',
    Integrations: 'Intégrations',
    Playbooks: 'Guides pratiques',
    Ressources: 'Ressources',
    'Terms & Privacy': 'CGU & Confidentialité',
  },
  pt: {
    Learn: 'Aprender',
    'Get started': 'Primeiros passos',
    'Basic features': 'Funcionalidades básicas',
    'Pro features': 'Funcionalidades Pro',
    'Best practices': 'Boas práticas',
    Integrations: 'Integrações',
    Playbooks: 'Guias práticos',
    Ressources: 'Recursos',
    'Terms & Privacy': 'Termos & Privacidade',
  },
}

// Derives the flat list of all English page paths by walking docs.json navigation.
// This way it stays in sync automatically whenever the English nav changes.
function extractPages(entries) {
  const pages = []
  for (const entry of entries) {
    if (typeof entry === 'string') {
      pages.push(entry)
    } else {
      if (entry.root) {
        pages.push(entry.root)
      }
      if (entry.pages) {
        pages.push(...extractPages(entry.pages))
      }
    }
  }
  return pages
}

function loadAllPages() {
  const docsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs.json'), 'utf8'))
  const enNav = docsJson.navigation.languages.find((l) => l.language === 'en')
  const fromNav = extractPages(enNav.groups)

  // index.mdx is the homepage and not listed in nav groups, add it explicitly
  return ['index', ...fromNav]
}

// ── CLI args ──────────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { lang: null, files: [], force: false, dryRun: false, onlyNav: false }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lang') opts.lang = args[++i]
    else if (args[i] === '--file') {
      // Accept with or without .mdx extension
      const f = args[++i]
      opts.files.push(f.endsWith('.mdx') ? f : f + '.mdx')
    }
    else if (args[i] === '--force') opts.force = true
    else if (args[i] === '--dry-run') opts.dryRun = true
    else if (args[i] === '--only-nav') opts.onlyNav = true
  }
  return opts
}

// ── Environment ───────────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?([^"]*)"?$/)
    if (m) process.env[m[1]] = m[2]
  }
}

// ── OpenRouter API ────────────────────────────────────────────────────────────

function buildSystemPrompt(lang) {
  const target = LANGUAGE_NAMES[lang]
  return `You are an expert technical documentation translator specializing in SaaS product documentation.

Your task: translate from English to ${target}.

Guidelines:
- Preserve the exact MDX/Markdown structure entirely, do not alter whitespace, indentation, or line breaks
- Translate frontmatter VALUES (title, description, sidebarTitle) but NEVER the keys
- Do NOT translate: code blocks (\`\`\`...\`\`\`), inline code (\`...\`), component/tag names (<Card>, <Info>, <Note>, <Check>, <Columns>, <Column>, <CodeGroup>, etc.), JSX attribute NAMES (href, icon, color, root, expanded, hidden), external URLs (starting with http/https or //), relative paths, variable names, icon identifiers
- Prepend the target language code prefix (\`/${lang}\`) ONLY to absolute internal documentation page links (paths starting with \`/\` that point to other doc pages). Example: \`[Label](/path)\` → \`[Label](/${lang}/path)\`, \`href="/path"\` → \`href="/${lang}/path"\`. Do NOT prefix asset paths such as \`/images/\`, \`/logo/\`, \`/favicon/\`, or any path pointing to a file with an extension (.png, .jpg, .webp, .svg, .gif, .mp4, etc.)
- Never use the em-dash (—) or en-dash in the translation; always use a comma (,) instead
- DO translate: all prose text, heading text (## ### etc.), list items, table content, the VALUE strings of component props such as title="..." or description="..."
- Maintain the same register: professional yet approachable SaaS documentation style
- Use vocabulary and phrasing a native ${target} speaker would naturally use in a product documentation context
- Return ONLY the translated MDX content, no explanation, no preamble, no markdown code fence wrapper around the whole output`
}

async function callApi(content, lang, apiKey) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(lang) },
        { role: 'user', content },
      ],
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter error ${response.status}: ${err}`)
  }

  const data = await response.json()
  return data.choices[0].message.content.trim()
}

// ── Nav regeneration ──────────────────────────────────────────────────────────

function translatedExists(lang, pagePath) {
  return fs.existsSync(path.join(ROOT, lang, pagePath + '.mdx'))
}

// Recursively rebuild a nav entry (group object or page string) for a given language.
// Returns null if the entry has no translated content (so it can be filtered out).
function buildNavEntry(lang, entry) {
  const labels = GROUP_LABELS[lang]

  if (typeof entry === 'string') {
    return translatedExists(lang, entry) ? `${lang}/${entry}` : null
  }

  // It's a group object
  const translatedPages = entry.pages
    .map((child) => buildNavEntry(lang, child))
    .filter(Boolean)

  if (translatedPages.length === 0) return null

  const result = {
    group: labels[entry.group] || entry.group,
    pages: translatedPages,
  }
  if (entry.icon) result.icon = entry.icon
  if (entry.root && translatedExists(lang, entry.root)) result.root = `${lang}/${entry.root}`
  if (entry.expanded) result.expanded = entry.expanded
  if (entry.hidden) result.hidden = entry.hidden

  return result
}

function regenerateNav(lang, allPages) {
  const docsJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs.json'), 'utf8'))
  const enNav = docsJson.navigation.languages.find((l) => l.language === 'en')

  // Rebuild groups, dropping any group that ends up with no translated pages
  const groups = enNav.groups
    .map((g) => buildNavEntry(lang, g))
    .filter(Boolean)

  // Patch the language entry inline in docs.json
  const langIndex = docsJson.navigation.languages.findIndex((l) => l.language === lang)
  const existingLang = langIndex !== -1 ? docsJson.navigation.languages[langIndex] : {}
  const langEntry = { ...existingLang, language: lang, groups }
  if (langIndex === -1) {
    docsJson.navigation.languages.push(langEntry)
  } else {
    docsJson.navigation.languages[langIndex] = langEntry
  }

  // Rebuild redirects for this language (untranslated pages → English equivalent)
  const otherRedirects = (docsJson.redirects || []).filter(
    (r) => !r.source.startsWith(`/${lang}/`) || r.source === `/${lang}/docs`
  )
  const missingPages = allPages.filter((p) => !translatedExists(lang, p))
  const langRedirects = missingPages.map((p) => ({
    source: `/${lang}/${p}`,
    destination: `/${p}`,
  }))

  docsJson.redirects = [...otherRedirects, ...langRedirects]

  fs.writeFileSync(path.join(ROOT, 'docs.json'), JSON.stringify(docsJson, null, 2) + '\n')
  console.log(`  ✓ docs.json updated, ${groups.length} group(s) in nav, ${langRedirects.length} redirect(s) for untranslated pages`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv()
  const opts = parseArgs()

  if (!opts.lang || !LANGUAGE_NAMES[opts.lang]) {
    console.error('Usage: node scripts/translate.mjs --lang <fr|pt> [--file <path>] [--force] [--dry-run] [--only-nav]')
    process.exit(1)
  }

  const { lang, force, dryRun, onlyNav } = opts
  const allPages = loadAllPages()

  if (onlyNav) {
    console.log(`\nRegenerating navigation for ${LANGUAGE_NAMES[lang]} (${lang})...`)
    regenerateNav(lang, allPages)
    console.log('Done.\n')
    return
  }

  const apiKey = process.env.OPENROUTER_TRANSLATION_KEY
  if (!apiKey) {
    console.error('Missing OPENROUTER_TRANSLATION_KEY in .env.local')
    process.exit(1)
  }

  const filesToTranslate =
    opts.files.length > 0 ? opts.files : allPages.map((p) => p + '.mdx')

  console.log(`\n🌐 Translating to ${LANGUAGE_NAMES[lang]} (${lang})`)
  console.log(`   Model : ${MODEL}`)
  console.log(`   Files : ${filesToTranslate.length}`)
  if (dryRun) console.log('   Mode  : DRY RUN (calls API, does not write files)\n')
  else console.log()

  let translated = 0
  let skipped = 0
  let errors = 0

  for (const relPath of filesToTranslate) {
    const srcPath = path.join(ROOT, relPath)
    const destPath = path.join(ROOT, lang, relPath)

    if (!fs.existsSync(srcPath)) {
      console.warn(`  ⚠ Not found: ${relPath}`)
      errors++
      continue
    }

    if (!force && fs.existsSync(destPath)) {
      console.log(`  – Skip (exists): ${relPath}`)
      skipped++
      continue
    }

    const content = fs.readFileSync(srcPath, 'utf8')

    process.stdout.write(`  → ${relPath} ... `)
    let result
    try {
      result = await callApi(content, lang, apiKey)
      console.log('done')
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
      errors++
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS))
      continue
    }

    if (dryRun) {
      console.log(`\n${'─'.repeat(60)}`)
      console.log(`DRY RUN → ${lang}/${relPath}`)
      console.log(`${'─'.repeat(60)}`)
      console.log(result)
      console.log()
    } else {
      try {
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        fs.writeFileSync(destPath, result + '\n')
      } catch (err) {
        console.log(`  ✗ Write error: ${err.message}`)
        errors++
        await new Promise((r) => setTimeout(r, RATE_LIMIT_MS))
        continue
      }
    }

    translated++
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS))
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✓ Translated : ${translated}`)
  console.log(`– Skipped    : ${skipped}`)
  if (errors > 0) console.log(`✗ Errors     : ${errors}`)

  if (!dryRun) {
    console.log('\nRegenerating navigation...')
    regenerateNav(lang, allPages)
  }

  console.log('\nDone.\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
