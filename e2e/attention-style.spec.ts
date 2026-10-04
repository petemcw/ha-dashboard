import type { Locator, Page } from '@playwright/test'
import { testHomeConfig } from '../src/config/testHomeConfig.ts'
import { binarySensorState } from '../src/domains/binary_sensor/factories.ts'
import { batterySensorState } from '../src/domains/sensor/factories.ts'
import { switchState } from '../src/domains/switch/factories.ts'
import { calmHouse } from '../src/features/home/attention/factories.ts'
import { expect, test } from './fixtures.ts'

const TWENTY_MIN_AGO = Math.floor(Date.now() / 1000) - 20 * 60
const openDoor = () =>
  binarySensorState({
    entity_id: 'binary_sensor.garage_door',
    state: 'on',
    last_changed: TWENTY_MIN_AGO,
  })
const lowBattery = () =>
  batterySensorState({
    entity_id: 'sensor.front_door_battery',
    state: '12',
    attributes: { friendly_name: 'Front door battery' },
  })

const house = [
  ...calmHouse(),
  switchState({ entity_id: 'switch.garage_door_opener', state: 'off' }),
]
const region = (page: Page) => page.getByRole('region', { name: 'Needs attention' })
const style = (el: Locator, prop: string) =>
  el.evaluate(
    (node, p) => node.ownerDocument.defaultView!.getComputedStyle(node).getPropertyValue(p),
    prop,
  )

test.describe('attention row colours', () => {
  test.use({ haOptions: { entities: house } })

  // Literal values from the design tokens (src/app/theme/tokens.css), per colour scheme.
  const schemes = {
    light: {
      urgentBadge: 'rgb(153, 27, 19)',
      choreBadge: 'rgb(246, 230, 200)',
      choreInk: 'rgb(168, 106, 18)',
      choreRow: 'rgb(245, 233, 218)',
    },
    dark: {
      urgentBadge: 'rgb(240, 112, 95)',
      choreBadge: 'rgb(51, 36, 14)',
      choreInk: 'rgb(224, 160, 48)',
      choreRow: 'rgb(20, 13, 10)',
    },
  } as const

  for (const [scheme, want] of Object.entries(schemes)) {
    test(`shows a red badge for urgent items and an ochre badge for chores in ${scheme}`, async ({
      page,
      mockHa,
    }) => {
      await page.emulateMedia({ colorScheme: scheme as 'light' | 'dark' })
      mockHa.setState(openDoor())
      mockHa.setState(lowBattery())
      await page.goto('/')
      const urgent = region(page).locator('.attention-item--urgent .attention-item__badge')
      const chore = region(page).locator('.attention-item--chore .attention-item__badge')
      await expect(urgent).toBeVisible()
      expect(await style(urgent, 'background-color')).toBe(want.urgentBadge)
      expect(await style(chore, 'color')).toBe(want.choreInk)
    })

    test(`tints chore rows and softens their badge as in the mock-up in ${scheme}`, async ({
      page,
      mockHa,
    }) => {
      await page.emulateMedia({ colorScheme: scheme as 'light' | 'dark' })
      mockHa.setState(lowBattery())
      await page.goto('/')
      const row = region(page).locator('.attention-item--chore')
      await expect(row).toBeVisible()
      expect(await style(row, 'background-color')).toBe(want.choreRow)
      expect(await style(row.locator('.attention-item__badge'), 'background-color')).toBe(
        want.choreBadge,
      )
    })
  }
})

test.describe('pending action button', () => {
  test.use({ haOptions: { entities: house } })

  test('dims the icon of an action button while it is pending', async ({ page, mockHa }) => {
    mockHa.setState(openDoor())
    await page.goto('/')
    const button = region(page).getByRole('button', { name: 'Close garage door' })
    const icon = button.locator('svg')
    await expect(button).toBeEnabled()
    expect(await style(icon, 'opacity')).toBe('1')
    // The mock answers a service call at once, so hold the button in its pending state by
    // setting the attribute useAction sets while a call is in flight.
    await button.evaluate((el) => el.setAttribute('aria-disabled', 'true'))
    expect(Number(await style(icon, 'opacity'))).toBeLessThan(0.7)
  })
})

test.describe('attention row layout on a phone', () => {
  const longLabel = 'Garage door that someone keeps leaving open overnight after the late shift'
  test.use({
    haOptions: {
      entities: house,
      homeConfig: {
        ...testHomeConfig,
        leftOnRules: testHomeConfig.leftOnRules.map((r) =>
          r.id === 'garage-door' ? { ...r, label: longLabel } : r,
        ),
      },
    },
  })

  test('keeps a row’s actions on the same line, right-aligned, under a long title on a phone', async ({
    page,
    mockHa,
  }) => {
    await page.setViewportSize({ width: 393, height: 852 })
    mockHa.setState(openDoor())
    await page.goto('/')
    const row = region(page).locator('.attention-item--urgent')
    const title = row.getByText(longLabel)
    await expect(title).toBeVisible()
    const rowBox = (await row.boundingBox())!
    const textBox = (await title.boundingBox())!
    const actions = (await row.locator('.attention-item__actions').boundingBox())!
    const buttons = row.locator('.attention-item__actions').getByRole('button')
    expect(await buttons.count()).toBe(2)
    const first = (await buttons.nth(0).boundingBox())!
    const second = (await buttons.nth(1).boundingBox())!

    // The title wraps onto several lines while the buttons stay beside it, not under it.
    expect(textBox.height).toBeGreaterThan(40)
    expect(actions.x).toBeGreaterThanOrEqual(textBox.x + textBox.width - 1)
    expect(first.y).toBe(second.y)
    // Flush right inside the row's padding.
    expect(rowBox.x + rowBox.width - (second.x + second.width)).toBeLessThanOrEqual(16)
    expect(rowBox.x + rowBox.width - (second.x + second.width)).toBeGreaterThanOrEqual(0)
  })
})

test.describe('armed and snooze controls over the row text', () => {
  test.use({ haOptions: { entities: house } })

  // Where the row and its title sit, and how blurred the text is.
  const measure = async (page: Page) => {
    const row = region(page).locator('.attention-item--urgent')
    const text = row.locator('.attention-item__text')
    return {
      row: (await row.boundingBox())!,
      title: (await row.getByText('Garage door', { exact: true }).boundingBox())!,
      text: (await text.boundingBox())!,
      filter: await style(text, 'filter'),
    }
  }
  const settle = (page: Page) => page.waitForTimeout(400)

  test('the armed confirm slides over the text, blurring it, without reflowing the row', async ({
    page,
    mockHa,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    mockHa.setState(openDoor())
    await page.goto('/')
    await expect(region(page).getByRole('button', { name: 'Close garage door' })).toBeVisible()
    const before = await measure(page)
    expect(before.filter).toBe('none')

    await region(page).getByRole('button', { name: 'Close garage door' }).click()
    const armed = region(page).getByRole('button', { name: 'Confirm close garage door' })
    await settle(page)
    const after = await measure(page)
    expect(after.row).toEqual(before.row)
    expect(after.title).toEqual(before.title)
    // It reaches into the text's column rather than pushing the text aside.
    expect((await armed.boundingBox())!.x).toBeLessThan(before.text.x + before.text.width)
    expect(after.filter).toContain('blur')

    await page.mouse.click(5, 5)
    await settle(page)
    expect((await measure(page)).filter).toBe('none')
  })

  test('the snooze choices open over the text, blurring it, without reflowing the row', async ({
    page,
    mockHa,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    mockHa.setState(openDoor())
    await page.goto('/')
    await expect(region(page).getByRole('button', { name: 'Snooze Garage door' })).toBeVisible()
    const before = await measure(page)

    await region(page).getByRole('button', { name: 'Snooze Garage door' }).click()
    const choices = region(page).getByRole('group', { name: 'Snooze Garage door' })
    await expect(choices.getByRole('button', { name: '1 day' })).toBeFocused()
    await settle(page)
    const after = await measure(page)
    expect(after.row).toEqual(before.row)
    expect(after.title).toEqual(before.title)
    const group = (await choices.boundingBox())!
    expect(group.x).toBeLessThan(before.text.x + before.text.width)
    // One line, inside the row.
    expect(group.height).toBeLessThan(before.row.height)
    expect(group.x).toBeGreaterThanOrEqual(before.row.x)
    expect(after.filter).toContain('blur')

    await choices.getByRole('button', { name: 'Cancel' }).click()
    await expect(choices).toBeHidden()
    await expect(region(page).getByRole('button', { name: 'Snooze Garage door' })).toBeFocused()
    await settle(page)
    expect((await measure(page)).filter).toBe('none')
  })
})
