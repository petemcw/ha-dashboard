import type { Page } from '@playwright/test'
import { binarySensorState } from '../src/domains/binary_sensor/factories.ts'
import { entityState } from '../src/domains/factories.ts'
import { mediaPlayer } from '../src/domains/media_player/factories.ts'
import { personState } from '../src/domains/person/factories.ts'
import { batterySensorState } from '../src/domains/sensor/factories.ts'
import { SNOOZES_KEY } from '../src/features/home/attention/snoozes.ts'
import { expect, test } from './fixtures.ts'
import { sendFromAnotherClient } from './haMock.ts'

const lamp = (state: string) =>
  entityState({ entity_id: 'light.lamp', state, attributes: { friendly_name: 'Lamp' } })

test('renders the home screen against the mocked HA without a real token', async ({
  page,
  mockHa,
}) => {
  mockHa.setState(lamp('on'))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Favorites' })).toBeAttached()
})

test('shows the reconnecting state after the mock drops the socket, then recovers', async ({
  page,
  mockHa,
}) => {
  await page.goto('/')
  const favorites = page.getByRole('region', { name: 'Favorites' })
  await expect(favorites).toBeAttached()
  mockHa.drop()
  await expect(page.getByText('Connection lost. Reconnecting…')).toBeVisible()
  await expect(favorites).toBeAttached()
  await expect(page.getByText('Connection lost. Reconnecting…')).toBeHidden()
})

test('shows an entity change pushed by the mock without a reload', async ({ page, mockHa }) => {
  mockHa.setState(lamp('on'))
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Favorites' })).toBeAttached()
  // Nothing renders entity state yet, so watch the wire the way the store does: a live
  // subscription on the same page receives the compressed change event.
  const change = page.evaluate(
    () =>
      new Promise<unknown>((resolve) => {
        const ws = new WebSocket('ws://ha.mock.test/api/websocket')
        ws.onmessage = (ev) => {
          const msg = JSON.parse(String(ev.data))
          if (msg.type === 'auth_required')
            ws.send(JSON.stringify({ type: 'auth', access_token: 'x' }))
          if (msg.type === 'auth_ok') ws.send(JSON.stringify({ id: 1, type: 'subscribe_entities' }))
          if (msg.type === 'event' && msg.event.a) {
            ws.send(JSON.stringify({ id: 2, type: 'ping' }))
          }
          if (msg.type === 'event' && msg.event.c) resolve(msg.event.c)
        }
      }),
  )
  await expect
    .poll(() => mockHa.sent().filter((m) => m.type === 'subscribe_entities').length)
    .toBe(2)
  mockHa.setState(lamp('off'))
  expect(await change).toMatchObject({ 'light.lamp': { '+': { s: 'off' } } })
})

test('records every message type the page sends', async ({ page, mockHa }) => {
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Favorites' })).toBeAttached()
  const types = mockHa.sent().map((m) => m.type)
  expect(types).toContain('subscribe_entities')
  expect(types).toContain('supported_features')
})

test('rejects set_system_data from a non-admin mock user', async ({ page, mockHa }) => {
  mockHa.user.is_admin = false
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
  const reply = await sendFromAnotherClient(page, {
    type: 'frontend/set_system_data',
    key: 'k',
    value: 1,
  })
  expect(reply).toMatchObject({ success: false, error: { code: 'unauthorized' } })
  expect(mockHa.systemData.has('k')).toBe(false)
})

test('answers ping with pong', async ({ page, mockHa }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
  const reply = await sendFromAnotherClient(page, { type: 'ping' })
  expect(reply.type).toBe('pong')
  expect(mockHa.sent().some((m) => m.type === 'ping')).toBe(true)
})

// Seeds every region: an urgent item, a long unbreakable chore name, a snoozed chore, and
// missing-entity chores (the rules' entities are absent), so long text meets the layout.
const LONG = 'sensor_with_an_extremely_long_unbreakable_entity_identifier_that_wont_wrap_anywhere'

test.describe('home screen layout', () => {
  test.beforeEach(({ mockHa }) => {
    mockHa.setState(mediaPlayer('playing'))
    for (const [id, name, state] of [
      ['alex_rivera', 'Alex Rivera', 'home'],
      ['blair_kim', 'Blair Kim', 'not_home'],
      ['casey_lee', 'Casey Lee', 'Work'],
    ])
      mockHa.setState(personState({ entity_id: `person.${id}`, friendly_name: name, state }))
    mockHa.setState(
      binarySensorState({
        entity_id: 'binary_sensor.garage_door',
        state: 'on',
        last_changed: Math.floor(Date.now() / 1000) - 20 * 60,
      }),
    )
    mockHa.setState(
      batterySensorState({
        entity_id: 'sensor.long_battery',
        state: '9',
        attributes: { friendly_name: LONG },
      }),
    )
    mockHa.setState(
      batterySensorState({
        entity_id: 'sensor.snoozed_battery',
        state: '8',
        attributes: { friendly_name: `Snoozed ${LONG}` },
      }),
    )
    mockHa.systemData.set(SNOOZES_KEY, {
      version: 1,
      snoozes: {
        'battery-low:sensor.snoozed_battery': {
          until: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
          by: 'x',
        },
      },
    })
  })

  const expectNoHorizontalScroll = async (page: Page) => {
    const scrollWidth = await page.locator('html').evaluate((el) => el.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(page.viewportSize()!.width)
  }

  const boxOf = async (page: Page, name: string) => {
    const box = await page.getByRole('region', { name, exact: true }).boundingBox()
    if (!box) throw new Error(`${name} has no box`)
    return box
  }

  const SECTIONS = ['Needs attention', 'Suggestions', 'Favorites', 'Crypto']

  const layoutAt = async (page: Page) => {
    await expect(page.getByRole('region', { name: 'Crypto' })).toBeAttached()
    await expect(page.getByRole('region', { name: 'Suggestions' })).toBeVisible()
    await expect(page.getByRole('listitem', { name: 'Alex Rivera, home' })).toBeVisible()
    await expectNoHorizontalScroll(page)
    const [attention, suggestions, favorites, crypto] = await Promise.all(
      SECTIONS.map((n) => boxOf(page, n)),
    )
    return { attention, suggestions, favorites, crypto, people: await boxOf(page, 'People') }
  }

  test('reads people on the sign, then attention, suggestions, favorites, crypto', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Crypto' })).toBeAttached()
    await expect(page.getByRole('region', { name: 'Suggestions' })).toBeVisible()
    await expect(page.getByRole('listitem', { name: 'Alex Rivera, home' })).toBeVisible()
    const names = await page
      .locator('.sign section, main section')
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute('aria-label') ?? el.querySelector('h2')?.textContent),
      )
    expect(names).toEqual(['People', ...SECTIONS])
  })

  test('lays the home screen out in one column at phone width without horizontal scroll', async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'phone')
    await page.goto('/')
    await expect(page.getByRole('listitem', { name: 'Alex Rivera, home' })).toBeVisible()
    await page.screenshot({ path: 'e2e/screenshots/home-sign-phone.png' })
    await expect(page.getByText('1 snoozed')).toBeVisible()
    await page.getByText('1 snoozed').click()
    const { people, ...sections } = await layoutAt(page)
    const boxes = Object.values(sections)
    expect(new Set(boxes.map((b) => b.x)).size).toBe(1)
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y)
    // The faces sit under the sign's date, above the first section.
    expect(people.x).toBe(sections.attention.x)
    expect(people.y + people.height).toBeLessThan(sections.attention.y)
    await page.screenshot({ path: 'e2e/screenshots/home-layout-phone.png', fullPage: true })
  })

  for (const [label, width, height] of [
    ['ipad-portrait', 820, 1180],
    ['tablet', 1180, 820],
  ] as const) {
    test(`lays the home screen out in two columns at ${label} width`, async ({ page }) => {
      test.skip(test.info().project.name !== 'tablet')
      await page.setViewportSize({ width, height })
      await page.goto('/')
      const { attention, suggestions, favorites, crypto, people } = await layoutAt(page)
      // Attention, suggestions, and crypto stack on the left; favorites has the right.
      expect(suggestions.x).toBe(attention.x)
      expect(crypto.x).toBe(attention.x)
      expect(suggestions.y).toBeGreaterThanOrEqual(attention.y + attention.height)
      expect(crypto.y).toBeGreaterThanOrEqual(suggestions.y + suggestions.height)
      expect(favorites.x).toBeGreaterThan(attention.x + attention.width - 1)
      expect(Math.abs(favorites.y - attention.y)).toBeLessThan(2)
      expect(Math.abs(favorites.width - attention.width)).toBeLessThan(2)
      // The faces sit top right on the sign, above the columns.
      expect(people.x).toBeGreaterThan(width / 2)
      expect(people.y + people.height).toBeLessThan(attention.y)
      await page.screenshot({ path: `e2e/screenshots/home-layout-${label}.png`, fullPage: true })
    })
  }

  test('lays the home screen out in three columns at desktop width', async ({ page }) => {
    test.skip(test.info().project.name !== 'tablet')
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    const { attention, suggestions, favorites, crypto } = await layoutAt(page)
    expect(suggestions.x).toBe(attention.x)
    expect(favorites.x).toBeGreaterThan(attention.x + attention.width - 1)
    expect(crypto.x).toBeGreaterThan(favorites.x + favorites.width - 1)
    for (const box of [favorites, crypto]) {
      expect(Math.abs(box.y - attention.y)).toBeLessThan(2)
      expect(Math.abs(box.width - attention.width)).toBeLessThan(2)
    }
    await page.screenshot({ path: 'e2e/screenshots/home-layout-desktop.png', fullPage: true })
  })
})
