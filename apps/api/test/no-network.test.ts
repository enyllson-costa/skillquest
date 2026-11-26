import { describe, expect, it } from 'vitest'

describe('harness: testes da api não saem para a rede', () => {
  it('fetch sem handler do MSW falha', async () => {
    await expect(fetch('https://example.com/qualquer-coisa')).rejects.toThrow()
  })

  it('o provedor de IA nos testes é o mock', () => {
    expect(process.env.AI_PROVIDER).toBe('mock')
  })
})
