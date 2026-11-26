// IRT 1PL / Elo — funções puras (ARCHITECTURE §6). Sem I/O e sem relógio.

/** Probabilidade de acerto: P = 1 / (1 + e^-(θ - b)). */
export function probabilityCorrect(theta: number, b: number): number {
  return 1 / (1 + Math.exp(-(theta - b)))
}

/** Fator de aprendizado do nivelamento: K_n = max(0,3; 0,8 · 0,9^n), n = respostas já dadas. */
export function kFactor(answered: number): number {
  return Math.max(0.3, 0.8 * 0.9 ** answered)
}
