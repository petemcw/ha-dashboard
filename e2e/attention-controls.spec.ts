import type { Locator, Page } from '@playwright/test'
import { scriptState } from '../src/domains/script/factories.ts'
import { sensorState } from '../src/domains/sensor/factories.ts'
import { binarySensorState } from '../src/domains/binary_sensor/factories.ts'
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

test.use({
  haOptions: {
    entities: [
      ...calmHouse(),
      switchState({ entity_id: 'switch.garage_door_opener', state: 'off' }),
    ],
  },
})

const toggles = (mockHa: { sent(): { type: string }[] }) =>
  mockHa.sent().filter((m) => m.type === 'call_service')

test('closing the garage door takes two taps and sends one switch.toggle', async ({
  page,
  mockHa,
}) => {
  mockHa.setState(openDoor())
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  const close = region.getByRole('button', { name: 'Close garage door' })
  await expect(close).toBeEnabled()
  await close.click()
  expect(toggles(mockHa)).toHaveLength(0)

  const confirm = region.getByRole('button', { name: 'Confirm close garage door' })
  await expect(confirm).toBeVisible()
  await page.waitForTimeout(600)
  await confirm.click()

  await expect
    .poll(() => toggles(mockHa))
    .toMatchObject([
      { domain: 'switch', service: 'toggle', target: { entity_id: 'switch.garage_door_opener' } },
    ])
  // The item stays until HA reports the door closed.
  mockHa.setState(binarySensorState({ entity_id: 'binary_sensor.garage_door', state: 'off' }))
  await expect(region.getByText('Garage door', { exact: true })).toBeHidden()
})

test('sends nothing when the door closed between the two taps', async ({ page, mockHa }) => {
  mockHa.setState(openDoor())
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  await region.getByRole('button', { name: 'Close garage door' }).click()
  await expect(region.getByRole('button', { name: 'Confirm close garage door' })).toBeVisible()
  mockHa.setState(binarySensorState({ entity_id: 'binary_sensor.garage_door', state: 'off' }))
  await expect(region.getByText('Garage door', { exact: true })).toBeHidden()
  await page.waitForTimeout(600)
  expect(toggles(mockHa)).toHaveLength(0)
})

test('Mark replaced takes two taps and sends one script.turn_on for the reset script', async ({
  page,
  mockHa,
}) => {
  mockHa.setState(sensorState({ entity_id: 'sensor.water_filter_days_remaining', state: '-4' }))
  mockHa.setState(scriptState({ entity_id: 'script.reset_water_filter' }))
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  const mark = region.getByRole('button', { name: 'Mark replaced' })
  await expect(mark).toBeEnabled()
  await mark.click()
  expect(toggles(mockHa)).toHaveLength(0)

  const confirm = region.getByRole('button', { name: 'Confirm mark replaced' })
  await expect(confirm).toBeVisible()
  await page.waitForTimeout(600)
  await confirm.click()

  await expect
    .poll(() => toggles(mockHa))
    .toMatchObject([
      { domain: 'script', service: 'turn_on', target: { entity_id: 'script.reset_water_filter' } },
    ])
  // The chore goes when the days-remaining sensor is back above the threshold.
  mockHa.setState(sensorState({ entity_id: 'sensor.water_filter_days_remaining', state: '90' }))
  await expect(region.getByText('Water filter', { exact: true })).toBeHidden()
})

test('the confirm label slides open when armed and closed when disarmed, unless motion is reduced', async ({
  page,
  mockHa,
}) => {
  mockHa.setState(openDoor())
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  const label = region.locator('.button--confirm .button__confirm-text')
  const arm = async () => {
    await region.getByRole('button', { name: 'Close garage door' }).click()
    const armed = region.getByRole('button', { name: 'Confirm close garage door' })
    await expect(label).toBeVisible()
    return armed
  }
  const duration = (el: Locator) =>
    el.evaluate((node) =>
      parseFloat(node.ownerDocument.defaultView!.getComputedStyle(node).transitionDuration),
    )

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  // Collapsed, not absent: a transition can only run back from where the label is.
  await expect(label).toBeAttached()
  await expect(label).toBeHidden()
  expect(await duration(label)).toBeGreaterThan(0)
  await arm()
  // Disarming collapses the label again instead of dropping it in one frame.
  await page.mouse.click(5, 5)
  await expect(region.getByRole('button', { name: 'Close garage door' })).toBeVisible()
  await expect(label).toBeAttached()
  await expect(label).toBeHidden()

  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await duration(label)).toBe(0)
  const still = await arm()
  // The button and everything inside it, not just its children.
  const running = await still.evaluate((el) => el.getAnimations({ subtree: true }).length)
  expect(running).toBe(0)
})

test('tapping elsewhere disarms the confirm without sending', async ({ page, mockHa }) => {
  mockHa.setState(openDoor())
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  await region.getByRole('button', { name: 'Close garage door' }).click()
  await expect(region.getByRole('button', { name: 'Confirm close garage door' })).toBeVisible()
  await page.mouse.click(5, 5)
  await expect(region.getByRole('button', { name: 'Close garage door' })).toBeVisible()
  expect(toggles(mockHa)).toHaveLength(0)
})

// Records every attention row or card that was ever marked leaving, and whether it was
// inert by then, since a leave lasts a quarter of a second.
const recordLeaving = (page: Page) =>
  page.addInitScript(`
    window.leaving = []
    new MutationObserver((records) => {
      for (const { target } of records)
        for (const name of ['attention-item--leaving', 'card--leaving'])
          if (target.classList.contains(name)) window.leaving.push(name + ' inert=' + target.inert)
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ['class'] })
  `)
const leaving = (page: Page) => page.evaluate('window.leaving') as Promise<string[]>
const closedDoor = () => binarySensorState({ entity_id: 'binary_sensor.garage_door', state: 'off' })

test('a resolved row and the emptied card fold away instead of vanishing', async ({
  page,
  mockHa,
}) => {
  await recordLeaving(page)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  mockHa.setState(openDoor())
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  await expect(region.getByText('Garage door', { exact: true })).toBeVisible()

  mockHa.setState(closedDoor())
  await expect(region).toBeHidden()
  expect(await leaving(page)).toEqual(
    expect.arrayContaining(['attention-item--leaving inert=true', 'card--leaving inert=true']),
  )
})

test('a resolved row goes at once with reduced motion', async ({ page, mockHa }) => {
  await recordLeaving(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  mockHa.setState(openDoor())
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Needs attention' })
  await expect(region.getByText('Garage door', { exact: true })).toBeVisible()

  mockHa.setState(closedDoor())
  await expect(region).toBeHidden()
  expect(await leaving(page)).toEqual([])
})
