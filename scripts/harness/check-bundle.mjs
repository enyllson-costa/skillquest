#!/usr/bin/env node
// check:bundle — o build de produção do web não pode conter mocks (MSW) nem segredos
// do servidor (RNF-05, CLAUDE.md, ADR 0002). Sem build, a checagem é pulada.
//
// Uso: node scripts/harness/check-bundle.mjs [dir]   (padrão: apps/web/dist)
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const FORBIDDEN = [
  { pattern: 'mockServiceWorker', why: 'service worker do MSW no build de produção' },
  { pattern: '[MSW]', why: 'código do MSW no build de produção' },
  { pattern: 'generativelanguage.googleapis.com', why: 'o front nunca chama o Gemini' },
  { pattern: 'GEMINI_API_KEY', why: 'chave do Gemini só existe em apps/api' },
  { pattern: 'service_role', why: 'service role do Supabase só existe em apps/api' },
  { pattern: 'c2VydmljZV9yb2xl', why: 'JWT de service role (base64 de "service_role")' },
  { pattern: 'SUPABASE_SERVICE_ROLE', why: 'service role do Supabase só existe em apps/api' },
]

const TEXT_EXT = /\.(js|mjs|cjs|html|css|json|txt|map|webmanifest)$/

export function scanContent(file, content) {
  return FORBIDDEN.filter(({ pattern }) => content.includes(pattern)).map(({ pattern, why }) => ({
    file,
    pattern,
    why,
  }))
}

export function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    return statSync(full).isDirectory() ? listFiles(full) : [full]
  })
}

export function scanDir(dir) {
  return listFiles(dir)
    .filter((f) => TEXT_EXT.test(f))
    .flatMap((f) => scanContent(path.relative(process.cwd(), f), readFileSync(f, 'utf8')))
}

function main() {
  const dir = process.argv[2] ?? 'apps/web/dist'
  if (!existsSync(dir)) {
    console.log(`check:bundle: ${dir} não existe (sem build do web); pulado.`)
    return
  }
  const findings = scanDir(dir)
  for (const f of findings)
    console.log(`✗ [check:bundle] ${f.file} contém "${f.pattern}" — ${f.why}`)
  console.log(`check:bundle: ${findings.length} problema(s) em ${dir}.`)
  process.exitCode = findings.length > 0 ? 1 : 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
