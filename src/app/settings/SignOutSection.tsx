import { resetAuth } from '../../infrastructure/ha/connection'

export function SignOutSection() {
  return (
    <section className="sheet__section" aria-label="Account">
      <button type="button" onClick={resetAuth}>
        Sign out
      </button>
    </section>
  )
}
