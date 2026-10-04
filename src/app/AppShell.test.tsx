import { act, screen } from '@testing-library/react'
import { renderWithHome as render } from '../test/renderWithHome'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { entityStore } from '../infrastructure/entities/entityStore'
import { connectionStatus } from '../infrastructure/ha/connectionStatus'
import { LONG_LIVED_TOKEN_KEY, THEME_KEY, TOKENS_KEY } from '../infrastructure/storageKeys'
import { AppShell } from './AppShell'

afterEach(() => {
  entityStore.reset()
  connectionStatus.set({ kind: 'connecting' })
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

const home = () => screen.getByRole('main').parentElement!

describe('connection banner', () => {
  it('shows the reconnecting banner when the connection drops', () => {
    render(<AppShell />)
    act(() => connectionStatus.set({ kind: 'connected' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    act(() => connectionStatus.set({ kind: 'reconnecting' }))
    expect(screen.getByRole('status')).toHaveTextContent('Connection lost. Reconnecting…')
  })

  it('marks the home content stale while disconnected', () => {
    render(<AppShell />)
    act(() => connectionStatus.set({ kind: 'reconnecting' }))
    expect(home()).toHaveAttribute('data-stale')
  })

  it('hides the banner and clears stale marking after reconnecting', () => {
    render(<AppShell />)
    act(() => connectionStatus.set({ kind: 'reconnecting' }))
    act(() => connectionStatus.set({ kind: 'connected' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(home()).not.toHaveAttribute('data-stale')
  })
})

describe('settings sheet', () => {
  it('opens the settings sheet from the Settings button and closes it with Escape', async () => {
    const user = userEvent.setup()
    render(<AppShell />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('follows the system color scheme when the theme is set to System', async () => {
    const user = userEvent.setup()
    render(<AppShell />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('radio', { name: 'Light' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    await user.click(screen.getByRole('radio', { name: 'System' }))
    expect(document.documentElement).not.toHaveAttribute('data-theme')
    expect(localStorage.getItem(THEME_KEY)).toBeNull()
  })

  it('keeps a Dark theme override after a reload', async () => {
    const user = userEvent.setup()
    const first = render(<AppShell />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('radio', { name: 'Dark' }))
    first.unmount()
    document.documentElement.removeAttribute('data-theme')

    render(<AppShell />)
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked()
  })

  it('clears stored credentials when the user signs out', async () => {
    const user = userEvent.setup()
    localStorage.setItem(TOKENS_KEY, '{}')
    localStorage.setItem(LONG_LIVED_TOKEN_KEY, 'abc')
    render(<AppShell />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(localStorage.getItem(TOKENS_KEY)).toBeNull()
    expect(localStorage.getItem(LONG_LIVED_TOKEN_KEY)).toBeNull()
  })
})

describe('header theme toggle', () => {
  const stubDevice = (dark: boolean) =>
    vi.stubGlobal('matchMedia', () => ({
      matches: dark,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
  afterEach(() => vi.unstubAllGlobals())

  it('switches to dark mode when the header toggle is tapped in light mode', async () => {
    const user = userEvent.setup()
    localStorage.setItem(THEME_KEY, 'light')
    render(<AppShell />)
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  })

  it('switches to light mode when the header toggle is tapped in dark mode', async () => {
    const user = userEvent.setup()
    localStorage.setItem(THEME_KEY, 'dark')
    render(<AppShell />)
    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('switches to the opposite of the device theme when the preference is system', async () => {
    const user = userEvent.setup()
    stubDevice(true)
    render(<AppShell />)
    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(document.documentElement).toHaveAttribute('data-theme', 'light')
  })

  it('names the toggle for the theme a tap will switch to', async () => {
    const user = userEvent.setup()
    render(<AppShell />)
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })

  it('shows the theme chosen in the header as selected in the settings sheet', async () => {
    const user = userEvent.setup()
    render(<AppShell />)
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked()
  })

  it('remembers the theme chosen in the header after a reload', async () => {
    const user = userEvent.setup()
    const first = render(<AppShell />)
    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    first.unmount()
    document.documentElement.removeAttribute('data-theme')
    render(<AppShell />)
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument()
  })
})
