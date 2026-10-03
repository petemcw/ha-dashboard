import { useState, type FormEvent } from 'react'

type KioskTokenFormProps = { error?: string; onSubmit: (token: string) => void }

// Shown on a kiosk with no usable token. The value stays in this field only until
// submit: it's never rendered back, logged, or put into an error message.
export function KioskTokenForm({ error, onSubmit }: KioskTokenFormProps) {
  const [token, setToken] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = token.trim()
    if (!trimmed) return
    setToken('')
    onSubmit(trimmed)
  }

  return (
    <main className="kiosk-token">
      <form onSubmit={submit}>
        <h1>Set up this screen</h1>
        <label htmlFor="kiosk-token-input">Long-lived access token</label>
        <input
          id="kiosk-token-input"
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        {error && <p role="alert">{error}</p>}
        <button type="submit">Connect</button>
      </form>
    </main>
  )
}
