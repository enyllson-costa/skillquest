import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './test/msw-server'

// Harness: nenhum teste chama rede real nem o Gemini (CLAUDE.md, rules/testing.md).
// Requisição sem handler do MSW vira erro; o provedor de IA é sempre o mock.
process.env.AI_PROVIDER = 'mock'

// MSW 3: a opção se chama onUnhandledFrame (era onUnhandledRequest no MSW 2).
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
