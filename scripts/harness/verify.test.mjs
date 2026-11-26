import { describe, expect, it } from 'vitest'
import { affectedPackages, harnessAffected, summarizeFailure } from './verify.mjs'

const PKGS = ['apps/api', 'apps/web', 'packages/shared']

describe('affectedPackages', () => {
  it('mapeia arquivos para o pacote dono', () => {
    expect(affectedPackages(['apps/api/src/a.ts', 'apps/api/test/b.ts'], PKGS)).toEqual([
      'apps/api',
    ])
  })
  it('mudança na config da raiz afeta todos os pacotes', () => {
    expect(affectedPackages(['eslint.config.mjs'], PKGS)).toEqual(PKGS)
  })
  it('docs e .claude não afetam pacote nenhum', () => {
    expect(affectedPackages(['docs/PRD.md', '.claude/agents/x.md'], PKGS)).toEqual([])
  })
  it('não confunde prefixos parecidos', () => {
    expect(affectedPackages(['apps/api-old/x.ts'], PKGS)).toEqual([])
  })
})

describe('summarizeFailure', () => {
  it('destaca falhas que ficaram fora da cauda do log', () => {
    const output = [
      ' × n=0 → K=0.8',
      ...Array.from({ length: 100 }, (_, i) => `linha ${i}`),
      ' FAIL  src/irt.test.ts > n=2',
    ].join('\n')
    const { highlights, tail } = summarizeFailure(output)
    expect(highlights).toEqual([' × n=0 → K=0.8', ' FAIL  src/irt.test.ts > n=2'])
    expect(tail).not.toContain(' × n=0 → K=0.8')
  })
})

describe('harnessAffected', () => {
  it('roda os testes do harness quando scripts/harness ou a config da raiz mudam', () => {
    expect(harnessAffected(['scripts/harness/verify.mjs'])).toBe(true)
    expect(harnessAffected(['package.json'])).toBe(true)
    expect(harnessAffected(['apps/api/src/a.ts'])).toBe(false)
  })
})
