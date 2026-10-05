import { describe, expect, it } from 'vitest'

// Every non-test module under src/, as source text.
const sources = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/**/*.test.{ts,tsx}'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const offendersFor = (pattern: RegExp) =>
  Object.entries(sources)
    .filter(([, text]) => pattern.test(text))
    .map(([path]) => path)

describe('icon imports', () => {
  it('finds no source file that imports lucide-react', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(20)
    expect(offendersFor(/from\s*['"]lucide-react(?:\/[^'"]*)?['"]/)).toEqual([])
  })

  it('finds no source file that imports @mdi/js other than by name', () => {
    // A namespace or default import, or a subpath, would pull in all ~7000 icons.
    expect(offendersFor(/import\s+(?:\*\s+as\s+\w+|\w+)\s*(?:,[^;]*)?from\s*['"]@mdi\/js/)).toEqual(
      [],
    )
    expect(offendersFor(/from\s*['"]@mdi\/js\/[^'"]+['"]/)).toEqual([])
    expect(offendersFor(/import\(\s*['"]@mdi\/js/)).toEqual([])
  })
})
