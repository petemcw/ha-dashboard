import { act, createEvent, fireEvent, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { lightState } from '../../../domains/light/factories'
import { entityStore } from '../../../infrastructure/entities/entityStore'
import { resetConnectionStatus, setConnected } from '../../../test/connectionStatus'
import { createFakeServiceGateway } from '../../../test/fakeServiceGateway'
import { testHomeConfig } from '../../../config/testHomeConfig'
import { renderWithHome } from '../../../test/renderWithHome'
import { EntityTile } from './EntityTile'

const LAMP = 'light.lamp'
const TILE_WIDTH = 200

afterEach(() => {
  vi.restoreAllMocks()
  entityStore.reset()
  resetConnectionStatus()
})

function seedLamp(state: 'on' | 'off', attributes: Record<string, unknown> = {}) {
  act(() =>
    entityStore.setEntities({
      [LAMP]: lightState({
        entity_id: LAMP,
        state,
        attributes: {
          friendly_name: 'Lamp',
          supported_color_modes: ['brightness'],
          brightness: 128,
          ...attributes,
        },
      }),
    }),
  )
}

function renderLamp(options: Parameters<typeof renderWithHome>[1] = {}) {
  const fake = createFakeServiceGateway()
  setConnected()
  renderWithHome(<EntityTile entityId={LAMP} variant="room" />, {
    gateway: fake.gateway,
    ...options,
  })
  return fake
}

// A pointer gesture over the tile's button. jsdom has no layout, so the tile is given a
// width; a finger starting at `from` moves through `path` ([x, y] points) and lets go.
function drag(from: [number, number], path: [number, number][], { release = true } = {}) {
  const button = screen.getByRole('button', { name: /Lamp/ })
  button.setPointerCapture = vi.fn()
  vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    right: TILE_WIDTH,
    width: TILE_WIDTH,
    top: 0,
    bottom: 74,
    height: 74,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
  const pointer = (type: 'pointerDown' | 'pointerMove' | 'pointerUp', [x, y]: [number, number]) =>
    fireEvent(
      button,
      createEvent[type](button, { pointerId: 1, isPrimary: true, clientX: x, clientY: y }),
    )
  pointer('pointerDown', from)
  for (const point of path) pointer('pointerMove', point)
  if (release) pointer('pointerUp', path[path.length - 1] ?? from)
  return button
}

describe('light brightness drag', () => {
  it('sends one light.turn_on with brightness_pct when a drag is released', () => {
    seedLamp('on', { brightness: 128 })
    const { calls } = renderLamp()

    // 50% to 80%: 60 px of a 200 px tile is 30 points.
    drag(
      [100, 30],
      [
        [120, 30],
        [140, 30],
        [160, 30],
      ],
    )

    expect(calls).toEqual([
      {
        domain: 'light',
        service: 'turn_on',
        data: { brightness_pct: 80 },
        target: { entity_id: LAMP },
      },
    ])
  })

  it('shows the dragged brightness on the tile while dragging', () => {
    seedLamp('on', { brightness: 128 })
    const { calls } = renderLamp()

    drag([100, 30], [[160, 30]], { release: false })

    expect(screen.getByRole('button', { name: /Lamp/ })).toHaveAccessibleDescription('On, 80%')
    expect(screen.getByRole('slider', { name: 'Lamp brightness' })).toHaveAttribute(
      'aria-valuenow',
      '80',
    )
    expect(calls).toEqual([])
  })

  it('turns the light off when dragged to zero', () => {
    seedLamp('on', { brightness: 128 })
    const { calls } = renderLamp()

    drag([100, 30], [[-20, 30]])

    expect(calls).toEqual([
      { domain: 'light', service: 'turn_off', data: undefined, target: { entity_id: LAMP } },
    ])
  })

  it('scrolls the page and sends nothing on a vertical swipe over a light tile', () => {
    seedLamp('on')
    const { calls } = renderLamp()

    const button = drag([100, 10], [[104, 40]], { release: false })
    // The browser takes a vertical gesture for scrolling and cancels the pointer.
    fireEvent(button, createEvent.pointerCancel(button, { pointerId: 1, isPrimary: true }))

    expect(calls).toEqual([])
    expect(screen.getByRole('slider', { name: 'Lamp brightness' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    )
  })

  it('sends nothing when a drag is cancelled', () => {
    seedLamp('on')
    const { calls } = renderLamp()

    const button = drag([100, 30], [[170, 30]], { release: false })
    fireEvent(button, createEvent.pointerCancel(button, { pointerId: 1, isPrimary: true }))

    expect(calls).toEqual([])
    expect(screen.getByRole('slider', { name: 'Lamp brightness' })).toHaveAttribute(
      'aria-valuenow',
      '50',
    )
  })

  it('changes brightness with arrow keys as a slider', () => {
    vi.useFakeTimers()
    seedLamp('on', { brightness: 128 })
    const { calls } = renderLamp()
    const slider = screen.getByRole('slider', { name: 'Lamp brightness' })
    expect(slider).toHaveAttribute('aria-valuenow', '50')
    expect(slider).toHaveAttribute('aria-valuetext', '50%')

    // A held key repeats keydown; only the release sends.
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(slider).toHaveAttribute('aria-valuetext', '70%')
    expect(calls).toEqual([])
    fireEvent.keyUp(slider, { key: 'ArrowRight' })
    act(() => void vi.advanceTimersByTime(500))
    expect(calls).toEqual([
      {
        domain: 'light',
        service: 'turn_on',
        data: { brightness_pct: 70 },
        target: { entity_id: LAMP },
      },
    ])
    vi.useRealTimers()
  })

  it('goes to 1 percent on Home and 100 percent on End', async () => {
    vi.useFakeTimers()
    seedLamp('on', { brightness: 128 })
    const { calls, resolve } = renderLamp()
    const slider = screen.getByRole('slider', { name: 'Lamp brightness' })

    fireEvent.keyDown(slider, { key: 'Home' })
    fireEvent.keyUp(slider, { key: 'Home' })
    act(() => void vi.advanceTimersByTime(500))
    expect(calls[0].data).toEqual({ brightness_pct: 1 })
    await act(async () => resolve())

    fireEvent.keyDown(slider, { key: 'End' })
    fireEvent.keyUp(slider, { key: 'End' })
    act(() => void vi.advanceTimersByTime(500))
    expect(calls[1].data).toEqual({ brightness_pct: 100 })
    vi.useRealTimers()
  })

  it('offers no drag on a light that only turns on and off', () => {
    seedLamp('on', { supported_color_modes: ['onoff'], brightness: undefined })
    renderLamp()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('offers no drag on a light in a favorite tile', () => {
    seedLamp('on')
    const fake = createFakeServiceGateway()
    setConnected()
    renderWithHome(<EntityTile entityId={LAMP} />, { gateway: fake.gateway })
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('still toggles the light on a tap', () => {
    seedLamp('on')
    const { calls } = renderLamp()

    const button = drag([100, 30], [[103, 30]])
    fireEvent.click(button)

    expect(calls).toEqual([
      { domain: 'light', service: 'turn_off', data: undefined, target: { entity_id: LAMP } },
    ])
  })

  it("doesn't toggle the light when a drag ends", () => {
    seedLamp('on')
    const { calls } = renderLamp()

    // The browser fires a click on the button right after the drag's pointerup, before the
    // tile has re-rendered as pending; one act() batch reproduces that.
    act(() => {
      const button = drag([100, 30], [[160, 30]])
      fireEvent.click(button)
    })

    expect(calls.map((c) => c.service)).toEqual(['turn_on'])
  })

  it('keeps showing the released brightness while the send is pending', async () => {
    seedLamp('on', { brightness: 128 })
    const { resolve } = renderLamp()
    const slider = screen.getByRole('slider', { name: 'Lamp brightness' })

    drag([100, 30], [[160, 30]])
    expect(slider).toHaveAttribute('aria-valuenow', '80')

    // HA has not reported yet; the send settles, and the tile goes back to what HA says.
    await act(async () => resolve())
    expect(slider).toHaveAttribute('aria-valuenow', '50')
  })

  it('offers no drag on a confirm-listed light', () => {
    seedLamp('on')
    renderLamp({ config: { ...testHomeConfig, confirm: [LAMP] } })
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })

  it('disables the drag while HA is disconnected', () => {
    seedLamp('on')
    const fake = createFakeServiceGateway()
    renderWithHome(<EntityTile entityId={LAMP} variant="room" />, { gateway: fake.gateway })
    drag([100, 30], [[160, 30]])
    expect(fake.calls).toEqual([])
    expect(screen.getByRole('slider')).toHaveAttribute('aria-disabled', 'true')
  })
})
