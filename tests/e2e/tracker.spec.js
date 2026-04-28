import { test, expect } from '@playwright/test'

test.describe('TMC Tracker — smoke tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('loads and shows the navbar', async ({ page }) => {
    await expect(page.locator('nav.navbar')).toBeVisible()
    await expect(page.locator('.brand-text')).toContainText('TMC Tracker')
  })

  test('shows the item counter (X / Y format)', async ({ page }) => {
    const stats = page.locator('.stats')
    await expect(stats).toBeVisible()
    await expect(stats).toHaveText(/\d+ \/ \d+/)
  })

  test('overworld tab is active by default', async ({ page }) => {
    const overworldTab = page.locator('.map-tabs .tab').first()
    await expect(overworldTab).toHaveClass(/active/)
  })

  test('can switch to checklist panel', async ({ page }) => {
    const checklistTab = page.locator('.panel-tabs .tab').nth(1)
    await checklistTab.click()
    await expect(checklistTab).toHaveClass(/active/)
  })

  test('changelog link is visible', async ({ page }) => {
    await expect(page.locator('a.changelog-link')).toBeVisible()
  })

  test('changelog page loads', async ({ page }) => {
    await page.goto('/#/changelog')
    await expect(page.locator('nav.navbar')).toBeVisible()
  })

  test('no JS errors on load', async ({ page }) => {
    const errors = []
    page.on('pageerror', err => errors.push(err.message))
    await page.reload()
    await page.waitForTimeout(500)
    expect(errors).toHaveLength(0)
  })
})
