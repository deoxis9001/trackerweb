import { test, expect } from '@playwright/test'

test('la page charge et affiche le tracker', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/TMC.*Tracker/)
  await expect(page.locator('.tracker-layout')).toBeVisible()
})
