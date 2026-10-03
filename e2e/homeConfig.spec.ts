import { testHomeConfig } from '../src/config/testHomeConfig.ts'
import { expect, test } from './fixtures.ts'

test.describe('home.json missing', () => {
  test.use({ haOptions: { homeConfigMissing: true } })

  test('explains how to create home.json when the server has none', async ({ page }) => {
    await page.goto('/')
    const alert = page.getByRole('alert')
    await expect(alert).toContainText('home.example.json')
    await expect(alert).toContainText('HTTP 404')
    await expect(page.getByRole('heading', { name: 'Home' })).toBeHidden()
  })
})

test.describe('home.json invalid', () => {
  test.use({
    haOptions: {
      homeConfig: {
        ...testHomeConfig,
        leftOnRules: [{ ...testHomeConfig.leftOnRules[0] }, { id: 'x', minutes: 'soon' }],
      },
    },
  })

  test('names the invalid field when home.json has the wrong shape', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('alert')).toContainText('leftOnRules[1].label must be a string')
  })
})
