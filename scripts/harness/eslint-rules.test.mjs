// Autoteste das regras arquiteturais do eslint.config.mjs: o mesmo código é aceito ou
// recusado conforme o caminho do arquivo (ARCHITECTURE §0).
import path from 'node:path'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const root = path.resolve(import.meta.dirname, '../..')
const eslint = new ESLint({ cwd: root })
// Arquivo real de um módulo puro: o project service precisa de um caminho existente.
const PURE_FILE = path.join(root, 'apps/api/src/modules/leveling/irt.ts')

async function messagesFor(code, filePath = PURE_FILE) {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.map((m) => m.message)
}

describe('módulos puros (leveling, srs, ...)', () => {
  it('recusa Date.now()', async () => {
    const msgs = await messagesFor('export const at = (): number => Date.now()\n')
    expect(msgs.some((m) => m.includes('receba `now` por parâmetro'))).toBe(true)
  })

  it('recusa new Date() sem argumento', async () => {
    const msgs = await messagesFor('export const at = (): Date => new Date()\n')
    expect(msgs.some((m) => m.includes('new Date()'))).toBe(true)
  })

  it('recusa I/O (node:fs, @supabase)', async () => {
    const code = "import { readFileSync } from 'node:fs'\nexport const x = readFileSync\n"
    const msgs = await messagesFor(code)
    expect(msgs.some((m) => m.includes('Módulo puro'))).toBe(true)
  })

  it('recusa estado mutável no topo do módulo (api stateless)', async () => {
    const msgs = await messagesFor('export let counter = 0\n')
    expect(msgs.some((m) => m.includes('stateless'))).toBe(true)
  })

  it('recusa cache em coleção mutável no topo do módulo (api stateless)', async () => {
    const msgs = await messagesFor(
      'const cache = new Map<string, number>()\nexport const get = (k: string) => cache.get(k)\n',
    )
    expect(msgs.some((m) => m.includes('stateless'))).toBe(true)
  })

  it.each([
    [
      'import nativo sem prefixo node:',
      "import { readFileSync } from 'fs'\nexport const x = readFileSync\n",
      'Módulo puro',
    ],
    [
      'process.env',
      'export const provider = (): string | undefined => process.env.AI_PROVIDER\n',
      'sem process',
    ],
    ['performance.now()', 'export const t = (): number => performance.now()\n', 'sem performance'],
    ['import() dinâmico', "export const load = () => import('./other')\n", 'dinamicamente'],
  ])('recusa %s', async (_, code, expected) => {
    const msgs = await messagesFor(code)
    expect(msgs.some((m) => m.includes(expected))).toBe(true)
  })

  it('aceita uma função pura que recebe now por parâmetro', async () => {
    const code =
      'export function dueIn(now: Date, days: number): Date {\n  return new Date(now.getTime() + days * 86_400_000)\n}\n'
    expect(await messagesFor(code)).toEqual([])
  })
})
