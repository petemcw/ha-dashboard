import { binarySensorState } from '../src/domains/binary_sensor/factories.ts'
import { switchState } from '../src/domains/switch/factories.ts'
import { mediaPlayer } from '../src/domains/media_player/factories.ts'
import { lightState } from '../src/domains/light/factories.ts'
import { calmHouse } from '../src/features/home/attention/factories.ts'
import {
  PLACEHOLDER_AREAS,
  PLACEHOLDER_FLOORS,
  placeRegistries,
} from '../src/infrastructure/fakeHa/placeholderRegistries.ts'
import type { Locator, Page } from '@playwright/test'
import { expect, liveTest, test } from './fixtures.ts'

const light = (id: string, name: string, attributes: Record<string, unknown> = {}) =>
  lightState({ entity_id: id, state: 'on', attributes: { friendly_name: name, ...attributes } })

const { devices, entityRegistry } = placeRegistries({
  living_room: ['light.living_room_lamp', 'light.living_room_strip'],
  kitchen: ['light.kitchen_ceiling', 'media_player.kitchen_speaker', 'media_player.kitchen_radio'],
  bedroom: ['light.bedside'],
  garage: ['switch.garage_door_opener'],
})

test.use({
  haOptions: {
    entities: [
      ...calmHouse(),
      // Something to need attention, so the card is there to sit below the selector.
      binarySensorState({
        entity_id: 'binary_sensor.garage_door',
        state: 'on',
        last_changed: Math.floor(Date.now() / 1000) - 20 * 60,
      }),
      // The lamp dims; the other lights only turn on and off.
      light('light.living_room_lamp', 'Lamp', {
        supported_color_modes: ['brightness'],
        brightness: 128,
      }),
      // The strip does color temperature and color, so it has the ⋯ button and its sheet.
      light('light.living_room_strip', 'Strip', {
        supported_color_modes: ['color_temp', 'xy'],
        color_mode: 'color_temp',
        color_temp_kelvin: 3000,
        min_color_temp_kelvin: 2000,
        max_color_temp_kelvin: 6500,
        brightness: 200,
      }),
      light('light.kitchen_ceiling', 'Ceiling'),
      light('light.bedside', 'Bedside'),
      // Features: pause 1, volume set 4, previous 16, next 32, turn on 128, turn off 256, play 16384.
      mediaPlayer('playing', {
        entity_id: 'media_player.kitchen_speaker',
        attributes: {
          friendly_name: 'Kitchen speaker',
          media_title: 'Blue Train',
          media_artist: 'John Coltrane',
          supported_features: 1 + 4 + 16 + 32 + 256 + 16384,
          volume_level: 0.4,
        },
      }),
      mediaPlayer('off', {
        entity_id: 'media_player.kitchen_radio',
        attributes: { friendly_name: 'Kitchen radio', supported_features: 128 + 256 },
      }),
      switchState({
        entity_id: 'switch.garage_door_opener',
        state: 'off',
        attributes: { friendly_name: 'Garage opener' },
      }),
    ],
    areas: PLACEHOLDER_AREAS,
    floors: PLACEHOLDER_FLOORS,
    devices,
    entityRegistry,
  },
})

test('shows the room selector above Needs attention on phone and tablet', async ({ page }) => {
  await page.goto('/')
  const selector = page.getByRole('button', { name: /^Room: Auto/ })
  await expect(selector).toBeVisible()
  const attention = page.getByRole('region', { name: 'Needs attention', exact: true })
  const [s, a] = [await selector.boundingBox(), await attention.boundingBox()]
  expect(s!.y + s!.height).toBeLessThanOrEqual(a!.y)
  expect(s!.x).toBe(a!.x)
  await page.screenshot({
    path: `e2e/screenshots/room-selector-${test.info().project.name}.png`,
    fullPage: true,
  })
})

test("lines the selector's top up with Favorites on a tablet", async ({ page }) => {
  test.skip(test.info().project.name !== 'tablet')
  await page.goto('/')
  const selector = await page.getByRole('button', { name: /^Room: Auto/ }).boundingBox()
  const favorites = await page.getByRole('region', { name: 'Favorites' }).boundingBox()
  expect(Math.abs(selector!.y - favorites!.y)).toBeLessThan(2)
})

test('picks a room from the sheet and keeps it after a reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Room: Auto/ }).click()
  const group = page.getByRole('radiogroup', { name: 'Room' })
  await expect(group.getByRole('heading', { level: 3 })).toHaveText([
    'Ground Floor',
    'Upstairs',
    'Other',
  ])
  await page.screenshot({ path: `e2e/screenshots/room-picker-${test.info().project.name}.png` })
  await group.getByText('Bedroom').click()
  await expect(page.getByRole('dialog')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Room: Bedroom' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Room: Bedroom' })).toBeVisible()
})

test('shows the picked room as a card after Suggestions and toggles its light', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Room: Auto/ }).click()
  await page.getByRole('radiogroup', { name: 'Room' }).getByText('Living Room').click()
  const card = page.getByRole('region', { name: 'Living Room' })
  await expect(card).toBeVisible()

  const attention = await page
    .getByRole('region', { name: 'Needs attention', exact: true })
    .boundingBox()
  const box = await card.boundingBox()
  const favorites = await page.getByRole('region', { name: 'Favorites' }).boundingBox()
  if (test.info().project.name === 'phone') {
    // Selector, attention, suggestions, room, favorites: one column, in that order.
    expect(box!.y).toBeGreaterThan(attention!.y + attention!.height)
    expect(box!.y + box!.height).toBeLessThanOrEqual(favorites!.y)
  } else {
    // Column 1 beneath attention, beside Favorites in column 2.
    expect(box!.x).toBe(attention!.x)
    expect(box!.y).toBeGreaterThan(attention!.y + attention!.height)
  }

  const lamp = card.getByRole('button', { name: /Lamp/ })
  await expect(lamp).toContainText('On')
  await lamp.click()
  await expect(card.getByRole('button', { name: /Lamp/ })).toContainText('Off')
  await page.screenshot({
    path: `e2e/screenshots/room-card-${test.info().project.name}.png`,
    fullPage: true,
  })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.screenshot({
    path: `e2e/screenshots/room-card-dark-${test.info().project.name}.png`,
    fullPage: true,
  })
})

test('asks for a second tap on the garage opener in its room card', async ({ page, mockHa }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Room: Auto/ }).click()
  await page.getByRole('radiogroup', { name: 'Room' }).getByText('Garage').click()
  const card = page.getByRole('region', { name: 'Garage' })
  await card.getByRole('button', { name: /Garage opener/ }).click()
  const armed = card.getByRole('button', { name: 'Confirm: turn on Garage opener' })
  await expect(armed).toContainText('Confirm?')
  await page.screenshot({ path: `e2e/screenshots/room-confirm-${test.info().project.name}.png` })
  // The guard window keeps a brush from counting as the second tap.
  await page.waitForTimeout(600)
  expect(mockHa.sent().filter((m) => m.type === 'call_service')).toEqual([])
  await armed.click()
  await expect(card.getByRole('button', { name: /Garage opener/ })).toContainText('On')
})

async function openLivingRoom(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: /^Room: Auto/ }).click()
  await page.getByRole('radiogroup', { name: 'Room' }).getByText('Living Room').click()
  // The sheet's backdrop would swallow the drag while it fades out.
  await expect(page.getByRole('dialog')).toBeHidden()
  return page.getByRole('region', { name: 'Living Room' })
}

test('sets a dimmable light by dragging across its tile, sending once on release', async ({
  page,
  mockHa,
}) => {
  const card = await openLivingRoom(page)
  const lamp = card.getByRole('button', { name: /Lamp/ })
  await lamp.scrollIntoViewIfNeeded()
  const box = (await lamp.boundingBox())!
  const y = box.y + box.height / 2
  await page.mouse.move(box.x + box.width * 0.5, y)
  await page.mouse.down()
  for (const fraction of [0.6, 0.75, 0.9]) await page.mouse.move(box.x + box.width * fraction, y)
  await expect(lamp).toContainText('On, 90%')
  await page.screenshot({ path: `e2e/screenshots/room-drag-${test.info().project.name}.png` })
  expect(mockHa.sent().filter((m) => m.type === 'call_service')).toEqual([])
  await page.mouse.up()
  await expect(lamp).toContainText('On, 90%')
  await expect
    .poll(() => mockHa.getState('light.living_room_lamp')?.attributes.brightness)
    .toBe(Math.round(0.9 * 255))
  // The release is not also a tap: one call, the light stays on.
  expect(mockHa.sent().filter((m) => m.type === 'call_service')).toHaveLength(1)
})

test('sends nothing when a press over a light tile moves vertically', async ({ page, mockHa }) => {
  const card = await openLivingRoom(page)
  const lamp = card.getByRole('button', { name: /Lamp/ })
  await lamp.scrollIntoViewIfNeeded()
  const box = (await lamp.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + 10)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 4, box.y + 60)
  await page.mouse.move(box.x + box.width / 2 + 6, box.y + box.height + 40)
  // Let go away from the tile, as a scroll would end.
  await page.mouse.up()
  await expect(card.getByRole('slider', { name: 'Lamp brightness' })).toHaveAttribute(
    'aria-valuenow',
    '50',
  )
  expect(mockHa.sent().filter((m) => m.type === 'call_service')).toEqual([])
})

test('offers no brightness slider on a light that only turns on and off', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Room: Auto/ }).click()
  await page.getByRole('radiogroup', { name: 'Room' }).getByText('Kitchen').click()
  const card = page.getByRole('region', { name: 'Kitchen' })
  await expect(card.getByRole('button', { name: /Ceiling/ })).toBeVisible()
  await expect(card.getByRole('slider', { name: /brightness/ })).toHaveCount(0)
})

test('pauses and resumes a playing media player and turns a radio on from its chip', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Room: Auto/ }).click()
  await page.getByRole('radiogroup', { name: 'Room' }).getByText('Kitchen').click()
  const card = page.getByRole('region', { name: 'Kitchen' })
  await expect(page.getByRole('dialog')).toBeHidden()
  const row = card.getByRole('listitem', { name: 'Kitchen speaker' })
  await expect(row).toContainText('Blue Train')
  await expect(row).toContainText('John Coltrane')
  await page.screenshot({
    path: `e2e/screenshots/room-media-${test.info().project.name}.png`,
    fullPage: true,
  })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.screenshot({
    path: `e2e/screenshots/room-media-dark-${test.info().project.name}.png`,
    fullPage: true,
  })
  await row.getByRole('button', { name: 'Pause Kitchen speaker' }).click()
  await row.getByRole('button', { name: 'Play Kitchen speaker' }).click()
  await expect(row.getByRole('button', { name: 'Pause Kitchen speaker' })).toBeVisible()
  await card.getByRole('button', { name: 'Turn on Kitchen radio' }).click()
  await expect(card.getByRole('button', { name: 'Turn off Kitchen radio' })).toBeVisible()
})

test('sets a playing media player volume by dragging its slider', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /^Room: Auto/ }).click()
  await page.getByRole('radiogroup', { name: 'Room' }).getByText('Kitchen').click()
  await expect(page.getByRole('dialog')).toBeHidden()
  const row = page
    .getByRole('region', { name: 'Kitchen' })
    .getByRole('listitem', { name: 'Kitchen speaker' })
  const slider = row.getByRole('slider', { name: 'Kitchen speaker volume' })
  await expect(slider).toHaveAttribute('aria-valuenow', '40')
  const box = (await slider.boundingBox())!
  const y = box.y + box.height / 2
  await page.mouse.move(box.x + box.width * 0.4, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.8, y, { steps: 6 })
  await page.mouse.up()
  await expect(slider).toHaveAttribute('aria-valuenow', '80')
})

test("opens a color light's sheet and sets its color temperature and color", async ({
  page,
  mockHa,
}) => {
  const card = await openLivingRoom(page)
  await expect(card.getByRole('button', { name: 'More controls for Lamp' })).toHaveCount(0)
  const more = card.getByRole('button', { name: 'More controls for Strip' })
  await more.scrollIntoViewIfNeeded()
  await more.click()
  const sheet = page.getByRole('dialog', { name: 'Strip' })
  const temp = sheet.getByRole('slider', { name: 'Strip color temperature' })
  await expect(temp).toHaveAttribute('aria-valuemin', '2000')
  await expect(temp).toHaveAttribute('aria-valuemax', '6500')
  await expect(temp).toHaveAttribute('aria-valuenow', '3000')
  const scheme = test.info().project.name
  await page.screenshot({ path: `e2e/screenshots/light-sheet-${scheme}.png` })
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.screenshot({ path: `e2e/screenshots/light-sheet-dark-${scheme}.png` })

  const box = (await temp.boundingBox())!
  const y = box.y + box.height / 2
  await page.mouse.move(box.x + box.width * 0.2, y)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.8, y, { steps: 6 })
  await page.mouse.up()
  await expect
    .poll(() => mockHa.getState('light.living_room_strip')?.attributes.color_temp_kelvin)
    .toBeGreaterThan(5000)

  await sheet.getByRole('button', { name: 'Blue' }).click()
  await expect(sheet.getByRole('button', { name: 'Blue' })).toHaveAttribute('aria-pressed', 'true')
  expect(mockHa.getState('light.living_room_strip')?.attributes.hs_color).toEqual([240, 100])
})

// Read-only: loads the real registries and opens the picker. Choosing a room is local to
// the browser and sends nothing, but the test doesn't even do that. No area names asserted.
liveTest(
  'it loads the real registries and lists rooms under floor headings',
  { tag: '@live' },
  async ({ page, pageErrors }) => {
    await page.goto('/')
    const selector = page.getByRole('button', { name: /^Room:/ })
    await expect(selector).toBeVisible({ timeout: 15_000 })
    await selector.click()
    const group = page.getByRole('radiogroup', { name: 'Room' })
    await expect(group.getByRole('heading', { level: 3 }).first()).toBeVisible()
    // Auto is first; at least one room follows it.
    await expect(group.getByRole('radio')).not.toHaveCount(1)
    expect(pageErrors).toEqual([])
  },
)

test.describe('slider and sheet feel', () => {
  async function lampTile(page: Page) {
    const card = await openLivingRoom(page)
    const lamp = card.getByRole('button', { name: /Lamp/ })
    await lamp.scrollIntoViewIfNeeded()
    const box = (await lamp.boundingBox())!
    return {
      card,
      lamp,
      // The tile is the button's list item.
      tile: lamp.locator('xpath=..'),
      slider: card.getByRole('slider', { name: 'Lamp brightness' }),
      at: (fraction: number) => [box.x + box.width * fraction, box.y + box.height / 2] as const,
    }
  }

  test('the brightness fill keeps up with the finger while dragging', async ({ page }) => {
    const { slider, at } = await lampTile(page)
    await page.mouse.move(...at(0.5))
    await page.mouse.down()
    await page.mouse.move(...at(0.6))
    await page.mouse.move(...at(0.9))
    // Read at once: a fill easing after the finger would still be on its way.
    const share = await slider.evaluate((el) => {
      const fill = el.querySelector('.slider-fill')!.getBoundingClientRect().width
      return fill / el.getBoundingClientRect().width
    })
    expect(share).toBeCloseTo(0.9, 1)
    await page.mouse.up()
  })

  test('a light tile stretches with resistance past full and settles back on release', async ({
    page,
  }) => {
    const { tile, slider, at } = await lampTile(page)
    const resting = (await tile.boundingBox())!.width
    await page.mouse.move(...at(0.5))
    await page.mouse.down()
    for (const fraction of [0.8, 1.1, 1.5]) await page.mouse.move(...at(fraction))
    const stretched = (await tile.boundingBox())!.width
    await page.screenshot({ path: `e2e/screenshots/room-stretch-${test.info().project.name}.png` })
    expect(stretched).toBeGreaterThan(resting + 2)
    // Resistance: half a tile past the end stretches it only a little.
    expect(stretched).toBeLessThan(resting * 1.1)
    await expect(slider).toHaveAttribute('aria-valuenow', '100')
    await page.mouse.up()
    await expect
      .poll(async () => Math.round((await tile.boundingBox())!.width))
      .toBe(Math.round(resting))
  })

  test('a dimmable light tile looks pressed the moment a finger lands', async ({ page }) => {
    const { lamp, at } = await lampTile(page)
    await page.mouse.move(...at(0.5))
    const background = () =>
      lamp.evaluate((el) => el.ownerDocument.defaultView!.getComputedStyle(el).backgroundColor)
    const resting = await background()
    await page.mouse.down()
    expect(await background()).not.toBe(resting)
    await page.screenshot({ path: `e2e/screenshots/room-press-${test.info().project.name}.png` })
    await page.mouse.up()
  })

  test("draws a keyboard focus ring inside a light tile's brightness slider", async ({ page }) => {
    const { lamp, slider } = await lampTile(page)
    await lamp.focus()
    // The slider sits just before the tile's button.
    await page.keyboard.press('Shift+Tab')
    expect(await slider.evaluate((el) => el.matches(':focus-visible'))).toBe(true)
    expect(
      await slider.evaluate((el) =>
        parseFloat(el.ownerDocument.defaultView!.getComputedStyle(el).outlineOffset),
      ),
    ).toBeLessThan(0)
  })

  test('with reduced motion the room sheet fades in and out instead of sliding', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    // In place from the first frame (no slide), with an opacity animation running.
    const fadingInPlace = (sheet: Locator) =>
      sheet.evaluate((el) => {
        const view = el.ownerDocument.defaultView!
        const inPlace = new view.DOMMatrix(view.getComputedStyle(el).transform).f === 0
        return (
          inPlace &&
          el
            .getAnimations()
            .some((a: { effect: unknown }) =>
              (a.effect as unknown as { getKeyframes(): object[] })
                .getKeyframes()
                .some((k) => 'opacity' in k),
            )
        )
      })
    await page.getByRole('button', { name: /^Room: Auto/ }).click()
    const sheet = page.getByRole('dialog', { name: 'Room' })
    expect(await fadingInPlace(sheet)).toBe(true)
    await page.keyboard.press('Escape')
    expect(await fadingInPlace(sheet)).toBe(true)
    await expect(sheet).toBeHidden()
  })

  test('a room picker row looks pressed while a finger is on it', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /^Room: Auto/ }).click()
    const row = page.locator('.room-option', { hasText: 'Kitchen' })
    const background = () =>
      row.evaluate((el) => el.ownerDocument.defaultView!.getComputedStyle(el).backgroundColor)
    // Waits for the rising sheet to come to rest under the pointer.
    await row.hover()
    const resting = await background()
    await page.mouse.down()
    expect(await background()).not.toBe(resting)
    await page.mouse.up()
  })
})
