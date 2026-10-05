import { act, createEvent, fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { testHomeConfig } from '../../config/testHomeConfig'
import { lightState } from '../../domains/light/factories'
import { entityStore } from '../../infrastructure/entities/entityStore'
import { resetConnectionStatus, setConnected } from '../../test/connectionStatus'
import { createFakeServiceGateway } from '../../test/fakeServiceGateway'
import { ServiceCallError } from '../../infrastructure/serviceGateway/serviceGateway'
import { renderWithHome } from '../../test/renderWithHome'
import { EntityTile } from '../shared/tiles/EntityTile'
import { RoomTile } from './RoomTile'

const LAMP = 'light.lamp'

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
        attributes: { friendly_name: 'Lamp', brightness: 128, ...attributes },
      }),
    }),
  )
}

function renderLamp(options: Parameters<typeof renderWithHome>[1] = {}) {
  const fake = createFakeServiceGateway()
  setConnected()
  renderWithHome(<RoomTile entityId={LAMP} />, {
    gateway: fake.gateway,
    ...options,
  })
  return fake
}

const moreControls = () => screen.queryByRole('button', { name: 'More controls for Lamp' })

describe('light detail sheet', () => {
  it('shows a more-controls button only on lights that support color temperature or color', () => {
    seedLamp('on', { supported_color_modes: ['brightness'] })
    const { unmount } = renderWithHome(<RoomTile entityId={LAMP} />)
    expect(moreControls()).not.toBeInTheDocument()
    unmount()

    seedLamp('on', { supported_color_modes: ['color_temp'] })
    const second = renderWithHome(<RoomTile entityId={LAMP} />)
    expect(moreControls()).toBeInTheDocument()
    second.unmount()

    seedLamp('on', { supported_color_modes: ['xy'] })
    renderWithHome(<RoomTile entityId={LAMP} />)
    expect(moreControls()).toBeInTheDocument()
  })

  it('shows no more-controls button on a favorites tile', () => {
    seedLamp('on', { supported_color_modes: ['color_temp'] })
    renderWithHome(<EntityTile entityId={LAMP} />)
    expect(moreControls()).not.toBeInTheDocument()
  })

  it('shows no more-controls button on a confirm-listed light', () => {
    seedLamp('on', { supported_color_modes: ['color_temp'] })
    renderLamp({ config: { ...testHomeConfig, confirm: [LAMP] } })
    expect(moreControls()).not.toBeInTheDocument()
  })

  it('opens a sheet named after the light from the more-controls button', async () => {
    seedLamp('on', { supported_color_modes: ['color_temp'] })
    renderLamp()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await userEvent.click(moreControls()!)

    expect(screen.getByRole('dialog', { name: 'Lamp' })).toBeInTheDocument()
  })
})

// A pointer gesture across the sheet's slider bar; jsdom has no layout, so the bar is
// given a width. A finger starting at `from` moves to `to` and lets go.
function dragSlider(slider: HTMLElement, from: number, to: number) {
  const track = slider.parentElement!
  track.setPointerCapture = vi.fn()
  vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    right: 200,
    width: 200,
    top: 0,
    bottom: 44,
    height: 44,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  })
  const pointer = (type: 'pointerDown' | 'pointerMove' | 'pointerUp', x: number) =>
    fireEvent(
      track,
      createEvent[type](track, { pointerId: 1, isPrimary: true, clientX: x, clientY: 10 }),
    )
  pointer('pointerDown', from)
  pointer('pointerMove', to)
  pointer('pointerUp', to)
}

describe('light detail sheet controls', () => {
  it("limits the color temperature slider to the light's Kelvin range and sends color_temp_kelvin on release", async () => {
    seedLamp('on', {
      supported_color_modes: ['color_temp'],
      color_mode: 'color_temp',
      color_temp_kelvin: 4250,
      min_color_temp_kelvin: 2000,
      max_color_temp_kelvin: 6500,
    })
    const { calls } = renderLamp()
    await userEvent.click(moreControls()!)

    const slider = screen.getByRole('slider', { name: 'Lamp color temperature' })
    expect(slider).toHaveAttribute('aria-valuemin', '2000')
    expect(slider).toHaveAttribute('aria-valuemax', '6500')
    expect(slider).toHaveAttribute('aria-valuenow', '4250')
    expect(slider).toHaveAttribute('aria-valuetext', '4250K')

    // 50% to 75% of a 200 px bar: 5375 K.
    dragSlider(slider, 100, 150)

    expect(calls).toEqual([
      {
        domain: 'light',
        service: 'turn_on',
        data: { color_temp_kelvin: 5375 },
        target: { entity_id: LAMP },
      },
    ])
  })

  it('shows color swatches only for color lights and sends hs_color on tap', async () => {
    seedLamp('on', { supported_color_modes: ['color_temp'] })
    const first = renderLamp()
    await userEvent.click(moreControls()!)
    expect(screen.queryByRole('button', { name: 'Blue' })).not.toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Lamp color temperature' })).toBeInTheDocument()
    expect(first.calls).toEqual([])
  })

  it('shows no color temperature slider on a light that only does color', async () => {
    seedLamp('on', { supported_color_modes: ['xy'] })
    renderLamp()
    await userEvent.click(moreControls()!)
    expect(screen.queryByRole('slider', { name: 'Lamp color temperature' })).not.toBeInTheDocument()
  })

  it('sends hs_color for the tapped swatch', async () => {
    seedLamp('on', { supported_color_modes: ['xy'], color_mode: 'xy', hs_color: [0, 100] })
    const { calls } = renderLamp()
    await userEvent.click(moreControls()!)

    const names = screen
      .getAllByRole('button', { pressed: false })
      .concat(screen.getAllByRole('button', { pressed: true }))
      .map((b) => b.getAttribute('aria-label') ?? b.textContent)
    for (const color of ['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Purple', 'Pink']) {
      expect(names).toContain(color)
    }

    await userEvent.click(screen.getByRole('button', { name: 'Blue' }))

    expect(calls).toEqual([
      {
        domain: 'light',
        service: 'turn_on',
        data: { hs_color: [240, 100] },
        target: { entity_id: LAMP },
      },
    ])
  })

  it("marks the swatch nearest the light's current color as pressed", async () => {
    seedLamp('on', { supported_color_modes: ['xy'], color_mode: 'xy', hs_color: [235, 90] })
    renderLamp()
    await userEvent.click(moreControls()!)

    expect(screen.getByRole('button', { name: 'Blue' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Red' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks no swatch as pressed while the light is off', async () => {
    seedLamp('off', { supported_color_modes: ['xy'] })
    renderLamp()
    await userEvent.click(moreControls()!)

    for (const swatch of screen.getAllByRole('button', { pressed: false })) {
      expect(swatch).not.toHaveAttribute('aria-pressed', 'true')
    }
    expect(screen.getByRole('button', { name: 'Blue' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows an inline failure when HA rejects a color change', async () => {
    seedLamp('on', { supported_color_modes: ['xy'], color_mode: 'xy', hs_color: [0, 100] })
    const { reject } = renderLamp()
    await userEvent.click(moreControls()!)

    await userEvent.click(screen.getByRole('button', { name: 'Blue' }))
    await act(async () => reject(new ServiceCallError('rejected')))

    const dialog = screen.getByRole('dialog', { name: 'Lamp' })
    expect(within(dialog).getByRole('status')).toHaveTextContent("Didn't work, tap to retry")
  })

  it('turns an off light on with the chosen color temperature', async () => {
    seedLamp('off', { supported_color_modes: ['color_temp'] })
    const { calls } = renderLamp()
    await userEvent.click(moreControls()!)

    const slider = screen.getByRole('slider', { name: 'Lamp color temperature' })
    expect(slider).not.toHaveAttribute('aria-disabled')
    // No value to show while off: mid-range, and the spoken value says why.
    expect(slider).toHaveAttribute('aria-valuenow', '4250')
    expect(slider).toHaveAttribute('aria-valuetext', 'Light is off')
    dragSlider(slider, 100, 150)

    expect(calls).toEqual([
      {
        domain: 'light',
        service: 'turn_on',
        data: { color_temp_kelvin: 5375 },
        target: { entity_id: LAMP },
      },
    ])
  })

  it('repeats the brightness slider and sends brightness_pct on release', async () => {
    seedLamp('on', { supported_color_modes: ['color_temp'], brightness: 128 })
    const { calls } = renderLamp()
    await userEvent.click(moreControls()!)

    const dialog = screen.getByRole('dialog', { name: 'Lamp' })
    const slider = within(dialog).getByRole('slider', { name: 'Lamp brightness' })
    expect(slider).toHaveAttribute('aria-valuenow', '50')
    dragSlider(slider, 100, 150)

    expect(calls).toEqual([
      {
        domain: 'light',
        service: 'turn_on',
        data: { brightness_pct: 75 },
        target: { entity_id: LAMP },
      },
    ])
  })

  it('disables the sheet controls while HA is disconnected', async () => {
    seedLamp('on', { supported_color_modes: ['xy', 'color_temp'] })
    const fake = createFakeServiceGateway()
    renderWithHome(<RoomTile entityId={LAMP} />, { gateway: fake.gateway })
    await userEvent.click(moreControls()!)

    expect(screen.getByRole('button', { name: 'Blue' })).toBeDisabled()
    expect(screen.getByRole('slider', { name: 'Lamp color temperature' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  it("reads the light's exact temperature, not one rounded to a whole percent of the range", async () => {
    seedLamp('on', {
      supported_color_modes: ['color_temp'],
      color_mode: 'color_temp',
      color_temp_kelvin: 3000,
      min_color_temp_kelvin: 2000,
      max_color_temp_kelvin: 6500,
    })
    renderLamp()
    await userEvent.click(moreControls()!)

    const slider = screen.getByRole('slider', { name: 'Lamp color temperature' })
    expect(slider).toHaveAttribute('aria-valuenow', '3000')
    expect(slider).toHaveAttribute('aria-valuetext', '3000K')
  })
})
