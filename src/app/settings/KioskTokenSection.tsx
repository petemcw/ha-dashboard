import { useState, type FormEvent } from 'react'
import { isKioskMode, saveKioskToken } from '../../infrastructure/ha/connection'

// Only on a device set up through the kiosk form; phones on OAuth never see it.
export function KioskTokenSection({ onSaved }: { onSaved: () => void }) {
  const [token, setToken] = useState('')
  if (!isKioskMode()) return null

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) return
    setToken('')
    saveKioskToken(trimmed)
    onSaved()
  }

  return (
    <section className="sheet__section" aria-label="Kiosk token">
      <h3>Kiosk token</h3>
      <form onSubmit={submit}>
        <label htmlFor="kiosk-token-replace">New long-lived access token</label>
        <input
          id="kiosk-token-replace"
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <button type="submit">Save token</button>
      </form>
    </section>
  )
}
