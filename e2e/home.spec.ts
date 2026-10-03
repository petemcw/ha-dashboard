import type { Page } from '@playwright/test'
import { binarySensorState } from '../src/domains/binary_sensor/factories.ts'
import { entityState } from '../src/domains/factories.ts'
import { mediaPlayer } from '../src/domains/media_player/factories.ts'
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
    mockHa.setState(
      binarySensorState({
        entity_id: 'binary_sensor.garage_door_status',
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

  test('shows the sections in order: attention, suggestions, presence, favorites, crypto', async ({
    page,
  }) => {
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Crypto' })).toBeAttached()
    await expect(page.getByRole('region', { name: 'Suggestions' })).toBeVisible()
    const names = await page
      .locator('main section')
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute('aria-label') ?? el.querySelector('h2')?.textContent),
      )
    expect(names).toEqual(['Needs attention', 'Suggestions', 'People', 'Favorites', 'Crypto'])
  })

  test('lays the home screen out in one column at phone width without horizontal scroll', async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'phone')
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Crypto' })).toBeAttached()
    await expect(page.getByText('1 snoozed')).toBeVisible()
    await page.getByText('1 snoozed').click()
    await expectNoHorizontalScroll(page)
    const lefts = await Promise.all(
      ['Needs attention', 'Suggestions', 'People', 'Favorites', 'Crypto'].map((n) =>
        boxOf(page, n),
      ),
    )
    expect(new Set(lefts.map((b) => b.x)).size).toBe(1)
    for (let i = 1; i < lefts.length; i++) expect(lefts[i].y).toBeGreaterThan(lefts[i - 1].y)
    await page.screenshot({ path: 'e2e/screenshots/home-layout-phone.png', fullPage: true })
  })

  test('lays the home screen out in two columns at tablet width', async ({ page }) => {
    test.skip(test.info().project.name !== 'tablet')
    await page.goto('/')
    await expect(page.getByRole('region', { name: 'Crypto' })).toBeAttached()
    const [attention, suggestions, presence, favorites, crypto] = await Promise.all(
      ['Needs attention', 'Suggestions', 'People', 'Favorites', 'Crypto'].map((n) =>
        boxOf(page, n),
      ),
    )
    // Attention and suggestions span the top; presence and crypto sit beside favorites.
    expect(suggestions.y).toBeGreaterThanOrEqual(attention.y + attention.height)
    expect(presence.y).toBeGreaterThanOrEqual(suggestions.y + suggestions.height)
    expect(favorites.x).toBeGreaterThan(presence.x + presence.width - 1)
    expect(crypto.x).toBe(presence.x)
    expect(crypto.y).toBeGreaterThan(presence.y)
    // Inner heading margins differ by a few px; the rows share a top.
    expect(Math.abs(favorites.y - presence.y)).toBeLessThan(40)
    expect(attention.width).toBeGreaterThan(presence.width * 1.5)
    await expectNoHorizontalScroll(page)
    await page.screenshot({ path: 'e2e/screenshots/home-layout-tablet.png', fullPage: true })
  })
})
