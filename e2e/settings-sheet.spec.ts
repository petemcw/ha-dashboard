import type { Page } from '@playwright/test'
import { expect, test } from './fixtures.ts'

async function openSheet(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Settings' }).click()
  const sheet = page.getByRole('dialog', { name: 'Settings' })
  await expect(sheet).toBeVisible()
  // Let the opening spring settle before grabbing it.
  await expect
    .poll(() => sheet.evaluate((el) => getComputedStyle(el).transform))
    .toMatch(/matrix\(1, 0, 0, 1, 0, 0\)|none/)
  return sheet
}

async function grabberCenter(page: Page) {
  const box = await page.locator('.sheet__grabber').boundingBox()
  return { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 }
}

test('closes when the sheet is flicked down by its handle', async ({ page }) => {
  const sheet = await openSheet(page)
  const { x, y } = await grabberCenter(page)
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (const dy of [40, 90, 150]) await page.mouse.move(x, y + dy)
  await page.mouse.up()
  await expect(sheet).toBeHidden()
})

test('springs back open after a short, slow drag', async ({ page }) => {
  const sheet = await openSheet(page)
  const { x, y } = await grabberCenter(page)
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let dy = 4; dy <= 40; dy += 4) {
    await page.mouse.move(x, y + dy)
    await page.waitForTimeout(30)
  }
  // Hold still so the release carries no momentum.
  await page.waitForTimeout(150)
  await page.mouse.up()
  await expect(sheet).toBeVisible()
  await expect
    .poll(() => sheet.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42))
    .toBeCloseTo(0, 0)
})

test('still closes with the Close button and Escape', async ({ page }) => {
  let sheet = await openSheet(page)
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(sheet).toBeHidden()
  sheet = await openSheet(page)
  await page.keyboard.press('Escape')
  await expect(sheet).toBeHidden()
})
