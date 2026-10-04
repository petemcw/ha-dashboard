import type { Locator } from '@playwright/test'
import { lightState } from '../src/domains/light/factories.ts'
import { switchState } from '../src/domains/switch/factories.ts'
import { FAVORITES_KEY as KEY } from '../src/features/home/favorites/favoritesValue.ts'
import { expect, test } from './fixtures.ts'
import { sendFromAnotherClient } from './haMock.ts'

const saved = (...entityIds: string[]) => ({ version: 1, entityIds })

test.use({
  haOptions: {
    entities: [
      lightState({
        entity_id: 'light.kitchen',
        state: 'on',
        attributes: { friendly_name: 'Kitchen', brightness: 128 },
      }),
      switchState({
        entity_id: 'switch.fan',
        state: 'off',
        attributes: { friendly_name: 'Desk fan' },
      }),
    ],
  },
})

test('shows an Add favorites prompt that opens settings when nothing is saved', async ({
  page,
  mockHa,
}) => {
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Favorites' })
  await expect(region).toContainText('No favorites yet')
  await region.getByRole('button', { name: 'Add favorites' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  expect(mockHa.sent().filter((m) => m.type === 'call_service')).toHaveLength(0)
})

test('shows saved favorites in order with state, and a missing one as missing', async ({
  page,
  mockHa,
}) => {
  mockHa.userData.set(KEY, saved('switch.fan', 'light.kitchen', 'light.gone'))
  await page.goto('/')
  const items = page.getByRole('region', { name: 'Favorites' }).getByRole('listitem')
  await expect(items).toHaveText(['Desk fanOff', 'KitchenOn, 50%', 'light.goneMissing'])
  await page.screenshot({ path: 'e2e/screenshots/favorites.png' })
})

test('shows favorites saved on another device without a reload', async ({ page, mockHa }) => {
  await page.goto('/')
  const region = page.getByRole('region', { name: 'Favorites' })
  await expect(region).toContainText('No favorites yet')
  await sendFromAnotherClient(page, {
    type: 'frontend/set_user_data',
    key: KEY,
    value: saved('light.kitchen'),
  })
  await expect(region.getByRole('listitem')).toHaveText(['KitchenOn, 50%'])
  expect(mockHa.userData.get(KEY)).toEqual(saved('light.kitchen'))
})

test('treats a stored value with an unknown version as no favorites', async ({ page, mockHa }) => {
  mockHa.userData.set(KEY, { version: 9, entityIds: ['light.kitchen'] })
  await page.goto('/')
  await expect(page.getByRole('region', { name: 'Favorites' })).toContainText('No favorites yet')
  expect(mockHa.sent().filter((m) => m.type === 'frontend/set_user_data')).toHaveLength(0)
})

test.describe('favorite tiles', () => {
  test.use({
    haOptions: {
      entities: [
        lightState({
          entity_id: 'light.kitchen',
          state: 'on',
          attributes: { friendly_name: 'Kitchen' },
        }),
        lightState({
          entity_id: 'light.floor',
          state: 'off',
          attributes: { friendly_name: 'Living room floor lamp' },
        }),
        switchState({ entity_id: 'switch.fan', attributes: { friendly_name: 'Desk fan' } }),
        switchState({ entity_id: 'switch.heater', attributes: { friendly_name: 'Heater' } }),
      ],
    },
  })

  test.beforeEach(({ mockHa }) => {
    mockHa.userData.set(KEY, saved('light.kitchen', 'light.floor', 'switch.fan', 'switch.heater'))
  })

  test('wraps a long name onto a second line instead of cutting it off', async ({ page }) => {
    await page.goto('/')
    const region = page.getByRole('region', { name: 'Favorites' })
    const size = (name: string) =>
      region.getByText(name, { exact: true }).evaluate((el) => ({
        height: el.getBoundingClientRect().height,
        cutOff: el.scrollWidth > el.clientWidth,
      }))
    const short = await size('Kitchen')
    const long = await size('Living room floor lamp')
    expect(long.cutOff).toBe(false)
    // Two lines, not one; the clamp still stops it at two.
    expect(long.height).toBeGreaterThan(short.height * 1.5)
    expect(long.height).toBeLessThan(short.height * 2.5)
  })

  test('lights an on tile and its icon in the leaf colour, and not an off one', async ({
    page,
  }) => {
    await page.goto('/')
    const region = page.getByRole('region', { name: 'Favorites' })
    await expect(region.getByRole('button', { name: 'Kitchen' })).toBeVisible()
    // The theme's leaf tokens, resolved to the same rgb() form a computed style uses.
    const token = (name: string) =>
      page.locator('body').evaluate((body, v) => {
        const probe = body.ownerDocument.createElement('div')
        probe.style.backgroundColor = `var(${v})`
        body.append(probe)
        const color = body.ownerDocument.defaultView!.getComputedStyle(probe).backgroundColor
        probe.remove()
        return color
      }, name)
    const leaf = await token('--leaf')
    const leafSoft = await token('--leaf-soft')
    const tile = (name: string) => region.getByRole('listitem').filter({ hasText: name })
    const icon = (name: string) => tile(name).locator('svg')

    await expect(tile('Kitchen')).toHaveCSS('background-color', leafSoft)
    await expect(icon('Kitchen')).toHaveCSS('background-color', leaf)
    await expect(tile('Desk fan')).not.toHaveCSS('background-color', leafSoft)
    await expect(icon('Desk fan')).not.toHaveCSS('background-color', leaf)
  })

  test('dims a pending tile as a whole, without dimming its icon a second time', async ({
    page,
  }) => {
    await page.goto('/')
    const button = page.getByRole('region', { name: 'Favorites' }).getByRole('button', {
      name: 'Kitchen',
    })
    await expect(button).toBeVisible()
    const opacity = (el: Locator) =>
      el.evaluate((node) => node.ownerDocument.defaultView!.getComputedStyle(node).opacity)
    // The mock answers at once, so hold the pending state with the attribute useAction sets.
    await button.evaluate((el) => el.setAttribute('aria-disabled', 'true'))
    expect(await opacity(button)).toBe('0.6')
    expect(await opacity(button.locator('svg'))).toBe('1')
  })

  test('eases a tile and its icon between off and on, but not with reduced motion', async ({
    page,
  }) => {
    await page.goto('/')
    const region = page.getByRole('region', { name: 'Favorites' })
    await expect(region.getByRole('button', { name: 'Kitchen' })).toBeVisible()
    const tile = region.getByRole('listitem').filter({ hasText: 'Kitchen' })
    const easing = (el: Locator) =>
      el.evaluate((node) => {
        const s = node.ownerDocument.defaultView!.getComputedStyle(node)
        return { property: s.transitionProperty, duration: parseFloat(s.transitionDuration) }
      })

    await page.emulateMedia({ reducedMotion: 'no-preference' })
    for (const el of [tile, tile.locator('svg')]) {
      const { property, duration } = await easing(el)
      expect(property).toContain('background-color')
      expect(duration).toBeGreaterThan(0)
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    for (const el of [tile, tile.locator('svg')]) expect((await easing(el)).duration).toBe(0)
  })

  test.describe('in a phone-width card', () => {
    test.use({ viewport: { width: 393, height: 852 } })

    test('lays tiles out three across with a 10 px gap, each at least 74 px tall', async ({
      page,
    }) => {
      await page.goto('/')
      const tiles = page.getByRole('region', { name: 'Favorites' }).getByRole('listitem')
      await expect(tiles).toHaveCount(4)
      const boxes = await tiles.evaluateAll((items) =>
        items.map((li) => {
          const b = li.getBoundingClientRect()
          return { x: b.x, y: b.y, width: b.width, height: b.height }
        }),
      )
      const [a, b, c, d] = boxes
      // Three on the first row, the fourth wraps to the next.
      expect([b.y, c.y]).toEqual([a.y, a.y])
      expect(d.y).toBeGreaterThan(a.y)
      expect(b.x - (a.x + a.width)).toBeCloseTo(10, 0)
      expect(d.y - (a.y + a.height)).toBeCloseTo(10, 0)
      for (const box of boxes) {
        expect(box.width).toBeGreaterThanOrEqual(96)
        expect(box.height).toBeGreaterThanOrEqual(74)
      }
    })
  })

  test('opens the favorites editor from the card header', async ({ page, mockHa }) => {
    await page.goto('/')
    const region = page.getByRole('region', { name: 'Favorites' })
    await region.getByRole('button', { name: 'Edit favorites' }).click()
    const editor = page.getByRole('dialog').getByRole('list', { name: 'Your favorites' })
    await expect(editor).toBeInViewport()
    await expect(editor.getByRole('listitem')).toHaveCount(4)
    expect(mockHa.sent().filter((m) => m.type === 'call_service')).toHaveLength(0)
  })
})
