import { describe, expect, it } from 'vitest'
import { parsePorcelain, runChecks } from './check-arch.mjs'

/** Monta um repositório virtual: { caminho: conteúdo }. */
function ctx(tree, { changed = [], head = {} } = {}) {
  return {
    files: Object.keys(tree),
    changed,
    read: (f) => tree[f] ?? '',
    exists: (f) => f in tree,
    readHead: (f) => head[f] ?? null,
  }
}

const rulesHit = (tree, opts) => runChecks(ctx(tree, opts)).map((f) => `${f.severity}:${f.rule}`)

describe('gemini-only-in-ai', () => {
  it('acusa a URL do Gemini fora de modules/ai', () => {
    const hits = rulesHit({
      'apps/web/src/app/core/api.ts': 'fetch("https://generativelanguage.googleapis.com")',
    })
    expect(hits).toContain('error:gemini-only-in-ai')
  })
  it('aceita no módulo ai, nos testes da api e no .env.example', () => {
    const hits = rulesHit({
      'apps/api/src/modules/ai/gemini-rest.ts':
        'const URL = "https://generativelanguage.googleapis.com"',
      'apps/api/src/modules/ai/gemini-rest.test.ts':
        'http.post("https://generativelanguage.googleapis.com")',
      'apps/api/test/no-network.test.ts': 'GEMINI_API_KEY',
    })
    expect(hits).not.toContain('error:gemini-only-in-ai')
  })
})

describe('rls-on-every-table', () => {
  it('acusa tabela criada sem RLS', () => {
    const hits = rulesHit({
      'supabase/migrations/0001_init.sql': 'create table public.answers (id uuid);',
    })
    expect(hits).toContain('error:rls-on-every-table')
  })
  it('aceita RLS habilitado em outra migration', () => {
    const hits = rulesHit({
      'supabase/migrations/0001_init.sql': 'create table if not exists public.answers (id uuid);',
      'supabase/migrations/0002_rls.sql': 'alter table answers enable row level security;',
    })
    expect(hits).not.toContain('error:rls-on-every-table')
  })
})

describe('no-select-star-in-share', () => {
  it('acusa select("*") no módulo share', () => {
    const hits = rulesHit({
      'apps/api/src/modules/share/repo.ts': "db.from('share_cards').select('*')",
    })
    expect(hits).toContain('error:no-select-star-in-share')
  })
  it.each([
    ['select() vazio', "db.from('share_cards').select()"],
    ['estrela combinada', "db.from('share_cards').select('*, technologies(name)')"],
    ['argumento em várias linhas', "db.from('share_cards').select(`\n  slug,\n  *\n`)"],
    ['SQL', 'const q = `select * from share_cards`'],
  ])('acusa %s', (_, code) => {
    expect(rulesHit({ 'apps/api/src/modules/share/repo.ts': code })).toContain(
      'error:no-select-star-in-share',
    )
  })
  it('aceita colunas explícitas', () => {
    const hits = rulesHit({
      'apps/api/src/modules/share/repo.ts': "db.from('share_cards').select('display_name, slug')",
      'apps/api/src/modules/share/repo.test.ts': "select('*')",
    })
    expect(hits).not.toContain('error:no-select-star-in-share')
  })
})

describe('no-inline-style', () => {
  it('acusa style="..." em template', () => {
    expect(rulesHit({ 'apps/web/src/app/x.html': '<div style="color:red"></div>' })).toContain(
      'error:no-inline-style',
    )
  })
  it('aceita binding [style.x] e classes', () => {
    const hits = rulesHit({
      'apps/web/src/app/x.html': '<div class="p-2" [style.width.%]="w"></div>',
    })
    expect(hits).not.toContain('error:no-inline-style')
  })
})

describe('prompt-file-naming', () => {
  it('acusa prompt sem versão', () => {
    expect(rulesHit({ 'apps/api/src/modules/ai/prompts/question.ts': '' })).toContain(
      'error:prompt-file-naming',
    )
  })
  it('aceita <tarefa>.v<N>.ts e o teste dele', () => {
    const hits = rulesHit({
      'apps/api/src/modules/ai/prompts/question.v2.ts': '',
      'apps/api/src/modules/ai/prompts/question.v2.test.ts': '',
    })
    expect(hits).not.toContain('error:prompt-file-naming')
  })
})

describe('test-colocated', () => {
  it('acusa código em src sem .test.ts ao lado', () => {
    expect(rulesHit({ 'apps/api/src/modules/leveling/irt.ts': '' })).toContain(
      'error:test-colocated',
    )
  })
  it('aceita com teste ao lado e isenta index/types/mocks', () => {
    const hits = rulesHit({
      'apps/api/src/modules/leveling/irt.ts': '',
      'apps/api/src/modules/leveling/irt.test.ts': '',
      'packages/shared/src/index.ts': '',
      'packages/shared/src/types.ts': '',
      'apps/web/src/mocks/handlers.ts': '',
    })
    expect(hits).not.toContain('error:test-colocated')
  })
})

describe('spec-only-in-e2e', () => {
  it('acusa *.spec.ts fora de e2e/', () => {
    expect(rulesHit({ 'apps/web/src/app/x.component.spec.ts': '' })).toContain(
      'error:spec-only-in-e2e',
    )
  })
  it('aceita *.spec.ts em e2e/', () => {
    expect(rulesHit({ 'e2e/placement.spec.ts': '' })).not.toContain('error:spec-only-in-e2e')
  })
})

describe('plan-criteria', () => {
  it('avisa CA sem teste e acusa CA marcado apontando para arquivo inexistente', () => {
    const hits = rulesHit({
      'docs/plans/x.md':
        '- [ ] CA-1 faixa\n- [x] CA-2 → apps/api/src/nao-existe.test.ts\n- [x] CA-3 sem seta',
    })
    expect(hits.filter((h) => h === 'warning:plan-criteria')).toHaveLength(1)
    expect(hits.filter((h) => h === 'error:plan-criteria')).toHaveLength(2)
  })
  it('aceita CA marcado apontando para teste existente', () => {
    const hits = rulesHit({
      'docs/plans/x.md': '- [x] CA-1 → `apps/api/src/a.test.ts`',
      'apps/api/src/a.test.ts': '',
    })
    expect(hits.filter((h) => h.endsWith(':plan-criteria'))).toEqual([])
  })
})

describe('new-dependency-needs-adr (aviso)', () => {
  const pkg = (deps) => JSON.stringify({ dependencies: deps })
  it('avisa dependência nova sem ADR', () => {
    const hits = rulesHit(
      { 'apps/api/package.json': pkg({ hono: '1', zod: '1' }) },
      { changed: ['apps/api/package.json'], head: { 'apps/api/package.json': pkg({ zod: '1' }) } },
    )
    expect(hits).toContain('warning:new-dependency-needs-adr')
  })
  it('não avisa quando há ADR no mesmo conjunto de mudanças', () => {
    const hits = rulesHit(
      { 'apps/api/package.json': pkg({ hono: '1' }), 'docs/ADR/0009-hono.md': '' },
      { changed: ['apps/api/package.json', 'docs/ADR/0009-hono.md'] },
    )
    expect(hits).not.toContain('warning:new-dependency-needs-adr')
  })
})

describe('formula-change-needs-doc (aviso)', () => {
  it('avisa quando leveling muda sem a ARCHITECTURE', () => {
    const tree = { 'apps/api/src/modules/leveling/irt.ts': '' }
    expect(rulesHit(tree, { changed: ['apps/api/src/modules/leveling/irt.ts'] })).toContain(
      'warning:formula-change-needs-doc',
    )
  })
  it('não avisa quando a ARCHITECTURE muda junto', () => {
    const tree = { 'apps/api/src/modules/leveling/irt.ts': '' }
    const changed = ['apps/api/src/modules/leveling/irt.ts', 'docs/ARCHITECTURE.md']
    expect(rulesHit(tree, { changed })).not.toContain('warning:formula-change-needs-doc')
  })
})

describe('parsePorcelain', () => {
  it('lê a saída -z: modificados, novos, não rastreados, renomeados e caminhos com acento', () => {
    const text = [
      ' M a.ts',
      'A  b.ts',
      '?? c/d.ts',
      'R  new.ts',
      'old.ts',
      '?? docs/plans/lição.md',
      '',
    ].join('\0')
    expect(parsePorcelain(text)).toEqual([
      'a.ts',
      'b.ts',
      'c/d.ts',
      'new.ts',
      'docs/plans/lição.md',
    ])
  })
  it('não confunde nome de arquivo que contém " -> "', () => {
    expect(parsePorcelain('?? a -> b.ts\0')).toEqual(['a -> b.ts'])
  })
})
