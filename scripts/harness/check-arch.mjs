#!/usr/bin/env node
// check:arch — regras de arquitetura e de processo que estavam só em texto
// (CLAUDE.md, docs/ARCHITECTURE.md, .claude/rules). Cada regra devolve achados com
// id, arquivo:linha, mensagem e a fonte da regra. Erro → exit 1; aviso não bloqueia.
//
// Uso: node scripts/harness/check-arch.mjs [--json]
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const CODE_EXT = /\.(ts|mjs|cjs|js|html)$/
const TEST_FILE = /\.(test|spec)\.(ts|mjs|js)$/

/** @typedef {{ rule: string, severity: 'error' | 'warning', file: string, line?: number, message: string, source: string }} Finding */

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length
}

function eachLine(text, fn) {
  text.split('\n').forEach((line, i) => fn(line, i + 1))
}

/** Regras. Cada uma recebe o contexto e devolve achados. */
export const rules = [
  {
    id: 'gemini-only-in-ai',
    check({ files, read }) {
      const out = []
      for (const file of files) {
        if (!CODE_EXT.test(file)) continue
        if (file.startsWith('apps/api/src/modules/ai/')) continue
        if (
          file.startsWith('apps/api/') &&
          (TEST_FILE.test(file) || file.startsWith('apps/api/test/'))
        )
          continue
        if (file.startsWith('scripts/harness/')) continue
        eachLine(read(file), (line, n) => {
          if (/generativelanguage\.googleapis\.com|GEMINI_API_KEY/.test(line)) {
            out.push({
              file,
              line: n,
              message: 'URL ou chave do Gemini fora de apps/api/src/modules/ai/.',
              source: 'CLAUDE.md (chave do Gemini só em apps/api); ARCHITECTURE §2',
            })
          }
        })
      }
      return out
    },
  },
  {
    id: 'rls-on-every-table',
    check({ files, read }) {
      const sql = files.filter((f) => /^supabase\/migrations\/.+\.sql$/.test(f))
      const norm = (name) =>
        name
          .replaceAll('"', '')
          .toLowerCase()
          .replace(/^public\./, '')
      const enabled = new Set()
      const created = []
      for (const file of sql) {
        const text = read(file)
        for (const m of text.matchAll(
          /alter\s+table\s+(?:only\s+)?(?:if\s+exists\s+)?([\w."]+)\s+enable\s+row\s+level\s+security/gi,
        ))
          enabled.add(norm(m[1]))
        for (const m of text.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([\w."]+)/gi))
          created.push({ file, line: lineOf(text, m.index), table: norm(m[1]) })
      }
      return created
        .filter((c) => !enabled.has(c.table))
        .map((c) => ({
          file: c.file,
          line: c.line,
          message: `Tabela "${c.table}" sem "alter table ... enable row level security".`,
          source: 'PRD RNF-05; ARCHITECTURE §3',
        }))
    },
  },
  {
    id: 'no-select-star-in-share',
    check({ files, read }) {
      const out = []
      for (const file of files) {
        if (!/^apps\/api\/src\/modules\/share\/.+\.ts$/.test(file) || TEST_FILE.test(file)) continue
        // .select() vazio (= todas as colunas no supabase-js), qualquer "*" dentro do argumento
        // de .select('...') — mesmo em várias linhas ou combinado ('*, x') — e "select *" em SQL.
        const text = read(file)
        const patterns = [
          /\.select\(\s*\)/g,
          /\.select\(\s*(['"`])[^'"`]*\*[^'"`]*\1/g,
          /\bselect\s+\*/gi,
        ]
        for (const re of patterns) {
          for (const m of text.matchAll(re)) {
            out.push({
              file,
              line: lineOf(text, m.index),
              message: 'O card público seleciona colunas explícitas, nunca "*".',
              source: 'ARCHITECTURE §10; PRD RNF-10',
            })
          }
        }
      }
      return out
    },
  },
  {
    id: 'no-inline-style',
    check({ files, read }) {
      const out = []
      for (const file of files) {
        if (!/^apps\/web\/.+\.html$/.test(file)) continue
        eachLine(read(file), (line, n) => {
          if (/\sstyle\s*=\s*["']/.test(line)) {
            out.push({
              file,
              line: n,
              message: 'Nada de CSS inline (style="..."); use classes do Tailwind.',
              source: '.claude/rules/angular.md',
            })
          }
        })
      }
      return out
    },
  },
  {
    id: 'prompt-file-naming',
    check({ files }) {
      return files
        .filter((f) => /^apps\/api\/src\/modules\/ai\/prompts\/[^/]+$/.test(f))
        .filter((f) => {
          const base = path.posix.basename(f)
          return base !== 'index.ts' && !/^[a-z][a-z0-9-]*\.v\d+(\.test)?\.ts$/.test(base)
        })
        .map((file) => ({
          file,
          message: 'Prompt deve seguir <tarefa>.v<N>.ts (ex.: question.v2.ts).',
          source: 'ARCHITECTURE §2 (prompts versionados)',
        }))
    },
  },
  {
    id: 'test-colocated',
    check({ files }) {
      const set = new Set(files)
      const EXEMPT = new Set(['index.ts', 'types.ts', 'main.ts', 'app.config.ts', 'app.routes.ts'])
      return files
        .filter((f) => /^(apps|packages)\/[^/]+\/src\/.+\.ts$/.test(f))
        .filter((f) => !TEST_FILE.test(f) && !f.endsWith('.d.ts'))
        .filter((f) => !EXEMPT.has(path.posix.basename(f)))
        .filter((f) => !/\/(environments|mocks|fixtures|test)\//.test(f))
        .filter((f) => !set.has(f.replace(/\.ts$/, '.test.ts')))
        .map((file) => ({
          file,
          message: `Sem teste ao lado: crie ${path.posix.basename(file).replace(/\.ts$/, '.test.ts')}.`,
          source: 'CLAUDE.md (toda feature nova tem teste); .claude/rules/testing.md',
        }))
    },
  },
  {
    id: 'spec-only-in-e2e',
    check({ files }) {
      return files
        .filter((f) => /\.spec\.ts$/.test(f) && !f.startsWith('e2e/'))
        .map((file) => ({
          file,
          message: '*.spec.ts é reservado ao E2E (e2e/); testes de unidade usam *.test.ts.',
          source: '.claude/rules/testing.md; ADR 0002',
        }))
    },
  },
  {
    id: 'plan-criteria',
    check({ files, read, exists }) {
      const out = []
      for (const file of files) {
        if (!/^docs\/plans\/.+\.md$/.test(file)) continue
        eachLine(read(file), (line, n) => {
          const m = line.match(/^\s*[-*]\s*\[( |x|X)\]\s*(CA-\d+)\b(.*)$/)
          if (!m) return
          const [, mark, id, rest] = m
          if (mark === ' ') {
            out.push({
              severity: 'warning',
              file,
              line: n,
              message: `${id} ainda sem teste associado.`,
              source: 'CLAUDE.md (Definition of Done, item 3)',
            })
            return
          }
          const target = rest.match(/(?:→|->)\s*`?([^\s`]+)`?/)
          if (!target) {
            out.push({
              file,
              line: n,
              message: `${id} marcado como feito, mas sem "→ caminho/do/teste".`,
              source: 'CLAUDE.md (Definition of Done, item 3)',
            })
          } else if (!exists(target[1])) {
            out.push({
              file,
              line: n,
              message: `${id} aponta para ${target[1]}, que não existe.`,
              source: 'CLAUDE.md (Definition of Done, item 3)',
            })
          }
        })
      }
      return out
    },
  },
  {
    id: 'new-dependency-needs-adr',
    severity: 'warning',
    check({ changed, read, readHead }) {
      const keys = ['dependencies', 'devDependencies', 'peerDependencies']
      const deps = (json) => {
        try {
          const pkg = JSON.parse(json)
          return new Set(keys.flatMap((k) => Object.keys(pkg[k] ?? {})))
        } catch {
          return new Set()
        }
      }
      if (changed.some((f) => f.startsWith('docs/ADR/'))) return []
      const out = []
      for (const file of changed.filter((f) => /(^|\/)package\.json$/.test(f))) {
        const before = deps(readHead(file) ?? '{}')
        const added = [...deps(read(file))].filter((d) => !before.has(d))
        if (added.length > 0) {
          out.push({
            file,
            message: `Dependência nova (${added.join(', ')}) sem ADR no mesmo conjunto de mudanças.`,
            source: 'CLAUDE.md (mudanças grandes registram ADR em docs/ADR/)',
          })
        }
      }
      return out
    },
  },
  {
    id: 'formula-change-needs-doc',
    severity: 'warning',
    check({ changed }) {
      const touched = changed.filter(
        (f) => /^apps\/api\/src\/modules\/(leveling|srs)\/.+\.ts$/.test(f) && !TEST_FILE.test(f),
      )
      if (touched.length === 0 || changed.includes('docs/ARCHITECTURE.md')) return []
      return touched.map((file) => ({
        file,
        message:
          'leveling/srs mudou sem mudança em docs/ARCHITECTURE.md; se a fórmula mudou, atualize o doc.',
        source: '.claude/rules/api.md (mudou a fórmula, atualize o doc)',
      }))
    },
  },
]

/** Roda todas as regras sobre um contexto (injetável nos testes). */
export function runChecks(ctx) {
  /** @type {Finding[]} */
  const findings = []
  for (const rule of rules) {
    for (const f of rule.check(ctx)) {
      findings.push({ severity: rule.severity ?? 'error', ...f, rule: rule.id })
    }
  }
  return findings
}

/** Argumentos do git status usados pelo harness: -z evita aspas/escape octal em caminhos. */
export const STATUS_ARGS = ['-c', 'core.quotepath=false', 'status', '--porcelain=v1', '-z', '-uall']

/** Lê a saída de `git status --porcelain=v1 -z`. Em rename/copy, a entrada seguinte é a origem. */
export function parsePorcelain(text) {
  const entries = text.split('\0').filter(Boolean)
  const paths = []
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    paths.push(entry.slice(3))
    if (entry[0] === 'R' || entry[0] === 'C') i++
  }
  return paths
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

export function repoContext(root = process.cwd()) {
  const files = git(['ls-files', '--cached', '--others', '--exclude-standard'])
    .split('\n')
    .filter(Boolean)
    .filter((f) => existsSync(path.join(root, f)))
  const changed = parsePorcelain(git(STATUS_ARGS))
  return {
    files,
    changed,
    read: (f) => readFileSync(path.join(root, f), 'utf8'),
    exists: (f) => existsSync(path.join(root, f)),
    readHead: (f) => {
      try {
        return git(['show', `HEAD:${f}`])
      } catch {
        return null
      }
    },
  }
}

function format(f) {
  const where = f.line ? `${f.file}:${f.line}` : f.file
  const icon = f.severity === 'error' ? '✗' : '⚠'
  return `${icon} [${f.rule}] ${where} — ${f.message} (fonte: ${f.source})`
}

function main() {
  const findings = runChecks(repoContext())
  const errors = findings.filter((f) => f.severity === 'error')
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(findings, null, 2))
  } else {
    for (const f of findings) console.log(format(f))
    const warnings = findings.length - errors.length
    console.log(
      `check:arch: ${rules.length} regras, ${errors.length} erro(s), ${warnings} aviso(s).`,
    )
  }
  process.exitCode = errors.length > 0 ? 1 : 0
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
