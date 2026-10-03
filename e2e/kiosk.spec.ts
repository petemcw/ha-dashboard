import { expect, test } from './fixtures.ts'

test.use({ seedToken: false, haOptions: { rejectTokens: ['revoked-token'] } })

test('sets up a fresh kiosk with a pasted token', async ({ page, mockHa }) => {
  await page.goto('/?kiosk')
  await page.getByLabel('Long-lived access token').fill('kiosk-token')
  await page.getByRole('button', { name: 'Connect' }).click()
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
  await expect.poll(() => mockHa.authTokens).toEqual(['kiosk-token'])
  expect(page.url()).not.toContain('kiosk')
})

test('asks again when the pasted token is rejected, then accepts a good one', async ({
  page,
  mockHa,
}) => {
  await page.goto('/?kiosk')
  await page.getByLabel('Long-lived access token').fill('revoked-token')
  await page.getByRole('button', { name: 'Connect' }).click()
  await expect(page.getByRole('alert')).toHaveText('Home Assistant rejected that token.')
  await page.getByLabel('Long-lived access token').fill('kiosk-token')
  await page.getByRole('button', { name: 'Connect' }).click()
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
  await expect.poll(() => mockHa.authTokens).toEqual(['revoked-token', 'kiosk-token'])
})
