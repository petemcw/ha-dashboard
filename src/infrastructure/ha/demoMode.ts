let demo: boolean | undefined

// Decided once per page load from the URL and never stored, so the next load without
// ?demo is the real app again. Demo mode must not leave anything behind to carry it over.
export function isDemoMode(): boolean {
  demo ??= new URLSearchParams(location.search).has('demo')
  return demo
}
