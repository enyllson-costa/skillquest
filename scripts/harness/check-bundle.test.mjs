import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { scanContent, scanDir } from './check-bundle.mjs'

describe('scanContent', () => {
  it('acusa MSW e segredos do servidor', () => {
    const found = scanContent(
      'main.js',
      'navigator.serviceWorker.register("/mockServiceWorker.js")',
    )
    expect(found.map((f) => f.pattern)).toContain('mockServiceWorker')
    expect(scanContent('main.js', 'role:"c2VydmljZV9yb2xl"')).toHaveLength(1)
  })
  it('aceita um bundle limpo', () => {
    expect(scanContent('main.js', 'const anonKey = "eyJhbGciOi..."; fetch("/api/v1/me")')).toEqual(
      [],
    )
  })
})

describe('scanDir', () => {
  let dir
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }))

  it('varre subpastas e ignora binários', () => {
    dir = mkdtempSync(path.join(tmpdir(), 'sq-bundle-'))
    mkdirSync(path.join(dir, 'browser'))
    writeFileSync(path.join(dir, 'browser', 'chunk.js'), 'console.log("[MSW] Mocking enabled")')
    writeFileSync(path.join(dir, 'browser', 'logo.png'), 'mockServiceWorker')
    const found = scanDir(dir)
    expect(found).toHaveLength(1)
    expect(found[0].pattern).toBe('[MSW]')
  })
})
