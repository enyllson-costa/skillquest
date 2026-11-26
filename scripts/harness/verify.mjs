#!/usr/bin/env node
// verify — o gate único do harness. Mesmo comando para agentes, hooks, /ship e CI.
//
//   pnpm verify        tudo, em ordem, parando na primeira falha:
//                      format:check → lint → typecheck → check:arch → test → build → check:bundle
//   pnpm verify:fast   só o que as mudanças afetam (inclui arquivos não rastreados) e
//                      roda todas as etapas, para devolver todas as falhas de uma vez.
//
// Resultado em .harness/last-verify.json (lido pelos revisores e pelo SessionStart).
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parsePorcelain, STATUS_ARGS } from './check-arch.mjs'

const TAIL_LINES = 60
// Arquivos da raiz que afetam todos os pacotes.
const ROOT_CONFIG =
  /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|tsconfig\.base\.json|eslint\.config\.mjs|\.prettierrc\.json)$/

/** Mapeia arquivos alterados para os diretórios de pacote afetados. */
export function affectedPackages(changed, packageDirs) {
  if (changed.some((f) => ROOT_CONFIG.test(f))) return [...packageDirs]
  const hit = new Set()
  for (const f of changed) {
    const dir = packageDirs.find((d) => f === d || f.startsWith(`${d}/`))
    if (dir) hit.add(dir)
  }
  return [...hit]
}

// Linhas que identificam uma falha (vitest, eslint, tsc, check:arch). Saem todas, mesmo que
// fiquem fora da cauda do log: sem isso, falhas do começo da saída sumiam do resumo.
const FAILURE_LINE = /(^\s*FAIL\s|^\s*×\s|\berror\b|error TS\d+|^✗ |AssertionError)/
const MAX_HIGHLIGHTS = 40

export function summarizeFailure(output) {
  const lines = output.split('\n')
  const highlights = [
    ...new Set(lines.filter((l) => FAILURE_LINE.test(l)).map((l) => l.trimEnd())),
  ].slice(0, MAX_HIGHLIGHTS)
  return { highlights, tail: lines.slice(-TAIL_LINES) }
}

export function harnessAffected(changed) {
  return changed.some((f) => f.startsWith('scripts/harness/') || ROOT_CONFIG.test(f))
}

function listPackageDirs() {
  return ['apps', 'packages'].flatMap((top) => {
    if (!existsSync(top)) return []
    return execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', top], {
      encoding: 'utf8',
    })
      .split('\n')
      .filter((f) => /^(apps|packages)\/[^/]+\/package\.json$/.test(f))
      .map((f) => path.posix.dirname(f))
  })
}

function changedFiles() {
  const out = execFileSync('git', STATUS_ARGS, { encoding: 'utf8' })
  return parsePorcelain(out).filter((f) => existsSync(f))
}

// Etapas que recebem nomes de arquivo rodam a CLI JS da ferramenta direto no node, sem shell:
// nada de nome de arquivo passando pelo cmd.exe (& ^ % ! quebrariam ou injetariam comando).
const PRETTIER_CLI = 'node_modules/prettier/bin/prettier.cjs'
const ESLINT_CLI = 'node_modules/eslint/bin/eslint.js'
const FILES_PER_BATCH = 150

/** Etapas com argumentos fixos (pnpm <script>) usam shell, necessário para o pnpm.cmd no Windows. */
function run(name, cmd, args, { shell = cmd === 'pnpm' } = {}) {
  const started = Date.now()
  const env = { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' }
  const opts = { encoding: 'utf8', env, maxBuffer: 64 * 1024 * 1024 }
  const res = shell
    ? spawnSync([cmd, ...args].join(' '), { ...opts, shell: true })
    : spawnSync(cmd === 'node' ? process.execPath : cmd, args, { ...opts, shell: false })
  const spawnError = res.error ? `[verify] falha ao executar ${cmd}: ${res.error.message}\n` : ''
  const output = `${spawnError}${res.stdout ?? ''}${res.stderr ?? ''}`.trim()
  return { name, ok: !res.error && res.status === 0, ms: Date.now() - started, output }
}

function batches(list, size) {
  const out = []
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size))
  return out
}

function fileSteps(name, cli, flags, files) {
  return batches(files, FILES_PER_BATCH).map((batch, i, all) => [
    all.length > 1 ? `${name} ${i + 1}/${all.length}` : name,
    'node',
    [cli, ...flags, ...batch],
  ])
}

function fullSteps() {
  return [
    ['format:check', 'pnpm', ['-s', 'format:check']],
    ['lint', 'pnpm', ['-s', 'lint']],
    ['typecheck', 'pnpm', ['-s', 'typecheck']],
    ['check:arch', 'node', ['scripts/harness/check-arch.mjs']],
    ['test', 'pnpm', ['-s', 'test']],
    ['build', 'pnpm', ['-s', 'build']],
    ['check:bundle', 'node', ['scripts/harness/check-bundle.mjs']],
  ]
}

function fastSteps(changed) {
  const steps = []
  const formattable = changed.filter((f) => /\.(ts|mjs|cjs|js|html|json|css|scss|ya?ml)$/.test(f))
  steps.push(...fileSteps('format', PRETTIER_CLI, ['--check', '--ignore-unknown'], formattable))
  const lintable = changed.filter((f) => /\.(ts|mjs|cjs|js)$/.test(f) && !f.startsWith('.claude/'))
  steps.push(...fileSteps('lint', ESLINT_CLI, ['--max-warnings=0'], lintable))
  const pkgs = affectedPackages(changed, listPackageDirs())
  if (pkgs.length > 0) {
    const filters = pkgs.flatMap((d) => ['--filter', `...{./${d}}`])
    steps.push(['typecheck', 'pnpm', ['-s', '-r', '--if-present', ...filters, 'typecheck']])
    steps.push(['test', 'pnpm', ['-s', '-r', '--if-present', ...filters, 'test']])
  }
  if (harnessAffected(changed)) steps.push(['test:harness', 'pnpm', ['-s', 'test:harness']])
  steps.push(['check:arch', 'node', ['scripts/harness/check-arch.mjs']])
  return steps
}

function gitHead() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
  } catch {
    return null
  }
}

function main() {
  const fast = process.argv.includes('--fast')
  const changed = changedFiles()
  const steps = fast ? fastSteps(changed) : fullSteps()
  console.log(`verify${fast ? ':fast' : ''}: ${steps.length} etapa(s)`)

  const results = []
  for (const [name, cmd, args] of steps) {
    const r = run(name, cmd, args)
    results.push(r)
    console.log(`${r.ok ? '✓' : '✗'} ${name.padEnd(13)} ${(r.ms / 1000).toFixed(1)}s`)
    if (!r.ok && !fast) break
  }

  const failed = results.filter((r) => !r.ok)
  for (const r of failed) {
    const { highlights, tail } = summarizeFailure(r.output)
    if (highlights.length > 0) {
      console.log(`\n--- ${r.name}: todas as falhas (${highlights.length}) ---`)
      console.log(highlights.join('\n'))
    }
    console.log(`\n--- ${r.name}: últimas ${tail.length} linhas ---`)
    console.log(tail.join('\n'))
  }
  // Avisos do check:arch aparecem mesmo quando ele passa.
  const arch = results.find((r) => r.name === 'check:arch')
  if (arch?.ok && arch.output.includes('⚠')) {
    console.log('\n--- check:arch (avisos) ---')
    console.log(
      arch.output
        .split('\n')
        .filter((l) => l.startsWith('⚠'))
        .join('\n'),
    )
  }

  mkdirSync('.harness', { recursive: true })
  const summary = {
    mode: fast ? 'fast' : 'full',
    ok: failed.length === 0,
    failedSteps: failed.map((r) => r.name),
    steps: results.map(({ name, ok, ms }) => ({ name, ok, ms })),
    head: gitHead(),
    dirty: changed.length > 0,
    changedFiles: changed.length,
    finishedAt: new Date().toISOString(),
  }
  writeFileSync('.harness/last-verify.json', `${JSON.stringify(summary, null, 2)}\n`)

  console.log(
    `\nRESULTADO: ${summary.ok ? 'OK' : `FALHOU (${summary.failedSteps.join(', ')})`} → .harness/last-verify.json`,
  )
  process.exitCode = summary.ok ? 0 : 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
