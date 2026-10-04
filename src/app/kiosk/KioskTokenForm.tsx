import { useState, type FormEvent } from 'react'
import './KioskTokenForm.css'

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
      <form className="panel kiosk-token__form" onSubmit={submit}>
        <img src="/maple_frontier_logo.svg" alt="" width={56} height={56} />
        <h1>Set up this screen</h1>
        <label htmlFor="kiosk-token-input">Long-lived access token</label>
        <input
          id="kiosk-token-input"
          name="token"
          type="password"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'kiosk-token-error' : undefined}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        {error && (
          <p id="kiosk-token-error" role="alert" className="form-error">
            {error}
          </p>
        )}
        <button type="submit" className="button--primary">
          Connect
        </button>
      </form>
    </main>
  )
}
