import { describe, expect, it } from 'vitest'
import { kFactor, probabilityCorrect } from './irt'

describe('probabilityCorrect (CA-1)', () => {
  it.each([
    { theta: 0, b: 0, expected: 0.5 },
    { theta: 1.2, b: 1.2, expected: 0.5 },
    { theta: 0.4, b: 0, expected: 0.6 }, // ARCHITECTURE §6, passo 2
    { theta: -0.03, b: 0, expected: 0.49 }, // ARCHITECTURE §6, passo 3
  ])('θ=$theta, b=$b → P≈$expected', ({ theta, b, expected }) => {
    expect(probabilityCorrect(theta, b)).toBeCloseTo(expected, 2)
  })

  it('cresce quando θ supera a dificuldade', () => {
    expect(probabilityCorrect(2, 0)).toBeGreaterThan(probabilityCorrect(1, 0))
  })
})

describe('kFactor (CA-2)', () => {
  it.each([
    { answered: 0, expected: 0.8 }, // ARCHITECTURE §6, passo 1
    { answered: 1, expected: 0.72 }, // passo 2
    { answered: 2, expected: 0.648 }, // passo 3 (0,65 na tabela)
  ])('n=$answered → K=$expected', ({ answered, expected }) => {
    expect(kFactor(answered)).toBeCloseTo(expected, 3)
  })

  it.each([10, 50])('nunca fica abaixo de 0,3 (n=%i)', (answered) => {
    expect(kFactor(answered)).toBe(0.3)
  })
})
