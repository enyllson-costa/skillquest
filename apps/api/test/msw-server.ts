import { setupServer } from 'msw/node'

// Servidor MSW compartilhado pelos testes da api. Os testes registram handlers com
// server.use(...); o ciclo de vida (listen/reset/close) fica só no vitest.setup.ts.
export const server = setupServer()
