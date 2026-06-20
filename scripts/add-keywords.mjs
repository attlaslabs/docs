#!/usr/bin/env node
/**
 * add-keywords.mjs — Generate and add keywords to frontmatter of MDX files in subfolders
 *
 * Usage:
 *   node scripts/add-keywords.mjs --dry-run
 *   node scripts/add-keywords.mjs --file basic/ai-chat.mdx
 *   node scripts/add-keywords.mjs --force
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── Config ───────────────────────────────────────────────────────────────────
const MODEL = 'deepseek/deepseek-v4-flash'
const BASE_URL = 'https://openrouter.ai/api/v1'
const RATE_LIMIT_MS = 400

const EXCLUDED_DIRS = new Set([
  '.git',
  '.agents',
  '.claude',
  'node_modules',
  'images',
  'logo',
  'scripts'
])

// ── CLI args ──────────────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2)
  const opts = { files: [], force: false, dryRun: false }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file') {
      const f = args[++i]
      opts.files.push(f.endsWith('.mdx') ? f : f + '.mdx')
    }
    else if (args[i] === '--force') opts.force = true
    else if (args[i] === '--dry-run') opts.dryRun = true
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

// ── Get All MDX Files in Subdirectories ───────────────────────────────────────
function getMdxFilesInSubdirs(dir = ROOT, depth = 0) {
  const files = []
  const list = fs.readdirSync(dir)

  for (const item of list) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      if (depth === 0 && EXCLUDED_DIRS.has(item)) {
        continue
      }
      files.push(...getMdxFilesInSubdirs(fullPath, depth + 1))
    } else if (stat.isFile() && item.endsWith('.mdx')) {
      // Only include files that are in a subdirectory (depth > 0)
      if (depth > 0) {
        files.push(path.relative(ROOT, fullPath))
      }
    }
  }

  return files
}

// ── OpenRouter API ────────────────────────────────────────────────────────────
function buildSystemPrompt() {
  return `You are an SEO and search optimization expert for product documentation.

Your task is to analyze the content of the provided documentation page (title, description, and body) and generate a JSON list of 3 to 7 highly relevant keywords or search queries.
These should be the exact terms or questions users would type in a search bar to find this information.

Rules:
- The output MUST be a valid JSON array of strings, e.g.: ["term 1", "term 2", "term 3"]
- Use the language of the document (English for English docs, French for French docs, etc.)
- Do NOT wrap the JSON in code blocks (no \`\`\`json)
- Return ONLY the JSON array. No explanations, no preamble.`
}

async function callApi(content, apiKey) {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content },
      ]
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenRouter error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const choiceContent = data.choices?.[0]?.message?.content
  return choiceContent ? choiceContent.trim() : ''
}

// ── Frontmatter injection ─────────────────────────────────────────────────────
function injectKeywords(fileContent, keywordsArray) {
  const lines = fileContent.split('\n')
  if (lines[0] !== '---') {
    throw new Error('Invalid frontmatter: File does not start with ---')
  }

  // Find the closing ---
  let closingIndex = -1
  let hasKeywords = false
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      closingIndex = i
      break
    }
    if (lines[i].startsWith('keywords:')) {
      hasKeywords = true
    }
  }

  if (closingIndex === -1) {
    throw new Error('Invalid frontmatter: Could not find closing ---')
  }

  if (hasKeywords) {
    return { modified: false, content: fileContent }
  }

  // Format keywords array as JSON string representation
  const keywordsStr = `keywords: ${JSON.stringify(keywordsArray)}`

  // Insert before the closing ---
  lines.splice(closingIndex, 0, keywordsStr)
  return { modified: true, content: lines.join('\n') }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv()
  const opts = parseArgs()

  const apiKey = process.env.OPENROUTER_TRANSLATION_KEY
  if (!apiKey) {
    console.error('Missing OPENROUTER_TRANSLATION_KEY in .env.local')
    process.exit(1)
  }

  const filesToProcess = opts.files.length > 0 ? opts.files : getMdxFilesInSubdirs()

  console.log(`\n🔑 Generating keywords for MDX pages in subdirectories`)
  console.log(`   Model : ${MODEL}`)
  console.log(`   Files : ${filesToProcess.length}`)
  if (opts.dryRun) console.log('   Mode  : DRY RUN (calls API, does not write files)\n')
  else console.log()

  let processed = 0
  let skipped = 0
  let errors = 0

  for (const relPath of filesToProcess) {
    const srcPath = path.join(ROOT, relPath)

    if (!fs.existsSync(srcPath)) {
      console.warn(`  ⚠ Not found: ${relPath}`)
      errors++
      continue
    }

    const fileContent = fs.readFileSync(srcPath, 'utf8')

    // Check if keywords already exist to avoid calling the API needlessly (unless --force)
    const hasKeywords = fileContent.split('\n').slice(0, 15).some(line => line.startsWith('keywords:'))
    if (hasKeywords && !opts.force) {
      console.log(`  – Skip (already has keywords): ${relPath}`)
      skipped++
      continue
    }

    process.stdout.write(`  → ${relPath} ... `)
    let keywordsResponse
    try {
      keywordsResponse = await callApi(fileContent, apiKey)
    } catch (err) {
      console.log(`ERROR: ${err.message}`)
      errors++
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS))
      continue
    }

    let keywordsArray
    try {
      if (!keywordsResponse) {
        throw new Error('Received empty response from API')
      }
      // Strip markdown codeblock backticks if present
      let cleanResponse = keywordsResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim()
      let parsed = JSON.parse(cleanResponse)
      if (Array.isArray(parsed)) {
        keywordsArray = parsed
      } else if (parsed && typeof parsed === 'object') {
        const firstArrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]))
        if (firstArrayKey) {
          keywordsArray = parsed[firstArrayKey]
        } else {
          // Flatten key-value pairs if it's a simple object, ignoring metadata properties
          keywordsArray = Object.entries(parsed)
            .flatMap(([k, v]) => {
              const list = []
              const cleanKey = k.toLowerCase().trim()
              const ignoredKeys = new Set(['title', 'description', 'sidebartitle'])
              if (cleanKey && !ignoredKeys.has(cleanKey) && isNaN(Number(k))) {
                list.push(k)
              }
              if (v && typeof v === 'string' && !v.includes('Best practices') && !v.includes('foundation of every great')) {
                list.push(v)
              }
              return list
            })
            .filter(Boolean)
        }
      }
      
      if (!Array.isArray(keywordsArray) || keywordsArray.length === 0) {
        throw new Error('Response is not a JSON array or does not contain a JSON array')
      }
    } catch (err) {
      console.log(`JSON PARSE ERROR (Response was: ${keywordsResponse}): ${err.message}`)
      errors++
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS))
      continue
    }

    try {
      const { modified, content: updatedContent } = injectKeywords(fileContent, keywordsArray)
      if (modified) {
        if (opts.dryRun) {
          console.log(`done (dry-run keywords: ${JSON.stringify(keywordsArray)})`)
        } else {
          fs.writeFileSync(srcPath, updatedContent)
          console.log(`done (added: ${JSON.stringify(keywordsArray)})`)
        }
        processed++
      } else {
        console.log('skipped (no change needed)')
        skipped++
      }
    } catch (err) {
      console.log(`INJECTION ERROR: ${err.message}`)
      errors++
    }

    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS))
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`✓ Processed  : ${processed}`)
  console.log(`– Skipped    : ${skipped}`)
  if (errors > 0) console.log(`✗ Errors     : ${errors}`)
  console.log('Done.\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
