import { expect, test } from './fixtures.ts'

test('keeps retrying while Home Assistant is down at startup, then loads once it is back', async ({
  page,
  mockHa,
}) => {
  mockHa.setReachable(false)
  await page.goto('/')
  await expect(page.getByText("Can't reach Home Assistant. Retrying…")).toBeVisible()
  expect(await page.getByRole('alert').count()).toBe(0)

  mockHa.setReachable(true)
  await expect(page.getByRole('region', { name: 'Favorites' })).toBeAttached({ timeout: 15_000 })
  await expect(page.getByText("Can't reach Home Assistant. Retrying…")).toBeHidden()
})

test('notices a silently dead socket, shows the banner, and recovers on a fresh socket', async ({
  page,
  mockHa,
}) => {
  await page.clock.install()
  await page.goto('/')
  const favorites = page.getByRole('region', { name: 'Favorites' })
  await expect(favorites).toBeAttached()

  mockHa.stall()
  // 30 s to the next ping, then 10 s without a pong.
  await page.clock.runFor(41_000)
  await expect(page.getByText('Connection lost. Reconnecting…')).toBeVisible()

  // The library retries after a second, on a socket that answers.
  await page.clock.runFor(5_000)
  await expect(page.getByText('Connection lost. Reconnecting…')).toBeHidden()
  await expect(favorites).toBeAttached()
})
