import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test('home abre com o título e sem violações axe serious/critical', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: 'SkillQuest' })).toBeVisible()

  const { violations } = await new AxeBuilder({ page }).analyze()
  const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([])
})
